/**
 * Observability Types
 * Phase 12D: Distributed Tracing & Metrics
 */

import { z } from "zod";

// =============================================================================
// TRACE CONTEXT
// =============================================================================

export const TraceContextSchema = z.object({
  traceId: z.string().describe("Unique trace identifier (W3C format)"),
  spanId: z.string().describe("Current span identifier"),
  parentSpanId: z.string().optional().describe("Parent span identifier"),
  traceFlags: z.number().default(1).describe("Trace flags (sampled=1)"),
  traceState: z.string().optional().describe("Vendor-specific trace state"),
});
export type TraceContext = z.infer<typeof TraceContextSchema>;

// =============================================================================
// SPAN STATUS
// =============================================================================

export const SpanStatusCodeSchema = z.enum([
  "UNSET",
  "OK",
  "ERROR",
]);
export type SpanStatusCode = z.infer<typeof SpanStatusCodeSchema>;

export const SpanStatusSchema = z.object({
  code: SpanStatusCodeSchema,
  message: z.string().optional(),
});
export type SpanStatus = z.infer<typeof SpanStatusSchema>;

// =============================================================================
// SPAN KIND
// =============================================================================

export const SpanKindSchema = z.enum([
  "INTERNAL",
  "SERVER",
  "CLIENT",
  "PRODUCER",
  "CONSUMER",
]);
export type SpanKind = z.infer<typeof SpanKindSchema>;

// =============================================================================
// SPAN EVENTS
// =============================================================================

export const SpanEventSchema = z.object({
  name: z.string(),
  timestamp: z.number(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type SpanEvent = z.infer<typeof SpanEventSchema>;

// =============================================================================
// SPAN LINKS
// =============================================================================

export const SpanLinkSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type SpanLink = z.infer<typeof SpanLinkSchema>;

// =============================================================================
// SPAN
// =============================================================================

export const SpanSchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().optional(),
  name: z.string(),
  kind: SpanKindSchema.default("INTERNAL"),
  startTime: z.number(),
  endTime: z.number().optional(),
  duration: z.number().optional().describe("Duration in ms"),
  status: SpanStatusSchema.default({ code: "UNSET" }),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  events: z.array(SpanEventSchema).default([]),
  links: z.array(SpanLinkSchema).default([]),
  resource: z.object({
    serviceName: z.string(),
    serviceVersion: z.string().optional(),
    environment: z.string().optional(),
    hostName: z.string().optional(),
    instanceId: z.string().optional(),
  }),
});
export type Span = z.infer<typeof SpanSchema>;

// =============================================================================
// TRACE
// =============================================================================

export const TraceSchema = z.object({
  traceId: z.string(),
  rootSpan: SpanSchema,
  spans: z.array(SpanSchema),
  startTime: z.number(),
  endTime: z.number().optional(),
  duration: z.number().optional(),
  spanCount: z.number(),
  errorCount: z.number().default(0),
  serviceName: z.string(),
  operationName: z.string(),
});
export type Trace = z.infer<typeof TraceSchema>;

// =============================================================================
// METRIC TYPES
// =============================================================================

export const MetricTypeSchema = z.enum([
  "counter",
  "gauge",
  "histogram",
  "summary",
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const MetricUnitSchema = z.enum([
  "ms",
  "s",
  "bytes",
  "requests",
  "errors",
  "percent",
  "count",
  "none",
]);
export type MetricUnit = z.infer<typeof MetricUnitSchema>;

// =============================================================================
// METRIC POINT
// =============================================================================

export const MetricPointSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
  labels: z.record(z.string()).default({}),
});
export type MetricPoint = z.infer<typeof MetricPointSchema>;

// =============================================================================
// HISTOGRAM BUCKETS
// =============================================================================

export const HistogramBucketsSchema = z.object({
  boundaries: z.array(z.number()),
  counts: z.array(z.number()),
  sum: z.number(),
  count: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
});
export type HistogramBuckets = z.infer<typeof HistogramBucketsSchema>;

// =============================================================================
// METRIC DEFINITION
// =============================================================================

export const MetricDefinitionSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  unit: MetricUnitSchema.default("none"),
  description: z.string().optional(),
  labels: z.array(z.string()).default([]),
  buckets: z.array(z.number()).optional().describe("For histograms"),
});
export type MetricDefinition = z.infer<typeof MetricDefinitionSchema>;

// =============================================================================
// METRIC DATA
// =============================================================================

export const MetricDataSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  unit: MetricUnitSchema,
  description: z.string().optional(),
  points: z.array(MetricPointSchema),
  histogram: HistogramBucketsSchema.optional(),
  resource: z.object({
    serviceName: z.string(),
    environment: z.string().optional(),
  }),
});
export type MetricData = z.infer<typeof MetricDataSchema>;

// =============================================================================
// LOG SEVERITY
// =============================================================================

export const LogSeveritySchema = z.enum([
  "TRACE",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
]);
export type LogSeverity = z.infer<typeof LogSeveritySchema>;

// =============================================================================
// LOG RECORD
// =============================================================================

export const LogRecordSchema = z.object({
  timestamp: z.number(),
  severity: LogSeveritySchema,
  body: z.string(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  resource: z.object({
    serviceName: z.string(),
    environment: z.string().optional(),
  }),
});
export type LogRecord = z.infer<typeof LogRecordSchema>;

// =============================================================================
// EXPORTER CONFIG
// =============================================================================

export const ExporterTypeSchema = z.enum([
  "console",
  "otlp",
  "jaeger",
  "zipkin",
  "prometheus",
  "custom",
]);
export type ExporterType = z.infer<typeof ExporterTypeSchema>;

export const ExporterConfigSchema = z.object({
  type: ExporterTypeSchema,
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  compression: z.enum(["none", "gzip"]).default("none"),
  timeout: z.number().default(30000),
  batchSize: z.number().default(512),
  flushInterval: z.number().default(5000),
});
export type ExporterConfig = z.infer<typeof ExporterConfigSchema>;

// =============================================================================
// SAMPLER CONFIG
// =============================================================================

export const SamplerTypeSchema = z.enum([
  "always_on",
  "always_off",
  "trace_id_ratio",
  "parent_based",
]);
export type SamplerType = z.infer<typeof SamplerTypeSchema>;

export const SamplerConfigSchema = z.object({
  type: SamplerTypeSchema.default("always_on"),
  ratio: z.number().min(0).max(1).default(1),
  parentBased: z.boolean().default(true),
});
export type SamplerConfig = z.infer<typeof SamplerConfigSchema>;

// =============================================================================
// OBSERVABILITY CONFIG
// =============================================================================

export const ObservabilityConfigSchema = z.object({
  serviceName: z.string().default("integration-hub"),
  serviceVersion: z.string().optional(),
  environment: z.string().default("development"),

  // Tracing
  tracing: z.object({
    enabled: z.boolean().default(true),
    sampler: SamplerConfigSchema.default({}),
    exporter: ExporterConfigSchema.optional(),
    maxSpanAttributes: z.number().default(128),
    maxSpanEvents: z.number().default(128),
    maxSpanLinks: z.number().default(128),
  }).default({}),

  // Metrics
  metrics: z.object({
    enabled: z.boolean().default(true),
    exporter: ExporterConfigSchema.optional(),
    collectInterval: z.number().default(60000),
    defaultBuckets: z.array(z.number()).default([5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]),
  }).default({}),

  // Logging
  logging: z.object({
    enabled: z.boolean().default(true),
    minSeverity: LogSeveritySchema.default("INFO"),
    exporter: ExporterConfigSchema.optional(),
    includeTraceContext: z.boolean().default(true),
  }).default({}),

  // Resource
  resource: z.object({
    hostName: z.string().optional(),
    instanceId: z.string().optional(),
    attributes: z.record(z.string()).default({}),
  }).default({}),

  // Retention
  retention: z.object({
    traces: z.number().default(24 * 60 * 60 * 1000), // 24h
    metrics: z.number().default(7 * 24 * 60 * 60 * 1000), // 7d
    logs: z.number().default(24 * 60 * 60 * 1000), // 24h
  }).default({}),
});
export type ObservabilityConfig = z.infer<typeof ObservabilityConfigSchema>;

// =============================================================================
// QUERY TYPES
// =============================================================================

export const TraceQuerySchema = z.object({
  traceId: z.string().optional(),
  serviceName: z.string().optional(),
  operationName: z.string().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  tags: z.record(z.string()).optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  limit: z.number().default(100),
});
export type TraceQuery = z.infer<typeof TraceQuerySchema>;

export const MetricQuerySchema = z.object({
  name: z.string(),
  labels: z.record(z.string()).optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  step: z.number().optional().describe("Query resolution in ms"),
  aggregation: z.enum(["sum", "avg", "min", "max", "count", "rate"]).optional(),
});
export type MetricQuery = z.infer<typeof MetricQuerySchema>;

export const LogQuerySchema = z.object({
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  serviceName: z.string().optional(),
  severity: LogSeveritySchema.optional(),
  bodyContains: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  limit: z.number().default(100),
});
export type LogQuery = z.infer<typeof LogQuerySchema>;

// =============================================================================
// STATS & SUMMARY
// =============================================================================

export const TraceSummarySchema = z.object({
  totalTraces: z.number(),
  totalSpans: z.number(),
  errorRate: z.number(),
  avgDuration: z.number(),
  p50Duration: z.number(),
  p95Duration: z.number(),
  p99Duration: z.number(),
  topServices: z.array(z.object({
    name: z.string(),
    traceCount: z.number(),
    avgDuration: z.number(),
  })),
  topOperations: z.array(z.object({
    name: z.string(),
    traceCount: z.number(),
    avgDuration: z.number(),
    errorRate: z.number(),
  })),
});
export type TraceSummary = z.infer<typeof TraceSummarySchema>;

export const MetricsSummarySchema = z.object({
  totalMetrics: z.number(),
  totalPoints: z.number(),
  metricsByType: z.record(z.number()),
  topMetrics: z.array(z.object({
    name: z.string(),
    type: MetricTypeSchema,
    pointCount: z.number(),
    lastValue: z.number(),
  })),
});
export type MetricsSummary = z.infer<typeof MetricsSummarySchema>;

export const ObservabilitySummarySchema = z.object({
  traces: TraceSummarySchema,
  metrics: MetricsSummarySchema,
  uptime: z.number(),
  lastUpdated: z.number(),
});
export type ObservabilitySummary = z.infer<typeof ObservabilitySummarySchema>;

// =============================================================================
// EVENTS
// =============================================================================

export type ObservabilityEvents = {
  // Tracing
  "span:started": (span: Span) => void;
  "span:ended": (span: Span) => void;
  "trace:completed": (trace: Trace) => void;

  // Metrics
  "metric:recorded": (metric: MetricData) => void;
  "metric:exported": (count: number) => void;

  // Logging
  "log:recorded": (log: LogRecord) => void;
  "log:exported": (count: number) => void;

  // Export
  "export:started": (type: "traces" | "metrics" | "logs") => void;
  "export:completed": (type: "traces" | "metrics" | "logs", count: number) => void;
  "export:failed": (type: "traces" | "metrics" | "logs", error: Error) => void;

  // Errors
  "error": (error: Error) => void;
};

// =============================================================================
// BUILT-IN METRICS
// =============================================================================

export const BUILTIN_METRICS: MetricDefinition[] = [
  // HTTP metrics
  {
    name: "http_requests_total",
    type: "counter",
    unit: "requests",
    description: "Total HTTP requests",
    labels: ["method", "path", "status"],
  },
  {
    name: "http_request_duration_ms",
    type: "histogram",
    unit: "ms",
    description: "HTTP request duration",
    labels: ["method", "path"],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  },
  {
    name: "http_request_size_bytes",
    type: "histogram",
    unit: "bytes",
    description: "HTTP request size",
    labels: ["method", "path"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  },
  {
    name: "http_response_size_bytes",
    type: "histogram",
    unit: "bytes",
    description: "HTTP response size",
    labels: ["method", "path"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  },

  // Pipeline metrics
  {
    name: "pipeline_executions_total",
    type: "counter",
    unit: "count",
    description: "Total pipeline executions",
    labels: ["pipeline", "status"],
  },
  {
    name: "pipeline_duration_ms",
    type: "histogram",
    unit: "ms",
    description: "Pipeline execution duration",
    labels: ["pipeline"],
    buckets: [100, 500, 1000, 5000, 10000, 30000, 60000, 300000],
  },
  {
    name: "pipeline_steps_total",
    type: "counter",
    unit: "count",
    description: "Total pipeline steps executed",
    labels: ["pipeline", "step", "status"],
  },

  // Queue metrics
  {
    name: "queue_jobs_total",
    type: "counter",
    unit: "count",
    description: "Total queue jobs",
    labels: ["queue", "status"],
  },
  {
    name: "queue_depth",
    type: "gauge",
    unit: "count",
    description: "Current queue depth",
    labels: ["queue"],
  },
  {
    name: "queue_job_duration_ms",
    type: "histogram",
    unit: "ms",
    description: "Queue job duration",
    labels: ["queue"],
    buckets: [100, 500, 1000, 5000, 10000, 30000],
  },

  // System metrics
  {
    name: "memory_usage_bytes",
    type: "gauge",
    unit: "bytes",
    description: "Memory usage",
    labels: ["type"],
  },
  {
    name: "cpu_usage_percent",
    type: "gauge",
    unit: "percent",
    description: "CPU usage percentage",
    labels: [],
  },
  {
    name: "active_connections",
    type: "gauge",
    unit: "count",
    description: "Active connections",
    labels: ["type"],
  },
];

// =============================================================================
// STANDARD SPAN ATTRIBUTES
// =============================================================================

export const SPAN_ATTRIBUTES = {
  // HTTP
  HTTP_METHOD: "http.method",
  HTTP_URL: "http.url",
  HTTP_TARGET: "http.target",
  HTTP_HOST: "http.host",
  HTTP_SCHEME: "http.scheme",
  HTTP_STATUS_CODE: "http.status_code",
  HTTP_REQUEST_CONTENT_LENGTH: "http.request_content_length",
  HTTP_RESPONSE_CONTENT_LENGTH: "http.response_content_length",
  HTTP_USER_AGENT: "http.user_agent",

  // Database
  DB_SYSTEM: "db.system",
  DB_CONNECTION_STRING: "db.connection_string",
  DB_USER: "db.user",
  DB_NAME: "db.name",
  DB_STATEMENT: "db.statement",
  DB_OPERATION: "db.operation",

  // Pipeline
  PIPELINE_ID: "pipeline.id",
  PIPELINE_NAME: "pipeline.name",
  PIPELINE_STEP: "pipeline.step",
  PIPELINE_STATUS: "pipeline.status",

  // Queue
  QUEUE_NAME: "queue.name",
  QUEUE_JOB_ID: "queue.job_id",
  QUEUE_PRIORITY: "queue.priority",

  // Error
  ERROR_TYPE: "error.type",
  ERROR_MESSAGE: "error.message",
  ERROR_STACK: "error.stack",

  // Custom
  ORG_ID: "gicm.org_id",
  USER_ID: "gicm.user_id",
  REQUEST_ID: "gicm.request_id",
} as const;
