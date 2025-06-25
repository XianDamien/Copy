import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Minus, Plus, Edit3, SkipForward, Send } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { Card, Note, AppRating, Deck, UserSettings } from '../../shared/types';
import { DEFAULT_USER_SETTINGS } from '../../shared/types';
import { getSettings } from '../../shared/utils/settingsService';
import toast from 'react-hot-toast';

interface ReviewProps {
  deckId?: number | null;
  onBack?: () => void;
  onEditNote?: (noteId: number) => void;
}

type ReviewState = 'deck-selection' | 'loading' | 'question' | 'answer' | 'completed' | 'no-cards' | 'evaluation';

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
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [taskInput, setTaskInput] = useState('');
  const [cardsForEvaluation, setCardsForEvaluation] = useState<CardWithNote[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [evaluationIndex, setEvaluationIndex] = useState(0);

  const apiClient = new ApiClient();

  useEffect(() => {
    // Load user settings
    const loadUserSettings = async () => {
      try {
        const settings = await getSettings();
        setUserSettings(settings);
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };

    loadUserSettings();

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
      // Phase 2.2: Use new scheduler service instead of getDueCards
      const dueCards = await apiClient.buildQueue(deckId, 20);
      
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
    setCardsForEvaluation([]);
  };

  /**
   * Handle resetting card progress for a deck or all cards
   * Phase 2.2: New bulk reset functionality
   */
  const handleResetDeckCards = async (deckId: number | null) => {
    const deckName = deckId ? decks.find(d => d.id === deckId)?.name || `牌组 ${deckId}` : '所有牌组';
    
    const confirmed = window.confirm(
      `确定要重置 ${deckName} 中所有卡片的复习进度吗？\n\n这将清除这些卡片的所有学习记录，将它们重置为新卡片状态。此操作无法撤销。`
    );

    if (!confirmed) return;

    try {
      const resetCount = await apiClient.resetCardsInDeck(deckId);
      toast.success(`成功重置 ${deckName} 中的 ${resetCount} 张卡片`);
    } catch (error) {
      console.error('Failed to reset cards:', error);
      toast.error('重置失败，请重试');
    }
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

  /**
   * Determine if current card should show task completion interface
   */
  const shouldShowTaskInterface = () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return false;
    
    // Show task interface if:
    // 1. Task-driven mode is enabled (default)
    // 2. Card is in New or Relearning state (needs task completion)
    return !userSettings.enableTraditionalLearningSteps && 
           (currentCard.state === 'New' || currentCard.state === 'Relearning');
  };

  /**
   * Handle task completion submission
   */
  const handleTaskCompletion = async () => {
    if (!taskInput.trim()) {
      toast.error('请输入您的翻译或复述');
      return;
    }

    const currentCard = getCurrentCard();
    if (!currentCard) return;

    try {
      // In task-driven mode, successful task completion = Good rating
      await apiClient.reviewCard(currentCard.id, 3); // Good = 3
      
      setReviewedCards(prev => prev + 1);
      setCardsForEvaluation(prev => [...prev, currentCard]); // Add to evaluation list
      setTaskInput(''); // Clear input for next card

      // Move to next card or go to evaluation
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setReviewState('question');
      } else {
        // If there are cards to evaluate, go to evaluation; otherwise complete
        if (cardsForEvaluation.length > 0 || currentCard) {
          setReviewState('evaluation');
        } else {
          setReviewState('completed');
        }
      }
    } catch (error) {
      console.error('Failed to submit task completion:', error);
      toast.error('提交失败，请重试');
    }
  };

  /**
   * Handle task failure (user couldn't complete the task)
   */
  const handleTaskFailure = async () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    try {
      // Task failure = Again rating
      await apiClient.reviewCard(currentCard.id, 1); // Again = 1
      
      setReviewedCards(prev => prev + 1);
      setTaskInput(''); // Clear input for next card

      // Move to next card or complete review
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setReviewState('question');
      } else {
        setReviewState('completed');
      }
    } catch (error) {
      console.error('Failed to submit task failure:', error);
      toast.error('提交失败，请重试');
    }
  };

  const getCurrentCard = () => cards[currentCardIndex];

  const handleShowTranslation = () => {
    setShowTranslation(true);
  };

  const handleEvaluationComplete = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = cardsForEvaluation[evaluationIndex];
    if (!currentCard) return;

    try {
      // Update card difficulty and schedule next review
      const interval = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 15 : 5;
      const nextReview = new Date();
      nextReview.setMinutes(nextReview.getMinutes() + interval);

      await apiClient.updateCard({
        ...currentCard,
        due: nextReview,
        state: 'Learning'
      });

      if (evaluationIndex < cardsForEvaluation.length - 1) {
        setEvaluationIndex(prev => prev + 1);
        setShowTranslation(false);
      } else {
        setReviewState('completed');
      }
    } catch (error) {
      console.error('Failed to update card:', error);
      toast.error('Failed to save evaluation');
    }
  };

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
      <div className="card-industrial p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">复习所有到期卡片</h3>
            <p className="text-primary-600">复习所有牌组中的到期卡片</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Reset Button */}
            <button
              onClick={() => handleResetDeckCards(null)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              title="重置所有卡片进度"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">重置进度</span>
            </button>
            {/* Review Button */}
            <button
              onClick={() => startReview(null)}
              className="flex items-center space-x-2 px-6 py-2 bg-accent-600 text-white rounded-md hover:bg-accent-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">开始复习</span>
            </button>
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
              className="card-industrial p-4 hover:shadow-lg transition-shadow"
            >
              <h4 className="font-semibold text-primary-900 mb-1">{deck.name}</h4>
              {deck.description && (
                <p className="text-sm text-primary-600 mb-3">{deck.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-primary-500">
                  点击按钮开始复习此牌组
                </div>
                <div className="flex items-center space-x-2">
                  {/* Reset Button for Deck */}
                  <button
                    onClick={() => handleResetDeckCards(deck.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors"
                    title={`重置 ${deck.name} 的所有卡片进度`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重置</span>
                  </button>
                  {/* Review Button for Deck */}
                  <button
                    onClick={() => startReview(deck.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-accent-600 text-white rounded text-xs hover:bg-accent-700 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>复习</span>
                  </button>
                </div>
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
            {shouldShowTaskInterface() ? (
              // Task-Driven Learning Interface
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-primary-900 mb-2">
                    完成翻译任务
                  </h4>
                  <p className="text-sm text-primary-600">
                    请在下方输入您的翻译或复述，完成后点击提交。如果无法完成，可以选择"无法完成"。
                  </p>
                </div>

                {/* Task Input Area */}
                <div className="mb-6">
                  <textarea
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="请输入您的翻译或复述..."
                    className="w-full h-32 px-4 py-3 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                    autoFocus
                  />
                </div>

                {/* Task Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleTaskCompletion}
                    disabled={!taskInput.trim()}
                    className="flex items-center justify-center space-x-2 p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-6 h-6 text-green-500" />
                    <div className="text-center">
                      <div className="font-medium text-green-700">提交翻译</div>
                      <div className="text-xs text-green-600">任务完成，卡片将进入复习阶段</div>
                    </div>
                  </button>

                  <button
                    onClick={handleTaskFailure}
                    className="flex items-center justify-center space-x-2 p-4 rounded-lg border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-red-500" />
                    <div className="text-center">
                      <div className="font-medium text-red-700">无法完成</div>
                      <div className="text-xs text-red-600">稍后重新尝试此任务</div>
                    </div>
                  </button>
                </div>

                <div className="mt-4 text-xs text-primary-500 text-center">
                  任务驱动学习模式：通过完成翻译任务来掌握语言
                </div>
              </div>
            ) : (
              // Traditional Rating Interface
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-primary-900">
                    请根据你的回答情况评分
                  </h4>
                  {userSettings.enableTraditionalLearningSteps && (
                    <p className="text-sm text-primary-600 mt-1">
                      传统学习模式：根据记忆难度选择评分
                    </p>
                  )}
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
              </div>
            )}

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

  const renderEvaluation = () => {
    const currentCard = cardsForEvaluation[evaluationIndex];
    if (!currentCard) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Evaluate Your Understanding</h2>
          <p className="text-gray-600 mb-8">
            Card {evaluationIndex + 1} of {cardsForEvaluation.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="text-lg font-medium">{currentCard.note.fields.CtoE?.chinese || '内容加载失败'}</div>
          
          {!showTranslation ? (
            <button
              onClick={handleShowTranslation}
              className="w-full py-2 text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              Show Translation
            </button>
          ) : (
            <div className="text-gray-700 pt-4 border-t">
              {currentCard.note.fields.CtoE?.english || '内容加载失败'}
            </div>
          )}

          {showTranslation && (
            <div className="flex justify-center space-x-4 pt-6">
              <button
                onClick={() => handleEvaluationComplete('hard')}
                className="px-6 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Hard
              </button>
              <button
                onClick={() => handleEvaluationComplete('medium')}
                className="px-6 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
              >
                Medium
              </button>
              <button
                onClick={() => handleEvaluationComplete('easy')}
                className="px-6 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Easy
              </button>
            </div>
          )}
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

  const renderCurrentState = () => {
    switch (reviewState) {
      case 'deck-selection':
        return renderDeckSelection();
      case 'loading':
        return renderLoading();
      case 'question':
        return renderQuestion();
      case 'answer':
        return renderAnswer();
      case 'evaluation':
        return renderEvaluation();
      case 'completed':
        return renderCompleted();
      case 'no-cards':
        return renderNoCards();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentState()}
    </div>
  );
}; 