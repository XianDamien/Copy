import React, { useState } from 'react';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { CreateNoteRequest, NoteFields } from '../../shared/types';

interface NoteEditorProps {
  deckId: number;
  onBack: () => void;
  onNoteSaved?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ deckId, onBack, onNoteSaved }) => {
  const [formData, setFormData] = useState({
    chinese: '',
    english: '',
    pinyin: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiClient = new ApiClient();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.chinese.trim()) {
      newErrors.chinese = '请输入中文内容';
    }

    if (!formData.english.trim()) {
      newErrors.english = '请输入英文翻译';
    }

    // 简单的中文字符检测
    if (formData.chinese.trim() && !/[\u4e00-\u9fff]/.test(formData.chinese)) {
      newErrors.chinese = '请输入有效的中文字符';
    }

    // 简单的英文字符检测
    if (formData.english.trim() && !/[a-zA-Z]/.test(formData.english)) {
      newErrors.english = '请输入有效的英文字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const noteFields: NoteFields['CtoE'] = {
        chinese: formData.chinese.trim(),
        english: formData.english.trim(),
        pinyin: formData.pinyin.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      const noteRequest: CreateNoteRequest = {
        deckId,
        noteType: 'CtoE',
        fields: { CtoE: noteFields },
        tags: []
      };

      await apiClient.createNote(noteRequest);
      
      // 重置表单
      setFormData({
        chinese: '',
        english: '',
        pinyin: '',
        notes: ''
      });
      setErrors({});
      
      onNoteSaved?.();
      
      // 显示成功消息
      alert('笔记创建成功！');
      
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('创建笔记失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回牌组</span>
          </button>
          <div className="h-6 w-px bg-primary-300" />
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-primary-900">创建中英翻译笔记</h2>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || !formData.chinese.trim() || !formData.english.trim()}
          className="btn-accent flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? '保存中...' : '保存笔记'}</span>
        </button>
      </div>

      {/* 表单内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：中文输入 */}
        <div className="space-y-6">
          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center space-x-2">
              <span>🇨🇳</span>
              <span>中文原文</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  中文内容 *
                </label>
                <textarea
                  value={formData.chinese}
                  onChange={(e) => handleInputChange('chinese', e.target.value)}
                  placeholder="请输入中文句子或短语..."
                  rows={4}
                  className={`input-industrial resize-none ${errors.chinese ? 'border-red-500' : ''}`}
                />
                {errors.chinese && (
                  <p className="text-red-600 text-sm mt-1">{errors.chinese}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  拼音（可选）
                </label>
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={(e) => handleInputChange('pinyin', e.target.value)}
                  placeholder="例如：nǐ hǎo"
                  className="input-industrial"
                />
                <p className="text-primary-500 text-xs mt-1">
                  添加拼音有助于发音学习
                </p>
              </div>
            </div>
          </div>

          {/* 预览卡片 */}
          <div className="card-industrial p-6 bg-primary-25">
            <h4 className="text-md font-semibold text-primary-900 mb-3">卡片预览</h4>
            <div className="bg-white rounded-lg border-2 border-dashed border-primary-300 p-4 min-h-[120px] flex items-center justify-center">
              {formData.chinese ? (
                <div className="text-center">
                  <p className="text-lg text-primary-900 mb-2">{formData.chinese}</p>
                  {formData.pinyin && (
                    <p className="text-sm text-primary-600">{formData.pinyin}</p>
                  )}
                </div>
              ) : (
                <p className="text-primary-500 text-sm">输入中文内容后显示预览</p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：英文输入 */}
        <div className="space-y-6">
          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center space-x-2">
              <span>🇺🇸</span>
              <span>英文翻译</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  英文翻译 *
                </label>
                <textarea
                  value={formData.english}
                  onChange={(e) => handleInputChange('english', e.target.value)}
                  placeholder="请输入对应的英文翻译..."
                  rows={4}
                  className={`input-industrial resize-none ${errors.english ? 'border-red-500' : ''}`}
                />
                {errors.english && (
                  <p className="text-red-600 text-sm mt-1">{errors.english}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  学习笔记（可选）
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="记录语法要点、使用场景等..."
                  rows={3}
                  className="input-industrial resize-none"
                />
                <p className="text-primary-500 text-xs mt-1">
                  添加个人笔记有助于记忆
                </p>
              </div>
            </div>
          </div>

          {/* 答案预览 */}
          <div className="card-industrial p-6 bg-accent-25">
            <h4 className="text-md font-semibold text-primary-900 mb-3">答案预览</h4>
            <div className="bg-white rounded-lg border-2 border-dashed border-accent-300 p-4 min-h-[120px] flex items-center justify-center">
              {formData.english ? (
                <div className="text-center">
                  <p className="text-lg text-primary-900 mb-2">{formData.english}</p>
                  {formData.notes && (
                    <div className="text-sm text-primary-600 mt-3 p-2 bg-primary-50 rounded">
                      <strong>笔记：</strong> {formData.notes}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-primary-500 text-sm">输入英文翻译后显示预览</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-primary-900 mb-1">学习提示</h4>
            <ul className="text-sm text-primary-600 space-y-1">
              <li>• 保存后将自动生成复习卡片</li>
              <li>• 系统会根据FSRS算法安排复习时间</li>
              <li>• 建议添加拼音和笔记以提高学习效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 