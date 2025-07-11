import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import type { SubtitleEntry } from '../../../shared/utils/subtitleParser';

interface AudioVisualizerProps {
  audioFile: File;
  subtitleEntries?: SubtitleEntry[];
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (time: number) => void;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioFile,
  subtitleEntries = [],
  onTimeUpdate,
  onSeek,
  height = 128
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 生成区域颜色
  const generateRegionColor = useCallback((index: number): string => {
    const colors = [
      'rgba(255, 99, 132, 0.3)',   // 红色
      'rgba(54, 162, 235, 0.3)',   // 蓝色  
      'rgba(255, 205, 86, 0.3)',   // 黄色
      'rgba(75, 192, 192, 0.3)',   // 绿色
      'rgba(153, 102, 255, 0.3)',  // 紫色
      'rgba(255, 159, 64, 0.3)',   // 橙色
    ];
    return colors[index % colors.length];
  }, []);

  // 创建字幕区域
  const createSubtitleRegions = useCallback(() => {
    if (!regionsPluginRef.current || !subtitleEntries.length) return;

    // 清除现有区域
    regionsPluginRef.current.clearRegions();

    // 为每个字幕条目创建区域
    subtitleEntries.forEach((entry, index) => {
      try {
        const region = regionsPluginRef.current.addRegion({
          id: `subtitle-${entry.id}`,
          start: entry.startTime / 1000, // 转换为秒
          end: entry.endTime / 1000,
          content: entry.text.length > 50 ? entry.text.substring(0, 50) + '...' : entry.text,
          color: generateRegionColor(index),
          drag: true,
          resize: true
        });

        // 区域点击事件
        region.on('click', () => {
          if (onSeek) {
            onSeek(entry.startTime);
          }
        });

        // 区域更新事件
        region.on('update-end', () => {
          // TODO: 后续可以实现区域编辑功能
          console.log('Region updated:', {
            id: region.id,
            start: region.start,
            end: region.end
          });
        });

      } catch (error) {
        console.warn(`Failed to create region for subtitle entry ${entry.id}:`, error);
      }
    });
  }, [subtitleEntries, generateRegionColor, onSeek]);

  // 初始化WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    const initWaveSurfer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 创建WaveSurfer实例
        const waveSurfer = WaveSurfer.create({
          container: containerRef.current!,
          waveColor: '#4F4A85',
          progressColor: '#383351',
          cursorColor: '#FF6B6B',
          barWidth: 2,
          barGap: 1,
          height: height,
          normalize: true,
          backend: 'WebAudio'
        });

        // 注册Regions插件
        const regionsPlugin = waveSurfer.registerPlugin(RegionsPlugin.create());

        waveSurferRef.current = waveSurfer;
        regionsPluginRef.current = regionsPlugin;

        // 事件监听
        waveSurfer.on('ready', () => {
          setIsLoading(false);
          setDuration(waveSurfer.getDuration());
          createSubtitleRegions();
        });

        waveSurfer.on('timeupdate', (time: number) => {
          setCurrentTime(time);
          if (onTimeUpdate) {
            onTimeUpdate(time * 1000); // 转换为毫秒
          }
        });

        waveSurfer.on('play', () => setIsPlaying(true));
        waveSurfer.on('pause', () => setIsPlaying(false));

        waveSurfer.on('error', (error: any) => {
          console.error('WaveSurfer error:', error);
          setError('音频加载失败');
          setIsLoading(false);
        });

        // 加载音频文件
        const audioUrl = URL.createObjectURL(audioFile);
        await waveSurfer.load(audioUrl);

      } catch (error) {
        console.error('Failed to initialize WaveSurfer:', error);
        setError('音频可视化初始化失败');
        setIsLoading(false);
      }
    };

    initWaveSurfer();

    // 清理函数
    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
        regionsPluginRef.current = null;
      }
    };
  }, [audioFile, height, onTimeUpdate, createSubtitleRegions]);

  // 更新字幕区域
  useEffect(() => {
    if (waveSurferRef.current && !isLoading) {
      createSubtitleRegions();
    }
  }, [subtitleEntries, createSubtitleRegions, isLoading]);

  // 播放控制
  const handlePlayPause = useCallback(() => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
    }
  }, []);

  const handleSkipBackward = useCallback(() => {
    if (waveSurferRef.current) {
      const newTime = Math.max(0, currentTime - 10);
      waveSurferRef.current.seekTo(newTime / duration);
    }
  }, [currentTime, duration]);

  const handleSkipForward = useCallback(() => {
    if (waveSurferRef.current) {
      const newTime = Math.min(duration, currentTime + 10);
      waveSurferRef.current.seekTo(newTime / duration);
    }
  }, [currentTime, duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (waveSurferRef.current) {
      waveSurferRef.current.setVolume(newVolume);
    }
  }, []);

  // 外部跳转处理
  useEffect(() => {
    if (onSeek && waveSurferRef.current && duration > 0) {
      // 这里暂时不处理外部跳转，避免循环调用
      // 实际实现中可以通过ref暴露seekTo方法
    }
  }, [onSeek, duration]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <Volume2 className="w-5 h-5" />
          <span className="font-medium">音频加载错误</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 波形容器 */}
      <div className="relative">
        <div ref={containerRef} className="w-full" />
        
        {/* 加载遮罩 */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-50 bg-opacity-90 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span>加载音频中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          {/* 播放控制 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkipBackward}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="后退10秒"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={handleSkipForward}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="前进10秒"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* 时间信息 */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            {/* 音量控制 */}
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 字幕区域统计 */}
        {subtitleEntries.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            显示 {subtitleEntries.length} 个字幕区域 • 点击区域可跳转播放 • 拖拽边缘可调整时间
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioVisualizer; 