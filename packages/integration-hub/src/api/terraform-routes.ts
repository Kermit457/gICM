/**
 * Terraform API Routes
 *
 * REST API for Infrastructure-as-Code operations
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getTerraformManager,
  type HCLConfig,
} from "../terraform/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function terraformRoutes(fastify: FastifyInstance): Promise<void> {
  const terraformManager = getTerraformManager();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /**
   * GET /api/terraform/state
   * Get current Terraform state
   */
  fastify.get("/api/terraform/state", async (_request, reply) => {
    const state = terraformManager.getState();
    return reply.send({
      success: true,
      data: state,
    });
  });

  /**
   * POST /api/terraform/state/lock
   * Lock the state for exclusive access
   */
  fastify.post(
    "/api/terraform/state/lock",
    async (
      request: FastifyRequest<{ Body: { lockId: string; reason?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { lockId, reason } = request.body;
        await terraformManager.lockState(lockId, reason);
        return reply.send({
          success: true,
          message: "State locked",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to lock state";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/terraform/state/unlock
   * Unlock the state
   */
  fastify.post(
    "/api/terraform/state/unlock",
    async (
      request: FastifyRequest<{ Body: { lockId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { lockId } = request.body;
        await terraformManager.unlockState(lockId);
        return reply.send({
          success: true,
          message: "State unlocked",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to unlock state";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // PLAN & APPLY
  // ===========================================================================

  /**
   * POST /api/terraform/plan
   * Generate a plan from HCL configuration
   */
  fastify.post(
    "/api/terraform/plan",
    async (
      request: FastifyRequest<{ Body: { config: HCLConfig } }>,
      reply: FastifyReply
    ) => {
      try {
        const { config } = request.body;
        const plan = await terraformManager.plan(config);
        return reply.send({
          success: true,
          data: plan,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate plan";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/terraform/apply
   * Apply a plan
   */
  fastify.post(
    "/api/terraform/apply",
    async (
      request: FastifyRequest<{ Body: { config: HCLConfig; autoApprove?: boolean } }>,
      reply: FastifyReply
    ) => {
      try {
        const { config, autoApprove } = request.body;
        const result = await terraformManager.apply(config, autoApprove);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to apply changes";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/terraform/destroy
   * Destroy resources
   */
  fastify.post(
    "/api/terraform/destroy",
    async (
      request: FastifyRequest<{
        Body: { resourceAddresses?: string[]; autoApprove?: boolean };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { resourceAddresses, autoApprove } = request.body;
        const result = await terraformManager.destroy(resourceAddresses, autoApprove);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to destroy resources";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // RESOURCES
  // ===========================================================================

  /**
   * GET /api/terraform/resources
   * List all managed resources
   */
  fastify.get("/api/terraform/resources", async (_request, reply) => {
    const state = terraformManager.getState();
    return reply.send({
      success: true,
      data: state.resources,
      count: state.resources.length,
    });
  });

  /**
   * GET /api/terraform/resources/:address
   * Get a specific resource
   */
  fastify.get(
    "/api/terraform/resources/:address",
    async (
      request: FastifyRequest<{ Params: { address: string } }>,
      reply: FastifyReply
    ) => {
      const state = terraformManager.getState();
      const resource = state.resources.find(
        (r) => `${r.type}.${r.name}` === request.params.address
      );

      if (!resource) {
        return reply.status(404).send({
          success: false,
          error: "Resource not found",
        });
      }

      return reply.send({
        success: true,
        data: resource,
      });
    }
  );

  /**
   * POST /api/terraform/import
   * Import an existing resource into state
   */
  fastify.post(
    "/api/terraform/import",
    async (
      request: FastifyRequest<{
        Body: { type: string; id: string; address: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { type, id, address } = request.body;
        await terraformManager.importResource(type as any, id, address);
        return reply.send({
          success: true,
          message: "Resource imported",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to import resource";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/terraform/resources/:address/taint
   * Mark a resource as tainted (will be recreated on next apply)
   */
  fastify.post(
    "/api/terraform/resources/:address/taint",
    async (
      request: FastifyRequest<{ Params: { address: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await terraformManager.taintResource(request.params.address);
        return reply.send({
          success: true,
          message: "Resource tainted",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to taint resource";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/terraform/resources/:address/untaint
   * Remove taint from a resource
   */
  fastify.post(
    "/api/terraform/resources/:address/untaint",
    async (
      request: FastifyRequest<{ Params: { address: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await terraformManager.untaintResource(request.params.address);
        return reply.send({
          success: true,
          message: "Resource untainted",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to untaint resource";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // HCL GENERATION
  // ===========================================================================

  /**
   * POST /api/terraform/generate/pipeline
   * Generate HCL for a pipeline
   */
  fastify.post(
    "/api/terraform/generate/pipeline",
    async (
      request: FastifyRequest<{
        Body: {
          name: string;
          displayName: string;
          description?: string;
          steps: Array<{
            id: string;
            name: string;
            tool: string;
            config?: Record<string, unknown>;
            dependsOn?: string[];
          }>;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { name, displayName, description, steps } = request.body;

      const hcl = generatePipelineHCL(name, displayName, description, steps);

      return reply.send({
        success: true,
        data: { hcl },
      });
    }
  );

  /**
   * POST /api/terraform/generate/schedule
   * Generate HCL for a schedule
   */
  fastify.post(
    "/api/terraform/generate/schedule",
    async (
      request: FastifyRequest<{
        Body: {
          name: string;
          displayName: string;
          pipelineRef: string;
          cron: string;
          timezone?: string;
          inputs?: Record<string, unknown>;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { name, displayName, pipelineRef, cron, timezone, inputs } = request.body;

      const hcl = generateScheduleHCL(name, displayName, pipelineRef, cron, timezone, inputs);

      return reply.send({
        success: true,
        data: { hcl },
      });
    }
  );

  /**
   * GET /api/terraform/schema
   * Get JSON schema for all resource types
   */
  fastify.get("/api/terraform/schema", async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        provider: {
          api_url: { type: "string", required: true },
          api_key: { type: "string", required: true, sensitive: true },
          organization_id: { type: "string", required: false },
        },
        resources: {
          gicm_pipeline: {
            name: { type: "string", required: true },
            description: { type: "string" },
            enabled: { type: "bool", default: true },
            steps: { type: "list", required: true },
            tags: { type: "map(string)" },
          },
          gicm_schedule: {
            name: { type: "string", required: true },
            pipeline_id: { type: "string", required: true },
            cron: { type: "string", required: true },
            timezone: { type: "string", default: "UTC" },
            enabled: { type: "bool", default: true },
            inputs: { type: "map(any)" },
          },
          gicm_webhook: {
            name: { type: "string", required: true },
            url: { type: "string", required: true },
            events: { type: "list(string)", required: true },
            enabled: { type: "bool", default: true },
            retry_count: { type: "number", default: 3 },
            timeout_ms: { type: "number", default: 5000 },
          },
          gicm_budget: {
            name: { type: "string", required: true },
            daily_limit: { type: "number" },
            weekly_limit: { type: "number" },
            monthly_limit: { type: "number" },
            scope_type: { type: "string", default: "global" },
            enabled: { type: "bool", default: true },
            enforce: { type: "bool", default: false },
            alert_thresholds: { type: "list(number)", default: [50, 75, 90, 100] },
          },
        },
      },
    });
  });
}

// =============================================================================
// HCL GENERATORS
// =============================================================================

function generatePipelineHCL(
  name: string,
  displayName: string,
  description: string | undefined,
  steps: Array<{
    id: string;
    name: string;
    tool: string;
    config?: Record<string, unknown>;
    dependsOn?: string[];
  }>
): string {
  const lines: string[] = [];
  lines.push(`resource "gicm_pipeline" "${name}" {`);
  lines.push(`  name        = "${displayName}"`);
  if (description) {
    lines.push(`  description = "${description}"`);
  }
  lines.push(`  enabled     = true`);
  lines.push("");

  for (const step of steps) {
    lines.push(`  step {`);
    lines.push(`    id   = "${step.id}"`);
    lines.push(`    name = "${step.name}"`);
    lines.push(`    tool = "${step.tool}"`);
    if (step.config && Object.keys(step.config).length > 0) {
      lines.push(`    config = {`);
      for (const [key, value] of Object.entries(step.config)) {
        const formattedValue = typeof value === "string" ? `"${value}"` : JSON.stringify(value);
        lines.push(`      ${key} = ${formattedValue}`);
      }
      lines.push(`    }`);
    }
    if (step.dependsOn && step.dependsOn.length > 0) {
      lines.push(`    depends_on = ["${step.dependsOn.join('", "')}"]`);
    }
    lines.push(`  }`);
    lines.push("");
  }

  lines.push(`}`);
  return lines.join("\n");
}

function generateScheduleHCL(
  name: string,
  displayName: string,
  pipelineRef: string,
  cron: string,
  timezone?: string,
  inputs?: Record<string, unknown>
): string {
  const lines: string[] = [];
  lines.push(`resource "gicm_schedule" "${name}" {`);
  lines.push(`  name        = "${displayName}"`);
  lines.push(`  pipeline_id = ${pipelineRef}`);
  lines.push(`  cron        = "${cron}"`);
  lines.push(`  timezone    = "${timezone || "UTC"}"`);
  lines.push(`  enabled     = true`);

  if (inputs && Object.keys(inputs).length > 0) {
    lines.push("");
    lines.push(`  inputs = {`);
    for (const [key, value] of Object.entries(inputs)) {
      const formattedValue = typeof value === "string" ? `"${value}"` : JSON.stringify(value);
      lines.push(`    ${key} = ${formattedValue}`);
    }
    lines.push(`  }`);
  }

  lines.push(`}`);
  return lines.join("\n");
}

export default terraformRoutes;
