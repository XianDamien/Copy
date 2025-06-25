import React from 'react';
import { Send, SkipForward, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TaskControlsProps {
  onSubmit: () => void;
  onSkip: () => void;
  onEditCard?: () => void;
  onPreviousCard?: () => void;
  onNextCard?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  currentCardIndex?: number;
  totalCards?: number;
}

export const TaskControls: React.FC<TaskControlsProps> = ({ 
  onSubmit, 
  onSkip, 
  onEditCard,
  onPreviousCard,
  onNextCard,
  canGoPrevious = false,
  canGoNext = false,
  currentCardIndex = 0,
  totalCards = 0
}) => {
  return (
    <div className="space-y-4">
      {/* 主要操作按钮 */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={onSubmit}
          className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Send size={18} />
          提交翻译
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-2 bg-primary-200 hover:bg-primary-300 text-primary-700 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <SkipForward size={18} />
          无法完成
        </button>
      </div>

      {/* 导航和编辑控制栏 */}
      {(onEditCard || onPreviousCard || onNextCard) && (
        <div className="flex justify-between items-center">
          {/* 左侧：上一个按钮 */}
          {onPreviousCard && (
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
          )}

          {/* 中间：进度指示和编辑按钮 */}
          <div className="flex items-center gap-4">
            {totalCards > 0 && (
              <span className="text-sm text-primary-600">
                {currentCardIndex + 1} / {totalCards}
              </span>
            )}
            
            {/* 编辑按钮 */}
            {onEditCard && (
              <button
                onClick={onEditCard}
                className="p-2 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                title="编辑卡片 (E)"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>

          {/* 右侧：下一个按钮 */}
          {onNextCard && (
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
          )}
        </div>
      )}
    </div>
  );
};

export default TaskControls; 