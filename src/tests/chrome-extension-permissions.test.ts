import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Chrome Extension Permissions Configuration', () => {
  let manifest: any;

  beforeAll(() => {
    // 读取构建后的manifest.json文件
    const manifestPath = resolve(__dirname, '../../dist/manifest.json');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestContent);
  });

  it('should have correct manifest version', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('should include host_permissions for Gemini API', () => {
    expect(manifest.host_permissions).toBeDefined();
    expect(manifest.host_permissions).toContain('https://generativelanguage.googleapis.com/*');
  });

  it('should have content_security_policy configured', () => {
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();
  });

  it('should allow connections to Gemini API in CSP', () => {
    const csp = manifest.content_security_policy.extension_pages;
    expect(csp).toContain('https://generativelanguage.googleapis.com');
    expect(csp).toContain("connect-src 'self' https://generativelanguage.googleapis.com");
  });

  it('should have required basic permissions', () => {
    const requiredPermissions = ['activeTab', 'scripting', 'storage', 'alarms', 'unlimitedStorage'];
    requiredPermissions.forEach(permission => {
      expect(manifest.permissions).toContain(permission);
    });
  });

  it('should have background service worker configured', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBe('serviceWorker.js');
    expect(manifest.background.type).toBe('module');
  });

  it('should have proper extension structure', () => {
    expect(manifest.name).toBe('LanGear Language Extension');
    expect(manifest.description).toContain('工业级智能语言学习Chrome扩展');
    expect(manifest.version).toBe('1.0.0');
  });
});

describe('Gemini API Access Configuration', () => {
  it('should validate API URL format', () => {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const url = new URL(apiUrl);
    
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('generativelanguage.googleapis.com');
    expect(url.pathname).toContain('/v1beta/models/gemini-pro:generateContent');
  });

  it('should validate permission pattern matches API URL', () => {
    const permissionPattern = 'https://generativelanguage.googleapis.com/*';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    // 检查权限模式是否覆盖API URL
    const basePattern = permissionPattern.replace('/*', '');
    expect(apiUrl.startsWith(basePattern)).toBe(true);
  });
}); 