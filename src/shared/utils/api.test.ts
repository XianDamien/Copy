import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from './api';
import type { ApiResponse } from '../types';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendMessage = vi.fn();
    global.chrome = {
      ...global.chrome,
      runtime: {
        ...global.chrome.runtime,
        sendMessage: mockSendMessage,
      },
    } as any;

    apiClient = new ApiClient();
  });

  describe('Deck Operations', () => {
    it('should create deck successfully', async () => {
      const deckData = {
        name: '测试牌组',
        description: '测试描述',
        fsrsConfig: {
          requestRetention: 0.9,
          maximumInterval: 36500,
          easyBonus: 1.3,
          hardFactor: 1.2,
        },
      };

      const expectedResponse: ApiResponse = {
        success: true,
        data: {
          id: 1,
          ...deckData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockSendMessage.mockResolvedValue(expectedResponse);

      const result = await apiClient.createDeck(deckData);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'CREATE_DECK',
        payload: deckData,
      });
      expect(result).toEqual(expectedResponse.data);
    });

    it('should handle API errors', async () => {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Database connection failed',
      };

      mockSendMessage.mockResolvedValue(errorResponse);

      await expect(apiClient.getAllDecks()).rejects.toThrow('Database connection failed');
    });
  });
}); 