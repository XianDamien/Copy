var T;(function(t){t.STRING="string",t.NUMBER="number",t.INTEGER="integer",t.BOOLEAN="boolean",t.ARRAY="array",t.OBJECT="object"})(T||(T={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var w;(function(t){t.LANGUAGE_UNSPECIFIED="language_unspecified",t.PYTHON="python"})(w||(w={}));var b;(function(t){t.OUTCOME_UNSPECIFIED="outcome_unspecified",t.OUTCOME_OK="outcome_ok",t.OUTCOME_FAILED="outcome_failed",t.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(b||(b={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const M=["user","model","function","system"];var D;(function(t){t.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",t.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",t.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",t.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",t.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",t.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(D||(D={}));var L;(function(t){t.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",t.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",t.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",t.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",t.BLOCK_NONE="BLOCK_NONE"})(L||(L={}));var G;(function(t){t.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",t.NEGLIGIBLE="NEGLIGIBLE",t.LOW="LOW",t.MEDIUM="MEDIUM",t.HIGH="HIGH"})(G||(G={}));var x;(function(t){t.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",t.SAFETY="SAFETY",t.OTHER="OTHER"})(x||(x={}));var p;(function(t){t.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",t.STOP="STOP",t.MAX_TOKENS="MAX_TOKENS",t.SAFETY="SAFETY",t.RECITATION="RECITATION",t.LANGUAGE="LANGUAGE",t.BLOCKLIST="BLOCKLIST",t.PROHIBITED_CONTENT="PROHIBITED_CONTENT",t.SPII="SPII",t.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",t.OTHER="OTHER"})(p||(p={}));var U;(function(t){t.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",t.RETRIEVAL_QUERY="RETRIEVAL_QUERY",t.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",t.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",t.CLASSIFICATION="CLASSIFICATION",t.CLUSTERING="CLUSTERING"})(U||(U={}));var H;(function(t){t.MODE_UNSPECIFIED="MODE_UNSPECIFIED",t.AUTO="AUTO",t.ANY="ANY",t.NONE="NONE"})(H||(H={}));var F;(function(t){t.MODE_UNSPECIFIED="MODE_UNSPECIFIED",t.MODE_DYNAMIC="MODE_DYNAMIC"})(F||(F={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class O extends u{constructor(e,n){super(e),this.response=n}}class q extends u{constructor(e,n,s,o){super(e),this.status=n,this.statusText=s,this.errorDetails=o}}class _ extends u{}class V extends u{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Q="https://generativelanguage.googleapis.com",z="v1beta",Z="0.24.1",tt="genai-js";var I;(function(t){t.GENERATE_CONTENT="generateContent",t.STREAM_GENERATE_CONTENT="streamGenerateContent",t.COUNT_TOKENS="countTokens",t.EMBED_CONTENT="embedContent",t.BATCH_EMBED_CONTENTS="batchEmbedContents"})(I||(I={}));class et{constructor(e,n,s,o,i){this.model=e,this.task=n,this.apiKey=s,this.stream=o,this.requestOptions=i}toString(){var e,n;const s=((e=this.requestOptions)===null||e===void 0?void 0:e.apiVersion)||z;let i=`${((n=this.requestOptions)===null||n===void 0?void 0:n.baseUrl)||Q}/${s}/${this.model}:${this.task}`;return this.stream&&(i+="?alt=sse"),i}}function nt(t){const e=[];return t?.apiClient&&e.push(t.apiClient),e.push(`${tt}/${Z}`),e.join(" ")}async function st(t){var e;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",nt(t.requestOptions)),n.append("x-goog-api-key",t.apiKey);let s=(e=t.requestOptions)===null||e===void 0?void 0:e.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(o){throw new _(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${o.message}`)}for(const[o,i]of s.entries()){if(o==="x-goog-api-key")throw new _(`Cannot set reserved header name ${o}`);if(o==="x-goog-api-client")throw new _(`Header name ${o} can only be set using the apiClient field`);n.append(o,i)}}return n}async function ot(t,e,n,s,o,i){const r=new et(t,e,n,s,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},ct(i)),{method:"POST",headers:await st(r),body:o})}}async function y(t,e,n,s,o,i={},r=fetch){const{url:a,fetchOptions:c}=await ot(t,e,n,s,o,i);return it(a,c,r)}async function it(t,e,n=fetch){let s;try{s=await n(t,e)}catch(o){rt(o,t)}return s.ok||await at(s,t),s}function rt(t,e){let n=t;throw n.name==="AbortError"?(n=new V(`Request aborted when fetching ${e.toString()}: ${t.message}`),n.stack=t.stack):t instanceof q||t instanceof _||(n=new u(`Error fetching from ${e.toString()}: ${t.message}`),n.stack=t.stack),n}async function at(t,e){let n="",s;try{const o=await t.json();n=o.error.message,o.error.details&&(n+=` ${JSON.stringify(o.error.details)}`,s=o.error.details)}catch{}throw new q(`Error fetching from ${e.toString()}: [${t.status} ${t.statusText}] ${n}`,t.status,t.statusText,s)}function ct(t){const e={};if(t?.signal!==void 0||t?.timeout>=0){const n=new AbortController;t?.timeout>=0&&setTimeout(()=>n.abort(),t.timeout),t?.signal&&t.signal.addEventListener("abort",()=>{n.abort()}),e.signal=n.signal}return e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function N(t){return t.text=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1&&console.warn(`This response had ${t.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),S(t.candidates[0]))throw new O(`${C(t)}`,t);return lt(t)}else if(t.promptFeedback)throw new O(`Text not available. ${C(t)}`,t);return""},t.functionCall=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1&&console.warn(`This response had ${t.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),S(t.candidates[0]))throw new O(`${C(t)}`,t);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),$(t)[0]}else if(t.promptFeedback)throw new O(`Function call not available. ${C(t)}`,t)},t.functionCalls=()=>{if(t.candidates&&t.candidates.length>0){if(t.candidates.length>1&&console.warn(`This response had ${t.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),S(t.candidates[0]))throw new O(`${C(t)}`,t);return $(t)}else if(t.promptFeedback)throw new O(`Function call not available. ${C(t)}`,t)},t}function lt(t){var e,n,s,o;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(o=(s=t.candidates)===null||s===void 0?void 0:s[0].content)===null||o===void 0?void 0:o.parts)r.text&&i.push(r.text),r.executableCode&&i.push("\n```"+r.executableCode.language+`
`+r.executableCode.code+"\n```\n"),r.codeExecutionResult&&i.push("\n```\n"+r.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}function $(t){var e,n,s,o;const i=[];if(!((n=(e=t.candidates)===null||e===void 0?void 0:e[0].content)===null||n===void 0)&&n.parts)for(const r of(o=(s=t.candidates)===null||s===void 0?void 0:s[0].content)===null||o===void 0?void 0:o.parts)r.functionCall&&i.push(r.functionCall);if(i.length>0)return i}const dt=[p.RECITATION,p.SAFETY,p.LANGUAGE];function S(t){return!!t.finishReason&&dt.includes(t.finishReason)}function C(t){var e,n,s;let o="";if((!t.candidates||t.candidates.length===0)&&t.promptFeedback)o+="Response was blocked",!((e=t.promptFeedback)===null||e===void 0)&&e.blockReason&&(o+=` due to ${t.promptFeedback.blockReason}`),!((n=t.promptFeedback)===null||n===void 0)&&n.blockReasonMessage&&(o+=`: ${t.promptFeedback.blockReasonMessage}`);else if(!((s=t.candidates)===null||s===void 0)&&s[0]){const i=t.candidates[0];S(i)&&(o+=`Candidate was blocked due to ${i.finishReason}`,i.finishMessage&&(o+=`: ${i.finishMessage}`))}return o}function A(t){return this instanceof A?(this.v=t,this):new A(t)}function ut(t,e,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var s=n.apply(t,e||[]),o,i=[];return o={},r("next"),r("throw"),r("return"),o[Symbol.asyncIterator]=function(){return this},o;function r(d){s[d]&&(o[d]=function(l){return new Promise(function(f,v){i.push([d,l,f,v])>1||a(d,l)})})}function a(d,l){try{c(s[d](l))}catch(f){g(i[0][3],f)}}function c(d){d.value instanceof A?Promise.resolve(d.value.v).then(h,E):g(i[0][2],d)}function h(d){a("next",d)}function E(d){a("throw",d)}function g(d,l){d(l),i.shift(),i.length&&a(i[0][0],i[0][1])}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const j=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function ft(t){const e=t.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),n=Et(e),[s,o]=n.tee();return{stream:gt(s),response:ht(o)}}async function ht(t){const e=[],n=t.getReader();for(;;){const{done:s,value:o}=await n.read();if(s)return N(Ct(e));e.push(o)}}function gt(t){return ut(this,arguments,function*(){const n=t.getReader();for(;;){const{value:s,done:o}=yield A(n.read());if(o)break;yield yield A(N(s))}})}function Et(t){const e=t.getReader();return new ReadableStream({start(s){let o="";return i();function i(){return e.read().then(({value:r,done:a})=>{if(a){if(o.trim()){s.error(new u("Failed to parse stream"));return}s.close();return}o+=r;let c=o.match(j),h;for(;c;){try{h=JSON.parse(c[1])}catch{s.error(new u(`Error parsing JSON response: "${c[1]}"`));return}s.enqueue(h),o=o.substring(c[0].length),c=o.match(j)}return i()}).catch(r=>{let a=r;throw a.stack=r.stack,a.name==="AbortError"?a=new V("Request aborted when reading from the stream"):a=new u("Error reading from the stream"),a})}}})}function Ct(t){const e=t[t.length-1],n={promptFeedback:e?.promptFeedback};for(const s of t){if(s.candidates){let o=0;for(const i of s.candidates)if(n.candidates||(n.candidates=[]),n.candidates[o]||(n.candidates[o]={index:o}),n.candidates[o].citationMetadata=i.citationMetadata,n.candidates[o].groundingMetadata=i.groundingMetadata,n.candidates[o].finishReason=i.finishReason,n.candidates[o].finishMessage=i.finishMessage,n.candidates[o].safetyRatings=i.safetyRatings,i.content&&i.content.parts){n.candidates[o].content||(n.candidates[o].content={role:i.content.role||"user",parts:[]});const r={};for(const a of i.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),a.executableCode&&(r.executableCode=a.executableCode),a.codeExecutionResult&&(r.codeExecutionResult=a.codeExecutionResult),Object.keys(r).length===0&&(r.text=""),n.candidates[o].content.parts.push(r)}o++}s.usageMetadata&&(n.usageMetadata=s.usageMetadata)}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function J(t,e,n,s){const o=await y(e,I.STREAM_GENERATE_CONTENT,t,!0,JSON.stringify(n),s);return ft(o)}async function X(t,e,n,s){const i=await(await y(e,I.GENERATE_CONTENT,t,!1,JSON.stringify(n),s)).json();return{response:N(i)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function W(t){if(t!=null){if(typeof t=="string")return{role:"system",parts:[{text:t}]};if(t.text)return{role:"system",parts:[t]};if(t.parts)return t.role?t:{role:"system",parts:t.parts}}}function R(t){let e=[];if(typeof t=="string")e=[{text:t}];else for(const n of t)typeof n=="string"?e.push({text:n}):e.push(n);return _t(e)}function _t(t){const e={role:"user",parts:[]},n={role:"function",parts:[]};let s=!1,o=!1;for(const i of t)"functionResponse"in i?(n.parts.push(i),o=!0):(e.parts.push(i),s=!0);if(s&&o)throw new u("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!o)throw new u("No content is provided for sending chat message.");return s?e:n}function It(t,e){var n;let s={model:e?.model,generationConfig:e?.generationConfig,safetySettings:e?.safetySettings,tools:e?.tools,toolConfig:e?.toolConfig,systemInstruction:e?.systemInstruction,cachedContent:(n=e?.cachedContent)===null||n===void 0?void 0:n.name,contents:[]};const o=t.generateContentRequest!=null;if(t.contents){if(o)throw new _("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=t.contents}else if(o)s=Object.assign(Object.assign({},s),t.generateContentRequest);else{const i=R(t);s.contents=[i]}return{generateContentRequest:s}}function P(t){let e;return t.contents?e=t:e={contents:[R(t)]},t.systemInstruction&&(e.systemInstruction=W(t.systemInstruction)),e}function vt(t){return typeof t=="string"||Array.isArray(t)?{content:R(t)}:t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const k=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Ot={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function pt(t){let e=!1;for(const n of t){const{role:s,parts:o}=n;if(!e&&s!=="user")throw new u(`First content should be with role 'user', got ${s}`);if(!M.includes(s))throw new u(`Each item should include role field. Got ${s} but valid roles are: ${JSON.stringify(M)}`);if(!Array.isArray(o))throw new u("Content should have 'parts' property with an array of Parts");if(o.length===0)throw new u("Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const a of o)for(const c of k)c in a&&(i[c]+=1);const r=Ot[s];for(const a of k)if(!r.includes(a)&&i[a]>0)throw new u(`Content with role '${s}' can't contain '${a}' part`);e=!0}}function K(t){var e;if(t.candidates===void 0||t.candidates.length===0)return!1;const n=(e=t.candidates[0])===null||e===void 0?void 0:e.content;if(n===void 0||n.parts===void 0||n.parts.length===0)return!1;for(const s of n.parts)if(s===void 0||Object.keys(s).length===0||s.text!==void 0&&s.text==="")return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y="SILENT_ERROR";class At{constructor(e,n,s,o={}){this.model=n,this.params=s,this._requestOptions=o,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,s?.history&&(pt(s.history),this._history=s.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,n={}){var s,o,i,r,a,c;await this._sendPromise;const h=R(e),E={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,h]},g=Object.assign(Object.assign({},this._requestOptions),n);let d;return this._sendPromise=this._sendPromise.then(()=>X(this._apiKey,this.model,E,g)).then(l=>{var f;if(K(l.response)){this._history.push(h);const v=Object.assign({parts:[],role:"model"},(f=l.response.candidates)===null||f===void 0?void 0:f[0].content);this._history.push(v)}else{const v=C(l.response);v&&console.warn(`sendMessage() was unsuccessful. ${v}. Inspect response object for details.`)}d=l}).catch(l=>{throw this._sendPromise=Promise.resolve(),l}),await this._sendPromise,d}async sendMessageStream(e,n={}){var s,o,i,r,a,c;await this._sendPromise;const h=R(e),E={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(o=this.params)===null||o===void 0?void 0:o.generationConfig,tools:(i=this.params)===null||i===void 0?void 0:i.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,h]},g=Object.assign(Object.assign({},this._requestOptions),n),d=J(this._apiKey,this.model,E,g);return this._sendPromise=this._sendPromise.then(()=>d).catch(l=>{throw new Error(Y)}).then(l=>l.response).then(l=>{if(K(l)){this._history.push(h);const f=Object.assign({},l.candidates[0].content);f.role||(f.role="model"),this._history.push(f)}else{const f=C(l);f&&console.warn(`sendMessageStream() was unsuccessful. ${f}. Inspect response object for details.`)}}).catch(l=>{l.message!==Y&&console.error(l)}),d}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rt(t,e,n,s){return(await y(e,I.COUNT_TOKENS,t,!1,JSON.stringify(n),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yt(t,e,n,s){return(await y(e,I.EMBED_CONTENT,t,!1,JSON.stringify(n),s)).json()}async function St(t,e,n,s){const o=n.requests.map(r=>Object.assign(Object.assign({},r),{model:e}));return(await y(e,I.BATCH_EMBED_CONTENTS,t,!1,JSON.stringify({requests:o}),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class B{constructor(e,n,s={}){this.apiKey=e,this._requestOptions=s,n.model.includes("/")?this.model=n.model:this.model=`models/${n.model}`,this.generationConfig=n.generationConfig||{},this.safetySettings=n.safetySettings||[],this.tools=n.tools,this.toolConfig=n.toolConfig,this.systemInstruction=W(n.systemInstruction),this.cachedContent=n.cachedContent}async generateContent(e,n={}){var s;const o=P(e),i=Object.assign(Object.assign({},this._requestOptions),n);return X(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},o),i)}async generateContentStream(e,n={}){var s;const o=P(e),i=Object.assign(Object.assign({},this._requestOptions),n);return J(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},o),i)}startChat(e){var n;return new At(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(n=this.cachedContent)===null||n===void 0?void 0:n.name},e),this._requestOptions)}async countTokens(e,n={}){const s=It(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),o=Object.assign(Object.assign({},this._requestOptions),n);return Rt(this.apiKey,this.model,s,o)}async embedContent(e,n={}){const s=vt(e),o=Object.assign(Object.assign({},this._requestOptions),n);return yt(this.apiKey,this.model,s,o)}async batchEmbedContents(e,n={}){const s=Object.assign(Object.assign({},this._requestOptions),n);return St(this.apiKey,this.model,e,s)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m{constructor(e){this.apiKey=e}getGenerativeModel(e,n){if(!e.model)throw new u("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new B(this.apiKey,e,n)}getGenerativeModelFromCachedContent(e,n,s){if(!e.name)throw new _("Cached content must contain a `name` field.");if(!e.model)throw new _("Cached content must contain a `model` field.");const o=["model","systemInstruction"];for(const r of o)if(n?.[r]&&e[r]&&n?.[r]!==e[r]){if(r==="model"){const a=n.model.startsWith("models/")?n.model.replace("models/",""):n.model,c=e.model.startsWith("models/")?e.model.replace("models/",""):e.model;if(a===c)continue}throw new _(`Different value for "${r}" specified in modelParams (${n[r]}) and cachedContent (${e[r]})`)}const i=Object.assign(Object.assign({},n),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new B(this.apiKey,i,s)}}class mt{constructor(e){this.genAI=null,e&&(this.genAI=new m(e))}async validateApiKey(e){try{return(await(await new m(e).getGenerativeModel({model:"gemini-pro"}).generateContent("Hello")).response).text()?{valid:!0}:{valid:!1,error:"API响应异常"}}catch(n){return console.error("API密钥验证失败:",n),n.message?.includes("API_KEY_INVALID")?{valid:!1,error:"API密钥无效"}:n.message?.includes("QUOTA_EXCEEDED")?{valid:!1,error:"API配额已用完"}:n.message?.includes("PERMISSION_DENIED")?{valid:!1,error:"API访问权限被拒绝"}:{valid:!1,error:`验证失败: ${n.message||"未知错误"}`}}}async processTextForCards(e,n){try{if(!n)return{success:!1,error:"请先设置Gemini API密钥"};this.genAI=new m(n);const s=this.genAI.getGenerativeModel({model:"gemini-pro"}),o=`
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
${e}

请返回JSON格式的结果，例如：
[
  {"front": "Hello", "back": "你好"},
  {"front": "How are you?", "back": "你好吗？"}
]
`,a=(await(await s.generateContent(o)).response).text();try{const c=a.match(/\[[\s\S]*\]/);if(!c)throw new Error("未找到有效的JSON响应");const h=JSON.parse(c[0]);if(!Array.isArray(h))throw new Error("响应格式不正确，期望数组格式");const E=h.filter(g=>g&&typeof g=="object"&&typeof g.front=="string"&&typeof g.back=="string"&&g.front.trim().length>=3&&g.back.trim().length>=3);return E.length===0?{success:!1,error:"未能从文本中提取到有效的句子对"}:{success:!0,data:E}}catch(c){return console.error("解析AI响应失败:",c),{success:!1,error:`AI响应解析失败: ${c instanceof Error?c.message:"未知错误"}`}}}catch(s){return console.error("AI文本处理失败:",s),s.message?.includes("API_KEY_INVALID")?{success:!1,error:"API密钥无效，请检查设置"}:s.message?.includes("QUOTA_EXCEEDED")?{success:!1,error:"API配额已用完，请稍后再试"}:s.message?.includes("PERMISSION_DENIED")?{success:!1,error:"API访问权限被拒绝"}:{success:!1,error:`处理失败: ${s.message||"未知错误"}`}}}}const Nt=new mt;export{mt as GeminiService,Nt as geminiService};
