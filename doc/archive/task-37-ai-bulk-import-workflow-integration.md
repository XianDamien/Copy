# Context
Filename: task-37-ai-bulk-import-workflow-integration.md
Created On: 2024-12-19
Created By: AI Assistant
Associated Protocol: RIPER-5 + Multidimensional + Agent Protocol

# Task Description
修复AI批量导入功能的三个核心问题：
1. Gemini API密钥验证失败且无法显示具体原因
2. 预览卡片的UI提示过时，未体现AI自动处理能力
3. 由于API密钥问题导致AI处理流程中断

目标是创建一个完整、用户友好的AI批量导入工作流程，让用户能在BulkImportPage内完成密钥配置、文本处理和卡片导入的全部操作。

# Project Overview
AnGear是一个基于Chrome扩展的语言学习工具。当前的AI批量导入功能存在工作流程分裂的问题：API密钥管理在SettingsPage，而AI处理在BulkImportPage，导致用户体验不佳且错误反馈不清晰。

---
*The following sections are maintained by the AI during protocol execution*
---

# Analysis (Populated by RESEARCH mode)

## 问题根源分析

### 1. API密钥验证问题
- **现状**: `BulkImportPage.tsx`完全缺失API密钥的输入、验证和反馈UI
- **根本原因**: 页面通过`apiClient.aiProcessText(inputText)`调用AI功能，但无法获取或显示来自`geminiService.validateApiKey`的具体错误信息
- **用户体验**: 用户只能看到通用的"AI处理失败，请检查API密钥配置"提示，无法了解具体失败原因

### 2. UI文本过时问题
- **现状**: 页面引导文本仍在指导用户进行手动格式化
  - 页面副标题: "粘贴文本内容，每行一张卡片，用制表符或逗号分隔中文和英文"
  - 格式说明框: 详细解释手动格式化方法
- **问题**: 完全没有体现AI自动处理的强大能力，造成功能和用户认知脱节

### 3. 工作流程碎片化
- **现状**: 用户必须在多个页面间切换完成操作
  1. 前往SettingsPage输入和验证密钥
  2. 导航到BulkImportPage
  3. 粘贴文本并尝试AI处理
  4. 如果失败，返回设置页面检查密钥
- **问题**: 流程断裂，用户体验差

## 技术架构分析

### 文件结构
- `src/main/pages/BulkImportPage.tsx`: 批量导入主页面，缺少API密钥管理
- `src/main/pages/SettingsPage.tsx`: 设置页面，包含API密钥验证逻辑
- `src/background/geminiService.ts`: Gemini API服务，包含完善的错误处理
- `src/shared/utils/api.ts`: API客户端，处理前后端通信

### 关键发现
- `geminiService.validateApiKey`函数具有完善的错误处理和中文错误信息
- `BulkImportPage`的AI按钮显示逻辑正确，但缺少密钥状态检查
- `SettingsPage`已有完整的API密钥验证UI和逻辑

# Proposed Solution (Populated by INNOVATE mode)

## 解决方案设计

### 方案1: 完全整合 (推荐)
- **优势**: 创建完整的一站式体验，用户无需页面切换
- **方法**: 将SettingsPage的API密钥管理功能复制到BulkImportPage
- **实现**: 在BulkImportPage添加密钥输入、验证、保存功能

### 方案2: 改进导航
- **优势**: 保持现有架构，减少代码重复
- **方法**: 改进页面间的导航和状态同步
- **实现**: 添加快速跳转和状态提示

### 方案3: 模态对话框
- **优势**: 在需要时弹出密钥配置，不占用主界面空间
- **方法**: 创建API密钥配置模态框
- **实现**: 检测到密钥问题时自动弹出

## 推荐方案: 方案1完全整合
- 提供最佳的用户体验
- 消除工作流程断裂
- 实现真正的一站式AI批量导入

# Implementation Plan (Generated by PLAN mode)

## Phase 1: 重构BulkImportPage以整合API密钥管理
1. **添加API密钥管理状态**
   - 新增state: `apiKey`, `isKeyAvailable`, `apiKeyError`, `apiKeySuccess`, `isVerifying`
   - 在页面加载时从设置中获取已保存的API密钥

2. **创建API密钥配置UI**
   - 在"选择目标牌组"和"输入内容"之间添加"Gemini AI配置"卡片
   - 包含密钥输入框、验证按钮和状态显示区域

3. **实现密钥验证和保存逻辑**
   - 创建`handleVerifyAndSaveApiKey`函数
   - 调用`apiClient.verifyGeminiApiKey`进行验证
   - 成功后保存到设置中

4. **更新AI处理逻辑**
   - 修改`handleAiProcess`函数，使用页面内的`apiKey`
   - 显示具体的错误信息而非通用提示

## Phase 2: 更新UI文本和用户引导
5. **修改页面主要引导文本**
   - 更新页面副标题为AI优先的描述
   - 将"格式说明"框改为"AI处理指南"

6. **优化用户界面文案**
   - 更新textarea占位符文本
   - 调整按钮和提示文本

## Phase 3: 优化AI处理逻辑
7. **改进geminiService提示词**
   - 明确指定以英文标点符号为断句依据
   - 优化中英文对齐逻辑

8. **完善错误处理**
   - 确保错误信息能正确传递到前端
   - 提供更具体的操作指导

## Phase 4: 测试和验证
9. **编写功能测试**
   - 测试API密钥验证流程
   - 测试AI文本处理功能
   - 测试错误处理和用户反馈

10. **创建文档总结**
    - 记录所有修改内容
    - 总结用户体验改进
    - 提供使用指南

## 具体实施命令
```bash
# 运行相关测试
npm test src/tests/ai-bulk-import-*.test.tsx
npm test src/tests/bulk-import*.test.tsx

# 验证构建
npm run build

# 运行完整测试套件
npm test
``` 