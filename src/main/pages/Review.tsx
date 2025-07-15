import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, Lightbulb } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import type { Card, Note, AppRating, Deck, UserSettings } from '../../shared/types';
import { DEFAULT_USER_SETTINGS } from '../../shared/types';
import { getSettings } from '../../shared/utils/settingsService';
import toast from 'react-hot-toast';
import ReviewControls from '../components/review/ReviewControls';
import CardDisplay from '../components/review/CardDisplay';
import TaskDisplay from '../components/review/TaskDisplay';
import TranslationInput from '../components/review/TranslationInput';
import TaskControls from '../components/review/TaskControls';
import EvaluationDisplay from '../components/review/EvaluationDisplay';
import SelfEvaluationControls from '../components/review/SelfEvaluationControls';
import NoteEditor from './NoteEditor';

interface ReviewProps {
  deckId?: number | null;
  onBack?: () => void;
}

type ReviewState = 'deck-selection' | 'loading' | 'question' | 'task-question' | 'task-evaluation' | 'answer' | 'completed' | 'no-cards';

interface CardWithNote extends Card {
  note: Note;
}

export const Review: React.FC<ReviewProps> = ({ deckId, onBack }) => {
  const [reviewState, setReviewState] = useState<ReviewState>(deckId ? 'loading' : 'deck-selection');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CardWithNote[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewedCards, setReviewedCards] = useState(0);



  const [editedNotes, setEditedNotes] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  
  // Phase 2: 模态框状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Phase 3: 动态队列管理状态
  const [retryQueue, setRetryQueue] = useState<CardWithNote[]>([]);
  const [isProcessingRetries, setIsProcessingRetries] = useState(false);

  const apiClient = new ApiClient();

  useEffect(() => {
    // Load user settings first, then start review
    const loadUserSettings = async () => {
      try {
        const settings = await getSettings();
        setUserSettings(settings);
        
        // Only start review after settings are loaded
        if (deckId) {
          // If deckId is provided, start review immediately for that deck
          startReview(deckId);
        } else {
          // Otherwise, load decks for selection screen
          loadDecks();
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        // Fallback to default settings and continue
        if (deckId) {
          startReview(deckId);
        } else {
          loadDecks();
        }
      }
    };

    loadUserSettings();
  }, [deckId]);

  // Keyboard shortcuts for review interface
  useEffect(() => {
    // 检查事件源是否为输入元素
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target) return false;
      const element = target as HTMLElement;
      return ['INPUT', 'TEXTAREA'].includes(element.tagName) || 
             element.contentEditable === 'true';
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // 如果事件来自输入元素，则不处理快捷键
      if (isInputElement(event.target)) {
        return;
      }

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
        switch (event.key) {
          case ' ':
          case 'Enter':
          event.preventDefault();
          showAnswer();
            break;
          case 'e':
          case 'E':
            event.preventDefault();
            handleEditCard();
            break;
        }
      } else if (reviewState === 'task-question') {
        switch (event.key) {
          case 'e':
          case 'E':
            event.preventDefault();
            handleEditCard();
            break;
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
        // Phase 1: 数据规范化 - 确保每张卡片的note.fields.CtoE结构完整
        const normalizedCards = cardsWithNotes.map(card => {
          const ctoeField = card.note.fields.CtoE;

          // 确保CtoE及其嵌套字段始终存在
          const normalizedCtoE = {
            chinese: ctoeField?.chinese || '',
            english: ctoeField?.english || '',
            pinyin: ctoeField?.pinyin || '',
            userTranslation: ctoeField?.userTranslation || '',
            notes: ctoeField?.notes || ''
          };

          return {
            ...card,
            note: {
              ...card.note,
              fields: {
                ...card.note.fields,
                CtoE: normalizedCtoE
              }
            }
          };
        });

        setCards(normalizedCards);
        setCurrentCardIndex(0);
        setReviewedCards(0);
        setUserTranslation(''); // 清空用户翻译
        
        // 根据第一张卡片的状态决定初始界面
        const firstCard = cardsWithNotes[0];
        console.log('DEBUG: First card state:', firstCard.state);
        console.log('DEBUG: User settings:', userSettings);
        console.log('DEBUG: enableTraditionalLearningSteps:', userSettings.enableTraditionalLearningSteps);
        
        if (isTaskMode(firstCard)) {
          setReviewState('task-question');
        } else {
          setReviewState('question');
        }
      } else {
        setReviewState('no-cards');
      }
    } catch (error) {
      console.error('Failed to start review:', error);
      setReviewState('no-cards');
    }
  };

  const showAnswer = () => {
    setReviewState('answer');
  };

  const processRetryQueue = () => {
    if (retryQueue.length === 0 || isProcessingRetries) return;

    setIsProcessingRetries(true);
    
    // 将retry队列的卡片添加到当前学习队列的末尾
    const updatedCards = [...cards];
    retryQueue.forEach(retryCard => {
      // 避免重复添加
      if (!updatedCards.find(card => card.id === retryCard.id)) {
        updatedCards.push(retryCard);
      }
    });
    
    setCards(updatedCards);
    setRetryQueue([]);
    setIsProcessingRetries(false);
    
    console.log(`Processed ${retryQueue.length} retry cards`);
  };

  const submitRating = async (rating: AppRating) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    try {
              await apiClient.reviewCard(currentCard.id, rating === 'Again' ? 1 : rating === 'Hard' ? 2 : rating === 'Good' ? 3 : 4);
      setReviewedCards(prev => prev + 1);

      // Phase 3: 处理重试逻辑
      if (rating === 'Again') {
        // 将当前卡片加入重试队列
        setRetryQueue(prev => [...prev, currentCard]);
      }

      // 移动到下一张卡片或结束复习
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setUserTranslation(''); // 清空用户翻译
        
        const nextCard = cards[currentCardIndex + 1];
        if (isTaskMode(nextCard)) {
          setReviewState('task-question');
        } else {
          setReviewState('question');
        }
      } else {
        // 检查是否有重试队列需要处理
        if (retryQueue.length > 0) {
          processRetryQueue();
          setCurrentCardIndex(cards.length); // 指向新添加的重试卡片
          setReviewState('question');
        } else {
          setReviewState('completed');
        }
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      toast.error('提交评分失败，请重试');
    }
  };

  const resetReview = () => {
    setReviewState('deck-selection');
    setCards([]);
    setCurrentCardIndex(0);
    setReviewedCards(0);
    setUserTranslation('');
    setRetryQueue([]);
    setIsProcessingRetries(false);
  };

  const handleResetDeckCards = async (deckId: number | null) => {
    if (!deckId) return;
    
    const deckName = decks.find(deck => deck.id === deckId)?.name || '未知卡组';
    const confirmed = window.confirm(
      `确定要重置卡组"${deckName}"中的所有卡片吗？这将把所有卡片状态重置为"新卡片"状态。`
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
    setIsEditModalOpen(true);
  };

  // Phase 4: 处理笔记更新和刷新
  const handleNoteUpdateAndRefresh = async () => {
    try {
      // 关闭模态框
      setIsEditModalOpen(false);
      
      // 重新获取当前卡片的最新数据
      const currentCard = getCurrentCard();
      if (currentCard) {
        const updatedNote = await apiClient.getNoteById(currentCard.noteId);
        if (updatedNote) {
          // 更新本地卡片数据
          const updatedCards = [...cards];
          updatedCards[currentCardIndex] = {
            ...currentCard,
            note: updatedNote
          };
          setCards(updatedCards);
          
          console.log('Card data refreshed after note save');
        }
      }
    } catch (error) {
      console.error('Failed to refresh card data:', error);
      // 即使刷新失败，也要关闭模态框
      setIsEditModalOpen(false);
    }
  };

  const handleSkipCard = async () => {
    // Skip card by marking as 'Again' but continuing without user interaction
    await submitRating('Again');
  };

  const getCurrentCard = () => cards[currentCardIndex];

  // 判断当前卡片是否应该使用任务模式
  const isTaskMode = (card: CardWithNote) => {
    console.log('DEBUG: isTaskMode called with card.state:', card.state);
    console.log('DEBUG: isTaskMode userSettings.enableTraditionalLearningSteps:', userSettings.enableTraditionalLearningSteps);
    const result = (card.state === 'New' || card.state === 'Relearning') && !userSettings.enableTraditionalLearningSteps;
    console.log('DEBUG: isTaskMode result:', result);
    return result;
  };



  // Task 1.3: 新的任务相关事件处理器
  const handleUserTranslationChange = (text: string) => {
    setUserTranslation(text);
  };

  const handleSubmitTask = () => {
    setReviewState('task-evaluation');
  };

  const handleSkipTask = () => {
    submitRating('Again');
  };

  // 自我评估函数 - 自动保存翻译到学习笔记
  const handleSelfEvaluation = async (rating: AppRating) => {
    // 如果用户有翻译输入，自动保存到学习笔记
    if (userTranslation.trim()) {
      await saveTranslationToNotes(userTranslation);
    }
    
    submitRating(rating);
  };

  // 将翻译保存到学习笔记的函数
  const saveTranslationToNotes = async (translation: string) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    try {
      // 创建带日期的学习记录
      const timestamp = new Date().toISOString().split('T')[0];
      
      const newEntry = `<div style="margin-bottom: 12px; padding: 8px; border-left: 3px solid #3b82f6; background-color: #f8fafc;">
        <div style="font-weight: bold; color: #1e40af; margin-bottom: 4px;">
          📝 任务记录 (${timestamp})
        </div>
        <div style="color: #374151;">
          ${translation}
        </div>
      </div>`;

      // 获取现有笔记内容
      const existingNotes = currentCard.note.fields.CtoE?.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;

      // 使用统一的更新函数
      await updateNoteContent(
        currentCard.note.fields.CtoE?.english || '',
        updatedNotes
      );
      
      console.log('Translation saved to notes:', translation);
    } catch (error) {
      console.error('Failed to save translation to notes:', error);
      // 不显示错误提示，避免干扰用户的复习流程
    }
  };

  const handlePreviousCard = async () => {    
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setUserTranslation(''); // 清空用户翻译
      
      // 根据新卡片的状态决定界面
      const newCard = cards[currentCardIndex - 1];
      if (isTaskMode(newCard)) {
        setReviewState('task-question');
      } else {
        setReviewState('question');
      }
      
      // 重置编辑状态
      setEditedNotes(null);
    }
  };

  const handleNextCard = async () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setUserTranslation(''); // 清空用户翻译
      
      // 根据新卡片的状态决定界面
      const newCard = cards[currentCardIndex + 1];
      if (isTaskMode(newCard)) {
        setReviewState('task-question');
      } else {
        setReviewState('question');
      }
      
      // 重置编辑状态
      setEditedNotes(null);
    }
  };

  // 新的简化笔记更新函数 - 只更新本地状态
  const handleNoteUpdate = (newContent: string) => {
    setEditedNotes(newContent);
  };

  // 统一的笔记内容更新函数
  const updateNoteContent = async (newEnglish: string, newNotes: string) => {
    const currentCard = getCurrentCard();
    if (!currentCard) throw new Error('No current card');

    const updatedFields = {
      ...currentCard.note.fields,
      CtoE: {
        chinese: currentCard.note.fields.CtoE?.chinese || '',
        english: newEnglish,
        pinyin: currentCard.note.fields.CtoE?.pinyin,
        userTranslation: currentCard.note.fields.CtoE?.userTranslation,
        notes: newNotes
      }
    };

    await apiClient.updateNote(currentCard.note.id, { fields: updatedFields });
    
    // 更新本地卡片数据
    const updatedCards = [...cards];
    updatedCards[currentCardIndex] = {
      ...currentCard,
      note: {
        ...currentCard.note,
        fields: updatedFields
      }
    };
    setCards(updatedCards);
    
    return updatedFields;
  };



  const renderDeckSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary-900">选择卡组</h2>
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

      {decks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-primary-600 mb-4">暂无可用卡组</div>
          <p className="text-sm text-primary-500">请先创建一个卡组并添加卡片</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="card-industrial p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-900">{deck.name}</h3>
                                 <span className="text-sm text-primary-600">卡组</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startReview(deck.id)}
                  className="flex-1 btn-primary"
                >
                  开始复习
                </button>
                
                <button
                  onClick={() => handleResetDeckCards(deck.id)}
                  className="btn-secondary"
                  title="重置卡片状态"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3 text-primary-600">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-lg font-medium">加载中...</span>
      </div>
    </div>
  );

  const renderNoCards = () => (
    <div className="text-center py-12 space-y-4">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      <h3 className="text-xl font-semibold text-primary-900">恭喜！</h3>
      <p className="text-primary-600">当前卡组没有需要复习的卡片</p>
      <button
        onClick={resetReview}
        className="btn-primary"
      >
        重新选择卡组
      </button>
    </div>
  );

  const renderTaskInterface = () => {
    const currentCard = getCurrentCard();
    console.log('DEBUG: renderTaskInterface called');
    console.log('DEBUG: renderTaskInterface currentCard:', currentCard);
    console.log('DEBUG: renderTaskInterface reviewState:', reviewState);
    
    if (!currentCard) {
      console.log('DEBUG: renderTaskInterface returning null - no currentCard');
      return null;
    }

    if (reviewState === 'task-question') {
      console.log('DEBUG: renderTaskInterface rendering task-question interface');
      return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
          {/* 模式状态指示器 */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              任务模式 - 新卡片学习
            </div>
          </div>
          
          {/* 提示图标 */}
          <div 
            className="absolute top-6 right-6 cursor-pointer p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors z-10"
            onClick={handleEditCard}
            title="编辑卡片"
          >
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          
          <TaskDisplay originalText={currentCard.note.fields.CtoE?.chinese || ''} />
          <TranslationInput 
            value={userTranslation} 
            onChange={handleUserTranslationChange} 
          />
          <TaskControls 
            onSubmit={handleSubmitTask} 
            onSkip={handleSkipTask} 
            onEditCard={handleEditCard}
            onPreviousCard={handlePreviousCard}
            onNextCard={handleNextCard}
            canGoPrevious={currentCardIndex > 0}
            canGoNext={currentCardIndex < cards.length - 1}
            currentCardIndex={currentCardIndex}
            totalCards={cards.length}
          />
        </div>
      );
    }

    if (reviewState === 'task-evaluation') {
      console.log('DEBUG: renderTaskInterface rendering task-evaluation interface');
      return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
          {/* 模式状态指示器 */}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              任务模式 - 自我评估
            </div>
          </div>
          
          {/* 提示图标 */}
          <div 
            className="absolute top-6 right-6 cursor-pointer p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors z-10"
            onClick={handleEditCard}
            title="编辑卡片"
          >
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          
          <EvaluationDisplay
            originalText={currentCard.note.fields.CtoE?.chinese || ''}
            userTranslation={userTranslation}
            referenceTranslation={currentCard.note.fields.CtoE?.english || ''}
          />
          <SelfEvaluationControls onEvaluate={handleSelfEvaluation} />
        </div>
      );
    }

    console.log('DEBUG: renderTaskInterface returning null - reviewState not matching');
    return null;
  };

  const renderReviewInterface = () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return null;

    // Task 3.2: 判断是否使用任务模式
    const isTaskModeActive = isTaskMode(currentCard);
    console.log('DEBUG: renderReviewInterface - reviewState:', reviewState);
    console.log('DEBUG: renderReviewInterface - isTaskModeActive:', isTaskModeActive);
    
    if (isTaskModeActive) {
      console.log('DEBUG: renderReviewInterface entering task mode branch');
      console.log('DEBUG: about to call renderTaskInterface');
      const taskInterface = renderTaskInterface();
      console.log('DEBUG: renderTaskInterface returned:', taskInterface);
      
      return (
        <div className="flex h-screen">
          {/* 主要内容区域 - 任务模式 */}
          <div className="flex-1">
            <div className="flex items-center justify-between p-6 border-b border-primary-200">
              <button
                onClick={resetReview}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>重新选择</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-primary-600">
                  {currentCardIndex + 1} / {cards.length}
                </div>
                <div className="text-sm text-primary-600">
                  已完成: {reviewedCards}
                </div>
                {retryQueue.length > 0 && (
                  <div className="text-sm text-orange-600">
                    重试队列: {retryQueue.length}
                  </div>
                )}
              </div>
            </div>

            {/* 进度条 */}
            <div className="px-6 py-4">
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div 
                  className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex) / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {taskInterface}
          </div>
        </div>
      );
    }

    // 传统复习模式
    return (
      <div className="flex h-screen">
        {/* 主要内容区域 */}
        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* 模式状态指示器 */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                复习模式 - 已学卡片复习
              </div>
            </div>
            {/* 顶部导航栏 */}
        <div className="flex items-center justify-between">
            <button
              onClick={resetReview}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>重新选择</span>
            </button>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-primary-600">
                  {currentCardIndex + 1} / {cards.length}
                </div>
            <div className="text-sm text-primary-600">
                  已完成: {reviewedCards}
            </div>
                {retryQueue.length > 0 && (
                  <div className="text-sm text-orange-600">
                    重试队列: {retryQueue.length}
                  </div>
                )}
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-primary-200 rounded-full h-2">
          <div 
            className="bg-accent-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex) / cards.length) * 100}%` }}
          />
        </div>

            {/* 卡片显示区域 */}
            <div className="relative">
              <CardDisplay
                note={currentCard.note}
                card={currentCard}
                showAnswer={reviewState === 'answer'}
                onNoteChange={handleNoteUpdate}
                editedNotes={editedNotes}
                isDirty={false}
                onSave={() => {}}
              />
              
              {/* 提示图标 */}
              <div 
                className="absolute top-4 right-4 cursor-pointer p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition-colors"
                onClick={handleEditCard}
                title="编辑卡片"
              >
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
            </div>

            {/* 控制按钮区域 */}
            <ReviewControls
              reviewState={reviewState}
              onShowAnswer={showAnswer}
              onSubmitRating={submitRating}
              onEditCard={handleEditCard}
              onSkipCard={handleSkipCard}
              onPreviousCard={handlePreviousCard}
              onNextCard={handleNextCard}
              canGoPrevious={currentCardIndex > 0}
              canGoNext={currentCardIndex < cards.length - 1}
              currentCardIndex={currentCardIndex}
              totalCards={cards.length}
            />
          </div>
        </div>
      </div>
    );
  };



  const renderCompleted = () => (
    <div className="text-center py-12 space-y-6">
      <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
      <div>
        <h3 className="text-2xl font-bold text-primary-900 mb-2">复习完成！</h3>
        <p className="text-primary-600">已完成 {reviewedCards} 张卡片的复习</p>
      </div>
      <button
        onClick={resetReview}
        className="btn-primary"
      >
        返回卡组选择
      </button>
    </div>
  );

  const renderCurrentState = () => {
    switch (reviewState) {
      case 'deck-selection':
        return renderDeckSelection();
      case 'loading':
        return renderLoading();
      case 'no-cards':
        return renderNoCards();
      case 'question':
      case 'answer':
      case 'task-question':
      case 'task-evaluation':
        return renderReviewInterface();

      case 'completed':
        return renderCompleted();
      default:
        return <div>未知状态</div>;
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {renderCurrentState()}
      
      {/* Phase 2: 模态框结构 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          {/* 模态框内容 */}
          <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">编辑卡片</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 模态框内容区域 */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const currentCard = getCurrentCard();
                if (!currentCard) {
                  return (
                    <div className="p-6 text-center text-gray-500">
                      无法加载卡片信息
                    </div>
                  );
                }
                
                return (
                  <NoteEditor
                    deckId={currentCard.deckId}
                    noteId={currentCard.noteId}
                    onBack={() => setIsEditModalOpen(false)}
                    onNoteSaved={handleNoteUpdateAndRefresh}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 