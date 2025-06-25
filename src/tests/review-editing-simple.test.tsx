
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

describe('Review Component - Editing Functionality (Simplified)', () => {
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

  it('should render SidePanel with edit functionality', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 验证SidePanel存在
    const sidePanel = document.querySelector('.fixed.right-0');
    expect(sidePanel).toBeInTheDocument();

    // 验证SidePanel中的编辑区域
    expect(screen.getByText('参考翻译')).toBeInTheDocument();
    expect(screen.getByText('学习笔记')).toBeInTheDocument();
  });

  it('should toggle SidePanel visibility when edit button is clicked', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    const sidePanel = document.querySelector('.fixed.right-0');
    const editButton = screen.getByTitle('编辑卡片 (E)');
    
    // 记录初始状态
    const initiallyOpen = sidePanel?.classList.contains('translate-x-0');
    
    // 点击编辑按钮切换状态
    fireEvent.click(editButton);

    // 验证状态发生了变化
    await waitFor(() => {
      if (initiallyOpen) {
        expect(sidePanel).toHaveClass('translate-x-full');
      } else {
        expect(sidePanel).toHaveClass('translate-x-0');
      }
    });

    // 再次点击应该恢复原状态
    fireEvent.click(editButton);
    await waitFor(() => {
      if (initiallyOpen) {
        expect(sidePanel).toHaveClass('translate-x-0');
      } else {
        expect(sidePanel).toHaveClass('translate-x-full');
      }
    });
  });

  it('should display current card content in SidePanel', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 验证SidePanel中显示了正确的内容
    expect(screen.getByText('参考翻译')).toBeInTheDocument();
    expect(screen.getByText('学习笔记')).toBeInTheDocument();
    
    // 验证内容在SidePanel中显示
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('should adjust main content area margin based on SidePanel state', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    const mainContent = document.querySelector('.flex-1.transition-all');
    const sidePanel = document.querySelector('.fixed.right-0');
    const editButton = screen.getByTitle('编辑卡片 (E)');
    
    // 验证主内容区域边距与SidePanel状态相匹配
    if (sidePanel?.classList.contains('translate-x-0')) {
      expect(mainContent).toHaveClass('mr-[300px]');
    } else {
      expect(mainContent).toHaveClass('mr-0');
    }

    // 切换SidePanel状态
    fireEvent.click(editButton);
    
    // 验证边距也相应改变
    await waitFor(() => {
      if (sidePanel?.classList.contains('translate-x-0')) {
        expect(mainContent).toHaveClass('mr-[300px]');
      } else {
        expect(mainContent).toHaveClass('mr-0');
      }
    });
  });

  it('should render navigation buttons', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    // 验证导航按钮存在
    expect(screen.getByText('上一个')).toBeInTheDocument();
    expect(screen.getByText('下一个')).toBeInTheDocument();
    
    // 验证进度显示（可能有多个，所以使用getAllByText）
    const progressIndicators = screen.getAllByText('1 / 1');
    expect(progressIndicators.length).toBeGreaterThan(0);
  });
}); 