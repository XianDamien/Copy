import React, { useState, useMemo } from 'react';
import { Play, Clock, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import type { SubtitleEntry } from '../../../shared/utils/subtitleParser';

interface SubtitleListProps {
  entries: SubtitleEntry[];
  currentTime?: number;
  onSeek?: (time: number) => void;
  onEdit?: (entry: SubtitleEntry) => void;
  maxHeight?: string;
}

export const SubtitleList: React.FC<SubtitleListProps> = ({
  entries,
  currentTime = 0,
  onSeek,
  onEdit,
  maxHeight = '400px'
}) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // 格式化时间显示 (毫秒 -> MM:SS.mmm)
  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10); // 取两位毫秒
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 判断当前播放位置对应的字幕条目
  const currentEntryId = useMemo(() => {
    const current = entries.find(entry => 
      currentTime >= entry.startTime && currentTime <= entry.endTime
    );
    return current?.id || null;
  }, [entries, currentTime]);

  // 切换条目展开状态
  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // 处理条目点击
  const handleEntryClick = (entry: SubtitleEntry) => {
    setSelectedEntry(entry.id);
    if (onSeek) {
      onSeek(entry.startTime);
    }
  };

  // 处理编辑按钮点击
  const handleEditClick = (e: React.MouseEvent, entry: SubtitleEntry) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(entry);
    }
  };

  // 计算文本是否需要展开显示
  const needsExpansion = (text: string): boolean => {
    return text.length > 100 || text.includes('\n');
  };

  // 获取显示文本
  const getDisplayText = (entry: SubtitleEntry): string => {
    const isExpanded = expandedEntries.has(entry.id);
    const text = entry.text;
    
    if (!needsExpansion(text) || isExpanded) {
      return text;
    }
    
    // 截断长文本
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无字幕条目</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* 列表头部 */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            字幕条目 ({entries.length})
          </h3>
          <div className="text-xs text-gray-500">
            点击条目可跳转到对应时间
          </div>
        </div>
      </div>

      {/* 字幕列表 */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {entries.map((entry, index) => {
          const isCurrentPlaying = currentEntryId === entry.id;
          const isSelected = selectedEntry === entry.id;
          const isExpanded = expandedEntries.has(entry.id);
          const showExpandButton = needsExpansion(entry.text);
          
          return (
            <div
              key={entry.id}
              className={`border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${
                isCurrentPlaying 
                  ? 'bg-blue-50 border-blue-200' 
                  : isSelected
                  ? 'bg-gray-50'
                  : 'hover:bg-gray-25'
              }`}
              onClick={() => handleEntryClick(entry)}
            >
              <div className="p-4">
                {/* 条目头部 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {/* 播放状态指示器 */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCurrentPlaying 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCurrentPlaying ? (
                        <Play className="w-3 h-3" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* 时间信息 */}
                    <div className="text-xs text-gray-600 font-mono">
                      <span>{formatTime(entry.startTime)}</span>
                      <span className="mx-1">→</span>
                      <span>{formatTime(entry.endTime)}</span>
                      <span className="ml-2 text-gray-400">
                        ({formatTime(entry.endTime - entry.startTime)})
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-1">
                    {onEdit && (
                      <button
                        onClick={(e) => handleEditClick(e, entry)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title="编辑字幕"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {showExpandButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(entry.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        title={isExpanded ? "收起" : "展开"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 字幕文本 */}
                <div className="ml-9">
                  <p className={`text-sm leading-relaxed ${
                    isCurrentPlaying ? 'text-blue-900 font-medium' : 'text-gray-700'
                  }`}>
                    {getDisplayText(entry)}
                  </p>
                  
                  {/* 展开提示 */}
                  {showExpandButton && !isExpanded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(entry.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                    >
                      显示完整内容 ↓
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 列表底部统计 */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            总时长: {formatTime(Math.max(...entries.map(e => e.endTime)))}
          </span>
          <span>
            平均时长: {formatTime(
              entries.reduce((sum, e) => sum + (e.endTime - e.startTime), 0) / entries.length
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubtitleList; 