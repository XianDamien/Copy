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
        
        // 权限配置
        permissions: [
          'activeTab',
          'scripting',
          'storage',
          'alarms',
          'unlimitedStorage'
        ],
        
        // 可选权限（用于AI功能） - 暂时移除避免类型错误
        
        // 后台脚本 (Service Worker)
        background: {
          service_worker: 'src/background/index.ts',
          type: 'module'
        },
        
        // 弹窗界面
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
        
        // 设置页面
        options_page: 'src/options/index.html',
        
        // 内容脚本
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['src/content/index.tsx'],
            css: ['src/content/content.css'],
            run_at: 'document_end'
          }
        ],
        
        // Web可访问资源
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
        
        // 图标配置
        icons: {
          '16': 'icons/icon16.png',
          '32': 'icons/icon32.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      
      // 额外的入口文件
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
        options: resolve(__dirname, 'src/options/index.html'),
        main: resolve(__dirname, 'src/main/index.html')
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    strictPort: true
  }
}); 