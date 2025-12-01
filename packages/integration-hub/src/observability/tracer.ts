/**
 * Distributed Tracer
 * Phase 12D: OpenTelemetry-compatible tracing
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import type {
  Span,
  SpanKind,
  SpanStatus,
  SpanStatusCode,
  SpanEvent,
  SpanLink,
  TraceContext,
  Trace,
  ObservabilityConfig,
  ObservabilityEvents,
  SamplerConfig,
} from "./types.js";

// =============================================================================
// SPAN BUILDER
// =============================================================================

export class SpanBuilder {
  private span: Partial<Span>;
  private tracer: Tracer;

  constructor(tracer: Tracer, name: string, options: SpanOptions = {}) {
    const now = Date.now();
    const traceId = options.context?.traceId ?? generateTraceId();
    const spanId = generateSpanId();

    this.tracer = tracer;
    this.span = {
      traceId,
      spanId,
      parentSpanId: options.context?.spanId ?? options.parentSpanId,
      name,
      kind: options.kind ?? "INTERNAL",
      startTime: options.startTime ?? now,
      status: { code: "UNSET" },
      attributes: { ...options.attributes },
      events: [],
      links: options.links ?? [],
      resource: tracer.getResource(),
    };
  }

  setAttribute(key: string, value: string | number | boolean): this {
    this.span.attributes![key] = value;
    return this;
  }

  setAttributes(attrs: Record<string, string | number | boolean>): this {
    Object.assign(this.span.attributes!, attrs);
    return this;
  }

  addEvent(name: string, attributes?: Record<string, string | number | boolean>): this {
    this.span.events!.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
    return this;
  }

  addLink(traceId: string, spanId: string, attributes?: Record<string, string | number | boolean>): this {
    this.span.links!.push({ traceId, spanId, attributes });
    return this;
  }

  setStatus(code: SpanStatusCode, message?: string): this {
    this.span.status = { code, message };
    return this;
  }

  setError(error: Error): this {
    this.span.status = { code: "ERROR", message: error.message };
    this.addEvent("exception", {
      "exception.type": error.name,
      "exception.message": error.message,
      "exception.stacktrace": error.stack ?? "",
    });
    return this;
  }

  getSpan(): Span {
    return this.span as Span;
  }

  getContext(): TraceContext {
    return {
      traceId: this.span.traceId!,
      spanId: this.span.spanId!,
      parentSpanId: this.span.parentSpanId,
      traceFlags: 1,
    };
  }

  end(endTime?: number): Span {
    const now = endTime ?? Date.now();
    this.span.endTime = now;
    this.span.duration = now - this.span.startTime!;

    const completedSpan = this.span as Span;
    this.tracer.recordSpan(completedSpan);

    return completedSpan;
  }
}

// =============================================================================
// SPAN OPTIONS
// =============================================================================

export interface SpanOptions {
  kind?: SpanKind;
  context?: TraceContext;
  parentSpanId?: string;
  startTime?: number;
  attributes?: Record<string, string | number | boolean>;
  links?: SpanLink[];
}

// =============================================================================
// TRACER
// =============================================================================

export class Tracer extends EventEmitter<ObservabilityEvents> {
  private config: ObservabilityConfig;
  private spans: Map<string, Span> = new Map();
  private traces: Map<string, Span[]> = new Map();
  private activeSpans: Map<string, SpanBuilder> = new Map();
  private sampler: Sampler;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    super();
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
      metrics: { enabled: true, collectInterval: 60000, defaultBuckets: [], ...config.metrics },
      logging: { enabled: true, minSeverity: "INFO", includeTraceContext: true, ...config.logging },
      resource: { attributes: {}, ...config.resource },
      retention: { traces: 86400000, metrics: 604800000, logs: 86400000, ...config.retention },
    };
    this.sampler = new Sampler(this.config.tracing.sampler);

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }

  getResource() {
    return {
      serviceName: this.config.serviceName,
      serviceVersion: this.config.serviceVersion,
      environment: this.config.environment,
      hostName: this.config.resource.hostName,
      instanceId: this.config.resource.instanceId,
    };
  }

  /**
   * Start a new span
   */
  startSpan(name: string, options: SpanOptions = {}): SpanBuilder {
    if (!this.config.tracing.enabled) {
      // Return a no-op span builder
      return new NoOpSpanBuilder(this, name);
    }

    // Check sampling
    const shouldSample = this.sampler.shouldSample(options.context);
    if (!shouldSample) {
      return new NoOpSpanBuilder(this, name);
    }

    const builder = new SpanBuilder(this, name, options);
    this.activeSpans.set(builder.getContext().spanId, builder);
    this.emit("span:started", builder.getSpan());

    return builder;
  }

  /**
   * Create a child span from a parent context
   */
  startChildSpan(name: string, parentContext: TraceContext, options: Omit<SpanOptions, "context"> = {}): SpanBuilder {
    return this.startSpan(name, { ...options, context: parentContext });
  }

  /**
   * Wrap an async function with tracing
   */
  async trace<T>(
    name: string,
    fn: (span: SpanBuilder) => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const span = this.startSpan(name, options);

    try {
      const result = await fn(span);
      span.setStatus("OK");
      return result;
    } catch (error) {
      span.setError(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Record a completed span
   */
  recordSpan(span: Span): void {
    // Enforce limits
    if (Object.keys(span.attributes).length > this.config.tracing.maxSpanAttributes) {
      const entries = Object.entries(span.attributes).slice(0, this.config.tracing.maxSpanAttributes);
      span.attributes = Object.fromEntries(entries);
    }

    if (span.events.length > this.config.tracing.maxSpanEvents) {
      span.events = span.events.slice(0, this.config.tracing.maxSpanEvents);
    }

    if (span.links.length > this.config.tracing.maxSpanLinks) {
      span.links = span.links.slice(0, this.config.tracing.maxSpanLinks);
    }

    // Store span
    this.spans.set(span.spanId, span);

    // Group by trace
    const traceSpans = this.traces.get(span.traceId) ?? [];
    traceSpans.push(span);
    this.traces.set(span.traceId, traceSpans);

    // Remove from active
    this.activeSpans.delete(span.spanId);

    this.emit("span:ended", span);

    // Check if trace is complete (root span ended)
    if (!span.parentSpanId) {
      this.checkTraceComplete(span.traceId);
    }
  }

  /**
   * Check if a trace is complete
   */
  private checkTraceComplete(traceId: string): void {
    const spans = this.traces.get(traceId);
    if (!spans || spans.length === 0) return;

    // Find root span
    const rootSpan = spans.find(s => !s.parentSpanId);
    if (!rootSpan || !rootSpan.endTime) return;

    // Build trace object
    const trace: Trace = {
      traceId,
      rootSpan,
      spans,
      startTime: rootSpan.startTime,
      endTime: rootSpan.endTime,
      duration: rootSpan.duration,
      spanCount: spans.length,
      errorCount: spans.filter(s => s.status.code === "ERROR").length,
      serviceName: rootSpan.resource.serviceName,
      operationName: rootSpan.name,
    };

    this.emit("trace:completed", trace);
  }

  /**
   * Get a span by ID
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get all spans for a trace
   */
  getTraceSpans(traceId: string): Span[] {
    return this.traces.get(traceId) ?? [];
  }

  /**
   * Get a complete trace
   */
  getTrace(traceId: string): Trace | null {
    const spans = this.traces.get(traceId);
    if (!spans || spans.length === 0) return null;

    const rootSpan = spans.find(s => !s.parentSpanId);
    if (!rootSpan) return null;

    return {
      traceId,
      rootSpan,
      spans,
      startTime: rootSpan.startTime,
      endTime: rootSpan.endTime,
      duration: rootSpan.duration,
      spanCount: spans.length,
      errorCount: spans.filter(s => s.status.code === "ERROR").length,
      serviceName: rootSpan.resource.serviceName,
      operationName: rootSpan.name,
    };
  }

  /**
   * Search traces
   */
  searchTraces(query: {
    serviceName?: string;
    operationName?: string;
    minDuration?: number;
    maxDuration?: number;
    tags?: Record<string, string>;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Trace[] {
    const results: Trace[] = [];
    const limit = query.limit ?? 100;

    for (const traceId of this.traces.keys()) {
      if (results.length >= limit) break;

      const trace = this.getTrace(traceId);
      if (!trace || !trace.rootSpan.endTime) continue;

      // Apply filters
      if (query.serviceName && trace.serviceName !== query.serviceName) continue;
      if (query.operationName && trace.operationName !== query.operationName) continue;
      if (query.minDuration && (trace.duration ?? 0) < query.minDuration) continue;
      if (query.maxDuration && (trace.duration ?? 0) > query.maxDuration) continue;
      if (query.startTime && trace.startTime < query.startTime) continue;
      if (query.endTime && trace.startTime > query.endTime) continue;

      // Check tags
      if (query.tags) {
        const hasAllTags = Object.entries(query.tags).every(
          ([key, value]) => trace.rootSpan.attributes[key] === value
        );
        if (!hasAllTags) continue;
      }

      results.push(trace);
    }

    return results.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get trace stats
   */
  getStats(): {
    totalTraces: number;
    totalSpans: number;
    activeSpans: number;
    avgDuration: number;
    errorRate: number;
  } {
    const traces = Array.from(this.traces.values());
    const allSpans = traces.flat();
    const completedTraces = traces.filter(spans => {
      const root = spans.find(s => !s.parentSpanId);
      return root?.endTime;
    });

    const durations = completedTraces
      .map(spans => spans.find(s => !s.parentSpanId)?.duration ?? 0)
      .filter(d => d > 0);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const errorCount = allSpans.filter(s => s.status.code === "ERROR").length;

    return {
      totalTraces: this.traces.size,
      totalSpans: allSpans.length,
      activeSpans: this.activeSpans.size,
      avgDuration,
      errorRate: allSpans.length > 0 ? errorCount / allSpans.length : 0,
    };
  }

  /**
   * Clean up old traces
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retention.traces;

    for (const [spanId, span] of this.spans) {
      if (span.startTime < cutoff) {
        this.spans.delete(spanId);
      }
    }

    for (const [traceId, spans] of this.traces) {
      const root = spans.find(s => !s.parentSpanId);
      if (root && root.startTime < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.spans.clear();
    this.traces.clear();
    this.activeSpans.clear();
  }
}

// =============================================================================
// NO-OP SPAN BUILDER
// =============================================================================

class NoOpSpanBuilder extends SpanBuilder {
  setAttribute(_key: string, _value: string | number | boolean): this {
    return this;
  }

  setAttributes(_attrs: Record<string, string | number | boolean>): this {
    return this;
  }

  addEvent(_name: string, _attributes?: Record<string, string | number | boolean>): this {
    return this;
  }

  addLink(_traceId: string, _spanId: string, _attributes?: Record<string, string | number | boolean>): this {
    return this;
  }

  setStatus(_code: SpanStatusCode, _message?: string): this {
    return this;
  }

  setError(_error: Error): this {
    return this;
  }

  end(_endTime?: number): Span {
    return this.getSpan();
  }
}

// =============================================================================
// SAMPLER
// =============================================================================

class Sampler {
  private config: SamplerConfig;

  constructor(config: SamplerConfig) {
    this.config = config;
  }

  shouldSample(parentContext?: TraceContext): boolean {
    switch (this.config.type) {
      case "always_on":
        return true;

      case "always_off":
        return false;

      case "trace_id_ratio":
        // Use hash of trace ID if available, otherwise random
        return Math.random() < this.config.ratio;

      case "parent_based":
        if (parentContext && this.config.parentBased) {
          // Inherit sampling decision from parent
          return (parentContext.traceFlags & 1) === 1;
        }
        return Math.random() < this.config.ratio;

      default:
        return true;
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function generateTraceId(): string {
  return randomUUID().replace(/-/g, "");
}

function generateSpanId(): string {
  return randomUUID().replace(/-/g, "").substring(0, 16);
}

// =============================================================================
// SINGLETON
// =============================================================================

let tracerInstance: Tracer | null = null;

export function getTracer(): Tracer | null {
  return tracerInstance;
}

export function createTracer(config?: Partial<ObservabilityConfig>): Tracer {
  tracerInstance = new Tracer(config);
  return tracerInstance;
}

export { generateTraceId, generateSpanId };
