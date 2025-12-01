(()=>{var e={};e.id=7989,e.ids=[7989],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},85431:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>h,originalPathname:()=>p,pages:()=>d,routeModule:()=>m,tree:()=>c}),s(26784),s(13263),s(38013);var i=s(66933),r=s(16006),a=s(294),n=s.n(a),o=s(46901),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(t,l);let c=["",{children:["brainstorm",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,26784)),"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\brainstorm\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,13263)),"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,38013,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\brainstorm\\page.tsx"],p="/brainstorm/page",h={require:s,loadChunk:()=>Promise.resolve()},m=new i.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/brainstorm/page",pathname:"/brainstorm",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},59185:(e,t,s)=>{Promise.resolve().then(s.bind(s,33701))},33701:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>j});var i=s(52723),r=s(3789),a=s(75567),n=s(1666),o=s(52908),l=s(76289),c=s(55009),d=s(50527),p=s(96800),h=s(39160),m=s(53006),u=s(51960);let g={scamper:{name:"SCAMPER",description:"Substitute, Combine, Adapt, Modify, Put to use, Eliminate, Reverse",icon:"\uD83D\uDD27",color:"blue",prompt:`Analyze using the SCAMPER method:

**S - Substitute**: What can be substituted? Different approach, tool, or resource?
**C - Combine**: What can be combined? Merge with other ideas or solutions?
**A - Adapt**: What can be adapted? Borrow from other domains or contexts?
**M - Modify**: What can be modified? Change size, shape, frequency, or intensity?
**P - Put to other uses**: What other uses exist? Repurpose for different markets?
**E - Eliminate**: What can be eliminated? Remove unnecessary complexity?
**R - Reverse/Rearrange**: What can be reversed? Change order or perspective?

For each SCAMPER element, provide:
1. Specific suggestion
2. Potential impact (High/Medium/Low)
3. Implementation difficulty (Easy/Medium/Hard)`},"six-hats":{name:"Six Thinking Hats",description:"Facts, Emotions, Risks, Benefits, Creativity, Process",icon:"\uD83C\uDFA9",color:"purple",prompt:`Analyze using the Six Thinking Hats method:

🎩 **White Hat (Facts)**: What are the objective facts and data?
- Known information
- Data gaps to fill
- Verifiable metrics

🎩 **Red Hat (Emotions)**: What are the gut feelings and intuitions?
- Initial reactions
- Emotional appeal
- User sentiment

🎩 **Black Hat (Risks)**: What are the dangers and problems?
- Potential failures
- Worst-case scenarios
- Critical weaknesses

🎩 **Yellow Hat (Benefits)**: What are the positives and opportunities?
- Best-case scenarios
- Competitive advantages
- Growth potential

🎩 **Green Hat (Creativity)**: What are new ideas and alternatives?
- Novel approaches
- Unconventional solutions
- Innovation opportunities

🎩 **Blue Hat (Process)**: What's the next step and action plan?
- Decision summary
- Priority actions
- Success metrics

For each hat, provide 2-3 concrete points.`},reverse:{name:"Reverse Brainstorming",description:"Find problems to reveal solutions",icon:"\uD83D\uDD04",color:"red",prompt:`Analyze using Reverse Brainstorming:

**Step 1 - Invert the Goal**: Instead of "How to succeed?", ask "How to fail?"
List 5 ways this could completely fail:
1.
2.
3.
4.
5.

**Step 2 - Reverse Each Failure**: For each failure mode, identify the opposite action
- Failure → Prevention Strategy
- Weakness → Strength to build

**Step 3 - Hidden Insights**: What problems reveal opportunities?
- Market gaps exposed
- Unmet needs discovered
- Competitive weaknesses to exploit

**Step 4 - Action Items**: Convert insights to specific actions`},"role-storming":{name:"Role Storming",description:"Think from Whale, Degen, Skeptic, Builder perspectives",icon:"\uD83D\uDC65",color:"green",prompt:`Analyze from multiple persona perspectives:

👤 **The Conservative Investor**:
- Focus: Capital preservation, proven track record, risk management
- Question: "Is this safe enough? What's the downside protection?"
- Concern: Volatility, unproven concepts, regulatory risk

👤 **The Aggressive Degen**:
- Focus: Maximum upside, early entry, momentum plays
- Question: "What's the 10x potential? Where's the asymmetric bet?"
- Concern: Missing the pump, being too late

👤 **The Whale**:
- Focus: Liquidity, market impact, accumulation strategy
- Question: "Can I size in without moving the market? Exit strategy?"
- Concern: Slippage, liquidity traps, front-running

👤 **The Skeptic**:
- Focus: Red flags, team quality, tokenomics
- Question: "What's the catch? Who benefits if this fails?"
- Concern: Rug pulls, insider dumping, unsustainable mechanics

👤 **The Builder**:
- Focus: Technical quality, product-market fit, team execution
- Question: "Is this technically sound? Can they ship?"
- Concern: Vaporware, technical debt, scaling issues

For each persona, provide:
1. Their likely verdict (Bullish/Bearish/Neutral)
2. Key concern or opportunity they'd identify
3. Suggested action`},starbursting:{name:"Starbursting",description:"5W1H structured questioning (Who, What, When, Where, Why, How)",icon:"⭐",color:"yellow",prompt:`Deep-dive using Starbursting (5W1H):

❓ **WHO**
- Who is the target user/customer?
- Who are the competitors?
- Who on the team is responsible?
- Who benefits most? Who loses?

❓ **WHAT**
- What problem does this solve?
- What is the core value proposition?
- What resources are needed?
- What could go wrong?

❓ **WHEN**
- When should we act?
- When is the optimal timing?
- When do we expect results?
- When should we reassess?

❓ **WHERE**
- Where is the opportunity?
- Where are similar solutions?
- Where should we focus first?
- Where are the blind spots?

❓ **WHY**
- Why does this matter now?
- Why would users choose this?
- Why hasn't this been done before?
- Why might this fail?

❓ **HOW**
- How will this be implemented?
- How will success be measured?
- How will we iterate?
- How much will it cost?

For each question category, identify the 2 most critical questions and answer them.`},"mind-mapping":{name:"Mind Mapping",description:"Hierarchical idea expansion tree",icon:"\uD83C\uDF33",color:"teal",prompt:`Expand using Mind Mapping structure:

🌳 **CENTRAL IDEA**: [Topic]

├── 🌿 **Branch 1: Market Opportunity**
│   ├── Sub-idea 1.1
│   ├── Sub-idea 1.2
│   └── Sub-idea 1.3

├── 🌿 **Branch 2: Technical Approach**
│   ├── Sub-idea 2.1
│   ├── Sub-idea 2.2
│   └── Sub-idea 2.3

├── 🌿 **Branch 3: Competitive Landscape**
│   ├── Sub-idea 3.1
│   ├── Sub-idea 3.2
│   └── Sub-idea 3.3

├── 🌿 **Branch 4: Risks & Mitigations**
│   ├── Sub-idea 4.1
│   ├── Sub-idea 4.2
│   └── Sub-idea 4.3

└── 🌿 **Branch 5: Action Items**
    ├── Immediate (Today)
    ├── Short-term (This Week)
    └── Medium-term (This Month)

For each branch, expand with 3-5 concrete sub-ideas.`},swot:{name:"SWOT Analysis",description:"Strengths, Weaknesses, Opportunities, Threats",icon:"\uD83D\uDCCA",color:"indigo",prompt:`Analyze using SWOT Analysis:

📊 **STRENGTHS (Internal Positives)**
What advantages do we have? What do we do well?

| Strength | Impact | Leverage Strategy |
|----------|--------|-------------------|
| 1. | High/Med/Low | How to maximize |
| 2. | High/Med/Low | How to maximize |
| 3. | High/Med/Low | How to maximize |

📊 **WEAKNESSES (Internal Negatives)**
What could be improved? Where are we vulnerable?

| Weakness | Severity | Mitigation Plan |
|----------|----------|-----------------|
| 1. | Critical/Moderate/Minor | How to address |
| 2. | Critical/Moderate/Minor | How to address |
| 3. | Critical/Moderate/Minor | How to address |

📊 **OPPORTUNITIES (External Positives)**
What trends could we capitalize on? What market gaps exist?

| Opportunity | Potential | Action Required |
|-------------|-----------|-----------------|
| 1. | High/Med/Low | Specific steps |
| 2. | High/Med/Low | Specific steps |
| 3. | High/Med/Low | Specific steps |

📊 **THREATS (External Negatives)**
What obstacles do we face? What are competitors doing?

| Threat | Probability | Contingency Plan |
|--------|-------------|------------------|
| 1. | High/Med/Low | Defense strategy |
| 2. | High/Med/Low | Defense strategy |
| 3. | High/Med/Low | Defense strategy |

**Strategic Recommendations:**
1. S-O Strategy: How to use strengths to capture opportunities
2. W-O Strategy: How to overcome weaknesses by pursuing opportunities
3. S-T Strategy: How to use strengths to avoid threats
4. W-T Strategy: How to minimize weaknesses and avoid threats`},"five-whys":{name:"Five Whys",description:"Root cause analysis - ask why 5 times",icon:"\uD83D\uDD0D",color:"orange",prompt:`Analyze using the Five Whys technique:

🔍 **Problem Statement**: [State the problem clearly]

**Why #1**: Why is this happening?
→ Answer: [First level cause]

**Why #2**: Why is [answer #1] happening?
→ Answer: [Second level cause]

**Why #3**: Why is [answer #2] happening?
→ Answer: [Third level cause]

**Why #4**: Why is [answer #3] happening?
→ Answer: [Fourth level cause]

**Why #5**: Why is [answer #4] happening?
→ Answer: [Root cause identified]

---

**Root Cause Analysis Summary:**
- Surface symptom: [Original problem]
- Root cause: [Final answer]
- Contributing factors: [List 2-3 factors]

**Corrective Actions:**
| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|----------------|
| Fix root cause | | | |
| Address factor 1 | | | |
| Address factor 2 | | | |

**Preventive Measures:**
1. [Systemic change 1]
2. [Process improvement 2]
3. [Monitoring/alert setup]`},brainwriting:{name:"Brainwriting",description:"Silent idea generation and building (6-3-5)",icon:"✍️",color:"pink",prompt:`Generate ideas using Brainwriting (6-3-5 method):

**Topic**: [Subject for ideation]

---

**Round 1 - Initial Ideas**
Generate 3 independent ideas:

💡 Idea 1.1: [Novel approach]
- Description:
- Key benefit:
- Implementation:

💡 Idea 1.2: [Different angle]
- Description:
- Key benefit:
- Implementation:

💡 Idea 1.3: [Unconventional solution]
- Description:
- Key benefit:
- Implementation:

---

**Round 2 - Build on Ideas**
Take each idea and enhance it:

💡 Idea 2.1 (building on 1.1):
- Enhancement:
- New feature:
- Combination potential:

💡 Idea 2.2 (building on 1.2):
- Enhancement:
- New feature:
- Combination potential:

💡 Idea 2.3 (building on 1.3):
- Enhancement:
- New feature:
- Combination potential:

---

**Round 3 - Cross-pollinate**
Combine best elements:

🌟 Synthesis 1: [Combination]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

🌟 Synthesis 2: [Another combination]
- Source elements:
- Unique value:
- Feasibility: High/Medium/Low

---

**Final Ranking:**
| Rank | Idea | Impact | Feasibility |
|------|------|--------|-------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Next Steps:**
1. [Immediate action for top idea]
2. [Validation approach]
3. [Resource requirements]`}};function x(e){let t={blue:{bg:"bg-blue-500/10",border:"border-blue-500/30",text:"text-blue-400"},purple:{bg:"bg-purple-500/10",border:"border-purple-500/30",text:"text-purple-400"},red:{bg:"bg-red-500/10",border:"border-red-500/30",text:"text-red-400"},green:{bg:"bg-green-500/10",border:"border-green-500/30",text:"text-green-400"},yellow:{bg:"bg-yellow-500/10",border:"border-yellow-500/30",text:"text-yellow-400"},teal:{bg:"bg-teal-500/10",border:"border-teal-500/30",text:"text-teal-400"},indigo:{bg:"bg-indigo-500/10",border:"border-indigo-500/30",text:"text-indigo-400"},orange:{bg:"bg-orange-500/10",border:"border-orange-500/30",text:"text-orange-400"},pink:{bg:"bg-pink-500/10",border:"border-pink-500/30",text:"text-pink-400"}};return t[e]||t.blue}function b({method:e,selected:t,onClick:s}){let r=g[e],a=x(r.color);return(0,i.jsxs)("button",{onClick:s,className:`p-4 rounded-xl border transition-all text-left ${t?`${a.bg} ${a.border} ring-2 ring-offset-2 ring-offset-gicm-dark ring-${r.color}-500/50`:"bg-gicm-card border-gicm-border hover:border-gicm-primary/30"}`,children:[(0,i.jsxs)("div",{className:"flex items-center gap-3 mb-2",children:[i.jsx("span",{className:"text-2xl",children:r.icon}),i.jsx("span",{className:`font-semibold ${t?a.text:"text-white"}`,children:r.name})]}),i.jsx("p",{className:"text-xs text-gray-400 line-clamp-2",children:r.description})]})}function y({session:e,onSelect:t,onDelete:s}){let r=g[e.method],a=x(r.color);return(0,i.jsxs)("div",{className:`p-3 rounded-lg border ${a.bg} ${a.border} cursor-pointer hover:opacity-80 transition-opacity`,onClick:t,children:[(0,i.jsxs)("div",{className:"flex items-center justify-between mb-1",children:[(0,i.jsxs)("div",{className:"flex items-center gap-2",children:[i.jsx("span",{children:r.icon}),i.jsx("span",{className:`text-sm font-medium ${a.text}`,children:r.name})]}),i.jsx("button",{onClick:e=>{e.stopPropagation(),s()},className:"p-1 hover:bg-white/10 rounded transition-colors",children:i.jsx(n.Z,{className:"w-3 h-3 text-gray-500 hover:text-red-400"})})]}),i.jsx("p",{className:"text-sm text-white truncate",children:e.topic}),i.jsx("p",{className:"text-xs text-gray-500 mt-1",children:new Date(e.timestamp).toLocaleDateString()})]})}function v(){(0,a.useSearchParams)();let[e,t]=(0,r.useState)(!1),[s,n]=(0,r.useState)("six-hats"),[v,w]=(0,r.useState)(""),[j,k]=(0,r.useState)(""),[S,N]=(0,r.useState)(!1),[W,C]=(0,r.useState)([]),[M,H]=(0,r.useState)(!1),[D,A]=(0,r.useState)(!1),I=(0,r.useRef)(null),P=async()=>{if(!v.trim()||S)return;N(!0),k("");let e=g[s],t=`# Brainstorming Analysis

**Topic**: ${v}

${e.prompt}

Provide a thorough analysis following the structure above.`;try{let e=await fetch("/api/brainstorm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({method:s,topic:v,prompt:t})});if(e.ok){let t=await e.json();k(t.response||"No response generated.")}else{let e=f(s,v);k(e)}let i={id:crypto.randomUUID(),method:s,topic:v,response:j||"See above",timestamp:Date.now()};C(e=>[i,...e])}catch{let e=f(s,v);k(e);let t={id:crypto.randomUUID(),method:s,topic:v,response:e,timestamp:Date.now()};C(e=>[t,...e])}finally{N(!1)}},T=e=>{n(e.method),w(e.topic),k(e.response),H(!1)},R=e=>{C(t=>t.filter(t=>t.id!==e))};if(!e)return i.jsx("div",{className:"flex items-center justify-center h-64",children:i.jsx("div",{className:"text-gray-500",children:"Loading Brainstorm..."})});let E=g[s],F=x(E.color);return(0,i.jsxs)("div",{className:"space-y-6",children:[(0,i.jsxs)("div",{className:"flex items-center justify-between",children:[(0,i.jsxs)("div",{children:[(0,i.jsxs)("h1",{className:"text-2xl font-bold flex items-center gap-3",children:[i.jsx("div",{className:"p-2 rounded-lg bg-gicm-primary/10",children:i.jsx(o.Z,{className:"w-6 h-6 text-gicm-primary"})}),"Brainstorm"]}),i.jsx("p",{className:"text-gray-400 mt-1 ml-12",children:"Structured AI-powered ideation using 9 proven methods"})]}),i.jsx("div",{className:"flex items-center gap-4",children:(0,i.jsxs)("button",{onClick:()=>H(!M),className:`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${M?"bg-gicm-primary text-black":"bg-gicm-card border border-gicm-border hover:border-gicm-primary/30"}`,children:[i.jsx(l.Z,{className:"w-4 h-4"}),"History (",W.length,")"]})})]}),(0,i.jsxs)("div",{className:"bg-gicm-card border border-gicm-border rounded-xl p-6",children:[(0,i.jsxs)("div",{className:"flex items-center gap-3 mb-4",children:[i.jsx("div",{className:"p-2 rounded-lg bg-gicm-primary/10",children:i.jsx(c.Z,{className:"w-5 h-5 text-gicm-primary"})}),(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"font-semibold",children:"Select Method"}),i.jsx("p",{className:"text-sm text-gray-400",children:"Choose a brainstorming framework"})]})]}),i.jsx("div",{className:"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",children:Object.keys(g).map(e=>i.jsx(b,{method:e,selected:s===e,onClick:()=>n(e)},e))})]}),(0,i.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[(0,i.jsxs)("div",{className:"lg:col-span-2 space-y-4",children:[(0,i.jsxs)("div",{className:"bg-gicm-card border border-gicm-border rounded-xl p-6",children:[(0,i.jsxs)("div",{className:"flex items-center gap-3 mb-4",children:[i.jsx("div",{className:`p-2 rounded-lg ${F.bg}`,children:i.jsx("span",{className:"text-xl",children:E.icon})}),(0,i.jsxs)("div",{children:[i.jsx("h3",{className:`font-semibold ${F.text}`,children:E.name}),i.jsx("p",{className:"text-sm text-gray-400",children:E.description})]})]}),(0,i.jsxs)("div",{className:"space-y-4",children:[(0,i.jsxs)("div",{children:[i.jsx("label",{className:"block text-sm text-gray-400 mb-2",children:"Topic or Question"}),i.jsx("textarea",{value:v,onChange:e=>w(e.target.value),placeholder:"Enter the topic, idea, or question you want to brainstorm...",className:"w-full h-32 px-4 py-3 bg-white/5 border border-gicm-border rounded-lg focus:outline-none focus:border-gicm-primary/50 resize-none text-white placeholder-gray-500"})]}),i.jsx("button",{onClick:P,disabled:!v.trim()||S,className:`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${!v.trim()||S?"bg-gray-700 text-gray-400 cursor-not-allowed":"bg-gicm-primary text-black hover:bg-gicm-primary/90"}`,children:S?(0,i.jsxs)(i.Fragment,{children:[i.jsx(d.Z,{className:"w-4 h-4 animate-spin"}),"Analyzing..."]}):(0,i.jsxs)(i.Fragment,{children:[i.jsx(p.Z,{className:"w-4 h-4"}),"Brainstorm"]})})]})]}),j&&(0,i.jsxs)("div",{className:"bg-gicm-card border border-gicm-border rounded-xl p-6",children:[(0,i.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,i.jsxs)("div",{className:"flex items-center gap-3",children:[i.jsx("div",{className:"p-2 rounded-lg bg-gicm-primary/10",children:i.jsx(h.Z,{className:"w-5 h-5 text-gicm-primary"})}),(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"font-semibold",children:"Analysis Result"}),i.jsx("p",{className:"text-sm text-gray-400",children:"AI-generated insights"})]})]}),i.jsx("button",{onClick:()=>{navigator.clipboard.writeText(j),A(!0),setTimeout(()=>A(!1),2e3)},className:"flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors",children:D?(0,i.jsxs)(i.Fragment,{children:[i.jsx(m.Z,{className:"w-4 h-4 text-green-400"}),i.jsx("span",{className:"text-green-400",children:"Copied!"})]}):(0,i.jsxs)(i.Fragment,{children:[i.jsx(u.Z,{className:"w-4 h-4"}),"Copy"]})})]}),i.jsx("div",{ref:I,className:"prose prose-invert prose-sm max-w-none bg-white/5 rounded-lg p-4 max-h-[500px] overflow-y-auto",children:i.jsx("pre",{className:"whitespace-pre-wrap text-sm text-gray-300 font-sans",children:j})})]})]}),i.jsx("div",{className:`${M?"block":"hidden lg:block"}`,children:(0,i.jsxs)("div",{className:"bg-gicm-card border border-gicm-border rounded-xl p-6 sticky top-20",children:[(0,i.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,i.jsxs)("div",{className:"flex items-center gap-3",children:[i.jsx("div",{className:"p-2 rounded-lg bg-gicm-primary/10",children:i.jsx(l.Z,{className:"w-5 h-5 text-gicm-primary"})}),(0,i.jsxs)("div",{children:[i.jsx("h3",{className:"font-semibold",children:"History"}),(0,i.jsxs)("p",{className:"text-sm text-gray-400",children:[W.length," sessions"]})]})]}),W.length>0&&i.jsx("button",{onClick:()=>{C([]),localStorage.removeItem("gicm-brainstorm-history")},className:"text-xs text-red-400 hover:text-red-300 transition-colors",children:"Clear All"})]}),0===W.length?(0,i.jsxs)("div",{className:"text-center py-8",children:[i.jsx("p",{className:"text-gray-500 text-sm",children:"No sessions yet"}),i.jsx("p",{className:"text-gray-600 text-xs mt-1",children:"Your brainstorm sessions will appear here"})]}):i.jsx("div",{className:"space-y-2 max-h-[400px] overflow-y-auto",children:W.map(e=>i.jsx(y,{session:e,onSelect:()=>T(e),onDelete:()=>R(e.id)},e.id))})]})})]})]})}function f(e,t){let s=g[e];return`# ${s.name} Analysis

**Topic**: ${t}

---

${s.prompt}

---

> This is a placeholder response. Connect the AI API endpoint at \`/api/brainstorm\` for real AI-powered analysis.

## Quick Tips:
1. Be specific with your topic for better results
2. Try different methods for varied perspectives
3. Use the history feature to compare approaches
4. Copy results to share with your team

---

*Powered by gICM Brainstorm Engine*`}function w(){return i.jsx("div",{className:"flex items-center justify-center h-64",children:i.jsx("div",{className:"text-gray-500",children:"Loading Brainstorm..."})})}function j(){return i.jsx(r.Suspense,{fallback:i.jsx(w,{}),children:i.jsx(v,{})})}},53006:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},51960:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},76289:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("history",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]])},50527:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]])},96800:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]])},39160:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("sparkles",[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]])},1666:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]])},55009:(e,t,s)=>{"use strict";s.d(t,{Z:()=>i});let i=(0,s(82016).Z)("wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",key:"1ngwbx"}]])},26784:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>i});let i=(0,s(51509).createProxy)(String.raw`C:\Users\mirko\OneDrive\Desktop\gICM\apps\dashboard\app\brainstorm\page.tsx#default`)}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[547,9557,6867],()=>s(85431));module.exports=i})();