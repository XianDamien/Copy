研究总结与最终分析 (Analysis)
我已经对实现新复习界面所需的所有关键部分进行了审查：
主文件 (Review.tsx)：这是所有更改的核心。它是一个大型状态机，控制着UI的各个阶段。重构将主要集中在其 render 方法（特别是 renderQuestion 和 renderAnswer）以及状态管理逻辑上。
数据类型 (types/index.ts)：了解了 Note 和 NoteFields 的强类型结构。这将使我能够编写更健壮和可读的代码，通过字段名（如 note.fields.CtoE.english）而不是不稳定的索引来访问数据。
编辑器组件 (RichTextEditor.tsx)：确认了一个功能齐全、易于集成的富文本编辑器，它支持高亮等功能，并提供了简单的 value/onChange 接口。
后端API (api.ts)：确认了存在 updateNote 方法，这使得将用户在复习界面上所做的笔记更改持久化到数据库成为可能。
核心挑战与注意事项
状态管理复杂性：Review.tsx 已经很复杂。添加内联编辑状态（例如，跟踪哪个字段被修改）、可切换的侧边栏状态以及新的导航逻辑将增加其复杂性。需要谨慎地管理这些状态，以避免引入错误。
用户体验流程：
自动保存：如何触发保存？是在用户停止输入后延迟保存，还是在用户切换到下一张卡片时保存？自动保存是最好的体验，可以考虑使用 debounce 技术来优化对 updateNote 的调用。
“上一个/下一个”导航：如前所述，在FSRS复习流程中添加自由导航可能会破坏学习算法的间隔安排。一个折衷方案是，允许“下一个”跳过当前卡片（类似于现有的 handleSkipCard），而“上一个”仅用于查看刚复习过的卡片，但不允许重新评分。这个功能需要和您确认具体需求。在计划阶段，我将暂时设计为简单的卡片切换功能。
代码重构：为了使 Review.tsx 更易于管理，我计划将其拆分为更小的子组件。例如，CardFront、CardBack、ReviewControls 和 SideHintPanel。这将使代码更清晰，也更容易独立测试。

这个方案侧重于代码质量和未来的可扩展性，通过将 Review.tsx 拆分成多个独立的子组件来重构整个页面。
优点:
代码结构清晰，每个组件职责单一，易于理解和维护。
可测试性强，可以为每个子组件编写独立的单元测试。
UI和逻辑分离，未来修改UI或逻辑时影响范围更小。
更容易实现复杂交互和精美的UI。
缺点:
前期开发工作量更大。
需要对现有的状态管理进行较大调整，以Props的形式将状态和回调函数传递给子组件。
实现思路:
拆分组件:
Review.tsx (容器组件): 只负责状态管理、数据获取和作为父组件。
CardDisplay.tsx (展示组件): 接收 card 和 note 数据，负责渲染卡片正面、背面和内联编辑功能。它内部可以使用 RichTextEditor。
HintPanel.tsx (展示组件): 接收提示内容，并管理自身的显示/隐藏状态。
ReviewControls.tsx (展示组件): 包含“显示答案”、“Again/Hard/Good/Easy”评分按钮以及新的“上一个/下一个”导航按钮。
状态管理: Review.tsx 中保留核心状态，如 cards, currentCardIndex, reviewState。将状态和操作函数（如 handleNextCard, handlePrevCard, handleUpdateNote）通过Props传递给子组件。
内联编辑与保存: CardDisplay 组件内部管理编辑状态。当 RichTextEditor 的 onChange 触发时，更新本地状态。使用 useEffect 和 debounce 技术，在用户停止输入一段时间后，调用从Props接收的 handleUpdateNote 函数，将更改保存到数据库，实现自动保存。


# 实施计划 (Implementation Plan)
此计划将分步重构复习页面，以实现新的UI布局和内联编辑功能。
Phase 1: 创建新的子组件框架
这一阶段的目标是搭建好新的组件结构，但暂时不实现所有逻辑。
创建 HintPanel.tsx 组件:
文件路径: src/main/components/review/HintPanel.tsx
功能:
接收 hintTitle: string 和 hintContent: string 作为Props。
接收 isOpen: boolean 和 onToggle: () => void 来控制显示和隐藏。
UI: 一个可收起的侧边栏，默认收起。点击按钮时展开，显示 hintContent。
创建 ReviewControls.tsx 组件:
文件路径: src/main/components/review/ReviewControls.tsx
功能:
将 Review.tsx 中现有的所有按钮逻辑（显示答案、评分按钮）移动到此组件。
接收 reviewState: ReviewState 和各种 onClick 回调函数作为Props。
新增“上一个”和“下一个”按钮的UI，暂时不实现功能。
创建 CardDisplay.tsx 组件:
文件路径: src/main/components/review/CardDisplay.tsx
功能:
接收 note: Note、showAnswer: boolean 作为Props。
初步渲染卡片正面和背面。使用 note.fields.CtoE.chinese 等强类型字段访问。
暂时使用普通的 div 渲染，尚未集成 RichTextEditor。
Phase 2: 重构 Review.tsx 以使用新组件
将 Review.tsx 的渲染逻辑替换为调用新创建的子组件。
修改 Review.tsx:
导入 HintPanel, ReviewControls, CardDisplay。
重写 renderQuestion 和 renderAnswer 方法（或合并为一个 renderReviewInterface 方法）。
在新的渲染方法中，使用 CardDisplay 来显示卡片。
使用 ReviewControls 来显示所有控制按钮。
使用 HintPanel 来渲染“参考翻译”，并添加 showHint 状态来控制其显示/隐藏。
将所有相关的状态和回调函数通过Props传递给这些子组件。
此时，应用的功能应该和重构前基本一致，但代码结构已经优化。
Phase 3: 实现内联编辑功能
在 CardDisplay 组件中集成富文本编辑器。
修改 CardDisplay.tsx:
导入 RichTextEditor。
将用于显示“学习笔记”（note.fields.CtoE.notes）的 div 替换为 <RichTextEditor>。
添加 onNoteChange: (newContent: string) => void Prop。
RichTextEditor 的 value 绑定到 note.fields.CtoE.notes。
RichTextEditor 的 onChange 事件调用 onNoteChange 回调。
修改 Review.tsx:
实现 handleNoteUpdate 函数。此函数接收笔记的新内容。
使用 debounce 技术包装此函数，以避免频繁调用API。
在 debounce 后的函数中，调用 apiClient.updateNote，将更新后的 note 对象（包含新的 fields）发送到后端保存。
将此 handleNoteUpdate 函数作为 onNoteChange Prop 传递给 CardDisplay。
Phase 4: 实现导航和UI调整
完成最后的UI调整和功能。
修改 Review.tsx:
实现 handlePreviousCard 和 handleNextCard 函数。
这两个函数将更新 currentCardIndex 状态，并确保索引不会越界。
将这两个函数作为Props传递给 ReviewControls。
修改 ReviewControls.tsx:
将 onClick 事件绑定到“上一个”和“下一个”按钮上。
全局CSS和布局调整:
调整 Review.tsx 的主容器样式，使用Flexbox或Grid，将 CardDisplay 和 HintPanel 左右布局。
微调 CardDisplay 内部的间距、字体大小，确保输入框在不滚动的情况下可见。
将编辑按钮（Edit3 icon）移动到 CardDisplay 的角落，并赋予新的 onClick 功能（如果需要的话，例如切换所有字段的可编辑状态，或者保持跳转功能）。
Phase 5: 测试
验证所有功能是否正常工作。
手动测试:
验证复习流程是否正常。
测试参考翻译的显示/隐藏功能。
测试在“学习笔记”字段中的高亮、加粗等编辑功能。
刷新页面或重新进入复习，确认笔记修改已成功保存。
测试“上一个”和“下一个”按钮的功能。
检查整体布局在不同屏幕尺寸下的表现。
更新单元测试 (可选，但建议):
为 HintPanel, ReviewControls, CardDisplay 编写新的单元测试。
修改 review-ui.test.tsx 以适应新的组件结构。
执行清单:
[ ] Phase 1: 创建 HintPanel.tsx, ReviewControls.tsx, CardDisplay.tsx 三个组件的基本框架。
[ ] Phase 2: 重构 Review.tsx，用新的子组件替换旧的渲染逻辑，并正确传递Props。
[ ] Phase 3: 在 CardDisplay.tsx 中集成 RichTextEditor 并实现自动保存逻辑到 Review.tsx。
[ ] Phase 4: 实现卡片导航功能，并完成所有UI的最终布局和样式调整。
[ ] Phase 5: 进行全面的手动测试，确保所有新功能和原有功能都按预期工作。