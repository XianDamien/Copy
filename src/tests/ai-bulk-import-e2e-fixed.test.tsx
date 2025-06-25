import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkImportPage } from '../main/pages/BulkImportPage';

// 使用vi.hoisted确保mock正确提升
const mockGetAllDecks = vi.hoisted(() => vi.fn());
const mockBulkCreateNotes = vi.hoisted(() => vi.fn());
const mockAiProcessText = vi.hoisted(() => vi.fn());

// Mock API client - 使用更简单直接的方式
vi.mock('../shared/utils/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getAllDecks: mockGetAllDecks,
    bulkCreateNotes: mockBulkCreateNotes,
    aiProcessText: mockAiProcessText,
  })),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('AI批量导入端到端测试 - 修复版', () => {
  const mockOnBack = vi.fn();
  const mockOnImportComplete = vi.fn();
  const mockDecks = [
    { id: 1, name: '英语学习', description: '基础英语词汇' },
    { id: 2, name: '商务英语', description: '商务场景对话' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock responses
    mockGetAllDecks.mockResolvedValue(mockDecks);
    mockBulkCreateNotes.mockResolvedValue([
      { id: 1, noteType: 'CtoE', deckId: 1 },
      { id: 2, noteType: 'CtoE', deckId: 1 }
    ]);
    mockAiProcessText.mockResolvedValue([
      { front: '你好', back: 'Hello' },
      { front: '谢谢', back: 'Thank you' }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该完成完整的AI处理+批量导入流程', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(mockGetAllDecks).toHaveBeenCalled();
    });

    // 等待加载完成，确保牌组选项出现
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 输入原始双语文本（不符合标准格式，这样不会被自动解析）
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    
    // 使用clear + type确保文本正确设置
    await user.clear(textarea);
    await user.type(textarea, 'Hello world, 你好世界! This is a test sentence.');

    // 等待AI按钮出现（因为文本不符合标准格式，parsedCards.length应该为0）
    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });

    // 点击AI处理按钮
    const aiButton = screen.getByText('使用AI处理文本');
    await user.click(aiButton);

    // 验证AI处理调用
    await waitFor(() => {
      expect(mockAiProcessText).toHaveBeenCalledWith(
        'Hello world, 你好世界! This is a test sentence.'
      );
    });

    // 验证处理后的文本被更新（AI会返回格式化的文本）
    await waitFor(() => {
      expect(textarea).toHaveValue('你好\tHello\n谢谢\tThank you');
    });

    // 验证有效卡片计数显示
    await waitFor(() => {
      expect(screen.getByText('2 张有效卡片')).toBeInTheDocument();
    });

    // 点击预览
    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    // 验证预览显示
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
    });

    // 点击导入
    const importButton = screen.getByText(/导入.*张卡片/);
    await user.click(importButton);

    // 验证批量导入调用
    await waitFor(() => {
      expect(mockBulkCreateNotes).toHaveBeenCalledWith(
        1, // 默认选择第一个牌组
        expect.arrayContaining([
          expect.objectContaining({
            noteType: 'CtoE',
            fields: expect.objectContaining({
              CtoE: expect.objectContaining({
                chinese: '你好',
                english: 'Hello'
              })
            })
          }),
          expect.objectContaining({
            noteType: 'CtoE',
            fields: expect.objectContaining({
              CtoE: expect.objectContaining({
                chinese: '谢谢',
                english: 'Thank you'
              })
            })
          })
        ])
      );
    });

    // 验证导入完成回调
    expect(mockOnImportComplete).toHaveBeenCalledWith(1);
  });

  it('应该支持跳过AI处理直接导入预格式化文本', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    await waitFor(() => {
      expect(mockGetAllDecks).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 直接输入格式化的文本
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.clear(textarea);
    await user.type(textarea, '早上好\tGood morning\n晚安\tGood night');

    // 验证AI按钮不显示（因为有有效的解析卡片）
    await waitFor(() => {
      expect(screen.queryByText('使用AI处理文本')).not.toBeInTheDocument();
    });

    // 验证有效卡片显示
    await waitFor(() => {
      expect(screen.getByText('2 张有效卡片')).toBeInTheDocument();
    });

    // 直接预览
    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Good morning')).toBeInTheDocument();
      expect(screen.getByText('Good night')).toBeInTheDocument();
    });

    const importButton = screen.getByText(/导入.*张卡片/);
    await user.click(importButton);

    // 验证没有调用AI处理
    expect(mockAiProcessText).not.toHaveBeenCalled();
    
    // 验证直接调用批量导入
    await waitFor(() => {
      expect(mockBulkCreateNotes).toHaveBeenCalled();
    });
  });

  it('应该处理AI返回空结果的情况', async () => {
    const user = userEvent.setup();
    
    // Mock AI返回空结果
    mockAiProcessText.mockResolvedValue([]);
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    await waitFor(() => {
      expect(mockGetAllDecks).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.clear(textarea);
    await user.type(textarea, '无法处理的文本内容');

    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });

    const aiButton = screen.getByText('使用AI处理文本');
    await user.click(aiButton);

    await waitFor(() => {
      expect(mockAiProcessText).toHaveBeenCalled();
    });

    // 验证AI处理后文本区域被清空或保持原状
    // 由于AI返回空结果，应该显示错误提示
    expect(mockBulkCreateNotes).not.toHaveBeenCalled();
    expect(mockOnImportComplete).not.toHaveBeenCalled();
  });

  it('应该处理AI处理失败的情况', async () => {
    const user = userEvent.setup();
    
    // Mock AI处理失败
    mockAiProcessText.mockRejectedValue(new Error('API密钥无效'));
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    await waitFor(() => {
      expect(mockGetAllDecks).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.clear(textarea);
    await user.type(textarea, '测试文本');

    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });

    const aiButton = screen.getByText('使用AI处理文本');
    await user.click(aiButton);

    await waitFor(() => {
      expect(mockAiProcessText).toHaveBeenCalled();
    });

    // 验证错误处理
    expect(mockBulkCreateNotes).not.toHaveBeenCalled();
    expect(mockOnImportComplete).not.toHaveBeenCalled();
  });

  it('应该正确处理AI处理过程中的加载状态', async () => {
    const user = userEvent.setup();
    
    // Mock AI处理延迟
    let resolveAI: (value: any) => void;
    const aiPromise = new Promise((resolve) => {
      resolveAI = resolve;
    });
    mockAiProcessText.mockReturnValue(aiPromise);
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    await waitFor(() => {
      expect(mockGetAllDecks).toHaveBeenCalled();
    });

    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.clear(textarea);
    await user.type(textarea, '测试文本');

    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });

    const aiButton = screen.getByText('使用AI处理文本');
    await user.click(aiButton);

    // 验证加载状态
    await waitFor(() => {
      expect(screen.getByText('AI处理中...')).toBeInTheDocument();
    });
    expect(aiButton).toBeDisabled();

    // 完成AI处理
    resolveAI!([{ front: '测试', back: 'Test' }]);

    await waitFor(() => {
      expect(screen.getByText('使用AI处理文本')).toBeInTheDocument();
    });
  });
}); 