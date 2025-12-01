/**
 * Metrics Collector
 * Phase 12D: OpenTelemetry-compatible metrics
 */

import { EventEmitter } from "eventemitter3";
import type {
  MetricType,
  MetricUnit,
  MetricPoint,
  MetricDefinition,
  MetricData,
  HistogramBuckets,
  ObservabilityConfig,
  ObservabilityEvents,
  MetricQuery,
  MetricsSummary,
} from "./types.js";
import { BUILTIN_METRICS } from "./types.js";

// =============================================================================
// COUNTER
// =============================================================================

export class Counter {
  private name: string;
  private unit: MetricUnit;
  private description: string;
  private labels: string[];
  private values: Map<string, number> = new Map();
  private points: Map<string, MetricPoint[]> = new Map();
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector, definition: MetricDefinition) {
    this.collector = collector;
    this.name = definition.name;
    this.unit = definition.unit ?? "count";
    this.description = definition.description ?? "";
    this.labels = definition.labels ?? [];
  }

  private getKey(labels: Record<string, string>): string {
    return JSON.stringify(labels);
  }

  inc(labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.getKey(labels);
    const current = this.values.get(key) ?? 0;
    const newValue = current + value;
    this.values.set(key, newValue);

    const point: MetricPoint = {
      timestamp: Date.now(),
      value: newValue,
      labels,
    };

    const pointsList = this.points.get(key) ?? [];
    pointsList.push(point);
    this.points.set(key, pointsList);

    this.collector.recordMetric(this.getData());
  }

  getValue(labels: Record<string, string> = {}): number {
    return this.values.get(this.getKey(labels)) ?? 0;
  }

  getData(): MetricData {
    const allPoints: MetricPoint[] = [];
    for (const points of this.points.values()) {
      allPoints.push(...points);
    }

    return {
      name: this.name,
      type: "counter",
      unit: this.unit,
      description: this.description,
      points: allPoints,
      resource: this.collector.getResource(),
    };
  }

  reset(): void {
    this.values.clear();
    this.points.clear();
  }
}

// =============================================================================
// GAUGE
// =============================================================================

export class Gauge {
  private name: string;
  private unit: MetricUnit;
  private description: string;
  private labels: string[];
  private values: Map<string, number> = new Map();
  private points: Map<string, MetricPoint[]> = new Map();
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector, definition: MetricDefinition) {
    this.collector = collector;
    this.name = definition.name;
    this.unit = definition.unit ?? "none";
    this.description = definition.description ?? "";
    this.labels = definition.labels ?? [];
  }

  private getKey(labels: Record<string, string>): string {
    return JSON.stringify(labels);
  }

  set(value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(labels);
    this.values.set(key, value);

    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      labels,
    };

    const pointsList = this.points.get(key) ?? [];
    pointsList.push(point);
    this.points.set(key, pointsList);

    this.collector.recordMetric(this.getData());
  }

  inc(labels: Record<string, string> = {}, value: number = 1): void {
    const current = this.getValue(labels);
    this.set(current + value, labels);
  }

  dec(labels: Record<string, string> = {}, value: number = 1): void {
    const current = this.getValue(labels);
    this.set(current - value, labels);
  }

  getValue(labels: Record<string, string> = {}): number {
    return this.values.get(this.getKey(labels)) ?? 0;
  }

  getData(): MetricData {
    const allPoints: MetricPoint[] = [];
    for (const points of this.points.values()) {
      allPoints.push(...points);
    }

    return {
      name: this.name,
      type: "gauge",
      unit: this.unit,
      description: this.description,
      points: allPoints,
      resource: this.collector.getResource(),
    };
  }

  reset(): void {
    this.values.clear();
    this.points.clear();
  }
}

// =============================================================================
// HISTOGRAM
// =============================================================================

export class Histogram {
  private name: string;
  private unit: MetricUnit;
  private description: string;
  private labels: string[];
  private buckets: number[];
  private data: Map<string, HistogramData> = new Map();
  private points: Map<string, MetricPoint[]> = new Map();
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector, definition: MetricDefinition) {
    this.collector = collector;
    this.name = definition.name;
    this.unit = definition.unit ?? "ms";
    this.description = definition.description ?? "";
    this.labels = definition.labels ?? [];
    this.buckets = definition.buckets ?? [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  }

  private getKey(labels: Record<string, string>): string {
    return JSON.stringify(labels);
  }

  private getOrCreateData(key: string): HistogramData {
    let data = this.data.get(key);
    if (!data) {
      data = {
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
        counts: new Array(this.buckets.length + 1).fill(0),
      };
      this.data.set(key, data);
    }
    return data;
  }

  observe(value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(labels);
    const data = this.getOrCreateData(key);

    data.sum += value;
    data.count++;
    data.min = Math.min(data.min, value);
    data.max = Math.max(data.max, value);

    // Find bucket
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        data.counts[i]++;
        break;
      }
    }
    // +Inf bucket
    if (value > this.buckets[this.buckets.length - 1]) {
      data.counts[this.buckets.length]++;
    }

    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      labels,
    };

    const pointsList = this.points.get(key) ?? [];
    pointsList.push(point);
    this.points.set(key, pointsList);

    this.collector.recordMetric(this.getData());
  }

  /**
   * Time a function execution
   */
  async time<T>(fn: () => Promise<T>, labels: Record<string, string> = {}): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.observe(duration, labels);
    }
  }

  /**
   * Start a timer that returns a function to stop
   */
  startTimer(labels: Record<string, string> = {}): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.observe(duration, labels);
      return duration;
    };
  }

  getBuckets(labels: Record<string, string> = {}): HistogramBuckets | null {
    const key = this.getKey(labels);
    const data = this.data.get(key);
    if (!data) return null;

    return {
      boundaries: this.buckets,
      counts: data.counts,
      sum: data.sum,
      count: data.count,
      min: data.min === Infinity ? undefined : data.min,
      max: data.max === -Infinity ? undefined : data.max,
    };
  }

  getPercentile(percentile: number, labels: Record<string, string> = {}): number | null {
    const key = this.getKey(labels);
    const data = this.data.get(key);
    if (!data || data.count === 0) return null;

    const targetCount = Math.ceil((percentile / 100) * data.count);
    let cumulative = 0;

    for (let i = 0; i < data.counts.length; i++) {
      cumulative += data.counts[i];
      if (cumulative >= targetCount) {
        return i < this.buckets.length ? this.buckets[i] : this.buckets[this.buckets.length - 1];
      }
    }

    return this.buckets[this.buckets.length - 1];
  }

  getData(): MetricData {
    const allPoints: MetricPoint[] = [];
    for (const points of this.points.values()) {
      allPoints.push(...points);
    }

    // Get histogram data for first label set
    const firstKey = this.data.keys().next().value;
    const histogram = firstKey ? this.getBuckets(JSON.parse(firstKey)) ?? undefined : undefined;

    return {
      name: this.name,
      type: "histogram",
      unit: this.unit,
      description: this.description,
      points: allPoints,
      histogram,
      resource: this.collector.getResource(),
    };
  }

  reset(): void {
    this.data.clear();
    this.points.clear();
  }
}

interface HistogramData {
  sum: number;
  count: number;
  min: number;
  max: number;
  counts: number[];
}

// =============================================================================
// METRICS COLLECTOR
// =============================================================================

export class MetricsCollector extends EventEmitter<ObservabilityEvents> {
  private config: ObservabilityConfig;
  private definitions: Map<string, MetricDefinition> = new Map();
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private metricData: Map<string, MetricData> = new Map();
  private collectInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    super();
    this.config = {
      serviceName: config.serviceName ?? "integration-hub",
      serviceVersion: config.serviceVersion,
      environment: config.environment ?? "development",
      tracing: { enabled: true, sampler: { type: "always_on", ratio: 1, parentBased: true }, maxSpanAttributes: 128, maxSpanEvents: 128, maxSpanLinks: 128, ...config.tracing },
      metrics: {
        enabled: true,
        collectInterval: 60000,
        defaultBuckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        ...config.metrics,
      },
      logging: { enabled: true, minSeverity: "INFO", includeTraceContext: true, ...config.logging },
      resource: { attributes: {}, ...config.resource },
      retention: { traces: 86400000, metrics: 604800000, logs: 86400000, ...config.retention },
    };

    // Register built-in metrics
    for (const metric of BUILTIN_METRICS) {
      this.register(metric);
    }

    // Start collection interval
    if (this.config.metrics.enabled) {
      this.startCollection();
    }
  }

  getResource() {
    return {
      serviceName: this.config.serviceName,
      environment: this.config.environment,
    };
  }

  /**
   * Register a metric definition
   */
  register(definition: MetricDefinition): void {
    this.definitions.set(definition.name, definition);
  }

  /**
   * Get or create a counter
   */
  counter(name: string, options: Partial<MetricDefinition> = {}): Counter {
    let counter = this.counters.get(name);
    if (!counter) {
      const definition: MetricDefinition = {
        name,
        type: "counter",
        unit: options.unit ?? "count",
        description: options.description,
        labels: options.labels ?? [],
      };
      this.register(definition);
      counter = new Counter(this, definition);
      this.counters.set(name, counter);
    }
    return counter;
  }

  /**
   * Get or create a gauge
   */
  gauge(name: string, options: Partial<MetricDefinition> = {}): Gauge {
    let gauge = this.gauges.get(name);
    if (!gauge) {
      const definition: MetricDefinition = {
        name,
        type: "gauge",
        unit: options.unit ?? "none",
        description: options.description,
        labels: options.labels ?? [],
      };
      this.register(definition);
      gauge = new Gauge(this, definition);
      this.gauges.set(name, gauge);
    }
    return gauge;
  }

  /**
   * Get or create a histogram
   */
  histogram(name: string, options: Partial<MetricDefinition> = {}): Histogram {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      const definition: MetricDefinition = {
        name,
        type: "histogram",
        unit: options.unit ?? "ms",
        description: options.description,
        labels: options.labels ?? [],
        buckets: options.buckets ?? this.config.metrics.defaultBuckets,
      };
      this.register(definition);
      histogram = new Histogram(this, definition);
      this.histograms.set(name, histogram);
    }
    return histogram;
  }

  /**
   * Record a metric data point (internal)
   */
  recordMetric(data: MetricData): void {
    this.metricData.set(data.name, data);
    this.emit("metric:recorded", data);
  }

  /**
   * Get all metric data
   */
  getAllMetrics(): MetricData[] {
    return Array.from(this.metricData.values());
  }

  /**
   * Get specific metric data
   */
  getMetric(name: string): MetricData | undefined {
    return this.metricData.get(name);
  }

  /**
   * Query metrics
   */
  query(query: MetricQuery): MetricPoint[] {
    const metric = this.metricData.get(query.name);
    if (!metric) return [];

    let points = metric.points;

    // Filter by labels
    if (query.labels) {
      points = points.filter(p => {
        return Object.entries(query.labels!).every(
          ([key, value]) => p.labels[key] === value
        );
      });
    }

    // Filter by time range
    if (query.startTime) {
      points = points.filter(p => p.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      points = points.filter(p => p.timestamp <= query.endTime!);
    }

    // Apply aggregation
    if (query.aggregation && query.step) {
      points = this.aggregatePoints(points, query.aggregation, query.step);
    }

    return points;
  }

  private aggregatePoints(
    points: MetricPoint[],
    aggregation: "sum" | "avg" | "min" | "max" | "count" | "rate",
    step: number
  ): MetricPoint[] {
    if (points.length === 0) return [];

    // Group points by time bucket
    const buckets: Map<number, MetricPoint[]> = new Map();
    for (const point of points) {
      const bucket = Math.floor(point.timestamp / step) * step;
      const bucketPoints = buckets.get(bucket) ?? [];
      bucketPoints.push(point);
      buckets.set(bucket, bucketPoints);
    }

    // Aggregate each bucket
    const results: MetricPoint[] = [];
    for (const [timestamp, bucketPoints] of buckets) {
      const values = bucketPoints.map(p => p.value);
      let value: number;

      switch (aggregation) {
        case "sum":
          value = values.reduce((a, b) => a + b, 0);
          break;
        case "avg":
          value = values.reduce((a, b) => a + b, 0) / values.length;
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
        case "rate":
          value = values.reduce((a, b) => a + b, 0) / (step / 1000);
          break;
      }

      results.push({
        timestamp,
        value,
        labels: {},
      });
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get metrics summary
   */
  getSummary(): MetricsSummary {
    const metrics = this.getAllMetrics();
    const byType: Record<string, number> = {};

    for (const metric of metrics) {
      byType[metric.type] = (byType[metric.type] ?? 0) + 1;
    }

    const topMetrics = metrics
      .map(m => ({
        name: m.name,
        type: m.type,
        pointCount: m.points.length,
        lastValue: m.points.length > 0 ? m.points[m.points.length - 1].value : 0,
      }))
      .sort((a, b) => b.pointCount - a.pointCount)
      .slice(0, 10);

    return {
      totalMetrics: metrics.length,
      totalPoints: metrics.reduce((sum, m) => sum + m.points.length, 0),
      metricsByType: byType,
      topMetrics,
    };
  }

  /**
   * Start periodic collection
   */
  private startCollection(): void {
    this.collectInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metrics.collectInterval);
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memory = process.memoryUsage();
      const memoryGauge = this.gauge("memory_usage_bytes");
      memoryGauge.set(memory.heapUsed, { type: "heap_used" });
      memoryGauge.set(memory.heapTotal, { type: "heap_total" });
      memoryGauge.set(memory.external, { type: "external" });
      memoryGauge.set(memory.rss, { type: "rss" });
    }
  }

  /**
   * Stop collection
   */
  stop(): void {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = undefined;
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.reset();
    }
    for (const gauge of this.gauges.values()) {
      gauge.reset();
    }
    for (const histogram of this.histograms.values()) {
      histogram.reset();
    }
    this.metricData.clear();
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(): string {
    const lines: string[] = [];

    for (const metric of this.getAllMetrics()) {
      // Add HELP line
      if (metric.description) {
        lines.push(`# HELP ${metric.name} ${metric.description}`);
      }

      // Add TYPE line
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      // Add data points
      if (metric.type === "histogram" && metric.histogram) {
        const h = metric.histogram;
        for (let i = 0; i < h.boundaries.length; i++) {
          lines.push(`${metric.name}_bucket{le="${h.boundaries[i]}"} ${h.counts[i]}`);
        }
        lines.push(`${metric.name}_bucket{le="+Inf"} ${h.counts[h.boundaries.length]}`);
        lines.push(`${metric.name}_sum ${h.sum}`);
        lines.push(`${metric.name}_count ${h.count}`);
      } else {
        for (const point of metric.points) {
          const labels = Object.entries(point.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(",");
          const labelStr = labels ? `{${labels}}` : "";
          lines.push(`${metric.name}${labelStr} ${point.value}`);
        }
      }

      lines.push("");
    }

    return lines.join("\n");
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let metricsInstance: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector | null {
  return metricsInstance;
}

export function createMetricsCollector(config?: Partial<ObservabilityConfig>): MetricsCollector {
  metricsInstance = new MetricsCollector(config);
  return metricsInstance;
}
