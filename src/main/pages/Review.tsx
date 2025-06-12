import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Minus, Plus, Edit3, SkipForward } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { Card, Note, AppRating, Deck } from '../../shared/types';

interface ReviewProps {
  deckId?: number | null;
  onBack?: () => void;
  onEditNote?: (noteId: number) => void;
}

type ReviewState = 'deck-selection' | 'loading' | 'question' | 'answer' | 'completed' | 'no-cards';

interface CardWithNote extends Card {
  note: Note;
}

export const Review: React.FC<ReviewProps> = ({ deckId, onBack, onEditNote }) => {
  const [reviewState, setReviewState] = useState<ReviewState>(deckId ? 'loading' : 'deck-selection');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CardWithNote[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewedCards, setReviewedCards] = useState(0);


  const apiClient = new ApiClient();

  useEffect(() => {
    if (deckId) {
      // If deckId is provided, start review immediately for that deck
      startReview(deckId);
    } else {
      // Otherwise, load decks for selection screen
    loadDecks();
    }
  }, [deckId]);

  // Keyboard shortcuts for review interface
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (reviewState === 'answer') {
        switch (event.key) {
          case '1':
            event.preventDefault();
            submitRating('Again');
            break;
          case '2':
            event.preventDefault();
            submitRating('Hard');
            break;
          case '3':
            event.preventDefault();
            submitRating('Good');
            break;
          case '4':
            event.preventDefault();
            submitRating('Easy');
            break;
          case 'e':
          case 'E':
            event.preventDefault();
            handleEditCard();
            break;
          case 's':
          case 'S':
            event.preventDefault();
            handleSkipCard();
            break;
        }
      } else if (reviewState === 'question') {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          showAnswer();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [reviewState, cards, currentCardIndex]);

  const loadDecks = async () => {
    try {
      const allDecks = await apiClient.getAllDecks();
      setDecks(allDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
    }
  };

  const startReview = async (deckId: number | null = null) => {
    setReviewState('loading');
    setSelectedDeckId(deckId);

    try {
      // 获取到期卡片
      const dueCards = await apiClient.getDueCards(deckId || undefined, 20);
      
      if (dueCards.length === 0) {
        setReviewState('no-cards');
        return;
      }

      // 获取卡片对应的笔记信息
      const cardsWithNotes: CardWithNote[] = [];
      for (const card of dueCards) {
        try {
          const note = await apiClient.getNoteById(card.noteId);
          if (note) {
            cardsWithNotes.push({ ...card, note });
          }
        } catch (error) {
          console.error(`Failed to load note for card ${card.id}:`, error);
        }
      }

      if (cardsWithNotes.length > 0) {
      setCards(cardsWithNotes);
      setCurrentCardIndex(0);
      setReviewedCards(0);
      setReviewState('question');
      } else {
        setReviewState('no-cards');
      }
    } catch (error) {
      console.error('Failed to start review:', error);
      alert('启动复习失败，请重试');
      setReviewState('deck-selection');
    }
  };

  const showAnswer = () => {
    setReviewState('answer');
  };

  const submitRating = async (rating: AppRating) => {
    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    try {
      // 提交评分到FSRS系统
      await apiClient.reviewCard(currentCard.id, rating === 'Again' ? 1 : rating === 'Hard' ? 2 : rating === 'Good' ? 3 : 4);
      
      setReviewedCards(prev => prev + 1);

      // 检查是否还有更多卡片
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setReviewState('question');
      } else {
        setReviewState('completed');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('提交评分失败，请重试');
    }
  };

  const resetReview = () => {
    setReviewState('deck-selection');
    setSelectedDeckId(null);
    setCards([]);
    setCurrentCardIndex(0);
    setReviewedCards(0);
  };

  const handleEditCard = () => {
    const currentCard = getCurrentCard();
    if (currentCard && onEditNote) {
      onEditNote(currentCard.note.id);
    }
  };

  const handleSkipCard = async () => {
    // Skip card by marking as 'Again' but continuing without user interaction
    await submitRating('Again');
  };

  const getCurrentCard = () => cards[currentCardIndex];

  const renderDeckSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">选择复习内容</h2>
          <p className="text-primary-600 mt-1">选择要复习的牌组或复习所有到期卡片</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        )}
      </div>

      {/* 复习所有卡片选项 */}
      <div className="card-industrial p-6 hover:shadow-lg transition-shadow cursor-pointer"
           onClick={() => startReview(null)}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-2">复习所有到期卡片</h3>
            <p className="text-primary-600">复习所有牌组中的到期卡片</p>
          </div>
          <div className="text-accent-600">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* 各个牌组选项 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary-900">或选择特定牌组</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.map(deck => (
            <div 
              key={deck.id}
              className="card-industrial p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => startReview(deck.id)}
            >
              <h4 className="font-semibold text-primary-900 mb-1">{deck.name}</h4>
              {deck.description && (
                <p className="text-sm text-primary-600 mb-2">{deck.description}</p>
              )}
              <div className="text-xs text-primary-500">
                点击开始复习此牌组
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="text-center py-16">
      <div className="flex items-center justify-center space-x-3 text-primary-600">
        <RotateCcw className="w-8 h-8 animate-spin" />
        <span className="text-lg font-medium">正在加载复习卡片...</span>
      </div>
    </div>
  );

  const renderNoCards = () => (
    <div className="text-center py-16">
      <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
      <h3 className="text-xl font-bold text-primary-900 mb-2">暂无到期卡片</h3>
      <p className="text-primary-600 mb-6">
        {selectedDeckId ? '该牌组' : '所有牌组'}中暂时没有需要复习的卡片
      </p>
      <button
        onClick={resetReview}
        className="btn-primary"
      >
        重新选择
      </button>
    </div>
  );

  const renderQuestion = () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return null;

    const chineseText = currentCard.note.fields.CtoE?.chinese || '内容加载失败';
    const pinyin = currentCard.note.fields.CtoE?.pinyin;

    return (
      <div className="space-y-6">
        {/* 进度条 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={resetReview}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>重新选择</span>
            </button>
            <div className="h-6 w-px bg-primary-300" />
            <div className="text-sm text-primary-600">
              {currentCardIndex + 1} / {cards.length} ({Math.round(((currentCardIndex + 1) / cards.length) * 100)}%)
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-primary-600">
            <span>已完成: {reviewedCards}</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-primary-200 rounded-full h-2">
          <div 
            className="bg-accent-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex) / cards.length) * 100}%` }}
          />
        </div>

        {/* 问题卡片 */}
        <div className="max-w-2xl mx-auto">
          <div className="card-industrial p-8 text-center bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-accent-200">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-primary-600 mb-2">请翻译下面的中文</h3>
            </div>
            
            <div className="space-y-4">
              <div 
                className="text-xl font-semibold text-primary-900 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: chineseText }}
              />
              
              {pinyin && (
                <div 
                  className="text-lg text-primary-600 font-medium"
                  dangerouslySetInnerHTML={{ __html: pinyin }}
                />
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={showAnswer}
                className="btn-accent text-lg px-8 py-3"
              >
                显示答案 (空格键)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnswer = () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return null;

    const chineseText = currentCard.note.fields.CtoE?.chinese || '内容加载失败';
    const englishText = currentCard.note.fields.CtoE?.english || '翻译加载失败';
    const notes = currentCard.note.fields.CtoE?.notes;
    const pinyin = currentCard.note.fields.CtoE?.pinyin;

    return (
      <div className="space-y-6">
        {/* 进度条 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={resetReview}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>重新选择</span>
            </button>
            <div className="h-6 w-px bg-primary-300" />
            <div className="text-sm text-primary-600">
              {currentCardIndex + 1} / {cards.length} ({Math.round(((currentCardIndex + 1) / cards.length) * 100)}%)
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-primary-600">
            <span>已完成: {reviewedCards}</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-primary-200 rounded-full h-2">
          <div 
            className="bg-accent-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex) / cards.length) * 100}%` }}
          />
        </div>

        {/* 答案卡片 */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 问题回顾 */}
          <div className="card-industrial p-6 bg-primary-25 border border-primary-200">
            <h4 className="text-sm font-medium text-primary-600 mb-2">原文</h4>
            <div 
              className="text-xl font-semibold text-primary-900"
              dangerouslySetInnerHTML={{ __html: chineseText }}
            />
            {pinyin && (
              <div 
                className="text-md text-primary-600 mt-1"
                dangerouslySetInnerHTML={{ __html: pinyin }}
              />
            )}
          </div>

          {/* 标准答案 */}
          <div className="card-industrial p-6 bg-accent-25 border border-accent-200">
            <h4 className="text-sm font-medium text-accent-700 mb-2">参考翻译</h4>
            <div 
              className="text-xl font-semibold text-accent-900"
              dangerouslySetInnerHTML={{ __html: englishText }}
            />
            
            {notes && (
              <div className="mt-4 p-3 bg-accent-50 rounded-lg">
                <h5 className="text-sm font-medium text-accent-700 mb-1">学习笔记</h5>
                <div 
                  className="text-sm text-accent-800"
                  dangerouslySetInnerHTML={{ __html: notes }}
                />
              </div>
            )}
          </div>

          {/* 评分按钮 */}
          <div className="card-industrial p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-primary-900">
                请根据你的回答情况评分
              </h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => submitRating('Again')}
                className="flex flex-col items-center p-4 rounded-lg border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <span className="font-medium text-red-700">Again</span>
                <span className="text-xs text-red-600 text-center">完全不会</span>
              </button>

              <button
                onClick={() => submitRating('Hard')}
                className="flex flex-col items-center p-4 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
              >
                <Minus className="w-8 h-8 text-yellow-500 mb-2" />
                <span className="font-medium text-yellow-700">Hard</span>
                <span className="text-xs text-yellow-600 text-center">困难</span>
              </button>

              <button
                onClick={() => submitRating('Good')}
                className="flex flex-col items-center p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <span className="font-medium text-green-700">Good</span>
                <span className="text-xs text-green-600 text-center">良好</span>
              </button>

              <button
                onClick={() => submitRating('Easy')}
                className="flex flex-col items-center p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-8 h-8 text-blue-500 mb-2" />
                <span className="font-medium text-blue-700">Easy</span>
                <span className="text-xs text-blue-600 text-center">简单</span>
              </button>
            </div>

            <div className="mt-4 text-xs text-primary-500 text-center">
              评分会影响下次复习的时间安排 (快捷键: 1-4)
            </div>

            {/* 额外操作按钮 */}
            <div className="mt-6 pt-4 border-t border-primary-200">
              <div className="flex justify-center space-x-4">
                {onEditNote && (
                  <button
                    onClick={handleEditCard}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-primary-300 hover:border-primary-400 hover:bg-primary-50 transition-colors text-primary-700"
                    title="编辑这张卡片 (快捷键: E)"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>编辑卡片</span>
                  </button>
                )}
                
                <button
                  onClick={handleSkipCard}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-primary-300 hover:border-primary-400 hover:bg-primary-50 transition-colors text-primary-700"
                  title="跳过这张卡片 (快捷键: S)"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>跳过</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompleted = () => (
    <div className="text-center py-16">
      <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
      <h3 className="text-2xl font-bold text-primary-900 mb-4">复习完成！</h3>
      <p className="text-lg text-primary-600 mb-2">
        本次复习了 {reviewedCards} 张卡片
      </p>
      <p className="text-primary-500 mb-8">
        系统已根据你的评分安排下次复习时间
      </p>
      
      <div className="space-x-4">
        <button
          onClick={resetReview}
          className="btn-primary"
        >
          再次复习
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            返回首页
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {reviewState === 'deck-selection' && renderDeckSelection()}
      {reviewState === 'loading' && renderLoading()}
      {reviewState === 'no-cards' && renderNoCards()}
      {reviewState === 'question' && renderQuestion()}
      {reviewState === 'answer' && renderAnswer()}
      {reviewState === 'completed' && renderCompleted()}
    </div>
  );
}; 