import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, BookOpen, FileText, Edit3 } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { CreateNoteRequest, NoteFields, Note, NoteType } from '../../shared/types';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { createNoteContext, extractFormFields } from '../../shared/utils/contextUtils';
import type { NoteContext } from '../../shared/types/aiTypes';
import { useAIService } from '../../shared/hooks/useAIService';

interface NoteEditorProps {
  deckId: number;
  noteId?: number; // Optional noteId for edit mode
  noteType?: NoteType; // Optional noteType for creation mode
  onBack: () => void;
  onNoteSaved?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ deckId, noteId, noteType, onBack, onNoteSaved }) => {
  // State for note type selection
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType | undefined>(noteType);
  const [showTypeSelection, setShowTypeSelection] = useState(!noteType && !noteId);
  
  // State for CtoE form data
  const [formData, setFormData] = useState({
    chinese: '',
    english: '',
    pinyin: '',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiClient = new ApiClient();
  const isEditMode = !!noteId;

  // AI Service integration
  const aiService = useAIService({
    onSuccess: (response) => {
      console.log('AI request successful:', response);
    },
    onError: (error) => {
      console.error('AI request failed:', error);
    }
  });

  // Fetch existing note data when in edit mode
  useEffect(() => {
    if (noteId) {
      loadNoteData();
    }
  }, [noteId]);

  const loadNoteData = async () => {
    try {
      setLoading(true);
      const note: Note = await apiClient.getNoteById(noteId!);
      
      // Set the note type based on the loaded note
      setSelectedNoteType(note.noteType);
      setShowTypeSelection(false);
      
      // Populate form data based on note type
      if (note.noteType === 'CtoE' && note.fields.CtoE) {
        setFormData({
          chinese: note.fields.CtoE.chinese || '',
          english: note.fields.CtoE.english || '',
          pinyin: note.fields.CtoE.pinyin || '',
          notes: note.fields.CtoE.notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      alert('加载笔记失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.chinese.trim()) {
      newErrors.chinese = '请输入原文内容';
    }

    if (!formData.english.trim()) {
      newErrors.english = '请输入翻译内容';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedNoteType) return;
    
    // Validate based on note type
    if (selectedNoteType === 'CtoE' && !validateForm()) return;

    setSaving(true);
    try {
      let noteFields: Partial<NoteFields> = {};
      
      if (selectedNoteType === 'CtoE') {
        noteFields.CtoE = {
        chinese: formData.chinese.trim(),
        english: formData.english.trim(),
        pinyin: formData.pinyin.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };
      }

      if (isEditMode) {
        // Update existing note
        const updates = {
          fields: noteFields,
          tags: [] // Keep existing tags for now
        };
        await apiClient.updateNote(noteId!, updates);
        alert('笔记更新成功！');
      } else {
        // Create new note
      const noteRequest: CreateNoteRequest = {
        deckId,
          noteType: selectedNoteType,
          fields: noteFields,
        tags: []
      };
      await apiClient.createNote(noteRequest);
      
        // Reset form only when creating
        if (selectedNoteType === 'CtoE') {
      setFormData({
        chinese: '',
        english: '',
        pinyin: '',
        notes: ''
      });
        }
        alert('笔记创建成功！');
      }
      
      setErrors({});
      onNoteSaved?.();
      
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} note:`, error);
      alert(`${isEditMode ? '更新' : '创建'}笔记失败，请重试`);
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

  /**
   * Create context for AI assistance
   */
  const createContextForField = useCallback((currentField: string, selectedText: string): NoteContext => {
    if (!selectedNoteType) {
      throw new Error('Note type not selected');
    }

    // Extract form fields using utility function
    const allFields = extractFormFields(selectedNoteType, formData);

    return createNoteContext(
      selectedNoteType,
      allFields,
      currentField,
      selectedText,
      noteId,
      deckId
    );
  }, [selectedNoteType, formData, noteId, deckId]);

  /**
   * Handle AI assistance request from RichTextEditor
   */
  const handleAIRequest = useCallback((selectedText: string, fieldName: string) => {
    if (!selectedNoteType) {
      console.error('No note type selected for AI request');
      return;
    }

    try {
      const context = createContextForField(fieldName, selectedText);
      
      // Make AI request with 'explain' action as default
      // In a more advanced implementation, we could show action selection
      aiService.makeRequest('explain', selectedText, context);
      
      console.log('AI request initiated:', { selectedText, fieldName, context });
    } catch (error) {
      console.error('Failed to create AI context:', error);
    }
  }, [selectedNoteType, createContextForField, aiService]);

  const handleNoteTypeSelect = (noteType: NoteType) => {
    setSelectedNoteType(noteType);
    setShowTypeSelection(false);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-primary-600">加载中...</div>
      </div>
    );
  }

  // Show note type selection screen
  if (showTypeSelection && !isEditMode) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft size={20} />
              返回
            </button>
            <div className="w-px h-6 bg-primary-300"></div>
            <h1 className="text-2xl font-bold text-primary-900">选择笔记类型</h1>
          </div>

          {/* Note Type Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CtoE Card */}
            <button
              onClick={() => handleNoteTypeSelect('CtoE')}
              className="bg-white rounded-lg p-6 border-2 border-primary-200 hover:border-accent-500 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="text-accent-500" size={24} />
                <h3 className="text-lg font-semibold text-primary-900">中英对照</h3>
              </div>
              <p className="text-primary-600 text-sm">
                适合学习中英文对照内容，支持拼音标注和个人笔记
              </p>
            </button>

            {/* Other note types - keeping them for future implementation */}
            <button
              onClick={() => handleNoteTypeSelect('Retranslate')}
              className="bg-white rounded-lg p-6 border-2 border-primary-200 hover:border-accent-500 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <Edit3 className="text-accent-500" size={24} />
                <h3 className="text-lg font-semibold text-primary-900">重译练习</h3>
              </div>
              <p className="text-primary-600 text-sm">
                通过重新翻译原文来练习语言技能
              </p>
            </button>

            <button
              onClick={() => handleNoteTypeSelect('SentenceParaphrase')}
              className="bg-white rounded-lg p-6 border-2 border-primary-200 hover:border-accent-500 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <FileText className="text-accent-500" size={24} />
                <h3 className="text-lg font-semibold text-primary-900">句子复述</h3>
              </div>
              <p className="text-primary-600 text-sm">
                练习听写和复述，提高语音理解能力
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft size={20} />
            返回
          </button>
          <div className="w-px h-6 bg-primary-300"></div>
          <h1 className="text-2xl font-bold text-primary-900">
            {isEditMode ? '编辑笔记' : '创建笔记'}
          </h1>
          {selectedNoteType && (
            <span className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm font-medium">
              {selectedNoteType === 'CtoE' ? '中英对照' : selectedNoteType}
            </span>
          )}
        </div>
        
        {/* CtoE Form */}
        {selectedNoteType === 'CtoE' && (
          <div className="bg-white rounded-lg shadow-industrial border border-primary-200">
            <div className="p-6 border-b border-primary-200">
              <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                <BookOpen size={20} className="text-accent-500" />
                中英对照笔记
              </h2>
      </div>

            <div className="p-6 space-y-6">
              {/* Chinese Input */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  原文内容 *
                </label>
                <RichTextEditor
                  value={formData.chinese}
                  onChange={(html) => handleInputChange('chinese', html)}
                  onAIRequest={(selectedText) => {
                    handleAIRequest(selectedText, 'chinese');
                  }}
                  placeholder="请输入中文原文..."
                  className={`w-full ${
                    errors.chinese ? 'border-red-500' : ''
                  }`}
                  minHeight="h-24"
                />
                {errors.chinese && (
                  <p className="text-red-500 text-sm mt-1">{errors.chinese}</p>
                )}
              </div>

              {/* English Input */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  英文翻译 *
                </label>
                <RichTextEditor
                  value={formData.english}
                  onChange={(html) => handleInputChange('english', html)}
                  onAIRequest={(selectedText) => {
                    handleAIRequest(selectedText, 'english');
                  }}
                  placeholder="请输入英文翻译..."
                  className={`w-full ${
                    errors.english ? 'border-red-500' : ''
                  }`}
                  minHeight="h-24"
                />
                {errors.english && (
                  <p className="text-red-500 text-sm mt-1">{errors.english}</p>
                )}
              </div>

              {/* Pinyin Input */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  拼音标注 (可选)
                </label>
                <input
                  type="text"
                  value={formData.pinyin}
                  onChange={(e) => handleInputChange('pinyin', e.target.value)}
                  placeholder="请输入拼音..."
                  className="w-full px-3 py-2 border border-primary-300 rounded-md focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  个人笔记 (可选)
                </label>
                <RichTextEditor
                  value={formData.notes}
                  onChange={(html) => handleInputChange('notes', html)}
                  onAIRequest={(selectedText) => {
                    handleAIRequest(selectedText, 'notes');
                  }}
                  placeholder="请输入个人笔记或备注..."
                  className="w-full"
                  minHeight="h-32"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="px-6 py-4 bg-primary-50 border-t border-primary-200 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-accent-500 text-white px-6 py-2 rounded-md hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                {saving ? '保存中...' : (isEditMode ? '更新笔记' : '创建笔记')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 