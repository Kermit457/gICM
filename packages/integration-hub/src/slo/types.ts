/**
 * SLO Manager Types
 * Phase 14D: Service Level Objectives
 */

import { z } from "zod";

// =============================================================================
// SLI (Service Level Indicator) Types
// =============================================================================

export const SLITypeSchema = z.enum([
  "availability", // Percentage of successful requests
  "latency", // Response time percentiles
  "throughput", // Requests per second
  "error_rate", // Percentage of errors
  "saturation", // Resource utilization
  "freshness", // Data freshness/staleness
  "correctness", // Data accuracy
  "coverage", // Feature/data coverage
  "durability", // Data durability
]);
export type SLIType = z.infer<typeof SLITypeSchema>;

export const SLIMetricSourceSchema = z.enum([
  "prometheus",
  "custom",
  "logs",
  "traces",
  "synthetic",
]);
export type SLIMetricSource = z.infer<typeof SLIMetricSourceSchema>;

export const SLIConfigSchema = z.object({
  type: SLITypeSchema,
  name: z.string(),
  description: z.string().optional(),
  source: SLIMetricSourceSchema.default("prometheus"),

  // Metric query configuration
  metric: z.object({
    good: z.string().describe("Query for good events"),
    total: z.string().describe("Query for total events"),
    // Alternative: ratio-based
    ratio: z.string().optional().describe("Direct ratio query"),
  }),

  // Latency-specific config
  latencyThreshold: z.number().optional().describe("Threshold in ms for latency SLIs"),
  latencyPercentile: z.number().optional().describe("Percentile (e.g., 99 for p99)"),

  // Filters
  filters: z.record(z.string()).optional(),
});
export type SLIConfig = z.infer<typeof SLIConfigSchema>;

export const SLIMeasurementSchema = z.object({
  timestamp: z.number(),
  good: z.number(),
  total: z.number(),
  value: z.number().describe("SLI value (0-1 or percentage)"),
});
export type SLIMeasurement = z.infer<typeof SLIMeasurementSchema>;

// =============================================================================
// SLO Types
// =============================================================================

export const SLOWindowTypeSchema = z.enum([
  "rolling", // Rolling window (e.g., last 30 days)
  "calendar", // Calendar-aligned (e.g., monthly)
]);
export type SLOWindowType = z.infer<typeof SLOWindowTypeSchema>;

export const SLOWindowSchema = z.object({
  type: SLOWindowTypeSchema,
  duration: z.number().describe("Window duration in seconds"),
  // Calendar-specific
  calendarUnit: z.enum(["day", "week", "month", "quarter"]).optional(),
});
export type SLOWindow = z.infer<typeof SLOWindowSchema>;

export const SLOTargetSchema = z.object({
  value: z.number().min(0).max(100).describe("Target percentage (e.g., 99.9)"),
  // Multi-window targets
  windows: z.array(z.object({
    window: SLOWindowSchema,
    target: z.number().min(0).max(100),
  })).optional(),
});
export type SLOTarget = z.infer<typeof SLOTargetSchema>;

export const SLOStatusSchema = z.enum([
  "healthy", // Within budget
  "warning", // Budget running low
  "critical", // Budget nearly exhausted
  "breached", // SLO violated
  "unknown", // Insufficient data
]);
export type SLOStatus = z.infer<typeof SLOStatusSchema>;

export const SLODefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  service: z.string(),
  team: z.string().optional(),

  // SLI configuration
  sli: SLIConfigSchema,

  // Target
  target: SLOTargetSchema,

  // Window
  window: SLOWindowSchema,

  // Alert thresholds
  alertThresholds: z.object({
    warning: z.number().default(50).describe("Warning when budget < X%"),
    critical: z.number().default(20).describe("Critical when budget < X%"),
  }).optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  enabled: z.boolean().default(true),
});
export type SLODefinition = z.infer<typeof SLODefinitionSchema>;

// =============================================================================
// Error Budget Types
// =============================================================================

export const ErrorBudgetSchema = z.object({
  sloId: z.string(),
  windowStart: z.number(),
  windowEnd: z.number(),

  // Budget calculations
  total: z.number().describe("Total error budget (events or percentage)"),
  consumed: z.number().describe("Consumed error budget"),
  remaining: z.number().describe("Remaining error budget"),
  remainingPercent: z.number().describe("Remaining budget as percentage"),

  // Burn rate
  burnRate: z.number().describe("Current burn rate (1 = normal, 2 = 2x burn)"),
  burnRateTrend: z.enum(["increasing", "stable", "decreasing"]),

  // Projections
  projectedExhaustion: z.number().optional().describe("Timestamp when budget exhausts"),
  daysRemaining: z.number().optional().describe("Days until budget exhausts"),
});
export type ErrorBudget = z.infer<typeof ErrorBudgetSchema>;

export const BurnRateAlertSchema = z.object({
  id: z.string(),
  sloId: z.string(),
  name: z.string(),

  // Multi-window burn rate alerting
  shortWindow: z.object({
    duration: z.number().describe("Short window in seconds (e.g., 5m)"),
    burnRateThreshold: z.number().describe("Burn rate threshold"),
  }),
  longWindow: z.object({
    duration: z.number().describe("Long window in seconds (e.g., 1h)"),
    burnRateThreshold: z.number().describe("Burn rate threshold"),
  }),

  // Page severity
  severity: z.enum(["page", "ticket", "log"]),
  enabled: z.boolean().default(true),
});
export type BurnRateAlert = z.infer<typeof BurnRateAlertSchema>;

// =============================================================================
// SLO State & History
// =============================================================================

export const SLOStateSchema = z.object({
  sloId: z.string(),
  status: SLOStatusSchema,
  currentValue: z.number().describe("Current SLI value"),
  targetValue: z.number().describe("Target SLI value"),

  // Error budget
  errorBudget: ErrorBudgetSchema,

  // Time range
  windowStart: z.number(),
  windowEnd: z.number(),

  // Measurements
  totalGood: z.number(),
  totalEvents: z.number(),

  // Last update
  lastMeasurement: z.number(),
  measurementCount: z.number(),
});
export type SLOState = z.infer<typeof SLOStateSchema>;

export const SLOHistoryEntrySchema = z.object({
  timestamp: z.number(),
  sloId: z.string(),
  value: z.number(),
  target: z.number(),
  status: SLOStatusSchema,
  errorBudgetRemaining: z.number(),
  burnRate: z.number(),
});
export type SLOHistoryEntry = z.infer<typeof SLOHistoryEntrySchema>;

// =============================================================================
// SLO Report Types
// =============================================================================

export const SLOReportPeriodSchema = z.enum([
  "day",
  "week",
  "month",
  "quarter",
  "year",
  "custom",
]);
export type SLOReportPeriod = z.infer<typeof SLOReportPeriodSchema>;

export const SLOReportSchema = z.object({
  sloId: z.string(),
  sloName: z.string(),
  service: z.string(),
  period: SLOReportPeriodSchema,
  startTime: z.number(),
  endTime: z.number(),

  // Performance
  achievedValue: z.number(),
  targetValue: z.number(),
  met: z.boolean(),
  uptime: z.number().describe("Percentage of time SLO was met"),

  // Error budget
  budgetTotal: z.number(),
  budgetConsumed: z.number(),
  budgetRemaining: z.number(),

  // Incidents
  incidentCount: z.number(),
  totalDowntime: z.number().describe("Total downtime in seconds"),
  mttr: z.number().optional().describe("Mean time to recovery"),

  // Trends
  trend: z.enum(["improving", "stable", "degrading"]),
  previousPeriodValue: z.number().optional(),
  changePercent: z.number().optional(),
});
export type SLOReport = z.infer<typeof SLOReportSchema>;

export const SLOSummarySchema = z.object({
  totalSLOs: z.number(),
  healthy: z.number(),
  warning: z.number(),
  critical: z.number(),
  breached: z.number(),
  unknown: z.number(),
  overallHealth: z.number().describe("Percentage of healthy SLOs"),
  avgErrorBudgetRemaining: z.number(),
});
export type SLOSummary = z.infer<typeof SLOSummarySchema>;

// =============================================================================
// Alert Types
// =============================================================================

export const SLOAlertTypeSchema = z.enum([
  "budget_warning", // Budget below warning threshold
  "budget_critical", // Budget below critical threshold
  "budget_exhausted", // Budget fully consumed
  "burn_rate_high", // High burn rate detected
  "slo_breached", // SLO target missed
  "slo_recovered", // SLO recovered from breach
]);
export type SLOAlertType = z.infer<typeof SLOAlertTypeSchema>;

export const SLOAlertSchema = z.object({
  id: z.string(),
  type: SLOAlertTypeSchema,
  sloId: z.string(),
  sloName: z.string(),
  service: z.string(),
  timestamp: z.number(),
  severity: z.enum(["info", "warning", "critical"]),

  // Context
  currentValue: z.number(),
  targetValue: z.number(),
  errorBudgetRemaining: z.number(),
  burnRate: z.number().optional(),

  // Message
  message: z.string(),
  details: z.record(z.unknown()).optional(),

  // State
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.number().optional(),
  resolved: z.boolean().default(false),
  resolvedAt: z.number().optional(),
});
export type SLOAlert = z.infer<typeof SLOAlertSchema>;

// =============================================================================
// Configuration
// =============================================================================

export const SLOManagerConfigSchema = z.object({
  // Measurement
  measurementInterval: z.number().default(60).describe("Measurement interval in seconds"),
  retentionDays: z.number().default(90).describe("History retention in days"),

  // Alerting
  alerting: z.object({
    enabled: z.boolean().default(true),
    defaultWarningThreshold: z.number().default(50),
    defaultCriticalThreshold: z.number().default(20),
    burnRateAlerts: z.boolean().default(true),
  }).optional(),

  // Reporting
  reporting: z.object({
    enabled: z.boolean().default(true),
    defaultPeriod: SLOReportPeriodSchema.default("week"),
    autoGenerate: z.boolean().default(false),
  }).optional(),

  // Integrations
  integrations: z.object({
    prometheus: z.object({
      url: z.string(),
      auth: z.object({
        type: z.enum(["none", "basic", "bearer"]),
        credentials: z.string().optional(),
      }).optional(),
    }).optional(),
    pagerduty: z.object({
      integrationKey: z.string(),
    }).optional(),
    slack: z.object({
      webhookUrl: z.string(),
      channel: z.string().optional(),
    }).optional(),
  }).optional(),
});
export type SLOManagerConfig = z.infer<typeof SLOManagerConfigSchema>;

// =============================================================================
// Events
// =============================================================================

export type SLOEvents = {
  // SLO Lifecycle
  sloCreated: (slo: SLODefinition) => void;
  sloUpdated: (slo: SLODefinition) => void;
  sloDeleted: (sloId: string) => void;

  // Measurements
  measured: (sloId: string, measurement: SLIMeasurement) => void;
  stateChanged: (sloId: string, state: SLOState, previousStatus: SLOStatus) => void;

  // Alerts
  alertTriggered: (alert: SLOAlert) => void;
  alertAcknowledged: (alertId: string, by: string) => void;
  alertResolved: (alertId: string) => void;

  // Error Budget
  budgetWarning: (sloId: string, remainingPercent: number) => void;
  budgetCritical: (sloId: string, remainingPercent: number) => void;
  budgetExhausted: (sloId: string) => void;
  budgetReset: (sloId: string, newBudget: ErrorBudget) => void;

  // Burn Rate
  burnRateHigh: (sloId: string, burnRate: number, window: string) => void;

  // Reports
  reportGenerated: (report: SLOReport) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Storage Interface
// =============================================================================

export interface SLOStorage {
  // SLO Definitions
  getSLO(id: string): Promise<SLODefinition | null>;
  saveSLO(slo: SLODefinition): Promise<void>;
  deleteSLO(id: string): Promise<void>;
  listSLOs(filters?: { service?: string; team?: string; enabled?: boolean }): Promise<SLODefinition[]>;

  // SLO State
  getState(sloId: string): Promise<SLOState | null>;
  saveState(state: SLOState): Promise<void>;

  // History
  addHistoryEntry(entry: SLOHistoryEntry): Promise<void>;
  getHistory(sloId: string, startTime: number, endTime: number): Promise<SLOHistoryEntry[]>;
  pruneHistory(olderThan: number): Promise<number>;

  // Alerts
  saveAlert(alert: SLOAlert): Promise<void>;
  getAlert(id: string): Promise<SLOAlert | null>;
  listAlerts(filters?: { sloId?: string; resolved?: boolean; severity?: string }): Promise<SLOAlert[]>;
  updateAlert(id: string, updates: Partial<SLOAlert>): Promise<void>;

  // Burn Rate Alerts
  saveBurnRateAlert(alert: BurnRateAlert): Promise<void>;
  getBurnRateAlerts(sloId: string): Promise<BurnRateAlert[]>;
  deleteBurnRateAlert(id: string): Promise<void>;
}

// =============================================================================
// Metric Provider Interface
// =============================================================================

export interface SLIMetricProvider {
  readonly source: SLIMetricSource;
  query(query: string, startTime: number, endTime: number): Promise<number>;
  queryRange(query: string, startTime: number, endTime: number, step: number): Promise<Array<{ timestamp: number; value: number }>>;
}

// =============================================================================
// Presets
// =============================================================================

export const SLO_PRESETS = {
  // Availability SLOs
  availability_99: {
    sli: {
      type: "availability" as const,
      name: "Availability",
      source: "prometheus" as const,
      metric: {
        good: 'sum(rate(http_requests_total{status!~"5.."}[5m]))',
        total: 'sum(rate(http_requests_total[5m]))',
      },
    },
    target: { value: 99 },
    window: { type: "rolling" as const, duration: 30 * 24 * 60 * 60 },
  },
  availability_999: {
    sli: {
      type: "availability" as const,
      name: "High Availability",
      source: "prometheus" as const,
      metric: {
        good: 'sum(rate(http_requests_total{status!~"5.."}[5m]))',
        total: 'sum(rate(http_requests_total[5m]))',
      },
    },
    target: { value: 99.9 },
    window: { type: "rolling" as const, duration: 30 * 24 * 60 * 60 },
  },

  // Latency SLOs
  latency_p99_500ms: {
    sli: {
      type: "latency" as const,
      name: "P99 Latency",
      source: "prometheus" as const,
      metric: {
        good: 'sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))',
        total: 'sum(rate(http_request_duration_seconds_count[5m]))',
      },
      latencyThreshold: 500,
      latencyPercentile: 99,
    },
    target: { value: 99 },
    window: { type: "rolling" as const, duration: 7 * 24 * 60 * 60 },
  },

  // Error Rate SLOs
  error_rate_1pct: {
    sli: {
      type: "error_rate" as const,
      name: "Error Rate",
      source: "prometheus" as const,
      metric: {
        good: 'sum(rate(http_requests_total{status!~"5.."}[5m]))',
        total: 'sum(rate(http_requests_total[5m]))',
      },
    },
    target: { value: 99 },
    window: { type: "rolling" as const, duration: 7 * 24 * 60 * 60 },
  },
} as const;

export const BURN_RATE_PRESETS = {
  // Google SRE book multi-window, multi-burn-rate alerting
  page_1h: {
    name: "1h Page Alert",
    shortWindow: { duration: 5 * 60, burnRateThreshold: 14.4 },
    longWindow: { duration: 60 * 60, burnRateThreshold: 14.4 },
    severity: "page" as const,
  },
  page_6h: {
    name: "6h Page Alert",
    shortWindow: { duration: 30 * 60, burnRateThreshold: 6 },
    longWindow: { duration: 6 * 60 * 60, burnRateThreshold: 6 },
    severity: "page" as const,
  },
  ticket_1d: {
    name: "1d Ticket Alert",
    shortWindow: { duration: 2 * 60 * 60, burnRateThreshold: 3 },
    longWindow: { duration: 24 * 60 * 60, burnRateThreshold: 3 },
    severity: "ticket" as const,
  },
  ticket_3d: {
    name: "3d Ticket Alert",
    shortWindow: { duration: 6 * 60 * 60, burnRateThreshold: 1 },
    longWindow: { duration: 3 * 24 * 60 * 60, burnRateThreshold: 1 },
    severity: "ticket" as const,
  },
} as const;
