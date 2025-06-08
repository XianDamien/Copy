import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, X, Hash, Calendar, RotateCcw, Trash2 } from 'lucide-react';
import { Card, Note } from '../../shared/types';

interface CardWithNote extends Card {
  note?: Note;
}

export interface FilterState {
  search: string;
  tags: string[];
  states: string[];
  dueDateRange: {
    start: string;
    end: string;
  };
}

interface CardFiltersProps {
  cards: CardWithNote[];
  onFilterChange: (filteredCards: CardWithNote[]) => void;
  onFilterStateChange?: (filterState: FilterState) => void;
}

const CARD_STATES = [
  { value: 'New', label: '新卡片', color: 'bg-blue-100 text-blue-800' },
  { value: 'Learning', label: '学习中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Review', label: '复习中', color: 'bg-green-100 text-green-800' },
  { value: 'Relearning', label: '重新学习', color: 'bg-red-100 text-red-800' }
];

export const CardFilters: React.FC<CardFiltersProps> = ({
  cards,
  onFilterChange,
  onFilterStateChange
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    states: [],
    dueDateRange: {
      start: '',
      end: ''
    }
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 提取所有可用标签
  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach(card => {
      card.note?.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cards]);

  // 格式化卡片内容用于搜索
  const getCardSearchableContent = useCallback((card: CardWithNote): string => {
    if (!card.note) return '';
    
    const fields = card.note.fields;
    let content = '';
    
    switch (card.cardType) {
      case 'CtoE':
        content = `${fields.CtoE?.chinese || ''} ${fields.CtoE?.english || ''}`;
        break;
      case 'Retranslate':
        content = `${fields.Retranslate?.originalText || ''} ${fields.Retranslate?.userTranslation || ''}`;
        break;
      default:
        content = JSON.stringify(fields);
    }
    
    // 包含标签
    const tags = card.note.tags?.join(' ') || '';
    return `${content} ${tags}`.toLowerCase();
  }, []);

  // 应用过滤器
  const applyFilters = useCallback(() => {
    let filtered = [...cards];

    // 文本搜索
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(card => 
        getCardSearchableContent(card).includes(searchTerm)
      );
    }

    // 标签过滤
    if (filters.tags.length > 0) {
      filtered = filtered.filter(card => 
        filters.tags.every(tag => card.note?.tags?.includes(tag))
      );
    }

    // 状态过滤
    if (filters.states.length > 0) {
      filtered = filtered.filter(card => 
        filters.states.includes(card.state)
      );
    }

    // 日期范围过滤
    if (filters.dueDateRange.start || filters.dueDateRange.end) {
      filtered = filtered.filter(card => {
        const dueDate = new Date(card.due);
        const startDate = filters.dueDateRange.start ? new Date(filters.dueDateRange.start) : null;
        const endDate = filters.dueDateRange.end ? new Date(filters.dueDateRange.end) : null;

        if (startDate && dueDate < startDate) return false;
        if (endDate && dueDate > endDate) return false;
        return true;
      });
    }

    onFilterChange(filtered);
  }, [cards, filters, getCardSearchableContent, onFilterChange]);

  // 监听过滤器变化
  useEffect(() => {
    applyFilters();
    onFilterStateChange?.(filters);
  }, [filters, applyFilters, onFilterStateChange]);

  // 更新过滤器
  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  // 清除所有过滤器
  const clearAllFilters = () => {
    setFilters({
      search: '',
      tags: [],
      states: [],
      dueDateRange: { start: '', end: '' }
    });
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    updateFilters({
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    });
  };

  // 切换状态选择
  const toggleState = (state: string) => {
    updateFilters({
      states: filters.states.includes(state)
        ? filters.states.filter(s => s !== state)
        : [...filters.states, state]
    });
  };

  // 计算活动过滤器数量
  const activeFiltersCount = [
    filters.search.trim() ? 1 : 0,
    filters.tags.length,
    filters.states.length,
    (filters.dueDateRange.start || filters.dueDateRange.end) ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white border border-primary-200 rounded-lg p-4 mb-6 shadow-sm">
      {/* 主要搜索栏 */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索卡片内容、标签..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
            showAdvancedFilters 
              ? 'bg-accent-50 border-accent-300 text-accent-700' 
              : 'border-primary-300 text-primary-600 hover:bg-primary-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>高级过滤</span>
          {activeFiltersCount > 0 && (
            <span className="bg-accent-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>清除</span>
          </button>
        )}
      </div>

      {/* 高级过滤器 */}
      {showAdvancedFilters && (
        <div className="space-y-4 pt-4 border-t border-primary-200">
          {/* 标签过滤 */}
          <div>
            <h4 className="text-sm font-medium text-primary-700 mb-2 flex items-center">
              <Hash className="w-4 h-4 mr-1" />
              标签过滤
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-accent-100 text-accent-800 border-2 border-accent-300'
                      : 'bg-primary-100 text-primary-700 border-2 border-transparent hover:border-primary-300'
                  }`}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                  {filters.tags.includes(tag) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
              {availableTags.length === 0 && (
                <span className="text-sm text-primary-500">暂无可用标签</span>
              )}
            </div>
          </div>

          {/* 状态过滤 */}
          <div>
            <h4 className="text-sm font-medium text-primary-700 mb-2 flex items-center">
              <RotateCcw className="w-4 h-4 mr-1" />
              卡片状态
            </h4>
            <div className="flex flex-wrap gap-2">
              {CARD_STATES.map(state => (
                <button
                  key={state.value}
                  onClick={() => toggleState(state.value)}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full transition-colors border-2 ${
                    filters.states.includes(state.value)
                      ? `${state.color} border-current`
                      : 'bg-primary-100 text-primary-700 border-transparent hover:border-primary-300'
                  }`}
                >
                  {state.label}
                  {filters.states.includes(state.value) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 日期范围过滤 */}
          <div>
            <h4 className="text-sm font-medium text-primary-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              到期日期范围
            </h4>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filters.dueDateRange.start}
                onChange={(e) => updateFilters({
                  dueDateRange: { ...filters.dueDateRange, start: e.target.value }
                })}
                className="px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
              <span className="text-primary-500">到</span>
              <input
                type="date"
                value={filters.dueDateRange.end}
                onChange={(e) => updateFilters({
                  dueDateRange: { ...filters.dueDateRange, end: e.target.value }
                })}
                className="px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 当前过滤器摘要 */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-primary-200">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-primary-600">已应用过滤器:</span>
            
            {filters.search.trim() && (
              <span className="inline-flex items-center px-2 py-1 bg-accent-100 text-accent-800 rounded">
                搜索: "{filters.search.trim()}"
                <button 
                  onClick={() => updateFilters({ search: '' })}
                  className="ml-1 hover:text-accent-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 bg-accent-100 text-accent-800 rounded">
                #{tag}
                <button 
                  onClick={() => toggleTag(tag)}
                  className="ml-1 hover:text-accent-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.states.map(state => (
              <span key={state} className="inline-flex items-center px-2 py-1 bg-accent-100 text-accent-800 rounded">
                {CARD_STATES.find(s => s.value === state)?.label || state}
                <button 
                  onClick={() => toggleState(state)}
                  className="ml-1 hover:text-accent-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {(filters.dueDateRange.start || filters.dueDateRange.end) && (
              <span className="inline-flex items-center px-2 py-1 bg-accent-100 text-accent-800 rounded">
                日期: {filters.dueDateRange.start || '...'} - {filters.dueDateRange.end || '...'}
                <button 
                  onClick={() => updateFilters({ dueDateRange: { start: '', end: '' } })}
                  className="ml-1 hover:text-accent-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 