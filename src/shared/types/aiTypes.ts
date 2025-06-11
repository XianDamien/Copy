import type { NoteType } from './index';

// Enhanced Note Context for AI integration
export interface NoteContext {
  noteType: NoteType;
  allFields: Record<string, string>;  // All note field contents flattened
  currentField: string;               // Which field is being edited
  selectedText: string;               // Currently selected text
  noteId?: number;                   // Note ID if editing existing note
  deckId?: number;                   // Deck ID for additional context
}

// AI Insight Request types
export type AIAction = 'define' | 'explain' | 'translate' | 'grammar' | 'context';

export interface AIInsightRequest {
  action: AIAction;
  selectedText: string;
  context: NoteContext;
  timestamp: Date;
}

// AI Response interface
export interface AIInsightResponse {
  action: AIAction;
  selectedText: string;
  insight: string;                   // The AI-generated insight
  suggestion?: string;               // Optional suggestion for improvement
  examples?: string[];               // Optional usage examples
  confidence?: number;               // AI confidence score (0-1)
  timestamp: Date;
}

// AI Service Status
export interface AIServiceState {
  available: boolean;
  loading: boolean;
  error: string | null;
  lastRequest: AIInsightRequest | null;
}

// Context Collection Configuration
export interface ContextCollectionConfig {
  includeEmpty: boolean;             // Whether to include empty fields
  maxFieldLength: number;            // Max characters per field for AI context
  priorityFields: string[];          // Fields to prioritize if context is too long
}

// AI Insight Overlay Position
export interface OverlayPosition {
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

// Default configuration values
export const DEFAULT_CONTEXT_CONFIG: ContextCollectionConfig = {
  includeEmpty: false,
  maxFieldLength: 1000,
  priorityFields: ['chinese', 'english', 'originalText', 'userTranslation', 'content']
};

// AI Action descriptions for UI
export const AI_ACTION_LABELS: Record<AIAction, string> = {
  define: '定义解释',
  explain: '详细说明', 
  translate: '翻译助手',
  grammar: '语法分析',
  context: '上下文理解'
};

export const AI_ACTION_DESCRIPTIONS: Record<AIAction, string> = {
  define: '获取单词或短语的定义',
  explain: '深入解释概念或用法',
  translate: '提供翻译建议',
  grammar: '分析语法结构',
  context: '基于笔记内容提供理解'
}; 