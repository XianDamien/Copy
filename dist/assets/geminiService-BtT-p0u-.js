class g{constructor(){}async validateApiKey(n){try{const a=`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${n}`,e=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:"Hello"}]}]})});if(!e.ok){const t=await e.json().catch(()=>({}));return console.error("API密钥验证失败:",e.status,t),e.status===400?{valid:!1,error:"API密钥格式无效"}:e.status===403?{valid:!1,error:"API密钥无效或权限被拒绝"}:e.status===429?{valid:!1,error:"API配额已用完"}:{valid:!1,error:`验证失败: HTTP ${e.status}`}}const o=await e.json();return o.candidates&&o.candidates.length>0?{valid:!0}:{valid:!1,error:"API响应异常"}}catch(a){return console.error("API密钥验证失败:",a),a instanceof TypeError&&a.message.includes("fetch")?{valid:!1,error:"网络连接失败。请检查您的网络连接和CSP配置。"}:{valid:!1,error:"API密钥验证时发生未知错误。"}}}async processTextForCards(n,a){try{if(!a)return{success:!1,error:"请先设置Gemini API密钥"};const e=`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${a}`,o=`
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
`,t=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:o}]}]})});if(!t.ok){const i=await t.json().catch(()=>({}));return console.error("AI文本处理失败:",t.status,i),t.status===400?{success:!1,error:"请求格式错误，请稍后重试"}:t.status===403?{success:!1,error:"API密钥无效，请检查设置"}:t.status===429?{success:!1,error:"API配额已用完，请稍后再试"}:{success:!1,error:`处理失败: HTTP ${t.status}`}}const l=await t.json();if(!l.candidates||l.candidates.length===0)return{success:!1,error:"AI未返回有效响应"};const c=l.candidates[0].content.parts[0].text;try{const i=c.match(/\[[\s\S]*\]/);if(!i)throw new Error("未找到有效的JSON响应");const f=JSON.parse(i[0]);if(!Array.isArray(f))throw new Error("响应格式不正确，期望数组格式");const u=f.filter(d=>d&&typeof d=="object"&&typeof d.front=="string"&&typeof d.back=="string"&&d.front.trim().length>=2&&d.back.trim().length>=2);return u.length===0?{success:!1,error:"未能从文本中提取到有效的句子对"}:{success:!0,data:u}}catch(i){return console.error("解析AI响应失败:",i),{success:!1,error:`AI响应解析失败: ${i instanceof Error?i.message:"未知错误"}`}}}catch(e){return console.error("AI文本处理失败:",e),e instanceof TypeError&&e.message.includes("fetch")?{success:!1,error:"网络连接失败。请检查您的网络连接和CSP配置。"}:{success:!1,error:"AI文本处理时发生未知错误。"}}}async translateSubtitlesBatch(n,a,e){try{if(!a)return{success:!1,error:"请先设置Gemini API密钥"};if(!n||n.length===0)return{success:!1,error:"没有字幕条目需要翻译"};const o=[],t=5,l=Math.ceil(n.length/t);for(let c=0;c<l;c++){const i=c*t,f=Math.min(i+t,n.length),u=n.slice(i,f),d=Math.round(c/l*100);e&&e(d);try{const r=await this.translateBatch(u,a);r.success&&r.data?o.push(...r.data):u.forEach(s=>{o.push({id:s.id,originalText:s.text,translatedText:s.text,startTime:s.startTime,endTime:s.endTime})})}catch(r){console.error(`批次 ${c+1} 翻译失败:`,r),u.forEach(s=>{o.push({id:s.id,originalText:s.text,translatedText:s.text,startTime:s.startTime,endTime:s.endTime})})}c<l-1&&await new Promise(r=>setTimeout(r,1e3))}return e&&e(100),{success:!0,data:o,progress:100}}catch(o){return console.error("批量翻译失败:",o),{success:!1,error:`批量翻译失败: ${o.message||"未知错误"}`}}}async translateBatch(n,a){try{const e=`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${a}`,t=`
请将以下字幕文本翻译成中文。这些是视频字幕，请保持翻译的自然和口语化。

要求：
1. 逐行翻译，保持原有的编号
2. 翻译要自然、符合中文表达习惯
3. 保持原文的语气和情感
4. 对于专业术语，提供准确的中文翻译
5. 返回JSON格式的结果

原文：
${n.map((r,s)=>`${s+1}. ${r.text}`).join(`
`)}

请返回JSON格式，例如：
[
  {"index": 1, "translation": "翻译文本1"},
  {"index": 2, "translation": "翻译文本2"}
]
`,l=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:t}]}]})});if(!l.ok)throw new Error(`HTTP ${l.status}`);const c=await l.json();if(!c.candidates||c.candidates.length===0)throw new Error("AI未返回有效响应");const f=c.candidates[0].content.parts[0].text.match(/\[[\s\S]*\]/);if(!f)throw new Error("未找到有效的JSON响应");const u=JSON.parse(f[0]);if(!Array.isArray(u))throw new Error("翻译结果格式错误");return{success:!0,data:n.map((r,s)=>{const h=u.find(p=>p.index===s+1);return{id:r.id,originalText:r.text,translatedText:h?.translation||r.text,startTime:r.startTime,endTime:r.endTime}})}}catch(e){return console.error("批次翻译失败:",e),{success:!1,error:e.message||"翻译失败"}}}}const m=new g;export{g as GeminiService,m as geminiService};
