/**
 * 字幕解析工具
 * 支持SRT和VTT格式的字幕文件解析
 */

import { parse } from '@plussub/srt-vtt-parser';

export interface SubtitleEntry {
  id: string;
  text: string;
  startTime: number; // 毫秒
  endTime: number;   // 毫秒
  originalIndex: number;
}

export interface SubtitleParseResult {
  entries: SubtitleEntry[];
  totalEntries: number;
  duration: number; // 总时长(毫秒)
  format: 'srt' | 'vtt' | 'unknown';
}

/**
 * 检测字幕文件格式
 */
function detectSubtitleFormat(content: string): 'srt' | 'vtt' | 'unknown' {
  const trimmedContent = content.trim();
  
  // VTT格式检测
  if (trimmedContent.startsWith('WEBVTT')) {
    return 'vtt';
  }
  
  // SRT格式检测 - 查找典型的SRT时间戳模式
  const srtPattern = /\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/;
  if (srtPattern.test(content)) {
    return 'srt';
  }
  
  // VTT格式也可能没有WEBVTT头，通过时间戳格式检测
  const vttPattern = /\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/;
  if (vttPattern.test(content)) {
    return 'vtt';
  }
  
  return 'unknown';
}

/**
 * 清理字幕文本，移除HTML标签但保留换行
 */
function cleanSubtitleText(text: string): string {
  return text
    // 移除HTML标签但保留内容
    .replace(/<[^>]*>/g, '')
    // 清理多余的空白字符，但保留换行
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 验证时间戳的合理性
 */
function validateTimestamp(startTime: number, endTime: number): boolean {
  return (
    startTime >= 0 &&
    endTime > startTime &&
    endTime - startTime >= 100 && // 最短100毫秒
    endTime - startTime <= 60000   // 最长60秒
  );
}

/**
 * 解析字幕文件内容
 */
export function parseSubtitle(content: string): SubtitleParseResult {
  if (!content || !content.trim()) {
    throw new Error('字幕文件内容为空');
  }

  const format = detectSubtitleFormat(content);
  
  if (format === 'unknown') {
    throw new Error('不支持的字幕格式。请使用SRT或VTT格式的字幕文件。');
  }

  try {
    // 使用@plussub/srt-vtt-parser解析
    const parseResult = parse(content);
    
    if (!parseResult.entries || parseResult.entries.length === 0) {
      throw new Error('字幕文件中没有找到有效的字幕条目');
    }

    // 转换为标准格式并验证
    const entries: SubtitleEntry[] = [];
    let maxEndTime = 0;

    parseResult.entries.forEach((entry, index) => {
      // 验证时间戳
      if (!validateTimestamp(entry.from, entry.to)) {
        console.warn(`字幕条目 ${index + 1} 的时间戳无效，已跳过`, {
          from: entry.from,
          to: entry.to,
          text: entry.text
        });
        return;
      }

      // 清理并验证文本
      const cleanedText = cleanSubtitleText(entry.text);
      if (!cleanedText) {
        console.warn(`字幕条目 ${index + 1} 的文本为空，已跳过`);
        return;
      }

      entries.push({
        id: entry.id || String(index + 1),
        text: cleanedText,
        startTime: entry.from,
        endTime: entry.to,
        originalIndex: index
      });

      maxEndTime = Math.max(maxEndTime, entry.to);
    });

    if (entries.length === 0) {
      throw new Error('没有找到有效的字幕条目');
    }

    // 按时间排序
    entries.sort((a, b) => a.startTime - b.startTime);

    return {
      entries,
      totalEntries: entries.length,
      duration: maxEndTime,
      format
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`字幕解析失败: ${error.message}`);
    }
    throw new Error('字幕解析失败: 未知错误');
  }
}

/**
 * 验证字幕与音频的时长匹配
 */
export function validateSubtitleAudioSync(
  subtitleDuration: number,
  audioDuration: number,
  toleranceMs: number = 5000
): { isValid: boolean; message: string } {
  const diff = Math.abs(subtitleDuration - audioDuration);
  
  if (diff <= toleranceMs) {
    return {
      isValid: true,
      message: '字幕与音频时长匹配'
    };
  }
  
  return {
    isValid: false,
    message: `字幕时长(${Math.round(subtitleDuration/1000)}秒)与音频时长(${Math.round(audioDuration/1000)}秒)差异过大`
  };
}

/**
 * 获取字幕统计信息
 */
export function getSubtitleStats(entries: SubtitleEntry[]): {
  totalEntries: number;
  totalDuration: number;
  averageEntryDuration: number;
  shortestEntry: number;
  longestEntry: number;
  totalTextLength: number;
} {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalDuration: 0,
      averageEntryDuration: 0,
      shortestEntry: 0,
      longestEntry: 0,
      totalTextLength: 0
    };
  }

  const durations = entries.map(entry => entry.endTime - entry.startTime);
  const totalDuration = Math.max(...entries.map(entry => entry.endTime));
  const totalTextLength = entries.reduce((sum, entry) => sum + entry.text.length, 0);

  return {
    totalEntries: entries.length,
    totalDuration,
    averageEntryDuration: durations.reduce((sum, dur) => sum + dur, 0) / durations.length,
    shortestEntry: Math.min(...durations),
    longestEntry: Math.max(...durations),
    totalTextLength
  };
} 