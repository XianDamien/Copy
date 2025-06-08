/* empty css                */class p{constructor(){this.popupContainer=null,this.shadowRoot=null,this.currentSelection=null,this.init()}init(){document.addEventListener("mouseup",this.handleMouseUp.bind(this)),document.addEventListener("keydown",this.handleKeyDown.bind(this)),document.addEventListener("click",this.handleClick.bind(this))}handleMouseUp(t){const e=window.getSelection();if(!e||e.isCollapsed){this.hidePopup();return}const n=e.toString().trim();if(n.length<2||n.length>200){this.hidePopup();return}if(!/[\u4e00-\u9fff]|[a-zA-Z]/.test(n)){this.hidePopup();return}const s=e.getRangeAt(0).getBoundingClientRect();this.currentSelection={text:n,rect:s},this.showPopup()}handleKeyDown(t){t.key==="Escape"&&this.hidePopup()}handleClick(t){this.popupContainer&&!this.popupContainer.contains(t.target)&&this.hidePopup()}showPopup(){if(!this.currentSelection)return;this.hidePopup(),this.popupContainer=document.createElement("div"),this.popupContainer.style.cssText=`
      position: fixed;
      z-index: 999999;
      pointer-events: none;
    `,this.shadowRoot=this.popupContainer.attachShadow({mode:"closed"});const t=document.createElement("style");t.textContent=`
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
    `,this.shadowRoot.appendChild(t);const e=document.createElement("div");e.className="angear-popup";const{rect:n}=this.currentSelection,o=n.bottom+window.scrollY+8,i=n.left+window.scrollX;e.style.cssText=`
      top: ${o}px;
      left: ${i}px;
    `,[{icon:"📖",text:"查词",className:"primary",action:()=>this.lookupWord()},{icon:"🔊",text:"发音",className:"",action:()=>this.playPronunciation()},{icon:"➕",text:"添加",className:"",action:()=>this.addToAnGear()}].forEach(r=>{const a=document.createElement("button");a.className=`angear-popup-button ${r.className}`,a.innerHTML=`${r.icon} ${r.text}`,a.addEventListener("click",r.action),e.appendChild(a)}),this.shadowRoot.appendChild(e),document.body.appendChild(this.popupContainer)}hidePopup(){this.popupContainer&&(document.body.removeChild(this.popupContainer),this.popupContainer=null,this.shadowRoot=null,this.currentSelection=null)}async lookupWord(){if(this.currentSelection){try{await chrome.runtime.sendMessage({type:"LOOKUP_WORD",payload:{text:this.currentSelection.text,source:"content_script"}})}catch(t){console.error("Failed to lookup word:",t)}this.hidePopup()}}async playPronunciation(){if(this.currentSelection){try{const t=new SpeechSynthesisUtterance(this.currentSelection.text);t.lang=this.detectLanguage(this.currentSelection.text),speechSynthesis.speak(t)}catch(t){console.error("Failed to play pronunciation:",t)}this.hidePopup()}}async addToAnGear(){if(this.currentSelection){try{await chrome.runtime.sendMessage({type:"ADD_TO_ANGEAR",payload:{text:this.currentSelection.text,context:this.getContext(),url:window.location.href,source:"content_script"}}),this.showNotification("已添加到 AnGear")}catch(t){console.error("Failed to add to AnGear:",t),this.showNotification("添加失败")}this.hidePopup()}}detectLanguage(t){return/[\u4e00-\u9fff]/.test(t)?"zh-CN":"en-US"}getContext(){const t=window.getSelection();if(!t||!t.rangeCount)return"";const e=t.getRangeAt(0),o=e.commonAncestorContainer.textContent||"",i=Math.max(0,e.startOffset-50),s=Math.min(o.length,e.endOffset+50);return o.substring(i,s)}showNotification(t){const e=document.createElement("div");e.style.cssText=`
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
    `,e.textContent=t,document.body.appendChild(e),setTimeout(()=>{document.body.contains(e)&&document.body.removeChild(e)},3e3)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{new p}):new p;
