/**
 * Disaster Recovery Types
 * Phase 12B: Backup & Restore
 */

import { z } from "zod";

// =============================================================================
// BACKUP TYPES
// =============================================================================

export const BackupTypeSchema = z.enum([
  "full",
  "incremental",
  "differential",
  "snapshot",
]);
export type BackupType = z.infer<typeof BackupTypeSchema>;

export const BackupStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
  "expired",
]);
export type BackupStatus = z.infer<typeof BackupStatusSchema>;

export const BackupStorageSchema = z.enum([
  "local",
  "s3",
  "gcs",
  "azure",
  "r2",
]);
export type BackupStorage = z.infer<typeof BackupStorageSchema>;

// =============================================================================
// BACKUP CONFIGURATION
// =============================================================================

export const BackupScheduleSchema = z.object({
  enabled: z.boolean().default(true),
  cron: z.string().default("0 2 * * *"), // Daily at 2 AM
  type: BackupTypeSchema.default("incremental"),
  retentionDays: z.number().default(30),
  maxBackups: z.number().default(100),
});
export type BackupSchedule = z.infer<typeof BackupScheduleSchema>;

export const StorageConfigSchema = z.object({
  type: BackupStorageSchema,
  bucket: z.string().optional(),
  region: z.string().optional(),
  path: z.string().default("/backups"),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  endpoint: z.string().optional(),
  encryption: z.object({
    enabled: z.boolean().default(true),
    algorithm: z.enum(["AES-256-GCM", "AES-256-CBC"]).default("AES-256-GCM"),
    keyId: z.string().optional(),
  }).optional(),
});
export type StorageConfig = z.infer<typeof StorageConfigSchema>;

// =============================================================================
// BACKUP MANIFEST
// =============================================================================

export const BackupItemSchema = z.object({
  resource: z.string(),
  type: z.string(),
  count: z.number(),
  sizeBytes: z.number(),
  checksum: z.string(),
});
export type BackupItem = z.infer<typeof BackupItemSchema>;

export const BackupManifestSchema = z.object({
  id: z.string(),
  type: BackupTypeSchema,
  status: BackupStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  sizeBytes: z.number().default(0),
  items: z.array(BackupItemSchema).default([]),
  parentBackupId: z.string().optional(), // For incremental backups
  checksum: z.string().optional(),
  encryptionKeyId: z.string().optional(),
  storageLocation: z.string(),
  metadata: z.record(z.unknown()).optional(),
  version: z.string().default("1.0.0"),
});
export type BackupManifest = z.infer<typeof BackupManifestSchema>;

// =============================================================================
// RESTORE TYPES
// =============================================================================

export const RestoreStatusSchema = z.enum([
  "pending",
  "validating",
  "in_progress",
  "completed",
  "failed",
  "rolled_back",
]);
export type RestoreStatus = z.infer<typeof RestoreStatusSchema>;

export const RestoreModeSchema = z.enum([
  "full",           // Restore everything
  "selective",      // Restore specific resources
  "point_in_time",  // Restore to specific point in time
]);
export type RestoreMode = z.infer<typeof RestoreModeSchema>;

export const RestoreOptionsSchema = z.object({
  mode: RestoreModeSchema.default("full"),
  targetBackupId: z.string(),
  resources: z.array(z.string()).optional(), // For selective restore
  pointInTime: z.string().optional(),
  skipValidation: z.boolean().default(false),
  createSnapshot: z.boolean().default(true), // Create snapshot before restore
  dryRun: z.boolean().default(false),
});
export type RestoreOptions = z.infer<typeof RestoreOptionsSchema>;

export const RestoreProgressSchema = z.object({
  id: z.string(),
  status: RestoreStatusSchema,
  backupId: z.string(),
  mode: RestoreModeSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  totalItems: z.number(),
  processedItems: z.number(),
  failedItems: z.number(),
  currentResource: z.string().optional(),
  errors: z.array(z.string()).default([]),
  snapshotId: z.string().optional(), // Pre-restore snapshot
});
export type RestoreProgress = z.infer<typeof RestoreProgressSchema>;

// =============================================================================
// POINT IN TIME RECOVERY
// =============================================================================

export const WALEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  resource: z.string(),
  operation: z.enum(["create", "update", "delete"]),
  data: z.unknown(),
  checksum: z.string(),
});
export type WALEntry = z.infer<typeof WALEntrySchema>;

export const RecoveryPointSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  backupId: z.string(),
  walSegment: z.number(),
  description: z.string().optional(),
});
export type RecoveryPoint = z.infer<typeof RecoveryPointSchema>;

// =============================================================================
// BACKUP VERIFICATION
// =============================================================================

export const VerificationStatusSchema = z.enum([
  "pending",
  "in_progress",
  "passed",
  "failed",
  "warnings",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationResultSchema = z.object({
  backupId: z.string(),
  status: VerificationStatusSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  checksumValid: z.boolean(),
  itemsVerified: z.number(),
  itemsFailed: z.number(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// =============================================================================
// DR MANAGER CONFIGURATION
// =============================================================================

export const DRManagerConfigSchema = z.object({
  storage: StorageConfigSchema,
  schedule: BackupScheduleSchema.optional(),
  verification: z.object({
    enabled: z.boolean().default(true),
    afterBackup: z.boolean().default(true),
    schedule: z.string().optional(), // Cron for periodic verification
  }).optional(),
  wal: z.object({
    enabled: z.boolean().default(true),
    retentionHours: z.number().default(168), // 7 days
    flushIntervalMs: z.number().default(5000),
  }).optional(),
  alerts: z.object({
    onBackupFailure: z.boolean().default(true),
    onVerificationFailure: z.boolean().default(true),
    onLowStorage: z.boolean().default(true),
    storageThresholdPercent: z.number().default(80),
  }).optional(),
});
export type DRManagerConfig = z.infer<typeof DRManagerConfigSchema>;

// =============================================================================
// DR STATE
// =============================================================================

export const DRStateSchema = z.object({
  lastBackup: BackupManifestSchema.optional(),
  lastVerification: VerificationResultSchema.optional(),
  nextScheduledBackup: z.string().optional(),
  totalBackups: z.number(),
  totalSizeBytes: z.number(),
  oldestBackup: z.string().optional(),
  newestBackup: z.string().optional(),
  storageUsedPercent: z.number(),
  walEnabled: z.boolean(),
  walSegments: z.number(),
});
export type DRState = z.infer<typeof DRStateSchema>;

// =============================================================================
// DR EVENTS
// =============================================================================

export interface DREvents {
  "backup:started": (backup: BackupManifest) => void;
  "backup:progress": (backup: BackupManifest, percent: number) => void;
  "backup:completed": (backup: BackupManifest) => void;
  "backup:failed": (backup: BackupManifest, error: Error) => void;
  "restore:started": (progress: RestoreProgress) => void;
  "restore:progress": (progress: RestoreProgress) => void;
  "restore:completed": (progress: RestoreProgress) => void;
  "restore:failed": (progress: RestoreProgress, error: Error) => void;
  "verification:started": (backupId: string) => void;
  "verification:completed": (result: VerificationResult) => void;
  "wal:flushed": (segment: number, entries: number) => void;
  "storage:low": (usedPercent: number) => void;
  "retention:cleaned": (deletedCount: number, freedBytes: number) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_BACKUP_SCHEDULE: BackupSchedule = {
  enabled: true,
  cron: "0 2 * * *", // Daily at 2 AM
  type: "incremental",
  retentionDays: 30,
  maxBackups: 100,
};

export const BACKUP_RESOURCES = [
  "pipelines",
  "schedules",
  "budgets",
  "webhooks",
  "analytics",
  "organizations",
  "members",
  "plugins",
  "templates",
  "executions",
] as const;

export type BackupResource = typeof BACKUP_RESOURCES[number];
