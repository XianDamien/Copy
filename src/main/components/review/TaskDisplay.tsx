import React from 'react';

export interface TaskDisplayProps {
  originalText: string;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ originalText }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-primary-800 mb-4">
        请翻译以下内容：
      </h3>
      <div className="bg-primary-50 rounded-md p-4 border-l-4 border-accent-500">
        <div 
          className="text-primary-900 text-lg leading-relaxed font-medium"
          dangerouslySetInnerHTML={{ __html: originalText }}
        />
      </div>
    </div>
  );
};

export default TaskDisplay;
