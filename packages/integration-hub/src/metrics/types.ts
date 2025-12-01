/**
 * Metrics Registry Types
 * Phase 14C: Metrics Registry
 */

import { z } from "zod";

// =============================================================================
// Metric Types
// =============================================================================

export const MetricKindSchema = z.enum([
  "counter",
  "gauge",
  "histogram",
  "summary",
]);
export type MetricKind = z.infer<typeof MetricKindSchema>;

// =============================================================================
// Labels
// =============================================================================

export const LabelSchema = z.record(z.string());
export type Label = z.infer<typeof LabelSchema>;

// =============================================================================
// Metric Value
// =============================================================================

export const MetricValueSchema = z.object({
  value: z.number(),
  timestamp: z.number().optional(),
  labels: LabelSchema.default({}),
});
export type MetricValue = z.infer<typeof MetricValueSchema>;

// =============================================================================
// Histogram Value
// =============================================================================

export const HistogramValueSchema = z.object({
  buckets: z.record(z.string(), z.number()).describe("Bucket boundaries to counts"),
  sum: z.number(),
  count: z.number(),
  labels: LabelSchema.default({}),
  timestamp: z.number().optional(),
});
export type HistogramValue = z.infer<typeof HistogramValueSchema>;

// =============================================================================
// Summary Value
// =============================================================================

export const SummaryValueSchema = z.object({
  quantiles: z.record(z.string(), z.number()).describe("Quantile to value"),
  sum: z.number(),
  count: z.number(),
  labels: LabelSchema.default({}),
  timestamp: z.number().optional(),
});
export type SummaryValue = z.infer<typeof SummaryValueSchema>;

// =============================================================================
// Metric Definition
// =============================================================================

export const MetricDefSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_:][a-zA-Z0-9_:]*$/),
  kind: MetricKindSchema,
  help: z.string(),
  unit: z.string().optional(),
  labelNames: z.array(z.string()).default([]),
  buckets: z.array(z.number()).optional().describe("For histograms"),
  quantiles: z.array(z.number()).optional().describe("For summaries"),
  maxAge: z.number().optional().describe("For summaries - window in ms"),
});
export type MetricDef = z.infer<typeof MetricDefSchema>;

// =============================================================================
// Metric Sample
// =============================================================================

export const MetricSampleSchema = z.object({
  name: z.string(),
  kind: MetricKindSchema,
  help: z.string(),
  unit: z.string().optional(),
  values: z.array(z.union([
    MetricValueSchema,
    HistogramValueSchema,
    SummaryValueSchema,
  ])),
});
export type MetricSample = z.infer<typeof MetricSampleSchema>;

// =============================================================================
// Collector Config
// =============================================================================

export const CollectorConfigSchema = z.object({
  name: z.string(),
  collect: z.function().args().returns(z.promise(z.array(MetricSampleSchema))),
});
export type CollectorConfig = z.infer<typeof CollectorConfigSchema>;

// =============================================================================
// Export Format
// =============================================================================

export const ExportFormatSchema = z.enum([
  "prometheus",
  "openmetrics",
  "json",
  "statsd",
]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

// =============================================================================
// Push Gateway Config
// =============================================================================

export const PushGatewayConfigSchema = z.object({
  url: z.string().url(),
  job: z.string(),
  instance: z.string().optional(),
  auth: z.object({
    type: z.enum(["basic", "bearer"]),
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
  }).optional(),
  pushInterval: z.number().default(15000),
  groupings: z.record(z.string()).optional(),
});
export type PushGatewayConfig = z.infer<typeof PushGatewayConfigSchema>;

// =============================================================================
// Registry Config
// =============================================================================

export const MetricsRegistryConfigSchema = z.object({
  prefix: z.string().optional(),
  defaultLabels: LabelSchema.default({}),
  enableDefaultMetrics: z.boolean().default(true),
  defaultMetricsInterval: z.number().default(10000),
  pushGateway: PushGatewayConfigSchema.optional(),
  buckets: z.object({
    http: z.array(z.number()).default([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
    default: z.array(z.number()).default([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]),
  }).optional(),
  quantiles: z.array(z.number()).default([0.5, 0.9, 0.95, 0.99]),
});
export type MetricsRegistryConfig = z.infer<typeof MetricsRegistryConfigSchema>;

// =============================================================================
// Aggregation
// =============================================================================

export const AggregationTypeSchema = z.enum([
  "sum",
  "avg",
  "min",
  "max",
  "count",
  "rate",
  "increase",
]);
export type AggregationType = z.infer<typeof AggregationTypeSchema>;

export const AggregationConfigSchema = z.object({
  type: AggregationTypeSchema,
  interval: z.number().optional().describe("For rate/increase"),
  labels: z.array(z.string()).optional().describe("Group by labels"),
});
export type AggregationConfig = z.infer<typeof AggregationConfigSchema>;

// =============================================================================
// Query
// =============================================================================

export const MetricsQuerySchema = z.object({
  name: z.string(),
  labels: LabelSchema.optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  step: z.number().optional(),
  aggregation: AggregationConfigSchema.optional(),
});
export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;

// =============================================================================
// Time Series
// =============================================================================

export const TimeSeriesPointSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

export const TimeSeriesSchema = z.object({
  metric: z.string(),
  labels: LabelSchema,
  points: z.array(TimeSeriesPointSchema),
});
export type TimeSeries = z.infer<typeof TimeSeriesSchema>;

// =============================================================================
// Events
// =============================================================================

export type MetricsEvents = {
  // Metric Events
  metricRegistered: (def: MetricDef) => void;
  metricUpdated: (name: string, labels: Label, value: number) => void;
  metricRemoved: (name: string) => void;

  // Collection Events
  collectionStarted: () => void;
  collectionCompleted: (metrics: MetricSample[]) => void;

  // Push Events
  pushStarted: () => void;
  pushCompleted: (success: boolean) => void;
  pushError: (error: Error) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Default Metrics
// =============================================================================

export const DEFAULT_METRICS: MetricDef[] = [
  {
    name: "process_cpu_seconds_total",
    kind: "counter",
    help: "Total user and system CPU time spent in seconds",
  },
  {
    name: "process_resident_memory_bytes",
    kind: "gauge",
    help: "Resident memory size in bytes",
  },
  {
    name: "process_heap_bytes",
    kind: "gauge",
    help: "Process heap size in bytes",
  },
  {
    name: "process_open_fds",
    kind: "gauge",
    help: "Number of open file descriptors",
  },
  {
    name: "process_start_time_seconds",
    kind: "gauge",
    help: "Start time of the process since unix epoch in seconds",
  },
  {
    name: "nodejs_eventloop_lag_seconds",
    kind: "gauge",
    help: "Lag of event loop in seconds",
  },
  {
    name: "nodejs_active_handles_total",
    kind: "gauge",
    help: "Number of active handles",
  },
  {
    name: "nodejs_active_requests_total",
    kind: "gauge",
    help: "Number of active requests",
  },
  {
    name: "nodejs_heap_size_total_bytes",
    kind: "gauge",
    help: "Process heap size from Node.js in bytes",
  },
  {
    name: "nodejs_heap_size_used_bytes",
    kind: "gauge",
    help: "Process heap size used from Node.js in bytes",
  },
  {
    name: "nodejs_external_memory_bytes",
    kind: "gauge",
    help: "Node.js external memory size in bytes",
  },
  {
    name: "nodejs_gc_duration_seconds",
    kind: "histogram",
    help: "Garbage collection duration",
    labelNames: ["gc_type"],
    buckets: [0.001, 0.01, 0.1, 1, 2, 5],
  },
];

// =============================================================================
// Common Metric Definitions
// =============================================================================

export const HTTP_METRICS: MetricDef[] = [
  {
    name: "http_requests_total",
    kind: "counter",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  },
  {
    name: "http_request_duration_seconds",
    kind: "histogram",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
  {
    name: "http_request_size_bytes",
    kind: "histogram",
    help: "HTTP request size in bytes",
    labelNames: ["method", "route"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  },
  {
    name: "http_response_size_bytes",
    kind: "histogram",
    help: "HTTP response size in bytes",
    labelNames: ["method", "route"],
    buckets: [100, 1000, 10000, 100000, 1000000],
  },
  {
    name: "http_requests_in_flight",
    kind: "gauge",
    help: "Number of HTTP requests currently in flight",
    labelNames: ["method"],
  },
];

export const DB_METRICS: MetricDef[] = [
  {
    name: "db_queries_total",
    kind: "counter",
    help: "Total number of database queries",
    labelNames: ["operation", "table", "status"],
  },
  {
    name: "db_query_duration_seconds",
    kind: "histogram",
    help: "Database query duration in seconds",
    labelNames: ["operation", "table"],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  },
  {
    name: "db_connections_total",
    kind: "gauge",
    help: "Number of database connections",
    labelNames: ["state"],
  },
];

export const CACHE_METRICS: MetricDef[] = [
  {
    name: "cache_hits_total",
    kind: "counter",
    help: "Total number of cache hits",
    labelNames: ["cache"],
  },
  {
    name: "cache_misses_total",
    kind: "counter",
    help: "Total number of cache misses",
    labelNames: ["cache"],
  },
  {
    name: "cache_size_bytes",
    kind: "gauge",
    help: "Current size of cache in bytes",
    labelNames: ["cache"],
  },
  {
    name: "cache_items_total",
    kind: "gauge",
    help: "Number of items in cache",
    labelNames: ["cache"],
  },
];
