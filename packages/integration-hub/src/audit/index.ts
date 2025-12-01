/**
 * Audit Module - Enterprise Audit Logging
 * Phase 9B: Enterprise Security
 */

// Types & Schemas
export {
  // Category & Action
  AuditCategorySchema,
  AuditCategory,
  AuditActionSchema,
  AuditAction,
  AuditSeveritySchema,
  AuditSeverity,
  AuditResultSchema,
  AuditResult,

  // Context & Resource
  AuditContextSchema,
  AuditContext,
  AuditResourceSchema,
  AuditResource,
  AuditChangeSchema,
  AuditChange,

  // Event
  AuditEventSchema,
  AuditEvent,
  CreateAuditEventSchema,
  CreateAuditEvent,

  // Query
  AuditQuerySchema,
  AuditQuery,
  AuditQueryResultSchema,
  AuditQueryResult,

  // Export & Retention
  AuditExportOptionsSchema,
  AuditExportOptions,
  AuditRetentionPolicySchema,
  AuditRetentionPolicy,

  // Stats
  AuditStatsSchema,
  AuditStats,

  // Events
  AuditLoggerEvents,

  // Constants
  DEFAULT_RETENTION_DAYS,
  SEVERITY_LEVELS,
} from "./types.js";

// Logger
export {
  AuditLogger,
  AuditLoggerConfig,
  getAuditLogger,
  createAuditLogger,
} from "./audit-logger.js";
