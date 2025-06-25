
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Review } from '../main/pages/Review';
import type { Card, Note, Deck } from '../shared/types';

// Mock API Client
const mockApiClient = {
  getAllDecks: vi.fn(),
  buildQueue: vi.fn(),
  getNoteById: vi.fn(),
  reviewCard: vi.fn(),
  updateNote: vi.fn(),
  resetCardsInDeck: vi.fn(),
};

vi.mock('../shared/utils/api', () => ({
  ApiClient: vi.fn(() => mockApiClient)
}));

// Mock settings service
vi.mock('../shared/utils/settingsService', () => ({
  getSettings: vi.fn(() => Promise.resolve({
    enableTraditionalLearningSteps: true,
    defaultDifficulty: 'medium'
  }))
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Review Component - Editing Functionality', () => {
  const mockCard: Card = {
    id: 1,
    noteId: 1,
    deckId: 1,
    cardType: 'CtoE',
    state: 'Review',
    due: new Date(),
    stability: 1.0,
    difficulty: 5.0,
    elapsedDays: 0,
    scheduledDays: 1,
    reps: 0,
    lapses: 0,
    lastReview: new Date(),
    learningStep: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNote: Note = {
    id: 1,
    deckId: 1,
    noteType: 'CtoE',
    fields: {
      CtoE: {
        chinese: '测试内容',
        english: 'Test content',
        pinyin: 'cè shì nèi róng',
        notes: 'Test notes'
      }
    },
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockDeck: Deck = {
    id: 1,
    name: 'Test Deck',
    description: 'Test deck description',
    fsrsConfig: {
      requestRetention: 0.9,
      maximumInterval: 36500,
      easyBonus: 1.3,
      hardFactor: 1.2
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.buildQueue.mockResolvedValue([mockCard]);
    mockApiClient.getNoteById.mockResolvedValue(mockNote);
    mockApiClient.getAllDecks.mockResolvedValue([mockDeck]);
  });

  it('should render edit button in ReviewControls', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 验证编辑按钮存在
    const editButton = screen.getByTitle('编辑卡片 (E)');
    expect(editButton).toBeInTheDocument();
  });

  it('should toggle SidePanel when edit button is clicked', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    const sidePanel = document.querySelector('.fixed.right-0');
    
    // 检查初始状态 - 可能默认是打开的，先关闭它
    if (sidePanel?.classList.contains('translate-x-0')) {
      const editButton = screen.getByTitle('编辑卡片 (E)');
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(sidePanel).toHaveClass('translate-x-full');
      });
    }

    // 现在测试打开功能
    const editButton = screen.getByTitle('编辑卡片 (E)');
    fireEvent.click(editButton);

    // SidePanel应该打开
    await waitFor(() => {
      expect(sidePanel).toHaveClass('translate-x-0');
    });

    // 再次点击应该关闭
    fireEvent.click(editButton);
    await waitFor(() => {
      expect(sidePanel).toHaveClass('translate-x-full');
    });
  });

  it('should display current card content in SidePanel', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 打开SidePanel
    const editButton = screen.getByTitle('编辑卡片 (E)');
    fireEvent.click(editButton);

    // 验证SidePanel中显示了正确的内容
    await waitFor(() => {
      expect(screen.getByText('参考翻译')).toBeInTheDocument();
      expect(screen.getByText('学习笔记')).toBeInTheDocument();
    });

    // 验证富文本编辑器中包含了当前卡片的内容
    // RichTextEditor使用contenteditable div，内容在p标签中
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('should call updateNote API when content is changed in SidePanel', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 打开SidePanel
    const editButton = screen.getByTitle('编辑卡片 (E)');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    // 修改参考翻译 - 对于contenteditable元素，需要模拟输入事件
    const referenceEditor = screen.getByText('Test content').closest('.tiptap');
    if (referenceEditor) {
      // 模拟contenteditable的输入
      fireEvent.input(referenceEditor, { target: { textContent: 'Updated test content' } });
    }

    // 验证API被调用
    await waitFor(() => {
      expect(mockApiClient.updateNote).toHaveBeenCalledWith(1, {
        fields: {
          CtoE: {
            chinese: '测试内容',
            english: 'Updated test content',
            pinyin: 'cè shì nèi róng',
            notes: 'Test notes'
          }
        }
      });
    });
  });

  it('should support keyboard shortcut (E) to toggle edit panel', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    const sidePanel = document.querySelector('.fixed.right-0');
    
    // 确保初始状态是关闭的
    if (sidePanel?.classList.contains('translate-x-0')) {
      fireEvent.keyDown(document, { key: 'e' });
      await waitFor(() => {
        expect(sidePanel).toHaveClass('translate-x-full');
      });
    }

    // 按E键应该打开SidePanel
    fireEvent.keyDown(document, { key: 'e' });
    await waitFor(() => {
      expect(sidePanel).toHaveClass('translate-x-0');
    });

    // 再次按E键应该关闭SidePanel
    fireEvent.keyDown(document, { key: 'E' });
    await waitFor(() => {
      expect(sidePanel).toHaveClass('translate-x-full');
    });
  });

  it('should adjust main content area margin when SidePanel is open', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    const mainContent = document.querySelector('.flex-1.transition-all');
    
    // 检查当前状态并确保初始状态正确
    const sidePanel = document.querySelector('.fixed.right-0');
    if (sidePanel?.classList.contains('translate-x-0')) {
      // 如果SidePanel已经打开，先关闭它
      const editButton = screen.getByTitle('编辑卡片 (E)');
      fireEvent.click(editButton);
      await waitFor(() => {
        expect(mainContent).toHaveClass('mr-0');
        expect(mainContent).not.toHaveClass('mr-[300px]');
      });
    }

    // 打开SidePanel
    const editButton = screen.getByTitle('编辑卡片 (E)');
    fireEvent.click(editButton);

    // 主内容区域应该有右边距
    await waitFor(() => {
      expect(mainContent).toHaveClass('mr-[300px]');
      expect(mainContent).not.toHaveClass('mr-0');
    });
  });
}); 