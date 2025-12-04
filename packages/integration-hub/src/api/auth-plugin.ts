/**
 * Fastify Authentication Plugin
 * Integrates with @gicm/agent-core security module
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { AuthMiddleware, ApiKeyManager, hasScope } from "@gicm/agent-core/security/auth";

// ============================================================================
// Types
// ============================================================================

export interface AuthPluginOptions {
  /** JWT secret for token signing (min 32 chars) */
  jwtSecret?: string;
  /** API key prefix (default: gicm) */
  apiKeyPrefix?: string;
  /** Routes that don't require authentication */
  publicRoutes?: string[];
  /** Whether to enable auth (can disable for development) */
  enabled?: boolean;
}

export interface AuthenticatedUser {
  userId: string;
  scope?: string[];
  expiresAt?: number;
}

// Extend Fastify types
declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    isAuthenticated: boolean;
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PUBLIC_ROUTES = [
  "/",
  "/health",
  "/ws",
  "/api/status",
  "/api/brain/status",
  "/api/events",
  "/api/events/enriched",
  "/api/events/categories",
  "/api/predictions/status",
  "/api/v1/predictions/status",
];

// ============================================================================
// Plugin Implementation
// ============================================================================

async function authPlugin(
  fastify: FastifyInstance,
  options: AuthPluginOptions
): Promise<void> {
  const {
    jwtSecret = process.env.GICM_JWT_SECRET,
    apiKeyPrefix = process.env.GICM_API_KEY_PREFIX || "gicm",
    publicRoutes = DEFAULT_PUBLIC_ROUTES,
    enabled = process.env.NODE_ENV === "production" || process.env.GICM_AUTH_ENABLED === "true",
  } = options;

  // Initialize auth middleware
  const authMiddleware = new AuthMiddleware({
    jwtSecret,
    apiKeyPrefix,
    enableApiKey: true,
    enableJwt: !!jwtSecret,
  });

  // Pre-create a default API key for development
  if (!enabled) {
    console.log("[AUTH] Authentication disabled (development mode)");
    console.log("[AUTH] Set GICM_AUTH_ENABLED=true or NODE_ENV=production to enable");
  }

  // Decorate request with auth properties
  fastify.decorateRequest("user", null);
  fastify.decorateRequest("isAuthenticated", false);

  // Add preHandler hook for authentication
  fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth if disabled
    if (!enabled) {
      request.isAuthenticated = true;
      request.user = { userId: "dev-user", scope: ["*"] };
      return;
    }

    // Check if route is public
    const isPublicRoute = publicRoutes.some((route) => {
      // Exact match
      if (request.url === route) return true;
      // Prefix match with wildcard
      if (route.endsWith("*") && request.url.startsWith(route.slice(0, -1))) return true;
      // Match route path without query string
      const pathOnly = request.url.split("?")[0];
      return pathOnly === route;
    });

    if (isPublicRoute) {
      request.isAuthenticated = true;
      return;
    }

    // Extract auth header
    const authHeader = request.headers.authorization;

    // Authenticate
    const result = authMiddleware.authenticate({
      headers: {
        authorization: authHeader,
        Authorization: authHeader,
      },
    });

    if (result.authenticated) {
      request.isAuthenticated = true;
      request.user = {
        userId: result.userId!,
        scope: result.scope,
        expiresAt: result.expiresAt,
      };
    } else {
      // Return 401 for protected routes
      reply.code(401).send({
        ok: false,
        error: result.error || "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }
  });

  // Add route for generating API keys (admin only)
  fastify.post<{
    Body: {
      name: string;
      userId?: string;
      scope?: string[];
      expiresIn?: number;
    };
  }>("/api/auth/keys", async (request, reply) => {
    // Check if user has admin scope
    if (!request.user?.scope?.includes("admin") && !request.user?.scope?.includes("*")) {
      reply.code(403).send({
        ok: false,
        error: "Admin access required",
        code: "FORBIDDEN",
      });
      return;
    }

    const { name, userId, scope, expiresIn } = request.body;

    if (!name) {
      reply.code(400).send({
        ok: false,
        error: "name is required",
        code: "BAD_REQUEST",
      });
      return;
    }

    const apiKey = authMiddleware.generateApiKey({
      userId: userId || request.user?.userId || "system",
      name,
      scope: scope || ["read"],
      expiresIn,
    });

    if (!apiKey) {
      reply.code(500).send({
        ok: false,
        error: "Failed to generate API key",
        code: "INTERNAL_ERROR",
      });
      return;
    }

    return {
      ok: true,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key, // Only shown once!
        name: apiKey.name,
        scope: apiKey.scope,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      },
      warning: "Store this key securely - it won't be shown again!",
    };
  });

  // Add route for revoking API keys
  fastify.delete<{
    Params: { keyId: string };
  }>("/api/auth/keys/:keyId", async (request, reply) => {
    // Check if user has admin scope
    if (!request.user?.scope?.includes("admin") && !request.user?.scope?.includes("*")) {
      reply.code(403).send({
        ok: false,
        error: "Admin access required",
        code: "FORBIDDEN",
      });
      return;
    }

    const { keyId } = request.params;
    const revoked = authMiddleware.revokeApiKey(keyId);

    if (!revoked) {
      reply.code(404).send({
        ok: false,
        error: "API key not found",
        code: "NOT_FOUND",
      });
      return;
    }

    return {
      ok: true,
      message: "API key revoked",
    };
  });

  // Add route for getting current user info
  fastify.get("/api/auth/me", async (request) => {
    if (!request.isAuthenticated || !request.user) {
      return {
        ok: false,
        authenticated: false,
      };
    }

    return {
      ok: true,
      authenticated: true,
      user: {
        userId: request.user.userId,
        scope: request.user.scope,
        expiresAt: request.user.expiresAt,
      },
    };
  });

  // Add scope checking helper
  fastify.decorate("requireScope", function (requiredScope: string | string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user?.scope) {
        reply.code(403).send({
          ok: false,
          error: "Insufficient permissions",
          code: "FORBIDDEN",
        });
        return;
      }

      if (!hasScope(request.user.scope, requiredScope)) {
        reply.code(403).send({
          ok: false,
          error: `Required scope: ${Array.isArray(requiredScope) ? requiredScope.join(", ") : requiredScope}`,
          code: "FORBIDDEN",
        });
        return;
      }
    };
  });

  console.log(`[AUTH] Authentication plugin loaded (enabled: ${enabled})`);
  console.log(`[AUTH] Public routes: ${publicRoutes.length}`);
}

// Export as Fastify plugin
export default fp(authPlugin, {
  fastify: "5.x",
  name: "gicm-auth",
});

// Named export
export { authPlugin };
