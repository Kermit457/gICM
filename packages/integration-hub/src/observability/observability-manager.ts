/**
 * Observability Manager
 * Phase 12D: Unified observability orchestration
 */

import { EventEmitter } from "eventemitter3";
import { Tracer, createTracer, getTracer, type SpanBuilder, type SpanOptions } from "./tracer.js";
import { MetricsCollector, createMetricsCollector, getMetricsCollector, Counter, Gauge, Histogram } from "./metrics.js";
import { Logger, createLogger, getLogger } from "./logger.js";
import type {
  ObservabilityConfig,
  ObservabilityEvents,
  ObservabilitySummary,
  TraceQuery,
  MetricQuery,
  LogQuery,
  Trace,
  MetricData,
  LogRecord,
  TraceContext,
} from "./types.js";

// =============================================================================
// OBSERVABILITY MANAGER
// =============================================================================

export class ObservabilityManager extends EventEmitter<ObservabilityEvents> {
  private config: ObservabilityConfig;
  private tracer: Tracer;
  private metrics: MetricsCollector;
  private logger: Logger;
  private startTime: number;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    super();

    this.startTime = Date.now();
    this.config = {
      serviceName: config.serviceName ?? "integration-hub",
      serviceVersion: config.serviceVersion,
      environment: config.environment ?? "development",
      tracing: {
        enabled: true,
        sampler: { type: "always_on", ratio: 1, parentBased: true },
        maxSpanAttributes: 128,
        maxSpanEvents: 128,
        maxSpanLinks: 128,
        ...config.tracing,
      },
      metrics: {
        enabled: true,
        collectInterval: 60000,
        defaultBuckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        ...config.metrics,
      },
      logging: {
        enabled: true,
        minSeverity: "INFO",
        includeTraceContext: true,
        ...config.logging,
      },
      resource: { attributes: {}, ...config.resource },
      retention: {
        traces: 24 * 60 * 60 * 1000,
        metrics: 7 * 24 * 60 * 60 * 1000,
        logs: 24 * 60 * 60 * 1000,
        ...config.retention,
      },
    };

    // Initialize components
    this.tracer = createTracer(this.config);
    this.metrics = createMetricsCollector(this.config);
    this.logger = createLogger(this.config);

    // Forward events
    this.tracer.on("span:started", (span) => this.emit("span:started", span));
    this.tracer.on("span:ended", (span) => this.emit("span:ended", span));
    this.tracer.on("trace:completed", (trace) => this.emit("trace:completed", trace));

    this.metrics.on("metric:recorded", (metric) => this.emit("metric:recorded", metric));

    this.logger.on("log:recorded", (log) => this.emit("log:recorded", log));

    // Log startup
    this.logger.info("Observability manager started", {
      serviceName: this.config.serviceName,
      environment: this.config.environment,
    });
  }

  // ===========================================================================
  // TRACING
  // ===========================================================================

  /**
   * Start a new span
   */
  startSpan(name: string, options?: SpanOptions): SpanBuilder {
    return this.tracer.startSpan(name, options);
  }

  /**
   * Create a child span
   */
  startChildSpan(name: string, parentContext: TraceContext, options?: Omit<SpanOptions, "context">): SpanBuilder {
    return this.tracer.startChildSpan(name, parentContext, options);
  }

  /**
   * Trace an async function
   */
  async trace<T>(
    name: string,
    fn: (span: SpanBuilder) => Promise<T>,
    options?: SpanOptions
  ): Promise<T> {
    return this.tracer.trace(name, fn, options);
  }

  /**
   * Get a trace by ID
   */
  getTrace(traceId: string): Trace | null {
    return this.tracer.getTrace(traceId);
  }

  /**
   * Search traces
   */
  searchTraces(query: Omit<TraceQuery, "traceId">): Trace[] {
    return this.tracer.searchTraces(query);
  }

  // ===========================================================================
  // METRICS
  // ===========================================================================

  /**
   * Get or create a counter
   */
  counter(name: string, options?: { unit?: string; description?: string; labels?: string[] }): Counter {
    return this.metrics.counter(name, options as any);
  }

  /**
   * Get or create a gauge
   */
  gauge(name: string, options?: { unit?: string; description?: string; labels?: string[] }): Gauge {
    return this.metrics.gauge(name, options as any);
  }

  /**
   * Get or create a histogram
   */
  histogram(name: string, options?: { unit?: string; description?: string; labels?: string[]; buckets?: number[] }): Histogram {
    return this.metrics.histogram(name, options as any);
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
    const counter = this.metrics.counter(name);
    counter.inc(labels, value);
  }

  /**
   * Query metrics
   */
  queryMetrics(query: MetricQuery): MetricData | undefined {
    return this.metrics.getMetric(query.name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricData[] {
    return this.metrics.getAllMetrics();
  }

  /**
   * Export metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    return this.metrics.toPrometheus();
  }

  // ===========================================================================
  // LOGGING
  // ===========================================================================

  /**
   * Set log context (trace ID, span ID)
   */
  setLogContext(context: TraceContext | undefined): void {
    this.logger.setContext(context);
  }

  /**
   * Log at trace level
   */
  logTrace(message: string, attributes?: Record<string, string | number | boolean>): void {
    this.logger.trace(message, attributes);
  }

  /**
   * Log at debug level
   */
  logDebug(message: string, attributes?: Record<string, string | number | boolean>): void {
    this.logger.debug(message, attributes);
  }

  /**
   * Log at info level
   */
  logInfo(message: string, attributes?: Record<string, string | number | boolean>): void {
    this.logger.info(message, attributes);
  }

  /**
   * Log at warn level
   */
  logWarn(message: string, attributes?: Record<string, string | number | boolean>): void {
    this.logger.warn(message, attributes);
  }

  /**
   * Log at error level
   */
  logError(message: string, error?: Error, attributes?: Record<string, string | number | boolean>): void {
    this.logger.error(message, error, attributes);
  }

  /**
   * Log at fatal level
   */
  logFatal(message: string, error?: Error, attributes?: Record<string, string | number | boolean>): void {
    this.logger.fatal(message, error, attributes);
  }

  /**
   * Query logs
   */
  queryLogs(query: LogQuery): LogRecord[] {
    return this.logger.query(query);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogRecord[] {
    return this.logger.getAllLogs();
  }

  // ===========================================================================
  // SUMMARY & STATS
  // ===========================================================================

  /**
   * Get observability summary
   */
  getSummary(): ObservabilitySummary {
    const traceStats = this.tracer.getStats();
    const metricsSummary = this.metrics.getSummary();

    // Calculate trace summary
    const traces = this.searchTraces({ limit: 1000 });
    const durations = traces.map(t => t.duration ?? 0).filter(d => d > 0);
    const sortedDurations = durations.sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    // Top services
    const serviceMap = new Map<string, { count: number; totalDuration: number }>();
    for (const trace of traces) {
      const entry = serviceMap.get(trace.serviceName) ?? { count: 0, totalDuration: 0 };
      entry.count++;
      entry.totalDuration += trace.duration ?? 0;
      serviceMap.set(trace.serviceName, entry);
    }

    const topServices = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name,
        traceCount: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      }))
      .sort((a, b) => b.traceCount - a.traceCount)
      .slice(0, 10);

    // Top operations
    const opMap = new Map<string, { count: number; totalDuration: number; errors: number }>();
    for (const trace of traces) {
      const entry = opMap.get(trace.operationName) ?? { count: 0, totalDuration: 0, errors: 0 };
      entry.count++;
      entry.totalDuration += trace.duration ?? 0;
      entry.errors += trace.errorCount;
      opMap.set(trace.operationName, entry);
    }

    const topOperations = Array.from(opMap.entries())
      .map(([name, data]) => ({
        name,
        traceCount: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        errorRate: data.count > 0 ? data.errors / data.count : 0,
      }))
      .sort((a, b) => b.traceCount - a.traceCount)
      .slice(0, 10);

    return {
      traces: {
        totalTraces: traceStats.totalTraces,
        totalSpans: traceStats.totalSpans,
        errorRate: traceStats.errorRate,
        avgDuration: traceStats.avgDuration,
        p50Duration: getPercentile(sortedDurations, 50),
        p95Duration: getPercentile(sortedDurations, 95),
        p99Duration: getPercentile(sortedDurations, 99),
        topServices,
        topOperations,
      },
      metrics: metricsSummary,
      uptime: Date.now() - this.startTime,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get health status
   */
  getHealth(): {
    healthy: boolean;
    tracing: { enabled: boolean; activeSpans: number };
    metrics: { enabled: boolean; metricCount: number };
    logging: { enabled: boolean; logCount: number };
  } {
    const traceStats = this.tracer.getStats();
    const metricsSummary = this.metrics.getSummary();
    const logStats = this.logger.getStats();

    return {
      healthy: true,
      tracing: {
        enabled: this.config.tracing.enabled,
        activeSpans: traceStats.activeSpans,
      },
      metrics: {
        enabled: this.config.metrics.enabled,
        metricCount: metricsSummary.totalMetrics,
      },
      logging: {
        enabled: this.config.logging.enabled,
        logCount: logStats.totalLogs,
      },
    };
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Shutdown observability
   */
  shutdown(): void {
    this.logger.info("Observability manager shutting down");
    this.metrics.stop();
    this.removeAllListeners();
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.tracer.clear();
    this.metrics.reset();
    this.logger.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): ObservabilityConfig {
    return { ...this.config };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let observabilityInstance: ObservabilityManager | null = null;

export function getObservabilityManager(): ObservabilityManager | null {
  return observabilityInstance;
}

export function createObservabilityManager(config?: Partial<ObservabilityConfig>): ObservabilityManager {
  observabilityInstance = new ObservabilityManager(config);
  return observabilityInstance;
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export { getTracer, getMetricsCollector, getLogger };
