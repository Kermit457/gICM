/**
 * Structured Logger
 * Phase 12D: OpenTelemetry-compatible logging
 */

import { EventEmitter } from "eventemitter3";
import type {
  LogSeverity,
  LogRecord,
  ObservabilityConfig,
  ObservabilityEvents,
  LogQuery,
  TraceContext,
} from "./types.js";

// =============================================================================
// SEVERITY LEVELS
// =============================================================================

const SEVERITY_LEVELS: Record<LogSeverity, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

// =============================================================================
// LOGGER
// =============================================================================

export class Logger extends EventEmitter<ObservabilityEvents> {
  private config: ObservabilityConfig;
  private logs: LogRecord[] = [];
  private maxLogs: number = 10000;
  private currentContext?: TraceContext;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    super();
    this.config = {
      serviceName: config.serviceName ?? "integration-hub",
      serviceVersion: config.serviceVersion,
      environment: config.environment ?? "development",
      tracing: { enabled: true, sampler: { type: "always_on", ratio: 1, parentBased: true }, maxSpanAttributes: 128, maxSpanEvents: 128, maxSpanLinks: 128, ...config.tracing },
      metrics: { enabled: true, collectInterval: 60000, defaultBuckets: [], ...config.metrics },
      logging: {
        enabled: true,
        minSeverity: "INFO",
        includeTraceContext: true,
        ...config.logging,
      },
      resource: { attributes: {}, ...config.resource },
      retention: { traces: 86400000, metrics: 604800000, logs: 86400000, ...config.retention },
    };

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Set trace context for subsequent logs
   */
  setContext(context: TraceContext | undefined): void {
    this.currentContext = context;
  }

  /**
   * Create a child logger with a specific context
   */
  withContext(context: TraceContext): Logger {
    const child = new Logger({
      ...this.config,
      serviceName: this.config.serviceName,
    });
    child.setContext(context);
    return child;
  }

  /**
   * Log with specified severity
   */
  log(
    severity: LogSeverity,
    message: string,
    attributes: Record<string, string | number | boolean> = {}
  ): void {
    if (!this.config.logging.enabled) return;

    // Check minimum severity
    const minLevel = SEVERITY_LEVELS[this.config.logging.minSeverity];
    const currentLevel = SEVERITY_LEVELS[severity];
    if (currentLevel < minLevel) return;

    const record: LogRecord = {
      timestamp: Date.now(),
      severity,
      body: message,
      attributes,
      resource: {
        serviceName: this.config.serviceName,
        environment: this.config.environment,
      },
    };

    // Add trace context if enabled
    if (this.config.logging.includeTraceContext && this.currentContext) {
      record.traceId = this.currentContext.traceId;
      record.spanId = this.currentContext.spanId;
    }

    // Store log
    this.logs.push(record);

    // Trim if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.emit("log:recorded", record);

    // Also output to console in development
    if (this.config.environment === "development") {
      this.outputToConsole(record);
    }
  }

  /**
   * Log at TRACE level
   */
  trace(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    this.log("TRACE", message, attributes);
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    this.log("DEBUG", message, attributes);
  }

  /**
   * Log at INFO level
   */
  info(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    this.log("INFO", message, attributes);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    this.log("WARN", message, attributes);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, error?: Error, attributes: Record<string, string | number | boolean> = {}): void {
    const attrs = { ...attributes };
    if (error) {
      attrs["error.type"] = error.name;
      attrs["error.message"] = error.message;
      attrs["error.stack"] = error.stack ?? "";
    }
    this.log("ERROR", message, attrs);
  }

  /**
   * Log at FATAL level
   */
  fatal(message: string, error?: Error, attributes: Record<string, string | number | boolean> = {}): void {
    const attrs = { ...attributes };
    if (error) {
      attrs["error.type"] = error.name;
      attrs["error.message"] = error.message;
      attrs["error.stack"] = error.stack ?? "";
    }
    this.log("FATAL", message, attrs);
  }

  /**
   * Query logs
   */
  query(query: LogQuery): LogRecord[] {
    let results = this.logs;

    // Filter by trace ID
    if (query.traceId) {
      results = results.filter(l => l.traceId === query.traceId);
    }

    // Filter by span ID
    if (query.spanId) {
      results = results.filter(l => l.spanId === query.spanId);
    }

    // Filter by service name
    if (query.serviceName) {
      results = results.filter(l => l.resource.serviceName === query.serviceName);
    }

    // Filter by severity
    if (query.severity) {
      const minLevel = SEVERITY_LEVELS[query.severity];
      results = results.filter(l => SEVERITY_LEVELS[l.severity] >= minLevel);
    }

    // Filter by body content
    if (query.bodyContains) {
      const search = query.bodyContains.toLowerCase();
      results = results.filter(l => l.body.toLowerCase().includes(search));
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(l => l.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(l => l.timestamp <= query.endTime!);
    }

    // Apply limit
    const limit = query.limit ?? 100;
    return results.slice(-limit);
  }

  /**
   * Get logs for a specific trace
   */
  getTraceLogs(traceId: string): LogRecord[] {
    return this.logs.filter(l => l.traceId === traceId);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogRecord[] {
    return [...this.logs];
  }

  /**
   * Get stats
   */
  getStats(): {
    totalLogs: number;
    bySeverity: Record<LogSeverity, number>;
    logsPerMinute: number;
  } {
    const bySeverity: Record<LogSeverity, number> = {
      TRACE: 0,
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      FATAL: 0,
    };

    const oneMinuteAgo = Date.now() - 60000;
    let recentCount = 0;

    for (const log of this.logs) {
      bySeverity[log.severity]++;
      if (log.timestamp >= oneMinuteAgo) {
        recentCount++;
      }
    }

    return {
      totalLogs: this.logs.length,
      bySeverity,
      logsPerMinute: recentCount,
    };
  }

  /**
   * Output log to console
   */
  private outputToConsole(record: LogRecord): void {
    const timestamp = new Date(record.timestamp).toISOString();
    const prefix = `[${timestamp}] [${record.severity}]`;
    const traceInfo = record.traceId ? ` [trace=${record.traceId.substring(0, 8)}]` : "";

    switch (record.severity) {
      case "TRACE":
      case "DEBUG":
        console.debug(`${prefix}${traceInfo} ${record.body}`, record.attributes);
        break;
      case "INFO":
        console.info(`${prefix}${traceInfo} ${record.body}`, record.attributes);
        break;
      case "WARN":
        console.warn(`${prefix}${traceInfo} ${record.body}`, record.attributes);
        break;
      case "ERROR":
      case "FATAL":
        console.error(`${prefix}${traceInfo} ${record.body}`, record.attributes);
        break;
    }
  }

  /**
   * Clean up old logs
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.config.retention.logs;
    this.logs = this.logs.filter(l => l.timestamp >= cutoff);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  toJSON(): LogRecord[] {
    return [...this.logs];
  }

  /**
   * Export logs as NDJSON (newline-delimited JSON)
   */
  toNDJSON(): string {
    return this.logs.map(l => JSON.stringify(l)).join("\n");
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let loggerInstance: Logger | null = null;

export function getLogger(): Logger | null {
  return loggerInstance;
}

export function createLogger(config?: Partial<ObservabilityConfig>): Logger {
  loggerInstance = new Logger(config);
  return loggerInstance;
}
