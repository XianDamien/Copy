import React from 'react';
import { Save, Volume2 } from 'lucide-react';
import type { Note, Card } from '../../../shared/types';
import RichTextEditor from '../common/RichTextEditor';
import AudioPlayer from './AudioPlayer';

export interface CardDisplayProps {
  note: Note;
  card?: Card; // 添加card参数以获取audioId
  showAnswer: boolean;
  onNoteChange?: (newContent: string) => void;
  editedNotes?: string | null;
  isDirty?: boolean;
  onSave?: () => void;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  note,
  card,
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

  // 判断是否为音频卡片
  // const isAudioCard = card?.cardType === 'audio_comprehension' || card?.audioId;
  const shouldShowAudioFirst = card?.cardType === 'audio_comprehension';

  return (
    <div className="max-w-4xl mx-auto">
      {/* 音频播放器 - 如果有audioId */}
      {card?.audioId && (
        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">
                {shouldShowAudioFirst ? '听音频回答问题' : '音频内容'}
              </h3>
            </div>
            <AudioPlayer 
              audioId={card.audioId}
              autoPlay={false}
              className="bg-white"
            />
          </div>
        </div>
      )}

      {/* 卡片正面 - 根据卡片类型调整显示 */}
      {!shouldShowAudioFirst && (
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
      )}

      {/* 音频理解卡片的问题显示 */}
      {shouldShowAudioFirst && !showAnswer && (
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 mb-4">
          <div className="text-center">
            <h2 className="text-sm font-medium text-primary-500 mb-2">听音频并理解内容</h2>
            <div className="text-lg text-primary-700 py-4">
              请听上方的音频内容，理解其含义
            </div>
            <div className="text-sm text-gray-500">
              点击"显示答案"查看原文和翻译
            </div>
          </div>
        </div>
      )}

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