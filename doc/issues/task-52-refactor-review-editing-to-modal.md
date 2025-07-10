# Context
Filename: task-52-refactor-review-editing-to-modal.md
Created On: 2025-01-27
Created By: AI Assistant
Associated Protocol: RIPER-5

# Task Description
将复习界面的卡片编辑功能从右侧滑出的 `SidePanel` 重构为一个通过点击提示图标触发的居中模态框 (Modal)。该模态框将直接嵌入现有的 `NoteEditor` 组件，以提供完整且一致的编辑体验，并彻底移除原有的 `SidePanel` 和 `HintPopup` 组件，简化整体界面和代码。

# Project Overview
LanGear 是一个语言学习应用。此任务旨在优化核心的复习流程，通过移除侧边栏并引入按需显示的模态编辑窗口，来简化UI、减少干扰、统一编辑体验，并为未来的功能迭代打下更简洁的基础。

---
*The following sections are maintained by the AI during protocol execution*
---

# Implementation Plan

## Phase 1: Clean House - Remove Obsolete Components and Logic

这是最关键的第一步，我们将彻底清除不再需要的旧代码，为新功能腾出空间。

1. **Delete `SidePanel.tsx`**:
   - **Action**: 从文件系统中删除 `src/main/components/review/SidePanel.tsx` 文件。

2. **Delete `HintPopup.tsx`**:
   - **Action**: 从文件系统中删除 `src/main/components/review/HintPopup.tsx` 文件。

3. **Gut `Review.tsx` of Old Logic**:
   - **File**: `src/main/pages/Review.tsx`
   - **Actions**:
     - 移除 `SidePanel` 和 `HintPopup` 的 `import` 语句。
     - 移除所有与 `SidePanel` 相关的 JSX 代码块。
     - 删除以下所有 `useState` hook 及其相关的逻辑： `isSidePanelOpen`, `isNoteDirty`, `isSaving`, `pendingReferenceTranslation`, `pendingStudyNotes`, `hasUnsavedChanges`, `isHintVisible`。
     - 移除主内容 `div` 上的 `mr-[300px]` 条件样式。
     - 清空旧的 `handleEditCard` 函数的逻辑，我们稍后会给它赋予新功能。

## Phase 2: Implement the Modal Container

现在，我们将构建一个简单、轻量级的模态框容器来承载我们的编辑器。

1. **Create Modal State**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 添加一个新的状态来控制模态框的显示与隐藏： `const [isEditModalOpen, setIsEditModalOpen] = useState(false);`

2. **Build the Modal Structure**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 在 `render` 函数的顶层，添加模态框 JSX 结构。

## Phase 3: Integrate `NoteEditor` and Wire Up Controls

这是计划的核心：将功能完备的 `NoteEditor` 嵌入模态框中，并连接所有控制逻辑。

1. **Update Icon's `onClick`**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 找到 `Lightbulb` 图标，将其 `onClick` 事件处理函数修改为 `() => setIsEditModalOpen(true)`。

2. **Repurpose `handleEditCard` and Keyboard Shortcut**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 将 `handleEditCard` 函数的内容改为 `setIsEditModalOpen(true)`。

3. **Render `NoteEditor` in Modal**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 在模态框内部渲染 `<NoteEditor />` 组件。

## Phase 4: Implement Data Refresh on Save

最后一步，确保在用户保存笔记后，复习界面能立即显示更新后的内容。

1. **Create `handleNoteUpdateAndRefresh` function**:
   - **File**: `src/main/pages/Review.tsx`
   - **Action**: 创建一个新的异步函数，它将在笔记保存后被调用。

2. **Test the Full Flow**:
   - **Action**: 启动应用，开始复习，点击灯泡图标，编辑笔记并保存。
   - **Expected**: 模态框关闭，卡片内容立即刷新为新保存的内容。 