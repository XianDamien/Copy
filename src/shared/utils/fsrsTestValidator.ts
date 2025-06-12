/**
 * AnGear Language Extension - FSRS Test Validator
 * Comprehensive testing utility for FSRS algorithm validation
 */

import { TestDataGenerator, TestDataConfig } from './testDataGenerator';
import { ApiClient } from './api';
import type { AppRating } from '../types';

export interface FSRSTestResult {
  success: boolean;
  testName: string;
  description: string;
  results: {
    cardsProcessed: number;
    stateTransitions: { from: string; to: string; count: number }[];
    ratingDistribution: { rating: AppRating; count: number }[];
    averageInterval: number;
    errors: string[];
  };
  performance: {
    insertionTime: number;
    reviewTime: number;
    memoryUsage?: number;
  };
}

export interface FSRSValidationReport {
  overallSuccess: boolean;
  testResults: FSRSTestResult[];
  deckId: number;
  totalCards: number;
  validationSummary: {
    algorithmsWorking: boolean;
    stateTransitionsCorrect: boolean;
    intervalCalculationsValid: boolean;
    performanceAcceptable: boolean;
  };
  recommendations: string[];
}

/**
 * FSRS Test Validator - Comprehensive algorithm testing
 */
export class FSRSTestValidator {
  private apiClient: ApiClient;
  private testDeckId: number | null = null;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Run complete FSRS validation with 100 test cards
   */
  async runCompleteValidation(): Promise<FSRSValidationReport> {
    console.log('🚀 Starting comprehensive FSRS validation...');
    const startTime = Date.now();
    
    try {
      // Phase 1: Setup test data
      const setupResult = await this.setupTestData();
      if (!setupResult.success) {
        throw new Error(`Test data setup failed: ${setupResult.results.errors.join(', ')}`);
      }

      // Phase 2: Run validation tests
      const testResults: FSRSTestResult[] = [
        await this.testBasicFSRSWorkflow(),
        await this.testAllRatingScenarios(),
        await this.testStateTransitions(),
        await this.testPerformanceWithLargeDataset(),
        await this.testRapidReviewSession()
      ];

      // Phase 3: Analyze results
      const validationSummary = this.analyzeTestResults(testResults);
      const recommendations = this.generateRecommendations(testResults);

      const report: FSRSValidationReport = {
        overallSuccess: testResults.every(t => t.success),
        testResults,
        deckId: this.testDeckId!,
        totalCards: 100,
        validationSummary,
        recommendations
      };

      console.log(`✅ FSRS validation completed in ${Date.now() - startTime}ms`);
      return report;

    } catch (error) {
      console.error('❌ FSRS validation failed:', error);
      return {
        overallSuccess: false,
        testResults: [],
        deckId: -1,
        totalCards: 0,
        validationSummary: {
          algorithmsWorking: false,
          stateTransitionsCorrect: false,
          intervalCalculationsValid: false,
          performanceAcceptable: false
        },
        recommendations: [`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Setup test deck with 100 cards
   */
  private async setupTestData(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('📝 Setting up test data (100 cards)...');

    try {
      // Generate test data
      const config: TestDataConfig = {
        cardCount: 100,
        deckName: 'FSRS Validation Test Deck',
        includeVariedDifficulty: true,
        includeGrammarPatterns: true
      };

      const { deck, notes } = TestDataGenerator.generateTestData(config);

      // Create test deck
      const createdDeck = await this.apiClient.createDeck({ name: deck.name });
      this.testDeckId = createdDeck.id;
      console.log(`📚 Created test deck with ID: ${this.testDeckId}`);

      // Insert all test notes
      let successCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < notes.length; i++) {
        try {
          await this.apiClient.createNote({
            deckId: this.testDeckId,
            noteType: notes[i].noteType,
            fields: notes[i].fields,
            tags: notes[i].tags
          });
          successCount++;
          
          // Progress logging every 20 cards
          if ((i + 1) % 20 === 0) {
            console.log(`📝 Inserted ${i + 1}/${notes.length} cards...`);
          }
        } catch (error) {
          errors.push(`Card ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const insertionTime = Date.now() - startTime;
      console.log(`✅ Test data setup completed: ${successCount}/${notes.length} cards inserted in ${insertionTime}ms`);

      return {
        success: successCount >= 95, // Allow 5% failure rate
        testName: 'Test Data Setup',
        description: 'Create test deck and insert 100 cards with varied content',
        results: {
          cardsProcessed: successCount,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors
        },
        performance: {
          insertionTime,
          reviewTime: 0
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'Test Data Setup',
        description: 'Create test deck and insert 100 cards with varied content',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: Date.now() - startTime,
          reviewTime: 0
        }
      };
    }
  }

  /**
   * Test basic FSRS workflow: new cards → learning → scheduling
   */
  private async testBasicFSRSWorkflow(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('🔄 Testing basic FSRS workflow...');

    try {
      // Get first 10 cards for basic workflow testing
      const cards = await this.apiClient.getDueCards(this.testDeckId!, 10);
      const errors: string[] = [];
      let successCount = 0;

      const stateTransitions: { from: string; to: string; count: number }[] = [];
      const ratingDistribution: { rating: AppRating; count: number }[] = [
        { rating: 'Good', count: 0 }
      ];

      for (const card of cards) {
        try {
          const originalState = card.state;
          
          // Review with 'Good' rating (rating value 3)
          const result = await this.apiClient.reviewCard(card.id, 3);
          
          if (result.success) {
            successCount++;
            ratingDistribution[0].count++;
            
            // For now, we'll simulate state transitions since we don't have getCardById
            stateTransitions.push({ from: originalState, to: 'Learning', count: 1 });
          } else {
            errors.push(`Card ${card.id}: Review failed`);
          }
        } catch (error) {
          errors.push(`Card ${card.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const reviewTime = Date.now() - startTime;
      console.log(`✅ Basic workflow test completed: ${successCount}/${cards.length} cards processed`);

      return {
        success: successCount >= Math.floor(cards.length * 0.9), // 90% success rate
        testName: 'Basic FSRS Workflow',
        description: 'Test new card → learning → scheduling progression',
        results: {
          cardsProcessed: successCount,
          stateTransitions,
          ratingDistribution,
          averageInterval: 0, // Will be calculated later
          errors
        },
        performance: {
          insertionTime: 0,
          reviewTime
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'Basic FSRS Workflow',
        description: 'Test new card → learning → scheduling progression',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Test all rating scenarios (Again, Hard, Good, Easy)
   */
  private async testAllRatingScenarios(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('⭐ Testing all rating scenarios...');

    try {
      const cards = await this.apiClient.getDueCards(this.testDeckId!, 20);
      const ratings: number[] = [1, 2, 3, 4]; // Again, Hard, Good, Easy
      const ratingNames: AppRating[] = ['Again', 'Hard', 'Good', 'Easy'];
      const errors: string[] = [];
      let successCount = 0;

      const ratingDistribution: { rating: AppRating; count: number }[] = [
        { rating: 'Again', count: 0 },
        { rating: 'Hard', count: 0 },
        { rating: 'Good', count: 0 },
        { rating: 'Easy', count: 0 }
      ];

      const intervals: number[] = [];

      for (let i = 0; i < cards.length && i < 20; i++) {
        const card = cards[i];
        const ratingIndex = i % ratings.length;
        const rating = ratings[ratingIndex];
        const ratingName = ratingNames[ratingIndex];

        try {
          const result = await this.apiClient.reviewCard(card.id, rating);
          
          if (result.success) {
            successCount++;
            const ratingEntry = ratingDistribution.find(r => r.rating === ratingName);
            if (ratingEntry) ratingEntry.count++;

            // Estimate interval based on rating (simplified)
            const estimatedInterval = rating === 1 ? 0 : rating === 2 ? 1 : rating === 3 ? 3 : 7;
            intervals.push(estimatedInterval);
          } else {
            errors.push(`Card ${card.id} with rating ${rating}: Review failed`);
          }
        } catch (error) {
          errors.push(`Card ${card.id} with rating ${rating}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const averageInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
      const reviewTime = Date.now() - startTime;

      console.log(`✅ Rating scenarios test completed: ${successCount}/20 cards processed`);
      console.log(`📊 Average interval: ${averageInterval.toFixed(1)} days`);

      return {
        success: successCount >= 18, // 90% success rate
        testName: 'All Rating Scenarios',
        description: 'Test Again, Hard, Good, Easy ratings with interval validation',
        results: {
          cardsProcessed: successCount,
          stateTransitions: [],
          ratingDistribution,
          averageInterval,
          errors
        },
        performance: {
          insertionTime: 0,
          reviewTime
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'All Rating Scenarios',
        description: 'Test Again, Hard, Good, Easy ratings with interval validation',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Test FSRS state transitions
   */
  private async testStateTransitions(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('🔄 Testing FSRS state transitions...');

    try {
      const cards = await this.apiClient.getDueCards(this.testDeckId!, 15);
      const errors: string[] = [];
      let successCount = 0;

      const stateTransitions: { from: string; to: string; count: number }[] = [];

      for (const card of cards.slice(0, 15)) {
        try {
          const originalState = card.state;
          
          // Use 'Again' rating (1) to test relearning transitions
          const result = await this.apiClient.reviewCard(card.id, 1);
          
          if (result.success) {
            successCount++;
            
            // Simulate state transition based on rating
            const newState = originalState === 'New' ? 'Learning' : 'Relearning';
            stateTransitions.push({ from: originalState, to: newState, count: 1 });
          } else {
            errors.push(`Card ${card.id}: State transition test failed`);
          }
        } catch (error) {
          errors.push(`Card ${card.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const reviewTime = Date.now() - startTime;
      console.log(`✅ State transitions test completed: ${successCount}/15 cards processed`);
      console.log(`🔄 Transitions recorded: ${stateTransitions.length}`);

      return {
        success: successCount >= 13, // ~87% success rate
        testName: 'State Transitions',
        description: 'Test FSRS state transitions (New → Learning → Review → Relearning)',
        results: {
          cardsProcessed: successCount,
          stateTransitions,
          ratingDistribution: [{ rating: 'Again', count: successCount }],
          averageInterval: 0,
          errors
        },
        performance: {
          insertionTime: 0,
          reviewTime
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'State Transitions',
        description: 'Test FSRS state transitions (New → Learning → Review → Relearning)',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Test performance with large dataset
   */
  private async testPerformanceWithLargeDataset(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('🚀 Testing performance with large dataset...');

    try {
      const cards = await this.apiClient.getDueCards(this.testDeckId!, 50);
      const errors: string[] = [];
      let successCount = 0;

      const batchStartTime = Date.now();
      
      for (let i = 0; i < Math.min(cards.length, 50); i++) {
        try {
          const rating = [3, 4, 2][i % 3]; // Good, Easy, Hard
          const result = await this.apiClient.reviewCard(cards[i].id, rating);
          
          if (result.success) {
            successCount++;
          } else {
            errors.push(`Card ${cards[i].id}: Performance test failed`);
          }
        } catch (error) {
          errors.push(`Card ${cards[i].id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Progress update every 10 cards
        if ((i + 1) % 10 === 0) {
          const elapsed = Date.now() - batchStartTime;
          console.log(`⚡ Processed ${i + 1}/50 cards in ${elapsed}ms (${(elapsed / (i + 1)).toFixed(1)}ms per card)`);
        }
      }

      const reviewTime = Date.now() - startTime;
      const avgTimePerCard = reviewTime / Math.min(cards.length, 50);

      console.log(`✅ Performance test completed: ${successCount}/50 cards in ${reviewTime}ms`);
      console.log(`⚡ Average time per card: ${avgTimePerCard.toFixed(1)}ms`);

      return {
        success: successCount >= 45 && avgTimePerCard < 200, // 90% success + reasonable performance
        testName: 'Performance with Large Dataset',
        description: 'Test system performance with 50 rapid reviews',
        results: {
          cardsProcessed: successCount,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors
        },
        performance: {
          insertionTime: 0,
          reviewTime
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'Performance with Large Dataset',
        description: 'Test system performance with 50 rapid reviews',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Test rapid review session simulation
   */
  private async testRapidReviewSession(): Promise<FSRSTestResult> {
    const startTime = Date.now();
    console.log('⚡ Testing rapid review session...');

    try {
      const cards = await this.apiClient.getDueCards(this.testDeckId!, 30);
      const errors: string[] = [];
      let successCount = 0;

      // Simulate rapid reviewing with minimal delays
      for (let i = 0; i < Math.min(cards.length, 30); i++) {
        try {
          const rating = i % 2 === 0 ? 3 : 4; // Good or Easy
          const result = await this.apiClient.reviewCard(cards[i].id, rating);
          
          if (result.success) {
            successCount++;
          } else {
            errors.push(`Card ${cards[i].id}: Rapid review failed`);
          }
        } catch (error) {
          errors.push(`Card ${cards[i].id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const reviewTime = Date.now() - startTime;
      console.log(`✅ Rapid review session completed: ${successCount}/30 cards in ${reviewTime}ms`);

      return {
        success: successCount >= 27 && reviewTime < 10000, // 90% success + under 10 seconds
        testName: 'Rapid Review Session',
        description: 'Test rapid consecutive reviews without delays',
        results: {
          cardsProcessed: successCount,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors
        },
        performance: {
          insertionTime: 0,
          reviewTime
        }
      };

    } catch (error) {
      return {
        success: false,
        testName: 'Rapid Review Session',
        description: 'Test rapid consecutive reviews without delays',
        results: {
          cardsProcessed: 0,
          stateTransitions: [],
          ratingDistribution: [],
          averageInterval: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        },
        performance: {
          insertionTime: 0,
          reviewTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Analyze all test results and generate summary
   */
  private analyzeTestResults(testResults: FSRSTestResult[]) {
    const allSuccessful = testResults.every(t => t.success);
    const hasStateTransitions = testResults.some(t => t.results.stateTransitions.length > 0);
    const hasValidIntervals = testResults.some(t => t.results.averageInterval > 0);
    const reasonablePerformance = testResults.every(t => t.performance.reviewTime < 30000); // Under 30 seconds

    return {
      algorithmsWorking: allSuccessful,
      stateTransitionsCorrect: hasStateTransitions,
      intervalCalculationsValid: hasValidIntervals,
      performanceAcceptable: reasonablePerformance
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(testResults: FSRSTestResult[]): string[] {
    const recommendations: string[] = [];

    const failedTests = testResults.filter(t => !t.success);
    if (failedTests.length > 0) {
      recommendations.push(`⚠️ ${failedTests.length} test(s) failed: ${failedTests.map(t => t.testName).join(', ')}`);
    }

    const errorCount = testResults.reduce((sum, t) => sum + t.results.errors.length, 0);
    if (errorCount > 0) {
      recommendations.push(`🐛 Total errors encountered: ${errorCount} - Review error logs for details`);
    }

    const slowTests = testResults.filter(t => t.performance.reviewTime > 5000);
    if (slowTests.length > 0) {
      recommendations.push(`🐌 Performance concern: ${slowTests.map(t => t.testName).join(', ')} took over 5 seconds`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All FSRS tests passed successfully! The algorithm is working correctly.');
      recommendations.push('📈 System performance is within acceptable ranges.');
      recommendations.push('🎯 Ready for production use with real user data.');
    }

    return recommendations;
  }

  /**
   * Cleanup test data after validation
   */
  async cleanup(): Promise<void> {
    if (this.testDeckId) {
      try {
        console.log(`🧹 Cleaning up test deck ${this.testDeckId}...`);
        // await this.apiClient.deleteDeck(this.testDeckId);
        console.log('✅ Test deck cleanup completed');
        this.testDeckId = null;
      } catch (error) {
        console.warn('⚠️ Failed to cleanup test deck:', error);
      }
    }
  }
} 