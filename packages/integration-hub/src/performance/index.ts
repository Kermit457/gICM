/**
 * Performance Module
 * Phase 9F: Performance Dashboard
 */

// Types & Schemas
export {
  // Metric types
  MetricTypeSchema,
  type MetricType,
  MetricUnitSchema,
  type MetricUnit,
  MetricSchema,
  type Metric,

  // Trace & Span
  SpanStatusSchema,
  type SpanStatus,
  SpanSchema,
  type Span,
  TraceSchema,
  type Trace,

  // Summary
  LatencyPercentilesSchema,
  type LatencyPercentiles,
  ServiceStatsSchema,
  type ServiceStats,
  EndpointStatsSchema,
  type EndpointStats,
  PipelineStatsSchema,
  type PipelineStats,
  SystemHealthSchema,
  type SystemHealth,
  PerformanceSummarySchema,
  type PerformanceSummary,

  // Time Series
  TimeSeriesPointSchema,
  type TimeSeriesPoint,
  TimeSeriesSchema,
  type TimeSeries,

  // Alerts
  AlertSeveritySchema,
  type AlertSeverity,
  AlertStatusSchema,
  type AlertStatus,
  AlertRuleSchema,
  type AlertRule,
  AlertSchema,
  type Alert,

  // Config
  PerformanceConfigSchema,
  type PerformanceConfig,

  // Events
  type PerformanceEvents,

  // Constants
  DEFAULT_ALERT_RULES,
} from "./types.js";

// Manager
export {
  PerformanceManager,
  getPerformanceManager,
  createPerformanceManager,
} from "./performance-manager.js";
