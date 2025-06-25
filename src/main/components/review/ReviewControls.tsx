import React from 'react';
import { Edit3, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

export type ReviewState = 'deck-selection' | 'loading' | 'question' | 'task-question' | 'task-evaluation' | 'answer' | 'completed' | 'no-cards' | 'evaluation';
export type AppRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface ReviewControlsProps {
  reviewState: ReviewState;
  onShowAnswer: () => void;
  onSubmitRating: (rating: AppRating) => void;
  onEditCard: () => void;
  onSkipCard: () => void;
  onPreviousCard: () => void;
  onNextCard: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentCardIndex: number;
  totalCards: number;
}

export const ReviewControls: React.FC<ReviewControlsProps> = ({
  reviewState,
  onShowAnswer,
  onSubmitRating,
  onEditCard,
  onSkipCard,
  onPreviousCard,
  onNextCard,
  canGoPrevious,
  canGoNext,
  currentCardIndex,
  totalCards
}) => {
  // 显示答案按钮 (问题状态时显示)
  const renderShowAnswerButton = () => {
    if (reviewState !== 'question') return null;
    
    return (
      <div className="flex justify-center mb-6">
        <button
          onClick={onShowAnswer}
          className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          显示答案 (空格键)
        </button>
      </div>
    );
  };

  // 评分按钮 (答案状态时显示)
  const renderRatingButtons = () => {
    if (reviewState !== 'answer') return null;

    const ratings: { rating: AppRating; label: string; color: string; key: string }[] = [
      { rating: 'Again', label: '重来', color: 'bg-red-500 hover:bg-red-600', key: '1' },
      { rating: 'Hard', label: '困难', color: 'bg-orange-500 hover:bg-orange-600', key: '2' },
      { rating: 'Good', label: '良好', color: 'bg-green-500 hover:bg-green-600', key: '3' },
      { rating: 'Easy', label: '简单', color: 'bg-blue-500 hover:bg-blue-600', key: '4' }
    ];

    return (
      <div className="flex justify-center gap-3 mb-6">
        {ratings.map(({ rating, label, color, key }) => (
          <button
            key={rating}
            onClick={() => onSubmitRating(rating)}
            className={`${color} text-white px-4 py-2 rounded-md font-medium transition-colors min-w-[80px]`}
            title={`${label} (${key})`}
          >
            {label}
            <span className="text-xs block opacity-75">({key})</span>
          </button>
        ))}
      </div>
    );
  };

  // 导航和操作按钮
  const renderNavigationButtons = () => {
    if (reviewState !== 'question' && reviewState !== 'answer') return null;

    return (
      <div className="flex justify-between items-center">
        {/* 左侧：上一个按钮 */}
        <button
          onClick={onPreviousCard}
          disabled={!canGoPrevious}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            canGoPrevious 
              ? 'bg-primary-100 hover:bg-primary-200 text-primary-700' 
              : 'bg-primary-50 text-primary-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={20} />
          上一个
        </button>

        {/* 中间：进度指示和操作按钮 */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-primary-600">
            {currentCardIndex + 1} / {totalCards}
          </span>
          
          {/* 编辑按钮 */}
          <button
            onClick={onEditCard}
            className="p-2 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
            title="编辑卡片 (E)"
          >
            <Edit3 size={18} />
          </button>

          {/* 跳过按钮 */}
          <button
            onClick={onSkipCard}
            className="p-2 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
            title="跳过卡片 (S)"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* 右侧：下一个按钮 */}
        <button
          onClick={onNextCard}
          disabled={!canGoNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            canGoNext 
              ? 'bg-primary-100 hover:bg-primary-200 text-primary-700' 
              : 'bg-primary-50 text-primary-400 cursor-not-allowed'
          }`}
        >
          下一个
          <ChevronRight size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderShowAnswerButton()}
      {renderRatingButtons()}
      {renderNavigationButtons()}
    </div>
  );
};

export default ReviewControls; 