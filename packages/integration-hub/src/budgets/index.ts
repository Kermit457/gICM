/**
 * Budgets Module - Cost tracking, limits, and alerts
 */

export {
  BudgetManager,
  getBudgetManager,
  createBudgetManager,
  type BudgetManagerConfig,
} from "./budget-manager.js";

export {
  // Schemas
  BudgetPeriodSchema,
  AlertSeveritySchema,
  AlertTypeSchema,
  BudgetStatusSchema,
  ThresholdConfigSchema,
  BudgetSchema,
  CreateBudgetSchema,
  AlertSchema,
  SpendingRecordSchema,
  BudgetSummarySchema,

  // Types
  type BudgetPeriod,
  type AlertSeverity,
  type AlertType,
  type BudgetStatus,
  type ThresholdConfig,
  type Budget,
  type CreateBudget,
  type Alert,
  type SpendingRecord,
  type BudgetSummary,
  type BudgetEvents,

  // Constants
  DEFAULT_THRESHOLDS,
  PERIOD_DAYS,
} from "./types.js";
