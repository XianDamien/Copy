import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Review } from '../main/pages/Review';
import { ApiClient } from '../shared/utils/api';

const mockNote1 = {
  id: 1,
  fields: {
    CtoE: {
      chinese: '你好',
      english: 'Hello'
    }
  }
};

const mockNote2 = {
  id: 2,
  fields: {
    CtoE: {
      chinese: '再见',
      english: 'Goodbye'
    }
  }
};

const mockCards = [
  { id: 1, noteId: 1, note: mockNote1, state: 'new' },
  { id: 2, noteId: 2, note: mockNote2, state: 'new' }
];

// Mock ApiClient
vi.mock('../shared/utils/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getDeck: vi.fn().mockResolvedValue({ id: 1, name: 'Test Deck' }),
    buildQueue: vi.fn().mockResolvedValue(mockCards),
    getNoteById: vi.fn((noteId) => {
      if (noteId === 1) return Promise.resolve(mockNote1);
      if (noteId === 2) return Promise.resolve(mockNote2);
      return Promise.resolve(null);
    }),
    updateCard: vi.fn().mockResolvedValue({}),
    reviewCard: vi.fn().mockResolvedValue({})
  }))
}));

describe('Learning Flow', () => {
  const mockOnBack = vi.fn();
  const mockOnEditNote = vi.fn();
  let mockApiClient: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient = new ApiClient();
  });

  const renderComponent = () => {
    return render(<Review deckId={1} onBack={mockOnBack} onEditNote={mockOnEditNote} />);
  };

  it('collects cards for evaluation during review', async () => {
    renderComponent();

    // Complete first card
    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });

    const showAnswerButton = screen.getByText(/show answer/i);
    await fireEvent.click(showAnswerButton);

    const goodButton = screen.getByText(/good/i);
    await fireEvent.click(goodButton);

    // Complete second card
    await waitFor(() => {
      expect(screen.getByText('再见')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText(/show answer/i));
    await fireEvent.click(screen.getByText(/good/i));

    // Should enter evaluation state
    await waitFor(() => {
      expect(screen.getByText(/evaluate your understanding/i)).toBeInTheDocument();
    });
  });

  it('schedules cards with different intervals based on difficulty', async () => {
    renderComponent();

    // Complete review and enter evaluation
    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });

    const showAnswerButton = screen.getByText(/show answer/i);
    await fireEvent.click(showAnswerButton);

    const goodButton = screen.getByText(/good/i);
    await fireEvent.click(goodButton);

    // In evaluation state
    await waitFor(() => {
      expect(screen.getByText(/evaluate your understanding/i)).toBeInTheDocument();
    });

    // Show translation
    const showTranslationButton = screen.getByText(/show translation/i);
    await fireEvent.click(showTranslationButton);

    // Select difficulty
    const hardButton = screen.getByText(/hard/i);
    await fireEvent.click(hardButton);

    // Verify card update was called
    expect(mockApiClient.reviewCard).toHaveBeenCalled();
  });

  it('completes review after evaluating all cards', async () => {
    renderComponent();

    // Complete both cards
    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });

    const showAnswerButton = screen.getByText(/show answer/i);
    await fireEvent.click(showAnswerButton);

    const goodButton = screen.getByText(/good/i);
    await fireEvent.click(goodButton);

    await waitFor(() => {
      expect(screen.getByText('再见')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText(/show answer/i));
    await fireEvent.click(screen.getByText(/good/i));

    // Evaluate first card
    await waitFor(() => {
      expect(screen.getByText(/evaluate your understanding/i)).toBeInTheDocument();
    });

    const showTranslationButton = screen.getByText(/show translation/i);
    await fireEvent.click(showTranslationButton);

    const mediumButton = screen.getByText(/medium/i);
    await fireEvent.click(mediumButton);

    // Evaluate second card
    await waitFor(() => {
      expect(screen.getByText('再见')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText(/show translation/i));
    await fireEvent.click(screen.getByText(/medium/i));

    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByText(/review completed/i)).toBeInTheDocument();
    });
  });
}); 