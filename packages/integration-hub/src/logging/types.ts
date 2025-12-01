/**
 * Log Aggregator Types
 * Phase 14B: Log Aggregation
 */

import { z } from "zod";

// =============================================================================
// Log Levels
// =============================================================================

export const LogLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

// =============================================================================
// Log Entry
// =============================================================================

export const LogEntrySchema = z.object({
  timestamp: z.number(),
  level: LogLevelSchema,
  message: z.string(),
  logger: z.string().optional(),

  // Context
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  requestId: z.string().optional(),

  // Service info
  service: z.string().optional(),
  version: z.string().optional(),
  environment: z.string().optional(),
  hostname: z.string().optional(),
  pid: z.number().optional(),

  // Additional data
  data: z.record(z.unknown()).optional(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    code: z.string().optional(),
  }).optional(),

  // Tags for filtering
  tags: z.array(z.string()).optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

// =============================================================================
// Transport Types
// =============================================================================

export const TransportTypeSchema = z.enum([
  "console",
  "file",
  "http",
  "stream",
  "memory",
  "elasticsearch",
  "loki",
  "datadog",
  "cloudwatch",
]);
export type TransportType = z.infer<typeof TransportTypeSchema>;

// =============================================================================
// Console Transport Config
// =============================================================================

export const ConsoleTransportConfigSchema = z.object({
  type: z.literal("console"),
  level: LogLevelSchema.default("info"),
  colorize: z.boolean().default(true),
  timestamp: z.boolean().default(true),
  prettyPrint: z.boolean().default(false),
});
export type ConsoleTransportConfig = z.infer<typeof ConsoleTransportConfigSchema>;

// =============================================================================
// File Transport Config
// =============================================================================

export const FileTransportConfigSchema = z.object({
  type: z.literal("file"),
  level: LogLevelSchema.default("info"),
  path: z.string(),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB
  maxFiles: z.number().default(5),
  compress: z.boolean().default(true),
  json: z.boolean().default(true),
});
export type FileTransportConfig = z.infer<typeof FileTransportConfigSchema>;

// =============================================================================
// HTTP Transport Config
// =============================================================================

export const HttpTransportConfigSchema = z.object({
  type: z.literal("http"),
  level: LogLevelSchema.default("info"),
  url: z.string().url(),
  method: z.enum(["POST", "PUT"]).default("POST"),
  headers: z.record(z.string()).optional(),
  auth: z.object({
    type: z.enum(["basic", "bearer", "api_key"]),
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional(),
  }).optional(),
  batch: z.object({
    size: z.number().default(100),
    interval: z.number().default(5000),
  }).optional(),
  retry: z.object({
    attempts: z.number().default(3),
    delay: z.number().default(1000),
  }).optional(),
  timeout: z.number().default(30000),
});
export type HttpTransportConfig = z.infer<typeof HttpTransportConfigSchema>;

// =============================================================================
// Memory Transport Config
// =============================================================================

export const MemoryTransportConfigSchema = z.object({
  type: z.literal("memory"),
  level: LogLevelSchema.default("debug"),
  maxEntries: z.number().default(1000),
  circular: z.boolean().default(true),
});
export type MemoryTransportConfig = z.infer<typeof MemoryTransportConfigSchema>;

// =============================================================================
// Elasticsearch Transport Config
// =============================================================================

export const ElasticsearchTransportConfigSchema = z.object({
  type: z.literal("elasticsearch"),
  level: LogLevelSchema.default("info"),
  nodes: z.array(z.string().url()),
  index: z.string().default("logs"),
  indexPattern: z.string().default("logs-%Y.%m.%d"),
  auth: z.object({
    username: z.string(),
    password: z.string(),
  }).optional(),
  ssl: z.object({
    rejectUnauthorized: z.boolean().default(true),
    ca: z.string().optional(),
  }).optional(),
  batch: z.object({
    size: z.number().default(500),
    interval: z.number().default(5000),
  }).optional(),
});
export type ElasticsearchTransportConfig = z.infer<typeof ElasticsearchTransportConfigSchema>;

// =============================================================================
// Loki Transport Config
// =============================================================================

export const LokiTransportConfigSchema = z.object({
  type: z.literal("loki"),
  level: LogLevelSchema.default("info"),
  url: z.string().url(),
  labels: z.record(z.string()).default({}),
  auth: z.object({
    username: z.string(),
    password: z.string(),
  }).optional(),
  batch: z.object({
    size: z.number().default(100),
    interval: z.number().default(5000),
  }).optional(),
});
export type LokiTransportConfig = z.infer<typeof LokiTransportConfigSchema>;

// =============================================================================
// Combined Transport Config
// =============================================================================

export const TransportConfigSchema = z.discriminatedUnion("type", [
  ConsoleTransportConfigSchema,
  FileTransportConfigSchema,
  HttpTransportConfigSchema,
  MemoryTransportConfigSchema,
  ElasticsearchTransportConfigSchema,
  LokiTransportConfigSchema,
]);
export type TransportConfig = z.infer<typeof TransportConfigSchema>;

// =============================================================================
// Formatter
// =============================================================================

export const FormatterTypeSchema = z.enum([
  "json",
  "text",
  "pretty",
  "logfmt",
  "ecs", // Elastic Common Schema
]);
export type FormatterType = z.infer<typeof FormatterTypeSchema>;

export const FormatterConfigSchema = z.object({
  type: FormatterTypeSchema.default("json"),
  timestamp: z.enum(["iso", "epoch", "unix", "none"]).default("iso"),
  includeLevel: z.boolean().default(true),
  includeMeta: z.boolean().default(true),
  fields: z.object({
    timestamp: z.string().default("timestamp"),
    level: z.string().default("level"),
    message: z.string().default("message"),
    error: z.string().default("error"),
  }).optional(),
});
export type FormatterConfig = z.infer<typeof FormatterConfigSchema>;

// =============================================================================
// Filter
// =============================================================================

export const LogFilterSchema = z.object({
  levels: z.array(LogLevelSchema).optional(),
  loggers: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  pattern: z.string().optional().describe("Regex pattern for message"),
  exclude: z.object({
    levels: z.array(LogLevelSchema).optional(),
    loggers: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    pattern: z.string().optional(),
  }).optional(),
});
export type LogFilter = z.infer<typeof LogFilterSchema>;

// =============================================================================
// Sampling
// =============================================================================

export const SamplingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  rate: z.number().min(0).max(1).default(1),
  rules: z.array(z.object({
    match: LogFilterSchema,
    rate: z.number().min(0).max(1),
  })).optional(),
});
export type SamplingConfig = z.infer<typeof SamplingConfigSchema>;

// =============================================================================
// Redaction
// =============================================================================

export const RedactionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  fields: z.array(z.string()).default([
    "password",
    "secret",
    "token",
    "apiKey",
    "api_key",
    "authorization",
    "cookie",
    "creditCard",
    "credit_card",
    "ssn",
  ]),
  patterns: z.array(z.string()).optional().describe("Regex patterns"),
  replacement: z.string().default("[REDACTED]"),
  hash: z.boolean().default(false).describe("Hash instead of replace"),
});
export type RedactionConfig = z.infer<typeof RedactionConfigSchema>;

// =============================================================================
// Log Aggregator Config
// =============================================================================

export const LogAggregatorConfigSchema = z.object({
  service: z.string(),
  version: z.string().optional(),
  environment: z.string().optional(),

  level: LogLevelSchema.default("info"),
  transports: z.array(TransportConfigSchema).default([
    { type: "console", level: "info", colorize: true, timestamp: true, prettyPrint: false },
  ]),

  formatter: FormatterConfigSchema.optional(),
  filter: LogFilterSchema.optional(),
  sampling: SamplingConfigSchema.optional(),
  redaction: RedactionConfigSchema.optional(),

  context: z.object({
    includeHostname: z.boolean().default(true),
    includePid: z.boolean().default(true),
    includeTraceContext: z.boolean().default(true),
  }).optional(),

  buffer: z.object({
    enabled: z.boolean().default(false),
    size: z.number().default(1000),
    flushInterval: z.number().default(5000),
  }).optional(),
});
export type LogAggregatorConfig = z.infer<typeof LogAggregatorConfigSchema>;

// =============================================================================
// Log Query
// =============================================================================

export const LogQuerySchema = z.object({
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  levels: z.array(LogLevelSchema).optional(),
  loggers: z.array(z.string()).optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  requestId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().default(100),
  offset: z.number().default(0),
  sort: z.enum(["asc", "desc"]).default("desc"),
});
export type LogQuery = z.infer<typeof LogQuerySchema>;

// =============================================================================
// Log Stats
// =============================================================================

export const LogStatsSchema = z.object({
  total: z.number(),
  byLevel: z.record(LogLevelSchema, z.number()),
  byLogger: z.record(z.string(), z.number()),
  byHour: z.array(z.object({
    hour: z.string(),
    count: z.number(),
  })),
  errorRate: z.number(),
  avgEntriesPerMinute: z.number(),
});
export type LogStats = z.infer<typeof LogStatsSchema>;

// =============================================================================
// Events
// =============================================================================

export type LoggingEvents = {
  // Log Events
  logged: (entry: LogEntry) => void;
  filtered: (entry: LogEntry, reason: string) => void;
  sampled: (entry: LogEntry, rate: number) => void;
  redacted: (entry: LogEntry, fields: string[]) => void;

  // Transport Events
  transportError: (transport: TransportType, error: Error) => void;
  transported: (transport: TransportType, count: number) => void;
  bufferFlushed: (count: number) => void;

  // Lifecycle
  initialized: () => void;
  shutdown: () => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Transport Interface
// =============================================================================

export interface LogTransport {
  readonly type: TransportType;
  readonly level: LogLevel;
  log(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}
