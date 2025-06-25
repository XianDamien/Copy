import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkImportPage } from '../main/pages/BulkImportPage';

// 创建mock实例
const mockApiClient = {
  getAllDecks: vi.fn(),
  getUserConfig: vi.fn(),
  saveUserConfig: vi.fn(),
  verifyGeminiApiKey: vi.fn(),
  aiProcessText: vi.fn(),
  bulkCreateNotes: vi.fn(),
};

// Mock API客户端
vi.mock('../shared/utils/api', () => ({
  ApiClient: vi.fn(() => mockApiClient),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AI批量导入功能集成测试', () => {
  const mockOnBack = vi.fn();
  const mockOnImportComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认mock返回值
    mockApiClient.getAllDecks.mockResolvedValue([
      { id: 1, name: '英语学习' },
      { id: 2, name: '商务英语' }
    ]);
    
    mockApiClient.getUserConfig.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确加载页面并显示API密钥配置区域', async () => {
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 验证新的AI优先文案
    expect(screen.getByText('粘贴双语文本，AI将自动为您对齐并生成卡片')).toBeInTheDocument();
    
    // 验证API密钥配置区域
    expect(screen.getByText('Gemini AI 配置')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入您的 Gemini API 密钥')).toBeInTheDocument();
    expect(screen.getByText('验证并保存')).toBeInTheDocument();
    
    // 验证AI处理指南
    expect(screen.getByText('AI 处理指南：')).toBeInTheDocument();
    expect(screen.getByText(/AI将自动逐句对齐文本/)).toBeInTheDocument();
  });

  it('应该能够验证和保存API密钥', async () => {
    const user = userEvent.setup();
    
    mockApiClient.verifyGeminiApiKey.mockResolvedValue({
      valid: true
    });
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 输入API密钥
    const apiKeyInput = screen.getByPlaceholderText('请输入您的 Gemini API 密钥');
    await user.type(apiKeyInput, 'test-api-key');

    // 点击验证按钮
    const verifyButton = screen.getByText('验证并保存');
    await user.click(verifyButton);

    // 验证API调用
    await waitFor(() => {
      expect(mockApiClient.verifyGeminiApiKey).toHaveBeenCalledWith('test-api-key');
    });

    // 验证保存配置被调用
    await waitFor(() => {
      expect(mockApiClient.saveUserConfig).toHaveBeenCalledWith({
        geminiApiKey: 'test-api-key'
      });
    });

    // 验证成功状态显示
    await waitFor(() => {
      expect(screen.getByText('API密钥已验证并保存')).toBeInTheDocument();
    });
  });

  it('应该处理API密钥验证失败的情况', async () => {
    const user = userEvent.setup();
    
    mockApiClient.verifyGeminiApiKey.mockResolvedValue({
      valid: false,
      error: 'API密钥无效'
    });
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 输入无效API密钥
    const apiKeyInput = screen.getByPlaceholderText('请输入您的 Gemini API 密钥');
    await user.type(apiKeyInput, 'invalid-key');

    // 点击验证按钮
    const verifyButton = screen.getByText('验证并保存');
    await user.click(verifyButton);

    // 验证错误信息显示
    await waitFor(() => {
      expect(screen.getByText('API密钥无效')).toBeInTheDocument();
    });

    // 验证不会保存无效密钥
    expect(mockApiClient.saveUserConfig).not.toHaveBeenCalled();
  });

  it('应该在有有效API密钥时显示AI处理按钮', async () => {
    const user = userEvent.setup();
    
    // 模拟已有有效API密钥
    mockApiClient.getUserConfig.mockResolvedValue({
      geminiApiKey: 'valid-api-key'
    });
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 输入需要AI处理的文本
    const textarea = screen.getByPlaceholderText(/请在此处粘贴您的双语文本/);
    await user.type(textarea, 'Hello world. This is a test paragraph that needs AI processing.');

    // 验证AI处理按钮出现
    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });
  });

  it('应该成功处理AI文本处理流程', async () => {
    const user = userEvent.setup();
    
    // 模拟已有有效API密钥
    mockApiClient.getUserConfig.mockResolvedValue({
      geminiApiKey: 'valid-api-key'
    });
    
    // 模拟AI处理结果
    mockApiClient.aiProcessText.mockResolvedValue([
      { front: 'Hello world', back: '你好世界' },
      { front: 'This is a test', back: '这是一个测试' }
    ]);
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 输入需要AI处理的文本
    const textarea = screen.getByPlaceholderText(/请在此处粘贴您的双语文本/);
    await user.type(textarea, 'Hello world. This is a test paragraph.');

    // 点击AI处理按钮
    const aiButton = screen.getByText('使用AI处理文本');
    await user.click(aiButton);

    // 验证AI处理被调用
    await waitFor(() => {
      expect(mockApiClient.aiProcessText).toHaveBeenCalledWith('Hello world. This is a test paragraph.');
    });

         // 验证处理结果被正确格式化并填入文本框
     await waitFor(() => {
       expect(textarea).toHaveValue('Hello world\t你好世界\nThis is a test\t这是一个测试');
    });
  });

  it('应该在没有API密钥时阻止AI处理', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 输入文本但不设置API密钥
    const textarea = screen.getByPlaceholderText(/请在此处粘贴您的双语文本/);
    await user.type(textarea, 'Some text that needs processing');

    // 尝试点击AI处理按钮（如果存在）
    const aiButton = screen.queryByText('使用AI处理文本');
    if (aiButton) {
      await user.click(aiButton);
      
      // 验证不会调用AI处理
      expect(mockApiClient.aiProcessText).not.toHaveBeenCalled();
    }
  });

  it('应该正确加载已保存的API密钥', async () => {
    // 模拟已保存的API密钥
    mockApiClient.getUserConfig.mockResolvedValue({
      geminiApiKey: 'saved-api-key'
    });
    
    render(
      <BulkImportPage 
        onBack={mockOnBack}
        onImportComplete={mockOnImportComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('批量导入卡片')).toBeInTheDocument();
    });

    // 验证API密钥输入框显示已保存的密钥
    await waitFor(() => {
      const apiKeyInput = screen.getByPlaceholderText('请输入您的 Gemini API 密钥');
      expect(apiKeyInput).toHaveValue('saved-api-key');
    });

    // 验证成功状态显示
    await waitFor(() => {
      expect(screen.getByText('API密钥已验证并保存')).toBeInTheDocument();
    });
  });
}); 