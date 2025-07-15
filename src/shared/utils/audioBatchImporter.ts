import { type AudioSegment } from './audioSlicer';
import { DatabaseService } from '../../background/db';
import { type Card, type Note } from '../types';

export interface AudioCardImportResult {
  success: boolean;
  createdCards?: Card[];
  createdNotes?: Note[];
  error?: string;
  totalCards?: number;
  totalNotes?: number;
}

export interface AudioCardBatchData {
  deckId: number;
  audioSegments: AudioSegment[];
  sourceFileName: string;
}

export class AudioBatchImporter {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  /**
   * 批量导入音频+字幕生成的卡片
   */
  async importAudioCards(
    batchData: AudioCardBatchData,
    onProgress?: (progress: number) => void
  ): Promise<AudioCardImportResult> {
    try {
      await this.dbService.initDatabase();

      const { deckId, audioSegments, sourceFileName } = batchData;

      if (!audioSegments || audioSegments.length === 0) {
        return {
          success: false,
          error: '没有音频片段需要导入'
        };
      }

      // 验证牌组存在
      const deck = await this.dbService.getDeckById(deckId);
      if (!deck) {
        return {
          success: false,
          error: `牌组 ID ${deckId} 不存在`
        };
      }

      const createdNotes: Note[] = [];
      const createdCards: Card[] = [];
      const totalSegments = audioSegments.length;
      let completedSegments = 0;

      // 逐个处理音频片段
      for (const segment of audioSegments) {
        try {
          const result = await this.processAudioSegment(segment, deckId, sourceFileName);
          if (result.note) {
            createdNotes.push(result.note);
          }
          if (result.cards && result.cards.length > 0) {
            createdCards.push(...result.cards);
          }
        } catch (error) {
          console.error(`处理音频片段失败 (ID: ${segment.id}):`, error);
          // 继续处理其他片段，不因单个失败而终止
        }

        completedSegments++;
        if (onProgress) {
          const progress = Math.round((completedSegments / totalSegments) * 100);
          onProgress(progress);
        }
      }

      return {
        success: true,
        createdCards,
        createdNotes,
        totalCards: createdCards.length,
        totalNotes: createdNotes.length
      };

    } catch (error: any) {
      console.error('批量导入音频卡片失败:', error);
      return {
        success: false,
        error: `批量导入失败: ${error.message || '未知错误'}`
      };
    }
  }

  /**
   * 处理单个音频片段
   */
  private async processAudioSegment(
    segment: AudioSegment,
    deckId: number,
    sourceFileName: string
  ): Promise<{ note?: Note; cards?: Card[] }> {
    try {
      // 1. 存储音频片段到AudioStore
      const audioId = await this.dbService.addAudioClip(
        segment.audioBlob,
        'audio/wav',
        segment.duration
      );

      // 2. 创建Note
      const note = await this.dbService.createNote({
        deckId,
        noteType: 'audio_subtitle',
        fields: {
          audio_subtitle: {
            originalText: segment.originalText,
            translatedText: segment.translatedText,
            audioId,
            startTime: segment.startTime,
            endTime: segment.endTime,
            duration: segment.duration,
            sourceFile: sourceFileName
          }
        },
        tags: this.generateTags(sourceFileName, segment)
      });

      // 3. 创建Cards（生成多个卡片类型）
      const cards = await this.createCardsForAudioSegment(note, segment, audioId);

      return { note, cards };

    } catch (error) {
      console.error(`处理音频片段失败:`, error);
      throw error;
    }
  }

  /**
   * 为音频片段创建多种类型的卡片
   */
  private async createCardsForAudioSegment(
    note: Note,
    segment: AudioSegment,
    audioId: string
  ): Promise<Card[]> {
    const now = new Date();
    const cards: Omit<Card, 'id'>[] = [];

    // 1. 英文->中文翻译卡片
    cards.push({
      noteId: note.id!,
      deckId: note.deckId,
      cardType: 'forward',
      audioId: audioId,
      state: 'New',
      due: now,
      stability: 2.5,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      learningStep: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 2. 中文->英文翻译卡片（可选）
    if (segment.translatedText.trim() !== segment.originalText.trim()) {
      cards.push({
        noteId: note.id!,
        deckId: note.deckId,
        cardType: 'reverse',
        audioId: audioId,
        state: 'New',
        due: now,
        stability: 2.5,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        learningStep: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. 音频理解卡片（听音频填空或理解）
    cards.push({
      noteId: note.id!,
      deckId: note.deckId,
      cardType: 'audio_comprehension',
      audioId: audioId,
      state: 'New',
      due: now,
      stability: 2.5,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      learningStep: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 使用现有的createCardsForNote方法
    const createdCards = await this.dbService.createCardsForNote(note);

    return createdCards;
  }



  /**
   * 生成标签
   */
  private generateTags(sourceFileName: string, segment: AudioSegment): string[] {
    const tags = ['audio', 'subtitle'];
    
    // 添加文件名标签
    const fileTag = sourceFileName.replace(/\.[^/.]+$/, ""); // 移除扩展名
    tags.push(fileTag);

    // 添加时长标签
    const durationSeconds = Math.round(segment.duration / 1000);
    if (durationSeconds <= 3) {
      tags.push('short');
    } else if (durationSeconds <= 10) {
      tags.push('medium');
    } else {
      tags.push('long');
    }

    // 添加语言相关标签
    if (this.hasEnglish(segment.originalText)) {
      tags.push('english');
    }
    if (this.hasChinese(segment.translatedText)) {
      tags.push('chinese');
    }

    return tags;
  }

  /**
   * 检测是否包含英文
   */
  private hasEnglish(text: string): boolean {
    return /[a-zA-Z]/.test(text);
  }

  /**
   * 检测是否包含中文
   */
  private hasChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }



  /**
   * 验证导入数据
   */
  async validateImportData(batchData: AudioCardBatchData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 检查牌组存在性
    try {
      await this.dbService.initDatabase();
      const deck = await this.dbService.getDeckById(batchData.deckId);
      if (!deck) {
        errors.push(`牌组 ID ${batchData.deckId} 不存在`);
      }
    } catch (error) {
      errors.push('数据库连接失败');
    }

    // 检查音频片段
    if (!batchData.audioSegments || batchData.audioSegments.length === 0) {
      errors.push('没有音频片段');
    } else {
      batchData.audioSegments.forEach((segment, index) => {
        if (!segment.audioBlob) {
          errors.push(`音频片段 ${index + 1} 缺少音频数据`);
        }
        if (!segment.originalText.trim()) {
          errors.push(`音频片段 ${index + 1} 缺少原文`);
        }
        if (!segment.translatedText.trim()) {
          errors.push(`音频片段 ${index + 1} 缺少译文`);
        }
        if (segment.startTime >= segment.endTime) {
          errors.push(`音频片段 ${index + 1} 时间戳无效`);
        }
      });
    }

    // 检查文件名
    if (!batchData.sourceFileName.trim()) {
      errors.push('缺少源文件名');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取导入预览统计
   */
  getImportPreview(audioSegments: AudioSegment[]): {
    totalSegments: number;
    estimatedCards: number;
    estimatedNotes: number;
    totalDuration: number;
    averageDuration: number;
  } {
    const totalSegments = audioSegments.length;
    const estimatedNotes = totalSegments;
    const estimatedCards = totalSegments * 3; // 每个片段生成3种卡片
    const totalDuration = audioSegments.reduce((sum, segment) => sum + segment.duration, 0);
    const averageDuration = totalSegments > 0 ? totalDuration / totalSegments : 0;

    return {
      totalSegments,
      estimatedCards,
      estimatedNotes,
      totalDuration,
      averageDuration
    };
  }
} 