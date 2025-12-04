"use strict";var w=Object.create;var l=Object.defineProperty;var S=Object.getOwnPropertyDescriptor;var b=Object.getOwnPropertyNames;var k=Object.getPrototypeOf,y=Object.prototype.hasOwnProperty;var x=(e,t)=>{for(var a in t)l(e,a,{get:t[a],enumerable:!0})},m=(e,t,a,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of b(t))!y.call(e,o)&&o!==a&&l(e,o,{get:()=>t[o],enumerable:!(n=S(t,o))||n.enumerable});return e};var A=(e,t,a)=>(a=e!=null?w(k(e)):{},m(t||!e||!e.__esModule?l(a,"default",{value:e,enumerable:!0}):a,e)),I=e=>m(l({},"__esModule",{value:!0}),e);var M={};x(M,{activate:()=>P,deactivate:()=>B});module.exports=I(M);var s=A(require("vscode")),u={"GRAB Skills":[{id:"react-grab",name:"React Grab",desc:"Extract React components from any UI"},{id:"theme-grab",name:"Theme Grab",desc:"Extract color schemes and design tokens"},{id:"form-grab",name:"Form Grab",desc:"Clone form patterns and validation"},{id:"layout-grab",name:"Layout Grab",desc:"Extract responsive layout patterns"}],"Solana Skills":[{id:"token-swap",name:"Token Swap",desc:"Jupiter integration for token swaps"},{id:"anchor-interact",name:"Anchor Interact",desc:"Anchor program interactions"},{id:"chain-query",name:"Chain Query",desc:"On-chain data queries"},{id:"pump-launch",name:"Pump Launch",desc:"Token launch mechanics"}],"Research Skills":[{id:"web-search",name:"Web Search",desc:"Deep web research"},{id:"code-search",name:"Code Search",desc:"Codebase semantic search"},{id:"company-research",name:"Company Research",desc:"Competitive analysis"}],"Builder Skills":[{id:"api-scaffold",name:"API Scaffold",desc:"Generate API boilerplate"},{id:"test-gen",name:"Test Generator",desc:"Auto-generate test suites"},{id:"doc-gen",name:"Doc Generator",desc:"Generate documentation"}]},v={"Vision Agents":[{id:"grabber",name:"Grabber",desc:"Visual element extraction"},{id:"cloner",name:"Cloner",desc:"UI pattern cloning"},{id:"theme-extractor",name:"Theme Extractor",desc:"Design system extraction"}],"Solana Agents":[{id:"jupiter-trader",name:"Jupiter Trader",desc:"Token swap optimization"},{id:"anchor-architect",name:"Anchor Architect",desc:"Program design patterns"},{id:"defi-analyst",name:"DeFi Analyst",desc:"Protocol analysis"}],"Builder Agents":[{id:"fullstack-builder",name:"Full Stack Builder",desc:"End-to-end development"},{id:"api-designer",name:"API Designer",desc:"API architecture"},{id:"test-engineer",name:"Test Engineer",desc:"Quality assurance"}]},p=[{id:"AUTO",name:"AUTO",desc:"Auto-detect best approach",icon:"$(sparkle)"},{id:"BUILD",name:"BUILD",desc:"Ship fast, working code",icon:"$(tools)"},{id:"REVIEW",name:"REVIEW",desc:"Thorough analysis",icon:"$(eye)"},{id:"ARCHITECT",name:"ARCHITECT",desc:"System design thinking",icon:"$(layout)"},{id:"DEBUG",name:"DEBUG",desc:"Root cause analysis",icon:"$(bug)"},{id:"SOLANA",name:"SOLANA",desc:"Blockchain-native",icon:"$(pulse)"},{id:"GRAB",name:"GRAB",desc:"Visual-first development",icon:"$(screen-full)"},{id:"VIBE",name:"VIBE",desc:"Ship fast, iterate later",icon:"$(rocket)"}],c,i="AUTO";function P(e){console.log("OPUS 67 extension activated"),c=s.window.createStatusBarItem(s.StatusBarAlignment.Right,100),c.command="opus67.selectMode",r(),s.workspace.getConfiguration("opus67").get("showStatusBar")&&c.show(),e.subscriptions.push(c),e.subscriptions.push(s.commands.registerCommand("opus67.showStatus",C),s.commands.registerCommand("opus67.browseSkills",g),s.commands.registerCommand("opus67.browseAgents",O),s.commands.registerCommand("opus67.selectMode",f),s.commands.registerCommand("opus67.install",U),s.commands.registerCommand("opus67.openDocs",h)),e.subscriptions.push(s.window.onDidChangeActiveTextEditor(T)),e.globalState.get("opus67.welcomeShown")||($(),e.globalState.update("opus67.welcomeShown",!0))}function r(){let e=p.find(t=>t.id===i)||p[0];c.text=`${e.icon} OPUS 67: ${e.name}`,c.tooltip=`OPUS 67 - ${e.desc}
Click to change mode`}async function C(){let e=s.window.createWebviewPanel("opus67Status","OPUS 67 Status",s.ViewColumn.One,{enableScripts:!0});e.webview.html=E()}function E(){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPUS 67 Status</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      padding: 20px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-family: monospace;
      font-size: 10px;
      color: #00d4ff;
      white-space: pre;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat {
      background: var(--vscode-input-background);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #00d4ff;
    }
    .stat-label {
      color: var(--vscode-descriptionForeground);
      margin-top: 5px;
    }
    .mode {
      background: var(--vscode-input-background);
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .mode-title {
      font-size: 18px;
      margin-bottom: 10px;
    }
    .mode-desc {
      color: var(--vscode-descriptionForeground);
    }
    .principle {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #00d4ff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .principle-text {
      font-size: 14px;
      color: #00d4ff;
    }
  </style>
</head>
<body>
  <div class="header">
    <pre class="logo">
   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557     \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D    \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551
  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557     \u2588\u2588\u2554\u255D
  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2551   \u2588\u2588\u2551\u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551    \u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557   \u2588\u2588\u2554\u255D
  \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551     \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551    \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D   \u2588\u2588\u2551
   \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D      \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u255D    \u255A\u2550\u255D
    </pre>
    <p style="color: var(--vscode-descriptionForeground);">Self-Evolving AI Runtime v4.2.0</p>
  </div>

  <div class="principle">
    <p class="principle-text">OPUS 67 \u2260 Separate AI</p>
    <p class="principle-text">OPUS 67 = Your AI + Enhancement Layer</p>
    <p style="margin-top: 10px; color: #888;">Same driver, better race car.</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">95</div>
      <div class="stat-label">Skills</div>
    </div>
    <div class="stat">
      <div class="stat-value">84</div>
      <div class="stat-label">MCPs</div>
    </div>
    <div class="stat">
      <div class="stat-value">30</div>
      <div class="stat-label">Modes</div>
    </div>
    <div class="stat">
      <div class="stat-value">82</div>
      <div class="stat-label">Agents</div>
    </div>
  </div>

  <div class="mode">
    <div class="mode-title">Current Mode: ${i}</div>
    <div class="mode-desc">${p.find(e=>e.id===i)?.desc||"Auto-detect best approach"}</div>
  </div>
</body>
</html>`}async function g(){let e=Object.keys(u),t=await s.window.showQuickPick(e,{placeHolder:"Select skill category"});if(!t)return;let n=u[t].map(d=>({label:d.name,description:d.desc,detail:`ID: ${d.id}`})),o=await s.window.showQuickPick(n,{placeHolder:`${t} - Select a skill`});o&&s.window.showInformationMessage(`OPUS 67: ${o.label} skill activated. Use it in your AI prompts.`)}async function O(){let e=Object.keys(v),t=await s.window.showQuickPick(e,{placeHolder:"Select agent category"});if(!t)return;let n=v[t].map(d=>({label:d.name,description:d.desc,detail:`ID: ${d.id}`})),o=await s.window.showQuickPick(n,{placeHolder:`${t} - Select an agent`});o&&s.window.showInformationMessage(`OPUS 67: ${o.label} agent ready. Invoke with: "Use ${o.label} to..."`)}async function f(){let e=p.map(a=>({label:`${a.icon} ${a.name}`,description:a.desc,id:a.id})),t=await s.window.showQuickPick(e,{placeHolder:"Select OPUS 67 operating mode"});t&&(i=t.id,r(),s.window.showInformationMessage(`OPUS 67: Mode set to ${i}`))}async function U(){if(!s.workspace.workspaceFolders){s.window.showErrorMessage("No workspace folder open");return}let t=[{label:"Full",description:"95 skills, 84 MCPs, 82 agents",value:"full"},{label:"Solana",description:"35 skills, 25 MCPs, 30 agents",value:"solana"},{label:"Frontend",description:"40 skills, 20 MCPs, 25 agents",value:"frontend"},{label:"Minimal",description:"15 skills, 10 MCPs, 10 agents",value:"minimal"}],a=await s.window.showQuickPick(t,{placeHolder:"Select installation type"});if(!a)return;let n=s.window.createTerminal("OPUS 67");n.show(),n.sendText(`npx create-opus67@latest --type ${a.value} --yes`)}function h(){s.env.openExternal(s.Uri.parse("https://opus67.dev"))}function T(e){if(!e||!s.workspace.getConfiguration("opus67").get("autoDetectSkills"))return;let a=e.document.fileName;a.endsWith(".rs")||a.endsWith(".anchor")?i!=="SOLANA"&&(i="SOLANA",r()):a.endsWith(".tsx")||a.endsWith(".jsx")?i!=="BUILD"&&(i="BUILD",r()):(a.endsWith(".test.ts")||a.endsWith(".spec.ts"))&&i!=="REVIEW"&&(i="REVIEW",r())}function $(){s.window.showInformationMessage("OPUS 67 activated! You now have access to 95 skills, 84 MCPs, and 82 agents.","Browse Skills","Select Mode","Open Docs").then(e=>{e==="Browse Skills"?g():e==="Select Mode"?f():e==="Open Docs"&&h()})}function B(){c&&c.dispose()}0&&(module.exports={activate,deactivate});
