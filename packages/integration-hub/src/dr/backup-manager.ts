/**
 * Backup Manager
 * Phase 12B: Create and Manage Backups
 */

import { EventEmitter } from "eventemitter3";
import { createHash } from "crypto";
import type {
  BackupType,
  BackupStatus,
  BackupManifest,
  BackupItem,
  BackupSchedule,
  StorageConfig,
  DREvents,
  BackupResource,
} from "./types.js";
import { BACKUP_RESOURCES, DEFAULT_BACKUP_SCHEDULE } from "./types.js";

// =============================================================================
// BACKUP MANAGER
// =============================================================================

export class BackupManager extends EventEmitter<DREvents> {
  private storageConfig: StorageConfig;
  private schedule: BackupSchedule;
  private backups: Map<string, BackupManifest> = new Map();
  private scheduleInterval: NodeJS.Timeout | null = null;
  private lastFullBackupId: string | null = null;

  // Data providers for backing up
  private dataProviders: Map<BackupResource, () => Promise<unknown[]>> = new Map();

  constructor(storageConfig: StorageConfig, schedule?: Partial<BackupSchedule>) {
    super();
    this.storageConfig = storageConfig;
    this.schedule = { ...DEFAULT_BACKUP_SCHEDULE, ...schedule };
  }

  // ===========================================================================
  // DATA PROVIDERS
  // ===========================================================================

  registerDataProvider(resource: BackupResource, provider: () => Promise<unknown[]>): void {
    this.dataProviders.set(resource, provider);
    console.log(`[BACKUP] Registered data provider for: ${resource}`);
  }

  unregisterDataProvider(resource: BackupResource): void {
    this.dataProviders.delete(resource);
  }

  // ===========================================================================
  // BACKUP CREATION
  // ===========================================================================

  async createBackup(
    type: BackupType = "full",
    resources?: BackupResource[]
  ): Promise<BackupManifest> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const resourcesToBackup = resources ?? [...BACKUP_RESOURCES];

    const backup: BackupManifest = {
      id: backupId,
      type,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      sizeBytes: 0,
      items: [],
      storageLocation: this.getStorageLocation(backupId),
      version: "1.0.0",
    };

    // For incremental/differential, track parent
    if (type === "incremental" || type === "differential") {
      backup.parentBackupId = this.lastFullBackupId ?? undefined;
    }

    this.backups.set(backupId, backup);
    this.emit("backup:started", backup);

    try {
      let totalSize = 0;
      let processedResources = 0;

      for (const resource of resourcesToBackup) {
        const provider = this.dataProviders.get(resource);
        if (!provider) {
          console.log(`[BACKUP] No provider for ${resource}, skipping`);
          continue;
        }

        try {
          const data = await provider();
          const serialized = JSON.stringify(data);
          const sizeBytes = Buffer.byteLength(serialized, "utf8");
          const checksum = this.calculateChecksum(serialized);

          const item: BackupItem = {
            resource,
            type: "json",
            count: Array.isArray(data) ? data.length : 1,
            sizeBytes,
            checksum,
          };

          backup.items.push(item);
          totalSize += sizeBytes;

          // Simulate storage write (in production, write to actual storage)
          await this.writeToStorage(backupId, resource, serialized);

          processedResources++;
          const percent = Math.round((processedResources / resourcesToBackup.length) * 100);
          this.emit("backup:progress", backup, percent);
        } catch (err) {
          console.error(`[BACKUP] Failed to backup ${resource}:`, err);
        }
      }

      // Calculate overall checksum
      backup.sizeBytes = totalSize;
      backup.checksum = this.calculateManifestChecksum(backup);
      backup.status = "completed";
      backup.completedAt = new Date().toISOString();

      if (type === "full") {
        this.lastFullBackupId = backupId;
      }

      this.emit("backup:completed", backup);
      console.log(`[BACKUP] Completed: ${backupId} (${this.formatBytes(totalSize)})`);

      return backup;
    } catch (error) {
      backup.status = "failed";
      backup.completedAt = new Date().toISOString();
      this.emit("backup:failed", backup, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async createSnapshot(description?: string): Promise<BackupManifest> {
    const snapshot = await this.createBackup("snapshot");
    snapshot.metadata = { ...snapshot.metadata, description };
    return snapshot;
  }

  // ===========================================================================
  // BACKUP RETRIEVAL
  // ===========================================================================

  getBackup(backupId: string): BackupManifest | undefined {
    return this.backups.get(backupId);
  }

  listBackups(options?: {
    type?: BackupType;
    status?: BackupStatus;
    limit?: number;
    fromDate?: Date;
    toDate?: Date;
  }): BackupManifest[] {
    let backups = Array.from(this.backups.values());

    if (options?.type) {
      backups = backups.filter(b => b.type === options.type);
    }
    if (options?.status) {
      backups = backups.filter(b => b.status === options.status);
    }
    if (options?.fromDate) {
      backups = backups.filter(b => new Date(b.startedAt) >= options.fromDate!);
    }
    if (options?.toDate) {
      backups = backups.filter(b => new Date(b.startedAt) <= options.toDate!);
    }

    // Sort by date descending
    backups.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (options?.limit) {
      backups = backups.slice(0, options.limit);
    }

    return backups;
  }

  getLatestBackup(type?: BackupType): BackupManifest | undefined {
    const backups = this.listBackups({ type, status: "completed", limit: 1 });
    return backups[0];
  }

  // ===========================================================================
  // BACKUP DELETION
  // ===========================================================================

  async deleteBackup(backupId: string): Promise<boolean> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      return false;
    }

    // Don't delete if it's the parent of other backups
    const dependentBackups = Array.from(this.backups.values())
      .filter(b => b.parentBackupId === backupId);

    if (dependentBackups.length > 0) {
      throw new Error(`Cannot delete backup ${backupId}: ${dependentBackups.length} backups depend on it`);
    }

    // Delete from storage (simulated)
    await this.deleteFromStorage(backupId);

    this.backups.delete(backupId);
    console.log(`[BACKUP] Deleted: ${backupId}`);

    return true;
  }

  async cleanupExpired(): Promise<{ deletedCount: number; freedBytes: number }> {
    const now = Date.now();
    const retentionMs = this.schedule.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    let freedBytes = 0;

    const backupsToDelete: string[] = [];

    for (const [id, backup] of this.backups) {
      const backupAge = now - new Date(backup.startedAt).getTime();
      if (backupAge > retentionMs && backup.status === "completed") {
        // Check if it's a parent of other backups
        const isParent = Array.from(this.backups.values())
          .some(b => b.parentBackupId === id);

        if (!isParent) {
          backupsToDelete.push(id);
          freedBytes += backup.sizeBytes;
        }
      }
    }

    // Also enforce max backups limit
    const completedBackups = this.listBackups({ status: "completed" });
    if (completedBackups.length > this.schedule.maxBackups) {
      const excess = completedBackups.slice(this.schedule.maxBackups);
      for (const backup of excess) {
        if (!backupsToDelete.includes(backup.id)) {
          backupsToDelete.push(backup.id);
          freedBytes += backup.sizeBytes;
        }
      }
    }

    // Delete backups
    for (const id of backupsToDelete) {
      try {
        await this.deleteBackup(id);
        deletedCount++;
      } catch (err) {
        console.error(`[BACKUP] Failed to delete ${id}:`, err);
      }
    }

    if (deletedCount > 0) {
      this.emit("retention:cleaned", deletedCount, freedBytes);
      console.log(`[BACKUP] Cleanup: deleted ${deletedCount} backups, freed ${this.formatBytes(freedBytes)}`);
    }

    return { deletedCount, freedBytes };
  }

  // ===========================================================================
  // SCHEDULING
  // ===========================================================================

  startScheduler(): void {
    if (!this.schedule.enabled) {
      console.log("[BACKUP] Scheduler disabled");
      return;
    }

    // Simple interval-based scheduling (in production, use cron parser)
    const intervalMs = 24 * 60 * 60 * 1000; // Daily

    console.log(`[BACKUP] Scheduler started (${this.schedule.type} backups, ${this.schedule.retentionDays} day retention)`);

    this.scheduleInterval = setInterval(async () => {
      try {
        await this.createBackup(this.schedule.type);
        await this.cleanupExpired();
      } catch (err) {
        console.error("[BACKUP] Scheduled backup failed:", err);
      }
    }, intervalMs);
  }

  stopScheduler(): void {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
      this.scheduleInterval = null;
      console.log("[BACKUP] Scheduler stopped");
    }
  }

  // ===========================================================================
  // STORAGE OPERATIONS (Simulated)
  // ===========================================================================

  private getStorageLocation(backupId: string): string {
    const { type, bucket, path } = this.storageConfig;
    switch (type) {
      case "s3":
        return `s3://${bucket}${path}/${backupId}`;
      case "gcs":
        return `gs://${bucket}${path}/${backupId}`;
      case "azure":
        return `azure://${bucket}${path}/${backupId}`;
      case "r2":
        return `r2://${bucket}${path}/${backupId}`;
      default:
        return `${path}/${backupId}`;
    }
  }

  private async writeToStorage(backupId: string, resource: string, data: string): Promise<void> {
    // In production, implement actual storage writes
    // For now, simulate storage operation
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async deleteFromStorage(backupId: string): Promise<void> {
    // In production, implement actual storage deletion
    await new Promise(resolve => setTimeout(resolve, 20));
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private calculateChecksum(data: string): string {
    return createHash("sha256").update(data).digest("hex").slice(0, 16);
  }

  private calculateManifestChecksum(manifest: BackupManifest): string {
    const itemChecksums = manifest.items.map(i => i.checksum).sort().join("");
    return this.calculateChecksum(itemChecksums);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getStats(): {
    totalBackups: number;
    totalSizeBytes: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    backupsByType: Record<BackupType, number>;
    backupsByStatus: Record<BackupStatus, number>;
  } {
    const backups = Array.from(this.backups.values());
    const completedBackups = backups.filter(b => b.status === "completed");

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const backup of backups) {
      byType[backup.type] = (byType[backup.type] || 0) + 1;
      byStatus[backup.status] = (byStatus[backup.status] || 0) + 1;
    }

    const dates = completedBackups.map(b => new Date(b.startedAt).getTime());

    return {
      totalBackups: backups.length,
      totalSizeBytes: completedBackups.reduce((sum, b) => sum + b.sizeBytes, 0),
      oldestBackup: dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null,
      newestBackup: dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null,
      backupsByType: byType as any,
      backupsByStatus: byStatus as any,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let backupManagerInstance: BackupManager | null = null;

export function getBackupManager(): BackupManager | null {
  return backupManagerInstance;
}

export function createBackupManager(
  storageConfig: StorageConfig,
  schedule?: Partial<BackupSchedule>
): BackupManager {
  backupManagerInstance = new BackupManager(storageConfig, schedule);
  return backupManagerInstance;
}
