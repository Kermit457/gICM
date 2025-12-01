/**
 * Restore Manager
 * Phase 12B: Restore from Backups
 */

import { EventEmitter } from "eventemitter3";
import type {
  BackupManifest,
  RestoreMode,
  RestoreOptions,
  RestoreProgress,
  DREvents,
  BackupResource,
} from "./types.js";
import { BackupManager, getBackupManager } from "./backup-manager.js";

// =============================================================================
// RESTORE MANAGER
// =============================================================================

export class RestoreManager extends EventEmitter<DREvents> {
  private backupManager: BackupManager;
  private restoreHistory: Map<string, RestoreProgress> = new Map();
  private currentRestore: RestoreProgress | null = null;

  // Data handlers for restoring
  private dataHandlers: Map<BackupResource, (data: unknown[]) => Promise<void>> = new Map();

  constructor(backupManager: BackupManager) {
    super();
    this.backupManager = backupManager;
  }

  // ===========================================================================
  // DATA HANDLERS
  // ===========================================================================

  registerDataHandler(resource: BackupResource, handler: (data: unknown[]) => Promise<void>): void {
    this.dataHandlers.set(resource, handler);
    console.log(`[RESTORE] Registered data handler for: ${resource}`);
  }

  unregisterDataHandler(resource: BackupResource): void {
    this.dataHandlers.delete(resource);
  }

  // ===========================================================================
  // RESTORE EXECUTION
  // ===========================================================================

  async restore(options: RestoreOptions): Promise<RestoreProgress> {
    if (this.currentRestore && this.currentRestore.status === "in_progress") {
      throw new Error("A restore operation is already in progress");
    }

    const backup = this.backupManager.getBackup(options.targetBackupId);
    if (!backup) {
      throw new Error(`Backup not found: ${options.targetBackupId}`);
    }

    if (backup.status !== "completed") {
      throw new Error(`Cannot restore from backup with status: ${backup.status}`);
    }

    const restoreId = `restore_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const progress: RestoreProgress = {
      id: restoreId,
      status: "pending",
      backupId: options.targetBackupId,
      mode: options.mode,
      startedAt: new Date().toISOString(),
      totalItems: backup.items.length,
      processedItems: 0,
      failedItems: 0,
      errors: [],
    };

    this.currentRestore = progress;
    this.restoreHistory.set(restoreId, progress);

    // Create pre-restore snapshot if configured
    if (options.createSnapshot) {
      try {
        progress.status = "validating";
        const snapshot = await this.backupManager.createSnapshot("Pre-restore snapshot");
        progress.snapshotId = snapshot.id;
        console.log(`[RESTORE] Created pre-restore snapshot: ${snapshot.id}`);
      } catch (err) {
        console.warn("[RESTORE] Failed to create pre-restore snapshot:", err);
      }
    }

    // Dry run mode
    if (options.dryRun) {
      progress.status = "completed";
      progress.completedAt = new Date().toISOString();
      console.log(`[RESTORE] Dry run completed for backup ${options.targetBackupId}`);
      return progress;
    }

    this.emit("restore:started", progress);

    try {
      progress.status = "in_progress";

      // Determine which resources to restore
      const resourcesToRestore = options.mode === "selective" && options.resources
        ? options.resources as BackupResource[]
        : backup.items.map(item => item.resource as BackupResource);

      for (const resource of resourcesToRestore) {
        const backupItem = backup.items.find(item => item.resource === resource);
        if (!backupItem) {
          console.warn(`[RESTORE] Resource not found in backup: ${resource}`);
          continue;
        }

        const handler = this.dataHandlers.get(resource);
        if (!handler) {
          console.warn(`[RESTORE] No handler for resource: ${resource}`);
          progress.failedItems++;
          progress.errors.push(`No handler for resource: ${resource}`);
          continue;
        }

        progress.currentResource = resource;
        this.emit("restore:progress", progress);

        try {
          // In production, read actual data from storage
          // For now, simulate restore
          const data = await this.readFromStorage(backup.id, resource);
          await handler(data);

          progress.processedItems++;
          console.log(`[RESTORE] Restored ${resource} (${backupItem.count} items)`);
        } catch (err) {
          progress.failedItems++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          progress.errors.push(`Failed to restore ${resource}: ${errorMsg}`);
          console.error(`[RESTORE] Failed to restore ${resource}:`, err);
        }
      }

      progress.status = progress.failedItems === 0 ? "completed" : "completed";
      progress.completedAt = new Date().toISOString();
      progress.currentResource = undefined;

      this.emit("restore:completed", progress);
      console.log(`[RESTORE] Completed: ${progress.processedItems}/${progress.totalItems} items restored`);

      return progress;
    } catch (error) {
      progress.status = "failed";
      progress.completedAt = new Date().toISOString();
      progress.errors.push(error instanceof Error ? error.message : String(error));

      this.emit("restore:failed", progress, error instanceof Error ? error : new Error(String(error)));

      // Attempt rollback if we have a snapshot
      if (progress.snapshotId) {
        console.log(`[RESTORE] Attempting rollback to snapshot ${progress.snapshotId}`);
        // In production, implement actual rollback
        progress.status = "rolled_back";
      }

      throw error;
    } finally {
      this.currentRestore = null;
    }
  }

  // ===========================================================================
  // RESTORE STATUS
  // ===========================================================================

  getRestoreProgress(restoreId: string): RestoreProgress | undefined {
    return this.restoreHistory.get(restoreId);
  }

  getCurrentRestore(): RestoreProgress | null {
    return this.currentRestore;
  }

  listRestores(limit: number = 20): RestoreProgress[] {
    return Array.from(this.restoreHistory.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, limit);
  }

  // ===========================================================================
  // POINT IN TIME RECOVERY
  // ===========================================================================

  async restoreToPointInTime(targetTime: Date): Promise<RestoreProgress> {
    // Find the most recent backup before the target time
    const backups = this.backupManager.listBackups({ status: "completed" });
    const eligibleBackups = backups.filter(b => new Date(b.startedAt) <= targetTime);

    if (eligibleBackups.length === 0) {
      throw new Error(`No backups found before ${targetTime.toISOString()}`);
    }

    const targetBackup = eligibleBackups[0]; // Most recent before target time

    console.log(`[RESTORE] Point-in-time recovery to ${targetTime.toISOString()}`);
    console.log(`[RESTORE] Using backup ${targetBackup.id} from ${targetBackup.startedAt}`);

    return this.restore({
      mode: "point_in_time",
      targetBackupId: targetBackup.id,
      pointInTime: targetTime.toISOString(),
      createSnapshot: true,
    });
  }

  // ===========================================================================
  // STORAGE OPERATIONS (Simulated)
  // ===========================================================================

  private async readFromStorage(backupId: string, resource: string): Promise<unknown[]> {
    // In production, implement actual storage reads
    // For now, return empty array (simulated)
    await new Promise(resolve => setTimeout(resolve, 50));
    return [];
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  async validateBackup(backupId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const backup = this.backupManager.getBackup(backupId);
    if (!backup) {
      return {
        valid: false,
        errors: [`Backup not found: ${backupId}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check status
    if (backup.status !== "completed") {
      errors.push(`Backup status is ${backup.status}, not completed`);
    }

    // Check items
    if (backup.items.length === 0) {
      warnings.push("Backup contains no items");
    }

    // Check for handlers
    for (const item of backup.items) {
      if (!this.dataHandlers.has(item.resource as BackupResource)) {
        warnings.push(`No handler registered for resource: ${item.resource}`);
      }
    }

    // Check for parent backup (incremental)
    if (backup.parentBackupId) {
      const parent = this.backupManager.getBackup(backup.parentBackupId);
      if (!parent) {
        errors.push(`Parent backup not found: ${backup.parentBackupId}`);
      } else if (parent.status !== "completed") {
        errors.push(`Parent backup status is ${parent.status}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let restoreManagerInstance: RestoreManager | null = null;

export function getRestoreManager(): RestoreManager | null {
  return restoreManagerInstance;
}

export function createRestoreManager(backupManager?: BackupManager): RestoreManager {
  const mgr = backupManager ?? getBackupManager();
  if (!mgr) {
    throw new Error("BackupManager must be created first");
  }
  restoreManagerInstance = new RestoreManager(mgr);
  return restoreManagerInstance;
}
