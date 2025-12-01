"use strict";(()=>{var e={};e.id=2137,e.ids=[2137],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},96458:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>w,patchFetch:()=>y,requestAsyncStorage:()=>h,routeModule:()=>g,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{POST:()=>p});var n=a(28998),o=a(16006),s=a(14274),i=a(95663),l=a(12542),u=a(58571),c=a(73894);let d=new u.n;async function p(e){try{let t=function(){let e="https://bscpftwzsgmuhxaceqhy.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;return e&&t?(0,c.eI)(e,t):null}();if(!t)return i.NextResponse.json({error:"Supabase not configured"},{status:500});let{agent_slug:a,version:r,changes:n,impact:o}=await e.json(),{data:s}=await t.from("agents").select("*").eq("slug",a).single();if(!s)return i.NextResponse.json({error:"Agent not found"},{status:404});let u={agent_id:s.id,version:r,previous_version:s.current_version,deployed_at:new Date().toISOString(),changes_summary:n,tech_details:"",impact_metrics:o};await (0,l.GG)(u),await t.from("agents").update({current_version:r}).eq("id",s.id);let p=await d.generateModelUpdateLog(u,s.name),{data:g,error:h}=await t.from("posts").insert(p).select().single();if(h)throw h;return i.NextResponse.json({success:!0,update:u,post:g})}catch(e){return console.error("Failed to log update:",e),i.NextResponse.json({error:e.message},{status:500})}}let g=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/content/log-update/route",pathname:"/api/content/log-update",filename:"route",bundlePath:"app/api/content/log-update/route"},resolvedPagePath:"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\api\\content\\log-update\\route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:f}=g,w="/api/content/log-update/route";function y(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},12542:(e,t,a)=>{a.d(t,{GG:()=>u,j8:()=>i,pr:()=>l});var r=a(73894);let n="https://bscpftwzsgmuhxaceqhy.supabase.co",o=process.env.SUPABASE_SERVICE_ROLE_KEY||"",s=n&&o?(0,r.eI)(n,o):null;async function i(e="active"){if(!s)return[];let t=s.from("agents").select("*");"all"!==e&&(t=t.eq("status",e));let{data:a,error:r}=await t;if(r)throw r;return a}async function l(e,t="weekly",a=10){if(!s)return[];let{data:r,error:n}=await s.from("agent_metrics").select("*").eq("agent_id",e).eq("timeframe",t).order("end_date",{ascending:!1}).limit(a);if(n)throw n;return r}async function u(e){if(!s)throw Error("Supabase not configured");let{error:t}=await s.from("model_updates").insert(e);if(t)throw t}},58571:(e,t,a)=>{a.d(t,{n:()=>l});let r=`
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
`,s=new(a(49138)).ZP({apiKey:process.env.ANTHROPIC_API_KEY});async function i(e,t){try{let a=await s.messages.create({model:"claude-3-5-sonnet-20240620",max_tokens:1500,system:e,messages:[{role:"user",content:t}],temperature:.7});if("text"===a.content[0].type)return a.content[0].text;return""}catch(e){return console.error("Error calling LLM:",e),"Error generating content. Please check logs."}}class l{async generateWeeklyReport(e,t,a){let o=e.map(e=>{let a=t.filter(t=>t.agent_id===e.id);if(0===a.length)return"";let r=a[0];return`
      Agent: ${e.name} (${e.strategy_type})
      PnL: ${r.pnl_abs} (${r.pnl_percent}%)
      Win Rate: ${r.win_rate}%
      Drawdown: ${r.max_drawdown}%
      Trades: ${r.trade_count}
      `}).join("\n"),s=n.replace("{{AGENT_DATA}}",`Market Context: ${a}
${o}`),l=await i(r,s);return{title:`Agent Performance Report - Week ${new Date().getWeek()}`,slug:`agent-report-week-${new Date().getWeek()}-${new Date().getFullYear()}`,type:"agent-report",status:"draft",content:l,tags:["weekly-report","performance","stats"],author:"gICM Desk"}}async generateModelUpdateLog(e,t){let a="";e.impact_metrics&&(a=e.impact_metrics.map(e=>`${e.metric}: ${e.before} -> ${e.after}`).join(", "));let n=o.replace("{{AGENT_NAME}}",t).replace("{{VERSION}}",e.version).replace("{{PREV_VERSION}}",e.previous_version||"N/A").replace("{{CHANGES}}",e.changes_summary).replace("{{IMPACT}}",a),s=await i(r,n);return{title:`Model Update: ${t} v${e.version}`,slug:`model-update-${t.toLowerCase().replace(/\s+/g,"-")}-${e.version.replace(".","-")}`,type:"changelog",status:"draft",content:s,tags:["dev-log","update",t],author:"gICM Engineering"}}}Date.prototype.getWeek=function(){let e=new Date(this.getFullYear(),0,1);return Math.ceil(((this.getTime()-e.getTime())/864e5+e.getDay()+1)/7)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[547,7536,3894,9138],()=>a(96458));module.exports=r})();