import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, BookOpen, FileText } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { CreateNoteRequest, NoteFields, Note, NoteType } from '../../shared/types';
import { RichTextEditor } from '../components/common/RichTextEditor';

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

  const handleNoteTypeSelect = (noteType: NoteType) => {
    setSelectedNoteType(noteType);
    setShowTypeSelection(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-primary-600">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  // Note type selection screen
  if (showTypeSelection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary-900">选择笔记类型</h2>
            <button 
              onClick={onBack}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
            </button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* CtoE Note Type */}
            <button
              onClick={() => handleNoteTypeSelect('CtoE')}
            className="card-industrial p-6 text-left hover:bg-primary-50 transition-colors group"
            >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary-900">中英翻译</h3>
              </div>
              <p className="text-primary-600 text-sm">
              创建中文到英文的翻译卡片，包含原文、翻译、拼音和笔记字段。
              </p>
            </button>
        </div>
      </div>
    );
  }

  // Main editor interface
  return (
    <div className="space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">
            {isEditMode ? '编辑笔记' : '创建笔记'}
          </h2>
          {selectedNoteType && (
            <p className="text-primary-600 mt-1">
              类型: {selectedNoteType === 'CtoE' ? '中英翻译' : selectedNoteType}
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>
        </div>
        
        {/* CtoE Form */}
        {selectedNoteType === 'CtoE' && (
        <div className="card-industrial p-6 space-y-6">
          <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>中英翻译卡片</span>
          </h3>

          {/* Chinese Field */}
              <div>
            <label htmlFor="chinese" className="block text-sm font-medium text-primary-700 mb-2">
              中文原文 *
                </label>
                <RichTextEditor
                  value={formData.chinese}
              onChange={(value) => handleInputChange('chinese', value)}
                  placeholder="请输入中文原文..."
              className={errors.chinese ? 'border-red-300' : ''}
                />
                {errors.chinese && (
              <p className="mt-1 text-sm text-red-600">{errors.chinese}</p>
                )}
              </div>

          {/* English Field */}
              <div>
            <label htmlFor="english" className="block text-sm font-medium text-primary-700 mb-2">
                  英文翻译 *
                </label>
                <RichTextEditor
                  value={formData.english}
              onChange={(value) => handleInputChange('english', value)}
                  placeholder="请输入英文翻译..."
              className={errors.english ? 'border-red-300' : ''}
                />
                {errors.english && (
              <p className="mt-1 text-sm text-red-600">{errors.english}</p>
                )}
              </div>

          {/* Pinyin Field */}
              <div>
            <label htmlFor="pinyin" className="block text-sm font-medium text-primary-700 mb-2">
              拼音 (可选)
                </label>
                <input
                  type="text"
              id="pinyin"
                  value={formData.pinyin}
                  onChange={(e) => handleInputChange('pinyin', e.target.value)}
              className="input-industrial"
                  placeholder="请输入拼音..."
                />
              </div>

          {/* Notes Field */}
              <div>
            <label htmlFor="notes" className="block text-sm font-medium text-primary-700 mb-2">
              备注 (可选)
                </label>
                <RichTextEditor
                  value={formData.notes}
              onChange={(value) => handleInputChange('notes', value)}
              placeholder="请输入备注..."
              minHeight="h-20"
                />
            </div>
          </div>
      )}

            {/* Save Button */}
      <div className="flex justify-end space-x-4">
              <button
                onClick={handleSave}
          disabled={saving || !selectedNoteType}
          className="btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isEditMode ? '更新中...' : '创建中...'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditMode ? '更新笔记' : '创建笔记'}</span>
            </>
          )}
              </button>
      </div>
    </div>
  );
}; 

export default NoteEditor; 