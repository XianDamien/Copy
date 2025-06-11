import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Edit3, Trash2, Hash, Calendar, RotateCcw } from 'lucide-react';
import { Card, Note } from '../../shared/types';
import { formatDueDate, safeDateTimeFormat } from '../../shared/utils/dateUtils';
import { formatHtmlForDisplay } from '../../shared/utils/htmlUtils';

interface CardWithNote extends Card {
  note?: Note;
}

interface CardTableProps {
  cards: CardWithNote[];
  onCardClick: (card: Card) => void;
  onEditCard?: (card: Card) => void;
  onDeleteCard?: (card: Card) => void;
  selectedCards?: Set<number>;
  onSelectCard?: (cardId: number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

type SortField = 'content' | 'state' | 'due' | 'reps' | 'lapses' | 'tags' | 'created';
type SortDirection = 'asc' | 'desc';

export const CardTable: React.FC<CardTableProps> = ({
  cards,
  onCardClick,
  onEditCard,
  onDeleteCard,
  selectedCards = new Set(),
  onSelectCard,
  onSelectAll
}) => {
  const [sortField, setSortField] = useState<SortField>('due');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const formatCardContent = (card: CardWithNote): string => {
    if (!card.note) return '内容加载中...';
    
    const fields = card.note.fields;
    let content = '';
    
    switch (card.cardType) {
      case 'CtoE':
        content = fields.CtoE?.chinese || '无内容';
        break;
      case 'Retranslate':
        content = fields.Retranslate?.originalText || '无内容';
        break;
      default:
        return '未知卡片类型';
    }
    
    // Clean HTML content for display in tables
    return formatHtmlForDisplay(content, 60);
  };

  const getCardStateColor = (state: string): string => {
    switch (state) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Learning': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-green-100 text-green-800';
      case 'Relearning': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardStateText = (state: string): string => {
    switch (state) {
      case 'New': return '新卡片';
      case 'Learning': return '学习中';
      case 'Review': return '复习中';
      case 'Relearning': return '重新学习';
      default: return state;
    }
  };

  const sortedCards = useMemo(() => {
    const sorted = [...cards].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'content':
          aValue = formatCardContent(a).toLowerCase();
          bValue = formatCardContent(b).toLowerCase();
          break;
        case 'state':
          aValue = a.state;
          bValue = b.state;
          break;
        case 'due':
          aValue = new Date(a.due).getTime();
          bValue = new Date(b.due).getTime();
          break;
        case 'reps':
          aValue = a.reps;
          bValue = b.reps;
          break;
        case 'lapses':
          aValue = a.lapses;
          bValue = b.lapses;
          break;
        case 'tags':
          aValue = a.note?.tags?.join('') || '';
          bValue = b.note?.tags?.join('') || '';
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [cards, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider cursor-pointer hover:bg-primary-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <div className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  const allSelected = cards.length > 0 && cards.every(card => selectedCards.has(card.id));
  const someSelected = cards.some(card => selectedCards.has(card.id));

  return (
    <div className="bg-white shadow-industrial rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50">
            <tr>
              {onSelectCard && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                  />
                </th>
              )}
              <SortHeader field="content">内容</SortHeader>
              <SortHeader field="state">状态</SortHeader>
              <SortHeader field="due">到期时间</SortHeader>
              <SortHeader field="tags">标签</SortHeader>
              <SortHeader field="reps">复习次数</SortHeader>
              <SortHeader field="lapses">遗忘次数</SortHeader>
              <SortHeader field="created">创建时间</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-primary-200">
            {sortedCards.map((card) => (
              <tr 
                key={card.id}
                className="hover:bg-primary-50 cursor-pointer transition-colors"
                onClick={() => onCardClick(card)}
              >
                {onSelectCard && (
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={(e) => onSelectCard(card.id, e.target.checked)}
                      className="rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                    />
                  </td>
                )}
                
                {/* 内容 */}
                <td className="px-4 py-4">
                  <div className="text-sm text-primary-900 line-clamp-2 max-w-xs">
                    {formatCardContent(card)}
                  </div>
                </td>
                
                {/* 状态 */}
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCardStateColor(card.state)}`}>
                    {getCardStateText(card.state)}
                  </span>
                </td>
                
                {/* 到期时间 */}
                <td className="px-4 py-4">
                  <div className="text-sm text-primary-900">
                    {formatDueDate(card.due)}
                  </div>
                  <div className="text-xs text-primary-500">
                    {safeDateTimeFormat(card.due)}
                  </div>
                </td>
                
                {/* 标签 */}
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                    {card.note?.tags?.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-accent-100 text-accent-800 rounded-full"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    )) || (
                      <span className="text-xs text-primary-400">无标签</span>
                    )}
                  </div>
                </td>
                
                {/* 复习次数 */}
                <td className="px-4 py-4">
                  <div className="flex items-center text-sm text-primary-900">
                    <RotateCcw className="w-4 h-4 mr-1 text-primary-400" />
                    {card.reps}
                  </div>
                </td>
                
                {/* 遗忘次数 */}
                <td className="px-4 py-4">
                  <div className="text-sm text-primary-900">
                    {card.lapses}
                  </div>
                </td>
                
                {/* 创建时间 */}
                <td className="px-4 py-4">
                  <div className="text-sm text-primary-500">
                    {safeDateTimeFormat(card.createdAt)}
                  </div>
                </td>
                
                {/* 操作 */}
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    {onEditCard && (
                      <button
                        onClick={() => onEditCard(card)}
                        className="p-1 text-primary-500 hover:text-accent-600 hover:bg-primary-100 rounded transition-colors"
                        title="编辑卡片"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteCard && (
                      <button
                        onClick={() => onDeleteCard(card)}
                        className="p-1 text-primary-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除卡片"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {cards.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-primary-400 mb-4" />
          <h3 className="text-lg font-medium text-primary-900 mb-2">暂无卡片</h3>
          <p className="text-primary-600">没有找到匹配的卡片</p>
        </div>
      )}
    </div>
  );
}; 