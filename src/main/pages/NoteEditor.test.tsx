import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';

// Mock the API client
vi.mock('../../shared/utils/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    createNote: vi.fn()
  }))
}));

// Mock alert
global.alert = vi.fn();

describe('NoteEditor', () => {
  const mockOnBack = vi.fn();
  const mockOnNoteSaved = vi.fn();
  const mockCreateNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup API client mock
    const { ApiClient } = require('../../shared/utils/api');
    ApiClient.mockImplementation(() => ({
      createNote: mockCreateNote
    }));
  });

  const renderNoteEditor = () => {
    return render(
      <NoteEditor
        deckId={1}
        onBack={mockOnBack}
        onNoteSaved={mockOnNoteSaved}
      />
    );
  };

  it('renders note editor with all form fields', () => {
    renderNoteEditor();

    expect(screen.getByText('创建中英翻译笔记')).toBeInTheDocument();
    expect(screen.getByLabelText('中文内容 *')).toBeInTheDocument();
    expect(screen.getByLabelText('拼音（可选）')).toBeInTheDocument();
    expect(screen.getByLabelText('英文翻译 *')).toBeInTheDocument();
    expect(screen.getByLabelText('学习笔记（可选）')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    expect(screen.getByText('请输入中文内容')).toBeInTheDocument();
    expect(screen.getByText('请输入英文翻译')).toBeInTheDocument();
  });

  it('validates Chinese characters in Chinese field', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const englishInput = screen.getByLabelText('英文翻译 *');
    
    await user.type(chineseInput, 'hello world');
    await user.type(englishInput, 'hello world');
    
    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    expect(screen.getByText('请输入有效的中文字符')).toBeInTheDocument();
  });

  it('validates English characters in English field', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const englishInput = screen.getByLabelText('英文翻译 *');
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, '你好');
    
    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    expect(screen.getByText('请输入有效的英文字符')).toBeInTheDocument();
  });

  it('shows preview when content is entered', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const pinyinInput = screen.getByLabelText('拼音（可选）');
    const englishInput = screen.getByLabelText('英文翻译 *');
    const notesInput = screen.getByLabelText('学习笔记（可选）');

    await user.type(chineseInput, '你好');
    await user.type(pinyinInput, 'nǐ hǎo');
    await user.type(englishInput, 'hello');
    await user.type(notesInput, 'Common greeting');

    // Check card preview
    expect(screen.getByText('你好')).toBeInTheDocument();
    expect(screen.getByText('nǐ hǎo')).toBeInTheDocument();
    
    // Check answer preview
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('笔记：')).toBeInTheDocument();
    expect(screen.getByText('Common greeting')).toBeInTheDocument();
  });

  it('successfully creates note with valid data', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockResolvedValue({ id: 1 });
    
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const englishInput = screen.getByLabelText('英文翻译 *');
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, 'hello');
    
    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        deckId: 1,
        noteType: 'CtoE',
        fields: {
          CtoE: {
            chinese: '你好',
            english: 'hello',
            pinyin: undefined,
            notes: undefined
          }
        },
        tags: []
      });
    });

    expect(mockOnNoteSaved).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('笔记创建成功！');
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockRejectedValue(new Error('API Error'));
    
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const englishInput = screen.getByLabelText('英文翻译 *');
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, 'hello');
    
    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('创建笔记失败，请重试');
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const backButton = screen.getByText('返回牌组');
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('disables save button when required fields are empty', () => {
    renderNoteEditor();

    const saveButton = screen.getByText('保存笔记');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when required fields are filled', async () => {
    const user = userEvent.setup();
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *');
    const englishInput = screen.getByLabelText('英文翻译 *');
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, 'hello');

    const saveButton = screen.getByText('保存笔记');
    expect(saveButton).not.toBeDisabled();
  });

  it('clears form after successful save', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockResolvedValue({ id: 1 });
    
    renderNoteEditor();

    const chineseInput = screen.getByLabelText('中文内容 *') as HTMLTextAreaElement;
    const englishInput = screen.getByLabelText('英文翻译 *') as HTMLTextAreaElement;
    
    await user.type(chineseInput, '你好');
    await user.type(englishInput, 'hello');
    
    const saveButton = screen.getByText('保存笔记');
    await user.click(saveButton);

    await waitFor(() => {
      expect(chineseInput.value).toBe('');
      expect(englishInput.value).toBe('');
    });
  });
}); 