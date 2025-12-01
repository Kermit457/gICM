/**
 * Git Integration API Routes
 *
 * REST API for managing Git repositories and pipeline-as-code sync
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  GitManager,
  getGitManager,
  CreateRepoConfigSchema,
  parsePipelineYAML,
  validatePipelineYAML,
  EXAMPLE_PIPELINES,
  type CreateRepoConfig,
  type GitProvider,
} from "../git/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function gitRoutes(fastify: FastifyInstance): Promise<void> {
  const gitManager = getGitManager();

  // ===========================================================================
  // REPOSITORY MANAGEMENT
  // ===========================================================================

  /**
   * GET /api/git/repos
   * List all connected repositories
   */
  fastify.get("/api/git/repos", async (_request, reply) => {
    const repos = gitManager.listRepos();
    return reply.send({
      success: true,
      data: repos,
      count: repos.length,
    });
  });

  /**
   * GET /api/git/repos/:id
   * Get repository by ID
   */
  fastify.get(
    "/api/git/repos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const repo = gitManager.getRepo(request.params.id);
      if (!repo) {
        return reply.status(404).send({
          success: false,
          error: "Repository not found",
        });
      }
      return reply.send({
        success: true,
        data: repo,
      });
    }
  );

  /**
   * POST /api/git/repos
   * Connect a new repository
   */
  fastify.post(
    "/api/git/repos",
    async (
      request: FastifyRequest<{ Body: CreateRepoConfig }>,
      reply: FastifyReply
    ) => {
      try {
        const config = CreateRepoConfigSchema.parse(request.body);
        const repo = await gitManager.connectRepo(config);
        return reply.status(201).send({
          success: true,
          data: repo,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect repository";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * DELETE /api/git/repos/:id
   * Disconnect a repository
   */
  fastify.delete(
    "/api/git/repos/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await gitManager.disconnectRepo(request.params.id);
        return reply.send({
          success: true,
          message: "Repository disconnected",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to disconnect repository";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // SYNC OPERATIONS
  // ===========================================================================

  /**
   * POST /api/git/repos/:id/pull
   * Pull pipelines from repository
   */
  fastify.post(
    "/api/git/repos/:id/pull",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const changes = await gitManager.pullPipelines(request.params.id);
        return reply.send({
          success: true,
          data: {
            changes,
            count: changes.length,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to pull pipelines";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/git/repos/:id/push
   * Push a pipeline to repository
   */
  fastify.post(
    "/api/git/repos/:id/push",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          pipeline: {
            id: string;
            name: string;
            description?: string;
            schedule?: string;
            steps: Array<{
              id: string;
              name: string;
              toolId: string;
              config?: Record<string, unknown>;
              timeout?: number;
              retries?: number;
              condition?: string;
              dependsOn?: string[];
            }>;
            metadata?: Record<string, unknown>;
          };
          commitMessage?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { pipeline, commitMessage } = request.body;
        const record = await gitManager.pushPipeline(
          request.params.id,
          pipeline,
          commitMessage
        );
        return reply.send({
          success: true,
          data: record,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to push pipeline";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * DELETE /api/git/repos/:repoId/pipelines/:pipelineId
   * Delete a pipeline from repository
   */
  fastify.delete(
    "/api/git/repos/:repoId/pipelines/:pipelineId",
    async (
      request: FastifyRequest<{
        Params: { repoId: string; pipelineId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        await gitManager.deletePipeline(
          request.params.repoId,
          request.params.pipelineId
        );
        return reply.send({
          success: true,
          message: "Pipeline deleted from repository",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete pipeline";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // SYNC HISTORY
  // ===========================================================================

  /**
   * GET /api/git/repos/:id/history
   * Get sync history for repository
   */
  fastify.get(
    "/api/git/repos/:id/history",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const history = gitManager.getSyncHistory(request.params.id);
      return reply.send({
        success: true,
        data: history,
        count: history.length,
      });
    }
  );

  /**
   * GET /api/git/repos/:id/latest
   * Get latest sync record for repository
   */
  fastify.get(
    "/api/git/repos/:id/latest",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const latest = gitManager.getLatestSync(request.params.id);
      if (!latest) {
        return reply.status(404).send({
          success: false,
          error: "No sync records found",
        });
      }
      return reply.send({
        success: true,
        data: latest,
      });
    }
  );

  // ===========================================================================
  // WEBHOOKS
  // ===========================================================================

  /**
   * POST /api/git/repos/:id/webhook
   * Setup webhook for repository
   */
  fastify.post(
    "/api/git/repos/:id/webhook",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { webhookUrl: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { webhookUrl } = request.body;
        const result = await gitManager.setupWebhook(
          request.params.id,
          webhookUrl
        );
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to setup webhook";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/git/webhook/:provider
   * Receive webhook from Git provider
   */
  fastify.post(
    "/api/git/webhook/:provider",
    async (
      request: FastifyRequest<{
        Params: { provider: string };
        Body: unknown;
        Headers: { "x-hub-signature-256"?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const provider = request.params.provider as GitProvider;
        const signature = request.headers["x-hub-signature-256"];

        await gitManager.handleWebhook(provider, request.body, signature);

        return reply.send({
          success: true,
          message: "Webhook processed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process webhook";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // YAML UTILITIES
  // ===========================================================================

  /**
   * POST /api/git/yaml/parse
   * Parse YAML string to pipeline object
   */
  fastify.post(
    "/api/git/yaml/parse",
    async (
      request: FastifyRequest<{ Body: { yaml: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { yaml } = request.body;
        const result = parsePipelineYAML(yaml);
        return reply.send({
          success: result.success,
          data: result.pipeline,
          errors: result.errors,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to parse YAML";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/git/yaml/validate
   * Validate a pipeline YAML
   */
  fastify.post(
    "/api/git/yaml/validate",
    async (
      request: FastifyRequest<{ Body: { yaml: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { yaml } = request.body;
        const parseResult = parsePipelineYAML(yaml);

        if (!parseResult.success || !parseResult.pipeline) {
          return reply.send({
            success: false,
            valid: false,
            errors: parseResult.errors?.map((e) => ({
              path: "yaml",
              message: e,
              severity: "error" as const,
            })),
            warnings: [],
          });
        }

        const validation = validatePipelineYAML(parseResult.pipeline);
        return reply.send({
          success: true,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to validate YAML";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * GET /api/git/yaml/examples
   * Get example pipeline YAML templates
   */
  fastify.get("/api/git/yaml/examples", async (_request, reply) => {
    return reply.send({
      success: true,
      data: EXAMPLE_PIPELINES,
    });
  });

  /**
   * GET /api/git/yaml/examples/:name
   * Get specific example pipeline
   */
  fastify.get(
    "/api/git/yaml/examples/:name",
    async (
      request: FastifyRequest<{ Params: { name: string } }>,
      reply: FastifyReply
    ) => {
      const name = request.params.name as keyof typeof EXAMPLE_PIPELINES;
      const example = EXAMPLE_PIPELINES[name];

      if (!example) {
        return reply.status(404).send({
          success: false,
          error: `Example not found: ${name}. Available: ${Object.keys(EXAMPLE_PIPELINES).join(", ")}`,
        });
      }

      return reply.send({
        success: true,
        data: {
          name,
          yaml: example,
        },
      });
    }
  );
}

export default gitRoutes;
