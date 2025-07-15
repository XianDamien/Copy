import React, { useState, useCallback } from 'react';
import { FileAudio, FileText, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseSubtitle, type SubtitleEntry } from '../../../shared/utils/subtitleParser';
import { geminiService, type TranslatedSubtitle } from '../../../background/geminiService';
import { ApiClient } from '../../../shared/utils/api';
import { AudioSlicer, type AudioSegment } from '../../../shared/utils/audioSlicer';
import { AudioBatchImporter, type AudioCardImportResult } from '../../../shared/utils/audioBatchImporter';
import AudioVisualizer from './AudioVisualizer';
import SubtitleList from './SubtitleList';

interface AudioSubtitleImporterProps {
  onImportComplete?: (result: any) => void;
}

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
}

const SUPPORTED_AUDIO_FORMATS = ['.mp3', '.wav', '.m4a', '.ogg'];
const SUPPORTED_SUBTITLE_FORMATS = ['.srt', '.vtt'];
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_SUBTITLE_SIZE = 10 * 1024 * 1024; // 10MB

export const AudioSubtitleImporter: React.FC<AudioSubtitleImporterProps> = ({ 
  onImportComplete 
}) => {
  // TODO: 后续实现完整的导入流程时使用onImportComplete
  console.log('AudioSubtitleImporter loaded', { onImportComplete });
  
  const apiClient = React.useMemo(() => new ApiClient(), []);
  const [audioFile, setAudioFile] = useState<UploadedFile | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState<'audio' | 'subtitle' | null>(null);
  
  // 字幕解析状态
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // 翻译状态
  const [translatedSubtitles, setTranslatedSubtitles] = useState<TranslatedSubtitle[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [apiKey, setApiKey] = useState('');
  
  // 音频切分状态
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const [slicingProgress, setSlicingProgress] = useState(0);
  
  // 导入状态
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [availableDecks, setAvailableDecks] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<AudioCardImportResult | null>(null);
  
  // 处理阶段：upload -> processing -> preview -> translation -> cards -> slicing -> importing -> complete
  const [stage, setStage] = useState<'upload' | 'processing' | 'preview' | 'translation' | 'cards' | 'slicing' | 'importing' | 'complete'>('upload');

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 验证音频文件
  const validateAudioFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!SUPPORTED_AUDIO_FORMATS.includes(extension)) {
      return `不支持的音频格式。支持的格式：${SUPPORTED_AUDIO_FORMATS.join(', ')}`;
    }
    
    if (file.size > MAX_AUDIO_SIZE) {
      return `音频文件过大。最大支持 ${formatFileSize(MAX_AUDIO_SIZE)}`;
    }
    
    return null;
  };

  // 验证字幕文件
  const validateSubtitleFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!SUPPORTED_SUBTITLE_FORMATS.includes(extension)) {
      return `不支持的字幕格式。支持的格式：${SUPPORTED_SUBTITLE_FORMATS.join(', ')}`;
    }
    
    if (file.size > MAX_SUBTITLE_SIZE) {
      return `字幕文件过大。最大支持 ${formatFileSize(MAX_SUBTITLE_SIZE)}`;
    }
    
    return null;
  };

  // 处理音频文件上传
  const handleAudioUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const error = validateAudioFile(file);
    
    if (error) {
      toast.error(error);
      return;
    }
    
    setAudioFile({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'audio/*'
    });
    
    toast.success('音频文件上传成功');
  }, []);

  // 处理字幕文件上传
  const handleSubtitleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const error = validateSubtitleFile(file);
    
    if (error) {
      toast.error(error);
      return;
    }
    
    setSubtitleFile({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'text/*'
    });
    
    // 立即解析字幕文件
    try {
      const content = await file.text();
      const parseResult = parseSubtitle(content);
      setSubtitleEntries(parseResult.entries);
      toast.success(`字幕文件上传成功，解析出 ${parseResult.totalEntries} 个条目`);
    } catch (error) {
      console.error('字幕解析失败:', error);
      toast.error(error instanceof Error ? error.message : '字幕解析失败');
    }
  }, []);

  // 拖拽处理
  const handleDrag = useCallback((e: React.DragEvent, type: 'audio' | 'subtitle') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(type);
    } else if (e.type === 'dragleave') {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'audio' | 'subtitle') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    const files = e.dataTransfer.files;
    if (type === 'audio') {
      handleAudioUpload(files);
    } else {
      handleSubtitleUpload(files);
    }
  }, [handleAudioUpload, handleSubtitleUpload]);

  // 移除文件
  const removeFile = (type: 'audio' | 'subtitle') => {
    if (type === 'audio') {
      setAudioFile(null);
    } else {
      setSubtitleFile(null);
    }
  };

  // 文件上传区域组件
  const FileUploadZone: React.FC<{
    type: 'audio' | 'subtitle';
    file: UploadedFile | null;
    onUpload: (files: FileList | null) => void;
    title: string;
    description: string;
    icon: React.ReactNode;
    formats: string[];
  }> = ({ type, file, onUpload, title, description, icon, formats }) => (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
        dragActive === type
          ? 'border-primary-500 bg-primary-50'
          : file
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={(e) => handleDrag(e, type)}
      onDragLeave={(e) => handleDrag(e, type)}
      onDragOver={(e) => handleDrag(e, type)}
      onDrop={(e) => handleDrop(e, type)}
    >
      <input
        type="file"
        accept={formats.join(',')}
        onChange={(e) => onUpload(e.target.files)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      {file ? (
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            {icon}
            <CheckCircle className="w-6 h-6 text-green-600 ml-2" />
          </div>
          <p className="text-sm font-medium text-green-800 mb-1">{file.name}</p>
          <p className="text-xs text-green-600 mb-3">{file.size}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFile(type);
            }}
            className="inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            <X className="w-3 h-3 mr-1" />
            移除文件
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex justify-center mb-3">
            {icon}
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <div className="text-xs text-gray-500">
            支持格式: {formats.join(', ')}
          </div>
        </div>
      )}
    </div>
  );

  const canProceed = audioFile && subtitleFile && subtitleEntries.length > 0;

  // 开始处理文件
  const handleStartProcessing = useCallback(async () => {
    if (!canProceed) return;
    
    setIsProcessing(true);
    setStage('processing');
    
    try {
      // 验证音频与字幕时长同步（这里需要获取音频时长，暂时跳过）
      // const audioDuration = await getAudioDuration(audioFile.file);
      // const validation = validateSubtitleAudioSync(subtitleDuration, audioDuration);
      
      toast.success('文件处理完成，可以开始预览和编辑');
      setStage('preview');
    } catch (error) {
      console.error('文件处理失败:', error);
      toast.error('文件处理失败，请重试');
      setStage('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [canProceed]);

  // 返回上传界面
  const handleBackToUpload = useCallback(() => {
    setStage('upload');
    setSubtitleEntries([]);
    setCurrentTime(0);
  }, []);

  // 时间更新处理
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // 跳转处理
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    // AudioVisualizer组件会处理实际的跳转
  }, []);

  // 加载API密钥
  const loadApiKey = useCallback(async () => {
    try {
      const userConfig = await apiClient.getUserConfig();
      if (userConfig.geminiApiKey) {
        setApiKey(userConfig.geminiApiKey);
      }
    } catch (error) {
      console.error('加载API密钥失败:', error);
    }
  }, []);

  // 组件挂载时加载API密钥和牌组列表
  React.useEffect(() => {
    loadApiKey();
    loadAvailableDecks();
  }, [loadApiKey]);

  // 加载可用牌组
  const loadAvailableDecks = useCallback(async () => {
    try {
      const decks = await apiClient.getAllDecks();
      setAvailableDecks(decks);
      if (decks.length > 0 && !selectedDeckId) {
        setSelectedDeckId(decks[0].id);
      }
    } catch (error) {
      console.error('加载牌组列表失败:', error);
      toast.error('加载牌组列表失败');
    }
  }, [selectedDeckId]);

  // 开始AI翻译
  const handleStartTranslation = useCallback(async () => {
    if (!apiKey) {
      toast.error('请先在文本导入模式中设置Gemini API密钥');
      return;
    }

    if (subtitleEntries.length === 0) {
      toast.error('没有字幕条目需要翻译');
      return;
    }

    setIsTranslating(true);
    setStage('translation');
    setTranslationProgress(0);

    try {
      const translationInput = subtitleEntries.map(entry => ({
        id: entry.id,
        text: entry.text,
        startTime: entry.startTime,
        endTime: entry.endTime
      }));

      const result = await geminiService.translateSubtitlesBatch(
        translationInput,
        apiKey,
        (progress) => {
          setTranslationProgress(progress);
        }
      );

      if (result.success && result.data) {
        setTranslatedSubtitles(result.data);
        toast.success(`成功翻译 ${result.data.length} 个字幕条目`);
        setStage('cards');
      } else {
        toast.error(result.error || '翻译失败');
        setStage('preview');
      }
    } catch (error) {
      console.error('翻译过程失败:', error);
      toast.error('翻译过程中发生错误');
      setStage('preview');
    } finally {
      setIsTranslating(false);
    }
  }, [apiKey, subtitleEntries, geminiService]);

  // 开始音频切分
  const handleStartSlicing = useCallback(async () => {
    if (!audioFile || translatedSubtitles.length === 0) {
      toast.error('缺少音频文件或翻译数据');
      return;
    }

    setIsSlicing(true);
    setStage('slicing');
    setSlicingProgress(0);

    try {
      const audioSlicer = new AudioSlicer();
      
      const result = await audioSlicer.sliceAudioBySubtitles(
        audioFile.file,
        translatedSubtitles,
        (progress) => {
          setSlicingProgress(progress);
        }
      );

      audioSlicer.dispose(); // 释放音频上下文资源

      if (result.success && result.segments) {
        setAudioSegments(result.segments);
        toast.success(`成功切分 ${result.segments.length} 个音频片段`);
        setStage('importing');
      } else {
        toast.error(result.error || '音频切分失败');
        setStage('cards');
      }
    } catch (error) {
      console.error('音频切分失败:', error);
      toast.error('音频切分过程中发生错误');
      setStage('cards');
    } finally {
      setIsSlicing(false);
    }
  }, [audioFile, translatedSubtitles]);

  // 开始批量导入
  const handleStartImporting = useCallback(async () => {
    if (!selectedDeckId || audioSegments.length === 0) {
      toast.error('请选择牌组并确保有音频片段');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const batchImporter = new AudioBatchImporter();
      
      const importData = {
        deckId: selectedDeckId,
        audioSegments,
        sourceFileName: audioFile?.name || 'unknown'
      };

      // 验证导入数据
      const validation = await batchImporter.validateImportData(importData);
      if (!validation.valid) {
        toast.error(`导入数据验证失败: ${validation.errors.join(', ')}`);
        return;
      }

      const result = await batchImporter.importAudioCards(
        importData,
        (progress) => {
          setImportProgress(progress);
        }
      );

      if (result.success) {
        setImportResult(result);
        toast.success(`成功导入 ${result.totalCards} 张卡片，${result.totalNotes} 个笔记`);
        setStage('complete');
      } else {
        toast.error(result.error || '批量导入失败');
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      toast.error('批量导入过程中发生错误');
    } finally {
      setIsImporting(false);
    }
  }, [selectedDeckId, audioSegments, audioFile]);

  // 处理中界面
  if (stage === 'processing') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">处理文件中</h3>
          <p className="text-gray-600">正在解析音频和字幕文件，请稍候...</p>
        </div>
      </div>
    );
  }

  // 翻译中界面
  if (stage === 'translation') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI翻译中</h3>
          <p className="text-gray-600 mb-4">正在使用Gemini AI翻译字幕内容...</p>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${translationProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{translationProgress}% 完成</p>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>• 正在批量处理 {subtitleEntries.length} 个字幕条目</p>
            <p>• 请保持网络连接稳定</p>
          </div>
        </div>
      </div>
    );
  }



  // 卡片预览界面
  if (stage === 'cards') {
    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStage('preview')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>返回预览</span>
          </button>
          <div className="text-sm text-gray-500">
            翻译完成 - {translatedSubtitles.length} 个学习卡片
          </div>
        </div>

        <div className="card-industrial p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">翻译结果预览</h3>
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {translatedSubtitles.map((subtitle, index) => (
              <div key={subtitle.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-xs text-gray-400">
                    {Math.round(subtitle.startTime / 1000)}s - {Math.round(subtitle.endTime / 1000)}s
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                    <span className="text-xs text-gray-500">原文：</span>
                    <p>{subtitle.originalText}</p>
                  </div>
                  <div className="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">
                    <span className="text-xs text-green-600">译文：</span>
                    <p>{subtitle.translatedText}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => setStage('preview')}
              className="btn-secondary px-6 py-2"
            >
              重新翻译
            </button>
            <button
              onClick={handleStartSlicing}
              disabled={isSlicing || !translatedSubtitles.length}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSlicing ? '切分中...' : '开始音频切分'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 音频切分中界面
  if (stage === 'slicing') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">音频切分中</h3>
          <p className="text-gray-600 mb-4">正在根据字幕时间戳切分音频文件...</p>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${slicingProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{slicingProgress}% 完成</p>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>• 正在切分 {translatedSubtitles.length} 个音频片段</p>
            <p>• 使用Web Audio API进行精确切分</p>
          </div>
        </div>
      </div>
    );
  }

  // 导入准备界面
  if (stage === 'importing') {
    const batchImporter = new AudioBatchImporter();
    const preview = batchImporter.getImportPreview(audioSegments);
    
    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStage('cards')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>返回卡片预览</span>
          </button>
          <div className="text-sm text-gray-500">
            准备导入 - {audioSegments.length} 个音频片段
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 导入预览 */}
          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">导入预览</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">音频片段数量</span>
                <span className="font-medium">{preview.totalSegments}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">预计生成笔记</span>
                <span className="font-medium">{preview.estimatedNotes}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">预计生成卡片</span>
                <span className="font-medium">{preview.estimatedCards}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">总音频时长</span>
                <span className="font-medium">{Math.round(preview.totalDuration / 1000)}秒</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">平均片段时长</span>
                <span className="font-medium">{Math.round(preview.averageDuration / 1000)}秒</span>
              </div>
            </div>
          </div>

          {/* 导入设置 */}
          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">导入设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择目标牌组
                </label>
                <select
                  value={selectedDeckId || ''}
                  onChange={(e) => setSelectedDeckId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">请选择牌组</option>
                  {availableDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">卡片类型说明</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• <strong>翻译卡片</strong>：英文→中文翻译练习</p>
                  <p>• <strong>反向卡片</strong>：中文→英文翻译练习</p>
                  <p>• <strong>听力卡片</strong>：听音频理解内容</p>
                </div>
              </div>

              <button
                onClick={handleStartImporting}
                disabled={isImporting || !selectedDeckId}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? `导入中... ${importProgress}%` : '开始导入卡片'}
              </button>

              {!selectedDeckId && availableDecks.length === 0 && (
                <p className="text-xs text-red-600">
                  没有可用的牌组，请先创建一个牌组
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 导入完成界面
  if (stage === 'complete' && importResult) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">导入完成！</h3>
          <p className="text-gray-600">音频+字幕批量制卡已成功完成</p>
        </div>

        <div className="card-industrial p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">导入结果</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{importResult.totalNotes}</div>
              <div className="text-sm text-blue-700">创建笔记</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importResult.totalCards}</div>
              <div className="text-sm text-green-700">创建卡片</div>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => {
                // 重置状态，开始新的导入
                setStage('upload');
                setAudioFile(null);
                setSubtitleFile(null);
                setSubtitleEntries([]);
                setTranslatedSubtitles([]);
                setAudioSegments([]);
                setImportResult(null);
              }}
              className="btn-secondary px-6 py-2"
            >
              导入更多文件
            </button>
            <button
              onClick={() => {
                // 关闭组件或导航到牌组页面
                onImportComplete?.(importResult);
              }}
              className="btn-primary px-6 py-2"
            >
              查看导入的卡片
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 预览界面
  if (stage === 'preview') {
    return (
      <div className="space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToUpload}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>返回上传</span>
          </button>
          <div className="text-sm text-gray-500">
            {audioFile?.name} + {subtitleFile?.name}
          </div>
        </div>

        {/* 音频可视化 */}
        <div className="card-industrial p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">音频波形与字幕区域</h3>
          <AudioVisualizer
            audioFile={audioFile!.file}
            subtitleEntries={subtitleEntries}
            onTimeUpdate={handleTimeUpdate}
            onSeek={handleSeek}
            height={150}
          />
        </div>

        {/* 字幕列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">字幕条目列表</h3>
            <SubtitleList
              entries={subtitleEntries}
              currentTime={currentTime}
              onSeek={handleSeek}
              maxHeight="400px"
            />
          </div>

          <div className="card-industrial p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">操作面板</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">下一步操作</h4>
                <p className="text-sm text-blue-700 mb-3">
                  音频和字幕已成功加载。您可以：
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mb-4">
                  <li>• 点击波形区域跳转到指定时间</li>
                  <li>• 拖拽调整字幕区域的时间范围</li>
                  <li>• 播放音频验证同步效果</li>
                </ul>
                <button
                  onClick={handleStartTranslation}
                  disabled={isTranslating || !apiKey}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranslating ? '翻译中...' : '开始AI翻译'}
                </button>
                {!apiKey && (
                  <p className="text-xs text-red-600 mt-1">
                    请先在文本导入模式中设置Gemini API密钥
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500">
                <p>统计信息：</p>
                <p>• 字幕条目：{subtitleEntries.length} 个</p>
                <p>• 总时长：{Math.round(Math.max(...subtitleEntries.map(e => e.endTime)) / 1000)}秒</p>
                <p>• 音频文件：{audioFile?.size}</p>
                <p>• 字幕文件：{subtitleFile?.size}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 上传界面（默认）
  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 音频文件上传 */}
        <FileUploadZone
          type="audio"
          file={audioFile}
          onUpload={handleAudioUpload}
          title="上传音频文件"
          description="拖拽音频文件到此处或点击选择"
          icon={<FileAudio className="w-12 h-12 text-blue-500" />}
          formats={SUPPORTED_AUDIO_FORMATS}
        />

        {/* 字幕文件上传 */}
        <FileUploadZone
          type="subtitle"
          file={subtitleFile}
          onUpload={handleSubtitleUpload}
          title="上传字幕文件"
          description="拖拽字幕文件到此处或点击选择"
          icon={<FileText className="w-12 h-12 text-green-500" />}
          formats={SUPPORTED_SUBTITLE_FORMATS}
        />
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          使用说明
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>音频文件</strong>：支持 MP3、WAV、M4A、OGG 格式，最大 100MB</p>
          <p>• <strong>字幕文件</strong>：支持 SRT、VTT 格式，包含准确的时间戳</p>
          <p>• 确保字幕文件的时间戳与音频文件同步</p>
          <p>• 上传完成后，您可以在可视化界面中调整音频切分点</p>
          <p>• AI 将自动翻译字幕文本并生成学习卡片</p>
        </div>
      </div>

      {/* 下一步按钮 */}
      {canProceed && (
        <div className="flex justify-center">
          <button
            onClick={handleStartProcessing}
            disabled={isProcessing}
            className="btn-primary flex items-center space-x-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-5 h-5" />
            <span>{isProcessing ? '处理中...' : '开始处理文件'}</span>
          </button>
        </div>
      )}

      {/* 进度提示 */}
      {(!audioFile || !subtitleFile) && (
        <div className="text-center text-gray-500">
          <p className="text-sm">
            请上传音频和字幕文件以继续
            {audioFile && !subtitleFile && ' (还需要字幕文件)'}
            {!audioFile && subtitleFile && ' (还需要音频文件)'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioSubtitleImporter; 