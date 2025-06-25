import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Eye, AlertCircle, CheckCircle, Key, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiClient } from '../../shared/utils/api';
import type { Deck } from '../../shared/types';

interface BulkImportPageProps {
  onBack: () => void;
  onImportComplete: (deckId: number) => void;
}

interface ParsedCard {
  front: string;
  back: string;
  isValid: boolean;
  error?: string;
}

export const BulkImportPage: React.FC<BulkImportPageProps> = ({ onBack, onImportComplete }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // API密钥管理状态
  const [apiKey, setApiKey] = useState('');
  const [isKeyAvailable, setIsKeyAvailable] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const apiClient = new ApiClient();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const [deckData, userConfig] = await Promise.all([
        apiClient.getAllDecks(),
        apiClient.getUserConfig().catch(() => ({})) // 如果获取配置失败，使用空对象
      ]);
      
      setDecks(deckData);
      if (deckData.length > 0) {
        setSelectedDeckId(deckData[0].id);
      }

      // 加载已保存的API密钥
      if (userConfig.geminiApiKey) {
        setApiKey(userConfig.geminiApiKey);
        setIsKeyAvailable(true);
        setApiKeySuccess(true);
      }
    } catch (error) {
      console.error('Failed to load decks:', error);
      toast.error('加载牌组失败');
    } finally {
      setLoading(false);
    }
  };

  const parseInputText = (text: string): ParsedCard[] => {
    if (!text.trim()) return [];

    const lines = text.split('\n').filter(line => line.trim());
    const cards: ParsedCard[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Try tab-separated first, then comma-separated
      let parts = trimmedLine.split('\t');
      if (parts.length < 2) {
        parts = trimmedLine.split(',');
      }

      if (parts.length < 2) {
        cards.push({
          front: trimmedLine,
          back: '',
          isValid: false,
          error: `第 ${index + 1} 行：格式错误，需要用制表符或逗号分隔中文和英文`
        });
        return;
      }

      const front = parts[0].trim();
      const back = parts.slice(1).join(',').trim(); // Handle commas in translation

      if (!front || !back) {
        cards.push({
          front: front || '(空)',
          back: back || '(空)',
          isValid: false,
          error: `第 ${index + 1} 行：中文或英文内容为空`
        });
        return;
      }

      cards.push({
        front,
        back,
        isValid: true
      });
    });

    return cards;
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      const parsed = parseInputText(text);
      setParsedCards(parsed);
    } else {
      setParsedCards([]);
      setShowPreview(false);
    }
  };

  const handlePreview = () => {
    if (parsedCards.length === 0) {
      toast.error('请先输入要导入的内容');
      return;
    }
    setShowPreview(true);
  };

  const handleVerifyAndSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('请输入API密钥');
      return;
    }

    setIsVerifying(true);
    setApiKeyError(null);
    setApiKeySuccess(null);
    
    try {
      toast.loading('正在验证API密钥...', { id: 'verify-api-key' });
      
      const result = await apiClient.verifyGeminiApiKey(apiKey);
      
      if (result.valid) {
        // 验证成功，保存到用户配置
        const currentConfig = await apiClient.getUserConfig().catch(() => ({}));
        await apiClient.saveUserConfig({
          ...currentConfig,
          geminiApiKey: apiKey
        });
        
        setApiKeySuccess(true);
        setApiKeyError(null);
        setIsKeyAvailable(true);
        toast.success('API密钥验证成功并已保存！', { id: 'verify-api-key' });
      } else {
        setApiKeySuccess(false);
        setApiKeyError(result.error || 'API密钥验证失败');
        toast.error(result.error || 'API密钥验证失败', { id: 'verify-api-key' });
      }
    } catch (error: any) {
      console.error('API key verification failed:', error);
      setApiKeySuccess(false);
      setApiKeyError('验证失败，请检查网络连接');
      toast.error('验证失败，请检查网络连接', { id: 'verify-api-key' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAiProcess = async () => {
    if (!inputText.trim()) {
      toast.error('请先输入要处理的文本');
      return;
    }

    if (!apiKey.trim()) {
      toast.error('请先输入并验证您的Gemini API密钥');
      return;
    }

    setIsProcessingAI(true);
    
    try {
      toast.loading('AI正在处理文本...', { id: 'ai-process' });
      
      const result = await apiClient.aiProcessText(inputText);
      
      if (result && Array.isArray(result) && result.length > 0) {
        // Convert AI result to formatted text
        const formattedText = result.map(item => `${item.front}\t${item.back}`).join('\n');
        setInputText(formattedText);
        handleTextChange(formattedText);
        
        toast.success(`AI成功处理并生成了 ${result.length} 对句子！`, { id: 'ai-process' });
      } else {
        toast.error('AI处理结果为空，请检查输入文本', { id: 'ai-process' });
      }
    } catch (error: any) {
      console.error('AI processing failed:', error);
      const errorMessage = error.message || 'AI处理失败';
      toast.error(errorMessage, { id: 'ai-process' });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleImport = async () => {
    if (!selectedDeckId) {
      toast.error('请选择目标牌组');
      return;
    }

    const validCards = parsedCards.filter(card => card.isValid);
    if (validCards.length === 0) {
      toast.error('没有有效的卡片可以导入');
      return;
    }

    setIsImporting(true);
    
    try {
      toast.loading(`正在导入 ${validCards.length} 张卡片...`, { id: 'bulk-import' });

      // Prepare notes data for bulk creation
      const notesData = validCards.map(card => ({
        noteType: 'CtoE' as const,
        fields: {
          CtoE: {
            chinese: card.front,
            english: card.back,
            pinyin: '', // Empty for now, could be enhanced later
            notes: ''
          }
        },
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Call bulk import API
      const importedNotes = await apiClient.bulkCreateNotes(selectedDeckId, notesData);

      toast.success(`成功导入 ${importedNotes.length} 张卡片！`, { id: 'bulk-import' });
      
      // Navigate to the deck browser to show imported cards
      onImportComplete(selectedDeckId);
      
    } catch (error) {
      console.error('Failed to import cards:', error);
      toast.error('导入失败，请重试', { id: 'bulk-import' });
    } finally {
      setIsImporting(false);
    }
  };

  const validCardsCount = parsedCards.filter(card => card.isValid).length;
  const invalidCardsCount = parsedCards.length - validCardsCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-primary-600">
          <Upload className="w-6 h-6 animate-pulse" />
          <span className="text-lg font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">批量导入卡片</h2>
          <p className="text-primary-600 mt-1">
            粘贴双语文本，AI将自动为您对齐并生成卡片
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>
      </div>

      {/* Deck Selection */}
      <div className="card-industrial p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">选择目标牌组</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDeckId || ''}
            onChange={(e) => setSelectedDeckId(Number(e.target.value))}
            className="flex-1 input-industrial"
          >
            <option value="">请选择牌组</option>
            {decks.map(deck => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
          {selectedDeckId && (
            <div className="text-sm text-green-600 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>已选择</span>
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Configuration */}
      <div className="card-industrial p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Gemini AI 配置</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiKeyError(null);
                  setApiKeySuccess(null);
                }}
                placeholder="请输入您的 Gemini API 密钥"
                className="w-full input-industrial"
              />
            </div>
            <button
              onClick={handleVerifyAndSaveApiKey}
              disabled={isVerifying || !apiKey.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              <span>{isVerifying ? '验证中...' : '验证并保存'}</span>
            </button>
          </div>
          
          {/* Status Display */}
          {apiKeySuccess === true && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">API密钥已验证并保存</span>
            </div>
          )}
          
          {apiKeyError && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{apiKeyError}</span>
            </div>
          )}
          
          {!apiKey.trim() && !isKeyAvailable && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 space-y-1">
                <p>• 需要 Gemini API 密钥才能使用 AI 自动处理功能</p>
                <p>• 您可以在 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a> 获取免费的 API 密钥</p>
                <p>• 密钥将安全地保存在本地，不会上传到任何服务器</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="card-industrial p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">输入内容</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">AI 处理指南：</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 支持包含中英混合内容的段落或句子列表</p>
              <p>• AI将自动逐句对齐文本，并以英文的句号(.)、问号(?)、感叹号(!)作为主要的断句标志</p>
              <p>• 您也可以继续使用'Tab'或','分隔的传统格式进行手动导入</p>
              <p>• 示例：Hello world. 你好世界。How are you? 你好吗？</p>
            </div>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="请在此处粘贴您的双语文本，或需要AI处理的任何内容...&#10;&#10;示例：&#10;Hello world. 你好世界。&#10;How are you? 你好吗？&#10;Thank you very much. 非常感谢。&#10;&#10;AI将自动为您对齐并生成卡片！"
            className="w-full h-64 input-industrial resize-none font-mono text-sm"
          />
          
          {/* AI Processing Button */}
          {inputText.trim() && parsedCards.filter(card => card.isValid).length === 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleAiProcess}
                disabled={isProcessingAI}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isProcessingAI ? 'AI处理中...' : '使用AI处理文本'}</span>
              </button>
            </div>
          )}
          
          {parsedCards.length > 0 && (
            <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{validCardsCount} 张有效卡片</span>
                </div>
                {invalidCardsCount > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{invalidCardsCount} 张无效卡片</span>
                  </div>
                )}
              </div>
              <button
                onClick={handlePreview}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>预览</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && parsedCards.length > 0 && (
        <div className="card-industrial p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">预览卡片</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parsedCards.map((card, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  card.isValid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary-900">
                      {card.front}
                    </div>
                    <div className="text-sm text-primary-600 mt-1">
                      {card.back}
                    </div>
                    {card.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {card.error}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {card.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {validCardsCount > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleImport}
                disabled={isImporting || !selectedDeckId}
                className="btn-primary flex items-center space-x-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                <span>
                  {isImporting ? '导入中...' : `导入 ${validCardsCount} 张卡片`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;