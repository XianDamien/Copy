import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Google Generative AI at the top level
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn()
    })
  }))
}));

import { GeminiService } from '../background/geminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockGenerateContent: any;
  let mockGetGenerativeModel: any;
  let mockGoogleGenerativeAI: any;
  const testApiKey = 'AIzaSyDummyTestKey123456789012345678901234';

  beforeEach(() => {
    // 获取mock实例
    mockGoogleGenerativeAI = vi.mocked(GoogleGenerativeAI);
    mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: vi.fn()
    });
    mockGenerateContent = vi.fn();
    
    // 设置mock返回值
    mockGoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));
    
    mockGetGenerativeModel.mockReturnValue({
      generateContent: mockGenerateContent
    });
    
    geminiService = new GeminiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApiKey', () => {
    it('应该验证有效的API密钥', async () => {
      // 模拟成功的API响应
      const mockResponse = {
        text: () => 'Hello! How can I help you?'
      };
      mockGenerateContent.mockResolvedValue({
        response: mockResponse
      });

      const result = await geminiService.validateApiKey(testApiKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockGenerateContent).toHaveBeenCalledWith('Hello');
    });

    it('应该拒绝无效的API密钥', async () => {
      // 模拟API密钥无效错误
      const error = new Error('API_KEY_INVALID');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.validateApiKey('invalid_key');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API密钥无效');
    });

    it('应该处理配额超限错误', async () => {
      const error = new Error('QUOTA_EXCEEDED');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.validateApiKey(testApiKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API配额已用完');
    });

    it('应该处理权限被拒绝错误', async () => {
      const error = new Error('PERMISSION_DENIED');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.validateApiKey(testApiKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API访问权限被拒绝');
    });

    it('应该处理其他未知错误', async () => {
      const error = new Error('Network error');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.validateApiKey(testApiKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('验证失败: Network error');
    });
  });

  describe('processTextForCards', () => {
    it('应该成功处理中英文对照文本', async () => {
      const inputText = `
        Hello 你好
        How are you? 你好吗？
        Good morning 早上好
      `;

      const mockAIResponse = `
        [
          {"front": "Hello", "back": "你好"},
          {"front": "How are you?", "back": "你好吗？"},
          {"front": "Good morning", "back": "早上好"}
        ]
      `;

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data![0]).toEqual({ front: "Hello", back: "你好" });
      expect(result.data![1]).toEqual({ front: "How are you?", back: "你好吗？" });
      expect(result.data![2]).toEqual({ front: "Good morning", back: "早上好" });
    });

    it('应该过滤掉过短的句子', async () => {
      const inputText = "Hello world 你好世界";

      const mockAIResponse = `
        [
          {"front": "Hello world", "back": "你好世界"},
          {"front": "Hi", "back": "嗨"},
          {"front": "A", "back": "一个"}
        ]
      `;

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual({ front: "Hello world", back: "你好世界" });
    });

    it('应该处理没有API密钥的情况', async () => {
      const result = await geminiService.processTextForCards('test text', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('请先设置Gemini API密钥');
    });

    it('应该处理AI响应解析错误', async () => {
      const inputText = "Hello 你好";
      const mockAIResponse = "This is not valid JSON";

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toContain('未找到有效的JSON响应');
    });

    it('应该处理无效的JSON格式', async () => {
      const inputText = "Hello 你好";
      const mockAIResponse = '{"invalid": "format"}';

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('响应格式不正确，期望数组格式');
    });

    it('应该处理空的有效卡片列表', async () => {
      const inputText = "A B C";
      const mockAIResponse = `
        [
          {"front": "A", "back": "B"},
          {"front": "C", "back": ""}
        ]
      `;

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('未能从文本中提取到有效的句子对');
    });

    it('应该处理API密钥无效错误', async () => {
      const error = new Error('API_KEY_INVALID');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.processTextForCards('test', testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API密钥无效，请检查设置');
    });

    it('应该处理配额超限错误', async () => {
      const error = new Error('QUOTA_EXCEEDED');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.processTextForCards('test', testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API配额已用完，请稍后再试');
    });

    it('应该处理权限被拒绝错误', async () => {
      const error = new Error('PERMISSION_DENIED');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.processTextForCards('test', testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API访问权限被拒绝');
    });

    it('应该处理其他未知错误', async () => {
      const error = new Error('Network timeout');
      mockGenerateContent.mockRejectedValue(error);

      const result = await geminiService.processTextForCards('test', testApiKey);

      expect(result.success).toBe(false);
      expect(result.error).toBe('处理失败: Network timeout');
    });

    it('应该正确提取代码块中的JSON', async () => {
      const inputText = "Hello 你好";
      const mockAIResponse = `
        Here's the result:
        \`\`\`json
        [
          {"front": "Hello", "back": "你好"}
        ]
        \`\`\`
      `;

      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockAIResponse }
      });

      const result = await geminiService.processTextForCards(inputText, testApiKey);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual({ front: "Hello", back: "你好" });
    });
  });

  describe('constructor', () => {
    it('应该在提供API密钥时初始化GoogleGenerativeAI', () => {
      const serviceWithKey = new GeminiService(testApiKey);
      expect(serviceWithKey).toBeInstanceOf(GeminiService);
    });

    it('应该在未提供API密钥时不初始化GoogleGenerativeAI', () => {
      const serviceWithoutKey = new GeminiService();
      expect(serviceWithoutKey).toBeInstanceOf(GeminiService);
    });
  });
}); 