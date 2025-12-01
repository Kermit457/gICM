/**
 * OpenTelemetry Types
 * Phase 14A: OpenTelemetry Integration
 */

import { z } from "zod";

// =============================================================================
// Trace Context
// =============================================================================

export const TraceIdSchema = z.string().regex(/^[a-f0-9]{32}$/);
export type TraceId = z.infer<typeof TraceIdSchema>;

export const SpanIdSchema = z.string().regex(/^[a-f0-9]{16}$/);
export type SpanId = z.infer<typeof SpanIdSchema>;

export const TraceFlagsSchema = z.number().int().min(0).max(255);
export type TraceFlags = z.infer<typeof TraceFlagsSchema>;

export const TraceContextSchema = z.object({
  traceId: TraceIdSchema,
  spanId: SpanIdSchema,
  traceFlags: TraceFlagsSchema.default(1), // 0 = not sampled, 1 = sampled
  traceState: z.string().optional(),
});
export type TraceContext = z.infer<typeof TraceContextSchema>;

// =============================================================================
// Span Status
// =============================================================================

export const SpanStatusCodeSchema = z.enum(["UNSET", "OK", "ERROR"]);
export type SpanStatusCode = z.infer<typeof SpanStatusCodeSchema>;

export const SpanStatusSchema = z.object({
  code: SpanStatusCodeSchema,
  message: z.string().optional(),
});
export type SpanStatus = z.infer<typeof SpanStatusSchema>;

// =============================================================================
// Span Kind
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
// Attributes
// =============================================================================

export const AttributeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean()),
]);
export type AttributeValue = z.infer<typeof AttributeValueSchema>;

export const AttributesSchema = z.record(AttributeValueSchema);
export type Attributes = z.infer<typeof AttributesSchema>;

// =============================================================================
// Span Event
// =============================================================================

export const SpanEventSchema = z.object({
  name: z.string(),
  timestamp: z.number(),
  attributes: AttributesSchema.optional(),
});
export type SpanEvent = z.infer<typeof SpanEventSchema>;

// =============================================================================
// Span Link
// =============================================================================

export const SpanLinkSchema = z.object({
  context: TraceContextSchema,
  attributes: AttributesSchema.optional(),
});
export type SpanLink = z.infer<typeof SpanLinkSchema>;

// =============================================================================
// Span
// =============================================================================

export const SpanSchema = z.object({
  traceId: TraceIdSchema,
  spanId: SpanIdSchema,
  parentSpanId: SpanIdSchema.optional(),
  name: z.string(),
  kind: SpanKindSchema.default("INTERNAL"),
  startTime: z.number(),
  endTime: z.number().optional(),
  status: SpanStatusSchema.optional(),
  attributes: AttributesSchema.default({}),
  events: z.array(SpanEventSchema).default([]),
  links: z.array(SpanLinkSchema).default([]),
  droppedAttributesCount: z.number().default(0),
  droppedEventsCount: z.number().default(0),
  droppedLinksCount: z.number().default(0),
});
export type Span = z.infer<typeof SpanSchema>;

// =============================================================================
// Resource
// =============================================================================

export const ResourceSchema = z.object({
  attributes: AttributesSchema.default({}),
  schemaUrl: z.string().optional(),
});
export type Resource = z.infer<typeof ResourceSchema>;

// =============================================================================
// Instrumentation Scope
// =============================================================================

export const InstrumentationScopeSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  schemaUrl: z.string().optional(),
  attributes: AttributesSchema.optional(),
});
export type InstrumentationScope = z.infer<typeof InstrumentationScopeSchema>;

// =============================================================================
// Sampler
// =============================================================================

export const SamplerTypeSchema = z.enum([
  "always_on",
  "always_off",
  "trace_id_ratio",
  "parent_based",
]);
export type SamplerType = z.infer<typeof SamplerTypeSchema>;

export const SamplerConfigSchema = z.object({
  type: SamplerTypeSchema,
  ratio: z.number().min(0).max(1).optional(),
  root: SamplerTypeSchema.optional(),
  remoteParentSampled: SamplerTypeSchema.optional(),
  remoteParentNotSampled: SamplerTypeSchema.optional(),
  localParentSampled: SamplerTypeSchema.optional(),
  localParentNotSampled: SamplerTypeSchema.optional(),
});
export type SamplerConfig = z.infer<typeof SamplerConfigSchema>;

// =============================================================================
// Exporter
// =============================================================================

export const ExporterTypeSchema = z.enum([
  "console",
  "otlp_http",
  "otlp_grpc",
  "zipkin",
  "jaeger",
  "memory",
]);
export type ExporterType = z.infer<typeof ExporterTypeSchema>;

export const ExporterConfigSchema = z.object({
  type: ExporterTypeSchema,
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  compression: z.enum(["none", "gzip"]).optional(),
  timeout: z.number().optional(),
  concurrencyLimit: z.number().optional(),
});
export type ExporterConfig = z.infer<typeof ExporterConfigSchema>;

// =============================================================================
// Processor
// =============================================================================

export const ProcessorTypeSchema = z.enum([
  "simple",
  "batch",
]);
export type ProcessorType = z.infer<typeof ProcessorTypeSchema>;

export const BatchProcessorConfigSchema = z.object({
  maxQueueSize: z.number().default(2048),
  maxExportBatchSize: z.number().default(512),
  scheduledDelayMs: z.number().default(5000),
  exportTimeoutMs: z.number().default(30000),
});
export type BatchProcessorConfig = z.infer<typeof BatchProcessorConfigSchema>;

// =============================================================================
// Propagator
// =============================================================================

export const PropagatorTypeSchema = z.enum([
  "w3c_trace_context",
  "w3c_baggage",
  "b3",
  "b3_multi",
  "jaeger",
  "xray",
]);
export type PropagatorType = z.infer<typeof PropagatorTypeSchema>;

// =============================================================================
// Tracer Config
// =============================================================================

export const TracerConfigSchema = z.object({
  serviceName: z.string(),
  serviceVersion: z.string().optional(),
  environment: z.string().optional(),
  resource: ResourceSchema.optional(),
  sampler: SamplerConfigSchema.optional(),
  exporter: ExporterConfigSchema.optional(),
  processor: z.object({
    type: ProcessorTypeSchema.default("batch"),
    batch: BatchProcessorConfigSchema.optional(),
  }).optional(),
  propagators: z.array(PropagatorTypeSchema).default(["w3c_trace_context", "w3c_baggage"]),
  spanLimits: z.object({
    maxAttributeCount: z.number().default(128),
    maxEventCount: z.number().default(128),
    maxLinkCount: z.number().default(128),
    maxAttributeValueLength: z.number().default(12000),
  }).optional(),
  instrumentations: z.object({
    http: z.boolean().default(true),
    grpc: z.boolean().default(true),
    database: z.boolean().default(true),
  }).optional(),
});
export type TracerConfig = z.infer<typeof TracerConfigSchema>;

// =============================================================================
// Baggage
// =============================================================================

export const BaggageEntrySchema = z.object({
  value: z.string(),
  metadata: z.string().optional(),
});
export type BaggageEntry = z.infer<typeof BaggageEntrySchema>;

export const BaggageSchema = z.record(BaggageEntrySchema);
export type Baggage = z.infer<typeof BaggageSchema>;

// =============================================================================
// Context Carrier
// =============================================================================

export const ContextCarrierSchema = z.record(z.string());
export type ContextCarrier = z.infer<typeof ContextCarrierSchema>;

// =============================================================================
// Span Options
// =============================================================================

export const SpanOptionsSchema = z.object({
  kind: SpanKindSchema.optional(),
  attributes: AttributesSchema.optional(),
  links: z.array(SpanLinkSchema).optional(),
  startTime: z.number().optional(),
  root: z.boolean().optional().describe("Force a new trace"),
});
export type SpanOptions = z.infer<typeof SpanOptionsSchema>;

// =============================================================================
// Events
// =============================================================================

export type TelemetryEvents = {
  // Span Lifecycle
  spanStarted: (span: Span) => void;
  spanEnded: (span: Span) => void;
  spanError: (span: Span, error: Error) => void;

  // Export Events
  exportStarted: (spans: Span[]) => void;
  exportCompleted: (spans: Span[], success: boolean) => void;
  exportFailed: (error: Error) => void;

  // Context Events
  contextInjected: (carrier: ContextCarrier) => void;
  contextExtracted: (context: TraceContext | null) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Semantic Conventions
// =============================================================================

export const HTTP_ATTRIBUTES = {
  METHOD: "http.method",
  URL: "http.url",
  TARGET: "http.target",
  HOST: "http.host",
  SCHEME: "http.scheme",
  STATUS_CODE: "http.status_code",
  FLAVOR: "http.flavor",
  USER_AGENT: "http.user_agent",
  REQUEST_CONTENT_LENGTH: "http.request_content_length",
  RESPONSE_CONTENT_LENGTH: "http.response_content_length",
  ROUTE: "http.route",
  CLIENT_IP: "http.client_ip",
} as const;

export const DB_ATTRIBUTES = {
  SYSTEM: "db.system",
  CONNECTION_STRING: "db.connection_string",
  USER: "db.user",
  NAME: "db.name",
  STATEMENT: "db.statement",
  OPERATION: "db.operation",
} as const;

export const RPC_ATTRIBUTES = {
  SYSTEM: "rpc.system",
  SERVICE: "rpc.service",
  METHOD: "rpc.method",
  GRPC_STATUS_CODE: "rpc.grpc.status_code",
} as const;

export const MESSAGING_ATTRIBUTES = {
  SYSTEM: "messaging.system",
  DESTINATION: "messaging.destination",
  DESTINATION_KIND: "messaging.destination_kind",
  MESSAGE_ID: "messaging.message_id",
  OPERATION: "messaging.operation",
} as const;

export const ERROR_ATTRIBUTES = {
  TYPE: "error.type",
  MESSAGE: "error.message",
  STACK_TRACE: "error.stack_trace",
} as const;

export const SERVICE_ATTRIBUTES = {
  NAME: "service.name",
  VERSION: "service.version",
  INSTANCE_ID: "service.instance.id",
  NAMESPACE: "service.namespace",
} as const;
