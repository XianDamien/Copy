import React from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';

export interface SelfEvaluationControlsProps {
  onEvaluate: (rating: 'Good' | 'Again') => void;
}

export const SelfEvaluationControls: React.FC<SelfEvaluationControlsProps> = ({ onEvaluate }) => {
  return (
    <div className="flex justify-center gap-4 mb-6">
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
  );
};

export default SelfEvaluationControls; 