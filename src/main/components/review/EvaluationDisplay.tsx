import React from 'react';

export interface EvaluationDisplayProps {
  originalText: string;
  userTranslation: string;
  referenceTranslation: string;
}

export const EvaluationDisplay: React.FC<EvaluationDisplayProps> = ({
  originalText,
  userTranslation,
  referenceTranslation
}) => {
  return (
    <div className="space-y-6 mb-6">
      {/* 原文 */}
      <div className="bg-primary-50 rounded-lg p-4 border-l-4 border-primary-500">
        <h4 className="text-sm font-medium text-primary-600 mb-2">原文</h4>
        <p className="text-primary-900 text-base leading-relaxed">
          {originalText}
        </p>
      </div>

      {/* 您的翻译 */}
      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
        <h4 className="text-sm font-medium text-blue-600 mb-2">您的翻译</h4>
        <p className="text-blue-900 text-base leading-relaxed">
          {userTranslation || '（未输入翻译）'}
        </p>
      </div>

      {/* 参考翻译 */}
      {referenceTranslation && (
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <h4 className="text-sm font-medium text-green-600 mb-2">参考翻译</h4>
          <div 
            className="text-green-900 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: referenceTranslation }}
          />
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <p className="text-amber-800 text-sm">
          💡 请对比您的翻译与参考翻译，诚实地评估您的表现。这将帮助系统为您安排合适的复习时间。
        </p>
      </div>
    </div>
  );
};

export default EvaluationDisplay; 