export interface ProcessedTextResult {
  success: boolean;
  data?: Array<{
    front: string;
    back: string;
  }>;
  error?: string;
}

export class GeminiService {
  constructor() {
    // 移除了对@google/generative-ai SDK的依赖
    // 改用原生fetch API实现
  }

  /**
   * 验证API密钥是否有效
   */
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Hello"
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API密钥验证失败:', response.status, errorData);
        
        if (response.status === 400) {
          return { valid: false, error: "API密钥格式无效" };
        } else if (response.status === 403) {
          return { valid: false, error: "API密钥无效或权限被拒绝" };
        } else if (response.status === 429) {
          return { valid: false, error: "API配额已用完" };
        } else {
          return { valid: false, error: `验证失败: HTTP ${response.status}` };
        }
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return { valid: true };
      } else {
        return { valid: false, error: "API响应异常" };
      }
    } catch (error: any) {
      console.error('API密钥验证失败:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { valid: false, error: "网络连接失败，请检查网络连接" };
      } else {
        return { valid: false, error: `验证失败: ${error.message || '未知错误'}` };
      }
    }
  }

  /**
   * 处理文本，自动识别和配对中英文句子
   */
  async processTextForCards(text: string, apiKey: string): Promise<ProcessedTextResult> {
    try {
      if (!apiKey) {
        return {
          success: false,
          error: "请先设置Gemini API密钥"
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const prompt = `
请分析以下文本，自动识别其中的中英文句子对，并将它们配对成学习卡片。

要求：
1. 识别文本中的中文句子和对应的英文句子
2. 如果是中英对照文本，请正确配对
3. 优先以英文句子中的句号（.）、问号（?）、感叹号（!）作为断句和配对的依据
4. 如果只有一种语言，请提供合理的翻译
5. 每个句子对应一张卡片
6. 过滤掉过短的句子（少于3个字符）
7. 返回JSON格式，包含front（问题面）和back（答案面）

文本内容：
${text}

请返回JSON格式的结果，例如：
[
  {"front": "Hello", "back": "你好"},
  {"front": "How are you?", "back": "你好吗？"}
]
`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI文本处理失败:', response.status, errorData);
        
        if (response.status === 400) {
          return {
            success: false,
            error: "请求格式错误，请稍后重试"
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: "API密钥无效，请检查设置"
          };
        } else if (response.status === 429) {
          return {
            success: false,
            error: "API配额已用完，请稍后再试"
          };
        } else {
          return {
            success: false,
            error: `处理失败: HTTP ${response.status}`
          };
        }
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        return {
          success: false,
          error: "AI未返回有效响应"
        };
      }

      const responseText = data.candidates[0].content.parts[0].text;

      // 尝试解析JSON响应
      try {
        // 提取JSON部分（可能包含在代码块中）
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('未找到有效的JSON响应');
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        
        if (!Array.isArray(parsedData)) {
          throw new Error('响应格式不正确，期望数组格式');
        }

        // 验证数据格式
        const validCards = parsedData.filter(item => 
          item && 
          typeof item === 'object' && 
          typeof item.front === 'string' && 
          typeof item.back === 'string' &&
          item.front.trim().length >= 2 &&
          item.back.trim().length >= 2
        );

        if (validCards.length === 0) {
          return {
            success: false,
            error: "未能从文本中提取到有效的句子对"
          };
        }

        return {
          success: true,
          data: validCards
        };

      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        return {
          success: false,
          error: `AI响应解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`
        };
      }

    } catch (error: any) {
      console.error('AI文本处理失败:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: "网络连接失败，请检查网络连接"
        };
      } else {
        return {
          success: false,
          error: `处理失败: ${error.message || '未知错误'}`
        };
      }
    }
  }
}

// 导出单例实例
export const geminiService = new GeminiService(); 