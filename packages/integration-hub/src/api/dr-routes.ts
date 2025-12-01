/**
 * Disaster Recovery API Routes
 * Phase 12B: Backup & Restore Management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getBackupManager,
  createBackupManager,
  getRestoreManager,
  createRestoreManager,
  type BackupType,
  type RestoreOptions,
  type BackupResource,
} from "../dr/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function drRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize managers if not already initialized
  let backupManager = getBackupManager();
  if (!backupManager) {
    backupManager = createBackupManager({
      type: "local",
      path: "/backups",
    });
  }

  let restoreManager = getRestoreManager();
  if (!restoreManager) {
    restoreManager = createRestoreManager(backupManager);
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  /**
   * GET /api/dr/status
   * Get DR status
   */
  fastify.get("/api/dr/status", async (_request, reply) => {
    const stats = backupManager!.getStats();
    const restores = restoreManager!.listRestores(5);

    return reply.send({
      success: true,
      data: {
        backups: stats,
        recentRestores: restores.length,
        currentRestore: restoreManager!.getCurrentRestore(),
      },
    });
  });

  // ===========================================================================
  // BACKUPS
  // ===========================================================================

  /**
   * GET /api/dr/backups
   * List all backups
   */
  fastify.get(
    "/api/dr/backups",
    async (
      request: FastifyRequest<{
        Querystring: {
          type?: string;
          status?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const limit = parseInt(request.query.limit || "50", 10);
      const backups = backupManager!.listBackups({
        type: request.query.type as BackupType,
        status: request.query.status as any,
        limit,
      });

      return reply.send({
        success: true,
        data: backups,
        count: backups.length,
      });
    }
  );

  /**
   * GET /api/dr/backups/:id
   * Get specific backup
   */
  fastify.get(
    "/api/dr/backups/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const backup = backupManager!.getBackup(request.params.id);

      if (!backup) {
        return reply.status(404).send({
          success: false,
          error: "Backup not found",
        });
      }

      return reply.send({
        success: true,
        data: backup,
      });
    }
  );

  /**
   * POST /api/dr/backups
   * Create a new backup
   */
  fastify.post(
    "/api/dr/backups",
    async (
      request: FastifyRequest<{
        Body: {
          type?: string;
          resources?: string[];
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const backup = await backupManager!.createBackup(
          (request.body.type || "full") as BackupType,
          request.body.resources as BackupResource[]
        );

        return reply.send({
          success: true,
          message: "Backup created",
          data: backup,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Backup failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/dr/backups/snapshot
   * Create a snapshot
   */
  fastify.post(
    "/api/dr/backups/snapshot",
    async (
      request: FastifyRequest<{ Body: { description?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const snapshot = await backupManager!.createSnapshot(request.body.description);

        return reply.send({
          success: true,
          message: "Snapshot created",
          data: snapshot,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Snapshot failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * DELETE /api/dr/backups/:id
   * Delete a backup
   */
  fastify.delete(
    "/api/dr/backups/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const deleted = await backupManager!.deleteBackup(request.params.id);

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: "Backup not found",
          });
        }

        return reply.send({
          success: true,
          message: "Backup deleted",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/dr/backups/cleanup
   * Clean up expired backups
   */
  fastify.post("/api/dr/backups/cleanup", async (_request, reply) => {
    try {
      const result = await backupManager!.cleanupExpired();

      return reply.send({
        success: true,
        message: "Cleanup completed",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cleanup failed";
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });

  // ===========================================================================
  // RESTORE
  // ===========================================================================

  /**
   * POST /api/dr/restore
   * Start a restore operation
   */
  fastify.post(
    "/api/dr/restore",
    async (
      request: FastifyRequest<{ Body: RestoreOptions }>,
      reply: FastifyReply
    ) => {
      try {
        const progress = await restoreManager!.restore(request.body);

        return reply.send({
          success: true,
          message: "Restore started",
          data: progress,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Restore failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/dr/restore/pitr
   * Point-in-time recovery
   */
  fastify.post(
    "/api/dr/restore/pitr",
    async (
      request: FastifyRequest<{ Body: { targetTime: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const targetTime = new Date(request.body.targetTime);
        const progress = await restoreManager!.restoreToPointInTime(targetTime);

        return reply.send({
          success: true,
          message: "Point-in-time restore started",
          data: progress,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "PITR failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * GET /api/dr/restore/:id
   * Get restore progress
   */
  fastify.get(
    "/api/dr/restore/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const progress = restoreManager!.getRestoreProgress(request.params.id);

      if (!progress) {
        return reply.status(404).send({
          success: false,
          error: "Restore not found",
        });
      }

      return reply.send({
        success: true,
        data: progress,
      });
    }
  );

  /**
   * GET /api/dr/restore/current
   * Get current restore operation
   */
  fastify.get("/api/dr/restore/current", async (_request, reply) => {
    const current = restoreManager!.getCurrentRestore();

    return reply.send({
      success: true,
      data: current,
    });
  });

  /**
   * GET /api/dr/restores
   * List restore history
   */
  fastify.get(
    "/api/dr/restores",
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      const limit = parseInt(request.query.limit || "20", 10);
      const restores = restoreManager!.listRestores(limit);

      return reply.send({
        success: true,
        data: restores,
        count: restores.length,
      });
    }
  );

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  /**
   * POST /api/dr/backups/:id/validate
   * Validate a backup
   */
  fastify.post(
    "/api/dr/backups/:id/validate",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const result = await restoreManager!.validateBackup(request.params.id);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Validation failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // SCHEDULER
  // ===========================================================================

  /**
   * POST /api/dr/scheduler/start
   * Start backup scheduler
   */
  fastify.post("/api/dr/scheduler/start", async (_request, reply) => {
    backupManager!.startScheduler();
    return reply.send({
      success: true,
      message: "Scheduler started",
    });
  });

  /**
   * POST /api/dr/scheduler/stop
   * Stop backup scheduler
   */
  fastify.post("/api/dr/scheduler/stop", async (_request, reply) => {
    backupManager!.stopScheduler();
    return reply.send({
      success: true,
      message: "Scheduler stopped",
    });
  });

  // ===========================================================================
  // STATS
  // ===========================================================================

  /**
   * GET /api/dr/stats
   * Get DR statistics
   */
  fastify.get("/api/dr/stats", async (_request, reply) => {
    const stats = backupManager!.getStats();

    return reply.send({
      success: true,
      data: stats,
    });
  });
}

export default drRoutes;
