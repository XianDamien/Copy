import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskControls from '../main/components/review/TaskControls';
import type { TaskControlsProps } from '../main/components/review/TaskControls';

describe('TaskControls - Enhanced Functionality', () => {
  const mockProps: TaskControlsProps = {
    onSubmit: vi.fn(),
    onSkip: vi.fn(),
    onEditCard: vi.fn(),
    onPreviousCard: vi.fn(),
    onNextCard: vi.fn(),
    canGoPrevious: true,
    canGoNext: true,
    currentCardIndex: 1,
    totalCards: 3
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render basic submit and skip buttons', () => {
    render(<TaskControls onSubmit={mockProps.onSubmit} onSkip={mockProps.onSkip} />);
    
    expect(screen.getByText('提交翻译')).toBeInTheDocument();
    expect(screen.getByText('无法完成')).toBeInTheDocument();
  });

  it('should render edit button when onEditCard is provided', () => {
    render(<TaskControls {...mockProps} />);
    
    const editButton = screen.getByTitle('编辑卡片 (E)');
    expect(editButton).toBeInTheDocument();
  });

  it('should render navigation buttons when navigation functions are provided', () => {
    render(<TaskControls {...mockProps} />);
    
    expect(screen.getByText('上一个')).toBeInTheDocument();
    expect(screen.getByText('下一个')).toBeInTheDocument();
  });

  it('should display progress indicator correctly', () => {
    render(<TaskControls {...mockProps} />);
    
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should call onEditCard when edit button is clicked', () => {
    render(<TaskControls {...mockProps} />);
    
    const editButton = screen.getByTitle('编辑卡片 (E)');
    fireEvent.click(editButton);
    
    expect(mockProps.onEditCard).toHaveBeenCalledTimes(1);
  });

  it('should call navigation functions when buttons are clicked', () => {
    render(<TaskControls {...mockProps} />);
    
    const previousButton = screen.getByText('上一个');
    const nextButton = screen.getByText('下一个');
    
    fireEvent.click(previousButton);
    expect(mockProps.onPreviousCard).toHaveBeenCalledTimes(1);
    
    fireEvent.click(nextButton);
    expect(mockProps.onNextCard).toHaveBeenCalledTimes(1);
  });

  it('should disable navigation buttons based on canGo props', () => {
    const propsWithDisabledNav = {
      ...mockProps,
      canGoPrevious: false,
      canGoNext: false
    };
    
    render(<TaskControls {...propsWithDisabledNav} />);
    
    const previousButton = screen.getByText('上一个');
    const nextButton = screen.getByText('下一个');
    
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should call submit and skip functions', () => {
    render(<TaskControls {...mockProps} />);
    
    const submitButton = screen.getByText('提交翻译');
    const skipButton = screen.getByText('无法完成');
    
    fireEvent.click(submitButton);
    expect(mockProps.onSubmit).toHaveBeenCalledTimes(1);
    
    fireEvent.click(skipButton);
    expect(mockProps.onSkip).toHaveBeenCalledTimes(1);
  });

  it('should not render navigation controls when functions are not provided', () => {
    render(<TaskControls onSubmit={mockProps.onSubmit} onSkip={mockProps.onSkip} />);
    
    expect(screen.queryByText('上一个')).not.toBeInTheDocument();
    expect(screen.queryByText('下一个')).not.toBeInTheDocument();
    expect(screen.queryByTitle('编辑卡片 (E)')).not.toBeInTheDocument();
  });

  it('should have proper styling for enabled and disabled navigation buttons', () => {
    render(<TaskControls {...mockProps} canGoPrevious={true} canGoNext={false} />);
    
    const previousButton = screen.getByText('上一个');
    const nextButton = screen.getByText('下一个');
    
    // Previous button should be enabled
    expect(previousButton).not.toBeDisabled();
    expect(previousButton).toHaveClass('bg-primary-100', 'hover:bg-primary-200', 'text-primary-700');
    
    // Next button should be disabled
    expect(nextButton).toBeDisabled();
    expect(nextButton).toHaveClass('bg-primary-50', 'text-primary-400', 'cursor-not-allowed');
  });
}); 