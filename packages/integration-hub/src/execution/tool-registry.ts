/**
 * Tool Registry - Maps tool IDs to gICM agent implementations
 *
 * This registry connects PTC pipeline steps to actual agent packages,
 * enabling real execution of multi-agent workflows.
 */

import { z } from "zod";

// Tool category for organization
export type ToolCategory =
  | "research"
  | "trading"
  | "security"
  | "content"
  | "analytics"
  | "wallet"
  | "defi"
  | "social";

// Tool execution result
export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  duration?: number;
}

// Tool definition
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  package: string; // npm package name
  agentClass: string; // class name to instantiate
  defaultConfig: Record<string, unknown>;
  inputSchema: z.ZodSchema;
  outputSchema?: z.ZodSchema;
  estimatedCost: number; // estimated $ per execution
  estimatedTokens: number; // estimated tokens per execution
  requiresApiKey?: string[]; // env vars required
}

// Tool registry singleton
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private initialized = false;

  /**
   * Register all available tools
   */
  initialize(): void {
    if (this.initialized) return;

    // Hunter Agent Tools
    this.register({
      id: "hunter-agent",
      name: "Hunter Agent",
      description: "Discover opportunities from multiple sources (GitHub, Twitter, HN, etc.)",
      category: "research",
      package: "@gicm/hunter-agent",
      agentClass: "HunterAgent",
      defaultConfig: {
        sources: [
          { source: "github", enabled: true },
          { source: "hackernews", enabled: true },
        ],
      },
      inputSchema: z.object({
        sources: z.array(z.string()).optional(),
        action: z.enum(["hunt", "status"]).default("hunt"),
      }),
      estimatedCost: 0.002,
      estimatedTokens: 500,
    });

    this.register({
      id: "github-hunter",
      name: "GitHub Hunter",
      description: "Discover trending repositories and projects on GitHub",
      category: "research",
      package: "@gicm/hunter-agent",
      agentClass: "GitHubHunter",
      defaultConfig: {
        source: "github",
        enabled: true,
      },
      inputSchema: z.object({
        language: z.string().optional(),
        since: z.enum(["daily", "weekly", "monthly"]).optional(),
      }),
      estimatedCost: 0.001,
      estimatedTokens: 200,
    });

    this.register({
      id: "twitter-hunter",
      name: "Twitter Hunter",
      description: "Monitor Twitter for crypto/AI discussions and trends",
      category: "social",
      package: "@gicm/hunter-agent",
      agentClass: "TwitterHunter",
      defaultConfig: {
        source: "twitter",
        enabled: true,
      },
      inputSchema: z.object({
        query: z.string().optional(),
        accounts: z.array(z.string()).optional(),
      }),
      estimatedCost: 0.001,
      estimatedTokens: 300,
      requiresApiKey: ["TWITTER_BEARER_TOKEN"],
    });

    // Wallet Agent Tools
    this.register({
      id: "wallet-agent",
      name: "Wallet Agent",
      description: "Check wallet balances and manage token accounts",
      category: "wallet",
      package: "@gicm/wallet-agent",
      agentClass: "SolanaWallet",
      defaultConfig: {},
      inputSchema: z.object({
        action: z.enum(["balance", "tokens", "history"]).default("balance"),
        address: z.string().optional(),
      }),
      estimatedCost: 0,
      estimatedTokens: 100,
      requiresApiKey: ["SOLANA_RPC_URL"],
    });

    this.register({
      id: "token-balance",
      name: "Token Balance",
      description: "Get token balances for a Solana wallet",
      category: "wallet",
      package: "@gicm/wallet-agent",
      agentClass: "SolanaWallet",
      defaultConfig: {},
      inputSchema: z.object({
        address: z.string(),
        mint: z.string().optional(),
      }),
      estimatedCost: 0,
      estimatedTokens: 50,
    });

    // DeFi Agent Tools
    this.register({
      id: "defi-agent",
      name: "DeFi Agent",
      description: "Analyze DeFi protocols, yields, and opportunities",
      category: "defi",
      package: "@gicm/defi-agent",
      agentClass: "DeFiAgent",
      defaultConfig: {},
      inputSchema: z.object({
        protocol: z.string().optional(),
        chain: z.string().default("solana"),
        action: z.enum(["analyze", "yields", "tvl"]).default("analyze"),
      }),
      estimatedCost: 0.003,
      estimatedTokens: 800,
    });

    // Audit Agent Tools
    this.register({
      id: "audit-agent",
      name: "Audit Agent",
      description: "Security audit for smart contracts",
      category: "security",
      package: "@gicm/audit-agent",
      agentClass: "AuditAgent",
      defaultConfig: {},
      inputSchema: z.object({
        contract: z.string(),
        chain: z.string().default("solana"),
        depth: z.enum(["quick", "standard", "deep"]).default("standard"),
      }),
      estimatedCost: 0.01,
      estimatedTokens: 2000,
    });

    // Decision Agent Tools
    this.register({
      id: "decision-agent",
      name: "Decision Agent",
      description: "Make trading decisions based on analysis",
      category: "trading",
      package: "@gicm/decision-agent",
      agentClass: "DecisionAgent",
      defaultConfig: {},
      inputSchema: z.object({
        analysis: z.unknown(),
        riskTolerance: z.enum(["low", "medium", "high"]).default("medium"),
        portfolio: z.unknown().optional(),
      }),
      estimatedCost: 0.005,
      estimatedTokens: 1000,
    });

    // Social Agent Tools
    this.register({
      id: "social-agent",
      name: "Social Agent",
      description: "Social media automation and content scheduling",
      category: "social",
      package: "@gicm/social-agent",
      agentClass: "SocialAgent",
      defaultConfig: {},
      inputSchema: z.object({
        platform: z.enum(["twitter", "discord", "telegram"]),
        action: z.enum(["post", "schedule", "analyze"]),
        content: z.string().optional(),
      }),
      estimatedCost: 0.002,
      estimatedTokens: 400,
    });

    // Content Generation Tools (Growth Engine)
    this.register({
      id: "blog-generator",
      name: "Blog Generator",
      description: "Generate SEO-optimized blog posts",
      category: "content",
      package: "@gicm/growth-engine",
      agentClass: "BlogGenerator",
      defaultConfig: {},
      inputSchema: z.object({
        topic: z.string(),
        keywords: z.array(z.string()).optional(),
        length: z.enum(["short", "medium", "long"]).default("medium"),
      }),
      estimatedCost: 0.02,
      estimatedTokens: 4000,
    });

    this.register({
      id: "tweet-generator",
      name: "Tweet Generator",
      description: "Generate engaging tweets from content",
      category: "content",
      package: "@gicm/growth-engine",
      agentClass: "TweetGenerator",
      defaultConfig: {},
      inputSchema: z.object({
        content: z.string(),
        style: z.enum(["informative", "engaging", "promotional"]).default("engaging"),
        count: z.number().default(5),
      }),
      estimatedCost: 0.005,
      estimatedTokens: 800,
    });

    this.register({
      id: "seo-researcher",
      name: "SEO Researcher",
      description: "Research keywords and SEO opportunities",
      category: "content",
      package: "@gicm/growth-engine",
      agentClass: "KeywordResearcher",
      defaultConfig: {},
      inputSchema: z.object({
        topic: z.string(),
        competitors: z.array(z.string()).optional(),
      }),
      estimatedCost: 0.003,
      estimatedTokens: 600,
    });

    // Analytics Tools
    this.register({
      id: "sentiment-analyzer",
      name: "Sentiment Analyzer",
      description: "Analyze sentiment from social data",
      category: "analytics",
      package: "@gicm/hunter-agent",
      agentClass: "SentimentAnalyzer",
      defaultConfig: {},
      inputSchema: z.object({
        data: z.unknown(),
        source: z.string().optional(),
      }),
      estimatedCost: 0.002,
      estimatedTokens: 500,
    });

    this.register({
      id: "price-oracle",
      name: "Price Oracle",
      description: "Get real-time token prices from multiple sources",
      category: "trading",
      package: "@gicm/defi-agent",
      agentClass: "PriceOracle",
      defaultConfig: {},
      inputSchema: z.object({
        token: z.string(),
        chain: z.string().default("solana"),
      }),
      estimatedCost: 0,
      estimatedTokens: 50,
    });

    // Report Generation
    this.register({
      id: "report-generator",
      name: "Report Generator",
      description: "Generate comprehensive analysis reports",
      category: "analytics",
      package: "@gicm/agent-core",
      agentClass: "ReportGenerator",
      defaultConfig: {},
      inputSchema: z.object({
        data: z.unknown(),
        format: z.enum(["markdown", "json", "html"]).default("markdown"),
        sections: z.array(z.string()).optional(),
      }),
      estimatedCost: 0.01,
      estimatedTokens: 2000,
    });

    this.initialized = true;
  }

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Get a tool by ID
   */
  get(id: string): ToolDefinition | undefined {
    this.initialize();
    return this.tools.get(id);
  }

  /**
   * Get all tools
   */
  getAll(): ToolDefinition[] {
    this.initialize();
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: ToolCategory): ToolDefinition[] {
    this.initialize();
    return this.getAll().filter((t) => t.category === category);
  }

  /**
   * Search tools by name or description
   */
  search(query: string): ToolDefinition[] {
    this.initialize();
    const lower = query.toLowerCase();
    return this.getAll().filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower)
    );
  }

  /**
   * Check if a tool exists
   */
  has(id: string): boolean {
    this.initialize();
    return this.tools.has(id);
  }

  /**
   * Validate inputs for a tool
   */
  validateInputs(toolId: string, inputs: unknown): { valid: boolean; error?: string } {
    const tool = this.get(toolId);
    if (!tool) {
      return { valid: false, error: `Tool not found: ${toolId}` };
    }

    try {
      tool.inputSchema.parse(inputs);
      return { valid: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation failed";
      return { valid: false, error: message };
    }
  }

  /**
   * Get estimated cost for executing a tool
   */
  getEstimatedCost(toolId: string): { cost: number; tokens: number } {
    const tool = this.get(toolId);
    if (!tool) {
      return { cost: 0.01, tokens: 500 }; // default estimates
    }
    return {
      cost: tool.estimatedCost,
      tokens: tool.estimatedTokens,
    };
  }

  /**
   * Check if required API keys are available
   */
  checkRequirements(toolId: string): { ready: boolean; missing: string[] } {
    const tool = this.get(toolId);
    if (!tool || !tool.requiresApiKey) {
      return { ready: true, missing: [] };
    }

    const missing = tool.requiresApiKey.filter((key) => !process.env[key]);
    return {
      ready: missing.length === 0,
      missing,
    };
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

// Export for easy access
export function getToolRegistry(): ToolRegistry {
  return toolRegistry;
}
