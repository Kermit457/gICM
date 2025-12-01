/**
 * Bot API Routes
 *
 * REST API for Slack/Discord bot management and notifications
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getChatManager,
  type ChatPlatform,
  type SendMessageOptions,
  type NotificationType,
} from "../chat/index.js";

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function botRoutes(fastify: FastifyInstance): Promise<void> {
  const chatManager = getChatManager();

  // ===========================================================================
  // BOT STATUS
  // ===========================================================================

  /**
   * GET /api/bots/status
   * Get status of all connected bots
   */
  fastify.get("/api/bots/status", async (_request, reply) => {
    const status = chatManager.getConnectionStatus();
    const bots = chatManager.getBots();

    return reply.send({
      success: true,
      data: {
        connections: Object.fromEntries(status),
        bots: bots.map((b) => ({
          id: b.id,
          name: b.name,
          platform: b.platform,
          enabled: b.enabled,
        })),
      },
    });
  });

  /**
   * GET /api/bots/:platform/status
   * Get status of a specific platform
   */
  fastify.get(
    "/api/bots/:platform/status",
    async (
      request: FastifyRequest<{ Params: { platform: string } }>,
      reply: FastifyReply
    ) => {
      const platform = request.params.platform as ChatPlatform;
      const status = chatManager.getConnectionStatus().get(platform);

      return reply.send({
        success: true,
        data: {
          platform,
          status: status || "disconnected",
        },
      });
    }
  );

  // ===========================================================================
  // BOT CONNECTION
  // ===========================================================================

  /**
   * POST /api/bots/connect
   * Connect a bot to a platform
   */
  fastify.post(
    "/api/bots/connect",
    async (
      request: FastifyRequest<{
        Body: {
          platform: ChatPlatform;
          credentials: Record<string, unknown>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { platform, credentials } = request.body;

        const bot = await chatManager.connectBot({
          platform,
          ...credentials,
        } as any);

        return reply.status(201).send({
          success: true,
          data: {
            id: bot.id,
            name: bot.name,
            platform: bot.platform,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect bot";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/bots/:id/disconnect
   * Disconnect a bot
   */
  fastify.post(
    "/api/bots/:id/disconnect",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        await chatManager.disconnectBot(request.params.id);
        return reply.send({
          success: true,
          message: "Bot disconnected",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to disconnect bot";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  /**
   * POST /api/bots/send
   * Send a message to a channel
   */
  fastify.post(
    "/api/bots/send",
    async (
      request: FastifyRequest<{
        Body: {
          platform: ChatPlatform;
          channelId: string;
          message: string;
          blocks?: unknown[];
          attachments?: Array<{ url: string; type: string }>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { platform, channelId, message, blocks, attachments } = request.body;

        const options: SendMessageOptions = {
          platform,
          channelId,
          content: message,
          blocks,
          attachments,
        };

        await chatManager.sendMessage(options);

        return reply.send({
          success: true,
          message: "Message sent",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send message";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * POST /api/bots/broadcast
   * Send a notification to all subscribed channels
   */
  fastify.post(
    "/api/bots/broadcast",
    async (
      request: FastifyRequest<{
        Body: {
          type: NotificationType;
          data: Record<string, unknown>;
          severity?: "info" | "warning" | "error" | "critical";
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { type, data, severity } = request.body;

        await chatManager.sendNotification(type, data);

        return reply.send({
          success: true,
          message: "Notification broadcast sent",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to broadcast";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  /**
   * GET /api/bots/subscriptions
   * List all channel subscriptions
   */
  fastify.get("/api/bots/subscriptions", async (_request, reply) => {
    const subscriptions = chatManager.getNotificationConfigs();

    return reply.send({
      success: true,
      data: subscriptions,
      count: subscriptions.length,
    });
  });

  /**
   * POST /api/bots/subscriptions
   * Subscribe a channel to notifications
   */
  fastify.post(
    "/api/bots/subscriptions",
    async (
      request: FastifyRequest<{
        Body: {
          platform: ChatPlatform;
          channelId: string;
          types: NotificationType[];
          minSeverity?: "info" | "warning" | "error" | "critical";
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { platform, channelId, types, minSeverity } = request.body;

        chatManager.configureNotifications({
          platform,
          channelId,
          types,
          minSeverity: minSeverity || "info",
          enabled: true,
        });

        return reply.status(201).send({
          success: true,
          message: "Channel subscribed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to subscribe";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  /**
   * DELETE /api/bots/subscriptions/:platform/:channelId
   * Unsubscribe a channel
   */
  fastify.delete(
    "/api/bots/subscriptions/:platform/:channelId",
    async (
      request: FastifyRequest<{
        Params: { platform: string; channelId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        // Remove notification config for this channel
        chatManager.configureNotifications({
          platform: request.params.platform as ChatPlatform,
          channelId: request.params.channelId,
          types: [],
          enabled: false,
        });

        return reply.send({
          success: true,
          message: "Channel unsubscribed",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to unsubscribe";
        return reply.status(400).send({
          success: false,
          error: message,
        });
      }
    }
  );

  // ===========================================================================
  // COMMANDS
  // ===========================================================================

  /**
   * GET /api/bots/commands
   * List registered slash commands
   */
  fastify.get("/api/bots/commands", async (_request, reply) => {
    const commands = chatManager.getRegisteredCommands();

    return reply.send({
      success: true,
      data: commands,
      count: commands.length,
    });
  });

  // ===========================================================================
  // WEBHOOKS (for receiving platform events)
  // ===========================================================================

  /**
   * POST /api/bots/webhook/slack
   * Handle incoming Slack events
   */
  fastify.post(
    "/api/bots/webhook/slack",
    async (
      request: FastifyRequest<{
        Body: {
          type: string;
          challenge?: string;
          event?: unknown;
          command?: string;
          text?: string;
          user_id?: string;
          channel_id?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { type, challenge, event, command, text, user_id, channel_id } = request.body;

      // URL verification challenge
      if (type === "url_verification" && challenge) {
        return reply.send({ challenge });
      }

      // Slash command
      if (command) {
        await chatManager.handleCommand({
          platform: "slack",
          command: command.replace("/", ""),
          args: text || "",
          userId: user_id || "",
          channelId: channel_id || "",
          timestamp: new Date().toISOString(),
        });

        return reply.send({ ok: true });
      }

      // Event callback
      if (type === "event_callback" && event) {
        // Handle different event types
        console.log("[SLACK WEBHOOK] Event received:", event);
      }

      return reply.send({ ok: true });
    }
  );

  /**
   * POST /api/bots/webhook/discord
   * Handle incoming Discord interactions
   */
  fastify.post(
    "/api/bots/webhook/discord",
    async (
      request: FastifyRequest<{
        Body: {
          type: number;
          data?: {
            name?: string;
            options?: Array<{ name: string; value: unknown }>;
          };
          member?: { user: { id: string } };
          channel_id?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { type, data, member, channel_id } = request.body;

      // Ping (type 1)
      if (type === 1) {
        return reply.send({ type: 1 });
      }

      // Slash command (type 2)
      if (type === 2 && data?.name) {
        const args = data.options?.map((o) => `${o.name}=${o.value}`).join(" ") || "";

        await chatManager.handleCommand({
          platform: "discord",
          command: data.name,
          args,
          userId: member?.user?.id || "",
          channelId: channel_id || "",
          timestamp: new Date().toISOString(),
        });

        return reply.send({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: { content: "Command received" },
        });
      }

      // Button interaction (type 3)
      if (type === 3) {
        console.log("[DISCORD WEBHOOK] Button interaction:", data);
        return reply.send({
          type: 6, // DEFERRED_UPDATE_MESSAGE
        });
      }

      return reply.send({ type: 1 });
    }
  );

  // ===========================================================================
  // TEMPLATES
  // ===========================================================================

  /**
   * GET /api/bots/templates
   * List notification templates
   */
  fastify.get("/api/bots/templates", async (_request, reply) => {
    const templates = chatManager.getTemplates();

    return reply.send({
      success: true,
      data: templates,
      count: templates.length,
    });
  });
}

export default botRoutes;
