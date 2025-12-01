import {
  PIPELINE_TEMPLATES,
  contentGeneration,
  getTemplate,
  listTemplates,
  listTemplatesByCategory,
  portfolioAnalysis,
  researchAndAnalyze,
  securityAudit,
  swapToken
} from "./chunk-TQRJACRL.js";

// src/coordinator.ts
import { EventEmitter } from "eventemitter3";

// src/types.ts
import { z } from "zod";
var ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  input_schema: z.object({
    type: z.literal("object"),
    properties: z.record(z.object({
      type: z.string(),
      description: z.string(),
      enum: z.array(z.string()).optional()
    })),
    required: z.array(z.string())
  })
});
var PipelineStepSchema = z.object({
  id: z.string(),
  tool: z.string(),
  inputs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  dependsOn: z.array(z.string()).optional(),
  condition: z.string().optional(),
  // JS expression
  retries: z.number().optional(),
  timeout: z.number().optional()
});
var PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default("1.0.0"),
  steps: z.array(PipelineStepSchema),
  inputs: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional()
  })).optional(),
  outputs: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    riskLevel: z.enum(["safe", "low", "medium", "high", "critical"]).optional(),
    estimatedDuration: z.number().optional()
    // ms
  }).optional()
});
var SharedContextSchema = z.object({
  // Input parameters from user
  inputs: z.record(z.unknown()),
  // Results from completed steps
  results: z.record(z.unknown()),
  // Accumulated state
  state: z.record(z.unknown()),
  // Execution metadata
  meta: z.object({
    startTime: z.number(),
    currentStep: z.string().optional(),
    completedSteps: z.array(z.string()),
    errors: z.array(z.object({
      step: z.string(),
      error: z.string(),
      timestamp: z.number()
    }))
  })
});
var StepResultSchema = z.object({
  stepId: z.string(),
  status: z.enum(["success", "error", "skipped"]),
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number(),
  timestamp: z.number()
});
var PipelineResultSchema = z.object({
  pipelineId: z.string(),
  status: z.enum(["success", "partial", "error"]),
  steps: z.array(StepResultSchema),
  finalOutput: z.unknown().optional(),
  totalDuration: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  context: SharedContextSchema
});
var ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string()
  })),
  warnings: z.array(z.object({
    path: z.string(),
    message: z.string()
  })),
  riskScore: z.number().min(0).max(100),
  estimatedTokens: z.number()
});
var DEFAULT_PTC_CONFIG = {
  maxConcurrency: 5,
  defaultTimeout: 3e4,
  maxRetries: 2,
  enableAuditLog: true,
  sandboxed: true
};

// src/coordinator.ts
var PTCCoordinator = class extends EventEmitter {
  config;
  registry;
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_PTC_CONFIG, ...config };
    this.registry = {
      tools: /* @__PURE__ */ new Map(),
      handlers: /* @__PURE__ */ new Map(),
      register: (tool, handler) => {
        this.registry.tools.set(tool.name, tool);
        this.registry.handlers.set(tool.name, handler);
      },
      get: (name) => {
        const tool = this.registry.tools.get(name);
        const handler = this.registry.handlers.get(name);
        if (!tool || !handler) return void 0;
        return { tool, handler };
      },
      has: (name) => this.registry.tools.has(name),
      list: () => Array.from(this.registry.tools.values())
    };
  }
  /**
   * Register a tool with its handler
   */
  registerTool(tool, handler) {
    this.registry.register(tool, handler);
  }
  /**
   * Validate a pipeline before execution
   */
  validate(pipeline) {
    const errors = [];
    const warnings = [];
    let riskScore = 0;
    let estimatedTokens = 0;
    for (const step of pipeline.steps) {
      if (!this.registry.has(step.tool)) {
        errors.push({
          path: `steps.${step.id}.tool`,
          message: `Tool "${step.tool}" not found in registry`
        });
      }
      estimatedTokens += 500;
    }
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Set();
    const hasCycle = (stepId) => {
      if (visiting.has(stepId)) return true;
      if (visited.has(stepId)) return false;
      visiting.add(stepId);
      const step = pipeline.steps.find((s) => s.id === stepId);
      if (step?.dependsOn) {
        for (const dep of step.dependsOn) {
          if (hasCycle(dep)) return true;
        }
      }
      visiting.delete(stepId);
      visited.add(stepId);
      return false;
    };
    for (const step of pipeline.steps) {
      if (hasCycle(step.id)) {
        errors.push({
          path: `steps.${step.id}`,
          message: "Circular dependency detected"
        });
        break;
      }
    }
    const stepIds = new Set(pipeline.steps.map((s) => s.id));
    for (const step of pipeline.steps) {
      if (step.dependsOn) {
        for (const dep of step.dependsOn) {
          if (!stepIds.has(dep)) {
            errors.push({
              path: `steps.${step.id}.dependsOn`,
              message: `Dependency "${dep}" not found`
            });
          }
        }
      }
    }
    if (pipeline.metadata?.riskLevel) {
      const riskLevels = {
        safe: 10,
        low: 25,
        medium: 50,
        high: 75,
        critical: 95
      };
      riskScore = riskLevels[pipeline.metadata.riskLevel] || 50;
    } else {
      riskScore = Math.min(pipeline.steps.length * 10, 80);
    }
    if (pipeline.steps.length > 10) {
      warnings.push({
        path: "steps",
        message: "Large pipeline may take longer to execute"
      });
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskScore,
      estimatedTokens
    };
  }
  /**
   * Execute a pipeline
   */
  async execute(pipeline, inputs = {}) {
    const startTime = Date.now();
    const context = {
      inputs,
      results: {},
      state: {},
      meta: {
        startTime,
        completedSteps: [],
        errors: []
      }
    };
    const validation = this.validate(pipeline);
    if (!validation.valid) {
      return {
        pipelineId: pipeline.id,
        status: "error",
        steps: [],
        totalDuration: Date.now() - startTime,
        startTime,
        endTime: Date.now(),
        context
      };
    }
    this.emit("pipeline:start", pipeline, context);
    const stepResults = [];
    const completedSteps = /* @__PURE__ */ new Set();
    const executionOrder = this.topologicalSort(pipeline.steps);
    for (const stepId of executionOrder) {
      const step = pipeline.steps.find((s) => s.id === stepId);
      context.meta.currentStep = stepId;
      if (step.dependsOn) {
        const depsOk = step.dependsOn.every((dep) => completedSteps.has(dep));
        if (!depsOk) {
          const result2 = {
            stepId: step.id,
            status: "skipped",
            duration: 0,
            timestamp: Date.now()
          };
          stepResults.push(result2);
          this.emit("step:skip", step, "Dependencies not met");
          continue;
        }
      }
      if (step.condition) {
        try {
          const conditionFn = new Function(
            "inputs",
            "results",
            "state",
            `return ${step.condition}`
          );
          const shouldRun = conditionFn(
            context.inputs,
            context.results,
            context.state
          );
          if (!shouldRun) {
            const result2 = {
              stepId: step.id,
              status: "skipped",
              duration: 0,
              timestamp: Date.now()
            };
            stepResults.push(result2);
            this.emit("step:skip", step, "Condition not met");
            continue;
          }
        } catch (e) {
          const result2 = {
            stepId: step.id,
            status: "skipped",
            duration: 0,
            timestamp: Date.now()
          };
          stepResults.push(result2);
          this.emit("step:skip", step, `Condition evaluation failed: ${e}`);
          continue;
        }
      }
      const stepResult = await this.executeStep(step, context);
      stepResults.push(stepResult);
      if (stepResult.status === "success") {
        completedSteps.add(step.id);
        context.results[step.id] = stepResult.output;
        context.meta.completedSteps.push(step.id);
        this.emit("step:complete", stepResult, context);
      } else {
        context.meta.errors.push({
          step: step.id,
          error: stepResult.error || "Unknown error",
          timestamp: Date.now()
        });
        this.emit("step:error", new Error(stepResult.error), step);
      }
    }
    const endTime = Date.now();
    const result = {
      pipelineId: pipeline.id,
      status: this.determineStatus(stepResults),
      steps: stepResults,
      finalOutput: this.extractFinalOutput(pipeline, context),
      totalDuration: endTime - startTime,
      startTime,
      endTime,
      context
    };
    this.emit("pipeline:complete", result);
    return result;
  }
  /**
   * Execute a single step
   */
  async executeStep(step, context) {
    const stepStart = Date.now();
    this.emit("step:start", step, context);
    const toolEntry = this.registry.get(step.tool);
    if (!toolEntry) {
      return {
        stepId: step.id,
        status: "error",
        error: `Tool "${step.tool}" not found`,
        duration: Date.now() - stepStart,
        timestamp: stepStart
      };
    }
    const { handler } = toolEntry;
    const resolvedInputs = this.resolveInputs(step.inputs, context);
    let lastError;
    const maxRetries = step.retries ?? this.config.maxRetries;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeout = step.timeout ?? this.config.defaultTimeout;
        const output = await Promise.race([
          handler(resolvedInputs, context),
          new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)
          )
        ]);
        return {
          stepId: step.id,
          status: "success",
          output,
          duration: Date.now() - stepStart,
          timestamp: stepStart
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1e3 * 2 ** attempt));
        }
      }
    }
    return {
      stepId: step.id,
      status: "error",
      error: lastError?.message || "Unknown error",
      duration: Date.now() - stepStart,
      timestamp: stepStart
    };
  }
  /**
   * Resolve input references like ${results.step1.value}
   */
  resolveInputs(inputs, context) {
    const resolved = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === "string" && value.startsWith("${")) {
        const match = value.match(/\$\{(.+)\}/);
        if (match) {
          const path = match[1].split(".");
          let result = context;
          for (const part of path) {
            if (result && typeof result === "object") {
              result = result[part];
            } else {
              result = void 0;
              break;
            }
          }
          resolved[key] = result;
        } else {
          resolved[key] = value;
        }
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
  /**
   * Topological sort for execution order
   */
  topologicalSort(steps) {
    const result = [];
    const visited = /* @__PURE__ */ new Set();
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const step = stepMap.get(id);
      if (step?.dependsOn) {
        for (const dep of step.dependsOn) {
          visit(dep);
        }
      }
      result.push(id);
    };
    for (const step of steps) {
      visit(step.id);
    }
    return result;
  }
  /**
   * Determine overall pipeline status
   */
  determineStatus(results) {
    const hasError = results.some((r) => r.status === "error");
    const hasSuccess = results.some((r) => r.status === "success");
    if (!hasError) return "success";
    if (hasSuccess) return "partial";
    return "error";
  }
  /**
   * Extract final output based on pipeline outputs config
   */
  extractFinalOutput(pipeline, context) {
    if (!pipeline.outputs?.length) {
      return context.results;
    }
    const output = {};
    for (const outputPath of pipeline.outputs) {
      const path = outputPath.split(".");
      let value = context;
      for (const part of path) {
        if (value && typeof value === "object") {
          value = value[part];
        } else {
          value = void 0;
          break;
        }
      }
      output[outputPath] = value;
    }
    return output;
  }
  /**
   * Generate a pipeline from natural language intent
   */
  generateFromIntent(intent, availableTools) {
    const id = `pipeline_${Date.now()}`;
    const steps = [];
    if (intent.toLowerCase().includes("search") || intent.toLowerCase().includes("find")) {
      steps.push({
        id: "search",
        tool: "search_tools",
        inputs: { task: intent }
      });
    }
    if (intent.toLowerCase().includes("analyze")) {
      steps.push({
        id: "analyze",
        tool: "analyzer",
        inputs: { data: "${results.search}" },
        dependsOn: ["search"]
      });
    }
    return {
      id,
      name: "Generated Pipeline",
      description: `Auto-generated from: ${intent}`,
      version: "1.0.0",
      steps
    };
  }
};

// src/tools/hunter-tool.ts
var hunterToolDefinition = {
  name: "hunter_discover",
  description: `Hunt for opportunities across 17 sources: GitHub, HackerNews, Twitter, Reddit, ProductHunt, ArXiv, Lobsters, DevTo, TikTok, DeFiLlama, GeckoTerminal, Fear&Greed, Binance, FRED, SEC, Finnhub, NPM.

Use this tool to:
- Find trending repos and projects
- Discover alpha in DeFi (new pools, TVL changes)
- Track market sentiment and crypto trends
- Monitor economic indicators
- Find viral content and emerging narratives

Returns HuntDiscovery[] with metrics, relevance factors, and source-specific data.`,
  input_schema: {
    type: "object",
    properties: {
      sources: {
        type: "string",
        description: 'Comma-separated source names to hunt (e.g., "github,hackernews,defillama"). Leave empty for all sources.'
      },
      category: {
        type: "string",
        description: "Filter by category: web3, ai, defi, nft, tooling, other",
        enum: ["web3", "ai", "defi", "nft", "tooling", "other"]
      },
      minEngagement: {
        type: "string",
        description: "Minimum engagement score (stars, points, likes depending on source)"
      },
      keywords: {
        type: "string",
        description: "Comma-separated keywords to filter results"
      }
    },
    required: []
  }
};
var hunterScoreToolDefinition = {
  name: "hunter_score",
  description: `Score and rank hunt discoveries using Six Thinking Hats analysis.
Takes raw discoveries from hunter_discover and applies multi-perspective scoring:
- WHITE (Facts): Objective metrics
- RED (Emotions): Sentiment/hype level
- BLACK (Risks): Potential downsides
- YELLOW (Benefits): Upside potential
- GREEN (Creativity): Novel aspects
- BLUE (Process): Actionability

Returns scored discoveries with aggregate ranking.`,
  input_schema: {
    type: "object",
    properties: {
      discoveries: {
        type: "string",
        description: "JSON string of discoveries to score (from hunter_discover)"
      },
      weights: {
        type: "string",
        description: 'Optional JSON object of hat weights (e.g., {"yellow": 2, "black": 1.5})'
      }
    },
    required: ["discoveries"]
  }
};
var hunterFilterToolDefinition = {
  name: "hunter_filter",
  description: `Filter hunt discoveries based on criteria.
Use after hunter_discover to narrow down results.`,
  input_schema: {
    type: "object",
    properties: {
      discoveries: {
        type: "string",
        description: "JSON string of discoveries to filter"
      },
      minScore: {
        type: "string",
        description: "Minimum score to include (0-100)"
      },
      maxAge: {
        type: "string",
        description: "Maximum age in hours"
      },
      categories: {
        type: "string",
        description: "Comma-separated categories to include"
      },
      hasWeb3: {
        type: "string",
        description: "Filter to only Web3-related discoveries (true/false)"
      },
      hasAI: {
        type: "string",
        description: "Filter to only AI-related discoveries (true/false)"
      },
      limit: {
        type: "string",
        description: "Maximum number of results"
      }
    },
    required: ["discoveries"]
  }
};
var createHunterDiscoverHandler = (hunterAgentFactory) => {
  return async (inputs, context) => {
    const sourcesStr = inputs.sources;
    const sources = sourcesStr ? sourcesStr.split(",").map((s) => s.trim()) : void 0;
    const category = inputs.category;
    const minEngagementStr = inputs.minEngagement;
    const minEngagement = minEngagementStr ? parseInt(minEngagementStr, 10) : 0;
    const keywordsStr = inputs.keywords;
    const keywords = keywordsStr ? keywordsStr.split(",").map((k) => k.trim().toLowerCase()) : [];
    try {
      const hunter = await hunterAgentFactory();
      const discoveries = await hunter.huntNow(sources);
      let filtered = discoveries;
      if (category) {
        filtered = filtered.filter((d) => d.category === category);
      }
      if (minEngagement > 0) {
        filtered = filtered.filter((d) => {
          const engagement = Math.max(
            d.metrics?.stars ?? 0,
            d.metrics?.points ?? 0,
            d.metrics?.likes ?? 0
          );
          return engagement >= minEngagement;
        });
      }
      if (keywords.length > 0) {
        filtered = filtered.filter((d) => {
          const text = `${d.title ?? ""} ${d.description ?? ""} ${(d.tags ?? []).join(" ")}`.toLowerCase();
          return keywords.some((k) => text.includes(k));
        });
      }
      return {
        success: true,
        count: filtered.length,
        discoveries: filtered,
        sources: sources ?? ["all"],
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        discoveries: []
      };
    }
  };
};
var createHunterScoreHandler = () => {
  return async (inputs, _context) => {
    const discoveriesStr = inputs.discoveries;
    const weightsStr = inputs.weights;
    try {
      const discoveries = JSON.parse(discoveriesStr);
      const weights = weightsStr ? JSON.parse(weightsStr) : {};
      const hatWeights = {
        white: weights.white ?? 1,
        // Facts
        red: weights.red ?? 0.8,
        // Emotions
        black: weights.black ?? 1.2,
        // Risks (inversely impacts score)
        yellow: weights.yellow ?? 1.5,
        // Benefits
        green: weights.green ?? 1.3,
        // Creativity
        blue: weights.blue ?? 1
        // Process
      };
      const scoredDiscoveries = discoveries.map((d) => {
        const metrics = d.metrics ?? {};
        const whiteScore = Math.min(100, ((metrics.stars ?? 0) / 100 + (metrics.points ?? 0) / 10 + (metrics.forks ?? 0) / 50 + (metrics.comments ?? 0) / 20) * 10);
        const factors = d.relevanceFactors ?? {};
        const redScore = (factors.highEngagement ? 30 : 0) + (factors.isShowHN ? 20 : 0) + (metrics.likes ?? 0 > 100 ? 30 : 0) + 20;
        const blackScore = 100 - ((factors.hasWeb3Keywords ? 0 : 20) + (factors.hasSolanaKeywords || factors.hasEthereumKeywords ? 0 : 10) + (d.publishedAt && Date.now() - new Date(d.publishedAt).getTime() > 7 * 24 * 60 * 60 * 1e3 ? 30 : 0));
        const yellowScore = (factors.hasWeb3Keywords ? 25 : 0) + (factors.hasAIKeywords ? 25 : 0) + (factors.hasTypeScript ? 15 : 0) + (factors.recentActivity ? 20 : 0) + 15;
        const greenScore = (d.source === "arxiv" ? 30 : 0) + (d.source === "producthunt" ? 25 : 0) + (factors.isShowHN ? 25 : 0) + 20;
        const blueScore = (factors.hasWeb3Keywords && factors.hasTypeScript ? 40 : 0) + (factors.recentActivity ? 30 : 0) + 30;
        const aggregateScore = (whiteScore * hatWeights.white + redScore * hatWeights.red + blackScore * hatWeights.black + yellowScore * hatWeights.yellow + greenScore * hatWeights.green + blueScore * hatWeights.blue) / (hatWeights.white + hatWeights.red + hatWeights.black + hatWeights.yellow + hatWeights.green + hatWeights.blue);
        return {
          ...d,
          sixHatsScores: {
            white: Math.round(whiteScore),
            red: Math.round(redScore),
            black: Math.round(blackScore),
            yellow: Math.round(yellowScore),
            green: Math.round(greenScore),
            blue: Math.round(blueScore)
          },
          aggregateScore: Math.round(aggregateScore)
        };
      });
      scoredDiscoveries.sort((a, b) => b.aggregateScore - a.aggregateScore);
      return {
        success: true,
        count: scoredDiscoveries.length,
        discoveries: scoredDiscoveries,
        topScore: scoredDiscoveries[0]?.aggregateScore ?? 0,
        averageScore: Math.round(
          scoredDiscoveries.reduce((sum, d) => sum + d.aggregateScore, 0) / scoredDiscoveries.length
        )
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid JSON input",
        discoveries: []
      };
    }
  };
};
var createHunterFilterHandler = () => {
  return async (inputs, _context) => {
    const discoveriesStr = inputs.discoveries;
    try {
      const discoveries = JSON.parse(discoveriesStr);
      let filtered = [...discoveries];
      const minScoreStr = inputs.minScore;
      if (minScoreStr) {
        const minScore = parseInt(minScoreStr, 10);
        filtered = filtered.filter((d) => (d.aggregateScore ?? 0) >= minScore);
      }
      const maxAgeStr = inputs.maxAge;
      if (maxAgeStr) {
        const maxAgeHours = parseInt(maxAgeStr, 10);
        const maxAgeMs = maxAgeHours * 60 * 60 * 1e3;
        const now = Date.now();
        filtered = filtered.filter((d) => {
          if (!d.discoveredAt) return true;
          return now - new Date(d.discoveredAt).getTime() <= maxAgeMs;
        });
      }
      const categoriesStr = inputs.categories;
      if (categoriesStr) {
        const categories = categoriesStr.split(",").map((c) => c.trim());
        filtered = filtered.filter((d) => d.category && categories.includes(d.category));
      }
      const hasWeb3Str = inputs.hasWeb3;
      if (hasWeb3Str === "true") {
        filtered = filtered.filter((d) => d.relevanceFactors?.hasWeb3Keywords);
      }
      const hasAIStr = inputs.hasAI;
      if (hasAIStr === "true") {
        filtered = filtered.filter((d) => d.relevanceFactors?.hasAIKeywords);
      }
      const limitStr = inputs.limit;
      if (limitStr) {
        const limit = parseInt(limitStr, 10);
        filtered = filtered.slice(0, limit);
      }
      return {
        success: true,
        count: filtered.length,
        discoveries: filtered,
        filtersApplied: {
          minScore: minScoreStr,
          maxAge: maxAgeStr,
          categories: categoriesStr,
          hasWeb3: hasWeb3Str,
          hasAI: hasAIStr,
          limit: limitStr
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid JSON input",
        discoveries: []
      };
    }
  };
};
var hunterTools = {
  definitions: [
    hunterToolDefinition,
    hunterScoreToolDefinition,
    hunterFilterToolDefinition
  ],
  createHandlers: (hunterFactory) => ({
    "hunter_discover": createHunterDiscoverHandler(hunterFactory),
    "hunter_score": createHunterScoreHandler(),
    "hunter_filter": createHunterFilterHandler()
  })
};

// src/tools/money-engine-tool.ts
var dcaTradeToolDefinition = {
  name: "money_dca_trade",
  description: `Execute a DCA (Dollar-Cost Averaging) trade operation.
This is a FINANCIAL ACTION that requires autonomy approval if risk is high.

The tool will:
1. Check current treasury balance
2. Validate trade parameters
3. Execute DCA buy through Jupiter DEX (if live mode)
4. Return trade confirmation or paper trade record

Risk levels based on amount:
- Under $50: Low risk (may auto-execute)
- $50-$500: Medium risk (requires approval)
- Over $500: High risk (escalates for review)`,
  input_schema: {
    type: "object",
    properties: {
      asset: {
        type: "string",
        description: "Asset to buy (e.g., SOL, BONK, JUP)"
      },
      amountUsd: {
        type: "string",
        description: "Amount in USD to spend"
      },
      mode: {
        type: "string",
        description: "Trading mode: paper (simulated), micro (small live), live (full)",
        enum: ["paper", "micro", "live"]
      },
      slippageBps: {
        type: "string",
        description: "Max slippage in basis points (default: 100 = 1%)"
      }
    },
    required: ["asset", "amountUsd"]
  }
};
var treasuryStatusToolDefinition = {
  name: "money_treasury_status",
  description: `Get current treasury status including balances, allocations, and health metrics.

Returns:
- SOL and USDC balances
- Total value in USD
- Allocation breakdown (trading, operations, growth, reserve)
- Runway in months
- Self-sustainability status`,
  input_schema: {
    type: "object",
    properties: {},
    required: []
  }
};
var expenseStatusToolDefinition = {
  name: "money_expenses",
  description: `Get expense breakdown and upcoming payments.

Returns:
- Monthly expense total
- Expense breakdown by category
- Upcoming expenses in next 7 days
- Budget utilization`,
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "string",
        description: "Number of days to look ahead for upcoming expenses (default: 7)"
      }
    },
    required: []
  }
};
var healthCheckToolDefinition = {
  name: "money_health_check",
  description: `Comprehensive financial health check.

Analyzes:
- Cash runway
- Expense coverage ratio
- Trading P&L trend
- Risk exposure
- Recommendations for optimization`,
  input_schema: {
    type: "object",
    properties: {},
    required: []
  }
};
var createDCATradeHandler = (moneyEngineFactory, autonomyCheck) => {
  return async (inputs, context) => {
    const asset = inputs.asset;
    const amountUsdStr = inputs.amountUsd;
    const mode = inputs.mode || "paper";
    const slippageBpsStr = inputs.slippageBps || "100";
    const amountUsd = parseFloat(amountUsdStr);
    const slippageBps = parseInt(slippageBpsStr, 10);
    if (!asset || isNaN(amountUsd) || amountUsd <= 0) {
      return {
        success: false,
        error: "Invalid asset or amount",
        trade: null
      };
    }
    let riskLevel;
    if (amountUsd < 50) {
      riskLevel = "low";
    } else if (amountUsd < 500) {
      riskLevel = "medium";
    } else {
      riskLevel = "high";
    }
    if (autonomyCheck && mode !== "paper") {
      const autonomyResult = await autonomyCheck({
        type: "trade",
        category: "financial",
        data: {
          asset,
          amountUsd,
          mode,
          slippageBps,
          riskLevel
        },
        estimatedImpact: amountUsd
      });
      if (!autonomyResult.approved) {
        return {
          success: false,
          requiresApproval: autonomyResult.requiresApproval ?? true,
          reason: autonomyResult.reason || "Trade requires approval",
          trade: null,
          riskLevel,
          action: {
            asset,
            amountUsd,
            mode
          }
        };
      }
    }
    try {
      if (mode === "paper") {
        const simulatedPrice = asset === "SOL" ? 225 : asset === "BONK" ? 3e-5 : 1;
        const quantity = amountUsd / simulatedPrice;
        return {
          success: true,
          trade: {
            id: `paper_${Date.now()}`,
            asset,
            side: "buy",
            amountUsd,
            quantity,
            price: simulatedPrice,
            mode: "paper",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            slippageBps
          },
          riskLevel,
          message: `Paper trade: Bought ${quantity.toFixed(6)} ${asset} for $${amountUsd}`
        };
      }
      const engine = await moneyEngineFactory();
      await engine.triggerDCA();
      const status = await engine.getStatus();
      return {
        success: true,
        trade: {
          id: `live_${Date.now()}`,
          asset,
          side: "buy",
          amountUsd,
          mode,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          slippageBps
        },
        riskLevel,
        treasuryBalance: {
          sol: status.treasury.balances.sol.toNumber(),
          usdc: status.treasury.balances.usdc.toNumber()
        },
        message: `DCA trade executed for ${asset}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Trade execution failed",
        trade: null,
        riskLevel
      };
    }
  };
};
var createTreasuryStatusHandler = (moneyEngineFactory) => {
  return async (_inputs, _context) => {
    try {
      const engine = await moneyEngineFactory();
      const status = await engine.getStatus();
      return {
        success: true,
        treasury: {
          balances: {
            sol: status.treasury.balances.sol.toNumber(),
            usdc: status.treasury.balances.usdc.toNumber()
          },
          totalValueUsd: status.treasury.totalValueUsd.toNumber(),
          allocations: {
            trading: status.treasury.allocations.trading?.toNumber() ?? 0,
            operations: status.treasury.allocations.operations?.toNumber() ?? 0,
            growth: status.treasury.allocations.growth?.toNumber() ?? 0,
            reserve: status.treasury.allocations.reserve?.toNumber() ?? 0
          },
          health: {
            runway: status.treasury.health.runway,
            needsRebalance: status.treasury.health.needsRebalance
          }
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get treasury status",
        treasury: null
      };
    }
  };
};
var createExpenseStatusHandler = (moneyEngineFactory) => {
  return async (inputs, _context) => {
    const daysStr = inputs.days || "7";
    const days = parseInt(daysStr, 10);
    try {
      const engine = await moneyEngineFactory();
      const expenseManager = engine.getExpenseManager();
      const monthlyTotal = expenseManager.getMonthlyTotal();
      const upcoming = expenseManager.getUpcoming(days);
      const budgetStatus = expenseManager.getBudgetStatus();
      return {
        success: true,
        expenses: {
          monthly: monthlyTotal.toNumber(),
          upcoming: upcoming.map((e) => ({
            name: e.name,
            amount: e.amount,
            dueDate: e.dueDate.toISOString()
          })),
          upcomingTotal: upcoming.reduce((sum, e) => sum + e.amount, 0),
          budget: {
            utilized: budgetStatus.utilized,
            remaining: budgetStatus.remaining
          }
        },
        lookAheadDays: days,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get expense status",
        expenses: null
      };
    }
  };
};
var createHealthCheckHandler = (moneyEngineFactory) => {
  return async (_inputs, _context) => {
    try {
      const engine = await moneyEngineFactory();
      const status = await engine.getStatus();
      const totalValue = status.treasury.totalValueUsd.toNumber();
      const monthlyExpenses = status.expenses.monthly.toNumber();
      const tradingPnL = status.trading.totalPnL.toNumber();
      const runway = status.health.runway;
      let healthScore = 50;
      if (runway >= 12) healthScore += 30;
      else if (runway >= 6) healthScore += 20;
      else if (runway >= 3) healthScore += 10;
      else healthScore -= 10;
      if (status.health.selfSustaining) healthScore += 20;
      else if (tradingPnL > 0) healthScore += 10;
      if (status.trading.activeBots > 0) healthScore += 10;
      healthScore = Math.max(0, Math.min(100, healthScore));
      const recommendations = [];
      if (runway < 3) {
        recommendations.push("CRITICAL: Less than 3 months runway. Reduce expenses or increase revenue.");
      }
      if (runway < 6) {
        recommendations.push("Consider increasing trading allocation to improve revenue.");
      }
      if (!status.health.selfSustaining) {
        recommendations.push("Focus on achieving self-sustainability through trading profits.");
      }
      if (status.trading.activeBots === 0) {
        recommendations.push("Start DCA bots to begin generating trading returns.");
      }
      if (totalValue < 1e3) {
        recommendations.push("Treasury balance is low. Consider capital injection.");
      }
      return {
        success: true,
        health: {
          score: healthScore,
          grade: healthScore >= 80 ? "A" : healthScore >= 60 ? "B" : healthScore >= 40 ? "C" : "D",
          selfSustaining: status.health.selfSustaining,
          runway,
          metrics: {
            totalValue,
            monthlyExpenses,
            tradingPnL,
            activeBots: status.trading.activeBots
          },
          recommendations
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
        health: null
      };
    }
  };
};
var moneyEngineTools = {
  definitions: [
    dcaTradeToolDefinition,
    treasuryStatusToolDefinition,
    expenseStatusToolDefinition,
    healthCheckToolDefinition
  ],
  createHandlers: (moneyEngineFactory, autonomyCheck) => ({
    "money_dca_trade": createDCATradeHandler(moneyEngineFactory, autonomyCheck),
    "money_treasury_status": createTreasuryStatusHandler(moneyEngineFactory),
    "money_expenses": createExpenseStatusHandler(moneyEngineFactory),
    "money_health_check": createHealthCheckHandler(moneyEngineFactory)
  })
};

// src/tools/growth-engine-tool.ts
var blogGenerateToolDefinition = {
  name: "growth_generate_blog",
  description: `Generate an SEO-optimized blog post.

Creates a complete blog post with:
- Title optimized for search
- Meta description
- Structured content with headers
- Internal link suggestions
- Social media snippets

Categories: tutorial, guide, announcement, comparison, case-study, thought-leadership, changelog`,
  input_schema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Main topic for the blog post"
      },
      category: {
        type: "string",
        description: "Content category",
        enum: ["tutorial", "guide", "announcement", "comparison", "case-study", "thought-leadership", "changelog"]
      },
      targetWordCount: {
        type: "string",
        description: "Target word count (default: 1500)"
      },
      keywords: {
        type: "string",
        description: "Comma-separated target keywords"
      },
      tone: {
        type: "string",
        description: "Writing tone: professional, casual, technical, friendly",
        enum: ["professional", "casual", "technical", "friendly"]
      }
    },
    required: ["topic"]
  }
};
var tweetGenerateToolDefinition = {
  name: "growth_generate_tweets",
  description: `Generate a batch of tweets for social media.

Creates multiple tweets with:
- Engaging hooks
- Relevant hashtags
- Call-to-actions
- Thread structure (if requested)

Optimizes for engagement and reach.`,
  input_schema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Topic for tweets"
      },
      count: {
        type: "string",
        description: "Number of tweets to generate (default: 5)"
      },
      style: {
        type: "string",
        description: "Tweet style: informative, promotional, engagement, thread",
        enum: ["informative", "promotional", "engagement", "thread"]
      },
      includeHashtags: {
        type: "string",
        description: "Include hashtags (true/false)"
      },
      maxLength: {
        type: "string",
        description: "Max characters per tweet (default: 280)"
      }
    },
    required: ["topic"]
  }
};
var keywordResearchToolDefinition = {
  name: "growth_keyword_research",
  description: `Research keywords for content strategy.

Analyzes:
- Search volume estimates
- Competition difficulty
- Related keywords
- Content gaps vs competitors
- Trending topics`,
  input_schema: {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description: "Main topic to research"
      },
      depth: {
        type: "string",
        description: "Research depth: quick, standard, deep",
        enum: ["quick", "standard", "deep"]
      },
      includeRelated: {
        type: "string",
        description: "Include related keywords (true/false)"
      }
    },
    required: ["topic"]
  }
};
var seoAnalyzeToolDefinition = {
  name: "growth_seo_analyze",
  description: `Analyze content for SEO optimization.

Evaluates:
- Keyword density and placement
- Heading structure
- Meta description quality
- Internal linking opportunities
- Readability score
- Mobile-friendliness indicators`,
  input_schema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Content to analyze (markdown or plain text)"
      },
      targetKeywords: {
        type: "string",
        description: "Comma-separated target keywords"
      },
      url: {
        type: "string",
        description: "Optional URL for live page analysis"
      }
    },
    required: ["content"]
  }
};
var contentCalendarToolDefinition = {
  name: "growth_content_calendar",
  description: `Get or plan content calendar.

Returns:
- Scheduled blog posts
- Queued tweets
- Upcoming threads
- Content metrics`,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "Action: view (current calendar), plan (generate plan)",
        enum: ["view", "plan"]
      },
      weeks: {
        type: "string",
        description: "Number of weeks to view/plan (default: 1)"
      }
    },
    required: []
  }
};
var discordAnnounceToolDefinition = {
  name: "growth_discord_announce",
  description: `Announce updates on Discord.

Types:
- feature: New feature announcement
- agent: New agent release
- component: New component added
- update: Version update/changelog`,
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Announcement type",
        enum: ["feature", "agent", "component", "update"]
      },
      title: {
        type: "string",
        description: "Announcement title/name"
      },
      description: {
        type: "string",
        description: "Detailed description"
      },
      metadata: {
        type: "string",
        description: "JSON string with additional metadata (capabilities, version, etc.)"
      }
    },
    required: ["type", "title", "description"]
  }
};
var createBlogGenerateHandler = (growthEngineFactory) => {
  return async (inputs, _context) => {
    const topic = inputs.topic;
    const category = inputs.category || "guide";
    const targetWordCountStr = inputs.targetWordCount || "1500";
    const keywordsStr = inputs.keywords;
    const tone = inputs.tone || "professional";
    const targetWordCount = parseInt(targetWordCountStr, 10);
    const keywords = keywordsStr ? keywordsStr.split(",").map((k) => k.trim()) : [topic];
    try {
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const blogPost = {
        title: generateTitle(topic, category),
        slug,
        excerpt: `Learn about ${topic} in this comprehensive ${category}. Perfect for developers and entrepreneurs.`,
        content: generateBlogContent(topic, category, targetWordCount, tone),
        tags: keywords.slice(0, 5),
        category,
        metadata: {
          wordCount: targetWordCount,
          readingTime: Math.ceil(targetWordCount / 200),
          targetKeywords: keywords,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        seo: {
          metaTitle: `${generateTitle(topic, category)} | gICM`,
          metaDescription: `Discover ${topic}. This ${category} covers everything you need to know.`,
          canonicalUrl: `https://gicm.dev/blog/${slug}`
        }
      };
      return {
        success: true,
        blog: blogPost,
        socialSnippets: {
          twitter: `New ${category}: ${blogPost.title}

${blogPost.excerpt.slice(0, 200)}...

Read more: ${blogPost.seo.canonicalUrl}`,
          linkedin: `I just published a new ${category} on ${topic}.

${blogPost.excerpt}

${blogPost.seo.canonicalUrl}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Blog generation failed",
        blog: null
      };
    }
  };
};
var createTweetGenerateHandler = () => {
  return async (inputs, _context) => {
    const topic = inputs.topic;
    const countStr = inputs.count || "5";
    const style = inputs.style || "informative";
    const includeHashtagsStr = inputs.includeHashtags || "true";
    const maxLengthStr = inputs.maxLength || "280";
    const count = parseInt(countStr, 10);
    const includeHashtags = includeHashtagsStr === "true";
    const maxLength = parseInt(maxLengthStr, 10);
    try {
      const tweets = generateTweets(topic, count, style, includeHashtags, maxLength);
      return {
        success: true,
        tweets,
        stats: {
          count: tweets.length,
          avgLength: Math.round(tweets.reduce((sum, t) => sum + t.content.length, 0) / tweets.length),
          style,
          hashtags: includeHashtags
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tweet generation failed",
        tweets: []
      };
    }
  };
};
var createKeywordResearchHandler = () => {
  return async (inputs, _context) => {
    const topic = inputs.topic;
    const depth = inputs.depth || "standard";
    const includeRelatedStr = inputs.includeRelated || "true";
    const includeRelated = includeRelatedStr === "true";
    try {
      const keywords = generateKeywordData(topic, depth, includeRelated);
      return {
        success: true,
        keywords,
        summary: {
          totalKeywords: keywords.length,
          avgDifficulty: Math.round(keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length),
          avgVolume: Math.round(keywords.reduce((sum, k) => sum + k.volume, 0) / keywords.length),
          topOpportunities: keywords.sort((a, b) => b.volume / (b.difficulty + 1) - a.volume / (a.difficulty + 1)).slice(0, 3).map((k) => k.keyword)
        },
        recommendations: [
          `Focus on "${keywords[0]?.keyword}" as primary keyword`,
          `Create supporting content for related keywords`,
          `Update existing content to include high-volume keywords`
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Keyword research failed",
        keywords: []
      };
    }
  };
};
var createSEOAnalyzeHandler = () => {
  return async (inputs, _context) => {
    const content = inputs.content;
    const targetKeywordsStr = inputs.targetKeywords;
    const targetKeywords = targetKeywordsStr ? targetKeywordsStr.split(",").map((k) => k.trim()) : [];
    try {
      const analysis = analyzeSEO(content, targetKeywords);
      return {
        success: true,
        analysis,
        recommendations: analysis.recommendations,
        score: analysis.overallScore
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SEO analysis failed",
        analysis: null
      };
    }
  };
};
var createContentCalendarHandler = (growthEngineFactory) => {
  return async (inputs, _context) => {
    const action = inputs.action || "view";
    const weeksStr = inputs.weeks || "1";
    const weeks = parseInt(weeksStr, 10);
    try {
      if (action === "view") {
        const engine = await growthEngineFactory();
        const status = engine.getStatus();
        return {
          success: true,
          calendar: {
            blogPosts: status.upcomingContent.blogPosts,
            tweets: status.upcomingContent.tweets.length,
            threads: status.upcomingContent.threads
          },
          metrics: status.metrics.content,
          weeks
        };
      }
      const plan = generateContentPlan(weeks);
      return {
        success: true,
        plan,
        weeks,
        summary: {
          blogPosts: plan.blogPosts.length,
          tweets: plan.tweets.length,
          threads: plan.threads.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Calendar operation failed",
        calendar: null
      };
    }
  };
};
var createDiscordAnnounceHandler = (growthEngineFactory) => {
  return async (inputs, _context) => {
    const type = inputs.type;
    const title = inputs.title;
    const description = inputs.description;
    const metadataStr = inputs.metadata;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};
    try {
      const engine = await growthEngineFactory();
      switch (type) {
        case "feature":
          await engine.announceFeature({
            name: title,
            description,
            url: metadata.url
          });
          break;
        case "agent":
          await engine.announceAgent({
            name: title,
            description,
            capabilities: metadata.capabilities || []
          });
          break;
        case "component":
          await engine.announceComponent({
            name: title,
            description,
            category: metadata.category || "general"
          });
          break;
        case "update":
          await engine.announceUpdate(
            metadata.version || "1.0.0",
            metadata.changes || [description]
          );
          break;
        default:
          throw new Error(`Unknown announcement type: ${type}`);
      }
      return {
        success: true,
        announced: {
          type,
          title,
          description,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Discord announcement failed",
        announced: null
      };
    }
  };
};
function generateTitle(topic, category) {
  const templates = {
    tutorial: [
      `How to ${topic}: A Complete Tutorial`,
      `${topic} Tutorial: Step-by-Step Guide`,
      `Master ${topic}: Beginner to Expert`
    ],
    guide: [
      `The Ultimate Guide to ${topic}`,
      `${topic}: Everything You Need to Know`,
      `Complete ${topic} Guide for 2025`
    ],
    announcement: [
      `Introducing ${topic}`,
      `${topic} is Here`,
      `Announcing ${topic}`
    ],
    comparison: [
      `${topic} Comparison: Best Options`,
      `Comparing ${topic} Solutions`,
      `${topic} vs Alternatives`
    ]
  };
  const categoryTemplates = templates[category] || templates.guide;
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
}
function generateBlogContent(topic, category, wordCount, tone) {
  return `# ${generateTitle(topic, category)}

## Introduction

${topic} is becoming increasingly important in today's tech landscape...

## Key Concepts

### Understanding ${topic}

Let's dive deep into what makes ${topic} essential...

### Best Practices

Here are the best practices for working with ${topic}...

## Implementation

Step-by-step guide to implementing ${topic}...

## Conclusion

${topic} is a powerful tool that can transform your workflow...

---

*Generated with gICM Growth Engine*
`;
}
function generateTweets(topic, count, style, includeHashtags, maxLength) {
  const tweets = [];
  const hashtags = includeHashtags ? `

#${topic.replace(/\s+/g, "")} #tech #web3` : "";
  const templates = {
    informative: [
      `Did you know? ${topic} can increase your productivity by 10x.`,
      `Here's what most people get wrong about ${topic}...`,
      `${topic} explained in 30 seconds:`
    ],
    promotional: [
      `We just launched ${topic}! Check it out.`,
      `New feature alert: ${topic} is now available.`,
      `${topic} is changing the game. Here's how...`
    ],
    engagement: [
      `What's your experience with ${topic}? Drop a comment below.`,
      `Hot take: ${topic} is underrated. Agree or disagree?`,
      `Poll: How often do you use ${topic}?`
    ],
    thread: [
      `Let's talk about ${topic}. A thread:`,
      `Everything you need to know about ${topic}`,
      `${topic} masterclass (1/n):`
    ]
  };
  const styleTemplates = templates[style] || templates.informative;
  for (let i = 0; i < count; i++) {
    const template = styleTemplates[i % styleTemplates.length];
    let content = template + hashtags;
    if (content.length > maxLength) {
      content = content.slice(0, maxLength - 3) + "...";
    }
    tweets.push({
      id: `tweet_${Date.now()}_${i}`,
      content,
      style
    });
  }
  return tweets;
}
function generateKeywordData(topic, depth, includeRelated) {
  const baseKeywords = [
    { keyword: topic, volume: 1e4, difficulty: 60, trend: "rising" },
    { keyword: `${topic} tutorial`, volume: 5e3, difficulty: 45, trend: "stable" },
    { keyword: `${topic} guide`, volume: 4e3, difficulty: 50, trend: "rising" },
    { keyword: `best ${topic}`, volume: 8e3, difficulty: 70, trend: "stable" },
    { keyword: `${topic} for beginners`, volume: 6e3, difficulty: 35, trend: "rising" }
  ];
  if (depth === "quick") {
    return baseKeywords.slice(0, 3);
  }
  if (includeRelated && depth === "deep") {
    return [
      ...baseKeywords,
      { keyword: `${topic} alternatives`, volume: 3e3, difficulty: 55, trend: "stable" },
      { keyword: `${topic} examples`, volume: 2500, difficulty: 40, trend: "rising" },
      { keyword: `${topic} vs`, volume: 4500, difficulty: 65, trend: "stable" },
      { keyword: `how to use ${topic}`, volume: 7e3, difficulty: 40, trend: "rising" },
      { keyword: `${topic} 2025`, volume: 3500, difficulty: 30, trend: "rising" }
    ];
  }
  return baseKeywords;
}
function analyzeSEO(content, targetKeywords) {
  const wordCount = content.split(/\s+/).length;
  const h1Count = (content.match(/^# /gm) || []).length;
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;
  const keywordDensity = {};
  for (const keyword of targetKeywords) {
    const regex = new RegExp(keyword, "gi");
    const matches = content.match(regex) || [];
    keywordDensity[keyword] = matches.length / wordCount * 100;
  }
  let score = 50;
  const recommendations = [];
  if (h1Count === 1) score += 10;
  else recommendations.push("Add exactly one H1 heading");
  if (h2Count >= 3) score += 10;
  else recommendations.push("Add more H2 headings for structure");
  if (wordCount >= 1e3) score += 15;
  else recommendations.push("Increase content length to at least 1000 words");
  const avgDensity = Object.values(keywordDensity).reduce((a, b) => a + b, 0) / (targetKeywords.length || 1);
  if (avgDensity >= 1 && avgDensity <= 3) score += 15;
  else recommendations.push("Optimize keyword density (1-3%)");
  return {
    overallScore: Math.min(100, score),
    keywordDensity,
    headingStructure: { h1: h1Count, h2: h2Count, h3: h3Count },
    wordCount,
    readabilityScore: 70,
    // Simplified
    recommendations
  };
}
function generateContentPlan(weeks) {
  const blogPosts = [];
  const tweets = [];
  const threads = [];
  for (let w = 1; w <= weeks; w++) {
    blogPosts.push(
      { week: w, topic: "AI Development Tools", category: "tutorial" },
      { week: w, topic: "Web3 Integration", category: "guide" },
      { week: w, topic: "Platform Updates", category: "changelog" }
    );
    tweets.push({ week: w, count: 35 });
    threads.push(
      { week: w, topic: "Weekly Roundup" },
      { week: w, topic: "Feature Deep Dive" }
    );
  }
  return { blogPosts, tweets, threads };
}
var growthEngineTools = {
  definitions: [
    blogGenerateToolDefinition,
    tweetGenerateToolDefinition,
    keywordResearchToolDefinition,
    seoAnalyzeToolDefinition,
    contentCalendarToolDefinition,
    discordAnnounceToolDefinition
  ],
  createHandlers: (growthEngineFactory) => ({
    "growth_generate_blog": createBlogGenerateHandler(growthEngineFactory),
    "growth_generate_tweets": createTweetGenerateHandler(),
    "growth_keyword_research": createKeywordResearchHandler(),
    "growth_seo_analyze": createSEOAnalyzeHandler(),
    "growth_content_calendar": createContentCalendarHandler(growthEngineFactory),
    "growth_discord_announce": createDiscordAnnounceHandler(growthEngineFactory)
  })
};

// src/tools/autonomy-tool.ts
var classifyRiskToolDefinition = {
  name: "autonomy_classify_risk",
  description: `Classify the risk level of an action before execution.

Risk factors considered:
- Financial impact (35%)
- Reversibility (20%)
- Category (15%)
- Urgency (15%)
- Visibility (15%)

Returns risk score 0-100 and recommended action:
- auto_execute (0-20): Safe to proceed
- queue_approval (21-60): Needs human review
- escalate (61-80): Urgent review needed
- reject (81-100): Too risky, blocked`,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "JSON string describing the action to classify"
      },
      category: {
        type: "string",
        description: "Action category: financial, content, development, system",
        enum: ["financial", "content", "development", "system"]
      },
      estimatedImpact: {
        type: "string",
        description: "Estimated financial impact in USD (if applicable)"
      }
    },
    required: ["action", "category"]
  }
};
var checkApprovalToolDefinition = {
  name: "autonomy_check_approval",
  description: `Check if an action has been approved or queue it for approval.

Use this before executing any action that was classified as requiring approval.`,
  input_schema: {
    type: "object",
    properties: {
      actionId: {
        type: "string",
        description: "Unique ID for the action"
      },
      action: {
        type: "string",
        description: "JSON string describing the action"
      },
      riskScore: {
        type: "string",
        description: "Risk score from classify_risk"
      },
      timeout: {
        type: "string",
        description: "Timeout in seconds before auto-reject (default: 3600)"
      }
    },
    required: ["actionId", "action"]
  }
};
var checkBoundariesToolDefinition = {
  name: "autonomy_check_boundaries",
  description: `Check if an action is within operational boundaries.

Boundaries include:
- Daily spending limits
- Auto-post limits
- Trade size limits
- Blocked operations`,
  input_schema: {
    type: "object",
    properties: {
      boundaryType: {
        type: "string",
        description: "Boundary type: financial, content, development",
        enum: ["financial", "content", "development"]
      },
      value: {
        type: "string",
        description: "Value to check against boundary"
      },
      accumulated: {
        type: "string",
        description: "Already accumulated value today (if applicable)"
      }
    },
    required: ["boundaryType", "value"]
  }
};
var logAuditToolDefinition = {
  name: "autonomy_log_audit",
  description: `Log an action to the audit trail.

Required for compliance and debugging.
Creates hash-chain integrity for tamper detection.`,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "JSON string describing the action"
      },
      result: {
        type: "string",
        description: "Result: success, failed, skipped, rejected",
        enum: ["success", "failed", "skipped", "rejected"]
      },
      metadata: {
        type: "string",
        description: "Additional metadata JSON"
      }
    },
    required: ["action", "result"]
  }
};
var autonomyStatusToolDefinition = {
  name: "autonomy_status",
  description: `Get current autonomy engine status.

Returns:
- Current autonomy level
- Active boundaries
- Pending approvals count
- Today's statistics`,
  input_schema: {
    type: "object",
    properties: {},
    required: []
  }
};
var createClassifyRiskHandler = (autonomyEngineFactory) => {
  return async (inputs, _context) => {
    const actionStr = inputs.action;
    const category = inputs.category;
    const estimatedImpactStr = inputs.estimatedImpact;
    try {
      const action = JSON.parse(actionStr);
      const estimatedImpact = estimatedImpactStr ? parseFloat(estimatedImpactStr) : 0;
      const weights = {
        financial: 0.35,
        reversibility: 0.2,
        category: 0.15,
        urgency: 0.15,
        visibility: 0.15
      };
      const factors = {};
      if (estimatedImpact > 0) {
        if (estimatedImpact < 50) factors.financial = 20;
        else if (estimatedImpact < 200) factors.financial = 40;
        else if (estimatedImpact < 500) factors.financial = 60;
        else if (estimatedImpact < 1e3) factors.financial = 80;
        else factors.financial = 95;
      } else {
        factors.financial = 10;
      }
      const categoryRisks = {
        financial: 70,
        development: 40,
        content: 25,
        system: 60
      };
      factors.category = categoryRisks[category] || 50;
      const reversibilityScores = {
        financial: 80,
        // Hard to reverse transactions
        development: 30,
        // Can revert commits
        content: 40,
        // Can unpublish
        system: 50
      };
      factors.reversibility = reversibilityScores[category] || 50;
      factors.urgency = 50;
      const visibilityScores = {
        financial: 30,
        // Internal
        development: 60,
        // Affects code
        content: 80,
        // Public-facing
        system: 40
      };
      factors.visibility = visibilityScores[category] || 50;
      const score = Math.round(
        factors.financial * weights.financial + factors.reversibility * weights.reversibility + factors.category * weights.category + factors.urgency * weights.urgency + factors.visibility * weights.visibility
      );
      let recommendation;
      let level;
      if (score <= 20) {
        recommendation = "auto_execute";
        level = "safe";
      } else if (score <= 40) {
        recommendation = category === "financial" ? "queue_approval" : "auto_execute";
        level = "low";
      } else if (score <= 60) {
        recommendation = "queue_approval";
        level = "medium";
      } else if (score <= 80) {
        recommendation = "escalate";
        level = "high";
      } else {
        recommendation = "reject";
        level = "critical";
      }
      return {
        success: true,
        risk: {
          score,
          level,
          factors,
          recommendation
        },
        action: {
          category,
          estimatedImpact,
          ...action
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Risk classification failed",
        risk: null
      };
    }
  };
};
var createCheckApprovalHandler = () => {
  const approvalQueue = /* @__PURE__ */ new Map();
  return async (inputs, _context) => {
    const actionId = inputs.actionId;
    const actionStr = inputs.action;
    const riskScoreStr = inputs.riskScore;
    const timeoutStr = inputs.timeout || "3600";
    const timeout = parseInt(timeoutStr, 10) * 1e3;
    try {
      const existing = approvalQueue.get(actionId);
      if (existing) {
        if (Date.now() > existing.expiresAt) {
          approvalQueue.delete(actionId);
          return {
            success: false,
            approved: false,
            reason: "Approval request expired",
            actionId
          };
        }
        return {
          success: true,
          approved: existing.status === "approved",
          status: existing.status,
          actionId,
          expiresIn: Math.round((existing.expiresAt - Date.now()) / 1e3)
        };
      }
      const action = JSON.parse(actionStr);
      const now = Date.now();
      approvalQueue.set(actionId, {
        action,
        status: "pending",
        createdAt: now,
        expiresAt: now + timeout
      });
      return {
        success: true,
        approved: false,
        status: "pending",
        actionId,
        message: "Action queued for approval",
        riskScore: riskScoreStr ? parseInt(riskScoreStr, 10) : void 0,
        expiresIn: timeout / 1e3
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Approval check failed",
        approved: false
      };
    }
  };
};
var createCheckBoundariesHandler = () => {
  const boundaries = {
    financial: {
      maxAutoExpense: 50,
      maxDailySpend: 100,
      maxTradeSize: 500
    },
    content: {
      maxAutoPostsPerDay: 10,
      maxAutoBlogsPerWeek: 3
    },
    development: {
      maxAutoCommitLines: 100,
      autoDeployToProduction: false
    }
  };
  const dailyUsage = /* @__PURE__ */ new Map();
  return async (inputs, _context) => {
    const boundaryType = inputs.boundaryType;
    const valueStr = inputs.value;
    const accumulatedStr = inputs.accumulated;
    const value = parseFloat(valueStr);
    const accumulated = accumulatedStr ? parseFloat(accumulatedStr) : 0;
    try {
      const typeKey = boundaryType;
      const typeBoundaries = boundaries[typeKey];
      if (!typeBoundaries) {
        return {
          success: false,
          error: `Unknown boundary type: ${boundaryType}`,
          withinBoundaries: false
        };
      }
      const results = [];
      let allPassed = true;
      if (boundaryType === "financial") {
        const fb = typeBoundaries;
        if (value > fb.maxAutoExpense) {
          results.push({
            check: "maxAutoExpense",
            limit: fb.maxAutoExpense,
            current: value,
            passed: false
          });
          allPassed = false;
        } else {
          results.push({
            check: "maxAutoExpense",
            limit: fb.maxAutoExpense,
            current: value,
            passed: true
          });
        }
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const todaySpend = (dailyUsage.get(today) || 0) + accumulated;
        if (todaySpend + value > fb.maxDailySpend) {
          results.push({
            check: "maxDailySpend",
            limit: fb.maxDailySpend,
            current: todaySpend + value,
            passed: false
          });
          allPassed = false;
        } else {
          results.push({
            check: "maxDailySpend",
            limit: fb.maxDailySpend,
            current: todaySpend + value,
            passed: true
          });
        }
        if (value > fb.maxTradeSize) {
          results.push({
            check: "maxTradeSize",
            limit: fb.maxTradeSize,
            current: value,
            passed: false
          });
          allPassed = false;
        } else {
          results.push({
            check: "maxTradeSize",
            limit: fb.maxTradeSize,
            current: value,
            passed: true
          });
        }
      }
      if (boundaryType === "content") {
        const cb = typeBoundaries;
        const today = (/* @__PURE__ */ new Date()).toDateString();
        const postsKey = `posts_${today}`;
        const todayPosts = dailyUsage.get(postsKey) || 0;
        if (todayPosts + value > cb.maxAutoPostsPerDay) {
          results.push({
            check: "maxAutoPostsPerDay",
            limit: cb.maxAutoPostsPerDay,
            current: todayPosts + value,
            passed: false
          });
          allPassed = false;
        } else {
          results.push({
            check: "maxAutoPostsPerDay",
            limit: cb.maxAutoPostsPerDay,
            current: todayPosts + value,
            passed: true
          });
        }
      }
      return {
        success: true,
        withinBoundaries: allPassed,
        boundaryType,
        value,
        accumulated,
        checks: results,
        boundaries: typeBoundaries
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Boundary check failed",
        withinBoundaries: false
      };
    }
  };
};
var createLogAuditHandler = () => {
  const auditLog = [];
  let previousHash = "0";
  return async (inputs, _context) => {
    const actionStr = inputs.action;
    const result = inputs.result;
    const metadataStr = inputs.metadata;
    try {
      const action = JSON.parse(actionStr);
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};
      const entry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        action,
        result,
        metadata,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        hash: "",
        // Will be computed
        previousHash
      };
      const dataToHash = JSON.stringify({
        ...entry,
        hash: void 0
      });
      entry.hash = Buffer.from(dataToHash).toString("base64").slice(0, 32);
      previousHash = entry.hash;
      auditLog.push(entry);
      if (auditLog.length > 1e3) {
        auditLog.shift();
      }
      return {
        success: true,
        logged: true,
        auditId: entry.id,
        hash: entry.hash,
        timestamp: entry.timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Audit logging failed",
        logged: false
      };
    }
  };
};
var createAutonomyStatusHandler = (autonomyEngineFactory) => {
  return async (_inputs, _context) => {
    const defaultStatus = {
      level: 2,
      // Bounded autonomy
      levelName: "Bounded",
      boundaries: {
        financial: { maxAutoExpense: 50, maxDailySpend: 100, maxTradeSize: 500 },
        content: { maxAutoPostsPerDay: 10, maxAutoBlogsPerWeek: 3 },
        development: { maxAutoCommitLines: 100, autoDeployToProduction: false }
      },
      pendingApprovals: 0,
      todayStats: {
        actionsExecuted: 0,
        actionsApproved: 0,
        actionsRejected: 0,
        totalSpend: 0
      }
    };
    try {
      if (autonomyEngineFactory) {
        const engine = await autonomyEngineFactory();
        const status = await engine.getStatus();
        return {
          success: true,
          autonomy: {
            level: status.level,
            levelName: ["Manual", "Bounded", "Supervised", "Autonomous"][status.level - 1] || "Unknown",
            boundaries: status.boundaries,
            pendingApprovals: status.pendingApprovals,
            todayStats: status.todayStats
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      return {
        success: true,
        autonomy: defaultStatus,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: "Using default autonomy configuration"
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get autonomy status",
        autonomy: defaultStatus
      };
    }
  };
};
var autonomyTools = {
  definitions: [
    classifyRiskToolDefinition,
    checkApprovalToolDefinition,
    checkBoundariesToolDefinition,
    logAuditToolDefinition,
    autonomyStatusToolDefinition
  ],
  createHandlers: (autonomyEngineFactory) => ({
    "autonomy_classify_risk": createClassifyRiskHandler(autonomyEngineFactory),
    "autonomy_check_approval": createCheckApprovalHandler(),
    "autonomy_check_boundaries": createCheckBoundariesHandler(),
    "autonomy_log_audit": createLogAuditHandler(),
    "autonomy_status": createAutonomyStatusHandler(autonomyEngineFactory)
  })
};

// src/tools/index.ts
function getAllToolDefinitions() {
  return [
    ...hunterTools.definitions,
    ...moneyEngineTools.definitions,
    ...growthEngineTools.definitions,
    ...autonomyTools.definitions
  ];
}
function createAllHandlers(factories) {
  const handlers = {};
  if (factories.hunterAgent) {
    Object.assign(handlers, hunterTools.createHandlers(factories.hunterAgent));
  }
  if (factories.moneyEngine) {
    Object.assign(handlers, moneyEngineTools.createHandlers(
      factories.moneyEngine,
      factories.autonomyCheck
    ));
  }
  if (factories.growthEngine) {
    Object.assign(handlers, growthEngineTools.createHandlers(factories.growthEngine));
  }
  Object.assign(handlers, autonomyTools.createHandlers(factories.autonomyEngine));
  return handlers;
}
var toolCategories = {
  hunter: {
    name: "Hunter Agent",
    description: "Discover opportunities across 17 data sources",
    tools: ["hunter_discover", "hunter_score", "hunter_filter"],
    icon: "Target"
  },
  money: {
    name: "Money Engine",
    description: "Treasury management and DCA trading",
    tools: ["money_dca_trade", "money_treasury_status", "money_expenses", "money_health_check"],
    icon: "Wallet"
  },
  growth: {
    name: "Growth Engine",
    description: "Content generation and marketing automation",
    tools: ["growth_generate_blog", "growth_generate_tweets", "growth_keyword_research", "growth_seo_analyze", "growth_content_calendar", "growth_discord_announce"],
    icon: "TrendingUp"
  },
  autonomy: {
    name: "Autonomy Engine",
    description: "Risk classification and approval workflows",
    tools: ["autonomy_classify_risk", "autonomy_check_approval", "autonomy_check_boundaries", "autonomy_log_audit", "autonomy_status"],
    icon: "Shield"
  }
};
var pipelineTemplates = {
  // Research and analyze workflow
  researchAndAnalyze: {
    id: "research-analyze",
    name: "Research & Analyze",
    description: "Hunt for opportunities, score them, and filter top results",
    steps: [
      { id: "hunt", tool: "hunter_discover", inputs: { sources: "github,hackernews,defillama" } },
      { id: "score", tool: "hunter_score", inputs: { discoveries: "${results.hunt.discoveries}" }, dependsOn: ["hunt"] },
      { id: "filter", tool: "hunter_filter", inputs: { discoveries: "${results.score.discoveries}", minScore: "60", limit: "10" }, dependsOn: ["score"] }
    ],
    metadata: { category: "research", riskLevel: "safe", tags: ["hunter", "analysis"] }
  },
  // Content generation workflow
  contentGeneration: {
    id: "content-gen",
    name: "Content Generation",
    description: "Research keywords, generate blog post, create social posts",
    steps: [
      { id: "keywords", tool: "growth_keyword_research", inputs: { topic: "${inputs.topic}", depth: "standard" } },
      { id: "blog", tool: "growth_generate_blog", inputs: { topic: "${inputs.topic}", keywords: "${results.keywords.keywords[0].keyword}" }, dependsOn: ["keywords"] },
      { id: "seo", tool: "growth_seo_analyze", inputs: { content: "${results.blog.blog.content}", targetKeywords: "${inputs.topic}" }, dependsOn: ["blog"] },
      { id: "tweets", tool: "growth_generate_tweets", inputs: { topic: "${inputs.topic}", count: "5", style: "promotional" }, dependsOn: ["blog"] }
    ],
    metadata: { category: "content", riskLevel: "low", tags: ["growth", "marketing"] }
  },
  // DCA trading with autonomy
  dcaWithAutonomy: {
    id: "dca-autonomy",
    name: "DCA Trade (Safe)",
    description: "Execute DCA trade with risk classification and boundary checks",
    steps: [
      { id: "classify", tool: "autonomy_classify_risk", inputs: { action: '{"type":"trade","asset":"${inputs.asset}","amount":${inputs.amount}}', category: "financial", estimatedImpact: "${inputs.amount}" } },
      { id: "boundaries", tool: "autonomy_check_boundaries", inputs: { boundaryType: "financial", value: "${inputs.amount}" }, dependsOn: ["classify"] },
      { id: "trade", tool: "money_dca_trade", inputs: { asset: "${inputs.asset}", amountUsd: "${inputs.amount}", mode: "${inputs.mode}" }, dependsOn: ["boundaries"], condition: 'results.boundaries.withinBoundaries && results.classify.risk.recommendation !== "reject"' },
      { id: "audit", tool: "autonomy_log_audit", inputs: { action: '{"type":"trade","asset":"${inputs.asset}","amount":${inputs.amount}}', result: '${results.trade.success ? "success" : "failed"}' }, dependsOn: ["trade"] }
    ],
    metadata: { category: "trading", riskLevel: "medium", tags: ["money", "autonomy", "trading"] }
  },
  // Financial health check
  financialHealthCheck: {
    id: "health-check",
    name: "Financial Health Check",
    description: "Complete treasury and expense analysis",
    steps: [
      { id: "treasury", tool: "money_treasury_status", inputs: {} },
      { id: "expenses", tool: "money_expenses", inputs: { days: "30" } },
      { id: "health", tool: "money_health_check", inputs: {}, dependsOn: ["treasury", "expenses"] },
      { id: "autonomy", tool: "autonomy_status", inputs: {} }
    ],
    metadata: { category: "monitoring", riskLevel: "safe", tags: ["money", "health"] }
  },
  // Full discovery pipeline
  fullDiscovery: {
    id: "full-discovery",
    name: "Full Discovery Pipeline",
    description: "Hunt all sources, score, filter, and generate content about top findings",
    steps: [
      { id: "hunt", tool: "hunter_discover", inputs: {} },
      { id: "score", tool: "hunter_score", inputs: { discoveries: "${JSON.stringify(results.hunt.discoveries)}" }, dependsOn: ["hunt"] },
      { id: "filter", tool: "hunter_filter", inputs: { discoveries: "${JSON.stringify(results.score.discoveries)}", minScore: "70", limit: "5" }, dependsOn: ["score"] },
      { id: "tweets", tool: "growth_generate_tweets", inputs: { topic: '${results.filter.discoveries[0]?.title || "tech trends"}', count: "3", style: "informative" }, dependsOn: ["filter"] }
    ],
    metadata: { category: "research", riskLevel: "low", tags: ["hunter", "growth", "full-stack"] }
  }
};
export {
  DEFAULT_PTC_CONFIG,
  PIPELINE_TEMPLATES,
  PTCCoordinator,
  PipelineResultSchema,
  PipelineSchema,
  PipelineStepSchema,
  SharedContextSchema,
  StepResultSchema,
  ToolDefinitionSchema,
  ValidationResultSchema,
  autonomyStatusToolDefinition,
  autonomyTools,
  blogGenerateToolDefinition,
  checkApprovalToolDefinition,
  checkBoundariesToolDefinition,
  classifyRiskToolDefinition,
  contentCalendarToolDefinition,
  contentGeneration,
  createAllHandlers,
  dcaTradeToolDefinition,
  discordAnnounceToolDefinition,
  expenseStatusToolDefinition,
  getAllToolDefinitions,
  getTemplate,
  growthEngineTools,
  healthCheckToolDefinition,
  hunterFilterToolDefinition,
  hunterScoreToolDefinition,
  hunterToolDefinition,
  hunterTools,
  keywordResearchToolDefinition,
  listTemplates,
  listTemplatesByCategory,
  logAuditToolDefinition,
  moneyEngineTools,
  pipelineTemplates,
  portfolioAnalysis,
  researchAndAnalyze,
  securityAudit,
  seoAnalyzeToolDefinition,
  swapToken,
  toolCategories,
  treasuryStatusToolDefinition,
  tweetGenerateToolDefinition
};
