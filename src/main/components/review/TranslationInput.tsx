import React from 'react';

export interface TranslationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TranslationInput: React.FC<TranslationInputProps> = ({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-primary-700 mb-3">
        您的翻译：
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请在此输入您的翻译..."
        className="w-full min-h-[120px] p-4 border border-primary-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none text-base leading-relaxed"
        autoFocus
      />
      <div className="mt-2 text-sm text-primary-500">
        提示：输入完成后点击"提交"按钮进行自我评估
      </div>
    </div>
  );
};

export default TranslationInput; 