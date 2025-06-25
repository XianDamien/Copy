import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TaskDisplay from '../main/components/review/TaskDisplay';

describe('TaskDisplay - HTML Rendering', () => {
  it('should render HTML tags correctly in original text', () => {
    const htmlText = '戏<p>很有意思</p>';
    
    render(<TaskDisplay originalText={htmlText} />);
    
    // 检查HTML是否被正确渲染（不应该显示标签）
    expect(screen.getByText('戏')).toBeInTheDocument();
    expect(screen.getByText('很有意思')).toBeInTheDocument();
    
    // 确保HTML标签没有被直接显示
    expect(screen.queryByText('<p>')).not.toBeInTheDocument();
    expect(screen.queryByText('</p>')).not.toBeInTheDocument();
  });

  it('should render plain text without HTML tags correctly', () => {
    const plainText = '简单的中文文本';
    
    render(<TaskDisplay originalText={plainText} />);
    
    expect(screen.getByText('简单的中文文本')).toBeInTheDocument();
  });

  it('should render complex HTML structure correctly', () => {
    const complexHtml = '<strong>重要：</strong><em>这是一个</em><u>测试</u>';
    
    render(<TaskDisplay originalText={complexHtml} />);
    
    // 检查文本内容是否正确显示
    expect(screen.getByText('重要：')).toBeInTheDocument();
    expect(screen.getByText('这是一个')).toBeInTheDocument();
    expect(screen.getByText('测试')).toBeInTheDocument();
    
    // 确保HTML标签没有被直接显示
    expect(screen.queryByText('<strong>')).not.toBeInTheDocument();
    expect(screen.queryByText('<em>')).not.toBeInTheDocument();
    expect(screen.queryByText('<u>')).not.toBeInTheDocument();
  });

  it('should display the instruction text correctly', () => {
    render(<TaskDisplay originalText="测试文本" />);
    
    expect(screen.getByText('请翻译以下内容：')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<TaskDisplay originalText="测试" />);
    
    // 检查主容器的样式类
    const mainContainer = container.querySelector('.bg-white.rounded-lg.shadow-sm');
    expect(mainContainer).toBeInTheDocument();
    
    // 检查内容区域的样式类
    const contentArea = container.querySelector('.bg-primary-50.rounded-md');
    expect(contentArea).toBeInTheDocument();
  });
});
