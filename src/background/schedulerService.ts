/**
 * Scheduler Service - Phase 2.2 FSRS Overhaul Foundation
 * 
 * This service provides the foundation for proper FSRS queue management.
 * Phase 1: Basic queue building (placeholder implementation)
 * Phase 2: Full FSRS daily queue with new/learning/review separation
 */

import { Card } from '../shared/types';
import { dbService } from './db';

export interface QueueResult {
  cards: Card[];
  newCards: Card[];
  learningCards: Card[];
  reviewCards: Card[];
  totalCount: number;
}

export class SchedulerService {
  /**
   * Build a queue of cards for review
   * Phase 1: Placeholder implementation using existing getDueCards logic
   * Phase 2: Will implement proper FSRS daily queue building
   */
  async buildQueue(deckId: number | null, limit: number = 20): Promise<Card[]> {
    try {
      console.log(`SchedulerService: Building queue for deck ${deckId}, limit ${limit}`);
      
      // Phase 1: Use existing logic as placeholder
      // This maintains compatibility while we build the new architecture
      const dueCards = await dbService.getDueCards(deckId || undefined, limit);
      
      console.log(`SchedulerService: Found ${dueCards.length} due cards`);
      return dueCards;
    } catch (error) {
      console.error('SchedulerService: Error building queue:', error);
      throw new Error(`Failed to build review queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a comprehensive daily queue with proper FSRS logic
   * This will be implemented in the next task (Phase 2.2.2)
   */
  async buildDailyQueue(deckId: number | null): Promise<QueueResult> {
    // Placeholder for future implementation
    const cards = await this.buildQueue(deckId);
    
    return {
      cards,
      newCards: cards.filter(card => card.state === 'New'),
      learningCards: cards.filter(card => card.state === 'Learning'),
      reviewCards: cards.filter(card => card.state === 'Review'),
      totalCount: cards.length
    };
  }

  /**
   * Get new cards for learning
   * Future implementation for proper FSRS queue management
   */
  async getNewCards(deckId: number | null, limit: number): Promise<Card[]> {
    // Placeholder implementation
    if (deckId === null) {
      // Get cards from all decks - need to implement this in db service
      const allDecks = await dbService.getAllDecks();
      const allCards: Card[] = [];
      for (const deck of allDecks) {
        const deckCards = await dbService.getCardsByDeckId(deck.id);
        allCards.push(...deckCards);
      }
      return allCards
        .filter(card => card.state === 'New')
        .slice(0, limit);
    } else {
      const allCards = await dbService.getCardsByDeckId(deckId);
      return allCards
        .filter(card => card.state === 'New')
        .slice(0, limit);
    }
  }

  /**
   * Get learning cards that are due
   * Future implementation for proper FSRS queue management
   */
  async getLearningCards(deckId: number | null): Promise<Card[]> {
    // Placeholder implementation
    const now = new Date();
    
    if (deckId === null) {
      // Get cards from all decks
      const allDecks = await dbService.getAllDecks();
      const allCards: Card[] = [];
      for (const deck of allDecks) {
        const deckCards = await dbService.getCardsByDeckId(deck.id);
        allCards.push(...deckCards);
      }
      return allCards.filter(card => {
        if (card.state !== 'Learning') return false;
        if (!card.due) return true; // Learning cards without due date are ready
        return new Date(card.due) <= now;
      });
    } else {
      const allCards = await dbService.getCardsByDeckId(deckId);
      return allCards.filter(card => {
        if (card.state !== 'Learning') return false;
        if (!card.due) return true; // Learning cards without due date are ready
        return new Date(card.due) <= now;
      });
    }
  }

  /**
   * Get review cards that are due
   * Future implementation for proper FSRS queue management
   */
  async getReviewCards(deckId: number | null, limit: number): Promise<Card[]> {
    // Placeholder implementation
    const now = new Date();
    
    if (deckId === null) {
      // Get cards from all decks
      const allDecks = await dbService.getAllDecks();
      const allCards: Card[] = [];
      for (const deck of allDecks) {
        const deckCards = await dbService.getCardsByDeckId(deck.id);
        allCards.push(...deckCards);
      }
      return allCards
        .filter(card => {
          if (card.state !== 'Review') return false;
          if (!card.due) return false;
          return new Date(card.due) <= now;
        })
        .slice(0, limit);
    } else {
      const allCards = await dbService.getCardsByDeckId(deckId);
      return allCards
        .filter(card => {
          if (card.state !== 'Review') return false;
          if (!card.due) return false;
          return new Date(card.due) <= now;
        })
        .slice(0, limit);
    }
  }

  /**
   * Reset all cards in a deck (or all cards if deckId is null)
   * This provides bulk reset functionality for the UI
   */
  async resetCardsInDeck(deckId: number | null): Promise<number> {
    try {
      console.log(`SchedulerService: Resetting cards in deck ${deckId || 'all decks'}`);
      
      const resetCount = await dbService.resetCardsInDeck(deckId);
      
      console.log(`SchedulerService: Successfully reset ${resetCount} cards`);
      return resetCount;
    } catch (error) {
      console.error('SchedulerService: Error resetting cards:', error);
      throw new Error(`Failed to reset cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get statistics about the current queue state
   * Useful for UI display and debugging
   */
  async getQueueStats(deckId: number | null): Promise<{
    newCount: number;
    learningCount: number;
    reviewCount: number;
    totalCount: number;
  }> {
    try {
      const now = new Date();
      let allCards: Card[];
      
      if (deckId === null) {
        // Get cards from all decks
        const allDecks = await dbService.getAllDecks();
        allCards = [];
        for (const deck of allDecks) {
          const deckCards = await dbService.getCardsByDeckId(deck.id);
          allCards.push(...deckCards);
        }
      } else {
        allCards = await dbService.getCardsByDeckId(deckId);
      }
      
      const newCount = allCards.filter(card => card.state === 'New').length;
      const learningCount = allCards.filter(card => 
        card.state === 'Learning' && (!card.due || new Date(card.due) <= now)
      ).length;
      const reviewCount = allCards.filter(card => 
        card.state === 'Review' && card.due && new Date(card.due) <= now
      ).length;
      
      return {
        newCount,
        learningCount,
        reviewCount,
        totalCount: newCount + learningCount + reviewCount
      };
    } catch (error) {
      console.error('SchedulerService: Error getting queue stats:', error);
      return { newCount: 0, learningCount: 0, reviewCount: 0, totalCount: 0 };
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService(); 