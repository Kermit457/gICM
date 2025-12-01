import { getContentStorage } from "../storage/content-storage.js";
import type {
  EngineEvent,
  WinRecord,
  ContentBrief,
  ContentArticle,
  ContentSEO,
  DistributionPacket,
} from "../types/content.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get directory of this file for relative prompt paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.resolve(__dirname, "../../prompts");

// =============================================================================
// LLM CLIENT SETUP
// =============================================================================

interface LLMConfig {
  provider: "anthropic" | "openai" | "gemini";
  apiKey: string;
  model?: string;
}

interface ContentLLMOptions {
  useMock?: boolean; // For testing without API calls
  config?: LLMConfig;
}

// Get LLM config from environment
function getLLMConfig(): LLMConfig | null {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    };
  }
  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }
  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }
  return null;
}

// =============================================================================
// REAL LLM CALL
// =============================================================================

async function callRealLLM(
  systemPrompt: string,
  userInput: string,
  config: LLMConfig
): Promise<string> {
  if (config.provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 8192,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: userInput }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { content: Array<{ text?: string }> };
    return data.content[0]?.text || "";
  }

  if (config.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || "";
  }

  if (config.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userInput }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

// =============================================================================
// MOCK LLM CALL (for testing/fallback)
// =============================================================================

function generateMockResponse(promptName: string, input: any): any {
  console.log(`[CONTENT-MOCK] Generating mock response for ${promptName}`);

  if (promptName === "orchestrator-content-agent") {
    const briefId = `brief_${Date.now()}`;
    const keyIdea =
      input.events.length > 0
        ? `Insights from ${input.events[0].engine} regarding ${input.events[0].title}`
        : "General market update and agent performance summary";

    return [
      {
        id: briefId,
        createdAt: new Date().toISOString(),
        primaryGoal: "build_authority",
        narrativeAngle: "macro_thesis",
        primaryAudience: "traders",
        timeScope: "daily",
        keyIdea,
        events: input.events.slice(0, 3),
        wins: input.wins?.slice(0, 2) || [],
        marketContext: input.marketContext || { notes: "Market context" },
        targetLength: "longform",
        targetChannels: ["blog", "substack", "twitter"],
        primaryCTA: "try_agent",
        seedKeywords: ["gICM", "AI agents", "trading", "market analysis", "ICM"],
      } as ContentBrief,
    ];
  }

  if (promptName.startsWith("writer-")) {
    const brief: ContentBrief = input;
    let title = "";
    let body = "";

    if (brief.narrativeAngle === "macro_thesis" || brief.narrativeAngle === "playbook_howto") {
      title = `Macro Outlook: ${brief.keyIdea}`;
      body = `## What changed in the market\n\nDetails about recent market movements and trends.\n\n`;
      body += `## How our agents responded\n\nOur agents detected patterns and executed strategies.\n\n`;
      body += `## Key takeaways\n\n- Takeaway 1\n- Takeaway 2\n- Takeaway 3\n\n`;
    } else if (brief.narrativeAngle === "devlog" || brief.narrativeAngle === "product_launch") {
      title = `Devlog: ${brief.keyIdea}`;
      body = `## What we shipped\n\nNew features and improvements.\n\n`;
      body += `## Why it matters\n\nPerformance improvements and new capabilities.\n\n`;
      body += `## How to use it\n\n1. Step one\n2. Step two\n3. Step three\n\n`;
    } else if (brief.narrativeAngle === "trading_case_study") {
      title = `Trading Case Study: ${brief.keyIdea}`;
      body = `## Setup\n\nMarket conditions and context.\n\n`;
      body += `## Agent Behavior\n\nHow our agents responded.\n\n`;
      body += `## Results\n\nPerformance metrics.\n\n`;
      body += `## Disclaimer\n\nTrading involves risk.\n\n`;
    }
    return `# ${title}\n\n${body}`;
  }

  if (promptName === "seo-optimizer") {
    const { brief } = input;
    const slug = brief.keyIdea
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-*|-*$/g, "");
    return {
      seoTitle: brief.keyIdea.slice(0, 60),
      metaDescription: `${brief.keyIdea} - gICM AI agents platform insights.`,
      slug,
      keywords: [...(brief.seedKeywords || []), "AI", "ICM", "agents"],
      faqs: [`What is ${brief.keyIdea}?`, "How do AI agents work?"],
      internalLinks: ["[LINK:gicm_agents]", "[LINK:money_engine]"],
      externalLinks: [],
    } as ContentSEO;
  }

  if (promptName === "distribution-splitter") {
    const { articleMarkdown, seo, brief } = input;
    const firstLine = articleMarkdown.split("\n")[0].replace("# ", "");
    return {
      baseSlug: seo.slug,
      canonicalUrl: `https://gicm.dev/blog/${seo.slug}`,
      blogPost: articleMarkdown,
      substackBody: articleMarkdown,
      mirrorBody: articleMarkdown,
      mediumBody: articleMarkdown,
      devtoBody: brief.narrativeAngle === "devlog" ? articleMarkdown : undefined,
      hashnodeBody: brief.narrativeAngle === "devlog" ? articleMarkdown : undefined,
      twitterThread: [
        `${firstLine.slice(0, 200)}... #ICM #AI`,
        "Key insights from our latest analysis.",
        `Read the full article: https://gicm.dev/blog/${seo.slug}`,
      ],
      linkedinPost: `${brief.keyIdea}\n\n- Key insight 1\n- Key insight 2\n\n#AI #InternetCapitalMarkets`,
      status: "ready" as const,
    };
  }

  return {};
}

// =============================================================================
// UNIFIED LLM CALL
// =============================================================================

async function callLLM(
  promptName: string,
  input: any,
  options: ContentLLMOptions = {}
): Promise<any> {
  const promptPath = path.join(PROMPTS_DIR, `${promptName}.prompt.md`);
  let promptContent: string;

  try {
    promptContent = await fs.readFile(promptPath, "utf-8");
  } catch (error) {
    console.error(`[CONTENT] Failed to read prompt file ${promptPath}:`, error);
    throw new Error(`Prompt file not found: ${promptName}`);
  }

  // Check if we should use mock
  const config = options.config || getLLMConfig();
  const useMock = options.useMock || !config || process.env.CONTENT_USE_MOCK === "true";

  if (useMock) {
    console.log(`[CONTENT] Using mock LLM for ${promptName}`);
    return generateMockResponse(promptName, input);
  }

  // Real LLM call
  console.log(`[CONTENT] Calling ${config.provider} for ${promptName}...`);

  const userInput = JSON.stringify(input, null, 2);

  try {
    const response = await callRealLLM(promptContent, userInput, config);

    // Parse JSON from response if expected
    if (
      promptName === "orchestrator-content-agent" ||
      promptName === "seo-optimizer" ||
      promptName === "distribution-splitter"
    ) {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                        response.match(/\[[\s\S]*\]/) ||
                        response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      }
      // If no JSON found, try parsing the whole response
      return JSON.parse(response);
    }

    // For writer prompts, return markdown as-is
    return response;
  } catch (error) {
    console.error(`[CONTENT] LLM call failed for ${promptName}:`, error);
    console.log(`[CONTENT] Falling back to mock response`);
    return generateMockResponse(promptName, input);
  }
}

export async function generateContentBriefsDaily(): Promise<void> {
  const storage = getContentStorage();
  await storage.initialize();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await storage.getEngineEventsSince(since);
  const wins = await storage.getWinRecordsSince(since);

  console.log(`[CONTENT-ORCHESTRATOR] Processing ${events.length} events and ${wins.length} wins`);

  const marketContext = {
    btcUsd: 0, // In real app, fetch from price feed
    notes: "Market data stub",
  };

  // Call Orchestrator Agent
  // In a real scenario, this would involve sending `promptContent` and `input` to an LLM API.
  // The LLM's response (a JSON string) would then be parsed here.
  const input = { events, wins, marketContext };
  const briefs: ContentBrief[] = await callLLM("orchestrator-content-agent", input);

  for (const brief of briefs) {
    await storage.saveContentBrief(brief);
    console.log(`[CONTENT-ORCHESTRATOR] Generated brief: ${brief.id} - ${brief.keyIdea}`);
  }
}

export async function materializeContentFromBriefs(): Promise<void> {
  const storage = getContentStorage();
  await storage.initialize();

  const pendingBriefs = await storage.listPendingBriefs();
  console.log(`[CONTENT-PRODUCTION] Found ${pendingBriefs.length} pending briefs`);

  for (const brief of pendingBriefs) {
    // 1. Writer Agent
    let writerPrompt = "writer-macro";
    if (brief.narrativeAngle === "devlog" || brief.narrativeAngle === "product_launch") {
      writerPrompt = "writer-devlog";
    } else if (brief.narrativeAngle === "trading_case_study") {
      writerPrompt = "writer-trading";
    }

    // Call Writer Agent
    // The LLM would generate the markdown article based on the prompt and brief.
    const articleMarkdown = await callLLM(writerPrompt, brief);

    // 2. SEO Optimizer
    // The LLM would generate SEO metadata based on the prompt, article, and brief.
    const seo = await callLLM("seo-optimizer", { articleMarkdown, brief });

    const article = {
        id: `art_${Date.now()}`,
        briefId: brief.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        markdown: articleMarkdown,
        seo,
        status: "draft" as const
    };
    
    await storage.saveContentArticle(article);

    // 3. Distribution Splitter
    // The LLM would generate channel-specific content based on the prompt, article, seo, and brief.
    const packetData = await callLLM("distribution-splitter", { articleMarkdown, seo, brief });
    
    await storage.saveDistributionPacket({
        ...packetData,
        id: `pkt_${Date.now()}`,
        articleId: article.id,
        createdAt: new Date().toISOString()
    });
    
    console.log(`[CONTENT-PRODUCTION] Produced content for brief ${brief.id}`);
  }
}