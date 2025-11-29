"use strict";var GICMGrab=(()=>{var M=Object.defineProperty;var K=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var U=Object.prototype.hasOwnProperty;var j=(i,e)=>{for(var t in e)M(i,t,{get:e[t],enumerable:!0})},R=(i,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of O(e))!U.call(i,o)&&o!==t&&M(i,o,{get:()=>e[o],enumerable:!(n=K(e,o))||n.enumerable});return i};var F=i=>R(M({},"__esModule",{value:!0}),i);var Z={};j(Z,{ElementSelector:()=>h,Grabber:()=>d,KeyboardHandler:()=>u,buildClipboardText:()=>f,buildElementContext:()=>c,buildSummary:()=>x,default:()=>Q,destroy:()=>k,findFiberNode:()=>y,getComponentStack:()=>b,getInstance:()=>H,init:()=>g,isReactElement:()=>P});var v={enabled:!0,hue:280,borderColor:"",backgroundColor:"",label:{enabled:!0,backgroundColor:"",textColor:"#ffffff"}},I={enabled:!0,shortcutKey:"c",theme:v,gicmApiUrl:null,showSuggestions:!1},S=200,w=500,N=10,G=2e3,$=1e4,l={OVERLAY:"gicm-grab-overlay",LABEL:"gicm-grab-label",NOTIFICATION:"gicm-grab-notification",SUGGESTION_PANEL:"gicm-grab-suggestions"};var u=class{config;isMetaPressed=!1;isActive=!1;boundHandleKeyDown;boundHandleKeyUp;constructor(e){this.config=e,this.boundHandleKeyDown=this.handleKeyDown.bind(this),this.boundHandleKeyUp=this.handleKeyUp.bind(this)}start(){document.addEventListener("keydown",this.boundHandleKeyDown),document.addEventListener("keyup",this.boundHandleKeyUp),window.addEventListener("blur",()=>this.reset())}stop(){document.removeEventListener("keydown",this.boundHandleKeyDown),document.removeEventListener("keyup",this.boundHandleKeyUp)}handleKeyDown(e){(e.key==="Meta"||e.key==="Control")&&(this.isMetaPressed=!0),(e.metaKey||e.ctrlKey)&&e.key.toLowerCase()===this.config.shortcutKey.toLowerCase()&&!this.isActive&&(this.isActive=!0,this.config.onActivate())}handleKeyUp(e){(e.key==="Meta"||e.key==="Control")&&(this.isMetaPressed=!1,this.isActive&&(this.isActive=!1,this.config.onDeactivate()))}reset(){this.isMetaPressed=!1,this.isActive&&(this.isActive=!1,this.config.onDeactivate())}isActivated(){return this.isActive}};function y(i){let e=Object.keys(i).find(t=>t.startsWith("__reactFiber$")||t.startsWith("__reactInternalInstance$"));return e?i[e]:null}function P(i){return y(i)!==null}function b(i){let e=[],t=y(i),n=0;for(;t&&n<N;){if(t.type&&typeof t.type=="function"){let o=z(t),r=X(t);e.push({name:o,file:r.file,line:r.line,column:r.column})}t=t.return,n++}return e}function z(i){let e=i.type;if(!e)return"Unknown";if(e.displayName)return e.displayName;if(e.name)return e.name;if(e.$$typeof){let t=e.type||e.render;if(t)return t.displayName||t.name||"Anonymous"}return"Anonymous"}function X(i){let e=i._debugSource;return e?{file:B(e.fileName||""),line:e.lineNumber||0,column:e.columnNumber||0}:{file:"unknown",line:0,column:0}}function B(i){if(!i)return"unknown";let e=i.replace(/^webpack:\/\/[^/]+\//,"").replace(/^\/@fs/,"").replace(/^\//,""),t=e.match(/(?:src|components|app|pages)\/.*$/);if(t)return t[0];let n=e.split("/");return n.length>3?n.slice(-3).join("/"):e}function c(i){let e=i.tagName.toLowerCase(),t=q(i),n=W(i),o=V(i),r=Y(i),s=b(i),a=i.getBoundingClientRect();return{tagName:e,classes:t,attributes:n,textContent:o,innerHTML:r,componentStack:s,rect:a,element:i}}function f(i){let{tagName:e,classes:t,attributes:n,textContent:o,componentStack:r}=i,s=`<selected_element>
`,a=`  <${e}`;t.length>0&&(a+=` class="${t.join(" ")}"`);for(let[p,D]of Object.entries(n))a+=` ${p}="${J(D)}"`;a+=">",s+=a+`
`,o&&(s+=`    ${o}
`),s+=`  </${e}>
`;for(let p of r)s+=`  at ${p.name} in ${p.file}:${p.line}:${p.column}
`;return s+="</selected_element>",s}function x(i){let{tagName:e,classes:t,componentStack:n}=i,o=`<${e}>`;if(t.length>0){let r=t.slice(0,2).join(".");o=`<${e}.${r}>`}if(n.length>0){let r=n[0];o+=` in ${r.name}`}return o}function q(i){return i.className?typeof i.className=="string"?i.className.split(/\s+/).filter(Boolean):i.className.baseVal?i.className.baseVal.split(/\s+/).filter(Boolean):[]:[]}function W(i){let e={},t=new Set(["class","style"]);for(let n of i.attributes)!t.has(n.name)&&!n.name.startsWith("data-reactroot")&&(e[n.name]=n.value);return e}function V(i){let e=i.textContent?.trim();return e?e.length>S?e.slice(0,S)+"...":e:null}function Y(i){let e=i.innerHTML.trim();return e.length>w?e.slice(0,w)+"...":e}function J(i){return i.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var h=class{config;isActive=!1;hoveredElement=null;boundHandleMouseMove;boundHandleClick;boundHandleScroll;constructor(e){this.config=e,this.boundHandleMouseMove=this.handleMouseMove.bind(this),this.boundHandleClick=this.handleClick.bind(this),this.boundHandleScroll=this.handleScroll.bind(this)}activate(){this.isActive||(this.isActive=!0,document.addEventListener("mousemove",this.boundHandleMouseMove),document.addEventListener("click",this.boundHandleClick,!0),document.addEventListener("scroll",this.boundHandleScroll,!0),document.body.style.cursor="crosshair")}deactivate(){this.isActive&&(this.isActive=!1,document.removeEventListener("mousemove",this.boundHandleMouseMove),document.removeEventListener("click",this.boundHandleClick,!0),document.removeEventListener("scroll",this.boundHandleScroll,!0),document.body.style.cursor="",this.hoveredElement=null,this.config.onHover(null,null))}handleMouseMove(e){if(!this.isActive)return;let t=this.getElementAtPoint(e.clientX,e.clientY);if(t!==this.hoveredElement)if(this.hoveredElement=t,t){let n=c(t);this.config.onHover(t,n)}else this.config.onHover(null,null)}handleClick(e){if(!this.isActive)return;e.preventDefault(),e.stopPropagation();let t=this.getElementAtPoint(e.clientX,e.clientY);if(t){let n=c(t);this.config.onClick(t,n)}}handleScroll(){if(this.hoveredElement){let e=c(this.hoveredElement);this.config.onHover(this.hoveredElement,e)}}getElementAtPoint(e,t){let n=document.elementFromPoint(e,t);return!n||!(n instanceof HTMLElement)||n.id?.startsWith("gicm-grab")||n.closest("[id^='gicm-grab']")?null:n}getHoveredElement(){return this.hoveredElement}};var E=class{element;theme;constructor(e){this.theme=e,this.element=this.createElement()}createElement(){let e=document.createElement("div");return e.id=l.OVERLAY,this.applyStyles(e),e}applyStyles(e){let t=this.theme.hue??280,n=this.theme.borderColor||`hsl(${t}, 70%, 60%)`,o=this.theme.backgroundColor||`hsla(${t}, 70%, 60%, 0.1)`;e.style.cssText=`
      position: fixed;
      pointer-events: none;
      border: 2px solid ${n};
      background: ${o};
      border-radius: 4px;
      z-index: 2147483646;
      transition: all 0.05s ease-out;
      display: none;
    `}show(){this.element.parentNode||document.body.appendChild(this.element)}hide(){this.element.style.display="none"}update(e){this.element.style.display="block",this.element.style.top=`${e.top}px`,this.element.style.left=`${e.left}px`,this.element.style.width=`${e.width}px`,this.element.style.height=`${e.height}px`}clear(){this.element.style.display="none"}updateTheme(e){this.theme=e,this.applyStyles(this.element)}destroy(){this.element.remove()}};var C=class{element;theme;constructor(e){this.theme=e,this.element=this.createElement()}createElement(){let e=document.createElement("div");return e.id=l.LABEL,this.applyStyles(e),e}applyStyles(e){let t=this.theme.hue??280,n=this.theme.label?.backgroundColor||`hsl(${t}, 70%, 35%)`,o=this.theme.label?.textColor||"#ffffff";e.style.cssText=`
      position: fixed;
      background: ${n};
      color: ${o};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      font-weight: 500;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `}show(e,t){this.element.parentNode||document.body.appendChild(this.element);let n=x(t);this.element.textContent=n;let o=t.rect,r=this.element.getBoundingClientRect(),s=o.top-28;s<4&&(s=o.bottom+4);let a=o.left;a+r.width>window.innerWidth-4&&(a=window.innerWidth-r.width-4),this.element.style.display="block",this.element.style.top=`${s}px`,this.element.style.left=`${a}px`}hide(){this.element.style.display="none"}updateTheme(e){this.theme=e,this.applyStyles(this.element)}destroy(){this.element.remove()}};function A(i){let e=document.getElementById(l.NOTIFICATION);e&&e.remove();let t=document.createElement("div");if(t.id=l.NOTIFICATION,t.textContent=i,t.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: gicm-slide-in 0.3s ease-out;
  `,!document.getElementById("gicm-grab-styles")){let n=document.createElement("style");n.id="gicm-grab-styles",n.textContent=`
      @keyframes gicm-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes gicm-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `,document.head.appendChild(n)}document.body.appendChild(t),setTimeout(()=>{t.style.animation="gicm-fade-out 0.3s ease-out forwards",setTimeout(()=>t.remove(),300)},G)}var T=class{element=null;hideTimeout=null;show(e){this.hide(),e.length!==0&&(this.element=this.createElement(e),document.body.appendChild(this.element),this.hideTimeout=window.setTimeout(()=>{this.hide()},$))}hide(){this.hideTimeout&&(clearTimeout(this.hideTimeout),this.hideTimeout=null),this.element&&(this.element.remove(),this.element=null)}destroy(){this.hide()}createElement(e){let t=document.createElement("div");return t.id=l.SUGGESTION_PANEL,t.innerHTML=`
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: #1a1a2e;
        border: 1px solid #7c3aed;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 2147483647;
        overflow: hidden;
        animation: gicm-slide-in 0.3s ease-out;
      ">
        <div style="
          padding: 12px 16px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>gICM Components</span>
          <button
            onclick="this.closest('#${l.SUGGESTION_PANEL}').remove()"
            style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 18px;
              line-height: 1;
              padding: 0;
            "
          >\xD7</button>
        </div>
        <div style="padding: 12px; overflow-y: auto; max-height: 320px;">
          ${e.map(n=>this.renderSuggestion(n)).join("")}
        </div>
        <div style="
          padding: 8px 16px;
          background: #2a2a3e;
          font-size: 11px;
          color: #888;
          text-align: center;
        ">
          Click to copy ID - Paste in Claude Code
        </div>
      </div>
    `,t.querySelectorAll("[data-gicm-id]").forEach(n=>{n.addEventListener("click",()=>{let o=n.getAttribute("data-gicm-id");navigator.clipboard.writeText(`gicm:${o}`);let r=n.querySelector(".copy-badge");r&&(r.textContent="Copied!",r.style.background="#10b981")})}),t}renderSuggestion(e){let t=Math.round(e.similarity_score*100);return`
      <div
        data-gicm-id="${e.id}"
        style="
          padding: 12px;
          margin-bottom: 8px;
          background: #2a2a3e;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        "
        onmouseover="this.style.background='#3a3a4e'"
        onmouseout="this.style.background='#2a2a3e'"
      >
        <div style="
          font-weight: 600;
          color: #e0e0e0;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>${e.name}</span>
          <span class="copy-badge" style="
            font-size: 10px;
            padding: 2px 6px;
            background: #4a4a5e;
            border-radius: 4px;
            font-weight: normal;
          ">Copy ID</span>
        </div>
        <div style="
          font-size: 12px;
          color: #a0a0a0;
          margin-bottom: 8px;
          line-height: 1.4;
        ">${e.description.slice(0,80)}${e.description.length>80?"...":""}</div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            font-size: 11px;
            padding: 2px 8px;
            background: #7c3aed;
            color: white;
            border-radius: 4px;
          ">${e.category}</span>
          <span style="
            font-size: 11px;
            color: ${t>=80?"#10b981":t>=60?"#f59e0b":"#6b7280"};
            font-weight: 500;
          ">${t}% match</span>
        </div>
      </div>
    `}};async function _(i,e){try{let t=await fetch(`${e}/search/by-element`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({element_context:i,include_similar:!0,limit:5})});if(!t.ok)throw new Error(`API error: ${t.status}`);return(await t.json()).matches||[]}catch(t){return console.error("[gICM Grab] API error:",t),[]}}async function L(i){try{await navigator.clipboard.writeText(i)}catch{let t=document.createElement("textarea");t.value=i,t.style.cssText="position:fixed;left:-9999px",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}}var d=class{config;state;keyboard;selector;overlay;tooltip;suggestionPanel=null;constructor(e={}){this.config={...I,...e,theme:{...v,...e.theme,label:{...v.label,...e.theme?.label}},onSelect:e.onSelect??(()=>{}),onCopy:e.onCopy??(()=>{}),onStateChange:e.onStateChange??(()=>{})},this.state={isActive:!1,hoveredElement:null,selectedElement:null},this.keyboard=new u({shortcutKey:this.config.shortcutKey,onActivate:()=>this.activate(),onDeactivate:()=>this.handleKeyRelease()}),this.selector=new h({onHover:(t,n)=>this.handleHover(t,n),onClick:(t,n)=>this.handleSelect(t,n)}),this.overlay=new E(this.config.theme),this.tooltip=new C(this.config.theme),this.config.gicmApiUrl&&this.config.showSuggestions&&(this.suggestionPanel=new T),this.config.enabled&&this.keyboard.start(),this.log("Initialized. Hold \u2318/Ctrl+C and click any element.")}activate(){this.state.isActive||(this.state.isActive=!0,this.state.selectedElement=null,this.selector.activate(),this.overlay.show(),this.updateState(),this.log("Grab mode activated"))}deactivate(){this.state.isActive&&(this.state.isActive=!1,this.state.hoveredElement=null,this.selector.deactivate(),this.overlay.hide(),this.tooltip.hide(),this.updateState(),this.log("Grab mode deactivated"))}grab(e){return c(e)}async copy(e){let t=c(e),n=f(t);await L(n),this.config.onCopy(t,n),A("\u2713 Copied! Paste into Claude Code / Cursor")}getState(){return{...this.state}}configure(e){Object.assign(this.config,e),e.theme&&(this.overlay.updateTheme(this.config.theme),this.tooltip.updateTheme(this.config.theme)),e.enabled===!1?(this.deactivate(),this.keyboard.stop()):e.enabled===!0&&this.keyboard.start()}destroy(){this.deactivate(),this.keyboard.stop(),this.overlay.destroy(),this.tooltip.destroy(),this.suggestionPanel?.destroy(),this.log("Destroyed")}handleHover(e,t){this.state.hoveredElement=e,e&&t?(this.overlay.update(t.rect),this.tooltip.show(e,t)):(this.overlay.clear(),this.tooltip.hide())}async handleSelect(e,t){this.state.selectedElement=e,this.updateState();let n=f(t);if(await L(n),this.config.onSelect(t),this.config.onCopy(t,n),A("\u2713 Copied! Paste into Claude Code / Cursor"),this.config.gicmApiUrl&&this.suggestionPanel)try{let o=await _(n,this.config.gicmApiUrl);o.length>0&&this.suggestionPanel.show(o)}catch(o){this.log("Failed to fetch suggestions:",o)}this.deactivate()}handleKeyRelease(){this.state.selectedElement||this.deactivate()}updateState(){this.config.onStateChange(this.getState())}log(...e){console.log("[gICM Grab]",...e)}};var m=null;function g(i={}){return m&&m.destroy(),m=new d(i),m}function H(){return m}function k(){m&&(m.destroy(),m=null)}if(typeof window<"u"){window.GICMGrab={init:g,getInstance:H,destroy:k,Grabber:d};let i=document.currentScript;if(i?.hasAttribute("data-auto-init")){let e={},t=i.getAttribute("data-gicm-api");t&&(e.gicmApiUrl=t,e.showSuggestions=!0);let n=i.getAttribute("data-hue");n&&(e.theme={hue:parseInt(n,10)}),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>g(e)):g(e)}}var Q={init:g,getInstance:H,destroy:k};return F(Z);})();
