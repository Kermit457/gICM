/**
 * gICM Daily Cycle
 *
 * Autonomous daily operating cycle that coordinates all engines:
 * - Morning Scan (00:00-04:00 UTC): Discovery, market analysis
 * - Decision Planning (04:00-06:00 UTC): Prioritize, plan executions
 * - Execution (06:00-20:00 UTC): Trading, content, building
 * - Reflection (20:00-22:00 UTC): Review performance, learn
 * - Maintenance (22:00-00:00 UTC): Cleanup, prepare for next day
 */

import { CronJob } from "cron";
import { goalSystem, GoalSystemManager } from "./goal-system.js";
import type { HunterEngineConnection } from "./adapters/hunter-adapter.js";
import type { TradingSignal } from "./signal-processor.js";

// ============================================================================
// TYPES
// ============================================================================

export type PhaseType =
  | "morning_scan"
  | "decision_planning"
  | "execution"
  | "reflection"
  | "maintenance";

export interface PhaseResult {
  phase: PhaseType;
  startedAt: number;
  completedAt: number;
  success: boolean;
  metrics: Record<string, number>;
  errors: string[];
  actions: ActionLog[];
}

export interface ActionLog {
  timestamp: number;
  engine: "money" | "growth" | "product" | "brain";
  action: string;
  result: "success" | "failed" | "skipped";
  details?: string;
}

export interface DailyCycleConfig {
  enabled: boolean;
  dryRun: boolean;
  notifyOnPhaseComplete: boolean;
  notifyOnError: boolean;
}

export interface EngineConnections {
  money?: {
    getTreasuryStatus: () => Promise<{ totalUsd: number; runway: string }>;
    getUpcomingExpenses: () => Promise<Array<{ name: string; amount: number; dueDate: number }>>;
  };
  growth?: {
    generateContent: (type: string) => Promise<{ id: string; title: string }>;
    schedulePost: (content: { title: string; body: string }, platform: string) => Promise<void>;
  };
  product?: {
    runDiscovery: () => Promise<Array<{ id: string; title: string; score: number }>>;
    getBacklog: () => Promise<Array<{ id: string; status: string }>>;
    processNextBuild: () => Promise<{ id: string; status: string } | null>;
  };
  trading?: {
    getStatus: () => Promise<{ mode: string; positions: number; pnlToday: number }>;
    runAnalysis: (token: string) => Promise<{ signal: string; confidence: number }>;
    sendSignals?: (signals: TradingSignal[]) => Promise<{ queued: number; rejected: number }>;
  };
  hunter?: HunterEngineConnection;
}

// ============================================================================
// DAILY CYCLE MANAGER
// ============================================================================

export class DailyCycleManager {
  private config: DailyCycleConfig;
  private goals: GoalSystemManager;
  private engines: EngineConnections;
  private jobs: Map<string, CronJob> = new Map();
  private todayResults: PhaseResult[] = [];
  private isRunning = false;
  private currentPhase: PhaseType | null = null;

  constructor(config?: Partial<DailyCycleConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      dryRun: config?.dryRun ?? true, // Safe default
      notifyOnPhaseComplete: config?.notifyOnPhaseComplete ?? true,
      notifyOnError: config?.notifyOnError ?? true,
    };
    this.goals = goalSystem;
    this.engines = {};
  }

  /**
   * Connect engines
   */
  connectEngines(engines: EngineConnections): void {
    this.engines = { ...this.engines, ...engines };
    this.log("brain", "Engines connected", Object.keys(engines).join(", "));
  }

  /**
   * Start the daily cycle
   */
  start(): void {
    if (this.isRunning) {
      this.log("brain", "Already running", "skipped");
      return;
    }

    this.log("brain", "Starting daily cycle", this.config.dryRun ? "DRY RUN MODE" : "LIVE MODE");

    // Phase schedules (UTC)
    const schedules: Record<PhaseType, string> = {
      morning_scan: "0 0 * * *",      // 00:00 UTC
      decision_planning: "0 4 * * *", // 04:00 UTC
      execution: "0 6 * * *",         // 06:00 UTC
      reflection: "0 20 * * *",       // 20:00 UTC
      maintenance: "0 22 * * *",      // 22:00 UTC
    };

    for (const [phase, cron] of Object.entries(schedules)) {
      const job = new CronJob(cron, async () => {
        await this.runPhase(phase as PhaseType);
      }, null, true, "UTC");
      this.jobs.set(phase, job);
    }

    this.isRunning = true;
    this.log("brain", "Daily cycle started", `${this.jobs.size} phases scheduled`);

    // Run current phase immediately if we're in one
    const currentPhase = this.goals.getCurrentPhase();
    if (currentPhase) {
      this.log("brain", `Currently in ${currentPhase.name} phase`, "running immediately");
      this.runPhase(currentPhase.name as PhaseType);
    }
  }

  /**
   * Stop the daily cycle
   */
  stop(): void {
    for (const [name, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    this.isRunning = false;
    this.log("brain", "Daily cycle stopped");
  }

  /**
   * Run a specific phase
   */
  async runPhase(phase: PhaseType): Promise<PhaseResult> {
    this.currentPhase = phase;
    const startedAt = Date.now();
    const actions: ActionLog[] = [];
    const errors: string[] = [];
    const metrics: Record<string, number> = {};

    this.log("brain", `Starting phase: ${phase}`);

    try {
      switch (phase) {
        case "morning_scan":
          await this.runMorningScan(actions, metrics, errors);
          break;
        case "decision_planning":
          await this.runDecisionPlanning(actions, metrics, errors);
          break;
        case "execution":
          await this.runExecution(actions, metrics, errors);
          break;
        case "reflection":
          await this.runReflection(actions, metrics, errors);
          break;
        case "maintenance":
          await this.runMaintenance(actions, metrics, errors);
          break;
      }
    } catch (error) {
      errors.push(`Phase error: ${error}`);
      this.log("brain", `Phase ${phase} error`, String(error));
    }

    const result: PhaseResult = {
      phase,
      startedAt,
      completedAt: Date.now(),
      success: errors.length === 0,
      metrics,
      errors,
      actions,
    };

    this.todayResults.push(result);
    this.currentPhase = null;

    this.log("brain", `Phase ${phase} complete`, `${actions.length} actions, ${errors.length} errors`);

    return result;
  }

  // ============================================================================
  // PHASE IMPLEMENTATIONS
  // ============================================================================

  /**
   * Morning Scan: Discovery, market analysis, opportunity identification
   */
  private async runMorningScan(
    actions: ActionLog[],
    metrics: Record<string, number>,
    errors: string[]
  ): Promise<void> {
    // 1. Run HUNTER discovery (alpha signals)
    if (this.engines.hunter) {
      try {
        this.log("brain", "Running hunter alpha scan...");
        const discoveries = await this.engines.hunter.runHunt();
        metrics.hunterDiscoveries = discoveries.length;
        actions.push(this.action("brain", "runHunterScan", "success", `Found ${discoveries.length} discoveries`));

        // Process into signals
        const signalBatch = this.engines.hunter.processSignals(discoveries);
        metrics.totalSignals = signalBatch.signals.length;
        actions.push(this.action("brain", "processSignals", "success", `${signalBatch.signals.length} signals generated`));

        // Get actionable signals
        const actionable = this.engines.hunter.getActionableSignals();
        metrics.actionableSignals = actionable.length;
        actions.push(this.action("brain", "filterActionable", "success", `${actionable.length} actionable signals`));

        // Log top signals
        actionable.slice(0, 5).forEach((signal) => {
          this.log("brain", `[${signal.type}] ${signal.title.slice(0, 50)}...`, `Confidence: ${signal.confidence}%`);
        });

        // Send actionable signals to trading
        if (actionable.length > 0 && this.engines.trading?.sendSignals) {
          try {
            const result = await this.engines.trading.sendSignals(actionable);
            metrics.signalsQueued = result.queued;
            metrics.signalsRejected = result.rejected;
            actions.push(this.action("brain", "sendSignals", "success", `${result.queued} queued, ${result.rejected} rejected`));
          } catch (e) {
            errors.push(`Failed to send signals: ${e}`);
            actions.push(this.action("brain", "sendSignals", "failed", String(e)));
          }
        }
      } catch (e) {
        errors.push(`Hunter scan failed: ${e}`);
        actions.push(this.action("brain", "runHunterScan", "failed", String(e)));
      }
    }

    // 2. Run product discovery
    if (this.engines.product) {
      try {
        const opportunities = await this.engines.product.runDiscovery();
        metrics.productDiscoveries = opportunities.length;
        actions.push(this.action("product", "runDiscovery", "success", `Found ${opportunities.length} opportunities`));

        // Log top opportunities
        opportunities.slice(0, 5).forEach((opp) => {
          this.log("product", `Discovery: ${opp.title}`, `Score: ${opp.score}`);
        });
      } catch (e) {
        errors.push(`Product discovery failed: ${e}`);
        actions.push(this.action("product", "runDiscovery", "failed", String(e)));
      }
    }

    // 3. Check treasury status
    if (this.engines.money) {
      try {
        const treasury = await this.engines.money.getTreasuryStatus();
        metrics.treasuryUsd = treasury.totalUsd;
        actions.push(this.action("money", "getTreasuryStatus", "success", `$${treasury.totalUsd} | ${treasury.runway}`));

        const expenses = await this.engines.money.getUpcomingExpenses();
        metrics.upcomingExpenses = expenses.length;
        actions.push(this.action("money", "getUpcomingExpenses", "success", `${expenses.length} upcoming`));
      } catch (e) {
        errors.push(`Treasury check failed: ${e}`);
        actions.push(this.action("money", "getTreasuryStatus", "failed", String(e)));
      }
    }

    // 4. Check trading status
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.tradingPositions = status.positions;
        metrics.tradingPnl = status.pnlToday;
        actions.push(this.action("money", "getTradingStatus", "success", `${status.positions} positions, $${status.pnlToday} PnL`));
      } catch (e) {
        errors.push(`Trading status check failed: ${e}`);
        actions.push(this.action("money", "getTradingStatus", "failed", String(e)));
      }
    }
  }

  /**
   * Decision Planning: Prioritize tasks, plan executions
   */
  private async runDecisionPlanning(
    actions: ActionLog[],
    metrics: Record<string, number>,
    errors: string[]
  ): Promise<void> {
    const thresholds = this.goals.getDecisionThresholds();
    const todayFocus = this.goals.getTodayFocus();

    this.log("brain", `Today's focus: ${todayFocus}`);
    actions.push(this.action("brain", "setFocus", "success", todayFocus));

    // 1. Evaluate backlog items
    if (this.engines.product) {
      try {
        const backlog = await this.engines.product.getBacklog();
        const pending = backlog.filter((b) => b.status === "evaluated");
        metrics.backlogPending = pending.length;

        // Auto-approve based on goal system thresholds
        let approved = 0;
        let rejected = 0;

        // In dry run, we just log what we would do
        if (this.config.dryRun) {
          this.log("brain", `[DRY RUN] Would process ${pending.length} backlog items`);
        }

        metrics.autoApproved = approved;
        metrics.autoRejected = rejected;
        actions.push(this.action("brain", "evaluateBacklog", "success", `${pending.length} pending items`));
      } catch (e) {
        errors.push(`Backlog evaluation failed: ${e}`);
        actions.push(this.action("brain", "evaluateBacklog", "failed", String(e)));
      }
    }

    // 2. Plan content for growth
    const dailyMetrics = this.goals.getDailyMetrics();
    if (dailyMetrics.content_pieces) {
      const target = dailyMetrics.content_pieces.target as number;
      metrics.contentTarget = target;
      actions.push(this.action("brain", "planContent", "success", `Target: ${target} pieces`));
    }
  }

  /**
   * Execution: Trading, content creation, building
   */
  private async runExecution(
    actions: ActionLog[],
    metrics: Record<string, number>,
    errors: string[]
  ): Promise<void> {
    // 1. Execute scheduled content
    if (this.engines.growth) {
      try {
        if (this.config.dryRun) {
          this.log("growth", "[DRY RUN] Would generate and schedule content");
          actions.push(this.action("growth", "generateContent", "skipped", "Dry run mode"));
        } else {
          const content = await this.engines.growth.generateContent("educational");
          await this.engines.growth.schedulePost({ title: content.title, body: "" }, "twitter");
          metrics.contentGenerated = 1;
          actions.push(this.action("growth", "generateContent", "success", content.title));
        }
      } catch (e) {
        errors.push(`Content generation failed: ${e}`);
        actions.push(this.action("growth", "generateContent", "failed", String(e)));
      }
    }

    // 2. Process builds
    if (this.engines.product) {
      try {
        if (this.config.dryRun) {
          this.log("product", "[DRY RUN] Would process next build");
          actions.push(this.action("product", "processNextBuild", "skipped", "Dry run mode"));
        } else {
          const build = await this.engines.product.processNextBuild();
          if (build) {
            metrics.buildsProcessed = 1;
            actions.push(this.action("product", "processNextBuild", "success", build.id));
          } else {
            actions.push(this.action("product", "processNextBuild", "skipped", "No builds in queue"));
          }
        }
      } catch (e) {
        errors.push(`Build processing failed: ${e}`);
        actions.push(this.action("product", "processNextBuild", "failed", String(e)));
      }
    }

    // 3. Trading execution happens via ai-hedge-fund separately
    // We just monitor here
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.tradingMode = status.mode === "paper" ? 0 : status.mode === "micro" ? 1 : 2;
        actions.push(this.action("money", "monitorTrading", "success", `Mode: ${status.mode}`));
      } catch (e) {
        actions.push(this.action("money", "monitorTrading", "failed", String(e)));
      }
    }
  }

  /**
   * Reflection: Review performance, calculate metrics
   */
  private async runReflection(
    actions: ActionLog[],
    metrics: Record<string, number>,
    errors: string[]
  ): Promise<void> {
    // 1. Aggregate today's results
    const todayActions = this.todayResults.flatMap((r) => r.actions);
    const successCount = todayActions.filter((a) => a.result === "success").length;
    const failedCount = todayActions.filter((a) => a.result === "failed").length;

    metrics.totalActions = todayActions.length;
    metrics.successRate = todayActions.length > 0 ? Math.round((successCount / todayActions.length) * 100) : 0;
    metrics.failedActions = failedCount;

    this.log("brain", `Daily stats: ${successCount}/${todayActions.length} successful (${metrics.successRate}%)`);
    actions.push(this.action("brain", "aggregateStats", "success", `${metrics.successRate}% success rate`));

    // 2. Check goal progress
    const dailyMetrics = this.goals.getDailyMetrics();
    const progress: string[] = [];

    for (const [key, target] of Object.entries(dailyMetrics)) {
      const value = this.todayResults.reduce((sum, r) => sum + (r.metrics[key] ?? 0), 0);
      const targetValue = target.target as number;
      const percent = Math.round((value / targetValue) * 100);
      progress.push(`${key}: ${value}/${targetValue} (${percent}%)`);
    }

    this.log("brain", "Goal progress", progress.join(", "));
    actions.push(this.action("brain", "checkGoalProgress", "success", `${progress.length} metrics tracked`));

    // 3. Trading reflection
    if (this.engines.trading) {
      try {
        const status = await this.engines.trading.getStatus();
        metrics.dailyPnl = status.pnlToday;
        this.log("money", `Daily PnL: $${status.pnlToday}`);
        actions.push(this.action("money", "recordPnl", "success", `$${status.pnlToday}`));
      } catch (e) {
        errors.push(`Trading reflection failed: ${e}`);
      }
    }
  }

  /**
   * Maintenance: Cleanup, prepare for next day
   */
  private async runMaintenance(
    actions: ActionLog[],
    metrics: Record<string, number>,
    errors: string[]
  ): Promise<void> {
    // 1. Archive today's results
    const summary = {
      date: new Date().toISOString().split("T")[0],
      phases: this.todayResults.length,
      totalActions: this.todayResults.reduce((sum, r) => sum + r.actions.length, 0),
      totalErrors: this.todayResults.reduce((sum, r) => sum + r.errors.length, 0),
    };

    this.log("brain", `Day summary: ${summary.totalActions} actions, ${summary.totalErrors} errors`);
    actions.push(this.action("brain", "archiveResults", "success", JSON.stringify(summary)));

    // 2. Reset for tomorrow
    this.todayResults = [];
    metrics.resetComplete = 1;
    actions.push(this.action("brain", "resetForTomorrow", "success"));

    // 3. Check treasury runway
    if (this.engines.money) {
      try {
        const treasury = await this.engines.money.getTreasuryStatus();
        this.log("money", `Treasury runway: ${treasury.runway}`);
        actions.push(this.action("money", "checkRunway", "success", treasury.runway));
      } catch (e) {
        errors.push(`Treasury check failed: ${e}`);
      }
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private log(engine: string, message: string, details?: string): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${engine.toUpperCase()}]`;
    console.log(`${prefix} ${message}${details ? ` - ${details}` : ""}`);
  }

  private action(
    engine: ActionLog["engine"],
    action: string,
    result: ActionLog["result"],
    details?: string
  ): ActionLog {
    return {
      timestamp: Date.now(),
      engine,
      action,
      result,
      details,
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentPhase: this.currentPhase,
      dryRun: this.config.dryRun,
      todayPhases: this.todayResults.length,
      todayActions: this.todayResults.reduce((sum, r) => sum + r.actions.length, 0),
      todayErrors: this.todayResults.reduce((sum, r) => sum + r.errors.length, 0),
      connectedEngines: Object.keys(this.engines),
    };
  }

  /**
   * Get today's results
   */
  getTodayResults(): PhaseResult[] {
    return this.todayResults;
  }

  /**
   * Manually trigger a phase (for testing)
   */
  async triggerPhase(phase: PhaseType): Promise<PhaseResult> {
    return this.runPhase(phase);
  }
}

// Export singleton instance
export const dailyCycle = new DailyCycleManager();
