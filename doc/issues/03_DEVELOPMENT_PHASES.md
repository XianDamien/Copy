# LanGear 开发阶段规划

**文档版本**: 2025年7月11日  
**当前状态**: Phase 2 完成，准备进入 Phase 3

## 开发阶段概览

LanGear项目采用分阶段开发方法，每个阶段都有明确的目标和可交付成果。以下是完整的开发路线图。

## ✅ Phase 1: 基础架构建设 (2024年6月-12月)

### 目标
建立稳固的技术基础和核心SRS功能

### 主要成就
- **SRS系统**: 完整的间隔重复算法实现
- **数据架构**: IndexedDB存储方案设计
- **UI框架**: React + TypeScript + Tailwind CSS
- **测试基础**: Vitest测试框架集成
- **Chrome扩展**: 基础扩展架构和权限配置

### 技术里程碑
```typescript
// 核心数据模型建立
interface Note {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: Date;
}

interface Card {
  id: string;
  noteId: string;
  cardType: 'basic' | 'reversed';
  reviewData: FSRSReviewData;
}
```

### 关键解决问题
- IndexedDB异步操作封装
- Chrome扩展多上下文环境处理
- 基础UI组件库建立

---

## ✅ Phase 2: 智能化增强 (2024年12月-2025年6月)

### 目标
集成AI服务，实现智能内容处理和任务驱动学习

### 主要成就
- **AI集成**: Gemini API智能翻译服务
- **批量导入**: AI驱动的双语文本对齐
- **任务模式**: 革命性的任务驱动学习界面
- **组件重构**: 高度模块化的React组件架构
- **技术债清理**: 解决关键性能和兼容性问题

### 技术突破
```typescript
// AI服务零依赖集成
class GeminiService {
  async translateText(text: string, targetLang: string): Promise<string> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequest(text, targetLang))
    });
    return this.parseResponse(response);
  }
}

// 任务驱动UI组件
interface TaskDrivenProps {
  card: Card;
  onTaskComplete: (result: TaskResult) => void;
  mode: 'task' | 'review';
}
```

### 关键解决问题
- **ReferenceError: window is not defined**: 替换第三方SDK为原生fetch
- **TypeScript编译错误**: 统一类型定义系统
- **测试Mock问题**: 建立ES模块兼容的mock模式
- **组件耦合**: Review.tsx组件完全重构

---

## 🚀 Phase 3: 音频增强功能 (2025年7月-9月)

### 目标
实现音频+字幕的批量制卡功能，开创全新的多媒体学习体验

### 核心功能规划

#### 3.1 音频可视化与切割
```typescript
// WaveSurfer.js集成
interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  audioBlob: Blob;
  subtitle: string;
  translation?: string;
}

class AudioProcessor {
  private wavesurfer: WaveSurfer;
  private regions: WaveSurfer.Region[];
  
  loadAudioFile(file: File): Promise<void>;
  addRegion(start: number, end: number): WaveSurfer.Region;
  extractSegment(region: WaveSurfer.Region): Promise<Blob>;
}
```

#### 3.2 字幕解析与同步
```typescript
// 字幕文件处理
interface SubtitleEntry {
  startTime: number;
  endTime: number;
  text: string;
  index: number;
}

class SubtitleParser {
  parseSRT(content: string): SubtitleEntry[];
  parseVTT(content: string): SubtitleEntry[];
  syncWithAudio(subtitles: SubtitleEntry[], audioDuration: number): SubtitleEntry[];
}
```

#### 3.3 批量AI翻译流程
```typescript
// 智能批量处理
class BatchProcessor {
  async processAudioSubtitles(
    audioFile: File,
    subtitleFile: File,
    segments: AudioSegment[]
  ): Promise<ProcessedCard[]> {
    // 1. 解析字幕文件
    const subtitles = await this.parseSubtitles(subtitleFile);
    
    // 2. 提取音频片段
    const audioSegments = await this.extractAudioSegments(audioFile, segments);
    
    // 3. 批量AI翻译
    const translations = await this.batchTranslate(
      subtitles.map(s => s.text)
    );
    
    // 4. 生成学习卡片
    return this.createCards(audioSegments, subtitles, translations);
  }
}
```

### 技术栈选择
- **音频可视化**: wavesurfer.js (Trust Score: 8.2)
- **字幕解析**: @plussub/srt-vtt-parser (TypeScript友好)
- **音频处理**: Web Audio API (原生浏览器支持)
- **存储优化**: IndexedDB Blob存储 (离线访问)

### 开发里程碑

#### 里程碑 3.1: 基础设施 (7月第1-2周)
- [ ] 扩展数据库schema支持音频存储
- [ ] 实现文件上传和验证系统
- [ ] 集成wavesurfer.js音频播放器

#### 里程碑 3.2: 字幕处理 (7月第3-4周)
- [ ] 集成字幕解析库
- [ ] 实现音频-字幕时间轴同步
- [ ] 建立字幕显示和编辑界面

#### 里程碑 3.3: 可视化切割 (8月第1-2周)
- [ ] 实现音频波形可视化
- [ ] 添加拖拽式区域选择功能
- [ ] 实现实时音频片段预览

#### 里程碑 3.4: AI翻译集成 (8月第3-4周)
- [ ] 扩展Gemini API支持批量翻译
- [ ] 实现翻译质量验证机制
- [ ] 添加翻译编辑和优化功能

#### 里程碑 3.5: 用户体验优化 (9月第1-2周)
- [ ] 添加进度指示器和状态反馈
- [ ] 实现错误处理和恢复机制
- [ ] 优化大文件处理性能

---

## 🔮 Phase 4: 高级学习功能 (2025年9月-12月)

### 目标
基于音频功能，开发新一代学习模式

### 规划功能

#### 4.1 句子复述卡片
- 音频播放 → 用户复述 → STT识别 → 差异对比
- 语音评分和发音分析
- 个性化发音改进建议

#### 4.2 语音交互学习
- Web Speech API集成
- 实时语音识别和反馈
- 语音命令控制学习流程

#### 4.3 智能学习分析
- 学习行为数据挖掘
- 个性化学习路径推荐
- 弱点识别和针对性练习

---

## 🌟 Phase 5: 生态系统扩展 (2026年)

### 长期愿景
- **多平台支持**: 移动端APP开发
- **云端同步**: 跨设备数据同步
- **社区功能**: 内容分享和协作学习
- **企业版本**: 团队学习管理功能

---

## 开发方法论

### 迭代开发原则
1. **用户反馈驱动**: 每个功能都基于真实用户需求
2. **技术债管理**: 及时清理技术债务，保持代码质量
3. **测试优先**: 新功能开发前建立测试框架
4. **渐进式发布**: 使用Feature Flag控制功能发布

### 质量保证
- **代码审查**: 每个PR都需要完整的代码审查
- **自动化测试**: 单元测试 + 集成测试 + E2E测试
- **性能监控**: 关键指标持续监控
- **用户体验测试**: 真实场景下的可用性测试

### 风险管理
- **技术风险**: 新技术引入前的充分调研和原型验证
- **兼容性风险**: 多浏览器和扩展环境测试
- **性能风险**: 大数据量场景下的性能测试
- **用户体验风险**: 渐进式功能发布和A/B测试

---

**总结**: LanGear的分阶段开发策略确保了项目的稳定发展和技术创新。每个阶段都建立在前一阶段的成果之上，形成了强大的技术积累和产品优势。

**下次更新**: Phase 3 完成后进行全面回顾和Phase 4详细规划 