import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FSRSService } from './fsrsService';
import type { Card, AppRating } from '../shared/types';

// Mock数据库服务
const mockDb = {
  updateCard: vi.fn(),
  addReviewLog: vi.fn(),
} as any;

describe('FSRSService', () => {
  let fsrsService: FSRSService;

  beforeEach(() => {
    vi.clearAllMocks();
    fsrsService = new FSRSService();
  });

  describe('Card Review', () => {
    it('should review a new card correctly', async () => {
      const newCard: Card = {
        id: 1,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE',
        state: 'New',
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        lastReview: undefined,
        learningStep: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.updateCard.mockResolvedValue({
        ...newCard,
        state: 'Learning',
        reps: 1,
      });
      mockDb.addReviewLog.mockResolvedValue({});

      const result = await fsrsService.reviewCard(newCard.id, 'Good' as AppRating);

      expect(result.success).toBe(true);
      expect(mockDb.updateCard).toHaveBeenCalled();
      expect(mockDb.addReviewLog).toHaveBeenCalled();
    });

    it('should handle different rating types', async () => {
      const learningCard: Card = {
        id: 2,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE',
        state: 'Learning',
        due: new Date(),
        stability: 1.0,
        difficulty: 5.0,
        elapsedDays: 1,
        scheduledDays: 1,
        reps: 1,
        lapses: 0,
        lastReview: new Date(),
        learningStep: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.updateCard.mockResolvedValue(learningCard);
      mockDb.addReviewLog.mockResolvedValue({});

      // 测试不同评分
      const ratings: AppRating[] = ['Again', 'Hard', 'Good', 'Easy'];
      
      for (const rating of ratings) {
        const result = await fsrsService.reviewCard(learningCard.id, rating);
        expect(result.success).toBe(true);
      }

      expect(mockDb.updateCard).toHaveBeenCalledTimes(4);
      expect(mockDb.addReviewLog).toHaveBeenCalledTimes(4);
    });

    it('should handle errors gracefully', async () => {
      mockDb.updateCard.mockRejectedValue(new Error('Database error'));

      const result = await fsrsService.reviewCard(1, 'Good');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('FSRS Algorithm', () => {
    it('should convert app card to FSRS format correctly', () => {
      const appCard: Card = {
        id: 1,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE',
        state: 'Review',
        due: new Date(),
        stability: 10.5,
        difficulty: 6.2,
        elapsedDays: 5,
        scheduledDays: 10,
        reps: 3,
        lapses: 1,
        lastReview: new Date('2024-01-01'),
        learningStep: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const fsrsCard = (fsrsService as any).convertToFSRSCard(appCard);

      expect(fsrsCard.stability).toBe(10.5);
      expect(fsrsCard.difficulty).toBe(6.2);
      expect(fsrsCard.elapsed_days).toBe(5);
      expect(fsrsCard.scheduled_days).toBe(10);
      expect(fsrsCard.reps).toBe(3);
      expect(fsrsCard.lapses).toBe(1);
      expect(fsrsCard.state).toBe(2); // Review state
    });

    it('should convert FSRS card back to app format correctly', () => {
      const fsrsCard = {
        stability: 15.5,
        difficulty: 7.2,
        elapsed_days: 8,
        scheduled_days: 15,
        reps: 5,
        lapses: 2,
        state: 2, // Review
        last_review: new Date('2024-01-05'),
        due: new Date('2024-01-20'),
      };

      const appCard = (fsrsService as any).convertToAppCard(fsrsCard);

      expect(appCard.stability).toBe(15.5);
      expect(appCard.difficulty).toBe(7.2);
      expect(appCard.elapsedDays).toBe(8);
      expect(appCard.scheduledDays).toBe(15);
      expect(appCard.reps).toBe(5);
      expect(appCard.lapses).toBe(2);
      expect(appCard.state).toBe('Review');
    });

    it('should map app ratings to FSRS ratings correctly', () => {
      const mappings = [
        { app: 'Again', fsrs: 1 },
        { app: 'Hard', fsrs: 2 },
        { app: 'Good', fsrs: 3 },
        { app: 'Easy', fsrs: 4 },
      ];

      mappings.forEach(({ app, fsrs }) => {
        const result = (fsrsService as any).mapRatingToFSRS(app as AppRating);
        expect(result).toBe(fsrs);
      });
    });
  });

  describe('Card Scheduling', () => {
    it('should calculate next review correctly for new cards', async () => {
      const newCard: Card = {
        id: 1,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE',
        state: 'New',
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        lastReview: undefined,
        learningStep: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextReview = await fsrsService.getNextReviewDate(newCard, 'Good');
      
      expect(nextReview).toBeInstanceOf(Date);
      expect(nextReview.getTime()).toBeGreaterThan(Date.now());
    });

    it('should predict retention rate correctly', async () => {
      const reviewCard: Card = {
        id: 1,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE',
        state: 'Review',
        due: new Date(),
        stability: 30,
        difficulty: 5.5,
        elapsedDays: 15,
        scheduledDays: 30,
        reps: 10,
        lapses: 1,
        lastReview: new Date(),
        learningStep: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const retention = await fsrsService.predictRetention(reviewCard);
      
      expect(retention).toBeGreaterThan(0);
      expect(retention).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Analysis', () => {
    it('should calculate learning progress correctly', async () => {
      const testCards: Card[] = [
        {
          id: 1, noteId: 1, deckId: 1, cardType: 'CtoE', state: 'New',
          due: new Date(), stability: 0, difficulty: 0, elapsedDays: 0,
          scheduledDays: 0, reps: 0, lapses: 0, lastReview: undefined,
          learningStep: 0,
          createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 2, noteId: 2, deckId: 1, cardType: 'CtoE', state: 'Learning',
          due: new Date(), stability: 2, difficulty: 6, elapsedDays: 1,
          scheduledDays: 2, reps: 2, lapses: 0, lastReview: new Date(),
          learningStep: 1,
          createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 3, noteId: 3, deckId: 1, cardType: 'CtoE', state: 'Review',
          due: new Date(), stability: 15, difficulty: 5, elapsedDays: 10,
          scheduledDays: 15, reps: 5, lapses: 1, lastReview: new Date(),
          learningStep: 1,
          createdAt: new Date(), updatedAt: new Date(),
        },
      ];

      const progress = await fsrsService.calculateLearningProgress(testCards);

      expect(progress.totalCards).toBe(3);
      expect(progress.newCards).toBe(1);
      expect(progress.learningCards).toBe(1);
      expect(progress.reviewCards).toBe(1);
      expect(progress.averageRetention).toBeGreaterThan(0);
    });

    it('should recommend study schedule', async () => {
      const testCards: Card[] = [
        {
          id: 1, noteId: 1, deckId: 1, cardType: 'CtoE', state: 'New',
          due: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天到期
          stability: 0, difficulty: 0, elapsedDays: 0,
          scheduledDays: 0, reps: 0, lapses: 0, lastReview: undefined,
          learningStep: 0,
          createdAt: new Date(), updatedAt: new Date(),
        },
        {
          id: 2, noteId: 2, deckId: 1, cardType: 'CtoE', state: 'Learning',
          due: new Date(Date.now() + 60 * 60 * 1000), // 1小时后到期
          stability: 2, difficulty: 6, elapsedDays: 1,
          scheduledDays: 2, reps: 2, lapses: 0, lastReview: new Date(),
          learningStep: 1,
          createdAt: new Date(), updatedAt: new Date(),
        },
      ];

      const schedule = await fsrsService.recommendStudySchedule(testCards);

      expect(schedule.immediateReview).toBeGreaterThan(0);
      expect(schedule.todayTotal).toBeGreaterThan(0);
      expect(schedule.recommendedDailyLimit).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update FSRS parameters correctly', async () => {
      const newConfig = {
        requestRetention: 0.95,
        maximumInterval: 30000,
        easyBonus: 1.5,
        hardFactor: 1.1,
      };

      fsrsService.updateConfig(newConfig);

      const currentConfig = fsrsService.getConfig();
      expect(currentConfig.requestRetention).toBe(0.95);
      expect(currentConfig.maximumInterval).toBe(30000);
      expect(currentConfig.easyBonus).toBe(1.5);
      expect(currentConfig.hardFactor).toBe(1.1);
    });

    it('should validate configuration parameters', () => {
      const invalidConfigs = [
        { requestRetention: 1.5 }, // > 1
        { requestRetention: 0 }, // <= 0
        { maximumInterval: -1 }, // < 0
        { easyBonus: 0.5 }, // < 1
        { hardFactor: 0 }, // <= 0
      ];

      invalidConfigs.forEach((config) => {
        expect(() => fsrsService.updateConfig(config as any)).toThrow();
      });
    });
  });
}); 