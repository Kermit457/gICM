/**
 * OpenTelemetry Module
 * Phase 14A: OpenTelemetry Integration
 */

// Types & Schemas
export {
  // Trace Context
  TraceIdSchema,
  type TraceId,
  SpanIdSchema,
  type SpanId,
  TraceFlagsSchema,
  type TraceFlags,
  TraceContextSchema,
  type TraceContext,

  // Span Status & Kind
  SpanStatusCodeSchema,
  type SpanStatusCode,
  SpanStatusSchema,
  type SpanStatus,
  SpanKindSchema,
  type SpanKind,

  // Attributes
  AttributeValueSchema,
  type AttributeValue,
  AttributesSchema,
  type Attributes,

  // Span Components
  SpanEventSchema,
  type SpanEvent,
  SpanLinkSchema,
  type SpanLink,
  SpanSchema,
  type Span,

  // Resource & Scope
  ResourceSchema,
  type Resource,
  InstrumentationScopeSchema,
  type InstrumentationScope,

  // Sampler
  SamplerTypeSchema,
  type SamplerType,
  SamplerConfigSchema,
  type SamplerConfig,

  // Exporter
  ExporterTypeSchema,
  type ExporterType,
  ExporterConfigSchema,
  type ExporterConfig,

  // Processor
  ProcessorTypeSchema,
  type ProcessorType,
  BatchProcessorConfigSchema,
  type BatchProcessorConfig,

  // Propagator
  PropagatorTypeSchema,
  type PropagatorType,

  // Tracer Config
  TracerConfigSchema,
  type TracerConfig,

  // Baggage
  BaggageEntrySchema,
  type BaggageEntry,
  BaggageSchema,
  type Baggage,

  // Context
  ContextCarrierSchema,
  type ContextCarrier,
  SpanOptionsSchema,
  type SpanOptions,

  // Events
  type TelemetryEvents,

  // Semantic Conventions
  HTTP_ATTRIBUTES,
  DB_ATTRIBUTES,
  RPC_ATTRIBUTES,
  MESSAGING_ATTRIBUTES,
  ERROR_ATTRIBUTES,
  SERVICE_ATTRIBUTES,
} from "./types.js";

// Tracer
export {
  Tracer,
  getTracer,
  createTracer,
  traced,
  withSpan,
  withSpanAsync,
} from "./tracer.js";
