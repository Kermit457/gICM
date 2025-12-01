/**
 * Performance Monitoring Types
 * Phase 9F: Performance Dashboard
 */

import { z } from "zod";

// ============================================================================
// METRIC TYPES
// ============================================================================

export const MetricTypeSchema = z.enum([
  "counter",
  "gauge",
  "histogram",
  "summary",
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const MetricUnitSchema = z.enum([
  "ms",
  "seconds",
  "bytes",
  "percent",
  "count",
  "requests",
  "errors",
  "tokens",
  "dollars",
]);
export type MetricUnit = z.infer<typeof MetricUnitSchema>;

export const MetricSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  value: z.number(),
  unit: MetricUnitSchema,
  labels: z.record(z.string()).optional(),
  timestamp: z.date(),
});
export type Metric = z.infer<typeof MetricSchema>;

// ============================================================================
// TRACE & SPAN
// ============================================================================

export const SpanStatusSchema = z.enum(["ok", "error", "timeout", "cancelled"]);
export type SpanStatus = z.infer<typeof SpanStatusSchema>;

export const SpanSchema = z.object({
  spanId: z.string(),
  traceId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  service: z.string(),
  operation: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(), // ms
  status: SpanStatusSchema,
  attributes: z.record(z.unknown()).optional(),
  events: z
    .array(
      z.object({
        name: z.string(),
        timestamp: z.date(),
        attributes: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
});
export type Span = z.infer<typeof SpanSchema>;

export const TraceSchema = z.object({
  traceId: z.string(),
  rootSpan: SpanSchema,
  spans: z.array(SpanSchema),
  startTime: z.date(),
  endTime: z.date().optional(),
  totalDuration: z.number().optional(), // ms
  services: z.array(z.string()),
  status: SpanStatusSchema,
});
export type Trace = z.infer<typeof TraceSchema>;

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

export const LatencyPercentilesSchema = z.object({
  p50: z.number(),
  p75: z.number(),
  p90: z.number(),
  p95: z.number(),
  p99: z.number(),
});
export type LatencyPercentiles = z.infer<typeof LatencyPercentilesSchema>;

export const ServiceStatsSchema = z.object({
  service: z.string(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(), // percentage
  avgLatency: z.number(), // ms
  latencyPercentiles: LatencyPercentilesSchema,
  throughput: z.number(), // requests/sec
});
export type ServiceStats = z.infer<typeof ServiceStatsSchema>;

export const EndpointStatsSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  requestCount: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgLatency: z.number(),
  latencyPercentiles: LatencyPercentilesSchema,
  cacheHitRate: z.number().optional(),
});
export type EndpointStats = z.infer<typeof EndpointStatsSchema>;

export const PipelineStatsSchema = z.object({
  pipelineId: z.string(),
  pipelineName: z.string(),
  executionCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  successRate: z.number(),
  avgDuration: z.number(), // ms
  avgTokenUsage: z.number(),
  avgCost: z.number(), // dollars
});
export type PipelineStats = z.infer<typeof PipelineStatsSchema>;

export const SystemHealthSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  uptime: z.number(), // seconds
  cpuUsage: z.number().optional(), // percentage
  memoryUsage: z.number().optional(), // percentage
  activeConnections: z.number(),
  queueDepth: z.number(),
  cacheHitRate: z.number(),
  errorRate: z.number(),
});
export type SystemHealth = z.infer<typeof SystemHealthSchema>;

export const PerformanceSummarySchema = z.object({
  period: z.enum(["hour", "day", "week", "month"]),
  startTime: z.date(),
  endTime: z.date(),
  systemHealth: SystemHealthSchema,
  services: z.array(ServiceStatsSchema),
  endpoints: z.array(EndpointStatsSchema),
  pipelines: z.array(PipelineStatsSchema),
  totalRequests: z.number(),
  totalErrors: z.number(),
  totalTokens: z.number(),
  totalCost: z.number(),
});
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

// ============================================================================
// TIME SERIES
// ============================================================================

export const TimeSeriesPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

export const TimeSeriesSchema = z.object({
  name: z.string(),
  unit: MetricUnitSchema,
  points: z.array(TimeSeriesPointSchema),
  aggregation: z.enum(["sum", "avg", "min", "max", "count"]),
});
export type TimeSeries = z.infer<typeof TimeSeriesSchema>;

// ============================================================================
// ALERTS
// ============================================================================

export const AlertSeveritySchema = z.enum(["info", "warning", "error", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertStatusSchema = z.enum(["firing", "resolved", "acknowledged"]);
export type AlertStatus = z.infer<typeof AlertStatusSchema>;

export const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  metric: z.string(),
  condition: z.enum(["gt", "gte", "lt", "lte", "eq", "neq"]),
  threshold: z.number(),
  duration: z.number(), // seconds - how long condition must be true
  severity: AlertSeveritySchema,
  labels: z.record(z.string()).optional(),
  enabled: z.boolean(),
});
export type AlertRule = z.infer<typeof AlertRuleSchema>;

export const AlertSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  severity: AlertSeveritySchema,
  status: AlertStatusSchema,
  message: z.string(),
  value: z.number(),
  threshold: z.number(),
  startedAt: z.date(),
  resolvedAt: z.date().optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.string().optional(),
  labels: z.record(z.string()).optional(),
});
export type Alert = z.infer<typeof AlertSchema>;

// ============================================================================
// CONFIGURATION
// ============================================================================

export const PerformanceConfigSchema = z.object({
  // Collection
  metricsEnabled: z.boolean().default(true),
  tracingEnabled: z.boolean().default(true),
  samplingRate: z.number().min(0).max(1).default(0.1), // 10% by default

  // Retention
  metricsRetentionDays: z.number().default(30),
  tracesRetentionDays: z.number().default(7),
  alertsRetentionDays: z.number().default(90),

  // Aggregation
  aggregationIntervalMs: z.number().default(60000), // 1 minute

  // Alerting
  alertingEnabled: z.boolean().default(true),
  alertWebhookUrl: z.string().url().optional(),
});
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// ============================================================================
// EVENTS
// ============================================================================

export interface PerformanceEvents {
  "metric:recorded": (metric: Metric) => void;
  "span:started": (span: Span) => void;
  "span:ended": (span: Span) => void;
  "trace:completed": (trace: Trace) => void;
  "alert:fired": (alert: Alert) => void;
  "alert:resolved": (alert: Alert) => void;
  "health:changed": (health: SystemHealth) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_ALERT_RULES: Omit<AlertRule, "id">[] = [
  {
    name: "High Error Rate",
    description: "Error rate exceeds 5%",
    metric: "error_rate",
    condition: "gt",
    threshold: 5,
    duration: 300, // 5 minutes
    severity: "error",
    enabled: true,
  },
  {
    name: "High Latency",
    description: "P95 latency exceeds 2 seconds",
    metric: "latency_p95",
    condition: "gt",
    threshold: 2000,
    duration: 300,
    severity: "warning",
    enabled: true,
  },
  {
    name: "High Queue Depth",
    description: "Queue depth exceeds 1000 jobs",
    metric: "queue_depth",
    condition: "gt",
    threshold: 1000,
    duration: 600, // 10 minutes
    severity: "warning",
    enabled: true,
  },
  {
    name: "Low Cache Hit Rate",
    description: "Cache hit rate below 50%",
    metric: "cache_hit_rate",
    condition: "lt",
    threshold: 50,
    duration: 900, // 15 minutes
    severity: "info",
    enabled: true,
  },
  {
    name: "High Token Usage",
    description: "Token usage exceeds daily budget",
    metric: "daily_token_usage",
    condition: "gt",
    threshold: 1000000, // 1M tokens
    duration: 0, // Immediate
    severity: "warning",
    enabled: true,
  },
  {
    name: "Service Unhealthy",
    description: "Service health check failing",
    metric: "service_health",
    condition: "eq",
    threshold: 0, // 0 = unhealthy
    duration: 120, // 2 minutes
    severity: "critical",
    enabled: true,
  },
];
