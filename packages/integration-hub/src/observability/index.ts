/**
 * Observability Module
 * Phase 12D: Distributed Tracing, Metrics & Logging
 */

// Types
export {
  // Trace Context
  TraceContextSchema,
  type TraceContext,

  // Span Status
  SpanStatusCodeSchema,
  type SpanStatusCode,
  SpanStatusSchema,
  type SpanStatus,

  // Span Kind
  SpanKindSchema,
  type SpanKind,

  // Span Events & Links
  SpanEventSchema,
  type SpanEvent,
  SpanLinkSchema,
  type SpanLink,

  // Span & Trace
  SpanSchema,
  type Span,
  TraceSchema,
  type Trace,

  // Metric Types
  MetricTypeSchema,
  type MetricType,
  MetricUnitSchema,
  type MetricUnit,

  // Metric Data
  MetricPointSchema,
  type MetricPoint,
  HistogramBucketsSchema,
  type HistogramBuckets,
  MetricDefinitionSchema,
  type MetricDefinition,
  MetricDataSchema,
  type MetricData,

  // Logging
  LogSeveritySchema,
  type LogSeverity,
  LogRecordSchema,
  type LogRecord,

  // Exporters
  ExporterTypeSchema,
  type ExporterType,
  ExporterConfigSchema,
  type ExporterConfig,

  // Samplers
  SamplerTypeSchema,
  type SamplerType,
  SamplerConfigSchema,
  type SamplerConfig,

  // Configuration
  ObservabilityConfigSchema,
  type ObservabilityConfig,

  // Queries
  TraceQuerySchema,
  type TraceQuery,
  MetricQuerySchema,
  type MetricQuery,
  LogQuerySchema,
  type LogQuery,

  // Summary
  TraceSummarySchema,
  type TraceSummary,
  MetricsSummarySchema,
  type MetricsSummary,
  ObservabilitySummarySchema,
  type ObservabilitySummary,

  // Events
  type ObservabilityEvents,

  // Constants
  BUILTIN_METRICS,
  SPAN_ATTRIBUTES,
} from "./types.js";

// Tracer
export {
  Tracer,
  SpanBuilder,
  getTracer,
  createTracer,
  generateTraceId,
  generateSpanId,
  type SpanOptions,
} from "./tracer.js";

// Metrics
export {
  MetricsCollector,
  Counter,
  Gauge,
  Histogram,
  getMetricsCollector,
  createMetricsCollector,
} from "./metrics.js";

// Logger
export {
  Logger,
  getLogger,
  createLogger,
} from "./logger.js";

// Observability Manager
export {
  ObservabilityManager,
  getObservabilityManager,
  createObservabilityManager,
} from "./observability-manager.js";
