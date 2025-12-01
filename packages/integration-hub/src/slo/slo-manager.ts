/**
 * SLO Manager Implementation
 * Phase 14D: Service Level Objectives
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  SLODefinition,
  SLODefinitionSchema,
  SLIConfig,
  SLIMeasurement,
  SLOState,
  SLOStatus,
  ErrorBudget,
  BurnRateAlert,
  SLOAlert,
  SLOAlertType,
  SLOReport,
  SLOReportPeriod,
  SLOSummary,
  SLOHistoryEntry,
  SLOManagerConfig,
  SLOManagerConfigSchema,
  SLOEvents,
  SLOStorage,
  SLIMetricProvider,
  SLIMetricSource,
} from "./types.js";

// =============================================================================
// In-Memory Storage
// =============================================================================

class InMemorySLOStorage implements SLOStorage {
  private slos = new Map<string, SLODefinition>();
  private states = new Map<string, SLOState>();
  private history = new Map<string, SLOHistoryEntry[]>();
  private alerts = new Map<string, SLOAlert>();
  private burnRateAlerts = new Map<string, BurnRateAlert[]>();

  async getSLO(id: string): Promise<SLODefinition | null> {
    return this.slos.get(id) ?? null;
  }

  async saveSLO(slo: SLODefinition): Promise<void> {
    this.slos.set(slo.id, slo);
  }

  async deleteSLO(id: string): Promise<void> {
    this.slos.delete(id);
    this.states.delete(id);
    this.history.delete(id);
  }

  async listSLOs(filters?: { service?: string; team?: string; enabled?: boolean }): Promise<SLODefinition[]> {
    let results = Array.from(this.slos.values());
    if (filters) {
      if (filters.service !== undefined) {
        results = results.filter(s => s.service === filters.service);
      }
      if (filters.team !== undefined) {
        results = results.filter(s => s.team === filters.team);
      }
      if (filters.enabled !== undefined) {
        results = results.filter(s => s.enabled === filters.enabled);
      }
    }
    return results;
  }

  async getState(sloId: string): Promise<SLOState | null> {
    return this.states.get(sloId) ?? null;
  }

  async saveState(state: SLOState): Promise<void> {
    this.states.set(state.sloId, state);
  }

  async addHistoryEntry(entry: SLOHistoryEntry): Promise<void> {
    const entries = this.history.get(entry.sloId) ?? [];
    entries.push(entry);
    this.history.set(entry.sloId, entries);
  }

  async getHistory(sloId: string, startTime: number, endTime: number): Promise<SLOHistoryEntry[]> {
    const entries = this.history.get(sloId) ?? [];
    return entries.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  async pruneHistory(olderThan: number): Promise<number> {
    let pruned = 0;
    for (const [sloId, entries] of this.history) {
      const filtered = entries.filter(e => e.timestamp >= olderThan);
      pruned += entries.length - filtered.length;
      this.history.set(sloId, filtered);
    }
    return pruned;
  }

  async saveAlert(alert: SLOAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async getAlert(id: string): Promise<SLOAlert | null> {
    return this.alerts.get(id) ?? null;
  }

  async listAlerts(filters?: { sloId?: string; resolved?: boolean; severity?: string }): Promise<SLOAlert[]> {
    let results = Array.from(this.alerts.values());
    if (filters) {
      if (filters.sloId !== undefined) {
        results = results.filter(a => a.sloId === filters.sloId);
      }
      if (filters.resolved !== undefined) {
        results = results.filter(a => a.resolved === filters.resolved);
      }
      if (filters.severity !== undefined) {
        results = results.filter(a => a.severity === filters.severity);
      }
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateAlert(id: string, updates: Partial<SLOAlert>): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      this.alerts.set(id, { ...alert, ...updates });
    }
  }

  async saveBurnRateAlert(alert: BurnRateAlert): Promise<void> {
    const alerts = this.burnRateAlerts.get(alert.sloId) ?? [];
    const idx = alerts.findIndex(a => a.id === alert.id);
    if (idx >= 0) {
      alerts[idx] = alert;
    } else {
      alerts.push(alert);
    }
    this.burnRateAlerts.set(alert.sloId, alerts);
  }

  async getBurnRateAlerts(sloId: string): Promise<BurnRateAlert[]> {
    return this.burnRateAlerts.get(sloId) ?? [];
  }

  async deleteBurnRateAlert(id: string): Promise<void> {
    for (const [sloId, alerts] of this.burnRateAlerts) {
      const filtered = alerts.filter(a => a.id !== id);
      if (filtered.length !== alerts.length) {
        this.burnRateAlerts.set(sloId, filtered);
        break;
      }
    }
  }
}

// =============================================================================
// Custom Metric Provider (for testing/mocking)
// =============================================================================

class CustomMetricProvider implements SLIMetricProvider {
  readonly source: SLIMetricSource = "custom";
  private handlers = new Map<string, (start: number, end: number) => Promise<number>>();

  registerQuery(query: string, handler: (start: number, end: number) => Promise<number>): void {
    this.handlers.set(query, handler);
  }

  async query(query: string, startTime: number, endTime: number): Promise<number> {
    const handler = this.handlers.get(query);
    if (handler) {
      return handler(startTime, endTime);
    }
    // Return mock data for testing
    return Math.random() * 100;
  }

  async queryRange(
    query: string,
    startTime: number,
    endTime: number,
    step: number
  ): Promise<Array<{ timestamp: number; value: number }>> {
    const results: Array<{ timestamp: number; value: number }> = [];
    for (let ts = startTime; ts <= endTime; ts += step) {
      results.push({
        timestamp: ts,
        value: await this.query(query, ts - step, ts),
      });
    }
    return results;
  }
}

// =============================================================================
// SLO Manager
// =============================================================================

export class SLOManager extends EventEmitter<SLOEvents> {
  private config: SLOManagerConfig;
  private storage: SLOStorage;
  private metricProviders = new Map<SLIMetricSource, SLIMetricProvider>();
  private measurementIntervals = new Map<string, NodeJS.Timeout>();
  private running = false;

  constructor(config: Partial<SLOManagerConfig> = {}) {
    super();
    this.config = SLOManagerConfigSchema.parse(config);
    this.storage = new InMemorySLOStorage();

    // Register default custom provider
    const customProvider = new CustomMetricProvider();
    this.metricProviders.set("custom", customProvider);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  setStorage(storage: SLOStorage): void {
    this.storage = storage;
  }

  registerMetricProvider(provider: SLIMetricProvider): void {
    this.metricProviders.set(provider.source, provider);
  }

  getMetricProvider(source: SLIMetricSource): SLIMetricProvider | undefined {
    return this.metricProviders.get(source);
  }

  // ---------------------------------------------------------------------------
  // SLO CRUD
  // ---------------------------------------------------------------------------

  async createSLO(input: Omit<SLODefinition, "id" | "createdAt" | "updatedAt">): Promise<SLODefinition> {
    const now = Date.now();
    const slo = SLODefinitionSchema.parse({
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    await this.storage.saveSLO(slo);

    // Initialize state
    const initialState = await this.initializeState(slo);
    await this.storage.saveState(initialState);

    // Start measurement if running
    if (this.running && slo.enabled) {
      this.startMeasurement(slo);
    }

    this.emit("sloCreated", slo);
    return slo;
  }

  async getSLO(id: string): Promise<SLODefinition | null> {
    return this.storage.getSLO(id);
  }

  async updateSLO(id: string, updates: Partial<SLODefinition>): Promise<SLODefinition | null> {
    const existing = await this.storage.getSLO(id);
    if (!existing) return null;

    const updated = SLODefinitionSchema.parse({
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    });

    await this.storage.saveSLO(updated);

    // Restart measurement if enabled changed
    if (existing.enabled !== updated.enabled) {
      if (updated.enabled && this.running) {
        this.startMeasurement(updated);
      } else {
        this.stopMeasurement(id);
      }
    }

    this.emit("sloUpdated", updated);
    return updated;
  }

  async deleteSLO(id: string): Promise<boolean> {
    const existing = await this.storage.getSLO(id);
    if (!existing) return false;

    this.stopMeasurement(id);
    await this.storage.deleteSLO(id);
    this.emit("sloDeleted", id);
    return true;
  }

  async listSLOs(filters?: { service?: string; team?: string; enabled?: boolean }): Promise<SLODefinition[]> {
    return this.storage.listSLOs(filters);
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  async getState(sloId: string): Promise<SLOState | null> {
    return this.storage.getState(sloId);
  }

  private async initializeState(slo: SLODefinition): Promise<SLOState> {
    const now = Date.now();
    const windowStart = now - slo.window.duration * 1000;

    return {
      sloId: slo.id,
      status: "unknown",
      currentValue: 0,
      targetValue: slo.target.value,
      errorBudget: {
        sloId: slo.id,
        windowStart,
        windowEnd: now,
        total: 100 - slo.target.value,
        consumed: 0,
        remaining: 100 - slo.target.value,
        remainingPercent: 100,
        burnRate: 0,
        burnRateTrend: "stable",
      },
      windowStart,
      windowEnd: now,
      totalGood: 0,
      totalEvents: 0,
      lastMeasurement: now,
      measurementCount: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Measurement
  // ---------------------------------------------------------------------------

  async measure(sloId: string): Promise<SLIMeasurement | null> {
    const slo = await this.storage.getSLO(sloId);
    if (!slo || !slo.enabled) return null;

    const provider = this.metricProviders.get(slo.sli.source);
    if (!provider) {
      this.emit("error", new Error(`No metric provider for source: ${slo.sli.source}`));
      return null;
    }

    const now = Date.now();
    const windowStart = now - slo.window.duration * 1000;

    try {
      let good: number;
      let total: number;

      if (slo.sli.metric.ratio) {
        // Direct ratio query
        const ratio = await provider.query(slo.sli.metric.ratio, windowStart, now);
        good = ratio;
        total = 100;
      } else {
        // Good/total queries
        [good, total] = await Promise.all([
          provider.query(slo.sli.metric.good, windowStart, now),
          provider.query(slo.sli.metric.total, windowStart, now),
        ]);
      }

      const value = total > 0 ? (good / total) * 100 : 0;

      const measurement: SLIMeasurement = {
        timestamp: now,
        good,
        total,
        value,
      };

      // Update state
      await this.updateState(slo, measurement);
      this.emit("measured", sloId, measurement);

      return measurement;
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  private async updateState(slo: SLODefinition, measurement: SLIMeasurement): Promise<void> {
    const currentState = await this.storage.getState(slo.id);
    const now = Date.now();
    const windowStart = now - slo.window.duration * 1000;

    // Calculate new totals
    const totalGood = (currentState?.totalGood ?? 0) + measurement.good;
    const totalEvents = (currentState?.totalEvents ?? 0) + measurement.total;
    const currentValue = totalEvents > 0 ? (totalGood / totalEvents) * 100 : 0;

    // Calculate error budget
    const errorBudget = this.calculateErrorBudget(slo, currentValue, windowStart, now);

    // Determine status
    const status = this.calculateStatus(slo, errorBudget);
    const previousStatus = currentState?.status ?? "unknown";

    const newState: SLOState = {
      sloId: slo.id,
      status,
      currentValue,
      targetValue: slo.target.value,
      errorBudget,
      windowStart,
      windowEnd: now,
      totalGood,
      totalEvents,
      lastMeasurement: now,
      measurementCount: (currentState?.measurementCount ?? 0) + 1,
    };

    await this.storage.saveState(newState);

    // Add history entry
    const historyEntry: SLOHistoryEntry = {
      timestamp: now,
      sloId: slo.id,
      value: currentValue,
      target: slo.target.value,
      status,
      errorBudgetRemaining: errorBudget.remainingPercent,
      burnRate: errorBudget.burnRate,
    };
    await this.storage.addHistoryEntry(historyEntry);

    // Emit state change if status changed
    if (status !== previousStatus) {
      this.emit("stateChanged", slo.id, newState, previousStatus);
    }

    // Check alerts
    await this.checkAlerts(slo, newState, previousStatus);
  }

  private calculateErrorBudget(
    slo: SLODefinition,
    currentValue: number,
    windowStart: number,
    windowEnd: number
  ): ErrorBudget {
    const totalBudget = 100 - slo.target.value; // e.g., 99.9% target = 0.1% budget
    const consumed = Math.max(0, slo.target.value - currentValue);
    const remaining = Math.max(0, totalBudget - consumed);
    const remainingPercent = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;

    // Calculate burn rate (how fast we're consuming budget)
    // 1 = normal rate, 2 = 2x normal rate, etc.
    const windowDuration = windowEnd - windowStart;
    const expectedConsumed = totalBudget * (windowDuration / (slo.window.duration * 1000));
    const burnRate = expectedConsumed > 0 ? consumed / expectedConsumed : 0;

    // Project exhaustion
    let projectedExhaustion: number | undefined;
    let daysRemaining: number | undefined;

    if (burnRate > 1 && remaining > 0) {
      const remainingMs = (remaining / consumed) * windowDuration;
      projectedExhaustion = windowEnd + remainingMs;
      daysRemaining = remainingMs / (24 * 60 * 60 * 1000);
    }

    return {
      sloId: slo.id,
      windowStart,
      windowEnd,
      total: totalBudget,
      consumed,
      remaining,
      remainingPercent,
      burnRate,
      burnRateTrend: burnRate > 1.5 ? "increasing" : burnRate < 0.5 ? "decreasing" : "stable",
      projectedExhaustion,
      daysRemaining,
    };
  }

  private calculateStatus(slo: SLODefinition, errorBudget: ErrorBudget): SLOStatus {
    const thresholds = slo.alertThresholds ?? { warning: 50, critical: 20 };

    if (errorBudget.remainingPercent <= 0) {
      return "breached";
    }
    if (errorBudget.remainingPercent < thresholds.critical) {
      return "critical";
    }
    if (errorBudget.remainingPercent < thresholds.warning) {
      return "warning";
    }
    return "healthy";
  }

  // ---------------------------------------------------------------------------
  // Alerting
  // ---------------------------------------------------------------------------

  private async checkAlerts(slo: SLODefinition, state: SLOState, previousStatus: SLOStatus): Promise<void> {
    if (!this.config.alerting?.enabled) return;

    const thresholds = slo.alertThresholds ?? {
      warning: this.config.alerting.defaultWarningThreshold,
      critical: this.config.alerting.defaultCriticalThreshold,
    };

    // Status-based alerts
    if (state.status !== previousStatus) {
      if (state.status === "warning" && previousStatus === "healthy") {
        await this.createAlert(slo, state, "budget_warning", "warning");
        this.emit("budgetWarning", slo.id, state.errorBudget.remainingPercent);
      }

      if (state.status === "critical") {
        await this.createAlert(slo, state, "budget_critical", "critical");
        this.emit("budgetCritical", slo.id, state.errorBudget.remainingPercent);
      }

      if (state.status === "breached") {
        await this.createAlert(slo, state, "budget_exhausted", "critical");
        this.emit("budgetExhausted", slo.id);
      }

      if (state.status === "healthy" && previousStatus !== "unknown") {
        await this.createAlert(slo, state, "slo_recovered", "info");
      }
    }

    // Burn rate alerts
    if (this.config.alerting.burnRateAlerts) {
      await this.checkBurnRateAlerts(slo, state);
    }
  }

  private async checkBurnRateAlerts(slo: SLODefinition, state: SLOState): Promise<void> {
    const burnRateAlerts = await this.storage.getBurnRateAlerts(slo.id);

    for (const alert of burnRateAlerts) {
      if (!alert.enabled) continue;

      // Check both windows
      const shortWindowMet = state.errorBudget.burnRate >= alert.shortWindow.burnRateThreshold;
      const longWindowMet = state.errorBudget.burnRate >= alert.longWindow.burnRateThreshold;

      if (shortWindowMet && longWindowMet) {
        await this.createAlert(
          slo,
          state,
          "burn_rate_high",
          alert.severity === "page" ? "critical" : "warning"
        );
        this.emit("burnRateHigh", slo.id, state.errorBudget.burnRate, alert.name);
      }
    }
  }

  private async createAlert(
    slo: SLODefinition,
    state: SLOState,
    type: SLOAlertType,
    severity: "info" | "warning" | "critical"
  ): Promise<SLOAlert> {
    const messages: Record<SLOAlertType, string> = {
      budget_warning: `Error budget for ${slo.name} is running low (${state.errorBudget.remainingPercent.toFixed(1)}% remaining)`,
      budget_critical: `Error budget for ${slo.name} is critically low (${state.errorBudget.remainingPercent.toFixed(1)}% remaining)`,
      budget_exhausted: `Error budget for ${slo.name} has been exhausted`,
      burn_rate_high: `High burn rate detected for ${slo.name} (${state.errorBudget.burnRate.toFixed(2)}x)`,
      slo_breached: `SLO ${slo.name} has been breached (${state.currentValue.toFixed(2)}% vs ${state.targetValue}% target)`,
      slo_recovered: `SLO ${slo.name} has recovered to healthy status`,
    };

    const alert: SLOAlert = {
      id: randomUUID(),
      type,
      sloId: slo.id,
      sloName: slo.name,
      service: slo.service,
      timestamp: Date.now(),
      severity,
      currentValue: state.currentValue,
      targetValue: state.targetValue,
      errorBudgetRemaining: state.errorBudget.remainingPercent,
      burnRate: state.errorBudget.burnRate,
      message: messages[type],
      acknowledged: false,
      resolved: type === "slo_recovered",
      resolvedAt: type === "slo_recovered" ? Date.now() : undefined,
    };

    await this.storage.saveAlert(alert);
    this.emit("alertTriggered", alert);

    return alert;
  }

  async acknowledgeAlert(alertId: string, by: string): Promise<boolean> {
    const alert = await this.storage.getAlert(alertId);
    if (!alert) return false;

    await this.storage.updateAlert(alertId, {
      acknowledged: true,
      acknowledgedBy: by,
      acknowledgedAt: Date.now(),
    });

    this.emit("alertAcknowledged", alertId, by);
    return true;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = await this.storage.getAlert(alertId);
    if (!alert) return false;

    await this.storage.updateAlert(alertId, {
      resolved: true,
      resolvedAt: Date.now(),
    });

    this.emit("alertResolved", alertId);
    return true;
  }

  async listAlerts(filters?: { sloId?: string; resolved?: boolean; severity?: string }): Promise<SLOAlert[]> {
    return this.storage.listAlerts(filters);
  }

  // ---------------------------------------------------------------------------
  // Burn Rate Alert Configuration
  // ---------------------------------------------------------------------------

  async addBurnRateAlert(sloId: string, alert: Omit<BurnRateAlert, "id" | "sloId">): Promise<BurnRateAlert> {
    const fullAlert: BurnRateAlert = {
      ...alert,
      id: randomUUID(),
      sloId,
    };

    await this.storage.saveBurnRateAlert(fullAlert);
    return fullAlert;
  }

  async getBurnRateAlerts(sloId: string): Promise<BurnRateAlert[]> {
    return this.storage.getBurnRateAlerts(sloId);
  }

  async deleteBurnRateAlert(alertId: string): Promise<void> {
    await this.storage.deleteBurnRateAlert(alertId);
  }

  // ---------------------------------------------------------------------------
  // Reporting
  // ---------------------------------------------------------------------------

  async generateReport(sloId: string, period: SLOReportPeriod, customRange?: { start: number; end: number }): Promise<SLOReport | null> {
    const slo = await this.storage.getSLO(sloId);
    if (!slo) return null;

    const now = Date.now();
    let startTime: number;
    let endTime = now;

    if (customRange) {
      startTime = customRange.start;
      endTime = customRange.end;
    } else {
      switch (period) {
        case "day":
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case "week":
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "month":
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "quarter":
          startTime = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case "year":
          startTime = now - 365 * 24 * 60 * 60 * 1000;
          break;
        default:
          startTime = now - 7 * 24 * 60 * 60 * 1000;
      }
    }

    const history = await this.storage.getHistory(sloId, startTime, endTime);
    if (history.length === 0) {
      return null;
    }

    // Calculate metrics
    const values = history.map(h => h.value);
    const achievedValue = values.reduce((a, b) => a + b, 0) / values.length;

    const metEntries = history.filter(h => h.status === "healthy" || h.status === "warning");
    const uptime = (metEntries.length / history.length) * 100;

    // Budget calculations
    const errorBudgets = history.map(h => h.errorBudgetRemaining);
    const avgBudgetRemaining = errorBudgets.reduce((a, b) => a + b, 0) / errorBudgets.length;

    // Count incidents (transitions to critical or breached)
    let incidentCount = 0;
    let totalDowntime = 0;
    let inIncident = false;
    let incidentStart = 0;

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if ((entry.status === "critical" || entry.status === "breached") && !inIncident) {
        inIncident = true;
        incidentStart = entry.timestamp;
        incidentCount++;
      } else if ((entry.status === "healthy" || entry.status === "warning") && inIncident) {
        inIncident = false;
        totalDowntime += entry.timestamp - incidentStart;
      }
    }

    const mttr = incidentCount > 0 ? totalDowntime / incidentCount / 1000 : undefined;

    // Trend analysis
    const midpoint = Math.floor(history.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 0.1 ? "improving" : secondAvg < firstAvg - 0.1 ? "degrading" : "stable";

    const report: SLOReport = {
      sloId,
      sloName: slo.name,
      service: slo.service,
      period,
      startTime,
      endTime,
      achievedValue,
      targetValue: slo.target.value,
      met: achievedValue >= slo.target.value,
      uptime,
      budgetTotal: 100 - slo.target.value,
      budgetConsumed: (100 - slo.target.value) - avgBudgetRemaining * (100 - slo.target.value) / 100,
      budgetRemaining: avgBudgetRemaining * (100 - slo.target.value) / 100,
      incidentCount,
      totalDowntime: totalDowntime / 1000,
      mttr,
      trend,
      previousPeriodValue: firstAvg,
      changePercent: firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0,
    };

    this.emit("reportGenerated", report);
    return report;
  }

  async getSummary(): Promise<SLOSummary> {
    const slos = await this.storage.listSLOs({ enabled: true });
    const states = await Promise.all(slos.map(s => this.storage.getState(s.id)));

    let healthy = 0;
    let warning = 0;
    let critical = 0;
    let breached = 0;
    let unknown = 0;
    let totalBudgetRemaining = 0;

    for (const state of states) {
      if (!state) {
        unknown++;
        continue;
      }

      totalBudgetRemaining += state.errorBudget.remainingPercent;

      switch (state.status) {
        case "healthy":
          healthy++;
          break;
        case "warning":
          warning++;
          break;
        case "critical":
          critical++;
          break;
        case "breached":
          breached++;
          break;
        default:
          unknown++;
      }
    }

    const validStates = states.filter(s => s !== null).length;

    return {
      totalSLOs: slos.length,
      healthy,
      warning,
      critical,
      breached,
      unknown,
      overallHealth: slos.length > 0 ? (healthy / slos.length) * 100 : 0,
      avgErrorBudgetRemaining: validStates > 0 ? totalBudgetRemaining / validStates : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  async getHistory(sloId: string, startTime: number, endTime: number): Promise<SLOHistoryEntry[]> {
    return this.storage.getHistory(sloId, startTime, endTime);
  }

  async pruneHistory(retentionDays?: number): Promise<number> {
    const days = retentionDays ?? this.config.retentionDays;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.storage.pruneHistory(cutoff);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const slos = await this.storage.listSLOs({ enabled: true });
    for (const slo of slos) {
      this.startMeasurement(slo);
    }
  }

  async stop(): Promise<void> {
    this.running = false;

    for (const [sloId] of this.measurementIntervals) {
      this.stopMeasurement(sloId);
    }
  }

  private startMeasurement(slo: SLODefinition): void {
    if (this.measurementIntervals.has(slo.id)) return;

    // Initial measurement
    this.measure(slo.id).catch(err => this.emit("error", err));

    // Schedule periodic measurements
    const interval = setInterval(() => {
      this.measure(slo.id).catch(err => this.emit("error", err));
    }, this.config.measurementInterval * 1000);

    this.measurementIntervals.set(slo.id, interval);
  }

  private stopMeasurement(sloId: string): void {
    const interval = this.measurementIntervals.get(sloId);
    if (interval) {
      clearInterval(interval);
      this.measurementIntervals.delete(sloId);
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: SLOManager | null = null;

export function getSLOManager(): SLOManager {
  if (!defaultManager) {
    defaultManager = new SLOManager();
  }
  return defaultManager;
}

export function createSLOManager(config?: Partial<SLOManagerConfig>): SLOManager {
  return new SLOManager(config);
}
