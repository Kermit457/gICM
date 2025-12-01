/**
 * VS Code Extension API Routes
 *
 * REST API for VS Code extension communication
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getVSCodeManager,
  type TreeItem,
  type CompletionItem,
  type CodeAction,
  type Diagnostic,
  PIPELINE_SNIPPETS,
} from "../vscode/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function vscodeRoutes(fastify: FastifyInstance): Promise<void> {
  const vscodeManager = getVSCodeManager();

  // ===========================================================================
  // STATE & CONFIG
  // ===========================================================================

  /**
   * GET /api/vscode/state
   * Get extension state
   */
  fastify.get("/api/vscode/state", async (_request, reply) => {
    const state = vscodeManager.getState();
    return reply.send({
      success: true,
      data: state,
    });
  });

  /**
   * POST /api/vscode/connect
   * Register VS Code extension connection
   */
  fastify.post(
    "/api/vscode/connect",
    async (
      request: FastifyRequest<{
        Body: { extensionId: string; version: string; machineId?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { extensionId, version, machineId } = request.body;
        await vscodeManager.connect(extensionId, version, machineId);
        return reply.send({
          success: true,
          message: "Extension connected",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/vscode/disconnect
   * Disconnect VS Code extension
   */
  fastify.post("/api/vscode/disconnect", async (_request, reply) => {
    await vscodeManager.disconnect();
    return reply.send({
      success: true,
      message: "Extension disconnected",
    });
  });

  // ===========================================================================
  // TREE VIEW
  // ===========================================================================

  /**
   * GET /api/vscode/tree/pipelines
   * Get pipeline tree items
   */
  fastify.get("/api/vscode/tree/pipelines", async (_request, reply) => {
    const items = await vscodeManager.getPipelineTreeItems();
    return reply.send({
      success: true,
      data: items,
      count: items.length,
    });
  });

  /**
   * GET /api/vscode/tree/schedules
   * Get schedule tree items
   */
  fastify.get("/api/vscode/tree/schedules", async (_request, reply) => {
    const items = await vscodeManager.getScheduleTreeItems();
    return reply.send({
      success: true,
      data: items,
      count: items.length,
    });
  });

  /**
   * GET /api/vscode/tree/executions
   * Get recent execution tree items
   */
  fastify.get(
    "/api/vscode/tree/executions",
    async (
      request: FastifyRequest<{ Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      const limit = parseInt(request.query.limit || "20", 10);
      const items = await vscodeManager.getExecutionTreeItems(limit);
      return reply.send({
        success: true,
        data: items,
        count: items.length,
      });
    }
  );

  // ===========================================================================
  // INTELLISENSE
  // ===========================================================================

  /**
   * POST /api/vscode/completions
   * Get completion items for position
   */
  fastify.post(
    "/api/vscode/completions",
    async (
      request: FastifyRequest<{
        Body: {
          document: string;
          position: { line: number; character: number };
          triggerCharacter?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { document, position, triggerCharacter } = request.body;
      const completions = await vscodeManager.getCompletions(
        document,
        position,
        triggerCharacter
      );
      return reply.send({
        success: true,
        data: completions,
      });
    }
  );

  /**
   * POST /api/vscode/hover
   * Get hover information for position
   */
  fastify.post(
    "/api/vscode/hover",
    async (
      request: FastifyRequest<{
        Body: {
          document: string;
          position: { line: number; character: number };
        };
      }>,
      reply: FastifyReply
    ) => {
      const { document, position } = request.body;
      const hover = await vscodeManager.getHoverInfo(document, position);
      return reply.send({
        success: true,
        data: hover,
      });
    }
  );

  /**
   * POST /api/vscode/diagnostics
   * Get diagnostics for document
   */
  fastify.post(
    "/api/vscode/diagnostics",
    async (
      request: FastifyRequest<{ Body: { document: string; uri: string } }>,
      reply: FastifyReply
    ) => {
      const { document, uri } = request.body;
      const diagnostics = await vscodeManager.getDiagnostics(document, uri);
      return reply.send({
        success: true,
        data: diagnostics,
        count: diagnostics.length,
      });
    }
  );

  /**
   * POST /api/vscode/codeactions
   * Get code actions for range
   */
  fastify.post(
    "/api/vscode/codeactions",
    async (
      request: FastifyRequest<{
        Body: {
          document: string;
          range: {
            start: { line: number; character: number };
            end: { line: number; character: number };
          };
          diagnostics?: Diagnostic[];
        };
      }>,
      reply: FastifyReply
    ) => {
      const { document, range, diagnostics } = request.body;
      const actions = await vscodeManager.getCodeActions(document, range, diagnostics);
      return reply.send({
        success: true,
        data: actions,
      });
    }
  );

  // ===========================================================================
  // COMMANDS
  // ===========================================================================

  /**
   * GET /api/vscode/commands
   * List available commands
   */
  fastify.get("/api/vscode/commands", async (_request, reply) => {
    const commands = vscodeManager.getCommands();
    return reply.send({
      success: true,
      data: commands,
      count: commands.length,
    });
  });

  /**
   * POST /api/vscode/commands/:command
   * Execute a command
   */
  fastify.post(
    "/api/vscode/commands/:command",
    async (
      request: FastifyRequest<{
        Params: { command: string };
        Body: { args?: unknown[] };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { command } = request.params;
        const { args } = request.body;
        const result = await vscodeManager.executeCommand(command, args);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Command failed";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // SNIPPETS
  // ===========================================================================

  /**
   * GET /api/vscode/snippets
   * Get available snippets
   */
  fastify.get("/api/vscode/snippets", async (_request, reply) => {
    return reply.send({
      success: true,
      data: PIPELINE_SNIPPETS,
    });
  });

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  /**
   * POST /api/vscode/notify
   * Send notification to VS Code
   */
  fastify.post(
    "/api/vscode/notify",
    async (
      request: FastifyRequest<{
        Body: {
          type: "info" | "warning" | "error";
          message: string;
          actions?: Array<{ title: string; command?: string }>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { type, message, actions } = request.body;
        await vscodeManager.sendNotification({
          id: `notif_${Date.now()}`,
          type,
          message,
          actions: actions?.map((a) => ({
            label: a.title,
            command: a.command,
          })),
          timestamp: new Date().toISOString(),
        });
        return reply.send({
          success: true,
          message: "Notification sent",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send notification";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // WEBVIEW
  // ===========================================================================

  /**
   * POST /api/vscode/webview/message
   * Handle webview message
   */
  fastify.post(
    "/api/vscode/webview/message",
    async (
      request: FastifyRequest<{
        Body: { type: string; command: string; data?: unknown };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { type, command, data } = request.body;
        const response = await vscodeManager.handleWebviewMessage({
          type: type as any,
          command,
          data,
        });
        return reply.send({
          success: true,
          data: response,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to handle message";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * GET /api/vscode/webview/state/:type
   * Get webview state
   */
  fastify.get(
    "/api/vscode/webview/state/:type",
    async (
      request: FastifyRequest<{ Params: { type: string } }>,
      reply: FastifyReply
    ) => {
      const state = await vscodeManager.getWebviewState(request.params.type as any);
      return reply.send({
        success: true,
        data: state,
      });
    }
  );

  // ===========================================================================
  // WORKSPACE
  // ===========================================================================

  /**
   * POST /api/vscode/workspace/scan
   * Scan workspace for pipeline files
   */
  fastify.post(
    "/api/vscode/workspace/scan",
    async (
      request: FastifyRequest<{ Body: { rootPath: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { rootPath } = request.body;
        const files = await vscodeManager.scanWorkspace(rootPath);
        return reply.send({
          success: true,
          data: files,
          count: files.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to scan workspace";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/vscode/workspace/validate
   * Validate a pipeline file
   */
  fastify.post(
    "/api/vscode/workspace/validate",
    async (
      request: FastifyRequest<{ Body: { content: string; filePath: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { content, filePath } = request.body;
        const result = await vscodeManager.validatePipelineFile(content, filePath);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Validation failed";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );
}

export default vscodeRoutes;
