import React, { useEffect, useRef } from 'react';
import { Copy, X, Sparkles, CheckCircle } from 'lucide-react';
import type { AIInsightResponse, OverlayPosition } from '../../../shared/types/aiTypes';

export interface AIInsightOverlayProps {
  isVisible: boolean;
  response?: AIInsightResponse;
  position?: OverlayPosition;
  onDismiss: () => void;
  onCopy?: (text: string) => void;
}

export const AIInsightOverlay: React.FC<AIInsightOverlayProps> = ({
  isVisible,
  response,
  position = { x: 0, y: 0, placement: 'bottom' },
  onDismiss,
  onCopy
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onDismiss]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onDismiss]);

  // Reset copied state when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setCopied(false);
    }
  }, [isVisible]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);
      
      // Reset copy state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isVisible || !response) {
    return null;
  }

  // Calculate position styles
  const getPositionStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position.placement) {
      case 'top':
        styles.left = position.x;
        styles.bottom = window.innerHeight - position.y + 10;
        break;
      case 'bottom':
        styles.left = position.x;
        styles.top = position.y + 10;
        break;
      case 'left':
        styles.right = window.innerWidth - position.x + 10;
        styles.top = position.y;
        break;
      case 'right':
        styles.left = position.x + 10;
        styles.top = position.y;
        break;
      default:
        styles.left = position.x;
        styles.top = position.y + 10;
    }

    return styles;
  };

  return (
    <div
      ref={overlayRef}
      style={getPositionStyles()}
      className="bg-white border border-primary-200 rounded-lg shadow-lg max-w-sm w-80 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-purple-50 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-purple-900">AI 助手</span>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            {response.action === 'define' && '定义'}
            {response.action === 'explain' && '解释'}
            {response.action === 'translate' && '翻译'}
            {response.action === 'grammar' && '语法'}
            {response.action === 'context' && '理解'}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-purple-400 hover:text-purple-600 transition-colors"
          title="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Selected text */}
        <div className="bg-primary-50 rounded p-2">
          <div className="text-xs text-primary-600 mb-1">选中文本</div>
          <div className="text-sm font-medium text-primary-900">
            "{response.selectedText}"
          </div>
        </div>

        {/* AI Insight */}
        <div>
          <div className="text-xs text-primary-600 mb-2">AI 见解</div>
          <div className="text-sm text-primary-900 leading-relaxed">
            {response.insight}
          </div>
        </div>

        {/* Suggestion (if available) */}
        {response.suggestion && (
          <div>
            <div className="text-xs text-accent-600 mb-2">建议</div>
            <div className="text-sm text-accent-700 leading-relaxed bg-accent-50 rounded p-2">
              {response.suggestion}
            </div>
          </div>
        )}

        {/* Examples (if available) */}
        {response.examples && response.examples.length > 0 && (
          <div>
            <div className="text-xs text-primary-600 mb-2">示例</div>
            <div className="space-y-1">
              {response.examples.map((example: string, index: number) => (
                <div key={index} className="text-sm text-primary-700 italic">
                  • {example}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence indicator (if available) */}
        {response.confidence !== undefined && (
          <div className="text-xs text-primary-500">
            置信度: {Math.round(response.confidence * 100)}%
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-3 bg-primary-50 border-t border-primary-100">
        <div className="text-xs text-primary-500">
          {new Date(response.timestamp).toLocaleTimeString()}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(response.insight)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
            title={copied ? '已复制' : '复制到剪贴板'}
          >
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightOverlay; 