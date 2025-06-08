import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Bold, Italic, Underline, Highlighter } from 'lucide-react';
import toast from 'react-hot-toast';

interface InlineEditorProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = '点击编辑...',
  multiline = false,
  maxLength = 500,
  className = ''
}) => {
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    highlight: false
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (multiline && editorRef.current) {
      editorRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else if (!multiline && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [multiline]);

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      onCancel();
      return;
    }

    if (editValue.trim().length === 0) {
      toast.error('内容不能为空');
      return;
    }

    if (editValue.length > maxLength) {
      toast.error(`内容长度不能超过 ${maxLength} 个字符`);
      return;
    }

    try {
      setIsLoading(true);
      await onSave(editValue.trim());
      toast.success('保存成功');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'underline' | 'highlight') => {
    if (!multiline) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;

    let wrapper: HTMLElement;
    switch (format) {
      case 'bold':
        wrapper = document.createElement('strong');
        break;
      case 'italic':
        wrapper = document.createElement('em');
        break;
      case 'underline':
        wrapper = document.createElement('u');
        break;
      case 'highlight':
        wrapper = document.createElement('mark');
        wrapper.style.backgroundColor = '#fef08a';
        break;
      default:
        return;
    }

    try {
      range.surroundContents(wrapper);
      setFormatting(prev => ({ ...prev, [format]: !prev[format] }));
      
      // Update the edit value with formatted content
      if (editorRef.current) {
        setEditValue(editorRef.current.innerHTML);
      }
    } catch (error) {
      // Fallback: wrap the content manually
      wrapper.textContent = selectedText;
      range.deleteContents();
      range.insertNode(wrapper);
      
      if (editorRef.current) {
        setEditValue(editorRef.current.innerHTML);
      }
    }
  };

  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  if (multiline) {
    return (
      <div className={`border border-accent-300 rounded-lg overflow-hidden ${className}`}>
        {/* Rich Text Toolbar */}
        <div className="bg-primary-50 border-b border-primary-200 px-3 py-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => applyFormatting('bold')}
            className={`p-1 rounded transition-colors ${
              formatting.bold 
                ? 'bg-accent-100 text-accent-700' 
                : 'text-primary-600 hover:bg-primary-100'
            }`}
            title="粗体 (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormatting('italic')}
            className={`p-1 rounded transition-colors ${
              formatting.italic 
                ? 'bg-accent-100 text-accent-700' 
                : 'text-primary-600 hover:bg-primary-100'
            }`}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormatting('underline')}
            className={`p-1 rounded transition-colors ${
              formatting.underline 
                ? 'bg-accent-100 text-accent-700' 
                : 'text-primary-600 hover:bg-primary-100'
            }`}
            title="下划线 (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormatting('highlight')}
            className={`p-1 rounded transition-colors ${
              formatting.highlight 
                ? 'bg-accent-100 text-accent-700' 
                : 'text-primary-600 hover:bg-primary-100'
            }`}
            title="高亮"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          
          <div className="flex-1" />
          
          <span className="text-xs text-primary-500">
            {stripHtml(editValue).length}/{maxLength}
          </span>
        </div>

        {/* Rich Text Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setEditValue(e.currentTarget.innerHTML)}
          onKeyDown={handleKeyDown}
          className="p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-inset"
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: editValue }}
        />

        {/* Action Buttons */}
        <div className="bg-primary-50 border-t border-primary-200 px-3 py-2 flex items-center justify-between">
          <div className="text-xs text-primary-500">
            Enter+Shift 换行 • Ctrl+S 保存 • Esc 取消
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-1 inline" />
              取消
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || stripHtml(editValue).length === 0 || stripHtml(editValue).length > maxLength}
              className="px-3 py-1 text-sm bg-accent-500 text-white hover:bg-accent-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        className="flex-1 px-2 py-1 border border-accent-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
        disabled={isLoading}
      />
      
      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading || editValue.trim().length === 0 || editValue.length > maxLength}
        className="p-1 text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="保存 (Enter)"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-accent-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="p-1 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded transition-colors disabled:opacity-50"
        title="取消 (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}; 