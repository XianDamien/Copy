import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Loader2 } from 'lucide-react';
import { ApiClient } from '../../../shared/utils/api';
import type { AudioStore } from '../../../shared/types';

export interface AudioPlayerProps {
  audioId: string;
  className?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: string) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioId,
  className = '',
  autoPlay = false,
  showControls = true,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const apiClient = new ApiClient();

  // 加载音频数据
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      if (!audioId) return;

      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      try {
        const audioStore: AudioStore | undefined = await apiClient.getAudioClip(audioId);
        
        if (!mounted) return;
        
        if (!audioStore) {
          throw new Error('音频文件未找到');
        }

        // 创建Blob URL
        objectUrl = URL.createObjectURL(audioStore.audioData);
        setAudioUrl(objectUrl);
        
        if (autoPlay && audioRef.current) {
          // 延迟一点时间确保音频加载完成
          setTimeout(() => {
            if (mounted && audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Failed to load audio:', err);
        const errorMessage = err instanceof Error ? err.message : '音频加载失败';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        if (mounted) {
          setIsLoading(false);
          onLoadEnd?.();
        }
      }
    };

    loadAudio();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioId, autoPlay, onLoadStart, onLoadEnd, onError, apiClient]);

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      const errorMessage = '音频播放出错';
      setError(errorMessage);
      setIsPlaying(false);
      onError?.(errorMessage);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onError]);

  // 播放/暂停控制
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  // 重新播放
  const restart = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.currentTime = 0;
    audio.play().catch(console.error);
  };

  // 静音切换
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  // 音量调节
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        audio.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
    }
  };

  // 进度条拖拽
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 格式化时间显示
  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <VolumeX className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 p-2 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
        <span className="text-sm text-gray-600">加载音频中...</span>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
              <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          muted={isMuted}
        />
      
      {showControls && (
        <div className="space-y-3">
          {/* 主控制按钮 */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={restart}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="重新播放"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-gray-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* 进度条 */}
          <div className="space-y-1">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3 h-3 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer; 