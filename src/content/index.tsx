/**
 * AnGear Language Extension - Content Script
 * 划词助手功能实现
 */

import './content.css';

interface SelectionPopup {
  text: string;
  rect: DOMRect;
}

class AnGearContentScript {
  private popupContainer: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private currentSelection: SelectionPopup | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // 监听文本选择事件
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
  }

  private handleMouseUp(_event: MouseEvent) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      this.hidePopup();
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2 || selectedText.length > 200) {
      this.hidePopup();
      return;
    }

    // 检查是否是中英文文本
    const hasChineseOrEnglish = /[\u4e00-\u9fff]|[a-zA-Z]/.test(selectedText);
    if (!hasChineseOrEnglish) {
      this.hidePopup();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    this.currentSelection = {
      text: selectedText,
      rect: rect
    };

    this.showPopup();
  }

  private handleKeyDown(event: KeyboardEvent) {
    // ESC键隐藏弹窗
    if (event.key === 'Escape') {
      this.hidePopup();
    }
  }

  private handleClick(event: MouseEvent) {
    // 点击其他地方隐藏弹窗
    if (this.popupContainer && !this.popupContainer.contains(event.target as Node)) {
      this.hidePopup();
    }
  }

  private showPopup() {
    if (!this.currentSelection) return;

    this.hidePopup();

    // 创建Shadow DOM容器
    this.popupContainer = document.createElement('div');
    this.popupContainer.style.cssText = `
      position: fixed;
      z-index: 999999;
      pointer-events: none;
    `;

    this.shadowRoot = this.popupContainer.attachShadow({ mode: 'closed' });
    
    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      .angear-popup {
        position: absolute;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 8px;
        display: flex;
        gap: 4px;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .angear-popup-button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 8px;
        border: none;
        border-radius: 4px;
        background: #f8fafc;
        color: #374151;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .angear-popup-button:hover {
        background: #e2e8f0;
      }
      
      .angear-popup-button.primary {
        background: #3b82f6;
        color: white;
      }
      
      .angear-popup-button.primary:hover {
        background: #2563eb;
      }
    `;
    
    this.shadowRoot.appendChild(style);

    // 创建弹窗内容
    const popupElement = document.createElement('div');
    popupElement.className = 'angear-popup';
    
    // 计算弹窗位置
    const { rect } = this.currentSelection;
    const popupTop = rect.bottom + window.scrollY + 8;
    const popupLeft = rect.left + window.scrollX;
    
    popupElement.style.cssText = `
      top: ${popupTop}px;
      left: ${popupLeft}px;
    `;

    // 添加按钮
    const buttons = [
      {
        icon: '📖',
        text: '查词',
        className: 'primary',
        action: () => this.lookupWord()
      },
      {
        icon: '🔊',
        text: '发音',
        className: '',
        action: () => this.playPronunciation()
      },
      {
        icon: '➕',
        text: '添加',
        className: '',
        action: () => this.addToAnGear()
      }
    ];

    buttons.forEach(button => {
      const buttonElement = document.createElement('button');
      buttonElement.className = `angear-popup-button ${button.className}`;
      buttonElement.innerHTML = `${button.icon} ${button.text}`;
      buttonElement.addEventListener('click', button.action);
      popupElement.appendChild(buttonElement);
    });

    this.shadowRoot.appendChild(popupElement);
    document.body.appendChild(this.popupContainer);
  }

  private hidePopup() {
    if (this.popupContainer) {
      document.body.removeChild(this.popupContainer);
      this.popupContainer = null;
      this.shadowRoot = null;
      this.currentSelection = null;
    }
  }

  private async lookupWord() {
    if (!this.currentSelection) return;

    // 发送消息到background script进行词典查询
    try {
      await chrome.runtime.sendMessage({
        type: 'LOOKUP_WORD',
        payload: {
          text: this.currentSelection.text,
          source: 'content_script'
        }
      });
    } catch (error) {
      console.error('Failed to lookup word:', error);
    }
    
    this.hidePopup();
  }

  private async playPronunciation() {
    if (!this.currentSelection) return;

    // 使用Web Speech API或发送到background script
    try {
      const utterance = new SpeechSynthesisUtterance(this.currentSelection.text);
      utterance.lang = this.detectLanguage(this.currentSelection.text);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to play pronunciation:', error);
    }
    
    this.hidePopup();
  }

  private async addToAnGear() {
    if (!this.currentSelection) return;

    // 发送消息到background script添加到AnGear
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_TO_ANGEAR',
        payload: {
          text: this.currentSelection.text,
          context: this.getContext(),
          url: window.location.href,
          source: 'content_script'
        }
      });
      
      // 显示成功提示
      this.showNotification('已添加到 AnGear');
    } catch (error) {
      console.error('Failed to add to AnGear:', error);
      this.showNotification('添加失败');
    }
    
    this.hidePopup();
  }

  private detectLanguage(text: string): string {
    // 简单的语言检测
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text) ? 'zh-CN' : 'en-US';
  }

  private getContext(): string {
    // 获取选中文本的上下文
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return '';

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const textContent = container.textContent || '';
    
    // 返回前后50字符作为上下文
    const start = Math.max(0, range.startOffset - 50);
    const end = Math.min(textContent.length, range.endOffset + 50);
    
    return textContent.substring(start, end);
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 999999;
      pointer-events: none;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}

// 初始化内容脚本
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AnGearContentScript();
  });
} else {
  new AnGearContentScript();
} 