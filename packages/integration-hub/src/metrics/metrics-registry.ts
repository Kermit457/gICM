/**
 * Metrics Registry Implementation
 * Phase 14C: Metrics Registry
 */

import { EventEmitter } from "eventemitter3";
import {
  type MetricsRegistryConfig,
  MetricsRegistryConfigSchema,
  type MetricDef,
  type MetricSample,
  type MetricValue,
  type HistogramValue,
  type SummaryValue,
  type Label,
  type ExportFormat,
  type MetricsEvents,
  type TimeSeries,
  DEFAULT_METRICS,
} from "./types.js";

// =============================================================================
// Helper Functions
// =============================================================================

function labelHash(labels: Label): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
}

function labelsMatch(actual: Label, query: Label): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (actual[key] !== value) return false;
  }
  return true;
}

// =============================================================================
// Counter
// =============================================================================

export class Counter {
  private values = new Map<string, number>();

  constructor(
    private registry: MetricsRegistry,
    private def: MetricDef
  ) {}

  inc(labels: Label = {}, value: number = 1): void {
    if (value < 0) {
      throw new Error("Counter value cannot be negative");
    }

    const hash = labelHash(labels);
    const current = this.values.get(hash) ?? 0;
    this.values.set(hash, current + value);
    this.registry["emit"]("metricUpdated", this.def.name, labels, current + value);
  }

  get(labels: Label = {}): number {
    return this.values.get(labelHash(labels)) ?? 0;
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricValue[] {
    const result: MetricValue[] = [];
    for (const [hash, value] of this.values) {
      const labels = this.parseLabels(hash);
      result.push({ value, labels, timestamp: Date.now() });
    }
    return result;
  }

  private parseLabels(hash: string): Label {
    if (!hash) return {};
    const labels: Label = {};
    for (const pair of hash.split(",")) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// =============================================================================
// Gauge
// =============================================================================

export class Gauge {
  private values = new Map<string, number>();

  constructor(
    private registry: MetricsRegistry,
    private def: MetricDef
  ) {}

  set(labels: Label, value: number): void;
  set(value: number): void;
  set(labelsOrValue: Label | number, maybeValue?: number): void {
    const labels = typeof labelsOrValue === "object" ? labelsOrValue : {};
    const value = typeof labelsOrValue === "number" ? labelsOrValue : maybeValue!;

    const hash = labelHash(labels);
    this.values.set(hash, value);
    this.registry["emit"]("metricUpdated", this.def.name, labels, value);
  }

  inc(labels: Label = {}, value: number = 1): void {
    const hash = labelHash(labels);
    const current = this.values.get(hash) ?? 0;
    this.values.set(hash, current + value);
  }

  dec(labels: Label = {}, value: number = 1): void {
    const hash = labelHash(labels);
    const current = this.values.get(hash) ?? 0;
    this.values.set(hash, current - value);
  }

  get(labels: Label = {}): number {
    return this.values.get(labelHash(labels)) ?? 0;
  }

  setToCurrentTime(labels: Label = {}): void {
    this.set(labels, Date.now() / 1000);
  }

  reset(): void {
    this.values.clear();
  }

  collect(): MetricValue[] {
    const result: MetricValue[] = [];
    for (const [hash, value] of this.values) {
      const labels = this.parseLabels(hash);
      result.push({ value, labels, timestamp: Date.now() });
    }
    return result;
  }

  private parseLabels(hash: string): Label {
    if (!hash) return {};
    const labels: Label = {};
    for (const pair of hash.split(",")) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// =============================================================================
// Histogram
// =============================================================================

export class Histogram {
  private data = new Map<string, {
    buckets: Map<number, number>;
    sum: number;
    count: number;
  }>();
  private buckets: number[];

  constructor(
    private registry: MetricsRegistry,
    private def: MetricDef
  ) {
    this.buckets = def.buckets ?? [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  observe(labels: Label, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: Label | number, maybeValue?: number): void {
    const labels = typeof labelsOrValue === "object" ? labelsOrValue : {};
    const value = typeof labelsOrValue === "number" ? labelsOrValue : maybeValue!;

    const hash = labelHash(labels);
    let data = this.data.get(hash);

    if (!data) {
      data = {
        buckets: new Map(this.buckets.map(b => [b, 0])),
        sum: 0,
        count: 0,
      };
      this.data.set(hash, data);
    }

    // Update buckets
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        data.buckets.set(bucket, (data.buckets.get(bucket) ?? 0) + 1);
      }
    }

    data.sum += value;
    data.count += 1;

    this.registry["emit"]("metricUpdated", this.def.name, labels, value);
  }

  startTimer(labels: Label = {}): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9; // Convert to seconds
      this.observe(labels, duration);
      return duration;
    };
  }

  reset(): void {
    this.data.clear();
  }

  collect(): HistogramValue[] {
    const result: HistogramValue[] = [];
    for (const [hash, data] of this.data) {
      const labels = this.parseLabels(hash);
      const buckets: Record<string, number> = {};

      // Add +Inf bucket
      let total = 0;
      for (const [boundary, count] of data.buckets) {
        total += count;
        buckets[String(boundary)] = total;
      }
      buckets["+Inf"] = data.count;

      result.push({
        buckets,
        sum: data.sum,
        count: data.count,
        labels,
        timestamp: Date.now(),
      });
    }
    return result;
  }

  private parseLabels(hash: string): Label {
    if (!hash) return {};
    const labels: Label = {};
    for (const pair of hash.split(",")) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// =============================================================================
// Summary
// =============================================================================

export class Summary {
  private data = new Map<string, {
    values: number[];
    sum: number;
    count: number;
  }>();
  private quantiles: number[];
  private maxAge: number;

  constructor(
    private registry: MetricsRegistry,
    private def: MetricDef
  ) {
    this.quantiles = def.quantiles ?? [0.5, 0.9, 0.95, 0.99];
    this.maxAge = def.maxAge ?? 600000; // 10 minutes default
  }

  observe(labels: Label, value: number): void;
  observe(value: number): void;
  observe(labelsOrValue: Label | number, maybeValue?: number): void {
    const labels = typeof labelsOrValue === "object" ? labelsOrValue : {};
    const value = typeof labelsOrValue === "number" ? labelsOrValue : maybeValue!;

    const hash = labelHash(labels);
    let data = this.data.get(hash);

    if (!data) {
      data = { values: [], sum: 0, count: 0 };
      this.data.set(hash, data);
    }

    data.values.push(value);
    data.sum += value;
    data.count += 1;

    // Trim old values (simplified - real implementation would use time-based windows)
    if (data.values.length > 10000) {
      data.values = data.values.slice(-5000);
    }

    this.registry["emit"]("metricUpdated", this.def.name, labels, value);
  }

  startTimer(labels: Label = {}): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1e9;
      this.observe(labels, duration);
      return duration;
    };
  }

  reset(): void {
    this.data.clear();
  }

  collect(): SummaryValue[] {
    const result: SummaryValue[] = [];
    for (const [hash, data] of this.data) {
      const labels = this.parseLabels(hash);
      const sorted = [...data.values].sort((a, b) => a - b);
      const quantiles: Record<string, number> = {};

      for (const q of this.quantiles) {
        const index = Math.floor(q * sorted.length);
        quantiles[String(q)] = sorted[index] ?? 0;
      }

      result.push({
        quantiles,
        sum: data.sum,
        count: data.count,
        labels,
        timestamp: Date.now(),
      });
    }
    return result;
  }

  private parseLabels(hash: string): Label {
    if (!hash) return {};
    const labels: Label = {};
    for (const pair of hash.split(",")) {
      const match = pair.match(/^([^=]+)="([^"]*)"$/);
      if (match) {
        labels[match[1]] = match[2];
      }
    }
    return labels;
  }
}

// =============================================================================
// Metrics Registry
// =============================================================================

export class MetricsRegistry extends EventEmitter<MetricsEvents> {
  private config: MetricsRegistryConfig;
  private metrics = new Map<string, Counter | Gauge | Histogram | Summary>();
  private definitions = new Map<string, MetricDef>();
  private collectors: Array<{ name: string; collect: () => Promise<MetricSample[]> }> = [];
  private defaultMetricsInterval?: ReturnType<typeof setInterval>;
  private pushInterval?: ReturnType<typeof setInterval>;
  private timeSeries = new Map<string, TimeSeries>();

  constructor(config: Partial<MetricsRegistryConfig> = {}) {
    super();
    this.config = MetricsRegistryConfigSchema.parse(config);

    // Register default metrics
    if (this.config.enableDefaultMetrics) {
      for (const def of DEFAULT_METRICS) {
        this.registerMetric(def);
      }
      this.startDefaultMetrics();
    }

    // Start push gateway
    if (this.config.pushGateway) {
      this.startPushGateway();
    }
  }

  // ---------------------------------------------------------------------------
  // Metric Registration
  // ---------------------------------------------------------------------------

  registerMetric(def: MetricDef): Counter | Gauge | Histogram | Summary {
    const name = this.prefixName(def.name);
    const fullDef = { ...def, name };

    if (this.metrics.has(name)) {
      throw new Error(`Metric '${name}' already registered`);
    }

    let metric: Counter | Gauge | Histogram | Summary;

    switch (def.kind) {
      case "counter":
        metric = new Counter(this, fullDef);
        break;
      case "gauge":
        metric = new Gauge(this, fullDef);
        break;
      case "histogram":
        metric = new Histogram(this, fullDef);
        break;
      case "summary":
        metric = new Summary(this, fullDef);
        break;
    }

    this.metrics.set(name, metric);
    this.definitions.set(name, fullDef);
    this.emit("metricRegistered", fullDef);

    return metric;
  }

  counter(name: string, help: string, labelNames: string[] = []): Counter {
    return this.registerMetric({
      name,
      kind: "counter",
      help,
      labelNames,
    }) as Counter;
  }

  gauge(name: string, help: string, labelNames: string[] = []): Gauge {
    return this.registerMetric({
      name,
      kind: "gauge",
      help,
      labelNames,
    }) as Gauge;
  }

  histogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[]
  ): Histogram {
    return this.registerMetric({
      name,
      kind: "histogram",
      help,
      labelNames,
      buckets: buckets ?? this.config.buckets?.default,
    }) as Histogram;
  }

  summary(
    name: string,
    help: string,
    labelNames: string[] = [],
    quantiles?: number[]
  ): Summary {
    return this.registerMetric({
      name,
      kind: "summary",
      help,
      labelNames,
      quantiles: quantiles ?? this.config.quantiles,
    }) as Summary;
  }

  // ---------------------------------------------------------------------------
  // Metric Access
  // ---------------------------------------------------------------------------

  getMetric(name: string): Counter | Gauge | Histogram | Summary | undefined {
    return this.metrics.get(this.prefixName(name));
  }

  removeMetric(name: string): boolean {
    const fullName = this.prefixName(name);
    if (this.metrics.has(fullName)) {
      this.metrics.delete(fullName);
      this.definitions.delete(fullName);
      this.emit("metricRemoved", fullName);
      return true;
    }
    return false;
  }

  resetMetrics(): void {
    for (const metric of this.metrics.values()) {
      metric.reset();
    }
  }

  // ---------------------------------------------------------------------------
  // Collectors
  // ---------------------------------------------------------------------------

  registerCollector(
    name: string,
    collect: () => Promise<MetricSample[]>
  ): void {
    this.collectors.push({ name, collect });
  }

  removeCollector(name: string): boolean {
    const index = this.collectors.findIndex(c => c.name === name);
    if (index >= 0) {
      this.collectors.splice(index, 1);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Collection
  // ---------------------------------------------------------------------------

  async collect(): Promise<MetricSample[]> {
    this.emit("collectionStarted");

    const samples: MetricSample[] = [];

    // Collect from registered metrics
    for (const [name, metric] of this.metrics) {
      const def = this.definitions.get(name)!;
      const values = metric.collect();

      // Add default labels
      for (const value of values) {
        value.labels = { ...this.config.defaultLabels, ...value.labels };
      }

      samples.push({
        name,
        kind: def.kind,
        help: def.help,
        unit: def.unit,
        values,
      });
    }

    // Collect from custom collectors
    for (const collector of this.collectors) {
      try {
        const collectorSamples = await collector.collect();
        samples.push(...collectorSamples);
      } catch (error) {
        this.emit("error", error as Error);
      }
    }

    this.emit("collectionCompleted", samples);
    return samples;
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  async export(format: ExportFormat = "prometheus"): Promise<string> {
    const samples = await this.collect();

    switch (format) {
      case "prometheus":
      case "openmetrics":
        return this.formatPrometheus(samples, format === "openmetrics");
      case "json":
        return JSON.stringify(samples, null, 2);
      case "statsd":
        return this.formatStatsd(samples);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  private formatPrometheus(samples: MetricSample[], openMetrics: boolean): string {
    const lines: string[] = [];

    for (const sample of samples) {
      // Type and help
      lines.push(`# HELP ${sample.name} ${sample.help}`);
      lines.push(`# TYPE ${sample.name} ${sample.kind}`);

      if (sample.unit && openMetrics) {
        lines.push(`# UNIT ${sample.name} ${sample.unit}`);
      }

      for (const value of sample.values) {
        if ("buckets" in value) {
          // Histogram
          const hv = value as HistogramValue;
          const labelsStr = this.formatLabels(hv.labels);

          for (const [le, count] of Object.entries(hv.buckets)) {
            const bucketLabels = labelsStr ? `{${labelsStr},le="${le}"}` : `{le="${le}"}`;
            lines.push(`${sample.name}_bucket${bucketLabels} ${count}`);
          }

          const baseLabels = labelsStr ? `{${labelsStr}}` : "";
          lines.push(`${sample.name}_sum${baseLabels} ${hv.sum}`);
          lines.push(`${sample.name}_count${baseLabels} ${hv.count}`);
        } else if ("quantiles" in value) {
          // Summary
          const sv = value as SummaryValue;
          const labelsStr = this.formatLabels(sv.labels);

          for (const [q, v] of Object.entries(sv.quantiles)) {
            const quantileLabels = labelsStr ? `{${labelsStr},quantile="${q}"}` : `{quantile="${q}"}`;
            lines.push(`${sample.name}${quantileLabels} ${v}`);
          }

          const baseLabels = labelsStr ? `{${labelsStr}}` : "";
          lines.push(`${sample.name}_sum${baseLabels} ${sv.sum}`);
          lines.push(`${sample.name}_count${baseLabels} ${sv.count}`);
        } else {
          // Counter or Gauge
          const mv = value as MetricValue;
          const labelsStr = this.formatLabels(mv.labels);
          const labelPart = labelsStr ? `{${labelsStr}}` : "";
          lines.push(`${sample.name}${labelPart} ${mv.value}`);
        }
      }

      lines.push("");
    }

    if (openMetrics) {
      lines.push("# EOF");
    }

    return lines.join("\n");
  }

  private formatStatsd(samples: MetricSample[]): string {
    const lines: string[] = [];

    for (const sample of samples) {
      for (const value of sample.values) {
        const tags = Object.entries((value as MetricValue).labels)
          .map(([k, v]) => `${k}:${v}`)
          .join(",");

        const tagPart = tags ? `|#${tags}` : "";

        if ("buckets" in value || "quantiles" in value) {
          // Skip complex types for statsd
          continue;
        }

        const mv = value as MetricValue;
        const type = sample.kind === "counter" ? "c" : "g";
        lines.push(`${sample.name}:${mv.value}|${type}${tagPart}`);
      }
    }

    return lines.join("\n");
  }

  private formatLabels(labels: Label): string {
    return Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  // ---------------------------------------------------------------------------
  // Default Metrics
  // ---------------------------------------------------------------------------

  private startDefaultMetrics(): void {
    const collectDefaultMetrics = () => {
      const memUsage = process.memoryUsage();

      const residentMem = this.getMetric("process_resident_memory_bytes") as Gauge;
      if (residentMem) residentMem.set(memUsage.rss);

      const heapTotal = this.getMetric("nodejs_heap_size_total_bytes") as Gauge;
      if (heapTotal) heapTotal.set(memUsage.heapTotal);

      const heapUsed = this.getMetric("nodejs_heap_size_used_bytes") as Gauge;
      if (heapUsed) heapUsed.set(memUsage.heapUsed);

      const external = this.getMetric("nodejs_external_memory_bytes") as Gauge;
      if (external) external.set(memUsage.external);

      const heapBytes = this.getMetric("process_heap_bytes") as Gauge;
      if (heapBytes) heapBytes.set(memUsage.heapUsed);

      // Process start time
      const startTime = this.getMetric("process_start_time_seconds") as Gauge;
      if (startTime) startTime.set(Date.now() / 1000 - process.uptime());
    };

    // Collect immediately and then at intervals
    collectDefaultMetrics();
    this.defaultMetricsInterval = setInterval(
      collectDefaultMetrics,
      this.config.defaultMetricsInterval
    );
  }

  // ---------------------------------------------------------------------------
  // Push Gateway
  // ---------------------------------------------------------------------------

  private startPushGateway(): void {
    const push = async () => {
      this.emit("pushStarted");
      try {
        const metrics = await this.export("prometheus");
        // In real implementation, would POST to push gateway
        console.log(`[Push Gateway] Would push metrics to ${this.config.pushGateway!.url}`);
        this.emit("pushCompleted", true);
      } catch (error) {
        this.emit("pushError", error as Error);
        this.emit("pushCompleted", false);
      }
    };

    this.pushInterval = setInterval(push, this.config.pushGateway!.pushInterval);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private prefixName(name: string): string {
    if (this.config.prefix && !name.startsWith(this.config.prefix)) {
      return `${this.config.prefix}_${name}`;
    }
    return name;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async shutdown(): Promise<void> {
    if (this.defaultMetricsInterval) {
      clearInterval(this.defaultMetricsInterval);
    }
    if (this.pushInterval) {
      clearInterval(this.pushInterval);
    }
    this.removeAllListeners();
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultRegistry: MetricsRegistry | null = null;

export function getMetricsRegistry(): MetricsRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new MetricsRegistry();
  }
  return defaultRegistry;
}

export function createMetricsRegistry(
  config: Partial<MetricsRegistryConfig> = {}
): MetricsRegistry {
  const registry = new MetricsRegistry(config);
  if (!defaultRegistry) {
    defaultRegistry = registry;
  }
  return registry;
}
