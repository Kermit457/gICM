"use strict";(()=>{var e={};e.id=1335,e.ids=[1335],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},91621:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>T,requestAsyncStorage:()=>g,routeModule:()=>h,serverHooks:()=>w,staticGenerationAsyncStorage:()=>m});var a={};r.r(a),r.d(a,{POST:()=>l});var n=r(28998),o=r(16006),s=r(14274),i=r(95663);let p=`
You are a viral Twitter/X ghostwriter for a high-frequency trading desk.
Convert the following blog post into a high-engagement Twitter thread (6-8 tweets).

POST CONTENT:
{{CONTENT}}

RULES:
1. First Tweet: Must be a "Hook". Provocative statement + data point. No "Here is a thread".
2. Body Tweets: One idea per tweet. Use "↓" or "👇" sparingly.
3. Tone: "Institutional macro brain with a degen edge".
4. Last Tweet: Call to action to read the full report + link placeholder {{LINK}}.
5. Formatting: Use bullet points "•" for lists. Keep tweets under 240 chars.

OUTPUT FORMAT:
Return a JSON array of strings, where each string is one tweet.
Example: ["Tweet 1 text", "Tweet 2 text"]
`,u=new(r(49138)).ZP({apiKey:process.env.ANTHROPIC_API_KEY});async function c(e){try{let t=p.replace("{{CONTENT}}",e),r=await u.messages.create({model:"claude-3-5-sonnet-20240620",max_tokens:1500,system:"You are a specialized social media engine.",messages:[{role:"user",content:t}],temperature:.7});if("text"===r.content[0].type){let e=r.content[0].text,t=e.match(/\[[\s\S]*\]/);if(t)return JSON.parse(t[0]);return JSON.parse(e)}return[]}catch(e){return console.error("Thread generation failed:",e),["Error generating thread."]}}var d=r(73894);async function l(e){try{let t=function(){let e="https://bscpftwzsgmuhxaceqhy.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;return e&&t?(0,d.eI)(e,t):null}();if(!t)return i.NextResponse.json({error:"Supabase not configured"},{status:500});let{post_id:r}=await e.json(),{data:a}=await t.from("posts").select("content").eq("id",r).single();if(!a)return i.NextResponse.json({error:"Post not found"},{status:404});let n=await c(a.content);return i.NextResponse.json({success:!0,thread:n})}catch(e){return console.error("Failed to repurpose thread:",e),i.NextResponse.json({error:e.message},{status:500})}}let h=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/content/repurpose-thread/route",pathname:"/api/content/repurpose-thread",filename:"route",bundlePath:"app/api/content/repurpose-thread/route"},resolvedPagePath:"C:\\Users\\mirko\\OneDrive\\Desktop\\gICM\\apps\\dashboard\\app\\api\\content\\repurpose-thread\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:w}=h,f="/api/content/repurpose-thread/route";function T(){return(0,s.patchFetch)({serverHooks:w,staticGenerationAsyncStorage:m})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[547,7536,3894,9138],()=>r(91621));module.exports=a})();