import type { 
  AIAction, 
  AIInsightRequest, 
  AIInsightResponse, 
  // NoteContext,
  AIServiceState 
} from '../types/aiTypes';

// AI Service Configuration
export interface AIServiceConfig {
  maxRetries: number;
  timeoutMs: number;
  retryDelayMs: number;
}

export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  maxRetries: 3,
  timeoutMs: 10000,
  retryDelayMs: 1000,
};

// AI Service Error Types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retry: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// Action to Context7 Library ID mapping
// const CONTEXT7_LIBRARY_MAP = {
//   define: '/cambridge/dictionary',
//   explain: '/openai/gpt-4',
//   translate: '/google/translate',
//   grammar: '/grammarly/docs',
//   context: '/openai/gpt-4'
// } as const;

// Action to prompt template mapping
// const PROMPT_TEMPLATES = {
//   define: (text: string, context: NoteContext) => 
//     `Define the word or phrase "${text}" in the context of language learning. Consider the learning context: ${JSON.stringify(context.allFields)}.`,
//   
//   explain: (text: string, context: NoteContext) => 
//     `Explain the meaning and usage of "${text}" in detail. Context: ${JSON.stringify(context.allFields)}. Provide examples and usage patterns.`,
//   
//   translate: (text: string, context: NoteContext) => 
//     `Translate "${text}" and provide context-aware translation considering the learning material: ${JSON.stringify(context.allFields)}.`,
//   
//   grammar: (text: string, context: NoteContext) => 
//     `Analyze the grammar of "${text}" and provide corrections or explanations. Context: ${JSON.stringify(context.allFields)}.`,
//   
//   context: (text: string, context: NoteContext) => 
//     `Provide contextual information about "${text}" based on the learning material: ${JSON.stringify(context.allFields)}. Explain how it fits in the overall content.`
// } as const;

/**
 * Core AI Service for Context7 Integration
 */
export class AIService {
  private config: AIServiceConfig;
  private context7Available: boolean = false;

  constructor(config: AIServiceConfig = DEFAULT_AI_CONFIG) {
    this.config = config;
    this.checkContext7Availability();
  }

  /**
   * Check if Context7 MCP is available
   */
  private async checkContext7Availability(): Promise<void> {
    try {
      // Check if we have access to Context7 MCP functions
      // This will be enhanced when we have actual MCP integration
      this.context7Available = typeof window !== 'undefined';
    } catch (error) {
      console.warn('Context7 MCP not available, using fallback mode');
      this.context7Available = false;
    }
  }

  /**
   * Make AI request with proper error handling and retries
   */
  async makeRequest(request: AIInsightRequest): Promise<AIInsightResponse> {
    const { action, selectedText } = request;
    
    // Validate request
    this.validateRequest(request);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.executeRequest(action, selectedText);
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof AIServiceError && !error.retry) {
          throw error; // Don't retry non-retryable errors
        }
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
          continue;
        }
      }
    }
    
    throw new AIServiceError(
      `Failed to get AI response after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      false
    );
  }

  /**
   * Execute single AI request
   */
  private async executeRequest(
    action: AIAction, 
    selectedText: string, 
    // context: NoteContext
  ): Promise<AIInsightResponse> {
    if (this.context7Available) {
      return await this.executeContext7Request(action, selectedText);
    } else {
      return await this.executeFallbackRequest(action, selectedText);
    }
  }

  /**
   * Execute request using Context7 MCP
   */
  private async executeContext7Request(
    action: AIAction,
    selectedText: string
    // context: NoteContext
  ): Promise<AIInsightResponse> {
    try {
      // const libraryId = CONTEXT7_LIBRARY_MAP[action];
      // const prompt = PROMPT_TEMPLATES[action](selectedText, context);
      
      // This would use actual Context7 MCP integration
      // For now, we'll simulate the response structure
      const response = await this.simulateContext7Response(action, selectedText);
      
      return {
        action,
        selectedText,
        insight: response.insight,
        suggestion: response.suggestion,
        examples: response.examples,
        confidence: response.confidence,
        timestamp: new Date()
      };
    } catch (error) {
      throw new AIServiceError(
        `Context7 request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONTEXT7_ERROR',
        true
      );
    }
  }

  /**
   * Simulate Context7 response (placeholder for actual integration)
   */
  private async simulateContext7Response(
    action: AIAction,
    selectedText: string
  ): Promise<{
    insight: string;
    suggestion?: string;
    examples?: string[];
    confidence?: number;
  }> {
    // Simulate network delay
    await this.delay(1000 + Math.random() * 2000);
    
    // Action-specific responses
    switch (action) {
      case 'define':
        return {
          insight: `"${selectedText}" 是一个常用的中文词汇，通常表示...`,
          suggestion: '在口语中也可以说...',
          examples: [`${selectedText}在句子中的用法：`, '例句1...', '例句2...'],
          confidence: 0.9
        };
        
      case 'explain':
        return {
          insight: `"${selectedText}" 的详细解释：这个表达方式在中文中...`,
          suggestion: '建议在以下场合使用这个表达：',
          examples: ['场合1：正式对话', '场合2：写作中'],
          confidence: 0.85
        };
        
      case 'translate':
        return {
          insight: `"${selectedText}" 的英文翻译：[Translation]`,
          suggestion: '根据语境，也可以翻译为...',
          examples: ['Translation example 1', 'Translation example 2'],
          confidence: 0.92
        };
        
      case 'grammar':
        return {
          insight: `"${selectedText}" 的语法分析：这个结构遵循...`,
          suggestion: '类似的语法结构包括：',
          examples: ['结构1：...', '结构2：...'],
          confidence: 0.88
        };
        
      case 'context':
        return {
          insight: `在当前学习内容中，"${selectedText}" 的作用是...`,
          suggestion: '建议重点关注与此相关的：',
          examples: ['相关概念1', '相关概念2'],
          confidence: 0.87
        };
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Fallback request when Context7 is not available
   */
  private async executeFallbackRequest(
    action: AIAction,
    selectedText: string
  ): Promise<AIInsightResponse> {
    // Simulate fallback processing
    await this.delay(500);
    
    return {
      action,
      selectedText,
      insight: `Fallback response for "${selectedText}": AI service is currently unavailable. Please try again later.`,
      suggestion: 'AI 服务暂时不可用，请稍后重试。',
      confidence: 0.1,
      timestamp: new Date()
    };
  }

  /**
   * Validate AI request
   */
  private validateRequest(request: AIInsightRequest): void {
    const { selectedText, context } = request;
    
    if (!selectedText || selectedText.trim().length === 0) {
      throw new AIServiceError(
        'Selected text cannot be empty',
        'INVALID_TEXT',
        false
      );
    }
    
    if (selectedText.length > 1000) {
      throw new AIServiceError(
        'Selected text is too long (max 1000 characters)',
        'TEXT_TOO_LONG',
        false
      );
    }
    
    if (!context || !context.noteType) {
      throw new AIServiceError(
        'Context information is required',
        'MISSING_CONTEXT',
        false
      );
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  getStatus(): AIServiceState {
    return {
      available: this.context7Available,
      loading: false,
      error: null,
      lastRequest: null
    };
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get singleton AI service instance
 */
export function getAIService(config?: AIServiceConfig): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
}

/**
 * Reset AI service instance (for testing)
 */
export function resetAIService(): void {
  aiServiceInstance = null;
} 