/**
 * Log Aggregator Module
 * Phase 14B: Log Aggregation
 */

// Types & Schemas
export {
  // Log Levels
  LogLevelSchema,
  type LogLevel,
  LOG_LEVEL_VALUES,

  // Log Entry
  LogEntrySchema,
  type LogEntry,

  // Transport Types
  TransportTypeSchema,
  type TransportType,

  // Transport Configs
  ConsoleTransportConfigSchema,
  type ConsoleTransportConfig,
  FileTransportConfigSchema,
  type FileTransportConfig,
  HttpTransportConfigSchema,
  type HttpTransportConfig,
  MemoryTransportConfigSchema,
  type MemoryTransportConfig,
  ElasticsearchTransportConfigSchema,
  type ElasticsearchTransportConfig,
  LokiTransportConfigSchema,
  type LokiTransportConfig,
  TransportConfigSchema,
  type TransportConfig,

  // Formatter
  FormatterTypeSchema,
  type FormatterType,
  FormatterConfigSchema,
  type FormatterConfig,

  // Filter
  LogFilterSchema,
  type LogFilter,

  // Sampling
  SamplingConfigSchema,
  type SamplingConfig,

  // Redaction
  RedactionConfigSchema,
  type RedactionConfig,

  // Aggregator Config
  LogAggregatorConfigSchema,
  type LogAggregatorConfig,

  // Query & Stats
  LogQuerySchema as LogAggregatorQuerySchema,
  type LogQuery as LogAggregatorQuery,
  LogStatsSchema,
  type LogStats,

  // Events & Interface
  type LoggingEvents,
  type LogTransport,
} from "./types.js";

// Log Aggregator
export {
  LogAggregator,
  Logger,
  getLogAggregator,
  createLogAggregator,
} from "./log-aggregator.js";
