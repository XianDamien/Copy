import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from '@samrum/vite-plugin-web-extension';
import { resolve } from 'path';

const packageJson = {
  name: 'LanGear Language Extension',
  version: '1.0.0',
  description: '🔧 工业级智能语言学习Chrome扩展',
};

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
        manifest_version: 3,
        
        permissions: [
          'activeTab',
          'scripting',
          'storage',
          'alarms',
          'unlimitedStorage'
        ],
        
        host_permissions: [
          'https://generativelanguage.googleapis.com/*'
        ],
        
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self'; connect-src https://generativelanguage.googleapis.com;"
        },
        
        background: {
          service_worker: 'src/background/index.ts',
          type: 'module'
        },
        
        action: {
          default_popup: 'src/popup/index.html',
          default_title: 'LanGear Language Extension',
          default_icon: {
            '16': 'icons/icon16.png',
            '32': 'icons/icon32.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png'
          }
        },
        
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['src/content/index.tsx'],
            css: ['src/content/content.css'],
            run_at: 'document_end'
          }
        ],
        
        web_accessible_resources: [
          {
            resources: [
              'src/main/index.html',
              'assets/*',
              'icons/*'
            ],
            matches: ['<all_urls>']
          }
        ],
        
        icons: {
          '16': 'icons/icon16.png',
          '32': 'icons/icon32.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      
      additionalInputs: {
        html: [
          'src/main/index.html'
        ]
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@components': resolve(__dirname, 'src/shared/components'),
      '@utils': resolve(__dirname, 'src/shared/utils'),
      '@types': resolve(__dirname, 'src/shared/types')
    }
  },
  
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        main: resolve(__dirname, 'src/main/index.html')
      }
    }
  },
  
  // 开发服务器配置
  server: {
    host: '127.0.0.1', // <-- 添加 host
    port: 3000,
    strictPort: true
  }
});