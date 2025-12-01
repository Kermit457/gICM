/**
 * Metrics Registry Module
 * Phase 14C: Prometheus-compatible Metrics
 */

// Types & Schemas
export {
  // Metric Kinds
  MetricKindSchema,
  type MetricKind,

  // Metric Definition
  MetricDefSchema,
  type MetricDef,

  // Label Config
  LabelConfigSchema,
  type LabelConfig,

  // Bucket Config
  BucketConfigSchema,
  type BucketConfig,

  // Quantile Config
  QuantileConfigSchema,
  type QuantileConfig,

  // Metric Sample
  MetricSampleSchema,
  type MetricSample,

  // Counter Metric
  CounterMetricSchema,
  type CounterMetric,

  // Gauge Metric
  GaugeMetricSchema,
  type GaugeMetric,

  // Histogram Metric
  HistogramMetricSchema,
  type HistogramMetric,

  // Summary Metric
  SummaryMetricSchema,
  type SummaryMetric,

  // Combined Metric
  MetricSchema,
  type Metric,

  // Registry Config
  MetricsRegistryConfigSchema,
  type MetricsRegistryConfig,

  // Export Format
  ExportFormatSchema,
  type ExportFormat,

  // Push Gateway Config
  PushGatewayConfigSchema,
  type PushGatewayConfig,

  // Collector Config
  CollectorConfigSchema,
  type CollectorConfig,

  // Events
  type MetricsEvents,

  // Presets
  DEFAULT_BUCKETS,
  DEFAULT_QUANTILES,
  DEFAULT_METRICS,
  HTTP_METRICS,
  DB_METRICS,
  CACHE_METRICS,
} from "./types.js";

// Metrics Registry
export {
  Counter,
  Gauge,
  Histogram,
  Summary,
  MetricsRegistry,
  getMetricsRegistry,
  createMetricsRegistry,
} from "./metrics-registry.js";
