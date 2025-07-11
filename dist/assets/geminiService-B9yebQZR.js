class f{constructor(){}async validateApiKey(n){try{const s=`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${n}`,e=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"Hello"}]}]})});if(!e.ok){const r=await e.json().catch(()=>({}));return console.error("API密钥验证失败:",e.status,r),e.status===400?{valid:!1,error:"API密钥格式无效"}:e.status===403?{valid:!1,error:"API密钥无效或权限被拒绝"}:e.status===429?{valid:!1,error:"API配额已用完"}:{valid:!1,error:`验证失败: HTTP ${e.status}`}}const o=await e.json();return o.candidates&&o.candidates.length>0?{valid:!0}:{valid:!1,error:"API响应异常"}}catch(s){return console.error("API密钥验证失败:",s),s.name==="TypeError"&&s.message.includes("fetch")?{valid:!1,error:"网络连接失败，请检查网络连接"}:{valid:!1,error:`验证失败: ${s.message||"未知错误"}`}}}async processTextForCards(n,s){try{if(!s)return{success:!1,error:"请先设置Gemini API密钥"};const e=`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${s}`,o=`
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
${n}

请返回JSON格式的结果，例如：
[
  {"front": "Hello", "back": "你好"},
  {"front": "How are you?", "back": "你好吗？"}
]
`,r=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:o}]}]})});if(!r.ok){const t=await r.json().catch(()=>({}));return console.error("AI文本处理失败:",r.status,t),r.status===400?{success:!1,error:"请求格式错误，请稍后重试"}:r.status===403?{success:!1,error:"API密钥无效，请检查设置"}:r.status===429?{success:!1,error:"API配额已用完，请稍后再试"}:{success:!1,error:`处理失败: HTTP ${r.status}`}}const c=await r.json();if(!c.candidates||c.candidates.length===0)return{success:!1,error:"AI未返回有效响应"};const u=c.candidates[0].content.parts[0].text;try{const t=u.match(/\[[\s\S]*\]/);if(!t)throw new Error("未找到有效的JSON响应");const i=JSON.parse(t[0]);if(!Array.isArray(i))throw new Error("响应格式不正确，期望数组格式");const l=i.filter(a=>a&&typeof a=="object"&&typeof a.front=="string"&&typeof a.back=="string"&&a.front.trim().length>=2&&a.back.trim().length>=2);return l.length===0?{success:!1,error:"未能从文本中提取到有效的句子对"}:{success:!0,data:l}}catch(t){return console.error("解析AI响应失败:",t),{success:!1,error:`AI响应解析失败: ${t instanceof Error?t.message:"未知错误"}`}}}catch(e){return console.error("AI文本处理失败:",e),e.name==="TypeError"&&e.message.includes("fetch")?{success:!1,error:"网络连接失败，请检查网络连接"}:{success:!1,error:`处理失败: ${e.message||"未知错误"}`}}}}const p=new f;export{f as GeminiService,p as geminiService};
