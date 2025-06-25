import React from 'react';
import { Save } from 'lucide-react';
import type { Note } from '../../../shared/types';
import RichTextEditor from '../common/RichTextEditor';

export interface CardDisplayProps {
  note: Note;
  showAnswer: boolean;
  onNoteChange?: (newContent: string) => void;
  editedNotes?: string | null;
  isDirty?: boolean;
  onSave?: () => void;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  note,
  showAnswer,
  onNoteChange,
  editedNotes,
  isDirty = false,
  onSave
}) => {
  // 获取 CtoE 类型的字段
  const ctoEFields = note.fields.CtoE;
  
  if (!ctoEFields) {
    return (
      <div className="text-center text-primary-500 py-8">
        <p>暂不支持此类型的笔记</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 卡片正面 - 原文 */}
      <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 mb-4">
        <div className="text-center">
          <h2 className="text-sm font-medium text-primary-500 mb-2">原文</h2>
          <div
            className="text-2xl font-medium text-primary-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: ctoEFields.chinese }}
          />
          {ctoEFields.pinyin && (
            <div className="text-sm text-primary-600 mt-2 italic">
              {ctoEFields.pinyin}
            </div>
          )}
        </div>
      </div>

      {/* 卡片背面 - 答案区域 */}
      {showAnswer && (
        <div className="space-y-4">
          {/* 学习笔记 - 使用富文本编辑器 */}
          <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-primary-700">学习笔记</h3>
              {onSave && (
                <button
                  onClick={onSave}
                  disabled={!isDirty}
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    isDirty 
                      ? 'bg-accent-500 hover:bg-accent-600 text-white' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={14} />
                  保存
                </button>
              )}
            </div>
            <RichTextEditor
              value={editedNotes ?? (ctoEFields.notes || '')}
              onChange={onNoteChange || (() => {})}
              placeholder="点击此处开始记录学习笔记..."
            />
          </div>
        </div>
      )}

      {/* 用户输入区域 - 翻译输入框 */}
      {showAnswer && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">您的翻译</h3>
          <textarea
            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
            placeholder="请输入您的翻译..."
          />
        </div>
      )}
    </div>
  );
};

export default CardDisplay; 