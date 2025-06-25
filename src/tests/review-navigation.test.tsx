
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

describe('Review Component - Navigation Functionality', () => {
  const mockCards: Card[] = [
    {
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
    },
    {
      id: 2,
      noteId: 2,
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
    },
    {
      id: 3,
      noteId: 3,
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
    }
  ];

  const mockNotes: Note[] = [
    {
      id: 1,
      deckId: 1,
      noteType: 'CtoE',
      fields: {
        CtoE: {
          chinese: '第一张卡片',
          english: 'First card',
          pinyin: 'dì yī zhāng kǎ piàn',
          notes: 'First card notes'
        }
      },
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      deckId: 1,
      noteType: 'CtoE',
      fields: {
        CtoE: {
          chinese: '第二张卡片',
          english: 'Second card',
          pinyin: 'dì èr zhāng kǎ piàn',
          notes: 'Second card notes'
        }
      },
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      deckId: 1,
      noteType: 'CtoE',
      fields: {
        CtoE: {
          chinese: '第三张卡片',
          english: 'Third card',
          pinyin: 'dì sān zhāng kǎ piàn',
          notes: 'Third card notes'
        }
      },
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

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
    mockApiClient.buildQueue.mockResolvedValue(mockCards);
    mockApiClient.getAllDecks.mockResolvedValue([mockDeck]);
    
    // Mock getNoteById to return different notes based on noteId
    mockApiClient.getNoteById.mockImplementation((noteId: number) => {
      return Promise.resolve(mockNotes.find(note => note.id === noteId));
    });
  });

  it('should render navigation buttons with correct state', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成，显示第一张卡片
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 验证导航按钮存在
    const previousButton = screen.getByText('上一个');
    const nextButton = screen.getByText('下一个');
    
    expect(previousButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    // 第一张卡片时，上一个按钮应该被禁用
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();
  });

  it('should display correct progress indicator', async () => {
    render(<Review deckId={1} />);

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 验证进度指示器显示正确
    const progressIndicators = screen.getAllByText('1 / 3');
    expect(progressIndicators.length).toBeGreaterThan(0);
  });

  it('should navigate to next card when next button is clicked', async () => {
    render(<Review deckId={1} />);

    // 等待第一张卡片加载
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 点击下一个按钮
    const nextButton = screen.getByText('下一个');
    fireEvent.click(nextButton);

    // 应该显示第二张卡片
    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
    });

    // 进度指示器应该更新
    const progressIndicators = screen.getAllByText('2 / 3');
    expect(progressIndicators.length).toBeGreaterThan(0);
  });

  it('should navigate to previous card when previous button is clicked', async () => {
    render(<Review deckId={1} />);

    // 等待第一张卡片加载
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 先导航到第二张卡片
    const nextButton = screen.getByText('下一个');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
    });

    // 然后点击上一个按钮
    const previousButton = screen.getByText('上一个');
    fireEvent.click(previousButton);

    // 应该回到第一张卡片
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 进度指示器应该更新
    const progressIndicators = screen.getAllByText('1 / 3');
    expect(progressIndicators.length).toBeGreaterThan(0);
  });

  it('should disable navigation buttons at boundaries', async () => {
    render(<Review deckId={1} />);

    // 等待第一张卡片加载
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    let previousButton = screen.getByText('上一个');
    let nextButton = screen.getByText('下一个');

    // 在第一张卡片时，上一个按钮应该被禁用
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // 导航到最后一张卡片
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
    });

    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText('第三张卡片')).toBeInTheDocument();
    });

    // 重新获取按钮引用（因为组件重新渲染）
    previousButton = screen.getByText('上一个');
    nextButton = screen.getByText('下一个');

    // 在最后一张卡片时，下一个按钮应该被禁用
    expect(previousButton).toBeEnabled();
    expect(nextButton).toBeDisabled();
  });

  it('should reset review state when navigating between cards', async () => {
    render(<Review deckId={1} />);

    // 等待第一张卡片加载
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 显示答案
    const showAnswerButton = screen.getByText('显示答案 (空格键)');
    fireEvent.click(showAnswerButton);

    // 验证答案状态
    await waitFor(() => {
      expect(screen.getByText('重来')).toBeInTheDocument();
    });

    // 导航到下一张卡片
    const nextButton = screen.getByText('下一个');
    fireEvent.click(nextButton);

    // 应该回到问题状态
    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
      expect(screen.getByText('显示答案 (空格键)')).toBeInTheDocument();
    });

    // 答案状态的按钮不应该显示
    expect(screen.queryByText('重来')).not.toBeInTheDocument();
  });

  it('should maintain card-specific content when navigating', async () => {
    render(<Review deckId={1} />);

    // 等待第一张卡片加载
    await waitFor(() => {
      expect(screen.getByText('第一张卡片')).toBeInTheDocument();
    });

    // 导航到第二张卡片
    const nextButton = screen.getByText('下一个');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
    });

    // 导航到第三张卡片
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('第三张卡片')).toBeInTheDocument();
    });

    // 回到第二张卡片
    const previousButton = screen.getByText('上一个');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('第二张卡片')).toBeInTheDocument();
    });

    // 验证内容确实是第二张卡片的内容
    expect(screen.queryByText('第一张卡片')).not.toBeInTheDocument();
    expect(screen.queryByText('第三张卡片')).not.toBeInTheDocument();
  });
}); 