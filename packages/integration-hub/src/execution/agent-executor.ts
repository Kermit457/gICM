/**
 * Agent Executor - Dynamically loads and executes gICM agents
 *
 * Bridges PTC pipeline steps to actual agent implementations with:
 * - Dynamic agent loading
 * - Input validation
 * - Cost/token tracking
 * - Error handling and retries
 */

import { EventEmitter } from "eventemitter3";
import { toolRegistry, type ToolResult } from "./tool-registry.js";

// Executor configuration
export interface ExecutorConfig {
  timeout?: number; // ms, default 30000
  retries?: number; // default 0
  verbose?: boolean;
  mockMode?: boolean; // use mock responses instead of real agents
}

// Execution context passed to agents
export interface ExecutionContext {
  executionId: string;
  stepId: string;
  pipelineId: string;
  inputs: Record<string, unknown>;
  previousResults: Record<string, unknown>;
}

// Executor events
export interface ExecutorEvents {
  "execution:start": (ctx: ExecutionContext, toolId: string) => void;
  "execution:complete": (ctx: ExecutionContext, result: ToolResult) => void;
  "execution:error": (ctx: ExecutionContext, error: Error) => void;
  "execution:retry": (ctx: ExecutionContext, attempt: number) => void;
}

// Agent module cache
const agentCache: Map<string, unknown> = new Map();

/**
 * AgentExecutor - Executes tools from the registry
 */
export class AgentExecutor extends EventEmitter<ExecutorEvents> {
  private config: Required<ExecutorConfig>;
  private totalTokens = 0;
  private totalCost = 0;

  constructor(config: ExecutorConfig = {}) {
    super();
    this.config = {
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 0,
      verbose: config.verbose ?? false,
      mockMode: config.mockMode ?? false,
    };
  }

  /**
   * Execute a tool with given inputs
   */
  async execute(
    toolId: string,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    this.emit("execution:start", context, toolId);

    // Validate tool exists
    const tool = toolRegistry.get(toolId);
    if (!tool) {
      const error = new Error(`Tool not found: ${toolId}`);
      this.emit("execution:error", context, error);
      return {
        success: false,
        data: null,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }

    // Validate inputs
    const validation = toolRegistry.validateInputs(toolId, inputs);
    if (!validation.valid) {
      const error = new Error(`Invalid inputs: ${validation.error}`);
      this.emit("execution:error", context, error);
      return {
        success: false,
        data: null,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }

    // Check API key requirements
    const requirements = toolRegistry.checkRequirements(toolId);
    if (!requirements.ready && !this.config.mockMode) {
      const error = new Error(`Missing required API keys: ${requirements.missing.join(", ")}`);
      this.emit("execution:error", context, error);
      return {
        success: false,
        data: null,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }

    // Use mock mode if enabled
    if (this.config.mockMode) {
      return this.executeMock(tool.id, inputs, context, startTime);
    }

    // Execute with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      if (attempt > 0) {
        this.emit("execution:retry", context, attempt);
        await this.delay(1000 * attempt); // exponential backoff
      }

      try {
        const result = await this.executeReal(tool.id, tool.package, tool.agentClass, inputs, context);
        result.duration = Date.now() - startTime;

        // Track costs
        this.totalTokens += result.tokensUsed ?? 0;
        this.totalCost += result.cost ?? 0;

        this.emit("execution:complete", context, result);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);
      }
    }

    // All retries exhausted
    this.emit("execution:error", context, lastError!);
    return {
      success: false,
      data: null,
      error: lastError!.message,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute a real agent
   */
  private async executeReal(
    toolId: string,
    packageName: string,
    agentClass: string,
    inputs: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<ToolResult> {
    const estimates = toolRegistry.getEstimatedCost(toolId);

    try {
      // Dynamic import of the agent package
      const agentModule = await this.loadAgentModule(packageName);

      // Get the agent class
      const AgentClass = (agentModule as Record<string, unknown>)[agentClass];
      if (!AgentClass || typeof AgentClass !== "function") {
        throw new Error(`Agent class ${agentClass} not found in ${packageName}`);
      }

      // Instantiate the agent
      const tool = toolRegistry.get(toolId);
      const config = {
        ...(tool?.defaultConfig ?? {}),
        verbose: this.config.verbose,
      };

      const agent = new (AgentClass as new (config: unknown) => {
        analyze: (context: { action?: string; params?: Record<string, unknown> }) => Promise<{
          success: boolean;
          data?: unknown;
          error?: string;
        }>;
      })(config);

      // Execute with timeout
      const result = await this.withTimeout(
        agent.analyze({
          action: (inputs.action as string) ?? "analyze",
          params: inputs,
        }),
        this.config.timeout
      );

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        tokensUsed: estimates.tokens,
        cost: estimates.cost,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to execute ${toolId}: ${message}`);
    }
  }

  /**
   * Execute with mock data (for testing/demo)
   */
  private async executeMock(
    toolId: string,
    inputs: Record<string, unknown>,
    _context: ExecutionContext,
    startTime: number
  ): Promise<ToolResult> {
    // Simulate execution time
    await this.delay(500 + Math.random() * 1000);

    const estimates = toolRegistry.getEstimatedCost(toolId);
    const mockData = this.generateMockOutput(toolId, inputs);

    this.totalTokens += estimates.tokens;
    this.totalCost += estimates.cost;

    return {
      success: true,
      data: mockData,
      tokensUsed: estimates.tokens,
      cost: estimates.cost,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Generate mock output based on tool type
   */
  private generateMockOutput(toolId: string, inputs: Record<string, unknown>): unknown {
    const tool = toolRegistry.get(toolId);
    const category = tool?.category ?? "analytics";

    switch (category) {
      case "research":
        return {
          discoveries: [
            {
              title: "Trending: AI Agent Framework",
              source: "github",
              url: "https://github.com/example/ai-agents",
              score: 85,
              relevance: "high",
            },
            {
              title: "New DeFi Protocol Launch",
              source: "twitter",
              url: "https://twitter.com/example/status/123",
              score: 72,
              relevance: "medium",
            },
          ],
          count: 2,
          timestamp: Date.now(),
        };

      case "trading":
        return {
          recommendation: "BUY",
          confidence: 0.75,
          analysis: {
            technical: { trend: "bullish", rsi: 45, macd: "positive" },
            fundamental: { tvl: "increasing", users: "growing" },
            sentiment: { score: 0.68, volume: "high" },
          },
          entry: { price: 150.5, size: 0.1 },
          exit: { takeProfit: 165, stopLoss: 142 },
        };

      case "wallet":
        return {
          balance: {
            sol: 12.5,
            usdc: 1500.0,
            tokens: [
              { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", amount: 12.5 },
              { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", amount: 1500 },
            ],
          },
          address: inputs.address ?? "7xKX...",
        };

      case "security":
        return {
          riskScore: 25,
          riskLevel: "low",
          findings: [
            { severity: "info", title: "No reentrancy detected", description: "Contract is safe from reentrancy" },
            { severity: "warning", title: "Centralized ownership", description: "Single owner has admin rights" },
          ],
          passed: true,
          auditedAt: new Date().toISOString(),
        };

      case "content":
        return {
          content: `# ${inputs.topic ?? "AI Agents in Crypto"}\n\nExploring the intersection of artificial intelligence and blockchain technology...`,
          wordCount: 850,
          readTime: "4 min",
          seoScore: 82,
          keywords: ["AI", "crypto", "blockchain", "agents"],
        };

      case "defi":
        return {
          protocol: inputs.protocol ?? "Jupiter",
          tvl: 450000000,
          tvlChange24h: 5.2,
          apy: 12.5,
          pools: [
            { name: "SOL-USDC", tvl: 120000000, apy: 8.5 },
            { name: "JUP-SOL", tvl: 45000000, apy: 22.3 },
          ],
        };

      case "analytics":
        return {
          summary: "Analysis complete",
          metrics: {
            total: 15,
            positive: 10,
            negative: 3,
            neutral: 2,
          },
          sentiment: 0.67,
          trend: "bullish",
          confidence: 0.82,
        };

      default:
        return {
          status: "completed",
          result: "Mock execution successful",
          inputs,
          timestamp: Date.now(),
        };
    }
  }

  /**
   * Load agent module with caching
   */
  private async loadAgentModule(packageName: string): Promise<unknown> {
    if (agentCache.has(packageName)) {
      return agentCache.get(packageName);
    }

    try {
      const module = await import(packageName);
      agentCache.set(packageName, module);
      return module;
    } catch (err) {
      throw new Error(`Failed to load package ${packageName}: ${err}`);
    }
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log helper
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[AgentExecutor] ${message}`);
    }
  }

  /**
   * Get execution statistics
   */
  getStats(): { totalTokens: number; totalCost: number } {
    return {
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalTokens = 0;
    this.totalCost = 0;
  }
}

// Factory function
export function createAgentExecutor(config?: ExecutorConfig): AgentExecutor {
  return new AgentExecutor(config);
}

// Default executor singleton
let defaultExecutor: AgentExecutor | null = null;

export function getAgentExecutor(): AgentExecutor {
  if (!defaultExecutor) {
    defaultExecutor = new AgentExecutor({ mockMode: true });
  }
  return defaultExecutor;
}
