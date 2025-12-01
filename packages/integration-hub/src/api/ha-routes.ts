/**
 * High Availability API Routes
 * Phase 12A: Multi-Region Management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getHAManager,
  createHAManager,
  DEFAULT_HA_CONFIG,
  type Region,
  type RegionConfig,
  type HAManagerConfig,
} from "../ha/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function haRoutes(fastify: FastifyInstance): Promise<void> {
  // Initialize HA Manager if not already initialized
  let haManager = getHAManager();
  if (!haManager) {
    haManager = createHAManager(DEFAULT_HA_CONFIG);
  }

  // ===========================================================================
  // STATE & STATUS
  // ===========================================================================

  /**
   * GET /api/ha/status
   * Get overall HA status
   */
  fastify.get("/api/ha/status", async (_request, reply) => {
    const state = haManager!.getState();
    return reply.send({
      success: true,
      data: {
        started: haManager!.isStarted(),
        primaryRegion: state.primaryRegion,
        activeRegions: state.activeRegions,
        globalLatencyMs: state.globalLatencyMs,
        globalAvailability: state.globalAvailability,
        failoverCount24h: state.failoverCount24h,
        lastUpdated: state.lastUpdated,
      },
    });
  });

  /**
   * GET /api/ha/state
   * Get full HA state
   */
  fastify.get("/api/ha/state", async (_request, reply) => {
    const state = haManager!.getState();
    return reply.send({
      success: true,
      data: state,
    });
  });

  /**
   * POST /api/ha/start
   * Start HA monitoring
   */
  fastify.post("/api/ha/start", async (_request, reply) => {
    haManager!.start();
    return reply.send({
      success: true,
      message: "HA Manager started",
    });
  });

  /**
   * POST /api/ha/stop
   * Stop HA monitoring
   */
  fastify.post("/api/ha/stop", async (_request, reply) => {
    haManager!.stop();
    return reply.send({
      success: true,
      message: "HA Manager stopped",
    });
  });

  // ===========================================================================
  // REGION MANAGEMENT
  // ===========================================================================

  /**
   * GET /api/ha/regions
   * List all configured regions
   */
  fastify.get("/api/ha/regions", async (_request, reply) => {
    const config = haManager!.getConfig();
    return reply.send({
      success: true,
      data: config.regions,
      count: config.regions.length,
    });
  });

  /**
   * GET /api/ha/regions/:region
   * Get specific region details
   */
  fastify.get(
    "/api/ha/regions/:region",
    async (
      request: FastifyRequest<{ Params: { region: string } }>,
      reply: FastifyReply
    ) => {
      const config = haManager!.getConfig();
      const region = config.regions.find(r => r.region === request.params.region);

      if (!region) {
        return reply.status(404).send({
          success: false,
          error: "Region not found",
        });
      }

      const state = haManager!.getState();
      const health = state.regionHealth[request.params.region as Region];

      return reply.send({
        success: true,
        data: {
          ...region,
          health,
        },
      });
    }
  );

  /**
   * POST /api/ha/regions
   * Add a new region
   */
  fastify.post(
    "/api/ha/regions",
    async (
      request: FastifyRequest<{ Body: RegionConfig }>,
      reply: FastifyReply
    ) => {
      try {
        haManager!.addRegion(request.body);
        return reply.send({
          success: true,
          message: "Region added",
          data: request.body,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add region";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * DELETE /api/ha/regions/:region
   * Remove a region
   */
  fastify.delete(
    "/api/ha/regions/:region",
    async (
      request: FastifyRequest<{ Params: { region: string } }>,
      reply: FastifyReply
    ) => {
      try {
        haManager!.removeRegion(request.params.region as Region);
        return reply.send({
          success: true,
          message: "Region removed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to remove region";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // HEALTH CHECKS
  // ===========================================================================

  /**
   * GET /api/ha/health
   * Get all region health results
   */
  fastify.get("/api/ha/health", async (_request, reply) => {
    const state = haManager!.getState();
    return reply.send({
      success: true,
      data: state.regionHealth,
    });
  });

  /**
   * POST /api/ha/health/check
   * Trigger immediate health check
   */
  fastify.post("/api/ha/health/check", async (_request, reply) => {
    try {
      const healthChecker = haManager!.getHealthChecker();
      const results = await healthChecker.checkAllRegions();
      return reply.send({
        success: true,
        data: results,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed";
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });

  /**
   * POST /api/ha/health/check/:region
   * Check specific region health
   */
  fastify.post(
    "/api/ha/health/check/:region",
    async (
      request: FastifyRequest<{ Params: { region: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const healthChecker = haManager!.getHealthChecker();
        const result = await healthChecker.checkRegion(request.params.region as Region);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Health check failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // LOAD BALANCING
  // ===========================================================================

  /**
   * GET /api/ha/lb/stats
   * Get load balancer statistics
   */
  fastify.get("/api/ha/lb/stats", async (_request, reply) => {
    const loadBalancer = haManager!.getLoadBalancer();
    const stats = loadBalancer.getStats();
    return reply.send({
      success: true,
      data: stats,
    });
  });

  /**
   * POST /api/ha/lb/route
   * Get routing decision
   */
  fastify.post(
    "/api/ha/lb/route",
    async (
      request: FastifyRequest<{
        Body: {
          clientIp?: string;
          sessionId?: string;
          preferredRegion?: string;
          excludeRegions?: string[];
        };
      }>,
      reply: FastifyReply
    ) => {
      const decision = haManager!.route({
        clientIp: request.body.clientIp,
        sessionId: request.body.sessionId,
        preferredRegion: request.body.preferredRegion as Region,
        excludeRegions: request.body.excludeRegions as Region[],
      });

      if (!decision) {
        return reply.status(503).send({
          success: false,
          error: "No available regions",
        });
      }

      return reply.send({
        success: true,
        data: decision,
      });
    }
  );

  // ===========================================================================
  // FAILOVER
  // ===========================================================================

  /**
   * GET /api/ha/failover/status
   * Get failover status
   */
  fastify.get("/api/ha/failover/status", async (_request, reply) => {
    const failoverManager = haManager!.getFailoverManager();
    const stats = failoverManager.getStats();
    return reply.send({
      success: true,
      data: stats,
    });
  });

  /**
   * GET /api/ha/failover/history
   * Get failover history
   */
  fastify.get(
    "/api/ha/failover/history",
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      const limit = parseInt(request.query.limit || "10", 10);
      const failoverManager = haManager!.getFailoverManager();
      const history = failoverManager.getFailoverHistory(limit);
      return reply.send({
        success: true,
        data: history,
        count: history.length,
      });
    }
  );

  /**
   * POST /api/ha/failover
   * Trigger manual failover
   */
  fastify.post(
    "/api/ha/failover",
    async (
      request: FastifyRequest<{ Body: { toRegion: string; reason?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const event = await haManager!.triggerFailover(
          request.body.toRegion as Region,
          request.body.reason
        );

        if (!event) {
          return reply.status(400).send({
            success: false,
            error: "Failover could not be triggered",
          });
        }

        return reply.send({
          success: true,
          message: "Failover triggered",
          data: event,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failover failed";
        return reply.status(500).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * GET /api/ha/failover/pending
   * Get pending failover approvals
   */
  fastify.get("/api/ha/failover/pending", async (_request, reply) => {
    const failoverManager = haManager!.getFailoverManager();
    const pending = failoverManager.getPendingApprovals();
    return reply.send({
      success: true,
      data: pending,
      count: pending.length,
    });
  });

  /**
   * POST /api/ha/failover/:id/approve
   * Approve pending failover
   */
  fastify.post(
    "/api/ha/failover/:id/approve",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const event = haManager!.approveFailover(request.params.id);

      if (!event) {
        return reply.status(404).send({
          success: false,
          error: "Failover not found",
        });
      }

      return reply.send({
        success: true,
        message: "Failover approved",
        data: event,
      });
    }
  );

  /**
   * POST /api/ha/failover/:id/reject
   * Reject pending failover
   */
  fastify.post(
    "/api/ha/failover/:id/reject",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { reason?: string };
      }>,
      reply: FastifyReply
    ) => {
      const event = haManager!.rejectFailover(
        request.params.id,
        request.body.reason
      );

      if (!event) {
        return reply.status(404).send({
          success: false,
          error: "Failover not found",
        });
      }

      return reply.send({
        success: true,
        message: "Failover rejected",
        data: event,
      });
    }
  );

  // ===========================================================================
  // REPLICATION
  // ===========================================================================

  /**
   * GET /api/ha/replication
   * Get replication status
   */
  fastify.get("/api/ha/replication", async (_request, reply) => {
    const state = haManager!.getState();
    return reply.send({
      success: true,
      data: state.replicationStatus,
    });
  });

  /**
   * POST /api/ha/replication/status
   * Update replication status (for external replication systems)
   */
  fastify.post(
    "/api/ha/replication/status",
    async (
      request: FastifyRequest<{
        Body: {
          sourceRegion: string;
          targetRegion: string;
          mode: string;
          lagMs: number;
          bytesReplicated: number;
          healthy: boolean;
          error?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        haManager!.updateReplicationStatus({
          sourceRegion: request.body.sourceRegion as Region,
          targetRegion: request.body.targetRegion as Region,
          mode: request.body.mode as any,
          lagMs: request.body.lagMs,
          bytesReplicated: request.body.bytesReplicated,
          lastReplicatedAt: new Date().toISOString(),
          healthy: request.body.healthy,
          error: request.body.error,
        });

        return reply.send({
          success: true,
          message: "Replication status updated",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update status";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  /**
   * GET /api/ha/config
   * Get HA configuration
   */
  fastify.get("/api/ha/config", async (_request, reply) => {
    const config = haManager!.getConfig();
    return reply.send({
      success: true,
      data: {
        healthCheck: config.healthCheck,
        loadBalancing: config.loadBalancing,
        failover: config.failover,
        replication: config.replication,
        monitoring: config.monitoring,
      },
    });
  });
}

export default haRoutes;
