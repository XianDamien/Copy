import { useState, useCallback, useRef } from 'react';
import { getAIService, AIServiceError } from '../services/aiService';
import type { 
  AIAction, 
  AIInsightRequest, 
  AIInsightResponse, 
  NoteContext,
  AIServiceState 
} from '../types/aiTypes';

export interface UseAIServiceResult {
  // State
  loading: boolean;
  error: string | null;
  response: AIInsightResponse | null;
  
  // Actions
  makeRequest: (action: AIAction, selectedText: string, context: NoteContext) => Promise<void>;
  clearResponse: () => void;
  clearError: () => void;
  
  // Service status
  serviceStatus: AIServiceState;
}

export interface UseAIServiceOptions {
  onSuccess?: (response: AIInsightResponse) => void;
  onError?: (error: string) => void;
  autoRetry?: boolean;
  retryDelay?: number;
}

/**
 * Custom hook for AI service integration
 * Provides state management and easy API for AI requests
 */
export function useAIService(options: UseAIServiceOptions = {}): UseAIServiceResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIInsightResponse | null>(null);
  
  const aiService = getAIService();
  const abortController = useRef<AbortController | null>(null);
  
  const {
    onSuccess,
    onError,
    autoRetry = true,
    retryDelay = 2000
  } = options;

  /**
   * Make AI request with state management
   */
  const makeRequest = useCallback(async (
    action: AIAction,
    selectedText: string,
    context: NoteContext
  ): Promise<void> => {
    // Abort any ongoing request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller
    abortController.current = new AbortController();
    
    // Reset state
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const request: AIInsightRequest = {
        action,
        selectedText,
        context,
        timestamp: new Date()
      };
      
      const aiResponse = await aiService.makeRequest(request);
      
      // Check if request was aborted
      if (abortController.current?.signal.aborted) {
        return;
      }
      
      setResponse(aiResponse);
      setLoading(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(aiResponse);
      }
      
    } catch (err) {
      // Check if request was aborted
      if (abortController.current?.signal.aborted) {
        return;
      }
      
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setLoading(false);
      
      // Call error callback
      if (onError) {
        onError(errorMessage);
      }
      
      // Auto retry for retryable errors
      if (autoRetry && err instanceof AIServiceError && err.retry) {
        setTimeout(() => {
          if (!abortController.current?.signal.aborted) {
            makeRequest(action, selectedText, context);
          }
        }, retryDelay);
      }
    }
  }, [aiService, onSuccess, onError, autoRetry, retryDelay]);

  /**
   * Clear current response
   */
  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get service status
   */
  const serviceStatus = aiService.getStatus();

  return {
    loading,
    error,
    response,
    makeRequest,
    clearResponse,
    clearError,
    serviceStatus
  };
}

/**
 * Extract user-friendly error message from error object
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'INVALID_TEXT':
        return '请选择有效的文本进行AI分析';
      case 'TEXT_TOO_LONG':
        return '选择的文本过长，请选择较短的文本';
      case 'MISSING_CONTEXT':
        return '缺少上下文信息，请重试';
      case 'CONTEXT7_ERROR':
        return 'AI服务连接失败，请检查网络连接';
      case 'MAX_RETRIES_EXCEEDED':
        return 'AI服务暂时不可用，请稍后重试';
      default:
        return `AI服务错误：${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'AI服务发生未知错误';
}

/**
 * Hook for simplified AI actions
 * Provides pre-configured functions for common AI actions
 */
export function useAIActions(context: NoteContext, options: UseAIServiceOptions = {}) {
  const aiService = useAIService(options);
  
  return {
    ...aiService,
    
    // Simplified action functions
    define: (text: string) => aiService.makeRequest('define', text, context),
    explain: (text: string) => aiService.makeRequest('explain', text, context),
    translate: (text: string) => aiService.makeRequest('translate', text, context),
    checkGrammar: (text: string) => aiService.makeRequest('grammar', text, context),
    getContext: (text: string) => aiService.makeRequest('context', text, context),
  };
}

/**
 * Hook for batch AI requests
 * Useful for processing multiple text selections
 */
export function useBatchAIService(options: UseAIServiceOptions = {}) {
  const [requests, setRequests] = useState<Map<string, {
    loading: boolean;
    error: string | null;
    response: AIInsightResponse | null;
  }>>(new Map());
  
  const aiService = getAIService();
  
  const makeBatchRequest = useCallback(async (
    requestId: string,
    action: AIAction,
    selectedText: string,
    context: NoteContext
  ): Promise<void> => {
    // Update request state
    setRequests(prev => new Map(prev).set(requestId, {
      loading: true,
      error: null,
      response: null
    }));
    
    try {
      const request: AIInsightRequest = {
        action,
        selectedText,
        context,
        timestamp: new Date()
      };
      
      const response = await aiService.makeRequest(request);
      
      // Update with success
      setRequests(prev => new Map(prev).set(requestId, {
        loading: false,
        error: null,
        response
      }));
      
      if (options.onSuccess) {
        options.onSuccess(response);
      }
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      
      // Update with error
      setRequests(prev => new Map(prev).set(requestId, {
        loading: false,
        error: errorMessage,
        response: null
      }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }
    }
  }, [aiService, options]);
  
  const clearRequest = useCallback((requestId: string) => {
    setRequests(prev => {
      const newMap = new Map(prev);
      newMap.delete(requestId);
      return newMap;
    });
  }, []);
  
  const clearAllRequests = useCallback(() => {
    setRequests(new Map());
  }, []);
  
  return {
    requests,
    makeBatchRequest,
    clearRequest,
    clearAllRequests
  };
} 