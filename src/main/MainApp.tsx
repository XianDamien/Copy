import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { Cog, Home, BookOpen, BarChart3, Settings } from 'lucide-react';
import { DeckList } from './pages/DeckList';
import { NoteEditor } from './pages/NoteEditor';
import { Review } from './pages/Review';
import { CardBrowser } from './pages/CardBrowser';
import '../shared/styles/globals.css';

type Page = 'home' | 'notes' | 'review' | 'stats' | 'settings' | 'cardBrowser';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null); // Will be used for note creation
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null); // For note editing

  const handleDeckSelect = (deckId: number) => {
    setSelectedDeckId(deckId);
    setEditingNoteId(null); // Clear editing state
    setCurrentPage('cardBrowser');
  };

  const handleStartLearning = (deckId: number) => {
    setSelectedDeckId(deckId);
    setEditingNoteId(null); // Clear editing state
    setCurrentPage('review');
  };

  const handleCreateNote = (deckId: number) => {
    setSelectedDeckId(deckId);
    setEditingNoteId(null); // Clear editing state for create mode
    setCurrentPage('notes');
  };

  const handleEditNote = (noteId: number) => {
    setEditingNoteId(noteId);
    setCurrentPage('notes');
  };

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if (page === 'home' || page === 'review') {
      setSelectedDeckId(null);
      setEditingNoteId(null);
    }
  };

  const handleBackToCardBrowser = () => {
    setEditingNoteId(null);
    setCurrentPage('cardBrowser');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <DeckList onDeckSelect={handleDeckSelect} onCreateNote={handleCreateNote} onStartReview={handleStartLearning} />;
      case 'cardBrowser':
        return selectedDeckId ? (
          <CardBrowser 
            deckId={selectedDeckId}
            onBack={() => handleNavigation('home')}
            onStartLearning={handleStartLearning}
            onCreateNote={handleCreateNote}
            onEditNote={handleEditNote}
          />
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">请先选择牌组</h3>
            <p className="text-primary-600">从首页选择一个牌组查看卡片</p>
            <button
              onClick={() => handleNavigation('home')}
              className="btn-primary mt-4"
            >
              返回首页
            </button>
          </div>
        );
      case 'notes':
        return selectedDeckId ? (
          <NoteEditor 
            deckId={selectedDeckId}
            noteId={editingNoteId || undefined}
            onBack={editingNoteId ? handleBackToCardBrowser : () => handleNavigation('home')}
            onNoteSaved={() => {
              // Navigate back to card browser after saving
              if (editingNoteId) {
                handleBackToCardBrowser();
              }
              console.log('Note saved successfully');
            }}
          />
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">请先选择牌组</h3>
            <p className="text-primary-600">从首页选择一个牌组开始创建笔记</p>
            <button
              onClick={() => handleNavigation('home')}
              className="btn-primary mt-4"
            >
              返回首页
            </button>
          </div>
        );
      case 'review':
        return <Review deckId={selectedDeckId} onBack={() => handleNavigation('home')} onEditNote={handleEditNote} />;
      case 'stats':
        return (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">学习统计</h3>
            <p className="text-primary-600">即将推出...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">设置</h3>
            <p className="text-primary-600">即将推出...</p>
          </div>
        );
      default:
        return <DeckList onDeckSelect={handleDeckSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-primary-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* 顶部导航栏 */}
      <header className="bg-primary-700 text-white shadow-industrial">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Cog className="w-8 h-8" />
              <h1 className="text-xl font-bold">LanGear Language Learning</h1>
            </div>
            
            <nav className="flex items-center space-x-6">
              <button 
                onClick={() => handleNavigation('home')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-industrial transition-colors ${
                  currentPage === 'home' 
                    ? 'bg-primary-600 hover:bg-primary-500' 
                    : 'hover:bg-primary-600'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>首页</span>
              </button>
              <button 
                onClick={() => handleNavigation('review')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-industrial transition-colors ${
                  currentPage === 'review' 
                    ? 'bg-primary-600 hover:bg-primary-500' 
                    : 'hover:bg-primary-600'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>复习</span>
              </button>
              <button 
                onClick={() => handleNavigation('stats')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-industrial transition-colors ${
                  currentPage === 'stats' 
                    ? 'bg-primary-600 hover:bg-primary-500' 
                    : 'hover:bg-primary-600'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>统计</span>
              </button>
              <button 
                onClick={() => handleNavigation('settings')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-industrial transition-colors ${
                  currentPage === 'settings' 
                    ? 'bg-primary-600 hover:bg-primary-500' 
                    : 'hover:bg-primary-600'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>设置</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

// 渲染应用
const container = document.getElementById('main-root');
if (container) {
  const root = createRoot(container);
  root.render(<MainApp />);
} 