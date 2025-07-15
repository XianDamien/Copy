import { type TranslatedSubtitle } from '../../background/geminiService';

export interface AudioSegment {
  id: string;
  audioBlob: Blob;
  originalText: string;
  translatedText: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface AudioSlicingResult {
  success: boolean;
  segments?: AudioSegment[];
  error?: string;
  totalSegments?: number;
}

export class AudioSlicer {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * 将音频文件和翻译字幕切分为音频片段
   */
  async sliceAudioBySubtitles(
    audioFile: File,
    translatedSubtitles: TranslatedSubtitle[],
    onProgress?: (progress: number) => void
  ): Promise<AudioSlicingResult> {
    try {
      if (!audioFile || translatedSubtitles.length === 0) {
        return {
          success: false,
          error: '缺少音频文件或字幕数据'
        };
      }

      // 解码音频文件
      const audioBuffer = await this.decodeAudioFile(audioFile);
      if (!audioBuffer) {
        return {
          success: false,
          error: '音频文件解码失败'
        };
      }

      const segments: AudioSegment[] = [];
      const totalSubtitles = translatedSubtitles.length;

      // 逐个处理字幕条目
      for (let i = 0; i < totalSubtitles; i++) {
        const subtitle = translatedSubtitles[i];
        
        try {
          const segment = await this.sliceAudioSegment(audioBuffer, subtitle);
          if (segment) {
            segments.push(segment);
          }
        } catch (error) {
          console.error(`切分字幕条目 ${subtitle.id} 失败:`, error);
          // 继续处理其他条目，不因单个失败而终止
        }

        // 更新进度
        if (onProgress) {
          const progress = Math.round(((i + 1) / totalSubtitles) * 100);
          onProgress(progress);
        }
      }

      return {
        success: true,
        segments,
        totalSegments: segments.length
      };

    } catch (error: any) {
      console.error('音频切分失败:', error);
      return {
        success: false,
        error: `音频切分失败: ${error.message || '未知错误'}`
      };
    }
  }

  /**
   * 解码音频文件为AudioBuffer
   */
  private async decodeAudioFile(audioFile: File): Promise<AudioBuffer | null> {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('音频解码失败:', error);
      return null;
    }
  }

  /**
   * 根据字幕时间戳切分单个音频片段
   */
  private async sliceAudioSegment(
    audioBuffer: AudioBuffer,
    subtitle: TranslatedSubtitle
  ): Promise<AudioSegment | null> {
    try {
      const sampleRate = audioBuffer.sampleRate;
      const channels = audioBuffer.numberOfChannels;
      
      // 转换时间戳为采样点位置（毫秒转秒）
      const startTime = subtitle.startTime / 1000;
      const endTime = subtitle.endTime / 1000;
      const duration = endTime - startTime;

      // 验证时间戳有效性
      if (startTime < 0 || endTime > audioBuffer.duration || startTime >= endTime) {
        console.warn(`字幕条目 ${subtitle.id} 时间戳无效: ${startTime}s - ${endTime}s`);
        return null;
      }

      // 计算采样点偏移量
      const startOffset = Math.round(sampleRate * startTime);
      const endOffset = Math.round(sampleRate * endTime);
      const frameCount = endOffset - startOffset;

      if (frameCount <= 0) {
        console.warn(`字幕条目 ${subtitle.id} 音频长度为零`);
        return null;
      }

      // 创建新的AudioBuffer用于存储切分后的音频
      const slicedBuffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);

      // 复制各声道的音频数据
      for (let channel = 0; channel < channels; channel++) {
        const originalChannelData = audioBuffer.getChannelData(channel);
        const slicedChannelData = slicedBuffer.getChannelData(channel);
        
        // 复制指定范围的采样点
        for (let i = 0; i < frameCount; i++) {
          const sourceIndex = startOffset + i;
          if (sourceIndex < originalChannelData.length) {
            slicedChannelData[i] = originalChannelData[sourceIndex];
          } else {
            slicedChannelData[i] = 0; // 填充静音
          }
        }
      }

      // 将AudioBuffer转换为Blob
      const audioBlob = await this.audioBufferToBlob(slicedBuffer);
      
      return {
        id: subtitle.id,
        audioBlob,
        originalText: subtitle.originalText,
        translatedText: subtitle.translatedText,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        duration: duration * 1000 // 转换回毫秒
      };

    } catch (error) {
      console.error(`切分音频片段失败 (ID: ${subtitle.id}):`, error);
      return null;
    }
  }

  /**
   * 将AudioBuffer转换为Blob
   */
  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    // 创建离线音频上下文进行渲染
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // 创建buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    // 渲染音频
    const renderedBuffer = await offlineContext.startRendering();

    // 转换为WAV格式的Blob
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  /**
   * 将AudioBuffer转换为WAV格式的Blob
   */
  private audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioBuffer.length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');

    // FMT sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numberOfChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitDepth, true); // BitsPerSample

    // Data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // 写入音频数据
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * 释放音频上下文资源
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
} 