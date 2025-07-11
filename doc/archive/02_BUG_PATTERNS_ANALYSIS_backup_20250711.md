# LanGear Bug模式分析 (v2.1)

**备份时间**: 2025年7月11日
**备份说明**: 此文档为重大更新前的备份版本

## 概述
本文档总结了LanGear在高速迭代（尤其在Task 28 - 48期间）中出现的典型Bug模式、根本原因和已形成的解决策略，旨在指导未来的开发，提高代码质量。

## Bug模式分类与分析

### 1. TypeScript编译与类型错误 (高频)
-   **典型场景**:
    1.  **接口与实现不匹配**: 在`BulkImportPage.tsx`中创建`Note`对象时，多次遗漏`noteType`, `tags`等必需属性。
    2.  **类型定义不一致**: 在`Review.tsx`中，`CardState`类型在不同地方被错误地写为 `'learning'` 和 `'Learning'`。
    3.  **废弃代码残留**: 重构后，大量未使用的`import`语句和函数导致编译警告和错误。
-   **根本原因**: 快速重构过程中，对共享类型（`types/index.ts`）的修改未能同步到所有引用的地方。
-   **解决策略/经验**:
    -   **类型优先**: 在修改任何功能前，首先思考和更新共享的类型定义。
    -   **定期清理**: 在每次提交前，利用IDE的"Organize Imports"和"Find Usages"功能清理废弃代码。
    -   **构建验证**: 将`npm run build`作为本地开发和CI流程中的强制验证步骤。

### 2. 测试环境与Mock问题 (高挑战性)
-   **典型场景**:
    -   在`ai-bulk-import-e2e.test.tsx`测试中，`vi.mock`无法正确拦截在组件内部通过`new ApiClient()`创建的实例，导致`apiClient.getAllDecks is not a function`的错误。
-   **根本原因**: `vitest`在处理ES模块的`vi.mock`时，其提升（hoisting）行为较为复杂，难以直接覆盖模块内部的实例化。
-   **解决策略/经验**:
    -   **简化Mock导出**: 最终采用的有效模式是在测试文件中定义一个`mockApiClient`对象，然后通过`vi.mock`让`ApiClient`类的构造函数返回这个单例的mock对象。这比尝试导出`__mockApiClient`的黑魔法更可靠且类型安全。
    -   **分离测试**: 将复杂的UI交互测试与核心逻辑测试分离。先用单元测试验证`geminiService`等服务的逻辑，再用集成测试验证组件在mock环境下的表现。

### 3. UI与业务逻辑紧密耦合 (隐蔽)
-   **典型场景**:
    1.  **AI按钮显示逻辑**: `BulkImportPage`中的AI按钮显示条件`!parsedCards.length`过于严格，导致任何输入（即使是无效的）都会使`parsedCards`数组有长度，从而永久隐藏AI按钮。
    2.  **快捷键冲突**: 在`Review.tsx`中，"e"键作为评分快捷键与输入框的编辑功能冲突。
-   **根本原因**: 将复杂的业务逻辑判断直接写在JSX的条件渲染中，或者全局事件监听未考虑当前UI的焦点状态。
-   **解决策略/经验**:
    -   **逻辑状态化**: 将复杂的显示逻辑提取为独立的state或memoized变量（如`const shouldShowAiButton = ...`），使其更易于调试和测试。
    -   **事件源判断**: 在处理键盘事件时，务必检查`event.target`是否为`INPUT`, `TEXTAREA`或`contentEditable`元素，以避免在输入时触发全局快捷键。

### 4. Chrome扩展特有权限问题 (严重)
-   **典型场景**:
    -   AI功能在本地测试正常，但在加载到Chrome后，调用Gemini API时出现网络错误，控制台显示CORS或CSP（内容安全策略）错误。
-   **根本原因**: `manifest.json`（通过`vite.config.ts`生成）中缺少对`generativelanguage.googleapis.com`的访问授权。
-   **解决策略/经验**:
    -   **双重授权**: 必须同时在`host_permissions`中声明主机权限，并在`content_security_policy.connect-src`中明确允许连接。这是Manifest V3的严格要求。
    -   **权限测试**: 为权限配置创建专门的测试文件，验证生成的`manifest.json`是否包含所有必需的权限声明。

---
*最后更新：2025年6月25日* 