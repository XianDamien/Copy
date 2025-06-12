/**
 * AnGear Language Extension - FSRS Service
 * FSRS算法服务，负责卡片调度和复习管理
 */

import {
  FSRS,
  generatorParameters,
  Rating,
  State,
  type FSRSParameters,
  type Card as FSRSCard
} from 'ts-fsrs';
import { dbService } from './db';
import type { 
  Card, 
  AppRating, 
  FSRSConfig, 
  CardState,
  LearningProgress,
  StudySchedule,
  ReviewResult,
  UserSettings
} from '../shared/types';
import { DEFAULT_FSRS_CONFIG } from '../shared/types';
import { getSettings, addSettingsChangeListener, parseLearningSteps } from '../shared/utils/settingsService';

/**
 * FSRS算法服务类
 */
export class FSRSService {
  private fsrsInstance: FSRS;
  private config: FSRSConfig;
  private userSettings: UserSettings = {
    learningSteps: '1 10',
    relearningSteps: '10',
    dailyNewCardsLimit: 20,
    dailyReviewLimit: 200,
    enableTraditionalLearningSteps: false,
  };

  constructor() {
    this.config = { ...DEFAULT_FSRS_CONFIG };
    this.fsrsInstance = this.createFSRSInstance(this.config);
    
    // Initialize user settings and listen for changes
    this.initializeUserSettings();
  }

  /**
   * Initialize user settings and listen for changes
   */
  private async initializeUserSettings(): Promise<void> {
    try {
      this.userSettings = await getSettings();
      
      // Listen for settings changes
      addSettingsChangeListener((changes) => {
        this.userSettings = { ...this.userSettings, ...changes };
        console.log('FSRS service updated with new settings:', this.userSettings);
      });
    } catch (error) {
      console.error('Failed to initialize user settings:', error);
      // Use defaults if settings fail to load
    }
  }

  /**
   * 创建FSRS实例
   */
  private createFSRSInstance(config: FSRSConfig): FSRS {
    const params: FSRSParameters = generatorParameters({
      request_retention: config.requestRetention,
      maximum_interval: config.maximumInterval,
      enable_fuzz: true,
    });

    return new FSRS(params);
  }

  /**
   * 转换应用卡片数据为FSRS卡片格式
   */
  private convertToFSRSCard(card: Card): FSRSCard {
    return {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: card.elapsedDays,
      scheduled_days: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      state: this.convertToFSRSState(card.state),
      last_review: card.lastReview || undefined
    };
  }

  /**
   * 转换FSRS卡片数据为应用卡片格式
   */
  private convertToAppCard(fsrsCard: FSRSCard): Partial<Card> {
    return {
      due: fsrsCard.due,
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      elapsedDays: fsrsCard.elapsed_days,
      scheduledDays: fsrsCard.scheduled_days,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      state: this.convertFromFSRSState(fsrsCard.state),
      lastReview: fsrsCard.last_review
    };
  }

  /**
   * 转换应用状态为FSRS状态
   */
  private convertToFSRSState(state: CardState): State {
    switch (state) {
      case 'New': return State.New;
      case 'Learning': return State.Learning;
      case 'Review': return State.Review;
      case 'Relearning': return State.Relearning;
      default: return State.New;
    }
  }

  /**
   * 转换FSRS状态为应用状态
   */
  private convertFromFSRSState(state: State): CardState {
    switch (state) {
      case State.New: return 'New';
      case State.Learning: return 'Learning';
      case State.Review: return 'Review';
      case State.Relearning: return 'Relearning';
      default: return 'New';
    }
  }

  /**
   * 转换应用评分为FSRS评分
   */
  private mapRatingToFSRS(rating: AppRating): Rating {
    switch (rating) {
      case 'Again': return Rating.Again;
      case 'Hard': return Rating.Hard;
      case 'Good': return Rating.Good;
      case 'Easy': return Rating.Easy;
      default: return Rating.Good;
    }
  }

  /**
   * 执行卡片复习 - 支持任务驱动学习和传统学习步骤两种模式
   */
  async reviewCard(cardId: number, rating: AppRating): Promise<ReviewResult> {
    try {
      // 获取当前卡片和用户设置
      const card = await dbService.getCardById(cardId);
      if (!card) {
        throw new Error(`Card with id ${cardId} not found`);
      }

      const now = new Date();
      
      // 检查用户是否启用了传统学习步骤模式
      if (this.userSettings.enableTraditionalLearningSteps) {
        return await this.handleTraditionalLearningSteps(card, rating, now);
      } else {
        return await this.handleTaskDrivenLearning(card, rating, now);
      }
    } catch (error) {
      console.error('Error reviewing card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 处理任务驱动学习模式（默认模式）
   */
  private async handleTaskDrivenLearning(card: Card, rating: AppRating, now: Date): Promise<ReviewResult> {
    // 任务驱动模式逻辑
    if (card.state === 'New' || card.state === 'Relearning') {
      // 任务阶段：用户完成翻译/复述任务后，前端会调用此方法
      // 通常使用 'Good' 评级来表示任务完成
      if (rating === 'Good' || rating === 'Easy') {
        // 任务完成，立即毕业到复习阶段
        return await this.graduateCardToReview(card, rating, now);
      } else {
        // 任务失败或用户选择重试，保持在任务阶段
        const updatedCard = await dbService.updateCard(card.id, {
          due: now, // 立即可重试
          updatedAt: now,
        });

        await this.logReview(card, updatedCard, rating, now);
        
        return {
          success: true,
          nextReview: updatedCard.due,
          interval: 0,
        };
      }
    } else if (card.state === 'Review') {
      // 复习阶段：使用FSRS处理
      if (rating === 'Again') {
        // 复习失败，返回任务阶段重新学习
        const updatedCard = await dbService.updateCard(card.id, {
          state: 'Relearning',
          learningStep: 0, // 重置为任务待完成状态
          due: now, // 立即进入任务阶段
          lapses: card.lapses + 1,
          updatedAt: now,
        });

        await this.logReview(card, updatedCard, rating, now);
        
        return {
          success: true,
          nextReview: updatedCard.due,
          interval: 0,
        };
      } else {
        // 复习成功，使用FSRS计算下次间隔
        return await this.applyFSRSScheduling(card, rating, now);
      }
    } else {
      // Learning state in task-driven mode should not exist, treat as Review
      return await this.applyFSRSScheduling(card, rating, now);
    }
  }

  /**
   * 处理传统学习步骤模式（高级模式）
   */
  private async handleTraditionalLearningSteps(card: Card, rating: AppRating, now: Date): Promise<ReviewResult> {
    if (card.state === 'New' || card.state === 'Learning') {
      return await this.handleLearningSteps(card, rating, now, 'learningSteps');
    } else if (card.state === 'Relearning') {
      return await this.handleLearningSteps(card, rating, now, 'relearningSteps');
    } else if (card.state === 'Review') {
      if (rating === 'Again') {
        // 进入重学阶段
        const updatedCard = await dbService.updateCard(card.id, {
          state: 'Relearning',
          learningStep: 0,
          due: this.calculateStepDue(now, 0, 'relearningSteps'),
          lapses: card.lapses + 1,
          updatedAt: now,
        });

        await this.logReview(card, updatedCard, rating, now);
        
        return {
          success: true,
          nextReview: updatedCard.due,
          interval: 0,
        };
      } else {
        // 使用FSRS处理复习卡片
        return await this.applyFSRSScheduling(card, rating, now);
      }
    }

    // 默认情况
    return await this.applyFSRSScheduling(card, rating, now);
  }

  /**
   * 处理学习步骤逻辑
   */
  private async handleLearningSteps(card: Card, rating: AppRating, now: Date, stepsType: 'learningSteps' | 'relearningSteps'): Promise<ReviewResult> {
    const stepsString = stepsType === 'learningSteps' ? this.userSettings.learningSteps : this.userSettings.relearningSteps;
    const steps = parseLearningSteps(stepsString);
    
    if (rating === 'Again') {
      // 重新开始学习步骤
      const updatedCard = await dbService.updateCard(card.id, {
        learningStep: 0,
        due: this.calculateStepDue(now, 0, stepsType),
        updatedAt: now,
      });

      await this.logReview(card, updatedCard, rating, now);
      
      return {
        success: true,
        nextReview: updatedCard.due,
        interval: 0,
      };
    } else if (rating === 'Easy') {
      // 立即毕业
      return await this.graduateCardToReview(card, rating, now);
    } else if (rating === 'Good' || rating === 'Hard') {
      const currentStep = card.learningStep || 0;
      const nextStep = currentStep + 1;
      
      if (nextStep >= steps.length) {
        // 完成所有学习步骤，毕业
        return await this.graduateCardToReview(card, rating, now);
      } else {
        // 进入下一个学习步骤
        const updatedCard = await dbService.updateCard(card.id, {
          state: stepsType === 'learningSteps' ? 'Learning' : 'Relearning',
          learningStep: nextStep,
          due: this.calculateStepDue(now, nextStep, stepsType),
          updatedAt: now,
        });

        await this.logReview(card, updatedCard, rating, now);
        
        return {
          success: true,
          nextReview: updatedCard.due,
          interval: 0,
        };
      }
    }

    // 默认情况
    return await this.applyFSRSScheduling(card, rating, now);
  }

  /**
   * 计算学习步骤的到期时间
   */
  private calculateStepDue(now: Date, stepIndex: number, stepsType: 'learningSteps' | 'relearningSteps'): Date {
    const stepsString = stepsType === 'learningSteps' ? this.userSettings.learningSteps : this.userSettings.relearningSteps;
    const steps = parseLearningSteps(stepsString);
    
    if (stepIndex >= steps.length) {
      return now; // 如果步骤索引超出范围，立即到期
    }
    
    const intervalMinutes = steps[stepIndex];
    const due = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    return due;
  }

  /**
   * 将卡片毕业到复习阶段
   */
  private async graduateCardToReview(card: Card, rating: AppRating, now: Date): Promise<ReviewResult> {
    // 创建一个临时的FSRS卡片用于计算初始间隔
    const tempFSRSCard: FSRSCard = {
      due: now,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: card.lapses,
      state: State.New,
      last_review: undefined
    };

    // 使用FSRS计算毕业后的第一个间隔
    const fsrsRating = this.mapRatingToFSRS(rating);
    const schedulingCards = this.fsrsInstance.repeat(tempFSRSCard, now);
    const result = (schedulingCards as any)[fsrsRating];

    // 更新卡片为复习状态
    const cardUpdates = this.convertToAppCard(result.card);
    const updatedCard = await dbService.updateCard(card.id, {
      ...cardUpdates,
      state: 'Review',
      learningStep: 1, // 标记为已完成任务/学习步骤
      reps: card.reps + 1,
    });

    await this.logReview(card, updatedCard, rating, now);

    return {
      success: true,
      nextReview: updatedCard.due,
      interval: updatedCard.scheduledDays,
    };
  }

  /**
   * 应用FSRS调度算法
   */
  private async applyFSRSScheduling(card: Card, rating: AppRating, now: Date): Promise<ReviewResult> {
    const fsrsCard = this.convertToFSRSCard(card);
    const fsrsRating = this.mapRatingToFSRS(rating);

    // 执行FSRS调度
    const schedulingCards = this.fsrsInstance.repeat(fsrsCard, now);
    const result = (schedulingCards as any)[fsrsRating];

    // 更新卡片
    const cardUpdates = this.convertToAppCard(result.card);
    const updatedCard = await dbService.updateCard(card.id, {
      ...cardUpdates,
      reps: card.reps + 1,
    });

    await this.logReview(card, updatedCard, rating, now);

    return {
      success: true,
      nextReview: updatedCard.due,
      interval: updatedCard.scheduledDays,
    };
  }

  /**
   * 记录复习日志
   */
  private async logReview(originalCard: Card, updatedCard: Card, rating: AppRating, reviewTime: Date): Promise<void> {
    await dbService.addReviewLog({
      cardId: originalCard.id,
      reviewTime,
      rating: this.convertAppRatingToNumber(rating),
      stateBefore: originalCard.state,
      stateAfter: updatedCard.state,
      stabilityBefore: originalCard.stability,
      stabilityAfter: updatedCard.stability,
      difficultyBefore: originalCard.difficulty,
      difficultyAfter: updatedCard.difficulty,
      interval: updatedCard.scheduledDays,
      lastInterval: originalCard.scheduledDays,
    });
  }

  private convertAppRatingToNumber(rating: AppRating): 1 | 2 | 3 | 4 {
    switch (rating) {
      case 'Again': return 1;
      case 'Hard': return 2;
      case 'Good': return 3;
      case 'Easy': return 4;
      default: return 3;
    }
  }

  /**
   * 获取下次复习时间
   */
  async getNextReviewDate(card: Card, rating: AppRating): Promise<Date> {
    const fsrsCard = this.convertToFSRSCard(card);
    const fsrsRating = this.mapRatingToFSRS(rating);
    const schedulingCards = this.fsrsInstance.repeat(fsrsCard, new Date());
    return (schedulingCards as any)[fsrsRating].card.due;
  }

  /**
   * 预测记忆保持率
   */
  async predictRetention(card: Card): Promise<number> {
    const now = new Date();
    const daysSinceDue = (now.getTime() - card.due.getTime()) / (1000 * 60 * 60 * 24);
    
    // 使用简化的记忆保持率计算
    if (card.stability > 0) {
      return Math.exp(-daysSinceDue / card.stability);
    }
    return 0.9; // 默认值
  }

  /**
   * 计算学习进度
   */
  async calculateLearningProgress(cards: Card[]): Promise<LearningProgress> {
    const totalCards = cards.length;
    const newCards = cards.filter(card => card.state === 'New').length;
    const learningCards = cards.filter(card => card.state === 'Learning').length;
    const reviewCards = cards.filter(card => card.state === 'Review').length;
    
    // 计算平均记忆保持率
    let totalRetention = 0;
    let retentionCount = 0;
    
    for (const card of cards) {
      if (card.state === 'Review' && card.stability > 0) {
        const retention = await this.predictRetention(card);
        totalRetention += retention;
        retentionCount++;
      }
    }
    
    const averageRetention = retentionCount > 0 ? totalRetention / retentionCount : 0.9;
    
    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      averageRetention,
      studyStreak: 0, // 需要从用户数据计算
    };
  }

  /**
   * 推荐学习计划
   */
  async recommendStudySchedule(cards: Card[]): Promise<StudySchedule> {
    const now = new Date();
    const immediateReview = cards.filter(card => card.due <= now).length;
    
    // 计算明天到期的卡片
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTotal = cards.filter(card => 
      card.due > now && card.due <= tomorrow
    ).length;
    
    // 推荐每日学习量
    const recommendedDailyLimit = Math.max(20, Math.min(50, immediateReview + 10));
    
    return {
      immediateReview,
      todayTotal: immediateReview,
      tomorrowTotal,
      recommendedDailyLimit,
    };
  }

  /**
   * 更新FSRS配置
   */
  updateConfig(config: Partial<FSRSConfig>): void {
    // 验证配置
    if (config.requestRetention !== undefined) {
      if (config.requestRetention <= 0 || config.requestRetention > 1) {
        throw new Error('Request retention must be between 0 and 1');
      }
    }
    
    if (config.maximumInterval !== undefined) {
      if (config.maximumInterval < 0) {
        throw new Error('Maximum interval must be non-negative');
      }
    }
    
    if (config.easyBonus !== undefined) {
      if (config.easyBonus < 1) {
        throw new Error('Easy bonus must be >= 1');
      }
    }
    
    if (config.hardFactor !== undefined) {
      if (config.hardFactor <= 0) {
        throw new Error('Hard factor must be positive');
      }
    }
    
    // 更新配置
    this.config = { ...this.config, ...config };
    this.fsrsInstance = this.createFSRSInstance(this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): FSRSConfig {
    return { ...this.config };
  }
}

// 单例实例
export const fsrsService = new FSRSService(); 