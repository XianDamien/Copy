import React, { useState, useRef, useEffect } from 'react';
import { Hash, X, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface TagEditorProps {
  tags: string[];
  availableTags: string[];
  onSave: (newTags: string[]) => Promise<void>;
  onCancel: () => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  availableTags,
  onSave,
  onCancel,
  maxTags = 10,
  placeholder = '添加标签...',
  className = ''
}) => {
  const [editTags, setEditTags] = useState<string[]>([...tags]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = availableTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !editTags.includes(tag) &&
    inputValue.trim().length > 0
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (JSON.stringify(editTags.sort()) === JSON.stringify(tags.sort())) {
      onCancel();
      return;
    }

    try {
      setIsLoading(true);
      await onSave(editTags);
      toast.success('标签保存成功');
    } catch (error) {
      console.error('Save tags failed:', error);
      toast.error('保存标签失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (!trimmedTag) return;
    
    if (editTags.includes(trimmedTag)) {
      toast.error('标签已存在');
      return;
    }
    
    if (editTags.length >= maxTags) {
      toast.error(`最多只能添加 ${maxTags} 个标签`);
      return;
    }

    // Validate tag format (no special characters except hyphen and underscore)
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(trimmedTag)) {
      toast.error('标签只能包含字母、数字、中文、下划线和横线');
      return;
    }

    if (trimmedTag.length > 20) {
      toast.error('标签长度不能超过20个字符');
      return;
    }

    setEditTags(prev => [...prev, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      } else {
        onCancel();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    } else if (e.key === 'Backspace' && inputValue === '' && editTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      setEditTags(prev => prev.slice(0, -1));
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  // Tag color based on hash
  const getTagColor = (tag: string): string => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
    ];
    
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`border border-accent-300 rounded-lg bg-white ${className}`} style={{ position: 'relative' }}>
      {/* Tags Display */}
      <div className="p-3 min-h-[60px]">
        <div className="flex flex-wrap gap-2 mb-2">
          {editTags.map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-full border ${getTagColor(tag)}`}
            >
              <Hash className="w-3 h-3 mr-1" />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-600 transition-colors"
                title="删除标签"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          
          {editTags.length < maxTags && (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => inputValue.trim() && setShowSuggestions(true)}
                onBlur={() => {
                  // Delay hiding suggestions to allow click
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder={editTags.length === 0 ? placeholder : ''}
                className="px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 min-w-[120px]"
                disabled={isLoading}
              />
              
              {/* Add button */}
              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={() => addTag(inputValue)}
                  className="ml-1 p-1 text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded transition-colors"
                  title="添加标签"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-primary-300 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors ${
                        index === selectedSuggestionIndex ? 'bg-accent-50 text-accent-700' : 'text-primary-900'
                      }`}
                    >
                      <Hash className="w-3 h-3 mr-1 inline" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Info Text */}
        <div className="text-xs text-primary-500">
          {editTags.length}/{maxTags} 个标签
          {editTags.length < maxTags && (
            <span className="ml-2">• Enter 添加 • Backspace 删除 • ↑↓ 选择建议</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-primary-50 border-t border-primary-200 px-3 py-2 flex items-center justify-between">
        <div className="text-xs text-primary-500">
          Ctrl+S 保存 • Esc 取消
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
            disabled={isLoading}
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
}; 