/**
 * Audit Logging Types & Schemas
 * Phase 9B: Enterprise Security
 */

import { z } from "zod";

// ============================================================================
// AUDIT EVENT CATEGORIES
// ============================================================================

export const AuditCategorySchema = z.enum([
  "auth",           // Authentication events
  "organization",   // Org-level changes
  "member",         // Member management
  "pipeline",       // Pipeline operations
  "schedule",       // Schedule changes
  "budget",         // Budget operations
  "webhook",        // Webhook management
  "settings",       // Settings changes
  "api",            // API access
  "security",       // Security events
  "system",         // System events
]);
export type AuditCategory = z.infer<typeof AuditCategorySchema>;

// ============================================================================
// AUDIT EVENT ACTIONS
// ============================================================================

export const AuditActionSchema = z.enum([
  // Auth actions
  "login",
  "logout",
  "login_failed",
  "token_refresh",
  "password_change",
  "mfa_enabled",
  "mfa_disabled",

  // CRUD actions
  "create",
  "read",
  "update",
  "delete",

  // Execution actions
  "execute",
  "pause",
  "resume",
  "cancel",

  // Member actions
  "invite",
  "join",
  "leave",
  "role_change",

  // API actions
  "api_call",
  "rate_limited",
  "quota_exceeded",

  // Security actions
  "permission_denied",
  "suspicious_activity",
  "ip_blocked",

  // System actions
  "export",
  "import",
  "backup",
  "restore",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

// ============================================================================
// AUDIT SEVERITY
// ============================================================================

export const AuditSeveritySchema = z.enum([
  "debug",    // Development/debug info
  "info",     // Normal operations
  "warning",  // Potential issues
  "error",    // Errors
  "critical", // Critical security events
]);
export type AuditSeverity = z.infer<typeof AuditSeveritySchema>;

// ============================================================================
// AUDIT RESULT
// ============================================================================

export const AuditResultSchema = z.enum([
  "success",
  "failure",
  "partial",
  "pending",
]);
export type AuditResult = z.infer<typeof AuditResultSchema>;

// ============================================================================
// AUDIT CONTEXT
// ============================================================================

export const AuditContextSchema = z.object({
  // User context
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userRole: z.string().optional(),

  // Organization context
  orgId: z.string().optional(),
  orgName: z.string().optional(),

  // Request context
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),

  // API context
  apiKeyId: z.string().optional(),
  apiKeyName: z.string().optional(),

  // Geo context
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});
export type AuditContext = z.infer<typeof AuditContextSchema>;

// ============================================================================
// AUDIT RESOURCE
// ============================================================================

export const AuditResourceSchema = z.object({
  type: z.string(),       // pipeline, schedule, budget, etc.
  id: z.string(),         // Resource ID
  name: z.string().optional(),
  attributes: z.record(z.unknown()).optional(),
});
export type AuditResource = z.infer<typeof AuditResourceSchema>;

// ============================================================================
// AUDIT CHANGE
// ============================================================================

export const AuditChangeSchema = z.object({
  field: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
});
export type AuditChange = z.infer<typeof AuditChangeSchema>;

// ============================================================================
// AUDIT EVENT
// ============================================================================

export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),

  // Event classification
  category: AuditCategorySchema,
  action: AuditActionSchema,
  severity: AuditSeveritySchema,
  result: AuditResultSchema,

  // Event details
  description: z.string(),
  message: z.string().optional(),

  // Context
  context: AuditContextSchema,

  // Resource affected
  resource: AuditResourceSchema.optional(),

  // Changes made
  changes: z.array(AuditChangeSchema).optional(),

  // Additional metadata
  metadata: z.record(z.unknown()).optional(),

  // Error details (if applicable)
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),

  // Retention
  retentionDays: z.number().optional(),

  // Hash for integrity verification
  hash: z.string().optional(),
  previousHash: z.string().optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ============================================================================
// CREATE AUDIT EVENT INPUT
// ============================================================================

export const CreateAuditEventSchema = AuditEventSchema.omit({
  id: true,
  timestamp: true,
  hash: true,
  previousHash: true,
});
export type CreateAuditEvent = z.infer<typeof CreateAuditEventSchema>;

// ============================================================================
// AUDIT QUERY
// ============================================================================

export const AuditQuerySchema = z.object({
  // Filters
  orgId: z.string().optional(),
  userId: z.string().optional(),
  category: AuditCategorySchema.optional(),
  action: AuditActionSchema.optional(),
  severity: AuditSeveritySchema.optional(),
  result: AuditResultSchema.optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),

  // Date range
  startDate: z.date().optional(),
  endDate: z.date().optional(),

  // Search
  search: z.string().optional(),

  // Pagination
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),

  // Sorting
  sortBy: z.enum(["timestamp", "severity", "category"]).default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type AuditQuery = z.infer<typeof AuditQuerySchema>;

// ============================================================================
// AUDIT QUERY RESULT
// ============================================================================

export const AuditQueryResultSchema = z.object({
  events: z.array(AuditEventSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});
export type AuditQueryResult = z.infer<typeof AuditQueryResultSchema>;

// ============================================================================
// AUDIT EXPORT OPTIONS
// ============================================================================

export const AuditExportOptionsSchema = z.object({
  format: z.enum(["json", "csv", "pdf"]),
  query: AuditQuerySchema,
  includeContext: z.boolean().default(true),
  includeChanges: z.boolean().default(true),
  includeMetadata: z.boolean().default(false),
});
export type AuditExportOptions = z.infer<typeof AuditExportOptionsSchema>;

// ============================================================================
// AUDIT RETENTION POLICY
// ============================================================================

export const AuditRetentionPolicySchema = z.object({
  category: AuditCategorySchema,
  retentionDays: z.number().min(1),
  archiveAfterDays: z.number().optional(),
  deleteAfterArchive: z.boolean().default(false),
});
export type AuditRetentionPolicy = z.infer<typeof AuditRetentionPolicySchema>;

// ============================================================================
// AUDIT STATS
// ============================================================================

export const AuditStatsSchema = z.object({
  totalEvents: z.number(),
  eventsByCategory: z.record(z.number()),
  eventsBySeverity: z.record(z.number()),
  eventsByResult: z.record(z.number()),
  topUsers: z.array(z.object({
    userId: z.string(),
    email: z.string().optional(),
    eventCount: z.number(),
  })),
  topResources: z.array(z.object({
    resourceType: z.string(),
    resourceId: z.string(),
    eventCount: z.number(),
  })),
  recentActivity: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
});
export type AuditStats = z.infer<typeof AuditStatsSchema>;

// ============================================================================
// EVENTS
// ============================================================================

export interface AuditLoggerEvents {
  "event:logged": (event: AuditEvent) => void;
  "event:exported": (format: string, count: number) => void;
  "retention:applied": (deleted: number, archived: number) => void;
  "error": (error: Error) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_RETENTION_DAYS: Record<AuditCategory, number> = {
  auth: 365,
  organization: 730,
  member: 365,
  pipeline: 90,
  schedule: 90,
  budget: 365,
  webhook: 90,
  settings: 365,
  api: 30,
  security: 730,
  system: 365,
};

export const SEVERITY_LEVELS: Record<AuditSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};
