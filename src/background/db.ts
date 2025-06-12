/**
 * LanGear Language Extension - Database Service
 * IndexedDB数据库操作服务
 */

import { openDB, type IDBPDatabase } from 'idb';
import type {
  Deck,
  Note,
  Card,
  ReviewLog,
  DeckStatistics,
  LanGearDBSchema
} from '../shared/types';
import { DEFAULT_FSRS_CONFIG } from '../shared/types';

// 数据库配置
const DB_NAME = 'LanGearDB';
const DB_VERSION = 3;

export class DatabaseService {
  private db: IDBPDatabase<LanGearDBSchema> | null = null;

  /**
   * 初始化数据库连接
   */
  async initDatabase(): Promise<void> {
    try {
      this.db = await openDB<LanGearDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
          
          // 创建牌组表
          if (!db.objectStoreNames.contains('decks')) {
            const deckStore = db.createObjectStore('decks', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            deckStore.createIndex('name', 'name', { unique: false });
          }

          // 创建笔记表
          if (!db.objectStoreNames.contains('notes')) {
            const noteStore = db.createObjectStore('notes', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            noteStore.createIndex('deckId', 'deckId', { unique: false });
            noteStore.createIndex('noteType', 'noteType', { unique: false });
            noteStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }

          // 创建卡片表
          if (!db.objectStoreNames.contains('cards')) {
            const cardStore = db.createObjectStore('cards', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            cardStore.createIndex('noteId', 'noteId', { unique: false });
            cardStore.createIndex('deckId', 'deckId', { unique: false });
            cardStore.createIndex('due', 'due', { unique: false });
            cardStore.createIndex('state', 'state', { unique: false });
            cardStore.createIndex('deckId-due', ['deckId', 'due'], { unique: false });
          } else if (oldVersion < 2) {
            // 升级到版本2：添加deckId相关索引
            const cardStore = transaction!.objectStore('cards');
            if (!cardStore.indexNames.contains('deckId')) {
              cardStore.createIndex('deckId', 'deckId', { unique: false });
            }
            if (!cardStore.indexNames.contains('deckId-due')) {
              cardStore.createIndex('deckId-due', ['deckId', 'due'], { unique: false });
            }
          }

          // 升级到版本3：添加learningStep字段到现有卡片
          if (oldVersion < 3) {
            const cardStore = transaction!.objectStore('cards');
            // 为现有卡片添加learningStep字段，默认值为0
            cardStore.openCursor().then(function addLearningStep(cursor) {
              if (cursor) {
                const card = cursor.value;
                if (card.learningStep === undefined) {
                  card.learningStep = 0; // 默认值：任务待完成状态
                  cursor.update(card);
                }
                cursor.continue().then(addLearningStep);
              }
            });
          }

          // 创建复习日志表
          if (!db.objectStoreNames.contains('reviewLogs')) {
            const reviewLogStore = db.createObjectStore('reviewLogs', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            reviewLogStore.createIndex('cardId', 'cardId', { unique: false });
            reviewLogStore.createIndex('reviewTime', 'reviewTime', { unique: false });
          }

          // 创建音频存储表
          if (!db.objectStoreNames.contains('audioStore')) {
            const audioStore = db.createObjectStore('audioStore', { 
              keyPath: 'id' 
            });
            audioStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        },
      });

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private ensureDatabase(): IDBPDatabase<LanGearDBSchema> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return this.db;
  }



  // ==================== 牌组管理 ====================

  /**
   * 创建新牌组
   */
  async createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> {
    const db = this.ensureDatabase();
    const now = new Date();
    
    const newDeck: Omit<Deck, 'id'> = {
      ...deck,
      fsrsConfig: { ...DEFAULT_FSRS_CONFIG, ...deck.fsrsConfig },
      createdAt: now,
      updatedAt: now,
    };

    const id = await db.add('decks', newDeck as Deck);
    return { ...newDeck, id } as Deck;
  }

  /**
   * 获取所有牌组
   */
  async getAllDecks(): Promise<Deck[]> {
    const db = this.ensureDatabase();
    const rawDecks = await db.getAll('decks');
    return rawDecks.map(deck => ({
      ...deck,
      createdAt: typeof deck.createdAt === 'string' ? new Date(deck.createdAt) : deck.createdAt,
      updatedAt: typeof deck.updatedAt === 'string' ? new Date(deck.updatedAt) : deck.updatedAt,
    }));
  }

  /**
   * 根据ID获取牌组
   */
  async getDeckById(id: number): Promise<Deck | undefined> {
    const db = this.ensureDatabase();
    const rawDeck = await db.get('decks', id);
    return rawDeck ? {
      ...rawDeck,
      createdAt: typeof rawDeck.createdAt === 'string' ? new Date(rawDeck.createdAt) : rawDeck.createdAt,
      updatedAt: typeof rawDeck.updatedAt === 'string' ? new Date(rawDeck.updatedAt) : rawDeck.updatedAt,
    } : undefined;
  }

  /**
   * 更新牌组
   */
  async updateDeck(id: number, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>): Promise<Deck> {
    const db = this.ensureDatabase();
    const deck = await db.get('decks', id);
    
    if (!deck) {
      throw new Error(`Deck with id ${id} not found`);
    }

    const updatedDeck: Deck = {
      ...deck,
      ...updates,
      updatedAt: new Date(),
    };

    await db.put('decks', updatedDeck);
    return updatedDeck;
  }

  /**
   * 删除牌组
   */
  async deleteDeck(id: number): Promise<void> {
    const db = this.ensureDatabase();
    const tx = db.transaction(['decks', 'notes', 'cards', 'reviewLogs'], 'readwrite');
    
    // 获取要删除的牌组
    const deck = await tx.objectStore('decks').get(id);
    if (!deck) {
      throw new Error(`Deck with id ${id} not found`);
    }

    // 删除相关的笔记、卡片和复习日志
    const notes = await tx.objectStore('notes').index('deckId').getAll(id);
    const noteIds = notes.map(note => note.id);
    
    for (const noteId of noteIds) {
      const cards = await tx.objectStore('cards').index('noteId').getAll(noteId);
      const cardIds = cards.map(card => card.id);
      
      // 删除复习日志
      for (const cardId of cardIds) {
        const reviewLogs = await tx.objectStore('reviewLogs').index('cardId').getAll(cardId);
        for (const log of reviewLogs) {
          await tx.objectStore('reviewLogs').delete(log.id);
        }
      }
      
      // 删除卡片
      for (const card of cards) {
        await tx.objectStore('cards').delete(card.id);
      }
      
      // 删除笔记
      await tx.objectStore('notes').delete(noteId);
    }

    // 删除牌组
    await tx.objectStore('decks').delete(id);
    await tx.done;
  }

  // ==================== 笔记管理 ====================

  /**
   * 创建新笔记
   */
  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const db = this.ensureDatabase();
    const now = new Date();
    
    try {
      // Explicitly exclude 'id' to ensure auto-increment behavior
      // This prevents ConstraintError if input accidentally contains an id field
      const { id, createdAt, updatedAt, ...cleanNote } = note as any;
      
      const newNote: Omit<Note, 'id'> = {
        ...cleanNote,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Creating note with clean data:', { ...newNote, id: '[auto-generated]' });
      
      const generatedId = await db.add('notes', newNote as Note);
      const createdNote = { ...newNote, id: generatedId } as Note;
      
      console.log('Note created successfully with ID:', generatedId);
      return createdNote;
      
    } catch (error) {
      console.error('Failed to create note:', error);
      
      // Enhanced error handling for constraint errors
      if (error instanceof Error && error.name === 'ConstraintError') {
        throw new Error('Note creation failed: Duplicate key conflict. This may indicate database corruption or concurrent operations.');
      }
      
      throw error;
    }
  }

  /**
   * 根据牌组ID获取笔记
   */
  async getNotesByDeckId(deckId: number): Promise<Note[]> {
    const db = this.ensureDatabase();
    const rawNotes = await db.getAllFromIndex('notes', 'deckId', deckId);
    return rawNotes.map(note => this.convertDatesInNote(note));
  }

  /**
   * 根据ID获取笔记
   */
  async getNoteById(id: number): Promise<Note | undefined> {
    const db = this.ensureDatabase();
    const rawNote = await db.get('notes', id);
    return rawNote ? this.convertDatesInNote(rawNote) : undefined;
  }

  /**
   * 更新笔记
   */
  async updateNote(id: number, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note> {
    const db = this.ensureDatabase();
    const note = await db.get('notes', id);
    
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }

    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };

    await db.put('notes', updatedNote);
    return updatedNote;
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: number): Promise<void> {
    const db = await this.ensureDatabase();
    const tx = db.transaction(['notes', 'cards', 'reviewLogs'], 'readwrite');
    
    // 删除相关的卡片和复习日志
    const cards = await tx.objectStore('cards').index('noteId').getAll(id);
    for (const card of cards) {
      const reviewLogs = await tx.objectStore('reviewLogs').index('cardId').getAll(card.id);
      for (const log of reviewLogs) {
        await tx.objectStore('reviewLogs').delete(log.id);
      }
      await tx.objectStore('cards').delete(card.id);
    }

    await tx.objectStore('notes').delete(id);
    await tx.done;
  }

  // ==================== 卡片管理 ====================

  /**
   * 为笔记创建卡片
   */
  async createCardsForNote(note: Note): Promise<Card[]> {
    const db = this.ensureDatabase();
    // Use Omit<Card, 'id'> to ensure no ID conflicts with autoIncrement
    const cards: Omit<Card, 'id'>[] = [];
    const now = new Date();

    console.log('Creating cards for note:', note.id, 'type:', note.noteType);

    // 根据笔记类型创建对应的卡片
    switch (note.noteType) {
      case 'CtoE':
        // id is omitted to allow IndexedDB autoIncrement to function correctly
        cards.push({
          noteId: note.id,
          deckId: note.deckId,
          cardType: 'CtoE',
          state: 'New',
          due: now,
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          learningStep: 0, // Initialize with task pending state
          createdAt: now,
          updatedAt: now,
        });
        break;

      case 'Retranslate':
        // id is omitted to allow IndexedDB autoIncrement to function correctly
        cards.push({
          noteId: note.id,
          deckId: note.deckId,
          cardType: 'Retranslate',
          state: 'New',
          due: now,
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          learningStep: 0, // Initialize with task pending state
          createdAt: now,
          updatedAt: now,
        });
        break;

      default:
        throw new Error(`Unsupported note type: ${note.noteType}`);
    }

    try {
      // 批量添加卡片 - IndexedDB will auto-generate sequential IDs
      const createdCards: Card[] = [];
      for (const card of cards) {
        console.log('Adding card to database:', { ...card, id: '[auto-generated]' });
        const generatedId = await db.add('cards', card);
        const createdCard = { ...card, id: generatedId as number };
        createdCards.push(createdCard);
        console.log('Card created successfully with ID:', generatedId);
      }

      console.log('All cards created successfully for note:', note.id, 'total cards:', createdCards.length);
      return createdCards;
      
    } catch (error) {
      console.error('Failed to create cards for note:', note.id, error);
      
      // Enhanced error handling for constraint errors
      if (error instanceof Error && error.name === 'ConstraintError') {
        throw new Error(`Card creation failed for note ${note.id}: Auto-increment key conflict. This may indicate database corruption.`);
      }
      
      throw error;
    }
  }

  /**
   * 获取到期卡片
   */
  async getDueCards(deckId?: number, limit?: number, dailyNewCardsLimit?: number, dailyReviewLimit?: number): Promise<Card[]> {
    const db = this.ensureDatabase();
    const now = new Date();
    
    let rawCards: any[];
    if (deckId) {
      // 使用高效的复合索引获取特定牌组的到期卡片
      const tx = db.transaction('cards', 'readonly');
      const index = tx.store.index('deckId-due');
      
      // 使用范围查询获取指定牌组中所有到期的卡片
      const range = IDBKeyRange.bound([deckId, new Date(0)], [deckId, now]);
      rawCards = await index.getAll(range);
    } else {
      // 获取所有卡片然后过滤
      rawCards = await db.getAll('cards');
    }
    
    // 转换日期字段并过滤到期卡片
    const cards = rawCards
      .map(card => this.convertDatesInCard(card))
      .filter(card => card.due <= now);
    
    // 按到期时间排序
    cards.sort((a, b) => a.due.getTime() - b.due.getTime());
    
    // Apply daily limits if specified
    if (dailyNewCardsLimit !== undefined || dailyReviewLimit !== undefined) {
      return this.applyDailyLimits(cards, dailyNewCardsLimit, dailyReviewLimit);
    }
    
    return limit ? cards.slice(0, limit) : cards;
  }

  /**
   * Apply daily limits to due cards based on today's review history
   */
  private async applyDailyLimits(
    cards: Card[], 
    dailyNewCardsLimit?: number, 
    dailyReviewLimit?: number
  ): Promise<Card[]> {
    // Get today's review counts
    const todayReviewCounts = await this.getTodayReviewCounts();
    
    const filteredCards: Card[] = [];
    let newCardsAdded = 0;
    let reviewCardsAdded = 0;
    
    for (const card of cards) {
      const isNewCard = card.state === 'New';
      const isReviewCard = card.state === 'Review' || card.state === 'Learning' || card.state === 'Relearning';
      
      // Check new cards limit
      if (isNewCard && dailyNewCardsLimit !== undefined) {
        if (todayReviewCounts.newCards + newCardsAdded >= dailyNewCardsLimit) {
          continue; // Skip this new card
        }
        newCardsAdded++;
      }
      
      // Check review cards limit
      if (isReviewCard && dailyReviewLimit !== undefined) {
        if (todayReviewCounts.reviewCards + reviewCardsAdded >= dailyReviewLimit) {
          continue; // Skip this review card
        }
        reviewCardsAdded++;
      }
      
      filteredCards.push(card);
    }
    
    return filteredCards;
  }

  /**
   * Get today's review counts from review logs
   */
  private async getTodayReviewCounts(): Promise<{ newCards: number; reviewCards: number }> {
    const db = this.ensureDatabase();
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Get all review logs from today
    const tx = db.transaction('reviewLogs', 'readonly');
    const index = tx.store.index('reviewTime');
    const range = IDBKeyRange.bound(startOfDay, endOfDay, false, true);
    const todayLogs = await index.getAll(range);
    
    let newCards = 0;
    let reviewCards = 0;
    
    // Count reviews by card type
    for (const log of todayLogs) {
      if (log.stateBefore === 'New') {
        newCards++;
      } else {
        reviewCards++;
      }
    }
    
    return { newCards, reviewCards };
  }

  /**
   * 根据牌组ID获取卡片
   */
  async getCardsByDeckId(deckId: number): Promise<Card[]> {
    const db = this.ensureDatabase();
    // 直接使用deckId索引获取所有卡片，单次查询即可
    const rawCards = await db.getAllFromIndex('cards', 'deckId', deckId);
    return rawCards.map(card => this.convertDatesInCard(card));
  }

  /**
   * 根据ID获取卡片
   */
  async getCardById(id: number): Promise<Card | undefined> {
    const db = this.ensureDatabase();
    const rawCard = await db.get('cards', id);
    return rawCard ? this.convertDatesInCard(rawCard) : undefined;
  }

  /**
   * 更新卡片
   */
  async updateCard(id: number, updates: Partial<Omit<Card, 'id' | 'createdAt'>>): Promise<Card> {
    const db = this.ensureDatabase();
    const existingCard = await this.getCardById(id);
    
    if (!existingCard) {
      throw new Error(`Card with id ${id} not found`);
    }

    const updatedCard = {
      ...existingCard,
      ...updates,
      updatedAt: new Date(),
    };

    await db.put('cards', updatedCard);
    return updatedCard;
  }

  /**
   * 重置卡片复习进度
   */
  async resetCardProgress(cardId: number): Promise<void> {
    const db = this.ensureDatabase();
    const card = await this.getCardById(cardId);
    
    if (!card) {
      throw new Error(`Card with id ${cardId} not found`);
    }

    // Reset card to initial state
    const resetCard = {
      ...card,
      state: 'New' as const,
      due: new Date(),
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      lastReview: undefined,
      updatedAt: new Date(),
    };

    await db.put('cards', resetCard);
    
    // Optionally, remove review logs for this card
    const tx = db.transaction(['reviewLogs'], 'readwrite');
    const reviewLogsStore = tx.objectStore('reviewLogs');
    const index = reviewLogsStore.index('cardId');
    
    for await (const cursor of index.iterate(cardId)) {
      await cursor.delete();
    }
    
    await tx.done;
  }

  /**
   * Reset all cards in a deck (or all cards if deckId is null)
   * This provides bulk reset functionality for the scheduler service
   */
  async resetCardsInDeck(deckId: number | null): Promise<number> {
    const db = this.ensureDatabase();
    let resetCount = 0;

    try {
      const tx = db.transaction(['cards', 'reviewLogs'], 'readwrite');
      const cardsStore = tx.objectStore('cards');
      const reviewLogsStore = tx.objectStore('reviewLogs');
      
      // Get cards to reset
      let cardsToReset: Card[];
      if (deckId === null) {
        // Reset all cards
        cardsToReset = await cardsStore.getAll();
      } else {
        // Reset cards in specific deck
        cardsToReset = await cardsStore.index('deckId').getAll(deckId);
      }

      console.log(`Resetting ${cardsToReset.length} cards in deck ${deckId || 'all decks'}`);

      // Reset each card
      for (const card of cardsToReset) {
        const resetCard = {
          ...card,
          state: 'New' as const,
          due: new Date(),
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: 0,
          lapses: 0,
          lastReview: undefined,
          updatedAt: new Date(),
        };

        await cardsStore.put(resetCard);
        resetCount++;

        // Remove review logs for this card
        const reviewLogIndex = reviewLogsStore.index('cardId');
        for await (const cursor of reviewLogIndex.iterate(card.id)) {
          await cursor.delete();
        }
      }

      await tx.done;
      console.log(`Successfully reset ${resetCount} cards`);
      return resetCount;
    } catch (error) {
      console.error('Error resetting cards in deck:', error);
      throw new Error(`Failed to reset cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ==================== 复习日志管理 ====================

  /**
   * 添加复习日志
   */
  async addReviewLog(log: Omit<ReviewLog, 'id'>): Promise<ReviewLog> {
    const db = this.ensureDatabase();
    const id = await db.add('reviewLogs', log as ReviewLog);
    return { ...log, id } as ReviewLog;
  }

  /**
   * 获取卡片的复习日志
   */
  async getReviewLogsByCardId(cardId: number): Promise<ReviewLog[]> {
    const db = this.ensureDatabase();
    const rawLogs = await db.getAllFromIndex('reviewLogs', 'cardId', cardId);
    return rawLogs.map(log => this.convertDatesInReviewLog(log));
  }

  // ==================== 统计功能 ====================

  /**
   * 获取牌组统计信息
   */
  async getDeckStatistics(deckId: number): Promise<DeckStatistics> {
    const db = this.ensureDatabase();
    
    // 使用高效的单次查询获取牌组下的所有数据
    const rawNotes = await db.getAllFromIndex('notes', 'deckId', deckId);
    const rawCards = await db.getAllFromIndex('cards', 'deckId', deckId);
    
    // 转换日期字段
    const notes = rawNotes.map(note => this.convertDatesInNote(note));
    const cards = rawCards.map(card => this.convertDatesInCard(card));
    
    const totalNotes = notes.length;
    let totalCards = cards.length;
    let newCards = 0;
    let learningCards = 0;
    let reviewCards = 0;
    let dueCards = 0;
    const now = new Date();

    // 单次遍历统计所有数据
    for (const card of cards) {
      switch (card.state) {
        case 'New':
          newCards++;
          break;
        case 'Learning':
          learningCards++;
          break;
        case 'Review':
          reviewCards++;
          break;
      }
      
      if (card.due <= now) {
        dueCards++;
      }
    }

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      dueCards,
      totalNotes,
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 将从 IndexedDB 检索的数据中的日期字符串转换为 Date 对象
   */
  private convertDatesInCard(card: any): Card {
    return {
      ...card,
      due: typeof card.due === 'string' ? new Date(card.due) : card.due,
      createdAt: typeof card.createdAt === 'string' ? new Date(card.createdAt) : card.createdAt,
      updatedAt: typeof card.updatedAt === 'string' ? new Date(card.updatedAt) : card.updatedAt,
    };
  }

  /**
   * 将从 IndexedDB 检索的数据中的日期字符串转换为 Date 对象
   */
  private convertDatesInNote(note: any): Note {
    return {
      ...note,
      createdAt: typeof note.createdAt === 'string' ? new Date(note.createdAt) : note.createdAt,
      updatedAt: typeof note.updatedAt === 'string' ? new Date(note.updatedAt) : note.updatedAt,
    };
  }

  /**
   * 将从 IndexedDB 检索的数据中的日期字符串转换为 Date 对象
   */
  private convertDatesInReviewLog(log: any): ReviewLog {
    return {
      ...log,
      reviewTime: typeof log.reviewTime === 'string' ? new Date(log.reviewTime) : log.reviewTime,
    };
  }

  /**
   * 验证数据库完整性
   */
  async validateDatabaseIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    orphanedRecords: number;
  }> {
    const db = this.ensureDatabase();
    const issues: string[] = [];
    let orphanedRecords = 0;

    try {
      // Check for orphaned cards (cards without corresponding notes)
      const allCards = await db.getAll('cards');
      const allNotes = await db.getAll('notes');
      const noteIds = new Set(allNotes.map(note => note.id));
      
      const orphanedCards = allCards.filter(card => !noteIds.has(card.noteId));
      if (orphanedCards.length > 0) {
        issues.push(`Found ${orphanedCards.length} orphaned cards without corresponding notes`);
        orphanedRecords += orphanedCards.length;
      }

      // Check for orphaned review logs (logs without corresponding cards)
      const allReviewLogs = await db.getAll('reviewLogs');
      const cardIds = new Set(allCards.map(card => card.id));
      
      const orphanedLogs = allReviewLogs.filter(log => !cardIds.has(log.cardId));
      if (orphanedLogs.length > 0) {
        issues.push(`Found ${orphanedLogs.length} orphaned review logs without corresponding cards`);
        orphanedRecords += orphanedLogs.length;
      }

      // Check for notes without corresponding decks
      const allDecks = await db.getAll('decks');
      const deckIds = new Set(allDecks.map(deck => deck.id));
      
      const orphanedNotes = allNotes.filter(note => !deckIds.has(note.deckId));
      if (orphanedNotes.length > 0) {
        issues.push(`Found ${orphanedNotes.length} orphaned notes without corresponding decks`);
        orphanedRecords += orphanedNotes.length;
      }

      console.log('Database integrity check completed:', { 
        isValid: issues.length === 0, 
        issues, 
        orphanedRecords 
      });

      return {
        isValid: issues.length === 0,
        issues,
        orphanedRecords
      };

    } catch (error) {
      console.error('Database integrity validation failed:', error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        orphanedRecords: 0
      };
    }
  }

  /**
   * 清空所有数据（仅用于测试）
   */
  async clearAllData(): Promise<void> {
    const db = this.ensureDatabase();
    const tx = db.transaction(['decks', 'notes', 'cards', 'reviewLogs', 'audioStore'], 'readwrite');
    
    await tx.objectStore('reviewLogs').clear();
    await tx.objectStore('cards').clear();
    await tx.objectStore('notes').clear();
    await tx.objectStore('decks').clear();
    await tx.objectStore('audioStore').clear();
    
    await tx.done;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出单例实例
export const dbService = new DatabaseService(); 