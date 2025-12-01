/**
 * OpenTelemetry Tracer Implementation
 * Phase 14A: OpenTelemetry Integration
 */

import { EventEmitter } from "eventemitter3";
import { randomBytes } from "crypto";
import {
  type TracerConfig,
  TracerConfigSchema,
  type Span,
  type SpanOptions,
  type TraceContext,
  type SpanStatus,
  type SpanEvent,
  type SpanLink,
  type Attributes,
  type Baggage,
  type ContextCarrier,
  type TelemetryEvents,
  type Resource,
  SERVICE_ATTRIBUTES,
} from "./types.js";

// =============================================================================
// ID Generation
// =============================================================================

function generateTraceId(): string {
  return randomBytes(16).toString("hex");
}

function generateSpanId(): string {
  return randomBytes(8).toString("hex");
}

// =============================================================================
// Context Management
// =============================================================================

interface ContextData {
  traceContext?: TraceContext;
  baggage?: Baggage;
  span?: ActiveSpan;
}

class ContextManager {
  private stack: ContextData[] = [{}];

  current(): ContextData {
    return this.stack[this.stack.length - 1];
  }

  with<T>(context: ContextData, fn: () => T): T {
    this.stack.push({ ...this.current(), ...context });
    try {
      return fn();
    } finally {
      this.stack.pop();
    }
  }

  async withAsync<T>(context: ContextData, fn: () => Promise<T>): Promise<T> {
    this.stack.push({ ...this.current(), ...context });
    try {
      return await fn();
    } finally {
      this.stack.pop();
    }
  }

  setCurrentSpan(span: ActiveSpan): void {
    this.stack[this.stack.length - 1].span = span;
    this.stack[this.stack.length - 1].traceContext = {
      traceId: span.traceId,
      spanId: span.spanId,
      traceFlags: 1,
    };
  }

  getCurrentSpan(): ActiveSpan | undefined {
    return this.current().span;
  }

  getTraceContext(): TraceContext | undefined {
    return this.current().traceContext;
  }

  getBaggage(): Baggage | undefined {
    return this.current().baggage;
  }

  setBaggage(baggage: Baggage): void {
    this.stack[this.stack.length - 1].baggage = baggage;
  }
}

// =============================================================================
// Active Span
// =============================================================================

class ActiveSpan implements Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: Span["kind"];
  startTime: number;
  endTime?: number;
  status?: SpanStatus;
  attributes: Attributes;
  events: SpanEvent[];
  links: SpanLink[];
  droppedAttributesCount: number;
  droppedEventsCount: number;
  droppedLinksCount: number;

  private ended = false;
  private tracer: Tracer;

  constructor(
    tracer: Tracer,
    name: string,
    options: SpanOptions & { traceId: string; spanId: string; parentSpanId?: string }
  ) {
    this.tracer = tracer;
    this.traceId = options.traceId;
    this.spanId = options.spanId;
    this.parentSpanId = options.parentSpanId;
    this.name = name;
    this.kind = options.kind ?? "INTERNAL";
    this.startTime = options.startTime ?? Date.now();
    this.attributes = options.attributes ?? {};
    this.events = [];
    this.links = options.links ?? [];
    this.droppedAttributesCount = 0;
    this.droppedEventsCount = 0;
    this.droppedLinksCount = 0;
  }

  setAttribute(key: string, value: Attributes[string]): this {
    if (!this.ended) {
      this.attributes[key] = value;
    }
    return this;
  }

  setAttributes(attributes: Attributes): this {
    if (!this.ended) {
      Object.assign(this.attributes, attributes);
    }
    return this;
  }

  addEvent(name: string, attributes?: Attributes, timestamp?: number): this {
    if (!this.ended) {
      this.events.push({
        name,
        timestamp: timestamp ?? Date.now(),
        attributes,
      });
    }
    return this;
  }

  setStatus(status: SpanStatus): this {
    if (!this.ended) {
      this.status = status;
    }
    return this;
  }

  recordException(error: Error, timestamp?: number): this {
    if (!this.ended) {
      this.addEvent("exception", {
        "exception.type": error.name,
        "exception.message": error.message,
        "exception.stacktrace": error.stack ?? "",
      }, timestamp);
      this.setStatus({ code: "ERROR", message: error.message });
      this.tracer["emit"]("spanError", this.toSpan(), error);
    }
    return this;
  }

  updateName(name: string): this {
    if (!this.ended) {
      this.name = name;
    }
    return this;
  }

  isRecording(): boolean {
    return !this.ended;
  }

  end(endTime?: number): void {
    if (this.ended) return;
    this.ended = true;
    this.endTime = endTime ?? Date.now();
    this.tracer["onSpanEnd"](this);
  }

  toSpan(): Span {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      kind: this.kind,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      attributes: { ...this.attributes },
      events: [...this.events],
      links: [...this.links],
      droppedAttributesCount: this.droppedAttributesCount,
      droppedEventsCount: this.droppedEventsCount,
      droppedLinksCount: this.droppedLinksCount,
    };
  }
}

// =============================================================================
// Tracer
// =============================================================================

export class Tracer extends EventEmitter<TelemetryEvents> {
  private config: TracerConfig;
  private context: ContextManager;
  private resource: Resource;
  private spans: Span[] = [];
  private exportInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<TracerConfig> & { serviceName: string }) {
    super();
    this.config = TracerConfigSchema.parse(config);
    this.context = new ContextManager();

    // Build resource
    this.resource = {
      attributes: {
        [SERVICE_ATTRIBUTES.NAME]: this.config.serviceName,
        ...(this.config.serviceVersion && { [SERVICE_ATTRIBUTES.VERSION]: this.config.serviceVersion }),
        ...(this.config.environment && { "deployment.environment": this.config.environment }),
        ...this.config.resource?.attributes,
      },
      schemaUrl: this.config.resource?.schemaUrl,
    };

    // Start export interval for batch processing
    if (this.config.processor?.type === "batch") {
      const delay = this.config.processor.batch?.scheduledDelayMs ?? 5000;
      this.exportInterval = setInterval(() => this.flush(), delay);
    }
  }

  // ---------------------------------------------------------------------------
  // Span Creation
  // ---------------------------------------------------------------------------

  startSpan(name: string, options: SpanOptions = {}): ActiveSpan {
    let traceId: string;
    let parentSpanId: string | undefined;

    if (options.root) {
      traceId = generateTraceId();
    } else {
      const currentContext = this.context.getTraceContext();
      if (currentContext) {
        traceId = currentContext.traceId;
        parentSpanId = currentContext.spanId;
      } else {
        traceId = generateTraceId();
      }
    }

    const spanId = generateSpanId();

    const span = new ActiveSpan(this, name, {
      ...options,
      traceId,
      spanId,
      parentSpanId,
    });

    this.context.setCurrentSpan(span);
    this.emit("spanStarted", span.toSpan());

    return span;
  }

  startActiveSpan<T>(
    name: string,
    fn: (span: ActiveSpan) => T
  ): T;
  startActiveSpan<T>(
    name: string,
    options: SpanOptions,
    fn: (span: ActiveSpan) => T
  ): T;
  startActiveSpan<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: ActiveSpan) => T),
    maybeFn?: (span: ActiveSpan) => T
  ): T {
    const options = typeof optionsOrFn === "function" ? {} : optionsOrFn;
    const fn = typeof optionsOrFn === "function" ? optionsOrFn : maybeFn!;

    const span = this.startSpan(name, options);
    const context: ContextData = {
      span,
      traceContext: {
        traceId: span.traceId,
        spanId: span.spanId,
        traceFlags: 1,
      },
    };

    return this.context.with(context, () => {
      try {
        const result = fn(span);
        if (result instanceof Promise) {
          return result.finally(() => span.end()) as T;
        }
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  async startActiveSpanAsync<T>(
    name: string,
    fn: (span: ActiveSpan) => Promise<T>
  ): Promise<T>;
  async startActiveSpanAsync<T>(
    name: string,
    options: SpanOptions,
    fn: (span: ActiveSpan) => Promise<T>
  ): Promise<T>;
  async startActiveSpanAsync<T>(
    name: string,
    optionsOrFn: SpanOptions | ((span: ActiveSpan) => Promise<T>),
    maybeFn?: (span: ActiveSpan) => Promise<T>
  ): Promise<T> {
    const options = typeof optionsOrFn === "function" ? {} : optionsOrFn;
    const fn = typeof optionsOrFn === "function" ? optionsOrFn : maybeFn!;

    const span = this.startSpan(name, options);
    const context: ContextData = {
      span,
      traceContext: {
        traceId: span.traceId,
        spanId: span.spanId,
        traceFlags: 1,
      },
    };

    return this.context.withAsync(context, async () => {
      try {
        const result = await fn(span);
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Context Access
  // ---------------------------------------------------------------------------

  getCurrentSpan(): ActiveSpan | undefined {
    return this.context.getCurrentSpan();
  }

  getTraceContext(): TraceContext | undefined {
    return this.context.getTraceContext();
  }

  // ---------------------------------------------------------------------------
  // Context Propagation
  // ---------------------------------------------------------------------------

  inject(carrier: ContextCarrier = {}): ContextCarrier {
    const context = this.context.getTraceContext();
    if (!context) return carrier;

    // W3C Trace Context format
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, "0")}`;
    carrier["traceparent"] = traceparent;

    if (context.traceState) {
      carrier["tracestate"] = context.traceState;
    }

    // Inject baggage if present
    const baggage = this.context.getBaggage();
    if (baggage && Object.keys(baggage).length > 0) {
      const baggageStr = Object.entries(baggage)
        .map(([key, entry]) => `${encodeURIComponent(key)}=${encodeURIComponent(entry.value)}`)
        .join(",");
      carrier["baggage"] = baggageStr;
    }

    this.emit("contextInjected", carrier);
    return carrier;
  }

  extract(carrier: ContextCarrier): TraceContext | null {
    const traceparent = carrier["traceparent"];
    if (!traceparent) {
      this.emit("contextExtracted", null);
      return null;
    }

    // Parse W3C Trace Context format
    const match = traceparent.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-([a-f0-9]{2})$/);
    if (!match) {
      this.emit("contextExtracted", null);
      return null;
    }

    const context: TraceContext = {
      traceId: match[1],
      spanId: match[2],
      traceFlags: parseInt(match[3], 16),
      traceState: carrier["tracestate"],
    };

    // Extract baggage
    const baggageStr = carrier["baggage"];
    if (baggageStr) {
      const baggage: Baggage = {};
      for (const entry of baggageStr.split(",")) {
        const [key, value] = entry.split("=").map(s => decodeURIComponent(s.trim()));
        if (key && value) {
          baggage[key] = { value };
        }
      }
      this.context.setBaggage(baggage);
    }

    this.emit("contextExtracted", context);
    return context;
  }

  withExtractedContext<T>(carrier: ContextCarrier, fn: () => T): T {
    const context = this.extract(carrier);
    if (!context) {
      return fn();
    }

    return this.context.with({ traceContext: context }, fn);
  }

  async withExtractedContextAsync<T>(carrier: ContextCarrier, fn: () => Promise<T>): Promise<T> {
    const context = this.extract(carrier);
    if (!context) {
      return fn();
    }

    return this.context.withAsync({ traceContext: context }, fn);
  }

  // ---------------------------------------------------------------------------
  // Baggage
  // ---------------------------------------------------------------------------

  getBaggage(): Baggage | undefined {
    return this.context.getBaggage();
  }

  setBaggageEntry(key: string, value: string, metadata?: string): void {
    const current = this.context.getBaggage() ?? {};
    current[key] = { value, metadata };
    this.context.setBaggage(current);
  }

  removeBaggageEntry(key: string): void {
    const current = this.context.getBaggage();
    if (current) {
      delete current[key];
      this.context.setBaggage(current);
    }
  }

  // ---------------------------------------------------------------------------
  // Resource
  // ---------------------------------------------------------------------------

  getResource(): Resource {
    return { ...this.resource };
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  private onSpanEnd(span: ActiveSpan): void {
    const spanData = span.toSpan();
    this.emit("spanEnded", spanData);

    // Add to batch
    this.spans.push(spanData);

    // Export immediately if simple processor
    if (this.config.processor?.type === "simple" || !this.config.processor) {
      this.exportSpans([spanData]);
    }
  }

  async flush(): Promise<void> {
    if (this.spans.length === 0) return;

    const toExport = [...this.spans];
    this.spans = [];

    await this.exportSpans(toExport);
  }

  private async exportSpans(spans: Span[]): Promise<void> {
    if (spans.length === 0) return;

    this.emit("exportStarted", spans);

    try {
      const exporter = this.config.exporter;

      switch (exporter?.type) {
        case "console":
          for (const span of spans) {
            console.log(JSON.stringify({
              resource: this.resource,
              span,
            }, null, 2));
          }
          break;

        case "otlp_http":
          if (exporter.endpoint) {
            // In a real implementation, this would use fetch
            // For now, just simulate the export
            console.log(`[OTLP] Exporting ${spans.length} spans to ${exporter.endpoint}`);
          }
          break;

        case "memory":
          // Spans are already stored in memory
          break;

        default:
          // Default to console
          for (const span of spans) {
            console.log(JSON.stringify(span));
          }
      }

      this.emit("exportCompleted", spans, true);
    } catch (error) {
      this.emit("exportFailed", error as Error);
      this.emit("exportCompleted", spans, false);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async shutdown(): Promise<void> {
    if (this.exportInterval) {
      clearInterval(this.exportInterval);
    }
    await this.flush();
    this.removeAllListeners();
  }

  // ---------------------------------------------------------------------------
  // Stored Spans (for memory exporter)
  // ---------------------------------------------------------------------------

  getStoredSpans(): Span[] {
    return [...this.spans];
  }

  clearStoredSpans(): void {
    this.spans = [];
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultTracer: Tracer | null = null;

export function getTracer(): Tracer {
  if (!defaultTracer) {
    throw new Error("Tracer not initialized. Call createTracer first.");
  }
  return defaultTracer;
}

export function createTracer(config: Partial<TracerConfig> & { serviceName: string }): Tracer {
  const tracer = new Tracer(config);
  if (!defaultTracer) {
    defaultTracer = tracer;
  }
  return tracer;
}

// =============================================================================
// Decorators / Helpers
// =============================================================================

export function traced(name?: string, options?: SpanOptions) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    const spanName = name ?? propertyKey;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const tracer = getTracer();
      return tracer.startActiveSpan(spanName, options ?? {}, (span) => {
        return originalMethod.apply(this, args) as ReturnType<T>;
      });
    } as T;

    return descriptor;
  };
}

export function withSpan<T>(
  name: string,
  fn: (span: ActiveSpan) => T,
  options?: SpanOptions
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, options ?? {}, fn);
}

export async function withSpanAsync<T>(
  name: string,
  fn: (span: ActiveSpan) => Promise<T>,
  options?: SpanOptions
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpanAsync(name, options ?? {}, fn);
}
