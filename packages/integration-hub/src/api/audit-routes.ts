/**
 * Audit API Routes
 * Phase 9B: Enterprise Audit Logging
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  AuditLogger,
  getAuditLogger,
  AuditQuerySchema,
  AuditExportOptionsSchema,
  AuditCategory,
  AuditAction,
  AuditSeverity,
} from "../audit/index.js";

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticatedRequest extends FastifyRequest {
  userId: string;
  orgId: string;
  userRole: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueryParamsSchema = z.object({
  category: z.string().optional(),
  action: z.string().optional(),
  severity: z.string().optional(),
  result: z.string().optional(),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  sortBy: z.enum(["timestamp", "severity", "category"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const ExportBodySchema = z.object({
  format: z.enum(["json", "csv", "pdf"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  includeContext: z.boolean().optional(),
  includeChanges: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
});

const RetentionPolicySchema = z.object({
  category: z.string(),
  retentionDays: z.number().min(1).max(3650),
  archiveAfterDays: z.number().optional(),
  deleteAfterArchive: z.boolean().optional(),
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

async function requireAuditAccess(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const req = request as AuthenticatedRequest;

  if (!req.userId || !req.orgId) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  // Only admins and owners can access audit logs
  if (!["admin", "owner"].includes(req.userRole)) {
    reply.code(403).send({
      error: "Forbidden",
      message: "Audit access requires admin or owner role",
    });
    return;
  }
}

// ============================================================================
// ROUTES
// ============================================================================

export async function registerAuditRoutes(fastify: FastifyInstance): Promise<void> {
  const auditLogger = getAuditLogger();

  // --------------------------------------------------------------------------
  // GET /api/audit - Query audit events
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      try {
        const params = QueryParamsSchema.parse(request.query);

        const query = {
          orgId: req.orgId,
          category: params.category as AuditCategory | undefined,
          action: params.action as AuditAction | undefined,
          severity: params.severity as AuditSeverity | undefined,
          result: params.result as "success" | "failure" | "partial" | "pending" | undefined,
          userId: params.userId,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
          search: params.search,
          limit: params.limit ? parseInt(params.limit, 10) : 100,
          offset: params.offset ? parseInt(params.offset, 10) : 0,
          sortBy: params.sortBy || "timestamp",
          sortOrder: params.sortOrder || "desc",
        };

        const result = await auditLogger.query(query);

        // Log the access
        await auditLogger.info(
          "audit",
          "read",
          `Queried audit logs: ${result.total} events`,
          { userId: req.userId, orgId: req.orgId }
        );

        reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: "Invalid query parameters", details: error.errors });
        } else {
          throw error;
        }
      }
    }
  );

  // --------------------------------------------------------------------------
  // GET /api/audit/:id - Get single audit event
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit/:id",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest & { Params: { id: string } };

      const event = await auditLogger.getEvent(req.params.id);

      if (!event) {
        reply.code(404).send({ error: "Event not found" });
        return;
      }

      // Verify org access
      if (event.context.orgId && event.context.orgId !== req.orgId) {
        reply.code(403).send({ error: "Forbidden" });
        return;
      }

      reply.send(event);
    }
  );

  // --------------------------------------------------------------------------
  // GET /api/audit/stats - Get audit statistics
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit/stats",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;
      const { days } = request.query as { days?: string };

      const stats = await auditLogger.getStats(
        req.orgId,
        days ? parseInt(days, 10) : 30
      );

      reply.send(stats);
    }
  );

  // --------------------------------------------------------------------------
  // GET /api/audit/security - Get security events
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit/security",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;
      const { severity, limit } = request.query as { severity?: string; limit?: string };

      const events = await auditLogger.getSecurityEvents(
        req.orgId,
        severity as AuditSeverity | undefined,
        limit ? parseInt(limit, 10) : 100
      );

      reply.send({ events, count: events.length });
    }
  );

  // --------------------------------------------------------------------------
  // POST /api/audit/export - Export audit logs
  // --------------------------------------------------------------------------
  fastify.post(
    "/api/audit/export",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      try {
        const body = ExportBodySchema.parse(request.body);

        const options = {
          format: body.format,
          query: {
            orgId: req.orgId,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            category: body.category as AuditCategory | undefined,
            limit: 10000, // Max export
          },
          includeContext: body.includeContext ?? true,
          includeChanges: body.includeChanges ?? true,
          includeMetadata: body.includeMetadata ?? false,
        };

        const output = await auditLogger.export(options);

        // Log the export
        await auditLogger.info(
          "audit",
          "export",
          `Exported audit logs in ${body.format} format`,
          { userId: req.userId, orgId: req.orgId }
        );

        // Set appropriate headers
        const contentType = {
          json: "application/json",
          csv: "text/csv",
          pdf: "application/pdf",
        }[body.format];

        const filename = `audit-export-${new Date().toISOString().split("T")[0]}.${body.format}`;

        reply
          .header("Content-Type", contentType)
          .header("Content-Disposition", `attachment; filename="${filename}"`)
          .send(output);
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: "Invalid export options", details: error.errors });
        } else {
          throw error;
        }
      }
    }
  );

  // --------------------------------------------------------------------------
  // GET /api/audit/retention - Get retention policies
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit/retention",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      // Return default policies (in production, fetch from DB)
      const policies = [
        { category: "auth", retentionDays: 365 },
        { category: "organization", retentionDays: 730 },
        { category: "member", retentionDays: 365 },
        { category: "pipeline", retentionDays: 90 },
        { category: "schedule", retentionDays: 90 },
        { category: "budget", retentionDays: 365 },
        { category: "webhook", retentionDays: 90 },
        { category: "settings", retentionDays: 365 },
        { category: "api", retentionDays: 30 },
        { category: "security", retentionDays: 730 },
        { category: "system", retentionDays: 365 },
      ];

      reply.send({ policies });
    }
  );

  // --------------------------------------------------------------------------
  // PUT /api/audit/retention - Update retention policy
  // --------------------------------------------------------------------------
  fastify.put(
    "/api/audit/retention",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      try {
        const policy = RetentionPolicySchema.parse(request.body);

        // Log the change
        await auditLogger.info(
          "settings",
          "update",
          `Updated retention policy for ${policy.category}: ${policy.retentionDays} days`,
          { userId: req.userId, orgId: req.orgId },
          { type: "retention_policy", id: policy.category }
        );

        // In production, save to database
        reply.send({ success: true, policy });
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({ error: "Invalid policy", details: error.errors });
        } else {
          throw error;
        }
      }
    }
  );

  // --------------------------------------------------------------------------
  // POST /api/audit/verify - Verify audit chain integrity
  // --------------------------------------------------------------------------
  fastify.post(
    "/api/audit/verify",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      // Get events for this org
      const result = await auditLogger.query({
        orgId: req.orgId,
        limit: 10000,
        sortBy: "timestamp",
        sortOrder: "asc",
      });

      const integrity = await auditLogger.verifyIntegrity(result.events);

      // Log the verification
      await auditLogger.info(
        "audit",
        "read",
        `Verified audit chain integrity: ${integrity.valid ? "valid" : "invalid"}`,
        { userId: req.userId, orgId: req.orgId }
      );

      reply.send({
        totalEvents: result.total,
        valid: integrity.valid,
        invalidCount: integrity.invalidEvents.length,
        invalidEvents: integrity.invalidEvents.slice(0, 10), // Return first 10
      });
    }
  );

  // --------------------------------------------------------------------------
  // GET /api/audit/user/:userId - Get user activity
  // --------------------------------------------------------------------------
  fastify.get(
    "/api/audit/user/:userId",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest & { Params: { userId: string } };

      const events = await auditLogger.getUserEvents(req.params.userId, 100);

      // Filter to only include events from user's org
      const orgEvents = events.filter(e => e.context.orgId === req.orgId);

      reply.send({ events: orgEvents, count: orgEvents.length });
    }
  );

  // --------------------------------------------------------------------------
  // DELETE /api/audit/cleanup - Manually trigger cleanup
  // --------------------------------------------------------------------------
  fastify.delete(
    "/api/audit/cleanup",
    { preHandler: requireAuditAccess },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const req = request as AuthenticatedRequest;

      // Only owners can trigger cleanup
      if (req.userRole !== "owner") {
        reply.code(403).send({ error: "Only owners can trigger audit cleanup" });
        return;
      }

      const result = await auditLogger.applyRetention();

      // Log the cleanup
      await auditLogger.info(
        "system",
        "delete",
        `Manual audit cleanup: deleted ${result.deleted}, archived ${result.archived}`,
        { userId: req.userId, orgId: req.orgId }
      );

      reply.send(result);
    }
  );
}
