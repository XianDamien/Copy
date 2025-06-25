import { dbService } from './db';
import { FSRSService } from './fsrsService';
import { schedulerService } from './schedulerService';

import type { ChromeMessage, ApiResponse } from '../shared/types';

// 初始化服务实例
const fsrsService = new FSRSService();

/**
 * Service Worker主类
 * 负责后台服务的初始化和消息处理
 */
class BackgroundService {
  private initialized = false;

  /**
   * 获取初始化状态（用于外部检查）
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 初始化后台服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing AnGear Background Service...');
      
      // 初始化数据库
      await dbService.initDatabase();
      
      // 设置定时任务
      await this.setupAlarms();
      
      // 初始化默认配置
      await this.initializeDefaultConfig();
      
      this.initialized = true;
      console.log('AnGear Background Service initialized successfully');
      
      // 更新图标徽章
      await this.updateBadge();
      
    } catch (error) {
      console.error('Failed to initialize background service:', error);
      throw error;
    }
  }

  /**
   * 带重试机制的初始化方法
   */
  private async initializeWithRetry(maxRetries: number = 3): Promise<void> {
    if (this.initialized) return;

    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Initialization attempt ${attempt}/${maxRetries}`);
        await this.init();
        
        if (this.initialized) {
          console.log(`Initialization successful on attempt ${attempt}`);
          return;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Initialization attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // 等待递增的时间后重试
          const delay = attempt * 1000; // 1秒, 2秒, 3秒
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试都失败了
    const finalError = new Error(
      `Failed to initialize after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
    console.error('Critical initialization failure:', finalError.message);
    throw finalError;
  }

  /**
   * 设置定时任务
   */
  private async setupAlarms(): Promise<void> {
    // 清除现有的定时任务
    await chrome.alarms.clearAll();
    
    // 设置每日检查到期卡片的定时任务
    await chrome.alarms.create('daily-check', {
      delayInMinutes: 1, // 1分钟后首次执行
      periodInMinutes: 60 // 每小时检查一次
    });
    
    // 设置健康检查定时任务
    await chrome.alarms.create('health-check', {
      delayInMinutes: 5, // 5分钟后首次执行
      periodInMinutes: 30 // 每30分钟检查一次
    });
    
    console.log('Alarms set up successfully');
  }

  /**
   * 初始化默认配置
   */
  private async initializeDefaultConfig(): Promise<void> {
    // 简化配置初始化，使用默认FSRS配置
    console.log('Using default FSRS configuration');
  }

  /**
   * 更新扩展图标徽章
   */
  async updateBadge(): Promise<void> {
    try {
      const dueCards = await dbService.getDueCards();
      const dueCount = dueCards.length;
      
      if (dueCount > 0) {
        await chrome.action.setBadgeText({
          text: dueCount > 99 ? '99+' : dueCount.toString()
        });
        await chrome.action.setBadgeBackgroundColor({
          color: '#E53E3E' // 红色，表示有到期卡片
        });
      } else {
        await chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.error('Failed to update badge:', error);
    }
  }

  /**
   * 处理定时任务
   */
  async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    switch (alarm.name) {
      case 'daily-check':
        console.log('Running daily check...');
        await this.updateBadge();
        break;
      default:
        console.log(`Unknown alarm: ${alarm.name}`);
    }
  }

  /**
   * 处理来自其他脚本的消息
   */
  async handleMessage(
    message: ChromeMessage,
    _sender: chrome.runtime.MessageSender
  ): Promise<ApiResponse> {
    try {
      console.log(`Received message: ${message.type}`, message);
      
      // 确保服务已初始化 - 实现懒加载机制
      if (!this.initialized) {
        console.log('Service not initialized, attempting initialization...');
        await this.initializeWithRetry();
      }
      
      switch (message.type) {
        // ==================== 牌组操作 ====================
        case 'CREATE_DECK':
          const deck = await dbService.createDeck(message.payload);
          await this.updateBadge();
          return { success: true, data: deck };

        case 'GET_ALL_DECKS':
          const decks = await dbService.getAllDecks();
          return { success: true, data: decks };

        case 'GET_DECK_BY_ID':
          const deckById = await dbService.getDeckById(message.payload.id);
          return { success: true, data: deckById };

        case 'UPDATE_DECK':
          await dbService.updateDeck(message.payload.id, message.payload.updates);
          return { success: true };

        case 'DELETE_DECK':
          await dbService.deleteDeck(message.payload.id);
          await this.updateBadge();
          return { success: true };

        case 'GET_DECK_STATS':
          const deckStats = await dbService.getDeckStatistics(message.payload.deckId);
          return { success: true, data: deckStats };

        // ==================== 笔记操作 ====================
        case 'CREATE_NOTE':
          try {
            console.log('Creating note with payload:', message.payload);
            
            const note = await dbService.createNote(message.payload);
            
            // 根据笔记类型创建相应的卡片
            await dbService.createCardsForNote(note);
            
            await this.updateBadge();
            console.log('Note and cards created successfully:', note.id);
            return { success: true, data: note };
            
          } catch (error) {
            console.error('CREATE_NOTE operation failed:', error);
            
            // Enhanced error handling for constraint errors
            if (error instanceof Error) {
              if (error.message.includes('Duplicate key conflict')) {
                return { 
                  success: false, 
                  error: 'Note creation failed due to database conflict. Please try again or restart the extension.' 
                };
              }
              
              if (error.name === 'ConstraintError' || error.message.includes('Key already exists')) {
                return { 
                  success: false, 
                  error: 'Database constraint violation: A note with this identifier already exists. Please refresh the page and try again.' 
                };
              }
            }
            
            // Re-throw the original error for other error types
            throw error;
          }

        case 'GET_NOTES_BY_DECK':
          const notes = await dbService.getNotesByDeckId(message.payload.deckId);
          return { success: true, data: notes };

        case 'UPDATE_NOTE':
          await dbService.updateNote(message.payload.id, message.payload.updates);
          return { success: true };

        case 'DELETE_NOTE':
          await dbService.deleteNote(message.payload.id);
          await this.updateBadge();
          return { success: true };

        case 'GET_NOTE_BY_ID':
          const noteById = await dbService.getNoteById(message.payload.id);
          return { success: true, data: noteById };

        case 'BULK_CREATE_NOTES':
          try {
            console.log('Bulk creating notes:', message.payload);
            
            const { deckId, notes } = message.payload;
            
            // 为每个note添加deckId
            const notesWithDeckId = notes.map((note: any) => ({
              ...note,
              deckId
            }));
            
            const createdNotes = await dbService.bulkCreateNotes(notesWithDeckId);
            
            await this.updateBadge();
            console.log(`Bulk created ${createdNotes.length} notes successfully`);
            return { success: true, data: createdNotes };
            
          } catch (error) {
            console.error('BULK_CREATE_NOTES operation failed:', error);
            throw error;
          }

        // ==================== AI处理 ====================
        case 'AI_PROCESS_TEXT':
          try {
            const { geminiService } = await import('./geminiService');
            const { getSettings } = await import('../shared/utils/settingsService');
            
            // 获取用户设置中的API密钥
            const settings = await getSettings();
            if (!settings.geminiApiKey) {
              return {
                success: false,
                error: '请先在设置页面配置Gemini API密钥'
              };
            }
            
            const result = await geminiService.processTextForCards(
              message.payload.text,
              settings.geminiApiKey
            );
            return { success: true, data: result };
          } catch (error) {
            console.error('AI_PROCESS_TEXT操作失败:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'AI处理失败'
            };
          }

        case 'VERIFY_GEMINI_API_KEY':
          try {
            const { geminiService } = await import('./geminiService');
            const { apiKey } = message.payload;
            
            if (!apiKey || typeof apiKey !== 'string') {
              return {
                success: false,
                error: 'API密钥不能为空'
              };
            }
            
            const result = await geminiService.validateApiKey(apiKey);
            return { success: true, data: result };
          } catch (error) {
            console.error('VERIFY_GEMINI_API_KEY操作失败:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'API密钥验证失败'
            };
          }

        // ==================== 卡片操作 ====================
        case 'GET_DUE_CARDS':
          const dueCards = await dbService.getDueCards(
            message.payload?.deckId,
            message.payload?.limit
          );
          return { success: true, data: dueCards };

        case 'REVIEW_CARD':
          const reviewResult = await fsrsService.reviewCard(
            message.payload.cardId,
            message.payload.rating
          );
          await this.updateBadge();
          return { success: true, data: reviewResult };

        case 'GET_CARD_PREDICTIONS':
          const card = await dbService.getCardById(message.payload.cardId);
          if (!card) {
            return { success: false, error: 'Card not found' };
          }
          
          const predictions = {
            again: await fsrsService.getNextReviewDate(card, 'Again'),
            hard: await fsrsService.getNextReviewDate(card, 'Hard'),
            good: await fsrsService.getNextReviewDate(card, 'Good'),
            easy: await fsrsService.getNextReviewDate(card, 'Easy'),
          };
          return { success: true, data: predictions };

        case 'GET_CARDS_BY_DECK':
          const cardsByDeck = await dbService.getCardsByDeckId(message.payload.deckId);
          return { success: true, data: cardsByDeck };

        case 'RESET_CARD_PROGRESS':
          await dbService.resetCardProgress(message.payload.cardId);
          await this.updateBadge();
          return { success: true };

        // ==================== FSRS配置 ====================
        case 'GET_FSRS_CONFIG':
          const fsrsConfig = fsrsService.getConfig();
          return { success: true, data: fsrsConfig };

        case 'UPDATE_FSRS_CONFIG':
          fsrsService.updateConfig(message.payload);
          return { success: true };

        case 'GET_FSRS_STATS':
          const cards = await dbService.getCardsByDeckId(message.payload.deckId);
          const progress = await fsrsService.calculateLearningProgress(cards);
          return { success: true, data: progress };

        // ==================== 用户配置 ====================
        case 'GET_USER_CONFIG':
          // 简化用户配置，返回默认值
          return { success: true, data: { theme: 'auto', language: 'zh-CN' } };

        case 'SAVE_USER_CONFIG':
          // 简化用户配置保存
          return { success: true };

        // ==================== 数据库管理 ====================
        case 'GET_DATABASE_SIZE':
          // 简化数据库大小查询
          const allDecks = await dbService.getAllDecks();
          return { success: true, data: { decks: allDecks.length } };

        case 'VALIDATE_DATABASE_INTEGRITY':
          const validation = await dbService.validateDatabaseIntegrity();
          return { success: true, data: validation };

        case 'CLEAR_ALL_DATA':
          await dbService.clearAllData();
          await this.updateBadge();
          return { success: true };

        // ==================== 音频管理 ====================
        case 'STORE_AUDIO':
          // 音频存储功能暂未实现
          return { success: false, error: 'Audio storage not implemented yet' };

        case 'GET_AUDIO':
          // 音频获取功能暂未实现
          return { success: false, error: 'Audio retrieval not implemented yet' };

        case 'DELETE_AUDIO':
          // 音频删除功能暂未实现
          return { success: false, error: 'Audio deletion not implemented yet' };

        // ==================== 队列操作 ====================
        case 'BUILD_QUEUE':
          const queueCards = await schedulerService.buildQueue(
            message.payload?.deckId,
            message.payload?.limit
          );
          return { success: true, data: queueCards };

        case 'RESET_CARDS_IN_DECK':
          const resetCount = await schedulerService.resetCardsInDeck(message.payload.deckId);
          await this.updateBadge();
          return { success: true, data: resetCount };

        default:
          console.warn(`Unknown message type: ${message.type}`);
          return { success: false, error: `Unknown message type: ${message.type}` };
      }
    } catch (error) {
      console.error(`Error handling message ${message.type}:`, error);
      
      // 特殊处理初始化错误
      if (error instanceof Error && error.message.includes('Failed to initialize')) {
        return {
          success: false,
          error: '应用初始化失败，请尝试重新加载扩展。如果问题持续存在，请检查浏览器控制台获取详细错误信息。'
        };
      }
      
      // 特殊处理数据库未初始化错误
      if (error instanceof Error && error.message.includes('Database not initialized')) {
        return {
          success: false,
          error: '数据库连接失败，正在尝试重新连接...请稍后重试。'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 根据笔记类型获取卡片模板
   */
  getCardTemplatesForNoteType(noteType: string): string[] {
    switch (noteType) {
      case 'CtoE':
        return ['CtoE_ZhToEn'];
      case 'Retranslate':
        return ['Retranslate_Forward', 'Retranslate_Backward'];
      case 'SentenceParaphrase':
        return ['SentenceParaphrase_Listen', 'SentenceParaphrase_Speak'];
      case 'Article':
        return ['Article_Reading', 'Article_Questions'];
      default:
        return ['Basic'];
    }
  }
}

// 创建后台服务实例
const backgroundService = new BackgroundService();

// ==================== 事件监听器 ====================

// 扩展安装/启动时初始化
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension startup');
  try {
    await backgroundService.init();
  } catch (error) {
    console.error('Failed to initialize on startup:', error);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  try {
    await backgroundService.init();
  } catch (error) {
    console.error('Failed to initialize on install:', error);
  }
});

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理异步消息
  backgroundService.handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Message handling failed:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
  
  // 返回true表示异步响应
  return true;
});

// 定时任务处理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    await backgroundService.handleAlarm(alarm);
  } catch (error) {
    console.error('Alarm handling failed:', error);
  }
});

// 导出服务实例用于测试
export { backgroundService }; 