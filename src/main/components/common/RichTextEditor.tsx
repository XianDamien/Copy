import React, { useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Highlighter, Sparkles } from 'lucide-react';
import type { NoteContext } from '../../../shared/types/aiTypes';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAIRequest?: (selectedText: string, fullContext: NoteContext) => void;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '开始输入...',
  onAIRequest,
  className = '',
  minHeight = 'h-24'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for simplicity
        blockquote: false, // Disable blockquotes for note fields
        codeBlock: false, // Disable code blocks for language learning
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200',
        },
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${minHeight} px-3 py-2`,
      },
    },
  });

  // Handle AI assistance request
  const handleAIRequest = useCallback(() => {
    if (!editor || !onAIRequest) return;
    
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    
    if (selectedText.trim()) {
      // Create enhanced context - this will be populated by parent in Task 4
      const context: NoteContext = {
        noteType: 'CtoE', // Will be passed from parent in Task 4
        allFields: {}, // Will be populated in Task 4
        currentField: 'unknown', // Will be identified in Task 4
        selectedText: selectedText.trim(),
        // Optional fields will be added by parent
        noteId: undefined,
        deckId: undefined
      };
      
      onAIRequest(selectedText.trim(), context);
    }
  }, [editor, onAIRequest]);

  if (!editor) {
    return (
      <div className={`border border-primary-300 rounded-md ${minHeight} ${className} flex items-center justify-center`}>
        <span className="text-primary-500 text-sm">加载编辑器...</span>
      </div>
    );
  }

  return (
    <div className={`relative border border-primary-300 rounded-md focus-within:ring-2 focus-within:ring-accent-500 focus-within:border-transparent bg-white ${className}`}>
      {/* Bubble Menu for formatting */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ 
          duration: 100,
          placement: 'top',
        }}
        className="flex items-center gap-1 bg-white border border-primary-200 rounded-md shadow-lg p-1"
      >
        {/* Bold */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('bold')
              ? 'bg-accent-100 text-accent-700'
              : 'text-primary-600 hover:bg-primary-100'
          }`}
          title="粗体"
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('italic')
              ? 'bg-accent-100 text-accent-700'
              : 'text-primary-600 hover:bg-primary-100'
          }`}
          title="斜体"
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('underline')
              ? 'bg-accent-100 text-accent-700'
              : 'text-primary-600 hover:bg-primary-100'
          }`}
          title="下划线"
        >
          <UnderlineIcon size={16} />
        </button>

        {/* Highlight */}
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded text-sm transition-colors ${
            editor.isActive('highlight')
              ? 'bg-yellow-100 text-yellow-700'
              : 'text-primary-600 hover:bg-primary-100'
          }`}
          title="高亮"
        >
          <Highlighter size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-primary-300 mx-1"></div>

        {/* AI Assistance - placeholder for future integration */}
        <button
          onClick={handleAIRequest}
          disabled={!onAIRequest}
          className={`p-1.5 rounded text-sm transition-colors ${
            onAIRequest 
              ? 'text-purple-600 hover:bg-purple-100 hover:text-purple-700'
              : 'text-primary-300 cursor-not-allowed'
          }`}
          title={onAIRequest ? 'AI 辅助' : 'AI 功能即将推出'}
        >
          <Sparkles size={16} />
        </button>
      </BubbleMenu>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none"
      />
      
      {/* Placeholder when empty */}
      {editor.isEmpty && (
        <div className="absolute top-2 left-3 text-primary-400 text-sm pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 