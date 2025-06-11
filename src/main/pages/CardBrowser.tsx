import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Play, 
  Plus, 
  BookOpen, 
  Calendar, 
  BarChart3,
  Edit3,
  Trash2,
  List,
  Grid
} from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import { Card, Deck, Note } from '../../shared/types';
import { formatDueDate, safeDateTimeFormat } from '../../shared/utils/dateUtils';
import { formatHtmlForDisplay } from '../../shared/utils/htmlUtils';
import { CardTable } from '../components/CardTable';
import { CardFilters, FilterState } from '../components/CardFilters';

interface CardWithNote extends Card {
  note?: Note;
}

interface CardBrowserProps {
  deckId: number;
  onBack: () => void;
  onStartLearning: (deckId: number) => void;
  onCreateNote: (deckId: number) => void;
  onEditNote?: (noteId: number) => void;
}

export const CardBrowser: React.FC<CardBrowserProps> = ({ 
  deckId, 
  onBack, 
  onStartLearning, 
  onCreateNote,
  onEditNote
}) => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<CardWithNote[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [dueCardsCount, setDueCardsCount] = useState(0);

  const apiClient = new ApiClient();

  useEffect(() => {
    loadDeckAndCards();
  }, [deckId]);

  const loadDeckAndCards = async () => {
    try {
      setLoading(true);
      
      // Load deck information
      console.log('Loading deck:', deckId);
      const deckData = await apiClient.getDeckById(deckId);
      console.log('Deck data received:', deckData);
      setDeck(deckData);

      // Load cards for this deck
      console.log('Loading cards for deck:', deckId);
      const cardsData = await apiClient.getCardsByDeckId(deckId);
      console.log('Cards data received:', cardsData.length, 'cards');
      
      // Validate card data structure
      if (cardsData.length > 0) {
        const sampleCard = cardsData[0];
        console.log('Sample card structure:', {
          id: sampleCard.id,
          due: sampleCard.due,
          dueType: typeof sampleCard.due,
          state: sampleCard.state
        });
      }
      
      // Load notes for each card to display content
      const cardsWithNotes = await Promise.all(
        cardsData.map(async (card: Card) => {
          try {
            const note = await apiClient.getNoteById(card.noteId);
            return { ...card, note };
          } catch (error) {
            console.error(`Failed to load note for card ${card.id}:`, error);
            toast.error(`加载卡片 ${card.id} 的内容失败`);
            return card;
          }
        })
      );

      console.log('Cards with notes loaded successfully:', cardsWithNotes.length);
      
      // Calculate due cards count
      const now = new Date();
      const dueCards = cardsWithNotes.filter(card => {
        if (card.state === 'New') return true; // New cards are always due
        if (!card.due) return false;
        const dueDate = new Date(card.due);
        return dueDate <= now;
      });
      
      setDueCardsCount(dueCards.length);
      setCards(cardsWithNotes);
      setFilteredCards(cardsWithNotes);
    } catch (error) {
      console.error('Failed to load deck and cards:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('牌组不存在或已被删除');
        } else if (error.message.includes('Database not initialized')) {
          toast.error('数据库连接失败，请重新加载页面');
        } else {
          toast.error(`加载失败: ${error.message}`);
        }
      } else {
        toast.error('加载牌组内容失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = () => {
    onStartLearning(deckId);
  };

  const handleCreateNote = () => {
    onCreateNote(deckId);
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const handleEditCard = (card: Card) => {
    const cardWithNote = card as CardWithNote;
    if (onEditNote && cardWithNote.note) {
      onEditNote(cardWithNote.note.id);
    } else {
      toast.error('无法编辑此卡片：缺少笔记信息');
    }
  };

  const handleDeleteCard = (_card: Card) => {
    // TODO: Implement delete functionality
    toast.success('删除功能即将推出');
  };

  const handleSelectCard = (cardId: number, selected: boolean) => {
    const newSelected = new Set(selectedCards);
    if (selected) {
      newSelected.add(cardId);
    } else {
      newSelected.delete(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCards(new Set(filteredCards.map(card => card.id)));
    } else {
      setSelectedCards(new Set());
    }
  };

  const handleFilterChange = (filtered: CardWithNote[]) => {
    setFilteredCards(filtered);
    // Clear selections when filter changes
    setSelectedCards(new Set());
  };

  const getCardStateColor = (state: string) => {
    switch (state) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Learning': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-green-100 text-green-800';
      case 'Relearning': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCardContent = (card: CardWithNote) => {
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
    
    // Clean HTML content for display in lists/tables
    return formatHtmlForDisplay(content, 80);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-primary-600">
          <BarChart3 className="w-6 h-6 animate-pulse" />
          <span className="text-lg font-medium">加载卡片中...</span>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto text-primary-400 mb-4" />
        <h3 className="text-lg font-medium text-primary-900 mb-2">牌组不存在</h3>
        <p className="text-primary-600 mb-4">请检查牌组ID是否正确</p>
        <button
          onClick={onBack}
          className="btn-primary"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
            title="返回牌组列表"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-primary-900">{deck.name}</h1>
            {deck.description && (
              <p className="text-primary-600 mt-1">{deck.description}</p>
            )}
            <p className="text-sm text-primary-500 mt-1">
              共 {cards.length} 张卡片
              {filterState && filteredCards.length !== cards.length && (
                <span className="ml-2 text-accent-600">
                  (已过滤显示 {filteredCards.length} 张)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-primary-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-primary-900 shadow-sm' 
                  : 'text-primary-600 hover:text-primary-900'
              }`}
              title="表格视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-primary-900 shadow-sm' 
                  : 'text-primary-600 hover:text-primary-900'
              }`}
              title="网格视图"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {selectedCards.size > 0 && (
            <span className="px-3 py-1 bg-accent-100 text-accent-800 rounded-full text-sm">
              已选择 {selectedCards.size} 张卡片
            </span>
          )}
          
          <button
            onClick={handleCreateNote}
            className="btn-accent flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>新建卡片</span>
          </button>
          
          <button
            onClick={handleStartLearning}
            disabled={dueCardsCount === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              dueCardsCount > 0
                ? 'bg-accent-500 hover:bg-accent-600 text-white'
                : 'bg-primary-200 text-primary-500 cursor-not-allowed'
            }`}
            title={dueCardsCount > 0 ? '开始复习卡片' : '暂无到期卡片'}
          >
            <Play className="w-4 h-4" />
            <span>
              {dueCardsCount > 0 ? `复习卡片 (${dueCardsCount})` : '暂无复习'}
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {cards.length > 0 && (
        <CardFilters
          cards={cards}
          onFilterChange={handleFilterChange}
          onFilterStateChange={setFilterState}
        />
      )}

      {/* Cards Display */}
      {cards.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 mx-auto text-primary-400 mb-6" />
          <h3 className="text-xl font-semibold text-primary-900 mb-3">暂无卡片</h3>
          <p className="text-primary-600 mb-8 max-w-md mx-auto">
            这个牌组还没有卡片。创建第一张卡片开始学习吧！
          </p>
          <button
            onClick={handleCreateNote}
            className="btn-primary"
          >
            创建第一张卡片
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <CardTable
          cards={filteredCards}
          onCardClick={handleCardClick}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          selectedCards={selectedCards}
          onSelectCard={handleSelectCard}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => (
            <div
              key={card.id}
              className="card-industrial-hover p-4 cursor-pointer group"
              onClick={() => handleCardClick(card)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCardStateColor(card.state)}`}>
                  {card.state === 'New' ? '新卡片' : 
                   card.state === 'Learning' ? '学习中' :
                   card.state === 'Review' ? '复习中' : '重新学习'}
                </span>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCard(card);
                    }}
                    className="p-1 text-primary-500 hover:text-accent-600 hover:bg-primary-100 rounded transition-colors"
                    title="编辑卡片"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card);
                    }}
                    className="p-1 text-primary-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除卡片"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card Content Preview */}
              <div className="mb-3">
                <p className="text-sm text-primary-900 line-clamp-3">
                  {formatCardContent(card)}
                </p>
              </div>

              {/* Card Stats */}
              <div className="flex items-center justify-between text-xs text-primary-500">
                <div className="flex items-center space-x-3">
                  <span>复习 {card.reps} 次</span>
                  <span>遗忘 {card.lapses} 次</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDueDate(card.due)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card Detail Modal */}
      {showCardModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-900">卡片详情</h3>
                <button
                  onClick={() => setShowCardModal(false)}
                  className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">状态</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCardStateColor(selectedCard.state)}`}>
                    {selectedCard.state === 'New' ? '新卡片' : 
                     selectedCard.state === 'Learning' ? '学习中' :
                     selectedCard.state === 'Review' ? '复习中' : '重新学习'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">内容</label>
                  <div className="bg-primary-50 rounded-lg p-3">
                    <p className="text-primary-900">{formatCardContent(selectedCard as CardWithNote)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">复习次数</label>
                    <p className="text-primary-900">{selectedCard.reps}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">遗忘次数</label>
                    <p className="text-primary-900">{selectedCard.lapses}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">稳定性</label>
                    <p className="text-primary-900">{selectedCard.stability.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">难度</label>
                    <p className="text-primary-900">{selectedCard.difficulty.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">下次复习</label>
                  <p className="text-primary-900">
                    {safeDateTimeFormat(selectedCard.due)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 