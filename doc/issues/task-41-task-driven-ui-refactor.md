# Task 41: Task-Driven UI Refactor

**文件名**: `task-41-task-driven-ui-refactor.md`  
**创建时间**: 2024年12月19日  
**创建者**: AI Assistant  
**关联协议**: RIPER-5 + 多维 + 代理协议

## 任务描述

此任务旨在将 AnGear 的复习界面从传统的"被动复习"模式，彻底重构为以"主动翻译任务"为核心的现代化学习界面。最终目标是实现一个任务驱动、体验流畅、符合最新产品理念的学习工作台。

## 项目概述

本次重构是 AnGear 项目从"类 Anki 工具"向"任务驱动学习平台"转型的关键一步。它将彻底改变用户学习新知识的方式，强调"主动创造"而非"被动回忆"，同时保留 FSRS 在长期复习中的科学性。

---
*以下部分由 AI 在协议执行过程中维护*
---

## 分析 (RESEARCH 模式填充)

1. **数据结构**: `NoteFields.CtoE` 类型需要新增一个 `userTranslation: string` 字段来存储用户的翻译任务结果。现有的 `english` 和 `notes` 字段将用于侧边栏的"参考翻译"和"学习笔记"。
2. **核心逻辑**: `Review.tsx` 中的 `submitRating` 函数是核心。`submitRating('Again')` 可用于"无法完成"和"我还需要练习"的场景，`submitRating('Good')` 可用于"我做对了"的场景，使卡片毕业。
3. **UI 组件**:
   - `CardDisplay.tsx` 和 `ReviewControls.tsx` 需要被彻底重构或替换。
   - `HintPanel.tsx` 是一个优秀的基础，可以轻松改造为右侧的、可编辑的"智能提示"侧边栏。
4. **状态管理**: `Review.tsx` 中的 `reviewState` 状态机需要扩展，以管理新的任务流程，如 `'task-question'` (任务进行中) 和 `'task-evaluation'` (任务后自我评估)。

## 建议解决方案 (INNOVATE 模式填充)

采用分阶段重构策略：
- **阶段1**: 建立数据基础和状态管理
- **阶段2**: 重构UI组件，创建任务专用组件
- **阶段3**: 整合所有组件，实现完整的任务-复习双循环

## 实施计划 (PLAN 模式生成)

此计划分为三个核心阶段，旨在系统性地完成重构，确保每一步都清晰、可验证。

### **Phase 1: Foundation - Data & State**

**目标**: 建立支持新功能所需的数据结构和核心状态管理逻辑。

- **Task 1.1: Augment Data Structure**
  - [ ] 打开 `src/shared/types/index.ts`。
  - [ ] 定位到 `NoteFields` 接口下的 `CtoE` 类型。
  - [ ] 在 `CtoE` 类型中，于 `pinyin` 和 `notes` 字段之间，新增一个可选字段 `userTranslation?: string;`。

- **Task 1.2: Evolve State Machine in `Review.tsx`**
  - [ ] 打开 `src/main/pages/Review.tsx`。
  - [ ] 修改 `ReviewState` 类型定义。在 `'question'` 和 `'answer'` 之间，新增两个状态：`'task-question'` 和 `'task-evaluation'`。
  - [ ] 新增一个 state 用于存储用户的当前翻译输入: `const [userTranslation, setUserTranslation] = useState('');`
  - [ ] 在 `startReview` 函数的成功回调中，以及在 `handleNextCard`/`handlePreviousCard` 中，将 `setReviewState('question')` 的逻辑修改为：检查当前卡片是否处于"任务阶段"。如果是，则 `setReviewState('task-question')` 并清空 `setUserTranslation('')`。

- **Task 1.3: Create New Event Handlers in `Review.tsx`**
  - [ ] 创建 `handleUserTranslationChange = (text: string) => { setUserTranslation(text); };`
  - [ ] 创建 `handleSubmitTask = () => { setReviewState('task-evaluation'); };`，用于从任务提交进入自我评估阶段。
  - [ ] 创建 `handleSkipTask = () => { submitRating('Again'); };`，用于"无法完成"按钮。
  - [ ] 创建 `handleSelfEvaluation = (rating: AppRating) => { submitRating(rating); };`，用于自我评估阶段的按钮。

### **Phase 2: UI Overhaul - Component Refactoring**

**目标**: 将现有 UI 组件分解并重构为符合新设计理念的、专注任务的模块。

- **Task 2.1: Refactor `HintPanel.tsx` into `SidePanel.tsx`**
  - [ ] 将文件名 `src/main/components/review/HintPanel.tsx` 重命名为 `SidePanel.tsx`。
  - [ ] 在新文件中，将所有 `HintPanel` 的引用（组件名、Props 接口名）重命名为 `SidePanel`。
  - [ ] **Positioning**: 修改最外层 `div` 的 className。将 `left-0` 改为 `right-0`，将 `-translate-x-full` 改为 `translate-x-full`。
  - [ ] **Toggle Button**: 修改 `button` 的 className。移除 `rounded-r-md`，添加 `rounded-l-md`。将其 `right-[-40px]` 的样式改为 `left-[-40px]`。将图标从 `<ChevronLeft>` / `<ChevronRight>` 分别替换为 `<ChevronRight>` / `<ChevronLeft>`，以符合在右侧的逻辑。
  - [ ] **Content**: 移除现有的 `hintContent` 逻辑。在 `Panel Content` div 内，创建两个新的可编辑区域，每个区域包含一个 `h4` 标题和一个 `RichTextEditor` 组件。
    - 第一个区域标题为"参考翻译"，其 `RichTextEditor` 的 `value` 绑定到一个新的 prop `referenceTranslation`，`onChange` 绑定到新 prop `onReferenceChange`。
    - 第二个区域标题为"学习笔记"，其 `RichTextEditor` 的 `value` 绑定到新 prop `studyNotes`，`onChange` 绑定到新 prop `onNotesChange`。
  - [ ] 在 `Review.tsx` 中，更新对该组件的引用，并传递相应的 state 和 handler。

- **Task 2.2: Create New Task-Centric Components**
  - [ ] **`TaskDisplay.tsx`**: 创建新组件 `src/main/components/review/TaskDisplay.tsx`。它只接收一个 prop `originalText: string`，并将其清晰地展示在带有卡片样式的 `div` 中。
  - [ ] **`TranslationInput.tsx`**: 创建新组件 `src/main/components/review/TranslationInput.tsx`。它包含一个 `textarea` 用于用户输入，接收 `value` 和 `onChange` props，并将其状态提升到 `Review.tsx`。
  - [ ] **`TaskControls.tsx`**: 创建新组件 `src/main/components/review/TaskControls.tsx`。它包含两个按钮："提交"和"无法完成"，分别绑定到 `onSubmit` 和 `onSkip` props。
  - [ ] **`EvaluationDisplay.tsx`**: 创建新组件 `src/main/components/review/EvaluationDisplay.tsx`。它接收 `originalText`、`userTranslation` 和 `referenceTranslation`，并以并排或上下对比的形式展示它们，以便用户自我评估。
  - [ ] **`SelfEvaluationControls.tsx`**: 创建新组件 `src/main/components/review/SelfEvaluationControls.tsx`。它包含两个按钮："我做对了 (Good)" 和 "我还需要练习 (Again)"，分别将 `'Good'` 和 `'Again'` 作为参数调用 `onEvaluate` prop。

### **Phase 3: Integration & Finalization**

**目标**: 在 `Review.tsx` 中组装所有新旧组件，实现完整的、动态的"任务-复习"双循环 UI。

- **Task 3.1: Implement New `renderTaskInterface` in `Review.tsx`**
  - [ ] 在 `Review.tsx` 中，创建一个新的渲染函数 `renderTaskInterface`。
  - [ ] 此函数内部根据 `reviewState` 进行条件渲染：
    - **if (`reviewState === 'task-question'`)**:
      - 渲染 `<TaskDisplay>`，传入原文。
      - 渲染 `<TranslationInput>`，绑定 `userTranslation` state 和 `handleUserTranslationChange` handler。
      - 渲染 `<TaskControls>`，绑定 `handleSubmitTask` 和 `handleSkipTask` handlers。
    - **if (`reviewState === 'task-evaluation'`)**:
      - 渲染 `<EvaluationDisplay>`，传入原文、用户翻译和参考翻译。
      - 渲染 `<SelfEvaluationControls>`，绑定 `handleSelfEvaluation` handler。

- **Task 3.2: Update Main `renderReviewInterface`**
  - [ ] 修改 `Review.tsx` 中现有的 `renderReviewInterface` 函数。
  - [ ] 在函数顶部添加逻辑判断：
    ```typescript
    const currentCard = getCurrentCard();
    if (!currentCard) return null;

    const isTaskMode = (currentCard.state === 'New' || currentCard.state === 'Relearning') && !userSettings.enableTraditionalLearningSteps;

    if (isTaskMode) {
      return renderTaskInterface(); 
    }
    ```
  - [ ] 如果 `isTaskMode` 为 `false`，则继续执行原有的渲染逻辑，显示经典的4按钮FSRS复习界面。

- **Task 3.3: Integrate `SidePanel.tsx`**
  - [ ] 在 `Review.tsx` 的主返回 `div` 中，确保 `<SidePanel>` 被渲染。
  - [ ] 将其 `isOpen` 属性绑定到 `showHint` state。
  - [ ] 将其 `onToggle` 绑定到 `handleToggleHint`。
  - [ ] 创建一个新的、经过防抖处理的 `handleNoteUpdate(fieldName: 'english' | 'notes', content: string)` 函数，并将其分别作为 `onReferenceChange` 和 `onNotesChange` 传递给 `SidePanel`。这个函数将负责更新 `Note` 的相应字段。

- **Task 3.4: Final Cleanup**
  - [ ] 审查 `Review.tsx` 和被重构的子组件，移除所有在新流程中不再使用的旧 props、state 和逻辑。
  - [ ] 确保 `CardDisplay.tsx` 和 `ReviewControls.tsx` 在"传统模式"下依然能正常工作。

---

我将严格按照此计划顺序执行。首先是数据和状态，然后是UI重构，最后是逻辑集成。 