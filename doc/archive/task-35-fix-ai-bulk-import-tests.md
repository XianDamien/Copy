# Context
Filename: task-35-fix-ai-bulk-import-tests.md
Created On: 2024-12-19
Created By: AI Assistant
Associated Protocol: RIPER-5 + Multidimensional + Agent Protocol

# Task Description
修复AI批量导入功能的端到端测试中的两个关键问题：
1. Mock设置问题：`apiClient.getAllDecks is not a function` - mock配置未正确工作
2. AI处理按钮显示逻辑问题：当文本被解析为无效卡片时，AI处理按钮不显示

确保测试能够正确验证完整的AI处理+批量导入流程，提供可靠的功能覆盖。

# Project Overview
AnGear是一个基于Chrome扩展的语言学习工具。Task 34已经成功实现了AI驱动的批量制卡功能的核心逻辑，但端到端测试存在技术问题需要解决，以确保功能的长期可维护性和质量保证。

---
*The following sections are maintained by the AI during protocol execution*
---

# Analysis (Populated by RESEARCH mode)

## 问题分析

### 问题1: Mock配置失效
- **现象**: `TypeError: apiClient.getAllDecks is not a function`
- **根本原因**: vitest mock配置在ES模块环境下不能正确拦截BulkImportPage内部创建的ApiClient实例
- **影响**: 所有依赖API调用的测试都无法正常运行

### 问题2: AI处理按钮显示逻辑
- **现象**: 当输入文本被解析为无效卡片时，AI处理按钮不显示
- **根本原因**: BulkImportPage的显示逻辑是 `{inputText.trim() && !parsedCards.length && (...)}` 
- **影响**: 测试无法找到AI处理按钮，导致测试失败

### 技术约束
- vitest的ES模块mock机制复杂
- BulkImportPage内部使用 `new ApiClient()` 创建实例
- 组件的条件渲染逻辑影响测试元素查找

## 文件依赖分析
- `src/tests/ai-bulk-import-e2e.test.tsx` - 需要修复的测试文件
- `src/main/pages/BulkImportPage.tsx` - 可能需要调整显示逻辑或测试策略
- `src/shared/utils/api.ts` - API客户端实现

# Proposed Solution (Populated by INNOVATE mode)

## 解决方案设计

### 方案1: 修复Mock配置 (推荐)
- **优势**: 保持组件逻辑不变，只修复测试配置
- **方法**: 使用更直接的mock方式，避免ES模块复杂性
- **实现**: 重构mock设置，使用vi.hoisted确保mock提升

### 方案2: 简化测试策略
- **优势**: 避开复杂的mock配置问题
- **方法**: 创建更简单的单元测试，分别测试各个功能
- **实现**: 分离AI处理测试和批量导入测试

### 方案3: 调整组件逻辑
- **优势**: 使组件更易于测试
- **方法**: 允许外部注入ApiClient依赖
- **实现**: 修改BulkImportPage接受apiClient作为prop

## 推荐方案: 方案1 + 方案2组合
- 优先修复mock配置，实现完整的端到端测试
- 同时创建简化的单元测试作为后备
- 确保测试覆盖率和可维护性

# Implementation Plan (Generated by PLAN mode)

## Phase 1: 修复Mock配置
1. **重构测试文件mock设置**
   - 使用vi.hoisted确保mock正确提升
   - 简化mock配置，避免复杂的ES模块问题
   - 验证mock能够正确拦截API调用

2. **修复AI按钮显示逻辑测试**
   - 分析BulkImportPage的条件渲染逻辑
   - 调整测试策略，确保AI按钮在预期情况下显示
   - 验证测试能够找到并点击AI处理按钮

## Phase 2: 创建简化单元测试
3. **创建AI处理功能单元测试**
   - 独立测试geminiService的processTextForCards方法
   - 验证AI处理逻辑的正确性
   - 测试各种边界情况和错误处理

4. **创建批量导入功能单元测试**
   - 独立测试批量导入的数据流
   - 验证deckId正确传递和处理
   - 测试导入成功和失败场景

## Phase 3: 验证和文档
5. **运行完整测试套件**
   - 确保所有测试通过
   - 验证测试覆盖率
   - 检查测试运行性能

6. **创建测试修复总结文档**
   - 记录问题分析和解决过程
   - 总结测试最佳实践
   - 提供未来测试开发指导

## 具体测试命令
```bash
# 运行修复后的端到端测试
npm test src/tests/ai-bulk-import-e2e.test.tsx

# 运行AI处理单元测试
npm test src/tests/gemini-service.test.ts

# 运行批量导入单元测试
npm test src/tests/bulk-import-fix.test.tsx

# 运行所有相关测试
npm test -- --testPathPattern="ai|bulk|gemini"
``` 