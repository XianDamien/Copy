import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Edit3, Trash2, BarChart3, Play, TestTube, RotateCcw } from 'lucide-react';
import { ApiClient } from '../../shared/utils/api';
import { Deck, DeckStatistics } from '../../shared/types';
import { TestDataGenerator } from '../../shared/utils/testDataGenerator';
import { FSRSTestValidator } from '../../shared/utils/fsrsTestValidator';

interface DeckWithStats extends Deck {
  statistics?: DeckStatistics;
}

interface DeckListProps {
  onDeckSelect?: (deckId: number) => void;
  onCreateNote?: (deckId: number) => void;
  onStartReview?: (deckId: number) => void;
  onBulkImport?: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({ onDeckSelect, onCreateNote, onStartReview, onBulkImport }) => {
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const apiClient = new ApiClient();

  useEffect(() => {
    loadDecks();
  }, []);

  // 阶段3：添加页面可见性变化监听，实现智能数据刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 当页面重新变为可见时，重新加载数据
      if (!document.hidden) {
        loadDecks();
      }
    };

    const handleFocus = () => {
      // 当窗口重新获得焦点时，重新加载数据
      loadDecks();
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // 监听窗口焦点变化
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 阶段3：提供手动刷新方法
  const refreshDecks = async () => {
    await loadDecks();
  };

  const loadDecks = async () => {
    try {
      setLoading(true);
      const deckData = await apiClient.getAllDecks();
      
      // 获取每个牌组的统计信息
      const decksWithStats = await Promise.all(
        deckData.map(async (deck) => {
          try {
            const statistics = await apiClient.getDeckStatistics(deck.id);
            return { ...deck, statistics };
          } catch (error) {
            console.error(`Failed to load statistics for deck ${deck.id}:`, error);
            return deck;
          }
        })
      );
      
      setDecks(decksWithStats);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!formData.name.trim()) return;

    try {
      await apiClient.createDeck({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      // Re-fetch decks from database to ensure UI reflects true state
      await loadDecks();
      toast.success('牌组创建成功！');
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create deck:', error);
      toast.error('创建牌组失败，请重试');
    }
  };

  const handleEditDeck = async () => {
    if (!selectedDeck || !formData.name.trim()) return;

    try {
      await apiClient.updateDeck(selectedDeck.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      // Re-fetch to ensure consistency
      await loadDecks();
      toast.success('牌组更新成功！');
      resetForm();
      setShowEditModal(false);
      setSelectedDeck(null);
    } catch (error) {
      console.error('Failed to update deck:', error);
      toast.error('更新牌组失败，请重试');
    }
  };

  const handleDeleteDeck = async () => {
    if (!selectedDeck) return;

    try {
      await apiClient.deleteDeck(selectedDeck.id);
      // Re-fetch to ensure consistency
      await loadDecks();
      toast.success('牌组删除成功！');
      setShowDeleteModal(false);
      setSelectedDeck(null);
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast.error('删除牌组失败，请重试');
    }
  };

  const handleGenerateTestData = async () => {
    if (isGeneratingTestData) return;
    
    setIsGeneratingTestData(true);
    
    try {
      toast.loading('正在生成FSRS测试数据...', { id: 'test-data' });
      
      // Create test deck
      const testDeck = await apiClient.createDeck({
        name: 'FSRS测试牌组',
        description: '包含100张测试卡片的FSRS算法验证牌组'
      });
      
      // Generate test data
      const testDataResult = TestDataGenerator.generateTestData({
        cardCount: 100,
        deckName: 'FSRS测试牌组',
        includeVariedDifficulty: true,
        includeGrammarPatterns: true
      });
      
      // Create notes and cards
      for (const noteData of testDataResult.notes) {
        await apiClient.createNote({
          deckId: testDeck.id,
          ...noteData
        });
      }
      
      // Run FSRS validation
      const validator = new FSRSTestValidator();
      const validationReport = await validator.runCompleteValidation();
      
      // Show results
      if (validationReport.overallSuccess) {
        toast.success('FSRS测试数据生成成功！所有测试通过', { id: 'test-data' });
      } else {
        const failedTests = validationReport.testResults.filter(t => !t.success);
        toast.error(`FSRS测试完成，但有 ${failedTests.length} 个测试失败`, { id: 'test-data' });
      }
      
      // Refresh deck list
      await loadDecks();
      
    } catch (error) {
      console.error('Failed to generate test data:', error);
      toast.error('生成测试数据失败，请重试', { id: 'test-data' });
    } finally {
      setIsGeneratingTestData(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (deck: Deck) => {
    setSelectedDeck(deck);
    setFormData({
      name: deck.name,
      description: deck.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (deck: Deck) => {
    setSelectedDeck(deck);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-primary-600">
          <BarChart3 className="w-6 h-6 animate-pulse" />
          <span className="text-lg font-medium">加载牌组中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">我的牌组</h2>
          <p className="text-primary-600 mt-1">
            共 {decks.length} 个牌组，
            {decks.reduce((sum, deck) => sum + (deck.statistics?.totalCards || 0), 0)} 张卡片
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 阶段3：添加刷新按钮 */}
          <button
            onClick={refreshDecks}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
            title="刷新牌组数据"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '刷新中...' : '刷新'}</span>
          </button>
          
          <button
            onClick={handleGenerateTestData}
            disabled={isGeneratingTestData}
            className="btn-secondary flex items-center space-x-2"
          >
            <TestTube className="w-4 h-4" />
            <span>{isGeneratingTestData ? '生成中...' : 'FSRS测试'}</span>
          </button>
          
          <button
            onClick={onBulkImport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>批量导入</span>
          </button>
        
        <button
          onClick={openCreateModal}
          className="btn-accent flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>创建牌组</span>
        </button>
        </div>
      </div>

      {/* 牌组网格 */}
      {decks.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 mx-auto text-primary-400 mb-6" />
          <h3 className="text-xl font-semibold text-primary-900 mb-3">暂无牌组</h3>
          <p className="text-primary-600 mb-8 max-w-md mx-auto">
            创建您的第一个牌组开始学习之旅。牌组可以帮助您组织和管理学习内容。
          </p>
          <button
            onClick={openCreateModal}
            className="btn-primary"
          >
            创建第一个牌组
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div 
              key={deck.id} 
              className="card-industrial-hover p-6 group cursor-pointer"
              onClick={() => onDeckSelect?.(deck.id)}
            >
              {/* 牌组头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-primary-900 truncate mb-1">
                    {deck.name}
                  </h3>
                </div>
                
                {/* 难度标签和操作按钮 */}
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Basic
                  </span>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNote?.(deck.id);
                    }}
                    className="p-2 text-accent-500 hover:text-accent-600 hover:bg-accent-100 rounded-lg transition-colors"
                    title="新建卡片"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(deck);
                    }}
                    className="p-2 text-primary-500 hover:text-accent-600 hover:bg-primary-100 rounded-lg transition-colors"
                    title="编辑牌组"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(deck);
                    }}
                    className="p-2 text-primary-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除牌组"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  </div>
                </div>
              </div>

              {/* 牌组描述内容 */}
              <div className="mb-4">
                {deck.description ? (
                  <p className="text-primary-600 text-sm leading-relaxed mb-3">
                    {deck.description}
                  </p>
                ) : (
                  <p className="text-primary-500 text-sm italic mb-3">
                    暂无描述信息
                  </p>
                )}
                
                {/* 卡片统计信息 - 增强显示 */}
                {deck.statistics && (
                  <div className="space-y-3">
                    {/* 统计数据 */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-xs text-blue-600 font-medium">新卡片</div>
                        <div className="text-sm font-bold text-blue-800">{deck.statistics.newCards || 0}</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2">
                        <div className="text-xs text-orange-600 font-medium">学习中</div>
                        <div className="text-sm font-bold text-orange-800">{deck.statistics.learningCards || 0}</div>
                    </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="text-xs text-green-600 font-medium">待复习</div>
                        <div className="text-sm font-bold text-green-800">{deck.statistics.dueCards || 0}</div>
                      </div>
                    </div>
                    
                    {/* 复习按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartReview?.(deck.id);
                      }}
                      disabled={!deck.statistics.dueCards || deck.statistics.dueCards === 0}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        deck.statistics.dueCards && deck.statistics.dueCards > 0
                          ? 'bg-accent-500 hover:bg-accent-600 text-white'
                          : 'bg-primary-200 text-primary-500 cursor-not-allowed'
                      }`}
                      title={deck.statistics.dueCards && deck.statistics.dueCards > 0 ? '开始复习' : '暂无到期卡片'}
                    >
                      <Play className="w-4 h-4" />
                      <span>
                        {deck.statistics.dueCards && deck.statistics.dueCards > 0 
                          ? `复习 (${deck.statistics.dueCards})` 
                          : '暂无复习'
                        }
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* 底部信息 */}
              <div className="pt-4 border-t border-primary-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-primary-500">
                    创建于 {new Date(deck.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-primary-600">
                    <span>中文 → English</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建牌组模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-primary-900">创建新牌组</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-primary-500 hover:text-primary-700"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  牌组名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入牌组名称"
                  className="input-industrial"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入牌组描述"
                  rows={3}
                  className="input-industrial resize-none"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleCreateDeck}
                disabled={!formData.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑牌组模态框 */}
      {showEditModal && selectedDeck && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-primary-900">编辑牌组</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-primary-500 hover:text-primary-700"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  牌组名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入牌组名称"
                  className="input-industrial"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入牌组描述"
                  rows={3}
                  className="input-industrial resize-none"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleEditDeck}
                disabled={!formData.name.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedDeck && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-red-900">删除牌组</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-primary-500 hover:text-primary-700"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="text-primary-900 mb-2">
                    确定要删除牌组 <strong>"{selectedDeck.name}"</strong> 吗？
                  </p>
                  <p className="text-sm text-primary-600">
                    此操作将永久删除牌组中的所有卡片和学习记录，且无法撤销。
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDeleteDeck}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-industrial font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 