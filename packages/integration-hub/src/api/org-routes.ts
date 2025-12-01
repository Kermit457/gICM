/**
 * Organization Routes - Multi-Tenancy & RBAC API Endpoints
 * Phase 9A: Enterprise Security Foundation
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getRBACManager,
  CreateOrgSchema,
  UpdateOrgSchema,
  AddMemberSchema,
  UpdateMemberSchema,
  CreateInviteSchema,
  Permission,
  Role,
} from "../auth/index.js";

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  orgId?: string;
}

// ============================================================================
// AUTH MIDDLEWARE (simplified - in production use JWT/session)
// ============================================================================

async function requireAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // In production, extract userId from JWT or session
  const userId = request.headers["x-user-id"] as string;

  if (!userId) {
    reply.code(401).send({ ok: false, error: "Authentication required" });
    return;
  }

  request.userId = userId;
}

async function requireOrgMembership(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const orgId = (request.params as any).orgId || request.headers["x-org-id"];

  if (!orgId) {
    reply.code(400).send({ ok: false, error: "Organization ID required" });
    return;
  }

  const rbac = getRBACManager();
  const member = rbac.getMember(orgId, request.userId!);

  if (!member) {
    reply.code(403).send({ ok: false, error: "Not a member of this organization" });
    return;
  }

  request.orgId = orgId;
}

function requirePermission(permission: Permission) {
  return async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    await requireOrgMembership(request, reply);
    if (reply.sent) return;

    const rbac = getRBACManager();
    const hasPermission = rbac.hasPermission(request.userId!, request.orgId!, permission);

    if (!hasPermission) {
      reply.code(403).send({
        ok: false,
        error: `Permission denied: ${permission}`,
      });
    }
  };
}

function requireRole(minRole: Role) {
  return async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    await requireOrgMembership(request, reply);
    if (reply.sent) return;

    const rbac = getRBACManager();
    const hasRole = rbac.hasRole(request.userId!, request.orgId!, minRole);

    if (!hasRole) {
      reply.code(403).send({
        ok: false,
        error: `Role "${minRole}" or higher required`,
      });
    }
  };
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export async function registerOrgRoutes(fastify: FastifyInstance): Promise<void> {
  const rbac = getRBACManager();

  // =========================================================================
  // ORGANIZATION ENDPOINTS
  // =========================================================================

  /**
   * POST /api/orgs - Create a new organization
   */
  fastify.post<{
    Body: {
      name: string;
      slug: string;
      description?: string;
      billingEmail?: string;
    };
  }>("/api/orgs", {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const input = CreateOrgSchema.parse(request.body);
      const org = await rbac.createOrganization({
        ...input,
        createdBy: request.userId!,
      }, request.userId!);

      return {
        ok: true,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          plan: org.plan,
          createdAt: org.createdAt,
        },
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create organization",
      };
    }
  });

  /**
   * GET /api/orgs - List user's organizations
   */
  fastify.get("/api/orgs", {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest) => {
    const orgs = rbac.getUserOrganizations(request.userId!);

    return {
      ok: true,
      count: orgs.length,
      organizations: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        createdAt: org.createdAt,
      })),
    };
  });

  /**
   * GET /api/orgs/:orgId - Get organization details
   */
  fastify.get<{ Params: { orgId: string } }>("/api/orgs/:orgId", {
    preHandler: requireOrgMembership,
  }, async (request: AuthenticatedRequest, reply) => {
    const org = rbac.getOrganization(request.orgId!);

    if (!org) {
      reply.code(404);
      return { ok: false, error: "Organization not found" };
    }

    const member = rbac.getMember(request.orgId!, request.userId!);

    return {
      ok: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        plan: org.plan,
        settings: org.settings,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
      membership: {
        role: member?.role,
        joinedAt: member?.joinedAt,
      },
    };
  });

  /**
   * PATCH /api/orgs/:orgId - Update organization
   */
  fastify.patch<{
    Params: { orgId: string };
    Body: {
      name?: string;
      slug?: string;
      description?: string;
      billingEmail?: string;
      settings?: Record<string, unknown>;
    };
  }>("/api/orgs/:orgId", {
    preHandler: requirePermission("organization:update"),
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const updates = UpdateOrgSchema.parse(request.body);
      const org = await rbac.updateOrganization(request.orgId!, updates);

      if (!org) {
        reply.code(404);
        return { ok: false, error: "Organization not found" };
      }

      return {
        ok: true,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          updatedAt: org.updatedAt,
        },
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update organization",
      };
    }
  });

  /**
   * DELETE /api/orgs/:orgId - Delete organization
   */
  fastify.delete<{ Params: { orgId: string } }>("/api/orgs/:orgId", {
    preHandler: requirePermission("organization:delete"),
  }, async (request: AuthenticatedRequest, reply) => {
    const deleted = await rbac.deleteOrganization(request.orgId!);

    if (!deleted) {
      reply.code(404);
      return { ok: false, error: "Organization not found" };
    }

    return { ok: true, message: "Organization deleted" };
  });

  // =========================================================================
  // MEMBER ENDPOINTS
  // =========================================================================

  /**
   * GET /api/orgs/:orgId/members - List organization members
   */
  fastify.get<{ Params: { orgId: string } }>("/api/orgs/:orgId/members", {
    preHandler: requirePermission("member:read"),
  }, async (request: AuthenticatedRequest) => {
    const members = rbac.getOrgMembers(request.orgId!);

    return {
      ok: true,
      count: members.length,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.email,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
        lastActiveAt: m.lastActiveAt,
      })),
    };
  });

  /**
   * GET /api/orgs/:orgId/members/:userId - Get member details
   */
  fastify.get<{ Params: { orgId: string; userId: string } }>(
    "/api/orgs/:orgId/members/:userId",
    { preHandler: requirePermission("member:read") },
    async (request: AuthenticatedRequest, reply) => {
      const member = rbac.getMember(request.orgId!, request.params.userId);

      if (!member) {
        reply.code(404);
        return { ok: false, error: "Member not found" };
      }

      return {
        ok: true,
        member: {
          id: member.id,
          userId: member.userId,
          email: member.email,
          displayName: member.displayName,
          avatarUrl: member.avatarUrl,
          role: member.role,
          customPermissions: member.customPermissions,
          status: member.status,
          invitedBy: member.invitedBy,
          joinedAt: member.joinedAt,
          lastActiveAt: member.lastActiveAt,
        },
      };
    }
  );

  /**
   * PATCH /api/orgs/:orgId/members/:userId - Update member role
   */
  fastify.patch<{
    Params: { orgId: string; userId: string };
    Body: { role?: Role; customPermissions?: string[] };
  }>(
    "/api/orgs/:orgId/members/:userId",
    { preHandler: requirePermission("member:update") },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Prevent self-demotion for owners
        if (
          request.params.userId === request.userId &&
          request.body.role &&
          request.body.role !== "owner"
        ) {
          const member = rbac.getMember(request.orgId!, request.userId!);
          if (member?.role === "owner") {
            reply.code(400);
            return { ok: false, error: "Cannot demote yourself. Transfer ownership first." };
          }
        }

        const updates = UpdateMemberSchema.parse(request.body);
        const member = await rbac.updateMember(
          request.orgId!,
          request.params.userId,
          updates
        );

        if (!member) {
          reply.code(404);
          return { ok: false, error: "Member not found" };
        }

        return {
          ok: true,
          member: {
            id: member.id,
            userId: member.userId,
            role: member.role,
            customPermissions: member.customPermissions,
          },
        };
      } catch (error) {
        reply.code(400);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to update member",
        };
      }
    }
  );

  /**
   * DELETE /api/orgs/:orgId/members/:userId - Remove member
   */
  fastify.delete<{ Params: { orgId: string; userId: string } }>(
    "/api/orgs/:orgId/members/:userId",
    { preHandler: requirePermission("member:delete") },
    async (request: AuthenticatedRequest, reply) => {
      // Prevent self-removal
      if (request.params.userId === request.userId) {
        reply.code(400);
        return { ok: false, error: "Cannot remove yourself. Leave the organization instead." };
      }

      try {
        const removed = await rbac.removeMember(request.orgId!, request.params.userId);

        if (!removed) {
          reply.code(404);
          return { ok: false, error: "Member not found" };
        }

        return { ok: true, message: "Member removed" };
      } catch (error) {
        reply.code(400);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to remove member",
        };
      }
    }
  );

  /**
   * POST /api/orgs/:orgId/leave - Leave organization
   */
  fastify.post<{ Params: { orgId: string } }>("/api/orgs/:orgId/leave", {
    preHandler: requireOrgMembership,
  }, async (request: AuthenticatedRequest, reply) => {
    try {
      const removed = await rbac.removeMember(request.orgId!, request.userId!);

      if (!removed) {
        reply.code(400);
        return { ok: false, error: "Failed to leave organization" };
      }

      return { ok: true, message: "Left organization" };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to leave organization",
      };
    }
  });

  // =========================================================================
  // INVITE ENDPOINTS
  // =========================================================================

  /**
   * GET /api/orgs/:orgId/invites - List pending invites
   */
  fastify.get<{ Params: { orgId: string } }>("/api/orgs/:orgId/invites", {
    preHandler: requirePermission("invite:read"),
  }, async (request: AuthenticatedRequest) => {
    const invites = rbac.getOrgInvites(request.orgId!, true);

    return {
      ok: true,
      count: invites.length,
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        expiresAt: i.expiresAt,
        invitedAt: i.invitedAt,
        message: i.message,
      })),
    };
  });

  /**
   * POST /api/orgs/:orgId/invites - Create invite
   */
  fastify.post<{
    Params: { orgId: string };
    Body: { email: string; role?: Role; message?: string; expiresInDays?: number };
  }>(
    "/api/orgs/:orgId/invites",
    { preHandler: requirePermission("invite:create") },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const input = CreateInviteSchema.parse(request.body);
        const invite = await rbac.createInvite(
          request.orgId!,
          input,
          request.userId!
        );

        // In production, send email here

        return {
          ok: true,
          invite: {
            id: invite.id,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
            // Include token only for API response (would normally be emailed)
            inviteUrl: `https://app.gicm.dev/invite/${invite.token}`,
          },
        };
      } catch (error) {
        reply.code(400);
        return {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to create invite",
        };
      }
    }
  );

  /**
   * DELETE /api/orgs/:orgId/invites/:inviteId - Revoke invite
   */
  fastify.delete<{ Params: { orgId: string; inviteId: string } }>(
    "/api/orgs/:orgId/invites/:inviteId",
    { preHandler: requirePermission("invite:delete") },
    async (request: AuthenticatedRequest, reply) => {
      const revoked = await rbac.revokeInvite(request.params.inviteId);

      if (!revoked) {
        reply.code(404);
        return { ok: false, error: "Invite not found or already processed" };
      }

      return { ok: true, message: "Invite revoked" };
    }
  );

  /**
   * POST /api/invites/accept - Accept an invite (public endpoint)
   */
  fastify.post<{
    Body: { token: string; displayName?: string };
  }>("/api/invites/accept", {
    preHandler: requireAuth,
  }, async (request: AuthenticatedRequest, reply) => {
    const { token, displayName } = request.body;

    if (!token) {
      reply.code(400);
      return { ok: false, error: "Token required" };
    }

    try {
      // Get invite to find email (in production, use authenticated user's email)
      const invite = rbac.getInviteByToken(token);
      if (!invite) {
        reply.code(404);
        return { ok: false, error: "Invalid or expired invite" };
      }

      const member = await rbac.acceptInvite(
        token,
        request.userId!,
        invite.email,
        displayName
      );

      const org = rbac.getOrganization(invite.orgId);

      return {
        ok: true,
        message: "Invite accepted",
        organization: {
          id: org?.id,
          name: org?.name,
          slug: org?.slug,
        },
        membership: {
          role: member.role,
          joinedAt: member.joinedAt,
        },
      };
    } catch (error) {
      reply.code(400);
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to accept invite",
      };
    }
  });

  // =========================================================================
  // PERMISSION CHECK ENDPOINT
  // =========================================================================

  /**
   * POST /api/orgs/:orgId/check-permission - Check if user has permission
   */
  fastify.post<{
    Params: { orgId: string };
    Body: { permission: string };
  }>(
    "/api/orgs/:orgId/check-permission",
    { preHandler: requireOrgMembership },
    async (request: AuthenticatedRequest) => {
      const { permission } = request.body;
      const hasPermission = rbac.hasPermission(
        request.userId!,
        request.orgId!,
        permission as Permission
      );

      return {
        ok: true,
        permission,
        allowed: hasPermission,
      };
    }
  );

  // =========================================================================
  // AUTH CONTEXT ENDPOINT
  // =========================================================================

  /**
   * GET /api/orgs/:orgId/context - Get auth context for current user
   */
  fastify.get<{ Params: { orgId: string } }>("/api/orgs/:orgId/context", {
    preHandler: requireOrgMembership,
  }, async (request: AuthenticatedRequest, reply) => {
    const context = rbac.getAuthContext(request.userId!, request.orgId!);

    if (!context) {
      reply.code(403);
      return { ok: false, error: "Not a member of this organization" };
    }

    return {
      ok: true,
      context,
    };
  });

  // =========================================================================
  // STATS ENDPOINT (admin only)
  // =========================================================================

  /**
   * GET /api/admin/rbac/stats - Get RBAC statistics
   */
  fastify.get("/api/admin/rbac/stats", {
    preHandler: requireAuth,
  }, async () => {
    // In production, check if user is system admin
    const stats = rbac.getStats();

    return {
      ok: true,
      stats,
    };
  });
}
