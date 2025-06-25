import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CardDisplay from '../main/components/review/CardDisplay';
import type { Note } from '../shared/types';

describe('CardDisplay HTML Rendering', () => {
  const mockNoteWithHTML: Note = {
    id: 1,
    deckId: 1,
    noteType: 'CtoE',
    fields: {
      CtoE: {
        chinese: '戏<p>很有意思</p>',
        english: 'The play is very interesting',
        pinyin: 'xì hěn yǒu yì sī',
        notes: 'Test note'
      }
    },
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNoteWithoutHTML: Note = {
    id: 2,
    deckId: 1,
    noteType: 'CtoE',
    fields: {
      CtoE: {
        chinese: '简单文本',
        english: 'Simple text',
        pinyin: 'jiǎn dān wén běn',
        notes: 'Test note'
      }
    },
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should render HTML content correctly when chinese field contains HTML tags', () => {
    render(
      <CardDisplay
        note={mockNoteWithHTML}
        showAnswer={false}
      />
    );

    // 验证HTML被正确渲染而不是作为文本显示
    const chineseContent = screen.getByText('戏');
    expect(chineseContent).toBeInTheDocument();
    
    const htmlContent = screen.getByText('很有意思');
    expect(htmlContent).toBeInTheDocument();
    
    // 验证<p>标签不会作为文本显示
    expect(screen.queryByText('<p>很有意思</p>')).not.toBeInTheDocument();
    expect(screen.queryByText('戏<p>很有意思</p>')).not.toBeInTheDocument();
  });

  it('should render plain text correctly when chinese field contains no HTML', () => {
    render(
      <CardDisplay
        note={mockNoteWithoutHTML}
        showAnswer={false}
      />
    );

    // 验证普通文本正常显示
    const chineseContent = screen.getByText('简单文本');
    expect(chineseContent).toBeInTheDocument();
  });

  it('should render pinyin when available', () => {
    render(
      <CardDisplay
        note={mockNoteWithHTML}
        showAnswer={false}
      />
    );

    const pinyinContent = screen.getByText('xì hěn yǒu yì sī');
    expect(pinyinContent).toBeInTheDocument();
  });

  it('should not render answer section when showAnswer is false', () => {
    render(
      <CardDisplay
        note={mockNoteWithHTML}
        showAnswer={false}
      />
    );

    expect(screen.queryByText('学习笔记')).not.toBeInTheDocument();
    expect(screen.queryByText('您的翻译')).not.toBeInTheDocument();
  });

  it('should render answer section when showAnswer is true', () => {
    render(
      <CardDisplay
        note={mockNoteWithHTML}
        showAnswer={true}
      />
    );

    expect(screen.getByText('学习笔记')).toBeInTheDocument();
    expect(screen.getByText('您的翻译')).toBeInTheDocument();
  });
}); 