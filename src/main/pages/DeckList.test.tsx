import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeckList } from './DeckList';

// Mock API客户端
const mockApiClient = {
  getAllDecks: vi.fn(),
  getDeckStatistics: vi.fn(),
  createDeck: vi.fn(),
  updateDeck: vi.fn(),
  deleteDeck: vi.fn(),
};

// Mock API客户端模块
vi.mock('../../shared/utils/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => mockApiClient),
}));

// 测试数据
const mockDecks = [
  {
    id: 1,
    name: '基础词汇',
    description: '日常用词',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    fsrsConfig: {
      requestRetention: 0.9,
      maximumInterval: 36500,
      easyBonus: 1.3,
      hardFactor: 1.2,
    }
  },
  {
    id: 2,
    name: '商务英语',
    description: '商务场景用词',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    fsrsConfig: {
      requestRetention: 0.9,
      maximumInterval: 36500,
      easyBonus: 1.3,
      hardFactor: 1.2,
    }
  }
];

const mockStatistics = {
  totalCards: 50,
  newCards: 10,
  learningCards: 15,
  reviewCards: 20,
  dueCards: 5,
  totalNotes: 25,
};

describe('DeckList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的Mock返回值
    mockApiClient.getAllDecks.mockResolvedValue(mockDecks);
    mockApiClient.getDeckStatistics.mockResolvedValue(mockStatistics);
    mockApiClient.createDeck.mockResolvedValue({
      id: 3,
      name: '新牌组',
      description: '新描述',
      createdAt: new Date(),
      updatedAt: new Date(),
      fsrsConfig: {
        requestRetention: 0.9,
        maximumInterval: 36500,
        easyBonus: 1.3,
        hardFactor: 1.2,
      }
    });
  });

  it('should render loading state initially', () => {
    render(<DeckList />);
    
    expect(screen.getByText('加载牌组中...')).toBeInTheDocument();
  });

  it('should display deck list after loading', async () => {
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
      expect(screen.getByText('商务英语')).toBeInTheDocument();
    });

    expect(screen.getByText('日常用词')).toBeInTheDocument();
    expect(screen.getByText('商务场景用词')).toBeInTheDocument();
  });

  it('should show empty state when no decks exist', async () => {
    mockApiClient.getAllDecks.mockResolvedValue([]);
    
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('暂无牌组')).toBeInTheDocument();
    });

    expect(screen.getByText('创建您的第一个牌组开始学习之旅。牌组可以帮助您组织和管理学习内容。')).toBeInTheDocument();
    expect(screen.getByText('创建第一个牌组')).toBeInTheDocument();
  });

  it('should display deck statistics', async () => {
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getAllByText('50').length).toBeGreaterThan(0); // totalCards
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);  // dueCards
    });
  });

  it('should open create deck modal', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('创建牌组')).toBeInTheDocument();
    });

    const createButton = screen.getByText('创建牌组');
    await user.click(createButton);

    expect(screen.getByText('创建新牌组')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入牌组名称')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入牌组描述')).toBeInTheDocument();
  });

  it('should create new deck successfully', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('创建牌组')).toBeInTheDocument();
    });

    // 打开创建模态框
    const createButton = screen.getByText('创建牌组');
    await user.click(createButton);

    // 填写表单
    const nameInput = screen.getByPlaceholderText('输入牌组名称');
    const descriptionInput = screen.getByPlaceholderText('输入牌组描述');
    
    await user.type(nameInput, '新牌组');
    await user.type(descriptionInput, '新描述');

    // 提交表单
    const submitButton = screen.getByRole('button', { name: '创建' });
    await user.click(submitButton);

    // 验证API调用
    expect(mockApiClient.createDeck).toHaveBeenCalledWith({
      name: '新牌组',
      description: '新描述'
    });

    // 验证模态框关闭
    await waitFor(() => {
      expect(screen.queryByText('创建新牌组')).not.toBeInTheDocument();
    });
  });

  it('should validate required fields in create form', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('创建牌组')).toBeInTheDocument();
    });

    // 打开创建模态框
    const createButton = screen.getByText('创建牌组');
    await user.click(createButton);

    // 尝试提交空表单
    const submitButton = screen.getByRole('button', { name: '创建' });
    expect(submitButton).toBeDisabled();

    // 输入空格应该仍然无效
    const nameInput = screen.getByPlaceholderText('输入牌组名称');
    await user.type(nameInput, '   ');
    expect(submitButton).toBeDisabled();
  });

  it('should open edit deck modal', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    // 悬停以显示操作按钮
    const deckCard = screen.getByText('基础词汇').closest('.group');
    await user.hover(deckCard!);

    // 点击编辑按钮
    const editButton = screen.getByTitle('编辑牌组');
    await user.click(editButton);

    expect(screen.getByText('编辑牌组')).toBeInTheDocument();
    expect(screen.getByDisplayValue('基础词汇')).toBeInTheDocument();
    expect(screen.getByDisplayValue('日常用词')).toBeInTheDocument();
  });

  it('should update deck successfully', async () => {
    const user = userEvent.setup();
    mockApiClient.updateDeck.mockResolvedValue({
      id: 1,
      name: '更新后的牌组',
      description: '更新后的描述',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      fsrsConfig: {
        requestRetention: 0.9,
        maximumInterval: 36500,
        easyBonus: 1.3,
        hardFactor: 1.2,
      }
    });

    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    // 打开编辑模态框
    const deckCard = screen.getByText('基础词汇').closest('.group');
    await user.hover(deckCard!);
    const editButton = screen.getByTitle('编辑牌组');
    await user.click(editButton);

    // 修改表单
    const nameInput = screen.getByDisplayValue('基础词汇');
    const descriptionInput = screen.getByDisplayValue('日常用词');
    
    await user.clear(nameInput);
    await user.type(nameInput, '更新后的牌组');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, '更新后的描述');

    // 提交表单
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    // 验证API调用
    expect(mockApiClient.updateDeck).toHaveBeenCalledWith(1, {
      name: '更新后的牌组',
      description: '更新后的描述'
    });
  });

  it('should open delete confirmation modal', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    // 悬停以显示操作按钮
    const deckCard = screen.getByText('基础词汇').closest('.group');
    await user.hover(deckCard!);

    // 点击删除按钮
    const deleteButton = screen.getByTitle('删除牌组');
    await user.click(deleteButton);

    expect(screen.getByText('删除牌组')).toBeInTheDocument();
    expect(screen.getByText('确定要删除牌组')).toBeInTheDocument();
    expect(screen.getByText('"基础词汇"')).toBeInTheDocument();
  });

  it('should delete deck successfully', async () => {
    const user = userEvent.setup();
    mockApiClient.deleteDeck.mockResolvedValue(undefined);

    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    // 打开删除确认模态框
    const deckCard = screen.getByText('基础词汇').closest('.group');
    await user.hover(deckCard!);
    const deleteButton = screen.getByTitle('删除牌组');
    await user.click(deleteButton);

    // 确认删除
    const confirmButton = screen.getByRole('button', { name: '删除' });
    await user.click(confirmButton);

    // 验证API调用
    expect(mockApiClient.deleteDeck).toHaveBeenCalledWith(1);

    // 验证牌组从列表中移除
    await waitFor(() => {
      expect(screen.queryByText('基础词汇')).not.toBeInTheDocument();
    });
  });

  it('should call onDeckSelect when learn button is clicked', async () => {
    const mockOnDeckSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<DeckList onDeckSelect={mockOnDeckSelect} />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    const learnButton = screen.getAllByText('学习')[0];
    await user.click(learnButton);

    expect(mockOnDeckSelect).toHaveBeenCalledWith(1);
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiClient.getAllDecks.mockRejectedValue(new Error('Network error'));

    render(<DeckList />);

    await waitFor(() => {
      expect(screen.queryByText('加载牌组中...')).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load decks:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle statistics loading errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiClient.getDeckStatistics.mockRejectedValue(new Error('Stats error'));

    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('基础词汇')).toBeInTheDocument();
    });

    // 牌组应该仍然显示，即使统计加载失败
    expect(screen.getByText('基础词汇')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load statistics for deck 1:', 
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should close modals when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText('创建牌组')).toBeInTheDocument();
    });

    // 测试创建模态框取消
    const createButton = screen.getByText('创建牌组');
    await user.click(createButton);
    
    const cancelButton = screen.getByRole('button', { name: '取消' });
    await user.click(cancelButton);

    expect(screen.queryByText('创建新牌组')).not.toBeInTheDocument();
  });

  it('should display deck count and total cards in header', async () => {
    render(<DeckList />);

    await waitFor(() => {
      expect(screen.getByText(/共 2 个牌组/)).toBeInTheDocument();
      expect(screen.getByText(/100 张卡片/)).toBeInTheDocument(); // 2 decks * 50 cards each
    });
  });
}); 