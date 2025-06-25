import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextEditor from '../common/RichTextEditor';

export interface SidePanelProps {
  referenceTranslation: string;
  studyNotes: string;
  isOpen: boolean;
  onToggle: () => void;
  onReferenceChange: (content: string) => void;
  onNotesChange: (content: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  referenceTranslation,
  studyNotes,
  isOpen,
  onToggle,
  onReferenceChange,
  onNotesChange
}) => {
  return (
    <div className={`fixed right-0 top-0 h-full bg-white border-l border-primary-200 shadow-lg transition-transform duration-300 z-10 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '300px' }}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 bg-accent-500 text-white p-2 rounded-l-md transition-all duration-300 ${
          isOpen ? 'left-[-40px]' : 'left-[-40px]'
        }`}
        style={{ left: isOpen ? '-40px' : '-40px' }}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Panel Content */}
      <div className="p-4 h-full overflow-y-auto space-y-6">
        {/* 参考翻译区域 */}
        <div>
          <h4 className="text-lg font-semibold text-primary-800 mb-3 border-b border-primary-200 pb-2">
            参考翻译
          </h4>
          <RichTextEditor
            value={referenceTranslation}
            onChange={onReferenceChange}
            placeholder="输入参考翻译..."
            className="min-h-[120px]"
          />
        </div>

        {/* 学习笔记区域 */}
        <div>
          <h4 className="text-lg font-semibold text-primary-800 mb-3 border-b border-primary-200 pb-2">
            学习笔记
          </h4>
          <RichTextEditor
            value={studyNotes}
            onChange={onNotesChange}
            placeholder="输入学习笔记..."
            className="min-h-[200px]"
          />
        </div>
      </div>
    </div>
  );
};

export default SidePanel; 