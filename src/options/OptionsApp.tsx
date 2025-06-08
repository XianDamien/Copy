import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { Settings, Cog, Save } from 'lucide-react';
import { FSRSConfig } from '../shared/types';
import '../shared/styles/globals.css';

interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  autoPlayAudio: boolean;
  fsrs: FSRSConfig;
}

const defaultConfig: AppConfig = {
  theme: 'light',
  language: 'zh-CN',
  notifications: true,
  autoPlayAudio: true,
  fsrs: {
    requestRetention: 0.9,
    maximumInterval: 36500,
    easyBonus: 1.3,
    hardFactor: 1.2,
    enableShortTerm: false,
  }
};

const OptionsApp: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await chrome.storage.sync.get('appConfig');
      if (result.appConfig) {
        setConfig({ ...defaultConfig, ...result.appConfig });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const saveConfig = async () => {
    try {
      await chrome.storage.sync.set({ appConfig: config });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const updateFSRSConfig = (key: keyof FSRSConfig, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      fsrs: {
        ...prev.fsrs,
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* 头部 */}
      <header className="bg-primary-700 text-white shadow-industrial">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Cog className="w-8 h-8" />
            <h1 className="text-2xl font-bold">AnGear 设置</h1>
          </div>
          <p className="text-primary-200 mt-1">配置您的语言学习体验</p>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* 基础设置 */}
          <section className="card-industrial p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>基础设置</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  主题
                </label>
                <select
                  value={config.theme}
                  onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'auto' }))}
                  className="input-industrial"
                >
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                  <option value="auto">跟随系统</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  语言
                </label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as 'zh-CN' | 'en-US' }))}
                  className="input-industrial"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={config.notifications}
                  onChange={(e) => setConfig(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="w-4 h-4 text-accent-600 bg-primary-100 border-primary-300 rounded focus:ring-accent-500"
                />
                <label htmlFor="notifications" className="text-sm font-medium text-primary-700">
                  启用通知
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoPlayAudio"
                  checked={config.autoPlayAudio}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoPlayAudio: e.target.checked }))}
                  className="w-4 h-4 text-accent-600 bg-primary-100 border-primary-300 rounded focus:ring-accent-500"
                />
                <label htmlFor="autoPlayAudio" className="text-sm font-medium text-primary-700">
                  自动播放音频
                </label>
              </div>
            </div>
          </section>

          {/* FSRS 算法设置 */}
          <section className="card-industrial p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              FSRS 算法参数
            </h2>
            <p className="text-primary-600 text-sm mb-6">
              调整间隔重复算法参数以优化学习效果
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  期望记忆保持率 ({(config.fsrs.requestRetention * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="0.95"
                  step="0.01"
                  value={config.fsrs.requestRetention}
                  onChange={(e) => updateFSRSConfig('requestRetention', parseFloat(e.target.value))}
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-primary-500 mt-1">
                  <span>80%</span>
                  <span>95%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  最大复习间隔 (天)
                </label>
                <input
                  type="number"
                  min="365"
                  max="36500"
                  value={config.fsrs.maximumInterval}
                  onChange={(e) => updateFSRSConfig('maximumInterval', parseInt(e.target.value))}
                  className="input-industrial"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  简单加成因子
                </label>
                <input
                  type="number"
                  min="1.1"
                  max="2.0"
                  step="0.1"
                  value={config.fsrs.easyBonus}
                  onChange={(e) => updateFSRSConfig('easyBonus', parseFloat(e.target.value))}
                  className="input-industrial"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  困难惩罚因子
                </label>
                <input
                  type="number"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={config.fsrs.hardFactor}
                  onChange={(e) => updateFSRSConfig('hardFactor', parseFloat(e.target.value))}
                  className="input-industrial"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableShortTerm"
                    checked={config.fsrs.enableShortTerm || false}
                    onChange={(e) => updateFSRSConfig('enableShortTerm', e.target.checked)}
                    className="w-4 h-4 text-accent-600 bg-primary-100 border-primary-300 rounded focus:ring-accent-500"
                  />
                  <label htmlFor="enableShortTerm" className="text-sm font-medium text-primary-700">
                    启用短期记忆模式
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              className={`btn-primary flex items-center space-x-2 ${saved ? 'bg-success hover:bg-green-600' : ''}`}
            >
              <Save className="w-4 h-4" />
              <span>{saved ? '已保存' : '保存设置'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// 渲染应用
const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<OptionsApp />);
} 