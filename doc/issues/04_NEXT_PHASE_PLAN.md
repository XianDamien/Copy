# LanGear Phase 3: 音频+字幕批量制卡技术实现计划

**文档版本**: 2025年7月11日  
**实施周期**: 2025年7月-9月 (共12周)  
**项目代号**: AudioCard Creator

## 项目概述

Phase 3 将为LanGear引入革命性的音频+字幕批量制卡功能。用户可以上传音频文件和对应的字幕文件，通过直观的可视化界面手动分割音频，AI自动翻译生成高质量的学习卡片。

## 核心技术架构

### 技术栈选型

#### 前端音频处理
```typescript
// 选定方案: wavesurfer.js + Regions plugin
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';

interface AudioVisualizerConfig {
  container: HTMLElement;
  waveColor: string;
  progressColor: string;
  height: number;
  plugins: [RegionsPlugin];
}
```

#### 字幕解析库
```typescript
// 选定方案: @plussub/srt-vtt-parser
import { parseSrt, parseVtt } from '@plussub/srt-vtt-parser';

interface SubtitleEntry {
  id: string;
  startTime: number; // 毫秒
  endTime: number;   // 毫秒
  text: string;
  originalIndex: number;
}
```

#### 音频处理API
```typescript
// Web Audio API 原生支持
interface AudioSegmentProcessor {
  loadAudioBuffer(file: File): Promise<AudioBuffer>;
  extractSegment(buffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer;
  bufferToBlob(buffer: AudioBuffer): Promise<Blob>;
}
```

## 详细实现计划

### 阶段 1: 基础设施搭建 (第1-2周)

#### 1.1 数据库Schema扩展
```sql
-- 新增音频存储表
CREATE TABLE IF NOT EXISTS audioSegments (
  id TEXT PRIMARY KEY,
  cardId TEXT NOT NULL,
  audioBlob BLOB NOT NULL,
  startTime REAL NOT NULL,
  endTime REAL NOT NULL,
  duration REAL NOT NULL,
  originalFileName TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (cardId) REFERENCES cards(id)
);

-- 扩展卡片类型
ALTER TABLE cards ADD COLUMN cardType TEXT DEFAULT 'basic';
-- 支持: 'basic', 'task', 'audio', 'sentence_paraphrase'
```

#### 1.2 文件上传系统
```typescript
// 文件类型验证和大小限制
interface FileUploadConfig {
  audioFormats: ['.mp3', '.wav', '.m4a', '.ogg'];
  subtitleFormats: ['.srt', '.vtt'];
  maxAudioSize: 100 * 1024 * 1024; // 100MB
  maxSubtitleSize: 10 * 1024 * 1024; // 10MB
}

class FileUploadManager {
  validateAudioFile(file: File): Promise<ValidationResult>;
  validateSubtitleFile(file: File): Promise<ValidationResult>;
  previewFile(file: File): Promise<FilePreview>;
}
```

#### 1.3 基础UI组件
```tsx
// 音频上传页面框架
const AudioImportPage: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('upload');
  
  return (
    <div className="audio-import-container">
      <FileUploadZone onAudioUpload={setAudioFile} onSubtitleUpload={setSubtitleFile} />
      <ProcessingProgress stage={processingStage} />
      <AudioWorkspace audioFile={audioFile} subtitleFile={subtitleFile} />
    </div>
  );
};
```

### 阶段 2: 字幕解析与同步 (第3-4周)

#### 2.1 字幕解析引擎
```typescript
class SubtitleProcessor {
  async parseFile(file: File): Promise<SubtitleEntry[]> {
    const content = await this.readFileContent(file);
    const extension = this.getFileExtension(file.name);
    
    switch (extension) {
      case '.srt':
        return this.parseSRT(content);
      case '.vtt':
        return this.parseVTT(content);
      default:
        throw new Error(`Unsupported subtitle format: ${extension}`);
    }
  }
  
  private parseSRT(content: string): SubtitleEntry[] {
    const parsed = parseSrt(content);
    return parsed.map((entry, index) => ({
      id: `srt-${index}`,
      startTime: entry.from,
      endTime: entry.to,
      text: entry.text,
      originalIndex: index
    }));
  }
}
```

#### 2.2 音频-字幕时间轴同步
```typescript
interface TimelineSync {
  audioFile: File;
  subtitles: SubtitleEntry[];
  audioDuration: number;
}

class TimelineSynchronizer {
  async validateSync(sync: TimelineSync): Promise<SyncValidationResult> {
    // 检查字幕时间是否超出音频长度
    const invalidEntries = sync.subtitles.filter(
      entry => entry.endTime > sync.audioDuration * 1000
    );
    
    return {
      isValid: invalidEntries.length === 0,
      invalidEntries,
      recommendations: this.generateSyncRecommendations(invalidEntries)
    };
  }
  
  autoCorrectTimeline(sync: TimelineSync): SubtitleEntry[] {
    // 自动修正超出范围的时间戳
    return sync.subtitles.map(entry => ({
      ...entry,
      endTime: Math.min(entry.endTime, sync.audioDuration * 1000)
    }));
  }
}
```

#### 2.3 字幕显示组件
```tsx
interface SubtitleDisplayProps {
  subtitles: SubtitleEntry[];
  currentTime: number;
  onSubtitleClick: (subtitle: SubtitleEntry) => void;
  selectedSubtitles: string[];
}

const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({
  subtitles, currentTime, onSubtitleClick, selectedSubtitles
}) => {
  return (
    <div className="subtitle-container">
      {subtitles.map(subtitle => (
        <SubtitleItem
          key={subtitle.id}
          subtitle={subtitle}
          isActive={currentTime >= subtitle.startTime && currentTime <= subtitle.endTime}
          isSelected={selectedSubtitles.includes(subtitle.id)}
          onClick={() => onSubtitleClick(subtitle)}
        />
      ))}
    </div>
  );
};
```

### 阶段 3: 音频可视化与切割 (第5-6周)

#### 3.1 WaveSurfer.js集成
```typescript
class AudioVisualizer {
  private wavesurfer: WaveSurfer;
  private regionsPlugin: RegionsPlugin;
  
  async initialize(container: HTMLElement): Promise<void> {
    this.regionsPlugin = RegionsPlugin.create({
      regions: [],
      dragSelection: {
        slop: 5
      }
    });
    
    this.wavesurfer = WaveSurfer.create({
      container,
      waveColor: '#4A90E2',
      progressColor: '#2E5BBA',
      cursorColor: '#FF6B6B',
      height: 128,
      normalize: true,
      plugins: [this.regionsPlugin]
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.regionsPlugin.on('region-created', (region) => {
      this.onRegionCreated(region);
    });
    
    this.regionsPlugin.on('region-updated', (region) => {
      this.onRegionUpdated(region);
    });
  }
}
```

#### 3.2 区域选择与管理
```typescript
interface AudioRegion {
  id: string;
  start: number;
  end: number;
  subtitle?: SubtitleEntry;
  color: string;
  label: string;
}

class RegionManager {
  private regions: Map<string, AudioRegion> = new Map();
  
  createRegion(start: number, end: number, subtitle?: SubtitleEntry): AudioRegion {
    const region: AudioRegion = {
      id: this.generateId(),
      start,
      end,
      subtitle,
      color: this.getRandomColor(),
      label: subtitle?.text || `Segment ${this.regions.size + 1}`
    };
    
    this.regions.set(region.id, region);
    return region;
  }
  
  linkRegionToSubtitle(regionId: string, subtitle: SubtitleEntry): void {
    const region = this.regions.get(regionId);
    if (region) {
      region.subtitle = subtitle;
      region.label = subtitle.text;
    }
  }
  
  getRegionsInTimeRange(start: number, end: number): AudioRegion[] {
    return Array.from(this.regions.values()).filter(
      region => region.start >= start && region.end <= end
    );
  }
}
```

#### 3.3 音频分割引擎
```typescript
class AudioSegmentExtractor {
  private audioContext: AudioContext;
  
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  async extractSegment(
    audioBuffer: AudioBuffer, 
    startTime: number, 
    endTime: number
  ): Promise<AudioBuffer> {
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const segmentLength = endSample - startSample;
    
    const segmentBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const segmentData = segmentBuffer.getChannelData(channel);
      
      for (let i = 0; i < segmentLength; i++) {
        segmentData[i] = channelData[startSample + i];
      }
    }
    
    return segmentBuffer;
  }
  
  async bufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    return this.encodeToWAV(renderedBuffer);
  }
}
```

### 阶段 4: AI翻译集成 (第7-8周)

#### 4.1 批量翻译服务
```typescript
interface BatchTranslationRequest {
  texts: string[];
  sourceLang: string;
  targetLang: string;
  context?: string;
}

class GeminiBatchTranslator extends GeminiService {
  async translateBatch(request: BatchTranslationRequest): Promise<string[]> {
    // 分批处理，避免API限制
    const batchSize = 10;
    const batches = this.chunkArray(request.texts, batchSize);
    const results: string[] = [];
    
    for (const batch of batches) {
      const batchPrompt = this.buildBatchPrompt(batch, request);
      const response = await this.callGeminiAPI(batchPrompt);
      const translations = this.parseBatchResponse(response);
      results.push(...translations);
      
      // 添加延迟避免API限流
      await this.delay(1000);
    }
    
    return results;
  }
  
  private buildBatchPrompt(texts: string[], request: BatchTranslationRequest): string {
    return `
请将以下${request.sourceLang}文本翻译成${request.targetLang}，保持原意的同时确保翻译自然流畅。
${request.context ? `上下文：${request.context}` : ''}

请按照以下格式返回翻译结果：
1. [第一句翻译]
2. [第二句翻译]
...

原文：
${texts.map((text, index) => `${index + 1}. ${text}`).join('\n')}
`;
  }
}
```

#### 4.2 翻译质量验证
```typescript
interface TranslationQuality {
  confidence: number; // 0-1
  issues: QualityIssue[];
  suggestions: string[];
}

class TranslationValidator {
  async validateTranslation(
    original: string, 
    translation: string
  ): Promise<TranslationQuality> {
    const issues: QualityIssue[] = [];
    
    // 长度检查
    if (this.isLengthAnomalous(original, translation)) {
      issues.push({
        type: 'length_anomaly',
        severity: 'warning',
        description: '翻译长度与原文差异较大'
      });
    }
    
    // 专有名词检查
    const missingTerms = this.findMissingProperNouns(original, translation);
    if (missingTerms.length > 0) {
      issues.push({
        type: 'missing_terms',
        severity: 'error',
        description: `可能遗漏专有名词: ${missingTerms.join(', ')}`
      });
    }
    
    return {
      confidence: this.calculateConfidence(issues),
      issues,
      suggestions: this.generateSuggestions(issues)
    };
  }
}
```

#### 4.3 卡片生成流程
```typescript
interface AudioCardGenerationRequest {
  audioSegments: AudioSegment[];
  translations: string[];
  deckId: string;
  metadata: AudioCardMetadata;
}

class AudioCardGenerator {
  async generateCards(request: AudioCardGenerationRequest): Promise<Card[]> {
    const cards: Card[] = [];
    
    for (let i = 0; i < request.audioSegments.length; i++) {
      const segment = request.audioSegments[i];
      const translation = request.translations[i];
      
      // 存储音频片段到IndexedDB
      const audioId = await this.storeAudioSegment(segment);
      
      // 创建卡片
      const card = await this.createAudioCard({
        front: segment.subtitle,
        back: translation,
        audioId,
        deckId: request.deckId,
        metadata: {
          ...request.metadata,
          segmentInfo: {
            startTime: segment.startTime,
            endTime: segment.endTime,
            duration: segment.endTime - segment.startTime
          }
        }
      });
      
      cards.push(card);
    }
    
    return cards;
  }
  
  private async storeAudioSegment(segment: AudioSegment): Promise<string> {
    const audioId = this.generateId();
    
    await this.dbManager.withTransaction(['audioSegments'], 'readwrite', async (stores) => {
      await stores.audioSegments.add({
        id: audioId,
        cardId: '', // 将在卡片创建后更新
        audioBlob: segment.audioBlob,
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: segment.endTime - segment.startTime,
        originalFileName: segment.originalFileName,
        createdAt: Date.now()
      });
    });
    
    return audioId;
  }
}
```

### 阶段 5: 用户体验优化 (第9-10周)

#### 5.1 进度指示器系统
```tsx
interface ProcessingStage {
  id: string;
  name: string;
  progress: number; // 0-100
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
}

const ProcessingProgress: React.FC<{ stages: ProcessingStage[] }> = ({ stages }) => {
  return (
    <div className="processing-progress">
      {stages.map(stage => (
        <div key={stage.id} className={`stage stage-${stage.status}`}>
          <div className="stage-header">
            <span className="stage-name">{stage.name}</span>
            <span className="stage-percentage">{stage.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stage.progress}%` }}
            />
          </div>
          {stage.message && (
            <div className="stage-message">{stage.message}</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### 5.2 错误处理与恢复
```typescript
class AudioProcessingErrorHandler {
  async handleError(error: ProcessingError, context: ProcessingContext): Promise<RecoveryAction> {
    switch (error.type) {
      case 'file_corrupted':
        return {
          type: 'user_action_required',
          message: '音频文件可能已损坏，请尝试重新上传',
          actions: ['retry_upload', 'choose_different_file']
        };
        
      case 'api_rate_limit':
        return {
          type: 'automatic_retry',
          message: 'API请求过于频繁，将在30秒后自动重试',
          retryAfter: 30000
        };
        
      case 'insufficient_memory':
        return {
          type: 'user_action_required',
          message: '音频文件过大，建议分段处理',
          actions: ['split_file', 'reduce_quality']
        };
        
      default:
        return {
          type: 'manual_intervention',
          message: '处理过程中遇到未知错误，请联系技术支持',
          errorCode: error.code
        };
    }
  }
}
```

### 阶段 6: 性能优化与测试 (第11-12周)

#### 6.1 大文件处理优化
```typescript
class OptimizedAudioProcessor {
  async processLargeFile(file: File): Promise<ProcessedAudio> {
    // 使用Web Workers进行后台处理
    const worker = new Worker('/workers/audio-processor.js');
    
    return new Promise((resolve, reject) => {
      worker.postMessage({
        type: 'process_audio',
        audioFile: file,
        options: {
          chunkSize: 1024 * 1024, // 1MB chunks
          quality: 'medium'
        }
      });
      
      worker.onmessage = (event) => {
        if (event.data.type === 'progress') {
          this.updateProgress(event.data.progress);
        } else if (event.data.type === 'completed') {
          resolve(event.data.result);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      };
    });
  }
}
```

#### 6.2 测试策略
```typescript
// 端到端测试覆盖
describe('Audio Import Workflow', () => {
  test('完整音频+字幕处理流程', async () => {
    // 1. 文件上传
    await uploadFiles(mockAudioFile, mockSubtitleFile);
    
    // 2. 字幕解析
    const subtitles = await parseSubtitles();
    expect(subtitles).toHaveLength(10);
    
    // 3. 音频可视化
    await initializeAudioVisualizer();
    
    // 4. 区域选择
    const regions = await createRegionsFromSubtitles(subtitles);
    expect(regions).toHaveLength(10);
    
    // 5. AI翻译
    const translations = await translateBatch(subtitles.map(s => s.text));
    expect(translations).toHaveLength(10);
    
    // 6. 卡片生成
    const cards = await generateAudioCards(regions, translations);
    expect(cards).toHaveLength(10);
    
    // 7. 数据库存储验证
    const storedCards = await getCardsFromDB();
    expect(storedCards).toHaveLength(10);
  });
});
```

## 技术风险评估

### 高风险项目
1. **浏览器音频处理限制**: 大文件可能导致内存溢出
   - **缓解策略**: 分段处理 + Web Workers
   
2. **API配额限制**: Gemini API调用频率限制
   - **缓解策略**: 智能批处理 + 重试机制

3. **跨浏览器兼容性**: Web Audio API在不同浏览器的差异
   - **缓解策略**: Polyfill + 降级方案

### 中风险项目
1. **字幕格式多样性**: 不同字幕格式的解析差异
   - **缓解策略**: 多格式测试 + 标准化处理

2. **音频格式兼容性**: 不同音频编码格式支持
   - **缓解策略**: 格式检测 + 转换工具

## 成功指标

### 技术指标
- [ ] 支持主流音频格式 (MP3, WAV, M4A, OGG)
- [ ] 支持字幕格式 (SRT, VTT)
- [ ] 处理100MB音频文件不超过30秒
- [ ] AI翻译准确率达到85%以上
- [ ] 内存使用不超过500MB

### 用户体验指标
- [ ] 文件上传成功率 > 99%
- [ ] 处理流程完成率 > 95%
- [ ] 用户操作响应时间 < 200ms
- [ ] 错误恢复成功率 > 90%

### 业务指标
- [ ] 功能采用率 > 60%
- [ ] 用户满意度 > 4.5/5
- [ ] 技术支持请求 < 5%

---

**总结**: Phase 3 音频功能将为LanGear带来质的飞跃，从文本学习扩展到多媒体学习。通过精心设计的技术架构和实施计划，我们将构建一个强大、易用、高性能的音频学习系统。

**下次更新**: 实施过程中根据实际情况调整计划 