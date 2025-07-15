import type { ChromeMessage, ApiResponse, Note, Card } from '../types';

/**
 * API客户端类
 * 提供与background script通信的统一接口
 */
export class ApiClient {
  /**
   * 发送消息到background script（旧版本，抛出异常）
   */
  private async sendMessage<T = any>(type: string, payload?: any): Promise<T> {
    const response = await this.sendMessageRaw<T>(type, payload);
    
    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }
    
    return response.data as T;
  }

  /**
   * 发送消息到background script（新版本，返回完整响应）
   */
  private async sendMessageRaw<T = any>(type: string, payload?: any): Promise<ApiResponse<T>> {
    const message: ChromeMessage = {
      type,
      payload,
      source: this.getSource()
    };

    try {
      const response: ApiResponse<T> = await chrome.runtime.sendMessage(message);
      
      // 直接返回完整的响应，让调用方处理 success/error
      return response;
    } catch (error) {
      console.error(`API call failed: ${type}`, error);
      
      // 对于网络层面的错误，包装成标准的 ApiResponse 格式
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取当前脚本的来源
   */
  private getSource(): ChromeMessage['source'] {
    // 根据当前环境判断来源
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('popup')) {
        return 'popup';
      } else if (window.location.pathname.includes('options')) {
        return 'options';
      } else if (window.location.pathname.includes('main')) {
        return 'main';
      } else {
        return 'content';
      }
    }
    return 'background';
  }

  // ==================== 牌组操作 ====================

  /**
   * 创建牌组
   */
  async createDeck(deck: { name: string; description?: string }): Promise<any> {
    return this.sendMessage('CREATE_DECK', deck);
  }

  /**
   * 获取所有牌组
   */
  async getAllDecks(): Promise<any[]> {
    return this.sendMessage('GET_ALL_DECKS');
  }

  /**
   * 根据ID获取牌组
   */
  async getDeckById(id: number): Promise<any> {
    return this.sendMessage('GET_DECK_BY_ID', { id });
  }

  /**
   * 更新牌组
   */
  async updateDeck(id: number, updates: any): Promise<void> {
    return this.sendMessage('UPDATE_DECK', { id, updates });
  }

  /**
   * 删除牌组
   */
  async deleteDeck(id: number): Promise<void> {
    return this.sendMessage('DELETE_DECK', { id });
  }

  /**
   * 获取牌组统计信息
   */
  async getDeckStats(deckId: number): Promise<any> {
    return this.sendMessage('GET_DECK_STATS', { deckId });
  }

  /**
   * 获取牌组统计信息 (别名方法，保持前端兼容性)
   */
  async getDeckStatistics(deckId: number): Promise<any> {
    return this.getDeckStats(deckId);
  }

  // ==================== 笔记操作 ====================

  /**
   * 创建笔记
   */
  async createNote(note: any): Promise<any> {
    return this.sendMessage('CREATE_NOTE', note);
  }

  /**
   * 根据牌组ID获取笔记
   */
  async getNotesByDeck(deckId: number): Promise<any[]> {
    return this.sendMessage('GET_NOTES_BY_DECK', { deckId });
  }

  /**
   * 更新笔记
   */
  async updateNote(id: number, updates: any): Promise<void> {
    return this.sendMessage('UPDATE_NOTE', { id, updates });
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: number): Promise<void> {
    return this.sendMessage('DELETE_NOTE', { id });
  }

  /**
   * 根据ID获取笔记
   */
  async getNoteById(id: number): Promise<any> {
    return this.sendMessage('GET_NOTE_BY_ID', { id });
  }

  /**
   * 批量创建笔记
   */
  async bulkCreateNotes(deckId: number, notes: Omit<Note, 'id' | 'deckId'>[]): Promise<Note[]> {
    const response = await this.sendMessage('BULK_CREATE_NOTES', { deckId, notes });
    return response as Note[];
  }

  // ==================== AI处理 ====================

  /**
   * 使用AI处理文本生成卡片
   */
  async aiProcessText(text: string): Promise<Array<{front: string, back: string}>> {
    return this.sendMessage('AI_PROCESS_TEXT', { text });
  }

  /**
   * 验证Gemini API密钥
   */
  async verifyGeminiApiKey(apiKey: string): Promise<ApiResponse<{ valid: boolean; error?: string }>> {
    return this.sendMessageRaw('VERIFY_GEMINI_API_KEY', { apiKey });
  }

  // ==================== 卡片操作 ====================

  /**
   * 获取到期卡片
   */
  async getDueCards(deckId?: number, limit?: number): Promise<any[]> {
    return this.sendMessage('GET_DUE_CARDS', { deckId, limit });
  }

  /**
   * 复习卡片
   */
  async reviewCard(cardId: number, rating: number, reviewTime?: Date): Promise<any> {
    return this.sendMessage('REVIEW_CARD', { cardId, rating, reviewTime });
  }

  /**
   * 获取复习时间预测
   */
  async getReviewPredictions(cardId: number): Promise<{
    again: Date;
    hard: Date;
    good: Date;
    easy: Date;
  }> {
    return this.sendMessage('GET_CARD_PREDICTIONS', { cardId });
  }

  /**
   * 根据牌组ID获取卡片
   */
  async getCardsByDeckId(deckId: number): Promise<any[]> {
    return this.sendMessage('GET_CARDS_BY_DECK', { deckId });
  }

  /**
   * 重置卡片复习进度
   */
  async resetCardProgress(cardId: number): Promise<void> {
    return this.sendMessage('RESET_CARD_PROGRESS', { cardId });
  }

  /**
   * 构建复习队列 (Phase 2.2 Scheduler Service)
   */
  async buildQueue(deckId: number | null, limit?: number): Promise<any[]> {
    return this.sendMessage('BUILD_QUEUE', { deckId, limit });
  }

  /**
   * 重置牌组中的所有卡片进度 (Phase 2.2 Bulk Reset)
   */
  async resetCardsInDeck(deckId: number | null): Promise<number> {
    return this.sendMessage('RESET_CARDS_IN_DECK', { deckId });
  }

  /**
   * 更新卡片
   */
  async updateCard(card: Card): Promise<Card> {
    const response = await this.sendMessage('UPDATE_CARD', { card });
    return response;
  }

  // ==================== FSRS配置 ====================

  /**
   * 获取FSRS配置
   */
  async getFSRSConfig(): Promise<any> {
    return this.sendMessage('GET_FSRS_CONFIG');
  }

  /**
   * 更新FSRS配置
   */
  async updateFSRSConfig(config: any): Promise<void> {
    return this.sendMessage('UPDATE_FSRS_CONFIG', config);
  }

  // ==================== 统计数据 ====================

  /**
   * 获取牌组FSRS统计
   */
  async getDeckFSRSStats(deckId: number): Promise<any> {
    return this.sendMessage('GET_DECK_FSRS_STATS', { deckId });
  }

  /**
   * 分析卡片表现
   */
  async analyzeCardPerformance(cardId: number): Promise<any> {
    return this.sendMessage('ANALYZE_CARD_PERFORMANCE', { cardId });
  }

  // ==================== 用户配置 ====================

  /**
   * 获取用户配置
   */
  async getUserConfig(): Promise<any> {
    return this.sendMessage('GET_USER_CONFIG');
  }

  /**
   * 保存用户配置
   */
  async saveUserConfig(config: any): Promise<void> {
    return this.sendMessage('SAVE_USER_CONFIG', config);
  }

  // ==================== 数据管理 ====================

  /**
   * 获取数据库大小信息
   */
  async getDatabaseSize(): Promise<{ [key: string]: number }> {
    return this.sendMessage('GET_DATABASE_SIZE');
  }

  /**
   * 验证数据库完整性
   */
  async validateDatabaseIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    orphanedRecords: number;
  }> {
    return this.sendMessage('VALIDATE_DATABASE_INTEGRITY');
  }

  /**
   * 清空所有数据
   */
  async clearAllData(): Promise<void> {
    return this.sendMessage('CLEAR_ALL_DATA');
  }

  // ==================== 音频存储 ====================

  /**
   * 存储音频
   */
  async storeAudio(audio: any): Promise<void> {
    return this.sendMessage('STORE_AUDIO', audio);
  }

  /**
   * 获取音频
   */
  async getAudio(id: string): Promise<any> {
    return this.sendMessage('GET_AUDIO', { id });
  }

  /**
   * 获取音频片段 (用于音频播放)
   */
  async getAudioClip(id: string): Promise<any> {
    return this.sendMessage('GET_AUDIO_CLIP', { id });
  }

  /**
   * 删除音频
   */
  async deleteAudio(id: string): Promise<void> {
    return this.sendMessage('DELETE_AUDIO', { id });
  }
}

// 创建单例实例
export const apiClient = new ApiClient();

// 导出便捷方法
export const {
  // 牌组操作
  createDeck,
  getAllDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  getDeckStats,
  
  // 笔记操作
  createNote,
  getNotesByDeck,
  updateNote,
  deleteNote,
  
  // 卡片操作
  getDueCards,
  reviewCard,
  getReviewPredictions,
  updateCard,
  
  // FSRS配置
  getFSRSConfig,
  updateFSRSConfig,
  
  // 统计数据
  getDeckFSRSStats,
  analyzeCardPerformance,
  
  // 用户配置
  getUserConfig,
  saveUserConfig,
  
  // 数据管理
  getDatabaseSize,
  clearAllData,
  
  // 音频存储
  storeAudio,
  getAudio,
  deleteAudio
} = apiClient; 