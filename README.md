# LanGear Language Learning Extension

<div align="center">

![LanGear Logo](https://via.placeholder.com/200x200/2D3748/F7FAFC?text=LanGear)

**🔧 工业级智能语言学习Chrome扩展**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

</div>

## 🎯 项目概述

LanGear是一个高效的Chrome扩展，采用工业风设计理念，为语言学习者提供智能化的记忆训练体验。基于科学的FSRS(Free Spaced Repetition Scheduler)算法，实现精准的复习调度，最大化学习效率。

### ✨ 核心特性

- 🧠 **FSRS智能算法** - 科学的间隔重复调度，优化记忆效果
- 🎴 **多样化卡片模板** - 汉译英、回译、句子复述等专业模板
- 📊 **数据可视化** - 学习热力图、遗忘曲线、进度统计
- 🎨 **工业风UI设计** - 简洁高效的用户界面
- 💾 **本地优先存储** - 基于IndexedDB的离线数据管理
- 🔄 **Anki格式支持** - 兼容现有学习资源（后期实现）
- 🎙️ **智能音频处理** - 录音回放、音频分段、语音转文字

## 🛠️ 技术栈

### 前端框架
- **React 18** + **TypeScript** - 现代化前端开发
- **Tailwind CSS** - 原子化CSS框架，支持工业风设计
- **Zustand** - 轻量级状态管理

### 构建工具
- **Vite** - 快速构建工具
- **@samrum/vite-plugin-web-extension** - Chrome扩展专用构建插件

### 核心算法
- **ts-fsrs** - TypeScript实现的FSRS算法库
- **Chart.js** + **react-chartjs-2** - 数据可视化

### 数据存储
- **IndexedDB** + **idb** - 本地数据库存储
- **Chrome Storage API** - 扩展配置存储

### Chrome扩展API
- **Manifest V3** - 最新扩展规范
- **Service Worker** - 后台脚本处理
- **Content Scripts** - 页面内容交互

## 📁 项目结构

```
LanGear-Language-Extension/
├── public/
│   ├── manifest.json           # Chrome扩展配置
│   ├── popup.html              # 弹窗页面
│   ├── options.html            # 设置页面
│   ├── main.html               # 主应用页面
│   └── icons/                  # 扩展图标
├── src/
│   ├── background/             # Service Worker
│   │   ├── index.ts           # 后台脚本入口
│   │   ├── db.ts              # IndexedDB操作
│   │   ├── fsrsService.ts     # FSRS算法服务
│   │   └── types.ts           # 类型定义
│   ├── content/                # Content Scripts
│   │   ├── index.tsx          # 内容脚本入口
│   │   └── ContentUI.tsx      # 划词助手UI
│   ├── popup/                  # 弹窗应用
│   │   ├── index.tsx          # 弹窗入口
│   │   └── PopupApp.tsx       # 弹窗组件
│   ├── options/                # 设置应用
│   │   ├── index.tsx          # 设置入口
│   │   └── OptionsApp.tsx     # 设置组件
│   ├── main/                   # 主应用(SPA)
│   │   ├── index.tsx          # 主应用入口
│   │   ├── MainApp.tsx        # 主应用组件
│   │   ├── components/        # 共享组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── DeckList.tsx   # 牌组列表
│   │   │   ├── Review.tsx     # 复习界面
│   │   │   ├── Stats.tsx      # 数据统计
│   │   │   └── NoteEditor.tsx # 笔记编辑
│   │   └── routes.tsx         # 路由配置
│   ├── shared/                 # 共享资源
│   │   ├── types.ts           # 全局类型
│   │   ├── constants.ts       # 常量定义
│   │   └── utils.ts           # 工具函数
│   └── assets/                 # 静态资源
│       ├── styles/            # 样式文件
│       └── images/            # 图片资源
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置
├── tailwind.config.js          # Tailwind配置
├── package.json                # 项目配置
└── README.md                   # 项目文档
```

## 🗄️ 数据库设计

### IndexedDB 存储架构

```typescript
// 牌组表
interface Deck {
  id: number;
  name: string;
  fsrsConfig?: FSRSConfig;
  createdAt: Date;
  updatedAt: Date;
}

// 笔记表
interface Note {
  id: number;
  deckId: number;
  noteType: 'CtoE' | 'Retranslate' | 'SentenceParaphrase' | 'Article';
  fields: Record<string, any>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 卡片表
interface Card {
  id: number;
  noteId: number;
  cardTemplate: string;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview?: Date;
}

// 复习日志表
interface ReviewLog {
  id: number;
  cardId: number;
  reviewTime: Date;
  rating: 1 | 2 | 3 | 4; // Again | Hard | Good | Easy
  stateBefore: string;
  stateAfter: string;
  stabilityBefore: number;
  stabilityAfter: number;
  difficultyBefore: number;
  difficultyAfter: number;
  interval: number;
  lastInterval: number;
}

// 音频存储表
interface AudioStore {
  id: string;
  audioData: Blob;
  mimeType: string;
  createdAt: Date;
}
```

## 🚀 开发计划

### Phase 1: 核心基础架构 (4-6周)

#### 优先级：🔥 高优先级

1. **项目初始化与环境配置**
   - [x] 项目结构搭建
   - [ ] Vite + Chrome Extension 配置
   - [ ] TypeScript + Tailwind CSS 配置
   - [ ] 开发环境热重载配置

2. **数据库层实现**
   - [ ] IndexedDB 架构设计
   - [ ] idb 库集成
   - [ ] CRUD 操作封装
   - [ ] 数据迁移脚本

3. **FSRS算法集成**
   - [ ] ts-fsrs 库集成
   - [ ] 参数配置系统
   - [ ] 复习调度逻辑
   - [ ] 数据分析接口

4. **基础UI框架**
   - [ ] 工业风设计系统
   - [ ] 组件库搭建
   - [ ] 路由系统配置
   - [ ] 状态管理设置

5. **牌组管理功能**
   - [ ] 牌组CRUD操作
   - [ ] 牌组列表界面
   - [ ] 基础统计显示

6. **汉译英卡片模板**
   - [ ] 笔记创建界面
   - [ ] 卡片渲染组件
   - [ ] 复习界面基础版

### Phase 2: 功能完善与可视化 (4-5周)

#### 优先级：🟡 中优先级

1. **卡片模板扩展**
   - [ ] 回译(Retranslate)模板
   - [ ] 句子复述基础版本
   - [ ] 模板系统架构

2. **数据可视化**
   - [ ] Chart.js 集成
   - [ ] 学习热力图
   - [ ] 遗忘曲线分析
   - [ ] 进度统计面板

3. **用户界面优化**
   - [ ] 响应式设计
   - [ ] 暗色主题支持
   - [ ] 动画效果
   - [ ] 无障碍支持

4. **音频功能基础**
   - [ ] 音频播放器组件
   - [ ] 录音功能实现
   - [ ] 音频存储管理
   - [ ] MP3格式支持

### Phase 3: 高级功能与优化 (3-4周)

#### 优先级：🟢 低优先级

1. **AI功能集成**
   - [ ] API配置管理
   - [ ] Google/DeepSeek API集成
   - [ ] 语音转文字功能
   - [ ] 智能反馈系统

2. **划词助手**
   - [ ] Content Script开发
   - [ ] Shadow DOM实现
   - [ ] 词典API集成
   - [ ] 浮层UI设计

3. **数据导入导出**
   - [ ] Anki格式支持
   - [ ] JSON格式导入导出
   - [ ] 数据备份功能
   - [ ] 云同步接口预留

4. **音频高级功能**
   - [ ] 自动音频分段
   - [ ] 音频质量优化
   - [ ] 多格式支持
   - [ ] 音频压缩算法

## ⚙️ 开发环境配置

### 1. 环境要求

```bash
Node.js >= 18.0.0
npm >= 8.0.0 或 pnpm >= 7.0.0
Chrome/Chromium >= 88.0
```

### 2. 快速开始

```bash
# 克隆项目
git clone https://github.com/yourusername/langear-language-extension.git
cd langear-language-extension

# 安装依赖
npm install
# 或使用 pnpm
pnpm install

# 启动开发环境
npm run dev
```

### 3. Chrome扩展加载

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

### 4. 可用脚本

```bash
npm run dev      # 开发环境
npm run build    # 生产构建
npm run preview  # 预览构建结果
npm run lint     # 代码检查
npm run test     # 运行测试
```

## 🎨 UI设计理念

### 工业风设计原则

1. **简洁高效** - 去除冗余元素，专注核心功能
2. **机械美学** - 采用几何形状和金属质感
3. **功能至上** - 每个元素都有明确的功能目的
4. **一致性** - 统一的视觉语言和交互模式

### 色彩方案

```css
/* 主色调 - 工业灰 */
--primary: #2D3748;
--primary-light: #4A5568;
--primary-dark: #1A202C;

/* 辅助色 - 机械蓝 */
--accent: #2B6CB0;
--accent-light: #3182CE;
--accent-dark: #2C5282;

/* 功能色 */
--success: #38A169;
--warning: #D69E2E;
--error: #E53E3E;
--info: #3182CE;

/* 中性色 */
--gray-50: #F7FAFC;
--gray-100: #EDF2F7;
--gray-200: #E2E8F0;
--gray-300: #CBD5E0;
--gray-400: #A0AEC0;
--gray-500: #718096;
--gray-600: #4A5568;
--gray-700: #2D3748;
--gray-800: #1A202C;
--gray-900: #171923;
```

## 📊 核心功能实现

### FSRS算法集成

```typescript
import { FSRS, createEmptyCard, Rating } from 'ts-fsrs';

// 初始化FSRS实例
const fsrs = new FSRS({
  requestRetention: 0.9,
  maximumInterval: 36500,
  enableFuzz: true
});

// 创建新卡片
const createNewCard = (noteId: number, template: string) => {
  const card = createEmptyCard();
  return {
    ...card,
    noteId,
    cardTemplate: template,
    id: generateId()
  };
};

// 执行复习
const reviewCard = (card: Card, rating: Rating, reviewDate: Date) => {
  const schedulingCards = fsrs.repeat(card, reviewDate);
  const result = schedulingCards[rating];
  
  // 更新卡片状态
  updateCardInDB(result.card);
  
  // 记录复习日志
  saveReviewLog({
    cardId: card.id,
    rating,
    reviewTime: reviewDate,
    ...result.log
  });
  
  return result.card;
};
```

### 卡片模板系统

```typescript
// 卡片模板定义
interface CardTemplate {
  type: string;
  frontRenderer: (fields: Record<string, any>) => ReactNode;
  backRenderer: (fields: Record<string, any>) => ReactNode;
}

// 汉译英模板
const CtoETemplate: CardTemplate = {
  type: 'CtoE_ZhToEn',
  frontRenderer: (fields) => (
    <div className="card-front">
      <h2 className="text-2xl font-bold mb-4">请翻译以下句子</h2>
      <p className="text-lg">{fields.chineseOriginal}</p>
    </div>
  ),
  backRenderer: (fields) => (
    <div className="card-back">
      <h3 className="text-xl mb-2">参考翻译</h3>
      <p className="text-lg mb-4">{fields.englishTranslation}</p>
      {fields.userNotes && (
        <div className="notes">
          <h4 className="font-bold">笔记</h4>
          <p>{fields.userNotes}</p>
        </div>
      )}
    </div>
  )
};
```

## 🧪 测试策略

### 测试层级

1. **单元测试** - Jest + Testing Library
   - FSRS算法逻辑测试
   - 工具函数测试
   - 组件单元测试

2. **集成测试** - Chrome Extensions Testing
   - 扩展加载测试
   - 页面间通信测试
   - 数据库操作测试

3. **端到端测试** - Playwright
   - 用户流程测试
   - 复习循环测试
   - 数据导入导出测试

## 🚀 部署与发布

### 构建流程

```bash
# 生产构建
npm run build

# 代码检查
npm run lint

# 运行测试
npm run test

# 打包扩展
npm run package
```

### Chrome Web Store发布

1. 注册Chrome开发者账户
2. 准备扩展资源
   - 图标 (16x16, 48x48, 128x128)
   - 截图 (1280x800)
   - 宣传图 (440x280)
   - 详细描述
3. 隐私政策文档
4. 提交审核

## 🛡️ 风险评估与应对

### 技术风险

| 风险项 | 风险等级 | 应对策略 |
|--------|----------|----------|
| Chrome API变更 | 中 | 关注官方文档，及时适配 |
| IndexedDB兼容性 | 低 | 充分测试，提供降级方案 |
| FSRS算法理解 | 中 | 深入学习文档，社区交流 |
| 性能优化 | 中 | 代码分割，懒加载 |

### 开发风险

| 风险项 | 风险等级 | 应对策略 |
|--------|----------|----------|
| 开发时间评估 | 高 | 迭代开发，MVP优先 |
| UI设计复杂度 | 中 | 组件化开发，设计系统 |
| 测试覆盖率 | 中 | TDD开发模式 |

## 🗺️ 路线图

### v1.0.0 - MVP版本 (3个月)
- ✅ 基础架构搭建
- 🔲 FSRS算法集成
- 🔲 汉译英卡片功能
- 🔲 工业风UI设计
- 🔲 基础数据可视化

### v1.1.0 - 功能增强 (1个月)
- 🔲 回译卡片模板
- 🔲 音频播放功能
- 🔲 学习统计优化

### v1.2.0 - AI集成 (2个月)
- 🔲 语音转文字
- 🔲 智能反馈系统
- 🔲 划词助手

### v2.0.0 - 完整版本 (3个月)
- 🔲 Anki格式支持
- 🔲 云同步功能
- 🔲 高级音频处理
- 🔲 多语言支持

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

- 项目主页: [https://github.com/yourusername/langear-language-extension](https://github.com/yourusername/langear-language-extension)
- Issue追踪: [https://github.com/yourusername/langear-language-extension/issues](https://github.com/yourusername/langear-language-extension/issues)
- 开发者: your.email@example.com

---

<div align="center">

**⚙️ AnGear - 工业级语言学习解决方案 ⚙️**

Made with ❤️ and TypeScript

</div> 