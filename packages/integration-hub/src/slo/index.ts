/**
 * SLO Manager Module
 * Phase 14D: Service Level Objectives
 */

// Types & Schemas
export {
  // SLI Types
  SLITypeSchema,
  type SLIType,
  SLIMetricSourceSchema,
  type SLIMetricSource,
  SLIConfigSchema,
  type SLIConfig,
  SLIMeasurementSchema,
  type SLIMeasurement,

  // SLO Window
  SLOWindowTypeSchema,
  type SLOWindowType,
  SLOWindowSchema,
  type SLOWindow,

  // SLO Target
  SLOTargetSchema,
  type SLOTarget,

  // SLO Status
  SLOStatusSchema,
  type SLOStatus,

  // SLO Definition
  SLODefinitionSchema,
  type SLODefinition,

  // Error Budget
  ErrorBudgetSchema,
  type ErrorBudget,
  BurnRateAlertSchema,
  type BurnRateAlert,

  // SLO State & History
  SLOStateSchema,
  type SLOState,
  SLOHistoryEntrySchema,
  type SLOHistoryEntry,

  // Reports
  SLOReportPeriodSchema,
  type SLOReportPeriod,
  SLOReportSchema,
  type SLOReport,
  SLOSummarySchema,
  type SLOSummary,

  // Alerts
  SLOAlertTypeSchema,
  type SLOAlertType,
  SLOAlertSchema,
  type SLOAlert,

  // Config
  SLOManagerConfigSchema,
  type SLOManagerConfig,

  // Events & Interfaces
  type SLOEvents,
  type SLOStorage,
  type SLIMetricProvider,

  // Presets
  SLO_PRESETS,
  BURN_RATE_PRESETS,
} from "./types.js";

// SLO Manager
export {
  SLOManager,
  getSLOManager,
  createSLOManager,
} from "./slo-manager.js";
