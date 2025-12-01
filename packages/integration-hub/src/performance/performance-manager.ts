/**
 * Performance Manager
 * Phase 9F: Performance Dashboard
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type PerformanceConfig,
  type PerformanceEvents,
  type Metric,
  type MetricType,
  type MetricUnit,
  type Span,
  type SpanStatus,
  type Trace,
  type Alert,
  type AlertRule,
  type AlertStatus,
  type SystemHealth,
  type PerformanceSummary,
  type ServiceStats,
  type EndpointStats,
  type PipelineStats,
  type LatencyPercentiles,
  type TimeSeries,
  type TimeSeriesPoint,
  DEFAULT_ALERT_RULES,
  PerformanceConfigSchema,
} from "./types.js";

// ============================================================================
// PERFORMANCE MANAGER
// ============================================================================

export class PerformanceManager extends EventEmitter<PerformanceEvents> {
  private config: PerformanceConfig;
  private metrics: Map<string, Metric[]> = new Map();
  private activeSpans: Map<string, Span> = new Map();
  private traces: Map<string, Trace> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private startTime: Date;
  private aggregationTimer?: NodeJS.Timeout;
  private alertCheckTimer?: NodeJS.Timeout;

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();
    this.config = PerformanceConfigSchema.parse(config);
    this.startTime = new Date();

    // Initialize default alert rules
    for (const rule of DEFAULT_ALERT_RULES) {
      const id = randomUUID();
      this.alertRules.set(id, { ...rule, id });
    }
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  start(): void {
    // Start aggregation timer
    if (this.config.metricsEnabled) {
      this.aggregationTimer = setInterval(() => {
        this.aggregate();
      }, this.config.aggregationIntervalMs);
    }

    // Start alert check timer
    if (this.config.alertingEnabled) {
      this.alertCheckTimer = setInterval(() => {
        this.checkAlerts();
      }, 30000); // Check every 30 seconds
    }
  }

  stop(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    if (this.alertCheckTimer) {
      clearInterval(this.alertCheckTimer);
    }
  }

  // ==========================================================================
  // METRICS
  // ==========================================================================

  recordMetric(
    name: string,
    value: number,
    options: {
      type?: MetricType;
      unit?: MetricUnit;
      labels?: Record<string, string>;
    } = {}
  ): void {
    if (!this.config.metricsEnabled) return;

    const metric: Metric = {
      name,
      value,
      type: options.type || "gauge",
      unit: options.unit || "count",
      labels: options.labels,
      timestamp: new Date(),
    };

    const key = this.getMetricKey(name, options.labels);
    const existing = this.metrics.get(key) || [];
    existing.push(metric);

    // Keep only last hour of data points per metric
    const cutoff = Date.now() - 3600000;
    const filtered = existing.filter((m) => m.timestamp.getTime() > cutoff);
    this.metrics.set(key, filtered);

    this.emit("metric:recorded", metric);
  }

  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    this.recordMetric(name, value, { type: "counter", unit: "count", labels });
  }

  recordLatency(
    name: string,
    durationMs: number,
    labels?: Record<string, string>
  ): void {
    this.recordMetric(name, durationMs, { type: "histogram", unit: "ms", labels });
  }

  recordGauge(
    name: string,
    value: number,
    unit: MetricUnit = "count",
    labels?: Record<string, string>
  ): void {
    this.recordMetric(name, value, { type: "gauge", unit, labels });
  }

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  getMetricTimeSeries(
    name: string,
    labels?: Record<string, string>,
    aggregation: "sum" | "avg" | "min" | "max" | "count" = "avg"
  ): TimeSeries {
    const key = this.getMetricKey(name, labels);
    const metrics = this.metrics.get(key) || [];

    // Group by minute
    const buckets = new Map<number, number[]>();
    for (const m of metrics) {
      const bucket = Math.floor(m.timestamp.getTime() / 60000) * 60000;
      const values = buckets.get(bucket) || [];
      values.push(m.value);
      buckets.set(bucket, values);
    }

    const points: TimeSeriesPoint[] = [];
    for (const [timestamp, values] of buckets) {
      let value: number;
      switch (aggregation) {
        case "sum":
          value = values.reduce((a, b) => a + b, 0);
          break;
        case "min":
          value = Math.min(...values);
          break;
        case "max":
          value = Math.max(...values);
          break;
        case "count":
          value = values.length;
          break;
        default:
          value = values.reduce((a, b) => a + b, 0) / values.length;
      }
      points.push({ timestamp: new Date(timestamp), value });
    }

    points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      name,
      unit: metrics[0]?.unit || "count",
      points,
      aggregation,
    };
  }

  // ==========================================================================
  // TRACING
  // ==========================================================================

  startSpan(
    name: string,
    options: {
      traceId?: string;
      parentSpanId?: string;
      service?: string;
      operation?: string;
      attributes?: Record<string, unknown>;
    } = {}
  ): Span {
    if (!this.config.tracingEnabled) {
      // Return a no-op span
      return {
        spanId: "",
        traceId: "",
        name,
        service: "",
        operation: "",
        startTime: new Date(),
        status: "ok",
      };
    }

    // Sampling
    if (Math.random() > this.config.samplingRate) {
      return {
        spanId: "",
        traceId: "",
        name,
        service: "",
        operation: "",
        startTime: new Date(),
        status: "ok",
      };
    }

    const span: Span = {
      spanId: randomUUID(),
      traceId: options.traceId || randomUUID(),
      parentSpanId: options.parentSpanId,
      name,
      service: options.service || "integration-hub",
      operation: options.operation || name,
      startTime: new Date(),
      status: "ok",
      attributes: options.attributes,
      events: [],
    };

    this.activeSpans.set(span.spanId, span);

    // Create or update trace
    if (!this.traces.has(span.traceId)) {
      this.traces.set(span.traceId, {
        traceId: span.traceId,
        rootSpan: span,
        spans: [span],
        startTime: span.startTime,
        services: [span.service],
        status: "ok",
      });
    } else {
      const trace = this.traces.get(span.traceId)!;
      trace.spans.push(span);
      if (!trace.services.includes(span.service)) {
        trace.services.push(span.service);
      }
    }

    this.emit("span:started", span);
    return span;
  }

  endSpan(
    spanId: string,
    options: {
      status?: SpanStatus;
      attributes?: Record<string, unknown>;
    } = {}
  ): Span | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span || !span.spanId) return undefined;

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = options.status || "ok";
    if (options.attributes) {
      span.attributes = { ...span.attributes, ...options.attributes };
    }

    this.activeSpans.delete(spanId);
    this.emit("span:ended", span);

    // Record latency metric
    this.recordLatency(`${span.service}.${span.operation}.latency`, span.duration, {
      service: span.service,
      operation: span.operation,
    });

    // Check if trace is complete
    const trace = this.traces.get(span.traceId);
    if (trace) {
      const allEnded = trace.spans.every((s) => s.endTime);
      if (allEnded) {
        trace.endTime = new Date();
        trace.totalDuration = trace.endTime.getTime() - trace.startTime.getTime();
        trace.status = trace.spans.some((s) => s.status === "error")
          ? "error"
          : trace.spans.some((s) => s.status === "timeout")
          ? "timeout"
          : "ok";
        this.emit("trace:completed", trace);
      }
    }

    return span;
  }

  addSpanEvent(
    spanId: string,
    eventName: string,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.events = span.events || [];
    span.events.push({
      name: eventName,
      timestamp: new Date(),
      attributes,
    });
  }

  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  getRecentTraces(limit: number = 100): Trace[] {
    const traces = Array.from(this.traces.values());
    traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return traces.slice(0, limit);
  }

  // ==========================================================================
  // ALERTS
  // ==========================================================================

  addAlertRule(rule: Omit<AlertRule, "id">): AlertRule {
    const id = randomUUID();
    const alertRule = { ...rule, id };
    this.alertRules.set(id, alertRule);
    return alertRule;
  }

  updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | undefined {
    const rule = this.alertRules.get(id);
    if (!rule) return undefined;
    const updated = { ...rule, ...updates, id };
    this.alertRules.set(id, updated);
    return updated;
  }

  deleteAlertRule(id: string): boolean {
    return this.alertRules.delete(id);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getAlerts(status?: AlertStatus): Alert[] {
    const alerts = Array.from(this.alerts.values());
    if (status) {
      return alerts.filter((a) => a.status === status);
    }
    return alerts;
  }

  acknowledgeAlert(alertId: string, userId: string): Alert | undefined {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== "firing") return undefined;

    alert.status = "acknowledged";
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    return alert;
  }

  private checkAlerts(): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const value = this.getCurrentMetricValue(rule.metric);
      if (value === undefined) continue;

      const conditionMet = this.evaluateCondition(value, rule.condition, rule.threshold);
      const existingAlert = this.findAlertByRule(rule.id);

      if (conditionMet) {
        if (!existingAlert) {
          // Fire new alert
          const alert: Alert = {
            id: randomUUID(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            status: "firing",
            message: rule.description || `${rule.name} triggered`,
            value,
            threshold: rule.threshold,
            startedAt: new Date(),
            labels: rule.labels,
          };
          this.alerts.set(alert.id, alert);
          this.emit("alert:fired", alert);
        }
      } else if (existingAlert && existingAlert.status === "firing") {
        // Resolve alert
        existingAlert.status = "resolved";
        existingAlert.resolvedAt = new Date();
        this.emit("alert:resolved", existingAlert);
      }
    }
  }

  private getCurrentMetricValue(metricName: string): number | undefined {
    const key = this.getMetricKey(metricName);
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) return undefined;

    // Return the most recent value
    return metrics[metrics.length - 1].value;
  }

  private evaluateCondition(
    value: number,
    condition: AlertRule["condition"],
    threshold: number
  ): boolean {
    switch (condition) {
      case "gt":
        return value > threshold;
      case "gte":
        return value >= threshold;
      case "lt":
        return value < threshold;
      case "lte":
        return value <= threshold;
      case "eq":
        return value === threshold;
      case "neq":
        return value !== threshold;
      default:
        return false;
    }
  }

  private findAlertByRule(ruleId: string): Alert | undefined {
    for (const alert of this.alerts.values()) {
      if (alert.ruleId === ruleId && alert.status === "firing") {
        return alert;
      }
    }
    return undefined;
  }

  // ==========================================================================
  // HEALTH & SUMMARY
  // ==========================================================================

  getSystemHealth(): SystemHealth {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime.getTime()) / 1000);

    // Calculate error rate from metrics
    const totalRequests = this.getAggregatedValue("http.requests.total", "sum") || 0;
    const totalErrors = this.getAggregatedValue("http.errors.total", "sum") || 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Get queue depth
    const queueDepth = this.getAggregatedValue("queue.depth", "avg") || 0;

    // Get cache hit rate
    const cacheHits = this.getAggregatedValue("cache.hits", "sum") || 0;
    const cacheMisses = this.getAggregatedValue("cache.misses", "sum") || 0;
    const cacheTotal = cacheHits + cacheMisses;
    const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;

    // Determine status
    let status: SystemHealth["status"] = "healthy";
    if (errorRate > 10 || queueDepth > 5000) {
      status = "unhealthy";
    } else if (errorRate > 5 || queueDepth > 1000 || cacheHitRate < 30) {
      status = "degraded";
    }

    const health: SystemHealth = {
      status,
      uptime,
      activeConnections: this.activeSpans.size,
      queueDepth,
      cacheHitRate,
      errorRate,
    };

    this.emit("health:changed", health);
    return health;
  }

  getSummary(period: "hour" | "day" | "week" | "month" = "day"): PerformanceSummary {
    const now = new Date();
    const periodMs = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
    }[period];
    const startTime = new Date(now.getTime() - periodMs);

    return {
      period,
      startTime,
      endTime: now,
      systemHealth: this.getSystemHealth(),
      services: this.getServiceStats(startTime),
      endpoints: this.getEndpointStats(startTime),
      pipelines: this.getPipelineStats(startTime),
      totalRequests: this.getAggregatedValue("http.requests.total", "sum", startTime) || 0,
      totalErrors: this.getAggregatedValue("http.errors.total", "sum", startTime) || 0,
      totalTokens: this.getAggregatedValue("llm.tokens.total", "sum", startTime) || 0,
      totalCost: this.getAggregatedValue("cost.total", "sum", startTime) || 0,
    };
  }

  private getAggregatedValue(
    metricName: string,
    aggregation: "sum" | "avg" | "min" | "max",
    since?: Date
  ): number | undefined {
    const key = this.getMetricKey(metricName);
    let metrics = this.metrics.get(key) || [];

    if (since) {
      metrics = metrics.filter((m) => m.timestamp >= since);
    }

    if (metrics.length === 0) return undefined;

    const values = metrics.map((m) => m.value);
    switch (aggregation) {
      case "sum":
        return values.reduce((a, b) => a + b, 0);
      case "avg":
        return values.reduce((a, b) => a + b, 0) / values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
    }
  }

  private getServiceStats(since: Date): ServiceStats[] {
    const services = new Map<string, { requests: number; errors: number; latencies: number[] }>();

    // Aggregate from traces
    for (const trace of this.traces.values()) {
      if (trace.startTime < since) continue;

      for (const span of trace.spans) {
        const stats = services.get(span.service) || {
          requests: 0,
          errors: 0,
          latencies: [],
        };
        stats.requests++;
        if (span.status === "error") stats.errors++;
        if (span.duration) stats.latencies.push(span.duration);
        services.set(span.service, stats);
      }
    }

    return Array.from(services.entries()).map(([service, stats]) => ({
      service,
      requestCount: stats.requests,
      errorCount: stats.errors,
      errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
      avgLatency:
        stats.latencies.length > 0
          ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
          : 0,
      latencyPercentiles: this.calculatePercentiles(stats.latencies),
      throughput: stats.requests / ((Date.now() - since.getTime()) / 1000),
    }));
  }

  private getEndpointStats(since: Date): EndpointStats[] {
    const endpoints = new Map<string, { requests: number; errors: number; latencies: number[] }>();

    // Aggregate from metrics with endpoint labels
    for (const [key, metrics] of this.metrics) {
      if (!key.includes("endpoint=")) continue;

      const filtered = metrics.filter((m) => m.timestamp >= since);
      if (filtered.length === 0) continue;

      const match = key.match(/endpoint=([^,}]+)/);
      const endpoint = match?.[1] || "unknown";

      const stats = endpoints.get(endpoint) || {
        requests: 0,
        errors: 0,
        latencies: [],
      };

      for (const m of filtered) {
        if (m.name.includes("request")) stats.requests += m.value;
        if (m.name.includes("error")) stats.errors += m.value;
        if (m.name.includes("latency")) stats.latencies.push(m.value);
      }

      endpoints.set(endpoint, stats);
    }

    return Array.from(endpoints.entries()).map(([endpoint, stats]) => ({
      endpoint,
      method: "ALL",
      requestCount: stats.requests,
      errorCount: stats.errors,
      errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
      avgLatency:
        stats.latencies.length > 0
          ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
          : 0,
      latencyPercentiles: this.calculatePercentiles(stats.latencies),
    }));
  }

  private getPipelineStats(since: Date): PipelineStats[] {
    // This would typically come from the analytics module
    // For now, return aggregated from metrics
    const pipelines = new Map<
      string,
      { executions: number; successes: number; failures: number; durations: number[]; tokens: number[]; costs: number[] }
    >();

    for (const [key, metrics] of this.metrics) {
      if (!key.includes("pipeline_id=")) continue;

      const filtered = metrics.filter((m) => m.timestamp >= since);
      if (filtered.length === 0) continue;

      const match = key.match(/pipeline_id=([^,}]+)/);
      const pipelineId = match?.[1] || "unknown";

      const stats = pipelines.get(pipelineId) || {
        executions: 0,
        successes: 0,
        failures: 0,
        durations: [],
        tokens: [],
        costs: [],
      };

      for (const m of filtered) {
        if (m.name.includes("execution")) stats.executions++;
        if (m.name.includes("success")) stats.successes += m.value;
        if (m.name.includes("failure")) stats.failures += m.value;
        if (m.name.includes("duration")) stats.durations.push(m.value);
        if (m.name.includes("tokens")) stats.tokens.push(m.value);
        if (m.name.includes("cost")) stats.costs.push(m.value);
      }

      pipelines.set(pipelineId, stats);
    }

    return Array.from(pipelines.entries()).map(([pipelineId, stats]) => ({
      pipelineId,
      pipelineName: pipelineId, // Would need to look up actual name
      executionCount: stats.executions,
      successCount: stats.successes,
      failureCount: stats.failures,
      successRate:
        stats.executions > 0 ? (stats.successes / stats.executions) * 100 : 0,
      avgDuration:
        stats.durations.length > 0
          ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
          : 0,
      avgTokenUsage:
        stats.tokens.length > 0
          ? stats.tokens.reduce((a, b) => a + b, 0) / stats.tokens.length
          : 0,
      avgCost:
        stats.costs.length > 0
          ? stats.costs.reduce((a, b) => a + b, 0) / stats.costs.length
          : 0,
    }));
  }

  private calculatePercentiles(values: number[]): LatencyPercentiles {
    if (values.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  // ==========================================================================
  // AGGREGATION & CLEANUP
  // ==========================================================================

  private aggregate(): void {
    const now = Date.now();
    const metricsRetentionMs = this.config.metricsRetentionDays * 86400000;
    const tracesRetentionMs = this.config.tracesRetentionDays * 86400000;

    // Clean old metrics
    for (const [key, metrics] of this.metrics) {
      const cutoff = now - metricsRetentionMs;
      const filtered = metrics.filter((m) => m.timestamp.getTime() > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }

    // Clean old traces
    const traceCutoff = now - tracesRetentionMs;
    for (const [traceId, trace] of this.traces) {
      if (trace.startTime.getTime() < traceCutoff) {
        this.traces.delete(traceId);
      }
    }

    // Clean resolved alerts
    const alertsCutoff = now - this.config.alertsRetentionDays * 86400000;
    for (const [alertId, alert] of this.alerts) {
      if (
        alert.status === "resolved" &&
        alert.resolvedAt &&
        alert.resolvedAt.getTime() < alertsCutoff
      ) {
        this.alerts.delete(alertId);
      }
    }
  }
}

// ============================================================================
// SINGLETON & FACTORY
// ============================================================================

let instance: PerformanceManager | null = null;

export function getPerformanceManager(): PerformanceManager {
  if (!instance) {
    instance = new PerformanceManager();
  }
  return instance;
}

export function createPerformanceManager(
  config: Partial<PerformanceConfig> = {}
): PerformanceManager {
  instance = new PerformanceManager(config);
  return instance;
}
