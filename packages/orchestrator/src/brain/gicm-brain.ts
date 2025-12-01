/**
 * gICM Brain - The Main Autonomous Controller
 *
 * Wires together all engines and provides the main entry point
 * for the autonomous system.
 */

import { DailyCycleManager, dailyCycle, type EngineConnections } from "./daily-cycle.js";
import { goalSystem } from "./goal-system.js";
import { GrowthEngine } from "@gicm/growth-engine";
import { ProductEngine } from "@gicm/product-engine";
import { createGrowthAdapter, createProductAdapter, createHunterAdapter, type HunterAdapter } from "./adapters/index.js";
import type { TradingSignal } from "./signal-processor.js";

// ============================================================================
// TYPES
// ============================================================================

export interface GicmBrainConfig {
  dryRun?: boolean;
  tradingApiUrl?: string;
  enableDiscovery?: boolean;
  enableTrading?: boolean;
  enableGrowth?: boolean;
  enableHunter?: boolean;
  hunterApiKeys?: {
    github?: string;
    apify?: string;
    fred?: string;
    finnhub?: string;
  };
}

export interface BrainStatus {
  version: string;
  primeDirective: string;
  autonomyLevel: number;
  autonomyDescription: string;
  currentPhase: string | null;
  todayFocus: string;
  isRunning: boolean;
  dryRun: boolean;
  engines: {
    money: boolean;
    growth: boolean;
    product: boolean;
    trading: boolean;
    hunter: boolean;
  };
  metrics: {
    todayPhases: number;
    todayActions: number;
    todayErrors: number;
  };
  hunter?: {
    enabledSources: string[];
    totalDiscoveries: number;
    totalSignals: number;
    actionableSignals: number;
  };
}

// ============================================================================
// GICM BRAIN
// ============================================================================

export class GicmBrain {
  private config: GicmBrainConfig;
  private cycle: DailyCycleManager;
  private engines: EngineConnections = {};
  private hunterAdapter?: HunterAdapter;
  private hub?: any; // Optional integration hub

  constructor(config?: GicmBrainConfig) {
    this.config = {
      dryRun: config?.dryRun ?? true,
      tradingApiUrl: config?.tradingApiUrl ?? "http://localhost:4000",
      enableDiscovery: config?.enableDiscovery ?? true,
      enableTrading: config?.enableTrading ?? true,
      enableGrowth: config?.enableGrowth ?? true,
      enableHunter: config?.enableHunter ?? true,
      hunterApiKeys: config?.hunterApiKeys,
    };

    this.cycle = new DailyCycleManager({
      dryRun: this.config.dryRun,
      enabled: true,
    });
  }

  /**
   * Initialize all engine connections
   */
  async initialize(): Promise<void> {
    console.log("[BRAIN] Initializing gICM Brain...");
    console.log(`[BRAIN] Prime Directive: ${goalSystem.getPrimeDirective()}`);
    console.log(`[BRAIN] Autonomy Level: ${goalSystem.getCurrentAutonomyLevel()}`);
    console.log(`[BRAIN] Mode: ${this.config.dryRun ? "DRY RUN" : "LIVE"}`);

    // Connect engines based on config
    await this.connectEngines();

    console.log("[BRAIN] Initialization complete");
  }

  /**
   * Connect all available engines
   */
  private async connectEngines(): Promise<void> {
    const connections: EngineConnections = {};

    // Money Engine (always connect for status)
    connections.money = this.createMoneyEngineConnection();
    console.log("[BRAIN] Money engine connected");

    // Growth Engine
    if (this.config.enableGrowth) {
      connections.growth = this.createGrowthEngineConnection();
      console.log("[BRAIN] Growth engine connected");
    }

    // Product Engine
    if (this.config.enableDiscovery) {
      connections.product = this.createProductEngineConnection();
      console.log("[BRAIN] Product engine connected");
    }

    // Trading (AI Hedge Fund)
    if (this.config.enableTrading) {
      connections.trading = this.createTradingConnection();
      console.log("[BRAIN] Trading engine connected");
    }

    // Hunter Engine (Alpha Discovery)
    if (this.config.enableHunter) {
      connections.hunter = await this.createHunterEngineConnection();
      console.log("[BRAIN] Hunter engine connected");
    }

    this.engines = connections;
    this.cycle.connectEngines(connections);
  }

  /**
   * Create money engine connection
   */
  private createMoneyEngineConnection(): EngineConnections["money"] {
    // Import dynamically to avoid circular dependencies
    return {
      getTreasuryStatus: async () => {
        // TODO: Connect to actual TreasuryManager
        // For now, return mock data
        return {
          totalUsd: 0,
          runway: "Unknown - not connected to wallet",
        };
      },
      getUpcomingExpenses: async () => {
        // TODO: Connect to actual ExpenseTracker
        return [
          { name: "Claude API", amount: 200, dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000 },
          { name: "Helius RPC", amount: 50, dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000 },
        ];
      },
    };
  }

  /**
   * Create growth engine connection
   */
  private createGrowthEngineConnection(): EngineConnections["growth"] {
    try {
      const growthEngine = new GrowthEngine({
        blog: { postsPerWeek: 3, categories: ["tutorial", "guide"], targetWordCount: 1500 },
        twitter: { tweetsPerDay: 5, threadsPerWeek: 2, engagementEnabled: false },
        seo: { primaryKeywords: [], competitors: [], targetPositions: {} },
        discord: { serverId: "", announcementChannel: "", contentChannel: "" },
      });

      // Don't start() - we just use it for on-demand operations
      return createGrowthAdapter(growthEngine);
    } catch (error) {
      console.warn(`[BRAIN] Failed to create GrowthEngine: ${error}`);
      // Fallback to mock
      return {
        generateContent: async (type) => ({
          id: `mock-${Date.now()}`,
          title: `[Mock] ${type}`,
        }),
        schedulePost: async () => {},
      };
    }
  }

  /**
   * Create product engine connection
   */
  private createProductEngineConnection(): EngineConnections["product"] {
    try {
      const productEngine = new ProductEngine({
        discovery: {
          enabled: false, // Manual discovery via daily cycle
          sources: ["competitor", "github", "hackernews"],
          intervalHours: 6,
        },
        building: {
          autoBuild: false,
          autoApprove: false,
          outputDir: "packages",
        },
        quality: {
          minTestScore: 80,
          minReviewScore: 70,
          requireApproval: true,
        },
        deployment: {
          autoDeploy: false,
          registry: "npm",
          notifications: true,
        },
      });

      return createProductAdapter(productEngine);
    } catch (error) {
      console.warn(`[BRAIN] Failed to create ProductEngine: ${error}`);
      // Fallback to mock
      return {
        runDiscovery: async () => [],
        getBacklog: async () => [],
        processNextBuild: async () => null,
      };
    }
  }

  /**
   * Create trading (AI Hedge Fund) connection
   */
  private createTradingConnection(): EngineConnections["trading"] {
    const apiUrl = this.config.tradingApiUrl;

    return {
      getStatus: async () => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/status`);
          if (!response.ok) throw new Error("API not available");
          const data = await response.json();
          return {
            mode: data.mode,
            positions: data.positions,
            pnlToday: data.pnlToday,
          };
        } catch {
          // Fallback if API not running
          return {
            mode: goalSystem.getDefaultTradingMode(),
            positions: 0,
            pnlToday: 0,
          };
        }
      },
      runAnalysis: async (token: string) => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, chain: "solana" }),
          });
          if (!response.ok) throw new Error("Analysis failed");
          const data = await response.json();
          return {
            signal: data.final_decision?.action ?? "hold",
            confidence: data.final_decision?.confidence ?? 0,
          };
        } catch {
          return { signal: "hold", confidence: 0 };
        }
      },
      sendSignals: async (signals: TradingSignal[]) => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/signals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signals }),
          });
          if (!response.ok) throw new Error("Signal send failed");
          const data = await response.json();
          return {
            queued: data.queued ?? 0,
            rejected: data.rejected ?? 0,
          };
        } catch {
          return { queued: 0, rejected: signals.length };
        }
      },
    };
  }

  /**
   * Create hunter engine connection
   */
  private async createHunterEngineConnection(): Promise<EngineConnections["hunter"]> {
    try {
      this.hunterAdapter = createHunterAdapter({
        apiKeys: this.config.hunterApiKeys,
        tradingApiUrl: this.config.tradingApiUrl,
        autoSendSignals: false, // We'll send manually via trading connection
      });

      await this.hunterAdapter.initialize();
      return this.hunterAdapter.createConnection();
    } catch (error) {
      console.warn(`[BRAIN] Failed to create HunterAdapter: ${error}`);
      // Return mock connection
      return {
        runHunt: async () => [],
        getDiscoveries: () => [],
        processSignals: () => ({
          processedAt: new Date(),
          totalDiscoveries: 0,
          signals: [],
          byType: {} as any,
          byAction: {},
        }),
        getActionableSignals: () => [],
        getStatus: () => ({
          isRunning: false,
          enabledSources: [],
          lastHunt: null,
          totalDiscoveries: 0,
          totalSignals: 0,
          actionableSignals: 0,
        }),
        start: async () => {},
        stop: async () => {},
      };
    }
  }

  /**
   * Start the autonomous cycle
   */
  start(): void {
    console.log("[BRAIN] Starting autonomous cycle...");
    this.cycle.start();

    // Emit engine started event (if hub available)
    this.hub?.engineStarted?.("orchestrator");

    // Setup heartbeat (if hub available)
    setInterval(() => {
      this.hub?.heartbeat?.("orchestrator");
    }, 30000);
  }

  /**
   * Stop the autonomous cycle
   */
  stop(): void {
    console.log("[BRAIN] Stopping autonomous cycle...");
    this.cycle.stop();

    // Emit engine stopped event (if hub available)
    this.hub?.engineStopped?.("orchestrator");
  }

  /**
   * Emit a brain event
   */
  emitEvent(type: "brain:phase_started" | "brain:phase_completed" | "brain:decision_made" | "brain:goal_achieved", payload: Record<string, unknown>): void {
    this.hub?.getEventBus?.()?.emit?.("orchestrator", type, payload as any);
  }

  /**
   * Get current status
   */
  getStatus(): BrainStatus {
    const cycleStatus = this.cycle.getStatus();
    const currentPhase = goalSystem.getCurrentPhase();
    const hunterStatus = this.engines.hunter?.getStatus();

    return {
      version: "1.0.0",
      primeDirective: goalSystem.getPrimeDirective(),
      autonomyLevel: goalSystem.getCurrentAutonomyLevel(),
      autonomyDescription: goalSystem.getAutonomyDescription(goalSystem.getCurrentAutonomyLevel()),
      currentPhase: currentPhase?.name ?? null,
      todayFocus: goalSystem.getTodayFocus(),
      isRunning: cycleStatus.isRunning,
      dryRun: cycleStatus.dryRun,
      engines: {
        money: !!this.engines.money,
        growth: !!this.engines.growth,
        product: !!this.engines.product,
        trading: !!this.engines.trading,
        hunter: !!this.engines.hunter,
      },
      metrics: {
        todayPhases: cycleStatus.todayPhases,
        todayActions: cycleStatus.todayActions,
        todayErrors: cycleStatus.todayErrors,
      },
      hunter: hunterStatus ? {
        enabledSources: hunterStatus.enabledSources,
        totalDiscoveries: hunterStatus.totalDiscoveries,
        totalSignals: hunterStatus.totalSignals,
        actionableSignals: hunterStatus.actionableSignals,
      } : undefined,
    };
  }

  /**
   * Manually trigger a phase (for testing)
   */
  async triggerPhase(phase: "morning_scan" | "decision_planning" | "execution" | "reflection" | "maintenance") {
    return this.cycle.triggerPhase(phase);
  }

  /**
   * Get today's results
   */
  getTodayResults() {
    return this.cycle.getTodayResults();
  }

  /**
   * Get the goal system
   */
  getGoalSystem() {
    return goalSystem;
  }
}

// Export factory function
export function createGicmBrain(config?: GicmBrainConfig): GicmBrain {
  return new GicmBrain(config);
}
