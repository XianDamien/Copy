/**
 * Vitest Test Setup
 * 全局测试环境配置
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import 'fake-indexeddb/auto';

// Mock Chrome Extension APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    id: 'test-extension-id',
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
  },
} as any;

// 设置全局Chrome API
(global as any).chrome = mockChrome;

// Vitest全局变量
(global as any).vi = vi;

// React全局变量
(global as any).React = React; 