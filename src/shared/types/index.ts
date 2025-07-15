/**
 * LanGear Language Extension - Type Definitions
 * 共享类型定义文件
 */

// ==================== Chrome Extension 相关类型 ====================

export interface ChromeMessage {
  type: string;
  payload?: any;
  source?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== FSRS 相关类型 ====================

export interface FSRSConfig {
  requestRetention: number;    // 期望记忆保持率 0.8-0.95
  maximumInterval: number;     // 最大复习间隔（天）
  easyBonus: number;          // 简单加成因子
  hardFactor: number;         // 困难惩罚因子
  enableShortTerm?: boolean;  // 启用短期记忆模式
}

export type AppRating = 'Again' | 'Hard' | 'Good' | 'Easy';
export type Rating = 1 | 2 | 3 | 4; // FSRS算法评分

export type CardState = 'New' | 'Learning' | 'Review' | 'Relearning';

// ==================== 数据库实体类型 ====================

export interface Deck {
  id: number;
  name: string;
  description?: string;
  fsrsConfig: FSRSConfig;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteType = 'CtoE' | 'Retranslate' | 'SentenceParaphrase' | 'Article' | 'audio_subtitle';



export interface NoteFields {
  CtoE: {
    chinese: string;
    english: string;
    pinyin?: string;
    userTranslation?: string;
    notes?: string;
  };
  Retranslate: {
    originalText: string;
    targetLanguage: string;
    userTranslation?: string;
    referenceTranslation: string;
    notes?: string;
  };
  SentenceParaphrase: {
    title: string;
    originalAudioId: string;
    segments: AudioSegment[];
    userLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  Article: {
    title: string;
    content: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questions: ArticleQuestion[];
  };
  audio_subtitle: {
    originalText: string;
    translatedText: string;
    audioId: string;
    startTime: number;
    endTime: number;
    duration: number;
    sourceFile: string;
  };
}

export interface Note {
  id: number;
  deckId: number;
  noteType: NoteType;
  fields: Partial<NoteFields>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CardType = NoteType | 'forward' | 'reverse' | 'audio_comprehension';

export interface Card {
  id: number;
  noteId: number;
  deckId: number;
  cardType: CardType;
  state: CardState;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: Date;
  learningStep: number; // Task-driven mode: 0=task pending, 1=task complete. Traditional mode: tracks step index
  audioId?: string; // Optional reference to audio clip in AudioStore
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewLog {
  id: number;
  cardId: number;
  reviewTime: Date;
  rating: Rating;
  stateBefore: CardState;
  stateAfter: CardState;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  interval: number;
  lastInterval: number;
}

// ==================== 音频相关类型 ====================

export interface AudioStore {
  id: string;
  audioData: Blob;
  mimeType: string;
  duration?: number;
  createdAt: Date;
}

export interface AudioSegment {
  id: string;
  segmentText: string;
  startTime: number;
  endTime: number;
  userRecordingId?: string;
  aiFeedback?: string;
}

// ==================== 文章阅读相关类型 ====================

export interface ArticleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// ==================== 统计相关类型 ====================

export interface DeckStatistics {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
  totalNotes: number;
}

export interface LearningProgress {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  averageRetention: number;
  studyStreak: number;
}

export interface StudySchedule {
  immediateReview: number;
  todayTotal: number;
  tomorrowTotal: number;
  recommendedDailyLimit: number;
}

// ==================== UI 相关类型 ====================

export interface UIState {
  currentDeckId?: number;
  isReviewing: boolean;
  showStatistics: boolean;
  darkMode: boolean;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// ==================== 用户配置相关类型 ====================

export interface UserSettings {
  learningSteps: string;      // e.g., "1 10" for 1m and 10m
  relearningSteps: string;    // e.g., "10" for 10m
  dailyNewCardsLimit: number; // e.g., 20
  dailyReviewLimit: number;   // e.g., 200
  enableTraditionalLearningSteps: boolean; // false = task-driven mode, true = traditional Anki-style steps
  geminiApiKey?: string;      // Gemini API key for AI-powered features
}

// Default values for user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  learningSteps: '1 10',
  relearningSteps: '10',
  dailyNewCardsLimit: 20,
  dailyReviewLimit: 200,
  enableTraditionalLearningSteps: false, // Default to task-driven learning
};

// ==================== API 相关类型 ====================

export interface CreateDeckRequest {
  name: string;
  description?: string;
  fsrsConfig?: Partial<FSRSConfig>;
}

export interface UpdateDeckRequest {
  name?: string;
  description?: string;
  fsrsConfig?: Partial<FSRSConfig>;
}

export interface CreateNoteRequest {
  deckId: number;
  noteType: NoteType;
  fields: Partial<NoteFields>;
  tags?: string[];
}

export interface ReviewCardRequest {
  cardId: number;
  rating: AppRating;
}

export interface ReviewResult {
  success: boolean;
  nextReview?: Date;
  interval?: number;
  error?: string;
}

// ==================== IndexedDB 相关类型 ====================

export interface LanGearDBSchema {
  decks: {
    key: number;
    value: Deck;
    indexes: {
      'name': string;
    };
  };
  notes: {
    key: number;
    value: Note;
    indexes: {
      'deckId': number;
      'noteType': string;
      'tags': string;
    };
  };
  cards: {
    key: number;
    value: Card;
    indexes: {
      'noteId': number;
      'deckId': number;
      'due': Date;
      'state': string;
      'deckId-due': [number, Date];
    };
  };
  reviewLogs: {
    key: number;
    value: ReviewLog;
    indexes: {
      'cardId': number;
      'reviewTime': Date;
    };
  };
  audioStore: {
    key: string;
    value: AudioStore;
    indexes: {
      'createdAt': Date;
    };
  };
}

// ==================== 配置相关类型 ====================

export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  autoPlayAudio: boolean;
  fsrs: FSRSConfig;
}

export interface AIConfig {
  provider: 'google' | 'deepseek' | 'openai';
  apiKey?: string;
  enableAutoTranslation: boolean;
  enableSpeechToText: boolean;
}

// ==================== AI 服务相关类型 ====================

export type AIProvider = 'deepseek' | 'gemini';

export interface AIProviderConfig {
  deepseek?: {
    apiKey: string;
    baseUrl?: string;
  };
  gemini?: {
    apiKey: string;
    baseUrl?: string;
  };
  defaultProvider: AIProvider;
}

export interface AIDefinitionRequest {
  word: string;
  context?: string;
  language?: string;
  targetLanguage?: string;
}

export interface AIDefinitionResponse {
  word: string;
  definition: string;
  grammar?: string;
  examples?: string[];
  pronunciation?: string;
  provider: AIProvider;
}

// ==================== 错误类型 ====================

export class LanGearError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LanGearError';
  }
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ==================== 导出默认配置 ====================

export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  easyBonus: 1.3,
  hardFactor: 1.2,
  enableShortTerm: false,
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  theme: 'auto',
  language: 'zh-CN',
  notifications: true,
  autoPlayAudio: true,
  fsrs: DEFAULT_FSRS_CONFIG,
}; 