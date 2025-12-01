/**
 * Disaster Recovery Module
 * Phase 12B: Backup & Restore
 */

// Types & Schemas
export {
  // Backup Types
  BackupTypeSchema,
  type BackupType,
  BackupStatusSchema,
  type BackupStatus,
  BackupStorageSchema,
  type BackupStorage,

  // Backup Configuration
  BackupScheduleSchema,
  type BackupSchedule,
  StorageConfigSchema,
  type StorageConfig,

  // Backup Manifest
  BackupItemSchema,
  type BackupItem,
  BackupManifestSchema,
  type BackupManifest,

  // Restore Types
  RestoreStatusSchema,
  type RestoreStatus,
  RestoreModeSchema,
  type RestoreMode,
  RestoreOptionsSchema,
  type RestoreOptions,
  RestoreProgressSchema,
  type RestoreProgress,

  // Point in Time Recovery
  WALEntrySchema,
  type WALEntry,
  RecoveryPointSchema,
  type RecoveryPoint,

  // Verification
  VerificationStatusSchema,
  type VerificationStatus,
  VerificationResultSchema,
  type VerificationResult,

  // Manager Config
  DRManagerConfigSchema,
  type DRManagerConfig,

  // State
  DRStateSchema,
  type DRState,

  // Events
  type DREvents,

  // Constants
  DEFAULT_BACKUP_SCHEDULE,
  BACKUP_RESOURCES,
  type BackupResource,
} from "./types.js";

// Backup Manager
export {
  BackupManager,
  getBackupManager,
  createBackupManager,
} from "./backup-manager.js";

// Restore Manager
export {
  RestoreManager,
  getRestoreManager,
  createRestoreManager,
} from "./restore-manager.js";
