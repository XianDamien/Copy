import React, { useState, useCallback } from 'react';
import { FileAudio, FileText, AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseSubtitle, type SubtitleEntry } from '../../../shared/utils/subtitleParser';
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
  const [audioFile, setAudioFile] = useState<UploadedFile | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState<'audio' | 'subtitle' | null>(null);
  
  // 字幕解析状态
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // 处理阶段：upload -> processing -> preview
  const [stage, setStage] = useState<'upload' | 'processing' | 'preview'>('upload');

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
                  onClick={() => {
                    // TODO: 进入AI翻译阶段
                    toast.success('即将进入AI翻译阶段...');
                  }}
                  className="btn-primary w-full"
                >
                  开始AI翻译
                </button>
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