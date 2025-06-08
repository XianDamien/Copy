import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popup } from './Popup';

// Mock API客户端
const mockApiClient = {
  getAllDecks: vi.fn(),
  getDueCards: vi.fn(),
  createNote: vi.fn(),
};

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    create: vi.fn(),
  },
  runtime: {
    getURL: vi.fn(() => 'chrome-extension://test/main.html'),
    openOptionsPage: vi.fn(),
  },
};

// 设置全局Chrome
(global as any).chrome = mockChrome;

// Mock API客户端模块
vi.mock('@shared/utils/api', () => ({
  getAllDecks: mockApiClient.getAllDecks,
  getDueCards: mockApiClient.getDueCards,
  createNote: mockApiClient.createNote,
}));

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的Mock返回值
    mockApiClient.getAllDecks.mockResolvedValue([
      { id: 1, name: '基础词汇', description: '日常用词' },
      { id: 2, name: '商务英语', description: '商务场景' }
    ]);
    
    mockApiClient.getDueCards.mockResolvedValue([
      { id: 1, noteId: 1, due: new Date() },
      { id: 2, noteId: 2, due: new Date() }
    ]);
    
    mockApiClient.createNote.mockResolvedValue({ id: 3, noteId: 3 });
  });

  it('should render header correctly', async () => {
    render(<Popup />);
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('AnGear')).toBeInTheDocument();
    expect(screen.getByText('工业级语言学习工具')).toBeInTheDocument();
    expect(screen.getByText('学习状态')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    render(<Popup />);
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should display decks after loading', async () => {
    render(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
      expect(screen.getByText('商务英语')).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    // Mock API调用失败
    mockApiClient.getAllDecks.mockRejectedValue(new Error('Network error'));
    mockApiClient.getDueCards.mockRejectedValue(new Error('Network error'));

    render(<Popup />);

    // 等待加载状态结束
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 应该显示空状态而不是错误
    expect(screen.getByText('暂无牌组')).toBeInTheDocument();
  });

  it('should toggle quick add form', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 点击快速添加按钮
    const quickAddButton = screen.getByText('快速添加');
    await user.click(quickAddButton);

    // 应该显示快速添加表单
    expect(screen.getByText('快速创建汉译英卡片')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('中文原文')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('英文翻译')).toBeInTheDocument();
  });

  it('should create note successfully', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    // 等待加载完成并显示快速添加表单
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 点击快速添加按钮
    const quickAddButton = screen.getByText('快速添加');
    await user.click(quickAddButton);

    // 等待表单出现
    await waitFor(() => {
      expect(screen.getByPlaceholderText('中文原文')).toBeInTheDocument();
    });

    // 选择牌组
    const deckSelect = screen.getByDisplayValue('选择牌组');
    await user.selectOptions(deckSelect, '1');

    // 填写表单
    const chineseInput = screen.getByPlaceholderText('中文原文');
    const englishInput = screen.getByPlaceholderText('英文翻译');
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, 'Hello');

    // 提交表单
    const submitButton = screen.getByText('创建卡片');
    await user.click(submitButton);

    // 验证API调用
    expect(mockApiClient.createNote).toHaveBeenCalledWith({
      deckId: 1,
      noteType: 'CtoE',
      fields: {
        chineseOriginal: '你好',
        englishTranslation: 'Hello'
      },
      tags: []
    });
  });

  it('should handle note creation error', async () => {
    const user = userEvent.setup();
    
    // Mock创建笔记失败
    mockApiClient.createNote.mockRejectedValue(new Error('Creation failed'));
    
    render(<Popup />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 点击快速添加按钮
    const quickAddButton = screen.getByText('快速添加');
    await user.click(quickAddButton);

    // 等待表单出现并填写
    await waitFor(() => {
      expect(screen.getByPlaceholderText('中文原文')).toBeInTheDocument();
    });

    const deckSelect = screen.getByDisplayValue('选择牌组');
    await user.selectOptions(deckSelect, '1');

    const chineseInput = screen.getByPlaceholderText('中文原文');
    const englishInput = screen.getByPlaceholderText('英文翻译');
    
    await user.type(chineseInput, '测试');
    await user.type(englishInput, 'Test');

    const submitButton = screen.getByText('创建卡片');
    await user.click(submitButton);

    // 验证错误处理 - 检查通知系统
    expect(mockApiClient.createNote).toHaveBeenCalled();
  });

  it('should open main app when clicking main app button', async () => {
    const user = userEvent.setup();
    render(<Popup />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    const mainAppButton = screen.getByText('打开应用');
    await user.click(mainAppButton);

    expect(mockChrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/main.html'
    });
  });
}); 