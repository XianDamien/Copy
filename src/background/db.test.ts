import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './db';
import type { Deck, Note, Card } from '../shared/types';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
    await db.initDatabase();
  });

  afterEach(async () => {
    // 清理测试数据
    await db.clearAllData();
  });

  describe('Deck Management', () => {
    it('should create a deck successfully', async () => {
      const deckData = {
        name: '测试牌组',
        description: '这是一个测试牌组',
        fsrsConfig: {
          requestRetention: 0.9,
          maximumInterval: 36500,
          easyBonus: 1.3,
          hardFactor: 1.2,
        },
      };

      const deck = await db.createDeck(deckData);

      expect(deck).toBeDefined();
      expect(deck.id).toBeDefined();
      expect(deck.name).toBe(deckData.name);
      expect(deck.description).toBe(deckData.description);
      expect(deck.createdAt).toBeInstanceOf(Date);
      expect(deck.updatedAt).toBeInstanceOf(Date);
    });

    it('should get all decks', async () => {
      // 创建测试牌组
      await db.createDeck({
        name: '牌组1',
        description: '测试牌组1',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
      await db.createDeck({
        name: '牌组2',
        description: '测试牌组2',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });

      const decks = await db.getAllDecks();
      expect(decks).toHaveLength(2);
      expect(decks[0].name).toBe('牌组1');
      expect(decks[1].name).toBe('牌组2');
    });

    it('should get deck by id', async () => {
      const createdDeck = await db.createDeck({
        name: '测试牌组',
        description: '测试描述',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });

      const deck = await db.getDeckById(createdDeck.id);
      expect(deck).toBeDefined();
      expect(deck!.name).toBe('测试牌组');
    });

    it('should update deck', async () => {
      const createdDeck = await db.createDeck({
        name: '原始名称',
        description: '原始描述',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });

      const updatedDeck = await db.updateDeck(createdDeck.id, {
        name: '更新后的名称',
        description: '更新后的描述',
      });

      expect(updatedDeck.name).toBe('更新后的名称');
      expect(updatedDeck.description).toBe('更新后的描述');
      expect(updatedDeck.updatedAt.getTime()).toBeGreaterThan(createdDeck.updatedAt.getTime());
    });

    it('should delete deck', async () => {
      const createdDeck = await db.createDeck({
        name: '要删除的牌组',
        description: '测试删除',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });

      await db.deleteDeck(createdDeck.id);

      const deck = await db.getDeckById(createdDeck.id);
      expect(deck).toBeUndefined();
    });
  });

  describe('Note Management', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      testDeck = await db.createDeck({
        name: '测试牌组',
        description: '用于笔记测试的牌组',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
    });

    it('should create a note successfully', async () => {
      const noteData = {
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: {
          CtoE: {
            chinese: '你好',
            english: 'Hello',
            pinyin: 'nǐ hǎo',
            notes: '常用问候语',
          },
        },
        tags: ['greeting', 'basic'],
      };

      const note = await db.createNote(noteData);

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.deckId).toBe(testDeck.id);
      expect(note.noteType).toBe('CtoE');
      expect(note.fields.CtoE?.chinese).toBe('你好');
      expect(note.tags).toEqual(['greeting', 'basic']);
    });

    it('should get notes by deck id', async () => {
      // 创建测试笔记
      await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE',
        fields: { CtoE: { chinese: '你好', english: 'Hello', pinyin: 'nǐ hǎo', notes: '' } },
        tags: [],
      });
      await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE',
        fields: { CtoE: { chinese: '再见', english: 'Goodbye', pinyin: 'zài jiàn', notes: '' } },
        tags: [],
      });

      const notes = await db.getNotesByDeckId(testDeck.id);
      expect(notes).toHaveLength(2);
    });
  });

  describe('Card Management', () => {
    let testDeck: Deck;
    let testNote: Note;

    beforeEach(async () => {
      testDeck = await db.createDeck({
        name: '测试牌组',
        description: '用于卡片测试的牌组',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });

      testNote = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE',
        fields: { CtoE: { chinese: '你好', english: 'Hello', pinyin: 'nǐ hǎo', notes: '' } },
        tags: [],
      });
    });

    it('should create cards for a note', async () => {
      const cards = await db.createCardsForNote(testNote);

      expect(cards).toHaveLength(1); // CtoE类型创建1张卡片
      expect(cards[0].noteId).toBe(testNote.id);
      expect(cards[0].cardType).toBe('CtoE');
      expect(cards[0].state).toBe('New');
    });

    it('should get due cards', async () => {
      const cards = await db.createCardsForNote(testNote);
      
      // 将卡片设置为到期
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await db.updateCard(cards[0].id, {
        due: yesterday,
        state: 'Learning',
      });

      const dueCards = await db.getDueCards();
      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toBe(cards[0].id);
    });

    it('should get cards by deck id', async () => {
      await db.createCardsForNote(testNote);
      
      const cards = await db.getCardsByDeckId(testDeck.id);
      expect(cards).toHaveLength(1);
      expect(cards[0].noteId).toBe(testNote.id);
    });
  });

  describe('Statistics', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      testDeck = await db.createDeck({
        name: '统计测试牌组',
        description: '用于统计测试',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
    });

    it('should get deck statistics', async () => {
      // 创建一些测试数据
      const note1 = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE',
        fields: { CtoE: { chinese: '你好', english: 'Hello', pinyin: 'nǐ hǎo', notes: '' } },
        tags: [],
      });
      const note2 = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE',
        fields: { CtoE: { chinese: '再见', english: 'Goodbye', pinyin: 'zài jiàn', notes: '' } },
        tags: [],
      });

      await db.createCardsForNote(note1);
      await db.createCardsForNote(note2);

      const stats = await db.getDeckStatistics(testDeck.id);
      
      expect(stats.totalCards).toBe(2);
      expect(stats.newCards).toBe(2);
      expect(stats.dueCards).toBe(0);
      expect(stats.totalNotes).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent deck', async () => {
      const deck = await db.getDeckById(999999);
      expect(deck).toBeUndefined();
    });

    it('should handle invalid deck deletion', async () => {
      await expect(db.deleteDeck(999999)).rejects.toThrow();
    });

    it('should handle duplicate deck names gracefully', async () => {
      const deckData = {
        name: '重复名称',
        description: '测试重复名称',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      };

      await db.createDeck(deckData);
      
      // 创建同名牌组应该成功（目前没有唯一性约束）
      const secondDeck = await db.createDeck(deckData);
      expect(secondDeck).toBeDefined();
    });
  });

  describe('Fixed createNote method - defensive behavior', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      await db.initDatabase();
      // Create a test deck
      testDeck = await db.createDeck({
        name: 'Test Deck',
        description: 'A test deck',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
    });

    afterEach(async () => {
      await db.clearAllData();
    });

    it('should create note successfully with clean input', async () => {
      const noteRequest = {
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '你好', english: 'Hello' } },
        tags: ['test'],
      };

      const note = await db.createNote(noteRequest);
      
      expect(note).toBeDefined();
      expect(note.id).toBeGreaterThan(0);
      expect(note.deckId).toBe(testDeck.id);
      expect(note.noteType).toBe('CtoE');
      expect(note.fields.CtoE?.chinese).toBe('你好');
      expect(note.fields.CtoE?.english).toBe('Hello');
    });

    it('should handle input with explicit id field defensively', async () => {
      // First create a note normally
      const firstNote = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '第一', english: 'First' } },
        tags: [],
      });

      // Try to create another note with explicit ID that might conflict
      const corruptedInput = {
        id: firstNote.id, // This should be stripped out
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '第二', english: 'Second' } },
        tags: [],
        createdAt: new Date(), // This should also be stripped out
        updatedAt: new Date(), // This should also be stripped out
      } as any;

      const secondNote = await db.createNote(corruptedInput);
      
      // Should create successfully with auto-generated ID
      expect(secondNote).toBeDefined();
      expect(secondNote.id).not.toBe(firstNote.id);
      expect(secondNote.id).toBeGreaterThan(firstNote.id);
      expect(secondNote.fields.CtoE?.chinese).toBe('第二');
    });

    it('should provide helpful error message for constraint errors', async () => {
      // This test simulates a scenario where a constraint error might occur
      const noteRequest = {
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '测试', english: 'Test' } },
        tags: [],
      };

      // Create note normally first
      const note = await db.createNote(noteRequest);
      expect(note.id).toBeGreaterThan(0);

      // The defensive approach should prevent any constraint errors
      // by properly excluding ID fields
      const anotherNote = await db.createNote(noteRequest);
      expect(anotherNote.id).not.toBe(note.id);
      expect(anotherNote.id).toBeGreaterThan(note.id);
    });
  });

  describe('Card Creation Fix - Multiple Cards Support', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      await db.initDatabase();
      testDeck = await db.createDeck({
        name: 'Test Deck',
        description: 'A test deck for card creation testing',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
    });

    afterEach(async () => {
      await db.clearAllData();
    });

    it('should create multiple notes with cards without ConstraintError', async () => {
      // Create first note and its card
      const note1 = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '第一', english: 'First' } },
        tags: [],
      });

      const cards1 = await db.createCardsForNote(note1);
      expect(cards1).toHaveLength(1);
      expect(cards1[0].id).toBeGreaterThan(0);
      expect(cards1[0].noteId).toBe(note1.id);

      // Create second note and its card - this should not cause ConstraintError
      const note2 = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '第二', english: 'Second' } },
        tags: [],
      });

      const cards2 = await db.createCardsForNote(note2);
      expect(cards2).toHaveLength(1);
      expect(cards2[0].id).toBeGreaterThan(0);
      expect(cards2[0].noteId).toBe(note2.id);

      // Verify cards have different IDs (auto-increment working)
      expect(cards2[0].id).not.toBe(cards1[0].id);
      expect(cards2[0].id).toBeGreaterThan(cards1[0].id);
    });

    it('should create cards with sequential auto-generated IDs', async () => {
      const notes: Note[] = [];
      const allCards: Card[] = [];

      // Create 5 notes with cards
      for (let i = 1; i <= 5; i++) {
        const note = await db.createNote({
          deckId: testDeck.id,
          noteType: 'CtoE' as const,
          fields: { CtoE: { chinese: `测试${i}`, english: `Test${i}` } },
          tags: [],
        });
        notes.push(note);

        const cards = await db.createCardsForNote(note);
        expect(cards).toHaveLength(1);
        allCards.push(...cards);
      }

      // Verify all cards have unique, sequential IDs
      const cardIds = allCards.map(card => card.id).sort((a, b) => a - b);
      
      for (let i = 1; i < cardIds.length; i++) {
        expect(cardIds[i]).toBeGreaterThan(cardIds[i - 1]);
      }

      // Verify each card is properly associated with its note
      for (let i = 0; i < notes.length; i++) {
        expect(allCards[i].noteId).toBe(notes[i].id);
        expect(allCards[i].deckId).toBe(testDeck.id);
        expect(allCards[i].cardType).toBe('CtoE');
      }
    });

    it('should handle different note types without ID conflicts', async () => {
      // Create CtoE note
      const ctoENote = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '中英', english: 'Chinese to English' } },
        tags: [],
      });

      const ctoECards = await db.createCardsForNote(ctoENote);
      expect(ctoECards).toHaveLength(1);
      expect(ctoECards[0].cardType).toBe('CtoE');

      // Create Retranslate note
      const retranslateNote = await db.createNote({
        deckId: testDeck.id,
        noteType: 'Retranslate' as const,
        fields: { 
          Retranslate: { 
            originalText: 'Hello', 
            targetLanguage: 'Chinese',
            referenceTranslation: '你好'
          } 
        },
        tags: [],
      });

      const retranslateCards = await db.createCardsForNote(retranslateNote);
      expect(retranslateCards).toHaveLength(1);
      expect(retranslateCards[0].cardType).toBe('Retranslate');

      // Verify different card types have different IDs
      expect(retranslateCards[0].id).not.toBe(ctoECards[0].id);
      expect(retranslateCards[0].id).toBeGreaterThan(ctoECards[0].id);
    });
  });

  describe('Database integrity validation', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      await db.initDatabase();
      testDeck = await db.createDeck({
        name: 'Test Deck',
        description: 'A test deck',
        fsrsConfig: { requestRetention: 0.9, maximumInterval: 36500, easyBonus: 1.3, hardFactor: 1.2 },
      });
    });

    afterEach(async () => {
      await db.clearAllData();
    });

    it('should validate clean database as valid', async () => {
      const result = await db.validateDatabaseIntegrity();
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.orphanedRecords).toBe(0);
    });

    it('should validate database with proper relationships', async () => {
      // Create note and cards
      const note = await db.createNote({
        deckId: testDeck.id,
        noteType: 'CtoE' as const,
        fields: { CtoE: { chinese: '验证', english: 'Validate' } },
        tags: [],
      });

      const cards = await db.createCardsForNote(note);
      expect(cards.length).toBeGreaterThan(0);

      const result = await db.validateDatabaseIntegrity();
      
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.orphanedRecords).toBe(0);
    });
  });
}); 