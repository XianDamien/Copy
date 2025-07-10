import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, BookOpen, BarChart3, Cog } from 'lucide-react';
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

  const openMainApp = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/main/index.html')
    });
    window.close();
  };

  const openOptions = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/main/index.html?page=settings')
    });
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
            <h1 className="text-lg font-bold">LanGear</h1>
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
        {/* 主要操作按钮 */}
        <div className="w-full">
          <button
            onClick={openMainApp}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-industrial transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">打开主应用</span>
          </button>
        </div>

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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {decks.map(deck => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between bg-white border border-primary-200 rounded-industrial px-3 py-2 hover:bg-primary-25 transition-colors cursor-pointer"
                  onClick={openMainApp}
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
    </div>
  );
};

// 渲染应用
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 