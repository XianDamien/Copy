import React from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';

export interface SelfEvaluationControlsProps {
  onEvaluate: (rating: 'Good' | 'Again') => void;
}

export const SelfEvaluationControls: React.FC<SelfEvaluationControlsProps> = ({ onEvaluate }) => {
  return (
    <div className="mb-6">
      {/* 评级说明 */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-2">请评估您的翻译完成情况：</p>
        <div className="flex justify-center gap-8 text-xs text-gray-500">
          <span>✓ 做对了 = 良好 (Good)</span>
          <span>↻ 需要练习 = 重来 (Again)</span>
        </div>
      </div>
      
      {/* 评级按钮 */}
      <div className="flex justify-center gap-4">
      <button
        onClick={() => onEvaluate('Good')}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <CheckCircle size={18} />
        我做对了
      </button>
      <button
        onClick={() => onEvaluate('Again')}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        <RotateCcw size={18} />
        我还需要练习
      </button>
      </div>
    </div>
  );
};

export default SelfEvaluationControls; 