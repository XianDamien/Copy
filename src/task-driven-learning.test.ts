/**
 * Task-Driven Learning Tests
 * Tests for the hybrid state machine supporting both task-driven and traditional learning modes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FSRSService } from '../src/background/fsrsService';

// Mock dependencies
vi.mock('../src/background/db', () => ({
  dbService: {
    getCardById: vi.fn(),
    updateCard: vi.fn(),
    addReviewLog: vi.fn(),
  },
}));

vi.mock('../src/shared/utils/settingsService', () => ({
  getSettings: vi.fn(),
  addSettingsChangeListener: vi.fn(),
  parseLearningSteps: vi.fn((steps: string) => {
    // Parse learning steps like "1 10" -> [1, 10]
    return steps.split(' ').map(Number);
  }),
}));

import { dbService } from '../src/background/db';
import { getSettings } from '../src/shared/utils/settingsService';

const mockDb = dbService as any;
const mockGetSettings = getSettings as any;

describe('Task-Driven Learning System', () => {
  let fsrsService: FSRSService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default settings (task-driven mode)
    mockGetSettings.mockResolvedValue({
      learningSteps: '1 10',
      relearningSteps: '10',
      dailyNewCardsLimit: 20,
      dailyReviewLimit: 200,
      enableTraditionalLearningSteps: false,
    });

    fsrsService = new FSRSService();
    mockDb.getCardById.mockImplementation((id: number) => {
      // Return different cards based on ID for testing
      const baseCard = {
        id,
        noteId: 1,
        deckId: 1,
        cardType: 'CtoE' as const,
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

      if (id === 1) return { ...baseCard, state: 'New' as const };
      if (id === 2) return { ...baseCard, state: 'Relearning' as const };
      if (id === 3) return { 
        ...baseCard, 
        state: 'Review' as const, 
        stability: 10, 
        difficulty: 5,
        lastReview: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        due: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (overdue)
        reps: 1,
        scheduledDays: 1
      };
      return baseCard;
    });
  });

  describe('Task-Driven Mode (Default)', () => {
    describe('New Card Task Completion', () => {
      it('should graduate new card to Review when task completed with Good rating', async () => {
        const updatedCard = {
          id: 1,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day later
          scheduledDays: 1,
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(1, 'Good');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            state: 'Review',
            learningStep: 1,
            reps: 1,
          })
        );
      });

      it('should graduate new card to Review when task completed with Easy rating', async () => {
        const updatedCard = {
          id: 1,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
          scheduledDays: 4,
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(1, 'Easy');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            state: 'Review',
            learningStep: 1,
            reps: 1,
          })
        );
      });

      it('should keep new card in task phase when task failed with Again rating', async () => {
        const updatedCard = {
          id: 1,
          state: 'New',
          learningStep: 0,
          due: new Date(), // Immediate retry
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(1, 'Again');

        expect(result.success).toBe(true);
        expect(result.interval).toBe(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            due: expect.any(Date),
          })
        );
      });
    });

    describe('Relearning Card Task Completion', () => {
      it('should graduate relearning card to Review when task completed', async () => {
        const updatedCard = {
          id: 2,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledDays: 1,
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(2, 'Good');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          2,
          expect.objectContaining({
            state: 'Review',
            learningStep: 1,
          })
        );
      });
    });

    describe('Review Card Handling', () => {
      it('should return review card to task phase when failed with Again', async () => {
        const updatedCard = {
          id: 3,
          state: 'Relearning',
          learningStep: 0,
          due: new Date(), // Immediate task retry
          lapses: 1,
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(3, 'Again');

        expect(result.success).toBe(true);
        expect(result.interval).toBe(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          3,
          expect.objectContaining({
            state: 'Relearning',
            learningStep: 0,
            due: expect.any(Date),
            lapses: 1,
          })
        );
      });

      it('should use FSRS scheduling for successful review', async () => {
        const updatedCard = {
          id: 3,
          state: 'Review',
          due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
          scheduledDays: 7,
          reps: 2,
        };

        mockDb.updateCard.mockResolvedValue(updatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(3, 'Good');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          3,
          expect.objectContaining({
            reps: 2,
          })
        );
      });
    });
  });

  describe('Traditional Learning Steps Mode (Advanced)', () => {
    beforeEach(() => {
      // Mock traditional mode settings
      mockGetSettings.mockResolvedValue({
        learningSteps: '1 10',
        relearningSteps: '10',
        dailyNewCardsLimit: 20,
        dailyReviewLimit: 200,
        enableTraditionalLearningSteps: true,
      });

      fsrsService = new FSRSService();
    });

    describe('Learning Steps Progression', () => {
      it('should progress through learning steps correctly', async () => {
        // First step: 1 minute
        const step1Card = {
          id: 1,
          state: 'Learning',
          learningStep: 1,
          due: new Date(Date.now() + 1 * 60 * 1000), // 1 minute later
        };

        mockDb.updateCard.mockResolvedValue(step1Card);
        mockDb.addReviewLog.mockResolvedValue({});

        const result1 = await fsrsService.reviewCard(1, 'Good');

        expect(result1.success).toBe(true);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            state: 'Learning',
            learningStep: 1,
          })
        );

        // Second step: 10 minutes (should graduate after this)
        mockDb.getCardById.mockReturnValue({
          ...step1Card,
          learningStep: 1,
        });

        const graduatedCard = {
          id: 1,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledDays: 1,
        };

        mockDb.updateCard.mockResolvedValue(graduatedCard);

        const result2 = await fsrsService.reviewCard(1, 'Good');

        expect(result2.success).toBe(true);
        expect(result2.interval).toBeGreaterThan(0);
      });

      it('should reset to first step when Again is pressed', async () => {
        const resetCard = {
          id: 1,
          state: 'Learning',
          learningStep: 0,
          due: new Date(Date.now() + 1 * 60 * 1000), // Back to 1 minute
        };

        mockDb.updateCard.mockResolvedValue(resetCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(1, 'Again');

        expect(result.success).toBe(true);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            learningStep: 0,
          })
        );
      });

      it('should graduate immediately when Easy is pressed', async () => {
        const graduatedCard = {
          id: 1,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
          scheduledDays: 4,
        };

        mockDb.updateCard.mockResolvedValue(graduatedCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(1, 'Easy');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            state: 'Review',
            learningStep: 1,
          })
        );
      });
    });

    describe('Relearning Steps', () => {
      it('should handle relearning steps correctly', async () => {
        mockDb.getCardById.mockReturnValue({
          id: 2,
          state: 'Relearning',
          learningStep: 0,
          lapses: 1,
        });

        const relearningCard = {
          id: 2,
          state: 'Review',
          learningStep: 1,
          reps: 1,
          due: new Date(Date.now() + 24 * 60 * 60 * 1000),
          scheduledDays: 1,
        };

        mockDb.updateCard.mockResolvedValue(relearningCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(2, 'Good');

        expect(result.success).toBe(true);
        expect(result.interval).toBeGreaterThan(0);
      });
    });

    describe('Review Card Transitions', () => {
      it('should move review card to relearning when failed', async () => {
        mockDb.getCardById.mockReturnValue({
          id: 3,
          state: 'Review',
          lapses: 0,
        });

        const relearningCard = {
          id: 3,
          state: 'Relearning',
          learningStep: 0,
          lapses: 1,
          due: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes (relearning step)
        };

        mockDb.updateCard.mockResolvedValue(relearningCard);
        mockDb.addReviewLog.mockResolvedValue({});

        const result = await fsrsService.reviewCard(3, 'Again');

        expect(result.success).toBe(true);
        expect(mockDb.updateCard).toHaveBeenCalledWith(
          3,
          expect.objectContaining({
            state: 'Relearning',
            learningStep: 0,
            lapses: 1,
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.getCardById.mockRejectedValue(new Error('Database connection failed'));

      const result = await fsrsService.reviewCard(1, 'Good');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle missing card gracefully', async () => {
      mockDb.getCardById.mockResolvedValue(null);

      const result = await fsrsService.reviewCard(999, 'Good');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Settings Integration', () => {
    it('should respect user settings changes', async () => {
      // Start with task-driven mode
      expect((fsrsService as any).userSettings.enableTraditionalLearningSteps).toBe(false);

      // Simulate settings change to traditional mode
      const { addSettingsChangeListener } = await import('./shared/utils/settingsService');
      const settingsChangeCallback = vi.mocked(addSettingsChangeListener).mock.calls[0][0];
      settingsChangeCallback({ 
        learningSteps: '1 10',
        relearningSteps: '10',
        dailyNewCardsLimit: 20,
        dailyReviewLimit: 200,
        enableTraditionalLearningSteps: true 
      });

      expect((fsrsService as any).userSettings.enableTraditionalLearningSteps).toBe(true);
    });
  });
}); 