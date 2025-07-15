# LanGear 智能语言学习扩展

<div align="center">

![LanGear Logo](https://via.placeholder.com/200x200/2D3748/F7FAFC?text=LanGear)

**🔧 工业级智能语言学习Chrome扩展**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

</div>

## 🎯 项目概述

LanGear是一个为语言学习者设计的、运行于Chrome浏览器的高效学习工具。它深度集成了科学的FSRS间隔重复算法、AI驱动的学习辅助功能和创新的任务驱动学习模式，旨在最大限度地提高学习效率和知识保留率。

本项目所有数据均存储于用户本地的IndexedDB中，确保了离线使用的流畅性和用户数据的绝对隐私。

### 核心理念



LanGear的灵感源自Anki，我们致力于借鉴其以卡片为基础的主动回忆训练和FSRS记忆算法等核心优势。项目旨在将学习训练与知识整理相结合，构建一个专门增强英语应用能力的训练平台。

我们的核心方法是利用AI打造“可理解性输入”到“高质量输出”的完整学习闭环。未来，AI还将通过分析用户的学习数据，提供个性化的学习总结与规划建议，成为用户的专属学习顾问。

1. 核心继承Anki: 我们将借鉴Anki的精髓，即以卡片为基础的主动回忆训练和科学的FSRS算法。
2. 目标聚焦英语应用: 项目的最终目的是成为一个增强英语实际应用能力的专业训练工具，而不仅仅是背单词。
3. AI驱动的学习闭环: 核心方法论是利用AI提供可理解性输入（如词汇、语法解释），然后鼓励用户进行输出（如翻译练习），并由AI对输出进行评估，形成一个完整的学习闭环。
4. 长期AI高级功能: 未来，AI将扮演更重要的角色，通过分析用户的卡片习数据，提供个性化的学习报告和规划建议。

## ✨ 核心特性

- 🧠 **FSRS科学记忆算法** - 基于`ts-fsrs`库，实现精准、高效的复习调度，优化长期记忆。
- 🤖 **AI辅助学习** - 集成Google Gemini API，提供智能批量制卡、内容解释和评估等功能。
- 💡 **双学习模式** - 支持创新的“任务驱动”学习模式和可配置的“传统”学习步骤模式。
- 📝 **富文本编辑** - 使用Tiptap编辑器，支持丰富的笔记格式。
- 📂 **AI批量导入** - 从任意文本块中自动识别双语内容并一键生成卡片。
- 🎵 **音频/字幕学习** - （开发中）支持通过音频和字幕文件进行多媒体学习。
- 💾 **本地优先存储** - 所有数据存储在本地IndexedDB，支持离线访问。

## ✨ 核心用户流程 (User Journey)

为了让工程师更好地理解产品，以下是几个典型的用户使用场景：

**场景一：首次使用 - 中译英（回译）任务**
1. 用户在网上看到一篇感兴趣的英文文章/新概念英语文章。
2. 用户将文章全文复制（字数少于500字），粘贴到LanGear的“批量导入”界面。
3. AI先自动生成中文译文，将文本分割成“原文（英文）-译文（中文）”配对的句子，并以列表形式呈现。
4. 用户审核AI生成的句子列表，取消勾选不希望进行回译练习的句子。
5. 点击“确认导入”，系统为每个选中的句子创建一张**中译英（回译）**任务卡片，并存入一个新的牌组。所有卡片初始状态为“新卡片(New)”。

**场景二：每日学习 - 任务与复习**
1. 用户开始当天的学习。系统优先呈现**任务卡片 (Task Cards)**。
2. **任务阶段**:
   - 界面展示中文句子，要求用户翻译成英文。
   - 用户在输入框中提交自己的翻译。
   - AI Agent参照参考翻译（原英文句子）对用户的翻译进行评估，提供一个**参考分数**、**指出潜在错误**（语法、用词等），并**给出优化建议**。
   - 用户参考AI的反馈，结合自己的感受，进行**FSRS自评**：
     - 如果觉得很吃力或完全没思路，点击 **[重来]**。卡片仍然是任务卡。
     - 如果成功完成了翻译，点击 **[良好]** 或 **[简单]**。这张卡片被视为**“毕业” (Graduate)**，状态转为“复习(Review)”，FSRS算法会为其计算出第一个（通常是1天或更长）复习周期。
3. **复习阶段**:
   - 当任务卡片全部完成后，系统呈现到期的**复习卡片 (Review Cards)**。
   - 用户看到提示，回忆内容，然后点击“显示答案”。
   - 对照答案，用户进行FSRS自评（[重来], [困难], [良好], [简单]）。
     - 如果点击 **[重来]**，卡片状态变为“Lapsed”，并**重新进入任务阶段**，要求用户再次完成一次翻译任务来“重新毕业”。

**场景三：专项训练 - 句子复述**
1. 用户手动准备一个音频文件（如`.mp3`）和一个对应的字幕文件（如`.srt`或`.vtt`）。
2. 用户在LanGear中创建一个“句子复述”牌组，并上传这两个文件。
3. 系统解析文件，并将音频和字幕按句子切分、对齐。
4. 开始学习时，卡片**只播放句子音频，不显示任何文本**。
5. 用户听完后，录下自己的复述。系统使用STT（语音转文本）技术将录音转为文字，并显示出来。
6. AI Agent对转录的文本与原文进行对比，指出**发音可能存在的问题**（尤其是元音）、流利度、语法等，并给出参考评价。
7. 用户结合AI反馈进行自评。每完成约10个句子，系统会生成一个**阶段性小结**，总结常见问题并提供针对性建议。

---

## 🛠️ 技术栈与架构说明

- **前端**: React 18, TypeScript, Vite, Tailwind CSS
- **核心算法**: `ts-fsrs` (FSRS间隔重复算法库)
- **数据存储**: **IndexedDB**。所有用户数据（卡片、配置、学习记录）均存储在本地，保证隐私和离线可用性。使用 `idb` 库进行异步操作。
- **AI集成**:
    - **模型**: 灵活接入，初期支持用户填入自己的API Key（如Google Gemini, OpenAI GPT等）。所有AI请求通过浏览器端 `fetch` 直接调用。
    - **语音技术 (STT/TTS)**:
        - **TTS (文本转语音)**: 优先使用浏览器内置的 `SpeechSynthesis` API，实现零成本发音。
        - **STT (语音转文本)**: 集成第三方语音识别服务API。**需求：中等水平的转录精度即可**，目的是分析发音模式而非完美转录。
- **富文本编辑**: Tiptap
- **Chrome扩展**: `samrum/vite-plugin-web-extension`

---


## 🛠️ 技术栈

- **前端框架**: **React 18** + **TypeScript**
- **构建工具**: **Vite** + **@samrum/vite-plugin-web-extension**
- **UI**: **Tailwind CSS** + **Lucide Icons**
- **核心算法**: **ts-fsrs**
- **AI服务**: **Google Gemini API** (通过原生 `fetch` 调用)
- **数据存储**: **IndexedDB** + **idb** (异步封装)
- **富文本编辑**: **Tiptap**
- **音频处理**: **wavesurfer.js** + **@plussub/srt-vtt-parser**
- **测试**: **Vitest** + **React Testing Library**

## 🗄️ 数据库设计

项目使用IndexedDB存储所有数据，核心表结构如下：

| 表名 (Object Store) | 主键 | 描述 | 核心字段 |
| :--- | :--- | :--- | :--- |
| `decks` | `id` (auto) | 存储牌组信息和FSRS配置 | `name`, `deckType` ('translation', 'retelling'), `fsrsConfig` |
| `notes` | `id` (auto) | 存储笔记内容（卡片模板） | `deckId`, `noteType`, `fields` (e.g., {'Front': '中文', 'Back': 'English'}) |
| `cards` | `id` (auto) | 存储卡片及其FSRS学习状态 | `noteId`, `due`, `stability`, `difficulty`, `state` ('New', 'Task', 'Review', 'Lapsed') |
| `reviewLogs` | `id` (auto) | 记录每一次复习历史 | `cardId`, `rating`, `stateBefore`, `stateAfter`, `duration` |
| `mediaAssets` | `id` (string/hash) | 存储音频文件和字幕数据 | `audioData` (Blob), `subtitleData` (string) |


## �� 开发路线图

项目采用迭代开发模式。当前的开发焦点是完成以下 **Milestone 1** 的所有任务。

---

| 任务 | 状态 | 关键需求/备注 |
| :--- | :--- | :--- |
| **1. 任务+复习，FSRS核心学习循环** | ⏳ 待开发 | 接入实现FSRS算法，实现“任务驱动”的状态机。新卡和Lapsed卡进入“任务模式”，Review卡进入“复习模式”。 |
| **2. 中译英（回译）任务模块** | ⏳ 待开发 | UI: 显示中文，提供输入框。逻辑: 提交后调用AI评估，并根据用户自评更新卡片状态。 |
| **3. AI Agent集成** | ⏳ 待开发 | 创建一个可复用的AI服务模块，接收用户输入和任务类型，返回结构化的JSON评估结果。 |
| **4. AI批量导入 (CSV/Text)** | ⏳ 待开发 | UI: 文本粘贴区。逻辑: 调用AI处理文本，生成预览列表，用户确认后批量创建Notes和Cards。 |
| **5. 句子复述任务模块** | ⏳ 待开发 | UI: 音频播放/录制。逻辑: 集成STT API，调用AI进行对比分析，提供反馈。 |
| **6. 文件处理 (音频/字幕)** | ⏳ 待开发 | 支持用户上传媒体文件，并在本地进行解析和存储到IndexedDB。 |
| **7. 基础UI与数据展示** | ⏳ 待开发 | 主界面、牌组列表、每日学习统计、设置页面（用于输入API Key）。 |


## ⚙️ 开发环境配置

### 1. 环境要求

- **Node.js**: `>= 18.0.0`
- **npm** / **pnpm**
- **Chrome** / **Chromium**

### 2. 快速开始

```bash
# 克隆项目
git clone https://github.com/your-repo/langear-language-extension.git
cd langear-language-extension

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

### 3. Chrome扩展加载

1.  打开Chrome浏览器，访问 `chrome://extensions/`
2.  开启"开发者模式"
3.  点击"加载已解压的扩展程序"，选择项目的 `dist` 目录

## 📄 许可证

本项目采用 MIT 许可证。 