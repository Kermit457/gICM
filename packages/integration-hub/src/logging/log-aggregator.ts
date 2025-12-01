/**
 * Log Aggregator Implementation
 * Phase 14B: Log Aggregation
 */

import { EventEmitter } from "eventemitter3";
import { hostname } from "os";
import { createHash } from "crypto";
import {
  type LogAggregatorConfig,
  LogAggregatorConfigSchema,
  type LogEntry,
  type LogLevel,
  type LogTransport,
  type TransportConfig,
  type LogQuery,
  type LogStats,
  type LoggingEvents,
  type RedactionConfig,
  LOG_LEVEL_VALUES,
} from "./types.js";

// =============================================================================
// Console Transport
// =============================================================================

class ConsoleTransport implements LogTransport {
  readonly type = "console" as const;
  readonly level: LogLevel;
  private colorize: boolean;
  private timestamp: boolean;
  private prettyPrint: boolean;

  private colors: Record<LogLevel, string> = {
    trace: "\x1b[90m", // gray
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
    fatal: "\x1b[35m", // magenta
  };
  private reset = "\x1b[0m";

  constructor(config: TransportConfig & { type: "console" }) {
    this.level = config.level;
    this.colorize = config.colorize;
    this.timestamp = config.timestamp;
    this.prettyPrint = config.prettyPrint;
  }

  async log(entry: LogEntry): Promise<void> {
    let output: string;

    if (this.prettyPrint) {
      output = this.formatPretty(entry);
    } else {
      output = this.formatSimple(entry);
    }

    if (entry.level === "error" || entry.level === "fatal") {
      console.error(output);
    } else if (entry.level === "warn") {
      console.warn(output);
    } else if (entry.level === "debug" || entry.level === "trace") {
      console.debug(output);
    } else {
      console.log(output);
    }
  }

  private formatSimple(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(new Date(entry.timestamp).toISOString());
    }

    const levelStr = entry.level.toUpperCase().padEnd(5);
    if (this.colorize) {
      parts.push(`${this.colors[entry.level]}${levelStr}${this.reset}`);
    } else {
      parts.push(levelStr);
    }

    if (entry.logger) {
      parts.push(`[${entry.logger}]`);
    }

    parts.push(entry.message);

    if (entry.traceId) {
      parts.push(`trace=${entry.traceId.slice(0, 8)}`);
    }

    if (entry.error) {
      parts.push(`error=${entry.error.name}: ${entry.error.message}`);
    }

    return parts.join(" ");
  }

  private formatPretty(entry: LogEntry): string {
    const lines: string[] = [];

    const ts = new Date(entry.timestamp).toISOString();
    const level = this.colorize
      ? `${this.colors[entry.level]}${entry.level.toUpperCase()}${this.reset}`
      : entry.level.toUpperCase();

    lines.push(`${ts} ${level} ${entry.message}`);

    if (entry.logger) {
      lines.push(`  logger: ${entry.logger}`);
    }

    if (entry.traceId) {
      lines.push(`  traceId: ${entry.traceId}`);
    }

    if (entry.spanId) {
      lines.push(`  spanId: ${entry.spanId}`);
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      lines.push(`  data: ${JSON.stringify(entry.data, null, 2).replace(/\n/g, "\n  ")}`);
    }

    if (entry.error) {
      lines.push(`  error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        lines.push(`  ${entry.error.stack.replace(/\n/g, "\n  ")}`);
      }
    }

    return lines.join("\n");
  }
}

// =============================================================================
// Memory Transport
// =============================================================================

class MemoryTransport implements LogTransport {
  readonly type = "memory" as const;
  readonly level: LogLevel;
  private entries: LogEntry[] = [];
  private maxEntries: number;
  private circular: boolean;

  constructor(config: TransportConfig & { type: "memory" }) {
    this.level = config.level;
    this.maxEntries = config.maxEntries;
    this.circular = config.circular;
  }

  async log(entry: LogEntry): Promise<void> {
    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      if (this.circular) {
        this.entries.shift();
      } else {
        this.entries = this.entries.slice(-this.maxEntries);
      }
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  query(query: LogQuery): LogEntry[] {
    let results = [...this.entries];

    // Filter by time
    if (query.startTime) {
      results = results.filter(e => e.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(e => e.timestamp <= query.endTime!);
    }

    // Filter by level
    if (query.levels && query.levels.length > 0) {
      results = results.filter(e => query.levels!.includes(e.level));
    }

    // Filter by logger
    if (query.loggers && query.loggers.length > 0) {
      results = results.filter(e => e.logger && query.loggers!.includes(e.logger));
    }

    // Filter by trace
    if (query.traceId) {
      results = results.filter(e => e.traceId === query.traceId);
    }
    if (query.spanId) {
      results = results.filter(e => e.spanId === query.spanId);
    }
    if (query.requestId) {
      results = results.filter(e => e.requestId === query.requestId);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(e =>
        e.tags && query.tags!.some(t => e.tags!.includes(t))
      );
    }

    // Search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(e =>
        e.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(e.data).toLowerCase().includes(searchLower)
      );
    }

    // Sort
    results.sort((a, b) =>
      query.sort === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    );

    // Paginate
    return results.slice(query.offset, query.offset + query.limit);
  }
}

// =============================================================================
// HTTP Transport (Stub)
// =============================================================================

class HttpTransport implements LogTransport {
  readonly type = "http" as const;
  readonly level: LogLevel;
  private url: string;
  private headers: Record<string, string>;
  private batch: LogEntry[] = [];
  private batchSize: number;
  private batchInterval: number;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(config: TransportConfig & { type: "http" }) {
    this.level = config.level;
    this.url = config.url;
    this.headers = config.headers ?? {};
    this.batchSize = config.batch?.size ?? 100;
    this.batchInterval = config.batch?.interval ?? 5000;

    // Start batch flush interval
    this.intervalId = setInterval(() => this.flush(), this.batchInterval);
  }

  async log(entry: LogEntry): Promise<void> {
    this.batch.push(entry);

    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const toSend = [...this.batch];
    this.batch = [];

    try {
      // In a real implementation, this would use fetch
      console.log(`[HTTP Transport] Would send ${toSend.length} logs to ${this.url}`);
    } catch (error) {
      // Re-add failed logs to batch
      this.batch = [...toSend, ...this.batch];
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.flush();
  }
}

// =============================================================================
// Logger
// =============================================================================

export class Logger {
  private name: string;
  private aggregator: LogAggregator;
  private context: Record<string, unknown>;

  constructor(aggregator: LogAggregator, name: string, context: Record<string, unknown> = {}) {
    this.aggregator = aggregator;
    this.name = name;
    this.context = context;
  }

  child(name: string, context: Record<string, unknown> = {}): Logger {
    return new Logger(
      this.aggregator,
      `${this.name}.${name}`,
      { ...this.context, ...context }
    );
  }

  with(context: Record<string, unknown>): Logger {
    return new Logger(this.aggregator, this.name, { ...this.context, ...context });
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.log("trace", message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.log("error", message, data, error);
    } else {
      this.log("error", message, error);
    }
  }

  fatal(message: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.log("fatal", message, data, error);
    } else {
      this.log("fatal", message, error);
    }
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    this.aggregator.log({
      level,
      message,
      logger: this.name,
      data: { ...this.context, ...data },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
}

// =============================================================================
// Log Aggregator
// =============================================================================

export class LogAggregator extends EventEmitter<LoggingEvents> {
  private config: LogAggregatorConfig;
  private transports: LogTransport[] = [];
  private memoryTransport?: MemoryTransport;
  private buffer: LogEntry[] = [];
  private bufferInterval?: ReturnType<typeof setInterval>;
  private contextData: {
    hostname?: string;
    pid?: number;
    traceId?: string;
    spanId?: string;
    requestId?: string;
  } = {};

  constructor(config: Partial<LogAggregatorConfig> & { service: string }) {
    super();
    this.config = LogAggregatorConfigSchema.parse(config);

    // Initialize transports
    this.initializeTransports();

    // Set up context
    if (this.config.context?.includeHostname) {
      this.contextData.hostname = hostname();
    }
    if (this.config.context?.includePid) {
      this.contextData.pid = process.pid;
    }

    // Set up buffer
    if (this.config.buffer?.enabled) {
      this.bufferInterval = setInterval(
        () => this.flushBuffer(),
        this.config.buffer.flushInterval
      );
    }

    this.emit("initialized");
  }

  private initializeTransports(): void {
    for (const config of this.config.transports) {
      switch (config.type) {
        case "console":
          this.transports.push(new ConsoleTransport(config));
          break;
        case "memory":
          this.memoryTransport = new MemoryTransport(config);
          this.transports.push(this.memoryTransport);
          break;
        case "http":
          this.transports.push(new HttpTransport(config));
          break;
        // Other transports would be added here
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------

  log(entry: Partial<LogEntry> & { level: LogLevel; message: string }): void {
    // Build full entry
    const fullEntry: LogEntry = {
      timestamp: entry.timestamp ?? Date.now(),
      level: entry.level,
      message: entry.message,
      logger: entry.logger,
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
      hostname: this.contextData.hostname,
      pid: this.contextData.pid,
      traceId: entry.traceId ?? this.contextData.traceId,
      spanId: entry.spanId ?? this.contextData.spanId,
      requestId: entry.requestId ?? this.contextData.requestId,
      data: entry.data,
      error: entry.error,
      tags: entry.tags,
    };

    // Check level
    if (LOG_LEVEL_VALUES[fullEntry.level] < LOG_LEVEL_VALUES[this.config.level]) {
      return;
    }

    // Apply filter
    if (this.config.filter && !this.passesFilter(fullEntry)) {
      this.emit("filtered", fullEntry, "filter");
      return;
    }

    // Apply sampling
    if (this.config.sampling?.enabled) {
      if (!this.passesSampling(fullEntry)) {
        this.emit("sampled", fullEntry, this.config.sampling.rate);
        return;
      }
    }

    // Apply redaction
    if (this.config.redaction?.enabled) {
      this.applyRedaction(fullEntry);
    }

    // Buffer or send immediately
    if (this.config.buffer?.enabled) {
      this.buffer.push(fullEntry);
      if (this.buffer.length >= this.config.buffer.size) {
        this.flushBuffer();
      }
    } else {
      this.sendToTransports(fullEntry);
    }

    this.emit("logged", fullEntry);
  }

  // Convenience methods
  trace(message: string, data?: Record<string, unknown>): void {
    this.log({ level: "trace", message, data });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log({ level: "debug", message, data });
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log({ level: "info", message, data });
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log({ level: "warn", message, data });
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log({
      level: "error",
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log({
      level: "fatal",
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  // ---------------------------------------------------------------------------
  // Logger Factory
  // ---------------------------------------------------------------------------

  getLogger(name: string, context: Record<string, unknown> = {}): Logger {
    return new Logger(this, name, context);
  }

  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------

  setTraceContext(traceId?: string, spanId?: string): void {
    this.contextData.traceId = traceId;
    this.contextData.spanId = spanId;
  }

  setRequestId(requestId?: string): void {
    this.contextData.requestId = requestId;
  }

  clearContext(): void {
    delete this.contextData.traceId;
    delete this.contextData.spanId;
    delete this.contextData.requestId;
  }

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  query(query: LogQuery): LogEntry[] {
    if (!this.memoryTransport) {
      throw new Error("Memory transport not configured for querying");
    }
    return this.memoryTransport.query(query);
  }

  getStats(): LogStats {
    if (!this.memoryTransport) {
      throw new Error("Memory transport not configured for stats");
    }

    const entries = this.memoryTransport.getEntries();
    const byLevel: Record<LogLevel, number> = {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    };
    const byLogger: Record<string, number> = {};
    const byHour: Map<string, number> = new Map();

    for (const entry of entries) {
      byLevel[entry.level]++;

      if (entry.logger) {
        byLogger[entry.logger] = (byLogger[entry.logger] ?? 0) + 1;
      }

      const hour = new Date(entry.timestamp).toISOString().slice(0, 13);
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    }

    const errorCount = byLevel.error + byLevel.fatal;
    const errorRate = entries.length > 0 ? errorCount / entries.length : 0;

    // Calculate average entries per minute
    const timeRange = entries.length > 1
      ? (entries[entries.length - 1].timestamp - entries[0].timestamp) / 60000
      : 1;
    const avgEntriesPerMinute = entries.length / Math.max(timeRange, 1);

    return {
      total: entries.length,
      byLevel,
      byLogger,
      byHour: Array.from(byHour.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
      errorRate,
      avgEntriesPerMinute,
    };
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private passesFilter(entry: LogEntry): boolean {
    const filter = this.config.filter!;

    // Check includes
    if (filter.levels && filter.levels.length > 0) {
      if (!filter.levels.includes(entry.level)) return false;
    }

    if (filter.loggers && filter.loggers.length > 0) {
      if (!entry.logger || !filter.loggers.some(l =>
        entry.logger!.startsWith(l) || l === "*"
      )) return false;
    }

    if (filter.tags && filter.tags.length > 0) {
      if (!entry.tags || !filter.tags.some(t => entry.tags!.includes(t))) return false;
    }

    if (filter.pattern) {
      const regex = new RegExp(filter.pattern);
      if (!regex.test(entry.message)) return false;
    }

    // Check excludes
    if (filter.exclude) {
      if (filter.exclude.levels?.includes(entry.level)) return false;

      if (filter.exclude.loggers && entry.logger) {
        if (filter.exclude.loggers.some(l =>
          entry.logger!.startsWith(l) || l === "*"
        )) return false;
      }

      if (filter.exclude.tags && entry.tags) {
        if (filter.exclude.tags.some(t => entry.tags!.includes(t))) return false;
      }

      if (filter.exclude.pattern) {
        const regex = new RegExp(filter.exclude.pattern);
        if (regex.test(entry.message)) return false;
      }
    }

    return true;
  }

  private passesSampling(entry: LogEntry): boolean {
    const sampling = this.config.sampling!;

    // Check specific rules first
    if (sampling.rules) {
      for (const rule of sampling.rules) {
        if (this.matchesFilter(entry, rule.match)) {
          return Math.random() < rule.rate;
        }
      }
    }

    // Apply default rate
    return Math.random() < sampling.rate;
  }

  private matchesFilter(entry: LogEntry, filter: typeof this.config.filter): boolean {
    if (!filter) return true;

    if (filter.levels?.length && !filter.levels.includes(entry.level)) return false;
    if (filter.loggers?.length && (!entry.logger || !filter.loggers.includes(entry.logger))) return false;
    if (filter.tags?.length && (!entry.tags || !filter.tags.some(t => entry.tags!.includes(t)))) return false;
    if (filter.pattern && !new RegExp(filter.pattern).test(entry.message)) return false;

    return true;
  }

  private applyRedaction(entry: LogEntry): void {
    const redaction = this.config.redaction!;
    const redactedFields: string[] = [];

    const redactValue = (value: string): string => {
      if (redaction.hash) {
        return createHash("sha256").update(value).digest("hex").slice(0, 8);
      }
      return redaction.replacement;
    };

    const redactObject = (obj: Record<string, unknown>, path: string = ""): void => {
      for (const key of Object.keys(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check if field should be redacted
        if (redaction.fields.some(f => lowerKey.includes(f.toLowerCase()))) {
          if (typeof obj[key] === "string") {
            obj[key] = redactValue(obj[key] as string);
            redactedFields.push(fullPath);
          }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          redactObject(obj[key] as Record<string, unknown>, fullPath);
        }
      }
    };

    if (entry.data) {
      redactObject(entry.data);
    }

    // Check patterns in message
    if (redaction.patterns) {
      for (const pattern of redaction.patterns) {
        const regex = new RegExp(pattern, "g");
        if (regex.test(entry.message)) {
          entry.message = entry.message.replace(regex, redaction.replacement);
          redactedFields.push("message");
        }
      }
    }

    if (redactedFields.length > 0) {
      this.emit("redacted", entry, redactedFields);
    }
  }

  private sendToTransports(entry: LogEntry): void {
    for (const transport of this.transports) {
      if (LOG_LEVEL_VALUES[entry.level] >= LOG_LEVEL_VALUES[transport.level]) {
        transport.log(entry).catch(error => {
          this.emit("transportError", transport.type, error as Error);
        });
      }
    }
  }

  private flushBuffer(): void {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    for (const entry of entries) {
      this.sendToTransports(entry);
    }

    this.emit("bufferFlushed", entries.length);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async flush(): Promise<void> {
    this.flushBuffer();

    await Promise.all(
      this.transports
        .filter(t => t.flush)
        .map(t => t.flush!())
    );
  }

  async shutdown(): Promise<void> {
    if (this.bufferInterval) {
      clearInterval(this.bufferInterval);
    }

    await this.flush();

    await Promise.all(
      this.transports
        .filter(t => t.close)
        .map(t => t.close!())
    );

    this.emit("shutdown");
    this.removeAllListeners();
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultAggregator: LogAggregator | null = null;

export function getLogAggregator(): LogAggregator {
  if (!defaultAggregator) {
    throw new Error("Log Aggregator not initialized. Call createLogAggregator first.");
  }
  return defaultAggregator;
}

export function createLogAggregator(
  config: Partial<LogAggregatorConfig> & { service: string }
): LogAggregator {
  const aggregator = new LogAggregator(config);
  if (!defaultAggregator) {
    defaultAggregator = aggregator;
  }
  return aggregator;
}
