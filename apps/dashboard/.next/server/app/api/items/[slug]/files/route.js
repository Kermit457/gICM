"use strict";(()=>{var e={};e.id=1282,e.ids=[1282],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92048:e=>{e.exports=require("fs")},55315:e=>{e.exports=require("path")},26492:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>y,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>k,staticGenerationAsyncStorage:()=>f});var a={};n.r(a),n.d(a,{GET:()=>d});var s=n(28998),r=n(16006),i=n(14274),o=n(95663),c=n(60092),p=n(92048),l=n(55315);let g=(0,l.join)(process.cwd(),"..","..");function u(e){let t=[];switch(e.kind){case"agent":t.push({path:"AGENT.md",content:`# ${e.name}

${e.description}

## Installation

\`\`\`bash
${e.install}
\`\`\`

## Category
${e.category}

## Tags
${e.tags.join(", ")}

## Model Recommendation
${e.modelRecommendation||"sonnet"}
`});break;case"skill":t.push({path:"SKILL.md",content:`# ${e.name}

${e.description}

## Installation

\`\`\`bash
${e.install}
\`\`\`

## Usage

This skill can be invoked by the agent to ${e.description.toLowerCase()}.
`});break;case"command":t.push({path:"COMMAND.md",content:`# ${e.name}

${e.description}

## Installation

\`\`\`bash
${e.install}
\`\`\`

## Usage

\`\`\`
/${e.slug.replace(/-/g," ")}
\`\`\`
`});break;case"mcp":t.push({path:"settings.json",content:JSON.stringify({mcpServers:{[e.slug]:{command:"npx",args:[`@gicm/${e.slug}`]}}},null,2)});break;case"workflow":t.push({path:"WORKFLOW.md",content:`# ${e.name}

${e.description}

## Installation

\`\`\`bash
${e.install}
\`\`\`

## Dependencies
${e.dependencies?.join(", ")||"None"}
`});break;default:t.push({path:`${e.kind.toUpperCase()}.md`,content:`# ${e.name}

${e.description}`})}return t}async function d(e,{params:t}){let{slug:n}=await t,a=(0,c.QR)(n);if(!a)return o.NextResponse.json({error:"Item not found"},{status:404});try{let e=function(e){let t={"wallet-agent":"packages/wallet-agent","defi-agent":"packages/defi-agent","hunter-agent":"packages/hunter-agent","audit-agent":"packages/audit-agent","decision-agent":"packages/decision-agent","social-agent":"packages/social-agent","bridge-agent":"packages/bridge-agent","nft-agent":"packages/nft-agent","dao-agent":"packages/dao-agent","builder-agent":"packages/builder-agent","refactor-agent":"packages/refactor-agent","deployer-agent":"packages/deployer-agent","ptc-coordinator":"packages/orchestrator","autonomy-engine":"packages/autonomy","product-engine":"packages/product-engine","growth-engine":"packages/growth-engine","money-engine":"packages/money-engine","context-engine-mcp":"services/context-engine","solana-mcp":"packages/mcp-server","github-mcp":"packages/mcp-server"}[e.slug]||null;if(t){let e=function(e){let t=(0,l.join)(g,e),n=[];for(let e of["src/index.ts","src/index.tsx","index.ts","README.md","package.json"]){let a=(0,l.join)(t,e);if((0,p.existsSync)(a)&&(0,p.statSync)(a).isFile())try{let t=(0,p.readFileSync)(a,"utf-8");n.push({path:e,content:t.slice(0,1e4)})}catch{}}let a=(0,l.join)(t,"src");if((0,p.existsSync)(a)&&(0,p.statSync)(a).isDirectory())for(let e of function e(t,n,a=2,s=0){let r=[];if(s>a)return r;try{for(let i of(0,p.readdirSync)(t)){let o=(0,l.join)(t,i),c=(0,p.statSync)(o);if(c.isDirectory()&&!i.startsWith(".")&&"node_modules"!==i&&"dist"!==i)r.push(...e(o,n,a,s+1));else if(c.isFile()){let e=(0,l.extname)(i).toLowerCase();if([".ts",".tsx",".js",".jsx"].includes(e)&&!i.endsWith(".d.ts"))try{let e=(0,p.readFileSync)(o,"utf-8"),t=(0,l.relative)(n,o).replace(/\\/g,"/");r.push({relativePath:t,content:e})}catch{}}}}catch{}return r}(a,a))n.some(t=>t.path===`src/${e.relativePath}`)||n.push({path:`src/${e.relativePath}`,content:e.content.slice(0,1e4)});return n.slice(0,10)}(t);if(e.length>0)return e}return u(e)}(a);return o.NextResponse.json(e)}catch(t){console.error(`Error getting files for ${n}:`,t);let e=u(a);return o.NextResponse.json(e)}}let m=new s.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/items/[slug]/files/route",pathname:"/api/items/[slug]/files",filename:"route",bundlePath:"app/api/items/[slug]/files/route"},resolvedPagePath:"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\api\\items\\[slug]\\files\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:h,staticGenerationAsyncStorage:f,serverHooks:k}=m,y="/api/items/[slug]/files/route";function x(){return(0,i.patchFetch)({serverHooks:k,staticGenerationAsyncStorage:f})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[547,7536,92],()=>n(26492));module.exports=a})();