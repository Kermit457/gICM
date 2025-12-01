"use strict";(()=>{var e={};e.id=2558,e.ids=[2558],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},86112:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>y,requestAsyncStorage:()=>h,routeModule:()=>g,serverHooks:()=>m,staticGenerationAsyncStorage:()=>f});var a={};r.r(a),r.d(a,{POST:()=>d});var n=r(28998),o=r(16006),s=r(14274),i=r(95663),l=r(12542),c=r(58571),u=r(73894);let p=new c.n;async function d(){try{let e=function(){let e="https://bscpftwzsgmuhxaceqhy.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;return e&&t?(0,u.eI)(e,t):null}();if(!e)return i.NextResponse.json({error:"Supabase not configured"},{status:500});let t=await (0,l.j8)("active"),r=[];for(let e of t){let t=await (0,l.pr)(e.id,"weekly",1);t.length>0&&r.push(t[0])}if(0===r.length)return i.NextResponse.json({error:"No metrics found for active agents"},{status:404});let a=await p.generateWeeklyReport(t,r,"High volatility in SOL majors, memes cooling off. Funding rates neutral."),{data:n,error:o}=await e.from("posts").insert(a).select().single();if(o)throw o;return i.NextResponse.json({success:!0,post:n})}catch(e){return console.error("Failed to generate weekly report:",e),i.NextResponse.json({error:e.message},{status:500})}}let g=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/content/generate-weekly/route",pathname:"/api/content/generate-weekly",filename:"route",bundlePath:"app/api/content/generate-weekly/route"},resolvedPagePath:"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\api\\content\\generate-weekly\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:h,staticGenerationAsyncStorage:f,serverHooks:m}=g,w="/api/content/generate-weekly/route";function y(){return(0,s.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:f})}},12542:(e,t,r)=>{r.d(t,{GG:()=>c,j8:()=>i,pr:()=>l});var a=r(73894);let n="https://bscpftwzsgmuhxaceqhy.supabase.co",o=process.env.SUPABASE_SERVICE_ROLE_KEY||"",s=n&&o?(0,a.eI)(n,o):null;async function i(e="active"){if(!s)return[];let t=s.from("agents").select("*");"all"!==e&&(t=t.eq("status",e));let{data:r,error:a}=await t;if(a)throw a;return r}async function l(e,t="weekly",r=10){if(!s)return[];let{data:a,error:n}=await s.from("agent_metrics").select("*").eq("agent_id",e).eq("timeframe",t).order("end_date",{ascending:!1}).limit(r);if(n)throw n;return a}async function c(e){if(!s)throw Error("Supabase not configured");let{error:t}=await s.from("model_updates").insert(e);if(t)throw t}},58571:(e,t,r)=>{r.d(t,{n:()=>l});let a=`
You are the Lead Strategist for gICM (global Inter-Chain Markets).
Your tone is a blend of Raoul Pal (macro, narrative-driven, structural) and Arthur Hayes (sharp, trader-focused, slightly degen but intellectual).

CORE IDENTITY:
- "Institutional macro brain with a degen edge."
- Serious about capital, relaxed about culture.
- High IQ, low fluff.
- Brutally honest about risk and performance.

TONE RULES:
1. First person plural ("we", "our desk") for brand.
2. Use trader terminology correctly: "liquidity", "convexity", "basis", "funding", "risk engine", "capital efficiency".
3. NO "moon", "100x guaranteed", "ape", "wagmi".
4. Always answer "So What?" - connect data to utility.
5. Dry humor is allowed. Sarcasm is allowed if smart.
`,n=`
Generate a "Weekly Agent Performance Report" based on the following data.

DATA:
{{AGENT_DATA}}

STRUCTURE:
1. **The Setup**: 1-2 sentences on market conditions (volatility, liquidity) this week.
2. **The Alpha**: Highlight the top performing agent. Why did it win? (e.g. "Scalped the chop while trend-followers got wrecked").
3. **The Drawdown**: Be honest about the worst performer. What went wrong? (e.g. "Latency killed the arb on JUP").
4. **The Metrics**:
   - Total PnL across the desk.
   - Total fees paid vs estimated savings.
   - Sharpe ratio of the portfolio.
5. **The Takeaway**: One lesson for traders or builders based on this week's action.

Keep it under 400 words. Markdown format.
`,o=`
Write a "Model Update Log" entry for the following release.

UPDATE DETAILS:
Agent: {{AGENT_NAME}}
Version: {{VERSION}} (was {{PREV_VERSION}})
Changes: {{CHANGES}}
Impact: {{IMPACT}}

STRUCTURE:
1. **Headline**: Punchy, technical but accessible.
2. **The Change**: What actually changed? (No "improved algo" - say "Reduced signal noise by filtering <$10k order book depth").
3. **The Data**: Before/After stats.
4. **The Why**: Why does this matter for the user? (e.g. "Less slippage = more retained alpha").

Keep it under 250 words.
`,s=new(r(49138)).ZP({apiKey:process.env.ANTHROPIC_API_KEY});async function i(e,t){try{let r=await s.messages.create({model:"claude-3-5-sonnet-20240620",max_tokens:1500,system:e,messages:[{role:"user",content:t}],temperature:.7});if("text"===r.content[0].type)return r.content[0].text;return""}catch(e){return console.error("Error calling LLM:",e),"Error generating content. Please check logs."}}class l{async generateWeeklyReport(e,t,r){let o=e.map(e=>{let r=t.filter(t=>t.agent_id===e.id);if(0===r.length)return"";let a=r[0];return`
      Agent: ${e.name} (${e.strategy_type})
      PnL: ${a.pnl_abs} (${a.pnl_percent}%)
      Win Rate: ${a.win_rate}%
      Drawdown: ${a.max_drawdown}%
      Trades: ${a.trade_count}
      `}).join("\n"),s=n.replace("{{AGENT_DATA}}",`Market Context: ${r}
${o}`),l=await i(a,s);return{title:`Agent Performance Report - Week ${new Date().getWeek()}`,slug:`agent-report-week-${new Date().getWeek()}-${new Date().getFullYear()}`,type:"agent-report",status:"draft",content:l,tags:["weekly-report","performance","stats"],author:"gICM Desk"}}async generateModelUpdateLog(e,t){let r="";e.impact_metrics&&(r=e.impact_metrics.map(e=>`${e.metric}: ${e.before} -> ${e.after}`).join(", "));let n=o.replace("{{AGENT_NAME}}",t).replace("{{VERSION}}",e.version).replace("{{PREV_VERSION}}",e.previous_version||"N/A").replace("{{CHANGES}}",e.changes_summary).replace("{{IMPACT}}",r),s=await i(a,n);return{title:`Model Update: ${t} v${e.version}`,slug:`model-update-${t.toLowerCase().replace(/\s+/g,"-")}-${e.version.replace(".","-")}`,type:"changelog",status:"draft",content:s,tags:["dev-log","update",t],author:"gICM Engineering"}}}Date.prototype.getWeek=function(){let e=new Date(this.getFullYear(),0,1);return Math.ceil(((this.getTime()-e.getTime())/864e5+e.getDay()+1)/7)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[547,7536,3894,9138],()=>r(86112));module.exports=a})();