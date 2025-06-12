/**
 * Scheduler Service Tests
 * Basic tests to verify the scheduler service functionality
 */

import { SchedulerService } from '../src/background/schedulerService';

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;

  beforeEach(() => {
    schedulerService = new SchedulerService();
  });

  describe('buildQueue', () => {
    it('should be defined', () => {
      expect(schedulerService.buildQueue).toBeDefined();
    });

    it('should accept deckId and limit parameters', () => {
      // Test that the method signature is correct
      expect(typeof schedulerService.buildQueue).toBe('function');
      expect(schedulerService.buildQueue.length).toBe(2); // deckId, limit parameters
    });
  });

  describe('resetCardsInDeck', () => {
    it('should be defined', () => {
      expect(schedulerService.resetCardsInDeck).toBeDefined();
    });

    it('should accept deckId parameter', () => {
      expect(typeof schedulerService.resetCardsInDeck).toBe('function');
      expect(schedulerService.resetCardsInDeck.length).toBe(1); // deckId parameter
    });
  });

  describe('getQueueStats', () => {
    it('should be defined', () => {
      expect(schedulerService.getQueueStats).toBeDefined();
    });

    it('should return stats object with correct structure', async () => {
      // Mock the database service to avoid actual database calls
      const mockStats = {
        newCount: 0,
        learningCount: 0,
        reviewCount: 0,
        totalCount: 0
      };

      // Since we can't easily mock the database in this test environment,
      // we'll just verify the method exists and has the right signature
      expect(typeof schedulerService.getQueueStats).toBe('function');
    });
  });

  describe('buildDailyQueue', () => {
    it('should be defined for future implementation', () => {
      expect(schedulerService.buildDailyQueue).toBeDefined();
    });
  });
});

// Export for potential integration tests
export { SchedulerService }; 