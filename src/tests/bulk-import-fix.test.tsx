import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkImportPage } from '../main/pages/BulkImportPage';
import { apiClient } from '../shared/utils/api';

// Mock API client
vi.mock('../shared/utils/api', async () => {
  const actual = await vi.importActual('../shared/utils/api');
  return {
    ...actual,
    ApiClient: vi.fn().mockImplementation(() => ({
      getAllDecks: vi.fn(),
      bulkCreateNotes: vi.fn(),
    })),
    apiClient: {
      getAllDecks: vi.fn(),
      bulkCreateNotes: vi.fn(),
    }
  };
});

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

describe('BulkImportPage - 修复后的数据流测试', () => {
  const mockOnBack = vi.fn();
  const mockOnImportComplete = vi.fn();
  const mockDecks = [
    { id: 1, name: '英语学习', description: '基础英语词汇' },
    { id: 2, name: '商务英语', description: '商务场景对话' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.getAllDecks as any).mockResolvedValue(mockDecks);
    (apiClient.bulkCreateNotes as any).mockResolvedValue([
      { id: 1, noteType: 'CtoE', deckId: 1 },
      { id: 2, noteType: 'CtoE', deckId: 1 }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确传递deckId到bulkCreateNotes API', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 选择牌组
    const deckSelect = screen.getByRole('combobox');
    await user.selectOptions(deckSelect, '1');

    // 输入测试数据
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.type(textarea, '你好\tHello\n谢谢\tThank you');

    // 点击预览
    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    // 等待预览显示
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
    });

    // 点击导入
    const importButton = screen.getByText(/导入.*张卡片/);
    await user.click(importButton);

    // 验证API调用
    await waitFor(() => {
      expect(apiClient.bulkCreateNotes).toHaveBeenCalledWith(
        1, // deckId
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

  it('应该正确解析不同格式的输入', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 选择牌组
    const deckSelect = screen.getByRole('combobox');
    await user.selectOptions(deckSelect, '2');

    // 测试制表符分隔
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.clear(textarea);
    await user.type(textarea, '早上好\tGood morning\n晚安,Good night');

    // 点击预览
    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    // 验证解析结果
    await waitFor(() => {
      expect(screen.getByText('Good morning')).toBeInTheDocument();
      expect(screen.getByText('Good night')).toBeInTheDocument();
    });

    // 点击导入
    const importButton = screen.getByText(/导入.*张卡片/);
    await user.click(importButton);

    // 验证API调用使用正确的deckId
    await waitFor(() => {
      expect(apiClient.bulkCreateNotes).toHaveBeenCalledWith(
        2, // 选择的是第二个牌组
        expect.arrayContaining([
          expect.objectContaining({
            fields: expect.objectContaining({
              CtoE: expect.objectContaining({
                chinese: '早上好',
                english: 'Good morning'
              })
            })
          }),
          expect.objectContaining({
            fields: expect.objectContaining({
              CtoE: expect.objectContaining({
                chinese: '晚安',
                english: 'Good night'
              })
            })
          })
        ])
      );
    });
  });

  it('应该处理导入错误情况', async () => {
    const user = userEvent.setup();
    
    // Mock API错误
    (apiClient.bulkCreateNotes as any).mockRejectedValue(new Error('Database error'));
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 选择牌组并输入数据
    const deckSelect = screen.getByRole('combobox');
    await user.selectOptions(deckSelect, '1');

    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.type(textarea, '测试\tTest');

    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const importButton = screen.getByText(/导入.*张卡片/);
    await user.click(importButton);

    // 验证错误处理
    await waitFor(() => {
      expect(apiClient.bulkCreateNotes).toHaveBeenCalled();
    });

    // 验证没有调用成功回调
    expect(mockOnImportComplete).not.toHaveBeenCalled();
  });

  it('应该验证输入数据的有效性', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 输入无效数据（缺少分隔符）
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.type(textarea, '你好Hello\n无效行\n\t空行');

    // 点击预览
    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    // 验证显示有效和无效卡片的统计
    await waitFor(() => {
      // 应该显示无效卡片的统计信息
      const invalidText = screen.getByText(/无效卡片/);
      expect(invalidText).toBeInTheDocument();
    });
  });

  it('应该禁用导入按钮当没有选择牌组时', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkImportPage 
        onBack={mockOnBack} 
        onImportComplete={mockOnImportComplete} 
      />
    );

    // 等待牌组加载
    await waitFor(() => {
      expect(screen.getByText('英语学习')).toBeInTheDocument();
    });

    // 输入有效数据但不选择牌组
    const textarea = screen.getByPlaceholderText(/请粘贴要导入的内容/);
    await user.type(textarea, '你好\tHello');

    const previewButton = screen.getByText('预览');
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // 导入按钮应该是禁用状态
    const importButton = screen.getByText(/导入.*张卡片/);
    expect(importButton).toBeDisabled();
  });
}); 