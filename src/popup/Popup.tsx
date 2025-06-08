import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, Plus, BookOpen, BarChart3, Zap, Cog } from 'lucide-react';
import { ApiClient } from '../shared/utils/api';
import '../shared/styles/globals.css';

interface DeckInfo {
  id: number;
  name: string;
  dueCount: number;
}

export const Popup: React.FC = () => {
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    chinese: '',
    english: '',
    deckId: 0
  });

  const apiClient = new ApiClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allDecks, dueCards] = await Promise.all([
        apiClient.getAllDecks(),
        apiClient.getDueCards()
      ]);

      // 计算每个牌组的到期卡片数量
      const deckInfos: DeckInfo[] = allDecks.map(deck => {
        const deckDueCount = dueCards.filter(_card => {
          // 这里需要通过noteId关联到deckId，简化处理
          return true; // 暂时显示总数
        }).length;

        return {
          id: deck.id,
          name: deck.name,
          dueCount: deckDueCount
        };
      });

      setDecks(deckInfos);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.chinese || !quickAddData.english || !quickAddData.deckId) {
      return;
    }

    try {
      const note = {
        deckId: quickAddData.deckId,
        noteType: 'CtoE' as const,
        fields: {
          chineseOriginal: quickAddData.chinese,
          englishTranslation: quickAddData.english
        },
        tags: []
      };

      await apiClient.createNote(note);
      setQuickAddData({ chinese: '', english: '', deckId: 0 });
      setShowQuickAdd(false);
      
      // 显示成功提示
      showNotification('卡片创建成功！');
    } catch (error) {
      console.error('Failed to create note:', error);
      showNotification('创建失败，请重试');
    }
  };

  const showNotification = (message: string) => {
    // 简单的通知实现
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'fixed top-4 right-4 bg-primary-700 text-white px-4 py-2 rounded-industrial shadow-industrial z-50';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const openMainApp = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/main/index.html')
    });
    window.close();
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  if (loading) {
    return (
      <div className="w-80 h-96 bg-primary-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-primary-600">
          <Cog className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-primary-50 border border-primary-200">
      {/* 头部 */}
      <div className="bg-primary-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cog className="w-6 h-6" />
            <h1 className="text-lg font-bold">AnGear</h1>
          </div>
          <button
            onClick={openOptions}
            className="p-1 hover:bg-primary-600 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <p className="text-primary-200 text-sm mt-1">工业级语言学习工具</p>
      </div>

      {/* 主要操作区域 */}
      <div className="p-4 space-y-4">
        {/* 快速操作按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center justify-center space-x-2 bg-accent-500 hover:bg-accent-600 text-white px-3 py-2 rounded-industrial transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">快速添加</span>
          </button>
          
          <button
            onClick={openMainApp}
            className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-industrial transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">打开应用</span>
          </button>
        </div>

        {/* 快速添加表单 */}
        {showQuickAdd && (
          <div className="bg-white border border-primary-200 rounded-industrial p-4 space-y-3">
            <h3 className="text-sm font-semibold text-primary-700 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>快速创建汉译英卡片</span>
            </h3>
            
            <div className="space-y-2">
              <select
                value={quickAddData.deckId}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, deckId: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-primary-300 rounded-industrial text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value={0}>选择牌组</option>
                {decks.map(deck => (
                  <option key={deck.id} value={deck.id}>{deck.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="中文原文"
                value={quickAddData.chinese}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, chinese: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-300 rounded-industrial text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              
              <input
                type="text"
                placeholder="英文翻译"
                value={quickAddData.english}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, english: e.target.value }))}
                className="w-full px-3 py-2 border border-primary-300 rounded-industrial text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleQuickAdd}
                disabled={!quickAddData.chinese || !quickAddData.english || !quickAddData.deckId}
                className="flex-1 bg-success text-white px-3 py-2 rounded-industrial text-sm font-medium hover:bg-green-600 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
              >
                创建卡片
              </button>
              <button
                onClick={() => setShowQuickAdd(false)}
                className="px-3 py-2 border border-primary-300 text-primary-600 rounded-industrial text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 牌组状态 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-primary-700 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>学习状态</span>
          </h3>
          
          {decks.length === 0 ? (
            <div className="text-center py-6 text-primary-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无牌组</p>
              <button
                onClick={openMainApp}
                className="text-accent-600 hover:text-accent-700 text-sm font-medium mt-1"
              >
                创建第一个牌组
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {decks.map(deck => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between bg-white border border-primary-200 rounded-industrial px-3 py-2"
                >
                  <span className="text-sm font-medium text-primary-700 truncate">
                    {deck.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    {deck.dueCount > 0 && (
                      <span className="bg-error text-white text-xs px-2 py-1 rounded-full">
                        {deck.dueCount}
                      </span>
                    )}
                    <span className="text-xs text-primary-500">
                      到期
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="border-t border-primary-200 p-3">
        <button
          onClick={openMainApp}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-industrial text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>进入主应用</span>
        </button>
      </div>
    </div>
  );
};

// 渲染应用
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 