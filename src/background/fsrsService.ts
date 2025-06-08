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
  ReviewResult
} from '../shared/types';
import { DEFAULT_FSRS_CONFIG } from '../shared/types';

/**
 * FSRS算法服务类
 */
export class FSRSService {
  private fsrsInstance: FSRS;
  private config: FSRSConfig;

  constructor() {
    this.config = { ...DEFAULT_FSRS_CONFIG };
    this.fsrsInstance = this.createFSRSInstance(this.config);
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
   * 执行卡片复习
   */
  async reviewCard(cardId: number, rating: AppRating): Promise<ReviewResult> {
    try {
      // 获取当前卡片
      const card = await dbService.getCardById(cardId);
      if (!card) {
        throw new Error(`Card with id ${cardId} not found`);
      }

      const now = new Date();
      const fsrsCard = this.convertToFSRSCard(card);
      const fsrsRating = this.mapRatingToFSRS(rating);

      // 执行FSRS调度
      const schedulingCards = this.fsrsInstance.repeat(fsrsCard, now);
      const result = (schedulingCards as any)[fsrsRating];

      // 更新卡片
      const cardUpdates = this.convertToAppCard(result.card);
      const updatedCard = await dbService.updateCard(cardId, cardUpdates);

      // 记录复习日志
      await dbService.addReviewLog({
        cardId,
        reviewTime: now,
        rating: this.convertAppRatingToNumber(rating),
        stateBefore: card.state,
        stateAfter: updatedCard.state,
        stabilityBefore: card.stability,
        stabilityAfter: updatedCard.stability,
        difficultyBefore: card.difficulty,
        difficultyAfter: updatedCard.difficulty,
        interval: updatedCard.scheduledDays,
        lastInterval: card.scheduledDays,
      });

      return {
        success: true,
        nextReview: updatedCard.due,
        interval: updatedCard.scheduledDays,
      };
    } catch (error) {
      console.error('Error reviewing card:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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