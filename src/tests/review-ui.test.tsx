import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Review } from '../main/pages/Review';

const mockNote = {
  id: 1,
  fields: {
    CtoE: {
      chinese: '你好',
      english: 'Hello'
    }
  }
};

const mockCard = { id: 1, noteId: 1, note: mockNote, state: 'new' };

// Mock ApiClient
vi.mock('../shared/utils/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getDeck: vi.fn().mockResolvedValue({ id: 1, name: 'Test Deck' }),
    buildQueue: vi.fn().mockResolvedValue([mockCard]),
    getNoteById: vi.fn().mockResolvedValue(mockNote),
    updateCard: vi.fn().mockResolvedValue({}),
    reviewCard: vi.fn().mockResolvedValue({})
  }))
}));

describe('Review Component', () => {
  const mockOnBack = vi.fn();
  const mockOnEditNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(<Review deckId={1} onBack={mockOnBack} onEditNote={mockOnEditNote} />);
  };

  it('loads cards and shows question', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });
  });

  it('shows translation after clicking hint button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });

    const hintButton = screen.getByText(/show translation/i);
    await fireEvent.click(hintButton);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('enters evaluation state after completing cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('你好')).toBeInTheDocument();
    });

    // Complete the card
    const showAnswerButton = screen.getByText(/show answer/i);
    await fireEvent.click(showAnswerButton);

    const goodButton = screen.getByText(/good/i);
    await fireEvent.click(goodButton);

    // Should enter evaluation state
    await waitFor(() => {
      expect(screen.getByText(/evaluate your understanding/i)).toBeInTheDocument();
    });
  });

  it('handles difficulty selection in evaluation state', async () => {
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
    const mediumButton = screen.getByText(/medium/i);
    await fireEvent.click(mediumButton);

    // Should update card and complete review
    await waitFor(() => {
      expect(screen.getByText(/review completed/i)).toBeInTheDocument();
    });
  });
}); 