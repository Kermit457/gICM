/**
 * Budget Manager - Cost tracking, limits, and alerts
 */

import { EventEmitter } from "eventemitter3";
import { v4 as uuidv4 } from "uuid";
import {
  Budget,
  CreateBudget,
  BudgetSchema,
  CreateBudgetSchema,
  Alert,
  AlertSchema,
  SpendingRecord,
  SpendingRecordSchema,
  BudgetSummary,
  BudgetEvents,
  BudgetPeriod,
  AlertSeverity,
  ThresholdConfig,
  DEFAULT_THRESHOLDS,
  PERIOD_DAYS,
} from "./types.js";

export interface BudgetManagerConfig {
  checkIntervalMs?: number;
  enableAutoPause?: boolean;
  enableAlerts?: boolean;
  alertCooldownMs?: number; // Prevent alert spam
}

const DEFAULT_CONFIG: Required<BudgetManagerConfig> = {
  checkIntervalMs: 60000, // Check budgets every minute
  enableAutoPause: true,
  enableAlerts: true,
  alertCooldownMs: 300000, // 5 min cooldown between same alerts
};

export class BudgetManager extends EventEmitter<BudgetEvents> {
  private config: Required<BudgetManagerConfig>;
  private budgets: Map<string, Budget> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private spendingRecords: Map<string, SpendingRecord[]> = new Map();
  private alertCooldowns: Map<string, number> = new Map(); // budgetId -> lastAlertTime
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: BudgetManagerConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Start periodic budget checks
  start(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkAllBudgets();
    }, this.config.checkIntervalMs);

    console.log("[BudgetManager] Started periodic budget monitoring");
  }

  // Stop monitoring
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log("[BudgetManager] Stopped budget monitoring");
  }

  // Create a new budget
  async createBudget(input: CreateBudget): Promise<Budget> {
    const validated = CreateBudgetSchema.parse(input);

    const now = new Date();
    const { periodStart, periodEnd } = this.calculatePeriodBounds(validated.period, now);

    const budget: Budget = BudgetSchema.parse({
      ...validated,
      id: uuidv4(),
      currentSpend: 0,
      periodStart,
      periodEnd,
      status: "active",
      thresholds: validated.thresholds || DEFAULT_THRESHOLDS,
      createdAt: now,
      updatedAt: now,
    });

    this.budgets.set(budget.id, budget);
    this.spendingRecords.set(budget.id, []);

    this.emit("budget:created", budget);
    console.log(`[BudgetManager] Created budget: ${budget.name} ($${budget.limitAmount}/${budget.period})`);

    return budget;
  }

  // Get budget by ID
  getBudget(id: string): Budget | undefined {
    return this.budgets.get(id);
  }

  // Get all budgets
  getAllBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  // Get active budgets
  getActiveBudgets(): Budget[] {
    return this.getAllBudgets().filter((b) => b.status === "active");
  }

  // Update budget
  async updateBudget(id: string, updates: Partial<CreateBudget>): Promise<Budget | null> {
    const budget = this.budgets.get(id);
    if (!budget) return null;

    const updated: Budget = {
      ...budget,
      ...updates,
      updatedAt: new Date(),
    };

    this.budgets.set(id, updated);
    this.emit("budget:updated", updated);

    return updated;
  }

  // Delete budget
  async deleteBudget(id: string): Promise<boolean> {
    const deleted = this.budgets.delete(id);
    if (deleted) {
      this.spendingRecords.delete(id);
      this.emit("budget:deleted", id);
    }
    return deleted;
  }

  // Record spending against a budget
  async recordSpending(
    budgetId: string,
    amount: number,
    source: SpendingRecord["source"],
    details?: Partial<Omit<SpendingRecord, "id" | "budgetId" | "amount" | "source" | "timestamp">>
  ): Promise<{ record: SpendingRecord; alert?: Alert }> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    // Create spending record
    const record: SpendingRecord = SpendingRecordSchema.parse({
      id: uuidv4(),
      budgetId,
      amount,
      source,
      ...details,
      timestamp: new Date(),
    });

    // Store record
    const records = this.spendingRecords.get(budgetId) || [];
    records.push(record);
    this.spendingRecords.set(budgetId, records);

    // Update budget current spend
    budget.currentSpend += amount;
    budget.updatedAt = new Date();
    this.budgets.set(budgetId, budget);

    this.emit("spending:recorded", record);

    // Check thresholds
    const alert = await this.checkBudgetThresholds(budget);

    return { record, alert };
  }

  // Check a single budget against thresholds
  private async checkBudgetThresholds(budget: Budget): Promise<Alert | undefined> {
    if (budget.status !== "active") return;

    const percentageUsed = (budget.currentSpend / budget.limitAmount) * 100;
    const sortedThresholds = [...budget.thresholds].sort((a, b) => b.percentage - a.percentage);

    for (const threshold of sortedThresholds) {
      if (percentageUsed >= threshold.percentage) {
        // Check cooldown
        const cooldownKey = `${budget.id}:${threshold.percentage}`;
        const lastAlert = this.alertCooldowns.get(cooldownKey);
        if (lastAlert && Date.now() - lastAlert < this.config.alertCooldownMs) {
          continue; // Skip, recently alerted
        }

        // Create alert
        const alert = await this.createAlert(budget, threshold, percentageUsed);
        this.alertCooldowns.set(cooldownKey, Date.now());

        // Take action based on threshold config
        if (threshold.action === "pause_pipelines" && this.config.enableAutoPause) {
          await this.pausePipelinesForBudget(budget);
        }

        return alert;
      }
    }
  }

  // Create an alert
  private async createAlert(
    budget: Budget,
    threshold: ThresholdConfig,
    percentageUsed: number
  ): Promise<Alert> {
    const isExceeded = percentageUsed >= 100;

    const alert: Alert = AlertSchema.parse({
      id: uuidv4(),
      budgetId: budget.id,
      type: isExceeded ? "threshold_exceeded" : "threshold_warning",
      severity: threshold.severity,
      title: isExceeded
        ? `Budget "${budget.name}" exceeded!`
        : `Budget "${budget.name}" at ${Math.round(percentageUsed)}%`,
      message: isExceeded
        ? `Spending of $${budget.currentSpend.toFixed(2)} has exceeded the ${budget.period} budget limit of $${budget.limitAmount.toFixed(2)}.`
        : `Spending has reached ${Math.round(percentageUsed)}% of the ${budget.period} budget ($${budget.currentSpend.toFixed(2)} / $${budget.limitAmount.toFixed(2)}).`,
      currentSpend: budget.currentSpend,
      budgetLimit: budget.limitAmount,
      percentageUsed,
      acknowledged: false,
      actionsTaken: [],
      createdAt: new Date(),
    });

    this.alerts.set(alert.id, alert);
    this.emit("alert:created", alert);

    if (isExceeded) {
      budget.status = "exceeded";
      this.budgets.set(budget.id, budget);
      this.emit("budget:exceeded", budget, alert);
    } else {
      this.emit("budget:threshold", budget, alert);
    }

    console.log(`[BudgetManager] Alert: ${alert.title}`);
    return alert;
  }

  // Pause pipelines when budget exceeded
  private async pausePipelinesForBudget(budget: Budget): Promise<void> {
    if (!budget.autoPausePipelines) return;

    // Get pipeline IDs based on scope
    const pipelineIds: string[] = [];

    if (budget.scope.type === "pipeline" && budget.scope.targetId) {
      pipelineIds.push(budget.scope.targetId);
    }
    // For global/user/team scopes, would need to query pipeline registry
    // This is a placeholder - actual implementation would integrate with ScheduleManager

    if (pipelineIds.length > 0) {
      this.emit("pipelines:paused", budget.id, pipelineIds);
      console.log(`[BudgetManager] Paused ${pipelineIds.length} pipelines for budget ${budget.name}`);
    }
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.alerts.set(alertId, alert);
    this.emit("alert:acknowledged", alert);

    return alert;
  }

  // Get alerts for a budget
  getAlertsForBudget(budgetId: string, unacknowledgedOnly = false): Alert[] {
    return Array.from(this.alerts.values())
      .filter((a) => a.budgetId === budgetId)
      .filter((a) => !unacknowledgedOnly || !a.acknowledged)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get all unacknowledged alerts
  getUnacknowledgedAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter((a) => !a.acknowledged)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get budget summary with analytics
  getBudgetSummary(budgetId: string): BudgetSummary | null {
    const budget = this.budgets.get(budgetId);
    if (!budget) return null;

    const records = this.spendingRecords.get(budgetId) || [];
    const alerts = this.getAlertsForBudget(budgetId);

    const percentageUsed = (budget.currentSpend / budget.limitAmount) * 100;
    const remainingAmount = Math.max(0, budget.limitAmount - budget.currentSpend);

    // Calculate days in period and average daily spend
    const periodDays = PERIOD_DAYS[budget.period];
    const daysPassed = Math.max(
      1,
      Math.ceil((Date.now() - budget.periodStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysRemaining = Math.max(0, periodDays - daysPassed);
    const averageDailySpend = budget.currentSpend / daysPassed;

    // Project end of period spend
    const projectedEndOfPeriod = averageDailySpend * periodDays;

    // Aggregate by pipeline
    const pipelineSpends = new Map<string, { name: string; total: number }>();
    for (const record of records) {
      if (record.pipelineId) {
        const existing = pipelineSpends.get(record.pipelineId) || {
          name: record.pipelineId,
          total: 0,
        };
        existing.total += record.amount;
        pipelineSpends.set(record.pipelineId, existing);
      }
    }

    const topPipelines = Array.from(pipelineSpends.entries())
      .map(([id, data]) => ({
        pipelineId: id,
        name: data.name,
        totalSpend: data.total,
        percentage: (data.total / budget.currentSpend) * 100,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: BudgetSummary["recommendations"] = [];

    if (projectedEndOfPeriod > budget.limitAmount * 1.2) {
      recommendations.push({
        type: "reduce_usage",
        message: `At current rate, you'll exceed budget by ${Math.round(((projectedEndOfPeriod / budget.limitAmount) - 1) * 100)}%`,
        potentialSavings: projectedEndOfPeriod - budget.limitAmount,
      });
    }

    if (topPipelines.length > 0 && topPipelines[0].percentage > 50) {
      recommendations.push({
        type: "review_pipeline",
        message: `Pipeline "${topPipelines[0].name}" accounts for ${Math.round(topPipelines[0].percentage)}% of spending`,
      });
    }

    return {
      budget,
      percentageUsed,
      remainingAmount,
      averageDailySpend,
      projectedEndOfPeriod,
      daysRemaining,
      trend: averageDailySpend > budget.limitAmount / periodDays ? "increasing" : "stable",
      comparedToLastPeriod: 0, // Would need historical data
      topPipelines,
      recentAlerts: alerts.slice(0, 5),
      recommendations,
    };
  }

  // Check all budgets (called periodically)
  private async checkAllBudgets(): Promise<void> {
    const now = new Date();

    for (const budget of this.budgets.values()) {
      // Reset budget if period ended
      if (now > budget.periodEnd) {
        await this.resetBudgetPeriod(budget);
      }

      // Check thresholds
      if (budget.status === "active") {
        await this.checkBudgetThresholds(budget);
      }
    }
  }

  // Reset budget for new period
  private async resetBudgetPeriod(budget: Budget): Promise<void> {
    const now = new Date();
    const { periodStart, periodEnd } = this.calculatePeriodBounds(budget.period, now);

    const rollover = budget.rolloverUnused
      ? Math.max(0, budget.limitAmount - budget.currentSpend)
      : 0;

    budget.currentSpend = 0;
    budget.periodStart = periodStart;
    budget.periodEnd = periodEnd;
    budget.status = "active";
    budget.updatedAt = now;

    if (rollover > 0) {
      budget.limitAmount += rollover;
      console.log(`[BudgetManager] Rolled over $${rollover.toFixed(2)} to new period`);
    }

    // Clear period records
    this.spendingRecords.set(budget.id, []);
    this.alertCooldowns.clear();

    this.budgets.set(budget.id, budget);
    this.emit("budget:updated", budget);

    console.log(`[BudgetManager] Reset budget "${budget.name}" for new ${budget.period} period`);
  }

  // Calculate period start/end dates
  private calculatePeriodBounds(
    period: BudgetPeriod,
    referenceDate: Date
  ): { periodStart: Date; periodEnd: Date } {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    switch (period) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        start.setDate(start.getDate() - start.getDay()); // Sunday
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "quarterly":
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth((quarter + 1) * 3, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "yearly":
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { periodStart: start, periodEnd: end };
  }

  // Find applicable budget for a pipeline execution
  findBudgetForPipeline(pipelineId: string, tags?: string[]): Budget | undefined {
    // Priority: specific pipeline > tag match > global
    const budgets = this.getActiveBudgets();

    // Check for specific pipeline budget
    const pipelineBudget = budgets.find(
      (b) => b.scope.type === "pipeline" && b.scope.targetId === pipelineId
    );
    if (pipelineBudget) return pipelineBudget;

    // Check for tag match
    if (tags?.length) {
      const tagBudget = budgets.find(
        (b) => b.scope.type === "tag" && b.scope.tags?.some((t) => tags.includes(t))
      );
      if (tagBudget) return tagBudget;
    }

    // Fall back to global
    return budgets.find((b) => b.scope.type === "global");
  }
}

// Singleton instance
let budgetManager: BudgetManager | null = null;

export function getBudgetManager(config?: BudgetManagerConfig): BudgetManager {
  if (!budgetManager) {
    budgetManager = new BudgetManager(config);
  }
  return budgetManager;
}

export function createBudgetManager(config?: BudgetManagerConfig): BudgetManager {
  return new BudgetManager(config);
}
