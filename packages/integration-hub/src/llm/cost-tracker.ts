/**
 * LLM Cost Tracker Implementation
 * Phase 16A: AI Operations - Cost Tracking & Budgeting
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type LLMCostTrackerConfig,
  LLMCostTrackerConfigSchema,
  type LLMCostEvents,
  type LLMCostStorage,
  type LLMRequest,
  type TokenUsage,
  type LLMProvider,
  type CostAggregation,
  type AggregationPeriod,
  type BudgetDefinition,
  type BudgetState,
  type BudgetStatus,
  type CostAlert,
  type CostAlertType,
  type CostOptimization,
  type CostReport,
  type CostReportType,
  MODEL_PRICING,
  calculateRequestCost,
  getPeriodBounds,
  formatCost,
  formatTokenCount,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemoryLLMCostStorage implements LLMCostStorage {
  private requests: Map<string, LLMRequest> = new Map();
  private aggregations: Map<string, CostAggregation> = new Map();
  private budgets: Map<string, BudgetDefinition> = new Map();
  private budgetStates: Map<string, BudgetState> = new Map();
  private alerts: Map<string, CostAlert> = new Map();
  private optimizations: Map<string, CostOptimization> = new Map();
  private reports: Map<string, CostReport> = new Map();

  async saveRequest(request: LLMRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async getRequests(filters: {
    startTime?: number;
    endTime?: number;
    provider?: LLMProvider;
    model?: string;
    projectId?: string;
    userId?: string;
  }): Promise<LLMRequest[]> {
    return Array.from(this.requests.values()).filter((req) => {
      if (filters.startTime && req.timestamp < filters.startTime) return false;
      if (filters.endTime && req.timestamp > filters.endTime) return false;
      if (filters.provider && req.provider !== filters.provider) return false;
      if (filters.model && req.model !== filters.model) return false;
      if (filters.projectId && req.projectId !== filters.projectId) return false;
      if (filters.userId && req.userId !== filters.userId) return false;
      return true;
    });
  }

  async saveAggregation(aggregation: CostAggregation): Promise<void> {
    const key = `${aggregation.period}-${aggregation.startTime}`;
    this.aggregations.set(key, aggregation);
  }

  async getAggregation(period: AggregationPeriod, startTime: number): Promise<CostAggregation | null> {
    const key = `${period}-${startTime}`;
    return this.aggregations.get(key) || null;
  }

  async getAggregations(
    period: AggregationPeriod,
    startTime: number,
    endTime: number
  ): Promise<CostAggregation[]> {
    return Array.from(this.aggregations.values()).filter(
      (agg) =>
        agg.period === period &&
        agg.startTime >= startTime &&
        agg.endTime <= endTime
    );
  }

  async saveBudget(budget: BudgetDefinition): Promise<void> {
    this.budgets.set(budget.id, budget);
  }

  async getBudget(id: string): Promise<BudgetDefinition | null> {
    return this.budgets.get(id) || null;
  }

  async deleteBudget(id: string): Promise<void> {
    this.budgets.delete(id);
    this.budgetStates.delete(id);
  }

  async listBudgets(): Promise<BudgetDefinition[]> {
    return Array.from(this.budgets.values());
  }

  async saveBudgetState(state: BudgetState): Promise<void> {
    this.budgetStates.set(state.budgetId, state);
  }

  async getBudgetState(budgetId: string): Promise<BudgetState | null> {
    return this.budgetStates.get(budgetId) || null;
  }

  async saveAlert(alert: CostAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async getAlerts(filters?: { acknowledged?: boolean; type?: CostAlertType }): Promise<CostAlert[]> {
    return Array.from(this.alerts.values()).filter((alert) => {
      if (filters?.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged) return false;
      if (filters?.type && alert.type !== filters.type) return false;
      return true;
    });
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();
    }
  }

  async saveOptimization(optimization: CostOptimization): Promise<void> {
    this.optimizations.set(optimization.id, optimization);
  }

  async getOptimizations(implemented?: boolean): Promise<CostOptimization[]> {
    return Array.from(this.optimizations.values()).filter((opt) => {
      if (implemented !== undefined && opt.implemented !== implemented) return false;
      return true;
    });
  }

  async saveReport(report: CostReport): Promise<void> {
    this.reports.set(report.id, report);
  }

  async getReport(id: string): Promise<CostReport | null> {
    return this.reports.get(id) || null;
  }

  async getReports(type?: CostReportType): Promise<CostReport[]> {
    return Array.from(this.reports.values()).filter((report) => {
      if (type && report.type !== type) return false;
      return true;
    });
  }
}

// =============================================================================
// LLM Cost Tracker
// =============================================================================

export class LLMCostTracker extends EventEmitter<LLMCostEvents> {
  private config: LLMCostTrackerConfig;
  private storage: LLMCostStorage;
  private alertCooldowns: Map<string, number> = new Map();
  private aggregationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private started: boolean = false;

  constructor(config: Partial<LLMCostTrackerConfig> = {}, storage?: LLMCostStorage) {
    super();
    this.config = LLMCostTrackerConfigSchema.parse(config);
    this.storage = storage || new InMemoryLLMCostStorage();
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  async start(): Promise<void> {
    if (this.started) return;

    if (this.config.aggregationEnabled) {
      this.startAggregationTimers();
    }

    if (this.config.optimizationScanEnabled) {
      this.scheduleOptimizationScan();
    }

    this.started = true;
  }

  async stop(): Promise<void> {
    for (const interval of this.aggregationIntervals.values()) {
      clearInterval(interval);
    }
    this.aggregationIntervals.clear();
    this.started = false;
  }

  // ===========================================================================
  // Request Tracking
  // ===========================================================================

  async trackRequest(input: {
    provider: LLMProvider;
    model: string;
    requestType?: "completion" | "chat" | "embedding" | "image" | "audio" | "function";
    streaming?: boolean;
    usage: TokenUsage;
    latencyMs?: number;
    timeToFirstTokenMs?: number;
    projectId?: string;
    userId?: string;
    sessionId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorCode?: string;
    errorMessage?: string;
  }): Promise<LLMRequest> {
    if (!this.config.enabled) {
      throw new Error("Cost tracking is disabled");
    }

    // Calculate cost
    const customPricing = this.config.customModelPricing?.[input.model];
    const costs = calculateRequestCost(input.model, input.usage, customPricing);

    const request: LLMRequest = {
      id: randomUUID(),
      timestamp: Date.now(),
      provider: input.provider,
      model: input.model,
      requestType: input.requestType || "chat",
      streaming: input.streaming || false,
      usage: {
        ...input.usage,
        totalTokens: input.usage.inputTokens + input.usage.outputTokens,
      },
      ...costs,
      latencyMs: input.latencyMs,
      timeToFirstTokenMs: input.timeToFirstTokenMs,
      projectId: input.projectId,
      userId: input.userId,
      sessionId: input.sessionId,
      tags: input.tags || [],
      metadata: input.metadata,
      success: input.success ?? true,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    };

    // Check budgets before saving
    const budgetCheck = await this.checkBudgets(request);
    if (budgetCheck.blocked) {
      this.emit("requestBlocked", request, budgetCheck.budget!);
      throw new Error(`Request blocked: Budget "${budgetCheck.budget!.name}" hard limit reached`);
    }

    // Save request
    await this.storage.saveRequest(request);

    // Update budget states
    await this.updateBudgetStates(request);

    this.emit("requestTracked", request);

    return request;
  }

  // ===========================================================================
  // Budget Management
  // ===========================================================================

  async createBudget(input: Omit<BudgetDefinition, "id" | "createdAt" | "updatedAt">): Promise<BudgetDefinition> {
    const budget: BudgetDefinition = {
      ...input,
      id: randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.saveBudget(budget);

    // Initialize budget state
    const { start, end } = getPeriodBounds(budget.period);
    const state: BudgetState = {
      budgetId: budget.id,
      periodStart: start,
      periodEnd: end,
      currentSpend: 0,
      remainingBudget: budget.budgetAmount,
      percentUsed: 0,
      status: "under_budget",
      rolloverAmount: 0,
      effectiveBudget: budget.budgetAmount,
      lastUpdated: Date.now(),
    };
    await this.storage.saveBudgetState(state);

    this.emit("budgetCreated", budget);
    return budget;
  }

  async updateBudget(
    id: string,
    updates: Partial<Omit<BudgetDefinition, "id" | "createdAt" | "updatedAt">>
  ): Promise<BudgetDefinition | null> {
    const budget = await this.storage.getBudget(id);
    if (!budget) return null;

    const updated: BudgetDefinition = {
      ...budget,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.storage.saveBudget(updated);
    this.emit("budgetUpdated", updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const budget = await this.storage.getBudget(id);
    if (!budget) return false;

    await this.storage.deleteBudget(id);
    this.emit("budgetDeleted", id);
    return true;
  }

  async getBudget(id: string): Promise<BudgetDefinition | null> {
    return this.storage.getBudget(id);
  }

  async listBudgets(): Promise<BudgetDefinition[]> {
    return this.storage.listBudgets();
  }

  async getBudgetState(budgetId: string): Promise<BudgetState | null> {
    return this.storage.getBudgetState(budgetId);
  }

  private async checkBudgets(request: Partial<LLMRequest>): Promise<{
    blocked: boolean;
    budget?: BudgetDefinition;
    state?: BudgetState;
  }> {
    const budgets = await this.storage.listBudgets();

    for (const budget of budgets) {
      if (!budget.enabled || !budget.blockOnHardLimit) continue;

      const matches = this.budgetMatchesRequest(budget, request);
      if (!matches) continue;

      const state = await this.storage.getBudgetState(budget.id);
      if (!state) continue;

      if (state.percentUsed >= budget.hardLimitPercent) {
        return { blocked: true, budget, state };
      }
    }

    return { blocked: false };
  }

  private budgetMatchesRequest(budget: BudgetDefinition, request: Partial<LLMRequest>): boolean {
    switch (budget.scope) {
      case "global":
        return true;
      case "provider":
        return request.provider === budget.scopeId;
      case "model":
        return request.model === budget.scopeId;
      case "project":
        return request.projectId === budget.scopeId;
      case "user":
        return request.userId === budget.scopeId;
      case "tag":
        return request.tags?.includes(budget.scopeId || "") || false;
      default:
        return false;
    }
  }

  private async updateBudgetStates(request: LLMRequest): Promise<void> {
    const budgets = await this.storage.listBudgets();

    for (const budget of budgets) {
      if (!budget.enabled) continue;

      const matches = this.budgetMatchesRequest(budget, request);
      if (!matches) continue;

      let state = await this.storage.getBudgetState(budget.id);

      // Check if period has rolled over
      const { start, end } = getPeriodBounds(budget.period);
      if (!state || state.periodEnd <= Date.now()) {
        // Calculate rollover
        const rollover = state && budget.rolloverEnabled
          ? Math.min(
              state.remainingBudget,
              budget.budgetAmount * (budget.maxRolloverPercent / 100)
            )
          : 0;

        state = {
          budgetId: budget.id,
          periodStart: start,
          periodEnd: end,
          currentSpend: 0,
          remainingBudget: budget.budgetAmount + rollover,
          percentUsed: 0,
          status: "under_budget",
          rolloverAmount: rollover,
          effectiveBudget: budget.budgetAmount + rollover,
          lastUpdated: Date.now(),
        };
      }

      // Update state with new request
      state.currentSpend += request.totalCost;
      state.remainingBudget = state.effectiveBudget - state.currentSpend;
      state.percentUsed = (state.currentSpend / state.effectiveBudget) * 100;
      state.lastUpdated = Date.now();

      // Update status and check alerts
      const prevStatus = state.status;
      state.status = this.calculateBudgetStatus(budget, state);

      await this.storage.saveBudgetState(state);

      // Emit alerts for status changes
      if (state.status !== prevStatus) {
        await this.handleBudgetStatusChange(budget, state, prevStatus);
      }
    }
  }

  private calculateBudgetStatus(budget: BudgetDefinition, state: BudgetState): BudgetStatus {
    if (state.percentUsed > 100) return "exceeded";
    if (state.percentUsed >= budget.hardLimitPercent) return "hard_limit";
    if (state.percentUsed >= budget.softLimitPercent) return "soft_limit";
    return "under_budget";
  }

  private async handleBudgetStatusChange(
    budget: BudgetDefinition,
    state: BudgetState,
    prevStatus: BudgetStatus
  ): Promise<void> {
    const cooldownKey = `${budget.id}-${state.status}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    const cooldownMs = this.config.alertCooldownMinutes * 60 * 1000;

    if (lastAlert && Date.now() - lastAlert < cooldownMs) {
      return;
    }

    let alertType: CostAlertType | null = null;
    let severity: "info" | "warning" | "critical" = "info";

    switch (state.status) {
      case "soft_limit":
        if (budget.alertOnSoftLimit && prevStatus === "under_budget") {
          alertType = "soft_limit_reached";
          severity = "warning";
          this.emit("softLimitReached", budget, state);
        }
        break;
      case "hard_limit":
        if (budget.alertOnHardLimit) {
          alertType = "hard_limit_reached";
          severity = "critical";
          this.emit("hardLimitReached", budget, state);
        }
        break;
      case "exceeded":
        alertType = "budget_exceeded";
        severity = "critical";
        this.emit("budgetExceeded", budget, state);
        break;
    }

    if (alertType) {
      const alert = await this.createAlert({
        type: alertType,
        severity,
        budgetId: budget.id,
        scope: budget.scope,
        scopeId: budget.scopeId,
        title: `Budget "${budget.name}" - ${state.status.replace("_", " ").toUpperCase()}`,
        message: `Current spend: ${formatCost(state.currentSpend)} (${state.percentUsed.toFixed(1)}% of ${formatCost(state.effectiveBudget)})`,
        currentSpend: state.currentSpend,
        threshold: state.effectiveBudget * (budget.hardLimitPercent / 100),
        percentUsed: state.percentUsed,
        recommendations: this.generateBudgetRecommendations(budget, state),
      });

      this.alertCooldowns.set(cooldownKey, Date.now());
    }
  }

  private generateBudgetRecommendations(budget: BudgetDefinition, state: BudgetState): string[] {
    const recommendations: string[] = [];

    if (state.percentUsed > 80) {
      recommendations.push("Consider switching to more cost-effective models for non-critical tasks");
      recommendations.push("Review recent usage patterns for optimization opportunities");
    }

    if (state.percentUsed > 95) {
      recommendations.push("Immediate action required to avoid service interruption");
      recommendations.push("Consider increasing budget or implementing request quotas");
    }

    return recommendations;
  }

  // ===========================================================================
  // Alerts
  // ===========================================================================

  async createAlert(input: Omit<CostAlert, "id" | "timestamp" | "acknowledged">): Promise<CostAlert> {
    const alert: CostAlert = {
      ...input,
      id: randomUUID(),
      timestamp: Date.now(),
      acknowledged: false,
    };

    await this.storage.saveAlert(alert);
    this.emit("alertCreated", alert);
    return alert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await this.storage.acknowledgeAlert(alertId, acknowledgedBy);
    const alerts = await this.storage.getAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      this.emit("alertAcknowledged", alert);
    }
  }

  async getAlerts(filters?: { acknowledged?: boolean; type?: CostAlertType }): Promise<CostAlert[]> {
    return this.storage.getAlerts(filters);
  }

  // ===========================================================================
  // Aggregation
  // ===========================================================================

  async aggregate(period: AggregationPeriod, startTime?: number, endTime?: number): Promise<CostAggregation> {
    const bounds = startTime
      ? { start: startTime, end: endTime || Date.now() }
      : this.getAggregationBounds(period);

    const requests = await this.storage.getRequests({
      startTime: bounds.start,
      endTime: bounds.end,
    });

    const aggregation: CostAggregation = {
      period,
      startTime: bounds.start,
      endTime: bounds.end,
      totalRequests: requests.length,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCachedTokens: 0,
      totalCost: 0,
      byProvider: {},
      byModel: {},
      byProject: {},
      byUser: {},
      avgCostPerRequest: 0,
      avgTokensPerRequest: 0,
      avgLatencyMs: 0,
      successRate: 0,
      errorCount: 0,
    };

    let totalLatency = 0;
    let latencyCount = 0;

    for (const req of requests) {
      // Totals
      aggregation.totalTokens += req.usage.totalTokens;
      aggregation.totalInputTokens += req.usage.inputTokens;
      aggregation.totalOutputTokens += req.usage.outputTokens;
      aggregation.totalCachedTokens += req.usage.cachedTokens;
      aggregation.totalCost += req.totalCost;

      // By provider
      if (!aggregation.byProvider[req.provider]) {
        aggregation.byProvider[req.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      aggregation.byProvider[req.provider].requests++;
      aggregation.byProvider[req.provider].tokens += req.usage.totalTokens;
      aggregation.byProvider[req.provider].cost += req.totalCost;

      // By model
      if (!aggregation.byModel[req.model]) {
        aggregation.byModel[req.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      aggregation.byModel[req.model].requests++;
      aggregation.byModel[req.model].tokens += req.usage.totalTokens;
      aggregation.byModel[req.model].cost += req.totalCost;

      // By project
      if (req.projectId) {
        if (!aggregation.byProject[req.projectId]) {
          aggregation.byProject[req.projectId] = { requests: 0, tokens: 0, cost: 0 };
        }
        aggregation.byProject[req.projectId].requests++;
        aggregation.byProject[req.projectId].tokens += req.usage.totalTokens;
        aggregation.byProject[req.projectId].cost += req.totalCost;
      }

      // By user
      if (req.userId) {
        if (!aggregation.byUser[req.userId]) {
          aggregation.byUser[req.userId] = { requests: 0, tokens: 0, cost: 0 };
        }
        aggregation.byUser[req.userId].requests++;
        aggregation.byUser[req.userId].tokens += req.usage.totalTokens;
        aggregation.byUser[req.userId].cost += req.totalCost;
      }

      // Latency
      if (req.latencyMs) {
        totalLatency += req.latencyMs;
        latencyCount++;
      }

      // Errors
      if (!req.success) {
        aggregation.errorCount++;
      }
    }

    // Calculate averages
    if (requests.length > 0) {
      aggregation.avgCostPerRequest = aggregation.totalCost / requests.length;
      aggregation.avgTokensPerRequest = aggregation.totalTokens / requests.length;
      aggregation.successRate = ((requests.length - aggregation.errorCount) / requests.length) * 100;
    }

    if (latencyCount > 0) {
      aggregation.avgLatencyMs = totalLatency / latencyCount;
    }

    await this.storage.saveAggregation(aggregation);
    return aggregation;
  }

  private getAggregationBounds(period: AggregationPeriod): { start: number; end: number } {
    const now = new Date();
    let start: Date;

    switch (period) {
      case "hour":
        start = new Date(now);
        start.setMinutes(0, 0, 0);
        return { start: start.getTime(), end: now.getTime() };
      case "day":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { start: start.getTime(), end: now.getTime() };
      case "week":
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        return { start: start.getTime(), end: now.getTime() };
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: start.getTime(), end: now.getTime() };
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: start.getTime(), end: now.getTime() };
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        return { start: start.getTime(), end: now.getTime() };
    }
  }

  private startAggregationTimers(): void {
    // Hourly aggregation
    const hourlyInterval = setInterval(async () => {
      try {
        await this.aggregate("hour");
      } catch (error) {
        this.emit("error", error as Error);
      }
    }, 60 * 60 * 1000);
    this.aggregationIntervals.set("hourly", hourlyInterval);

    // Daily aggregation
    const dailyInterval = setInterval(async () => {
      try {
        await this.aggregate("day");
        if (this.config.dailySummaryEnabled) {
          await this.generateDailySummary();
        }
      } catch (error) {
        this.emit("error", error as Error);
      }
    }, 24 * 60 * 60 * 1000);
    this.aggregationIntervals.set("daily", dailyInterval);
  }

  private async generateDailySummary(): Promise<void> {
    const report = await this.generateReport("summary", "day");
    await this.createAlert({
      type: "daily_summary",
      severity: "info",
      title: "Daily Cost Summary",
      message: `Total spend: ${formatCost(report.totalCost)} | Requests: ${report.totalRequests} | Tokens: ${formatTokenCount(report.totalTokens)}`,
      currentSpend: report.totalCost,
      recommendations: [],
    });
  }

  // ===========================================================================
  // Reports
  // ===========================================================================

  async generateReport(type: CostReportType, period: AggregationPeriod): Promise<CostReport> {
    const aggregation = await this.aggregate(period);

    // Get previous period for comparison
    const periodMs = aggregation.endTime - aggregation.startTime;
    const prevRequests = await this.storage.getRequests({
      startTime: aggregation.startTime - periodMs,
      endTime: aggregation.startTime,
    });
    const previousPeriodCost = prevRequests.reduce((sum, r) => sum + r.totalCost, 0);

    // Top consumers
    const topModels = Object.entries(aggregation.byModel)
      .map(([model, data]) => ({
        model,
        cost: data.cost,
        percent: aggregation.totalCost > 0 ? (data.cost / aggregation.totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const topProjects = Object.entries(aggregation.byProject)
      .map(([projectId, data]) => ({
        projectId,
        cost: data.cost,
        percent: aggregation.totalCost > 0 ? (data.cost / aggregation.totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const topUsers = Object.entries(aggregation.byUser)
      .map(([userId, data]) => ({
        userId,
        cost: data.cost,
        percent: aggregation.totalCost > 0 ? (data.cost / aggregation.totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Get optimizations
    const optimizations = await this.storage.getOptimizations(false);
    const potentialSavings = optimizations.reduce((sum, o) => sum + o.estimatedSavings, 0);

    // Get alerts
    const alerts = await this.storage.getAlerts();
    const periodAlerts = alerts.filter(
      (a) => a.timestamp >= aggregation.startTime && a.timestamp <= aggregation.endTime
    );

    const report: CostReport = {
      id: randomUUID(),
      type,
      generatedAt: Date.now(),
      period,
      startTime: aggregation.startTime,
      endTime: aggregation.endTime,
      totalCost: aggregation.totalCost,
      totalRequests: aggregation.totalRequests,
      totalTokens: aggregation.totalTokens,
      aggregation,
      previousPeriodCost,
      costChange: aggregation.totalCost - previousPeriodCost,
      costChangePercent: previousPeriodCost > 0
        ? ((aggregation.totalCost - previousPeriodCost) / previousPeriodCost) * 100
        : 0,
      topModels,
      topProjects,
      topUsers,
      optimizations,
      potentialSavings,
      alertCount: periodAlerts.length,
      budgetExceededCount: periodAlerts.filter((a) => a.type === "budget_exceeded").length,
    };

    await this.storage.saveReport(report);
    this.emit("reportGenerated", report);
    return report;
  }

  async getReport(id: string): Promise<CostReport | null> {
    return this.storage.getReport(id);
  }

  async getReports(type?: CostReportType): Promise<CostReport[]> {
    return this.storage.getReports(type);
  }

  // ===========================================================================
  // Cost Optimization
  // ===========================================================================

  async scanForOptimizations(): Promise<CostOptimization[]> {
    const optimizations: CostOptimization[] = [];
    const aggregation = await this.aggregate("month");

    // Check for model downgrade opportunities
    const premiumModels = ["gpt-4o", "gpt-4-turbo", "claude-3-opus-20240229", "claude-3-5-sonnet-20241022"];
    const economyAlternatives: Record<string, string> = {
      "gpt-4o": "gpt-4o-mini",
      "gpt-4-turbo": "gpt-4o-mini",
      "claude-3-opus-20240229": "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20241022": "claude-3-5-haiku-20241022",
    };

    for (const [model, data] of Object.entries(aggregation.byModel)) {
      if (premiumModels.includes(model) && data.cost > 10) {
        const alternative = economyAlternatives[model];
        if (alternative) {
          const altPricing = MODEL_PRICING[alternative];
          const currentPricing = MODEL_PRICING[model];

          if (altPricing && currentPricing) {
            const savingsRatio = 1 - (altPricing.inputPricePerMillion / currentPricing.inputPricePerMillion);
            const estimatedSavings = data.cost * savingsRatio * 0.5; // Assume 50% of requests could use cheaper model

            if (estimatedSavings > 1) {
              const optimization: CostOptimization = {
                id: randomUUID(),
                type: "model_downgrade",
                priority: estimatedSavings > 50 ? "high" : estimatedSavings > 10 ? "medium" : "low",
                timestamp: Date.now(),
                estimatedSavings,
                savingsPercent: savingsRatio * 50,
                effort: "minimal",
                title: `Consider using ${alternative} instead of ${model}`,
                description: `${data.requests} requests used ${model}. For simpler tasks, ${alternative} can provide similar quality at lower cost.`,
                currentState: `Using ${model} for all requests (${formatCost(data.cost)}/month)`,
                recommendedAction: `Route simple requests to ${alternative}`,
                affectedModels: [model],
                implemented: false,
              };

              optimizations.push(optimization);
              await this.storage.saveOptimization(optimization);
              this.emit("optimizationFound", optimization);
            }
          }
        }
      }
    }

    // Check for caching opportunities (high token usage with similar patterns)
    if (aggregation.totalCachedTokens / aggregation.totalInputTokens < 0.1) {
      const cachingSavings = aggregation.totalCost * 0.2; // Estimate 20% savings with caching

      if (cachingSavings > 5) {
        const optimization: CostOptimization = {
          id: randomUUID(),
          type: "caching_opportunity",
          priority: cachingSavings > 50 ? "high" : "medium",
          timestamp: Date.now(),
          estimatedSavings: cachingSavings,
          savingsPercent: 20,
          effort: "moderate",
          title: "Enable prompt caching for repeated context",
          description: `Only ${((aggregation.totalCachedTokens / aggregation.totalInputTokens) * 100).toFixed(1)}% of input tokens are cached. Caching can reduce costs significantly.`,
          currentState: `Cache hit rate: ${((aggregation.totalCachedTokens / aggregation.totalInputTokens) * 100).toFixed(1)}%`,
          recommendedAction: "Implement prompt caching for system prompts and repeated context",
          affectedModels: Object.keys(aggregation.byModel),
          implemented: false,
        };

        optimizations.push(optimization);
        await this.storage.saveOptimization(optimization);
        this.emit("optimizationFound", optimization);
      }
    }

    return optimizations;
  }

  private scheduleOptimizationScan(): void {
    const interval = setInterval(async () => {
      try {
        await this.scanForOptimizations();
      } catch (error) {
        this.emit("error", error as Error);
      }
    }, this.config.optimizationScanIntervalHours * 60 * 60 * 1000);

    this.aggregationIntervals.set("optimization", interval);
  }

  async getOptimizations(implemented?: boolean): Promise<CostOptimization[]> {
    return this.storage.getOptimizations(implemented);
  }

  async markOptimizationImplemented(id: string, actualSavings?: number): Promise<void> {
    const optimizations = await this.storage.getOptimizations();
    const optimization = optimizations.find((o) => o.id === id);

    if (optimization) {
      optimization.implemented = true;
      optimization.implementedAt = Date.now();
      optimization.actualSavings = actualSavings;
      await this.storage.saveOptimization(optimization);
    }
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  async getRequests(filters: {
    startTime?: number;
    endTime?: number;
    provider?: LLMProvider;
    model?: string;
    projectId?: string;
    userId?: string;
  }): Promise<LLMRequest[]> {
    return this.storage.getRequests(filters);
  }

  async getTotalCost(startTime?: number, endTime?: number): Promise<number> {
    const requests = await this.storage.getRequests({
      startTime: startTime || 0,
      endTime: endTime || Date.now(),
    });
    return requests.reduce((sum, r) => sum + r.totalCost, 0);
  }

  async getCostByModel(startTime?: number, endTime?: number): Promise<Record<string, number>> {
    const requests = await this.storage.getRequests({
      startTime: startTime || 0,
      endTime: endTime || Date.now(),
    });

    const byModel: Record<string, number> = {};
    for (const req of requests) {
      byModel[req.model] = (byModel[req.model] || 0) + req.totalCost;
    }
    return byModel;
  }

  async getCostByProvider(startTime?: number, endTime?: number): Promise<Record<string, number>> {
    const requests = await this.storage.getRequests({
      startTime: startTime || 0,
      endTime: endTime || Date.now(),
    });

    const byProvider: Record<string, number> = {};
    for (const req of requests) {
      byProvider[req.provider] = (byProvider[req.provider] || 0) + req.totalCost;
    }
    return byProvider;
  }

  // ===========================================================================
  // Utility
  // ===========================================================================

  getModelPricing(model: string): typeof MODEL_PRICING[string] | undefined {
    return MODEL_PRICING[model];
  }

  estimateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): { inputCost: number; outputCost: number; totalCost: number } {
    const pricing = this.config.customModelPricing?.[model] || MODEL_PRICING[model];

    if (!pricing) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }
}

// =============================================================================
// Singleton & Factory
// =============================================================================

let defaultTracker: LLMCostTracker | null = null;

export function getLLMCostTracker(): LLMCostTracker {
  if (!defaultTracker) {
    defaultTracker = new LLMCostTracker();
  }
  return defaultTracker;
}

export function createLLMCostTracker(
  config?: Partial<LLMCostTrackerConfig>,
  storage?: LLMCostStorage
): LLMCostTracker {
  return new LLMCostTracker(config, storage);
}
