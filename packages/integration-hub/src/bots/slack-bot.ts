/**
 * Slack Bot
 *
 * Slack integration for notifications and commands
 */

import { EventEmitter } from "eventemitter3";
import {
  type SlackConfig,
  type Notification,
  type CommandContext,
  type CommandResponse,
  type BotStatus,
  type InteractionPayload,
  type BotEvents,
  SEVERITY_COLORS,
  CATEGORY_EMOJIS,
  BUILT_IN_COMMANDS,
} from "./types.js";

// =============================================================================
// SLACK BLOCK BUILDER
// =============================================================================

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: unknown[];
  accessory?: unknown;
  fields?: Array<{ type: string; text: string }>;
  block_id?: string;
}

function buildSlackBlocks(notification: Notification): SlackBlock[] {
  const blocks: SlackBlock[] = [];
  const emoji = CATEGORY_EMOJIS[notification.category];
  const color = SEVERITY_COLORS[notification.severity];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `${emoji} ${notification.title}`,
      emoji: true,
    },
  });

  // Message body
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: notification.message,
    },
  });

  // Data fields if present
  if (notification.data && Object.keys(notification.data).length > 0) {
    const fields = Object.entries(notification.data)
      .slice(0, 10) // Max 10 fields
      .map(([key, value]) => ({
        type: "mrkdwn",
        text: `*${key}:*\n${String(value)}`,
      }));

    if (fields.length > 0) {
      blocks.push({
        type: "section",
        fields,
      });
    }
  }

  // Action buttons if present
  if (notification.actions && notification.actions.length > 0) {
    blocks.push({
      type: "actions",
      block_id: `actions_${notification.id}`,
      elements: notification.actions.map((action) => ({
        type: "button",
        text: {
          type: "plain_text",
          text: action.label,
          emoji: true,
        },
        action_id: action.id,
        value: action.value,
        style: action.style === "danger" ? "danger" : action.style === "primary" ? "primary" : undefined,
      })),
    });
  }

  // Footer with timestamp
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Severity: *${notification.severity}* | Category: *${notification.category}* | ${new Date(notification.createdAt).toLocaleString()}`,
      },
    ],
  });

  return blocks;
}

function buildCommandResponse(response: CommandResponse): { text?: string; blocks?: SlackBlock[] } {
  const result: { text?: string; blocks?: SlackBlock[] } = {};

  if (response.text) {
    result.text = response.text;
  }

  if (response.blocks) {
    result.blocks = response.blocks as SlackBlock[];
  }

  return result;
}

// =============================================================================
// SLACK BOT
// =============================================================================

export class SlackBot extends EventEmitter<BotEvents> {
  private config: SlackConfig;
  private status: BotStatus;
  private commandHandlers: Map<string, (args: Record<string, unknown>, context: CommandContext) => Promise<CommandResponse>> = new Map();

  constructor(config: SlackConfig) {
    super();
    this.config = config;
    this.status = {
      platform: "slack",
      connected: false,
    };

    // Register default command handlers
    this.registerDefaultCommands();
  }

  // ===========================================================================
  // CONNECTION
  // ===========================================================================

  /**
   * Connect to Slack
   */
  async connect(): Promise<void> {
    try {
      // Test connection by calling auth.test
      const response = await this.callAPI("auth.test", {});

      if (!response.ok) {
        throw new Error(response.error || "Failed to authenticate");
      }

      this.status = {
        platform: "slack",
        connected: true,
        connectedAt: new Date().toISOString(),
        workspaceId: response.team_id,
        workspaceName: response.team,
      };

      this.emit("bot:connected", "slack", this.status);
      console.log(`[SLACK] Connected to workspace: ${response.team}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("bot:error", "slack", err);
      throw err;
    }
  }

  /**
   * Disconnect from Slack
   */
  async disconnect(): Promise<void> {
    this.status.connected = false;
    this.emit("bot:disconnected", "slack", "Manual disconnect");
  }

  /**
   * Get connection status
   */
  getStatus(): BotStatus {
    return { ...this.status };
  }

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  /**
   * Send a notification to a channel
   */
  async sendNotification(notification: Notification, channelId: string): Promise<void> {
    try {
      const blocks = buildSlackBlocks(notification);

      const response = await this.callAPI("chat.postMessage", {
        channel: channelId,
        text: `${notification.title}: ${notification.message}`,
        blocks,
      });

      if (!response.ok) {
        throw new Error(response.error || "Failed to send message");
      }

      this.emit("notification:sent", "slack", notification, channelId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("notification:failed", "slack", notification, err);
      throw err;
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(userId: string, notification: Notification): Promise<void> {
    try {
      // Open DM channel
      const openResponse = await this.callAPI("conversations.open", {
        users: userId,
      });

      if (!openResponse.ok) {
        throw new Error(openResponse.error || "Failed to open DM");
      }

      // Send message
      await this.sendNotification(notification, openResponse.channel.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("notification:failed", "slack", notification, err);
      throw err;
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(channelId: string, messageTs: string, notification: Notification): Promise<void> {
    const blocks = buildSlackBlocks(notification);

    const response = await this.callAPI("chat.update", {
      channel: channelId,
      ts: messageTs,
      text: `${notification.title}: ${notification.message}`,
      blocks,
    });

    if (!response.ok) {
      throw new Error(response.error || "Failed to update message");
    }
  }

  // ===========================================================================
  // COMMANDS
  // ===========================================================================

  /**
   * Register a command handler
   */
  registerCommand(
    name: string,
    handler: (args: Record<string, unknown>, context: CommandContext) => Promise<CommandResponse>
  ): void {
    this.commandHandlers.set(name, handler);
  }

  /**
   * Handle incoming slash command
   */
  async handleSlashCommand(
    command: string,
    text: string,
    context: CommandContext
  ): Promise<CommandResponse> {
    this.emit("command:received", "slack", command, context);

    const handler = this.commandHandlers.get(command);
    if (!handler) {
      return {
        text: `Unknown command: ${command}. Use /gicm help for available commands.`,
        ephemeral: true,
      };
    }

    // Parse arguments from text
    const args = this.parseCommandArgs(text);

    try {
      const response = await handler(args, context);
      this.emit("command:executed", "slack", command, context);
      return response;
    } catch (error) {
      return {
        text: `Error executing command: ${error instanceof Error ? error.message : String(error)}`,
        ephemeral: true,
      };
    }
  }

  /**
   * Parse command arguments
   */
  private parseCommandArgs(text: string): Record<string, unknown> {
    const args: Record<string, unknown> = {};
    const parts = text.trim().split(/\s+/);

    // First part might be subcommand
    if (parts.length > 0 && !parts[0].includes("=")) {
      args._subcommand = parts.shift();
    }

    // Parse key=value pairs
    for (const part of parts) {
      if (part.includes("=")) {
        const [key, ...valueParts] = part.split("=");
        args[key] = valueParts.join("=");
      } else {
        // Positional argument
        if (!args._positional) args._positional = [];
        (args._positional as string[]).push(part);
      }
    }

    return args;
  }

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  /**
   * Handle interactive component (button, select, etc.)
   */
  async handleInteraction(payload: InteractionPayload): Promise<CommandResponse> {
    this.emit("interaction:received", "slack", payload);

    // Handle based on action ID
    switch (payload.actionId) {
      case "approve_pipeline":
        return { text: "Pipeline approved!" };
      case "cancel_pipeline":
        return { text: "Pipeline cancelled." };
      case "view_details":
        return { text: `View details for: ${payload.value}` };
      default:
        return { text: "Action received" };
    }
  }

  // ===========================================================================
  // API
  // ===========================================================================

  /**
   * Call Slack API
   */
  private async callAPI(method: string, params: Record<string, unknown>): Promise<any> {
    const url = `https://slack.com/api/${method}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.botToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(params),
    });

    return response.json();
  }

  // ===========================================================================
  // DEFAULT COMMANDS
  // ===========================================================================

  private registerDefaultCommands(): void {
    // Help command
    this.registerCommand("help", async () => {
      const commandList = BUILT_IN_COMMANDS.map(
        (cmd) => `• *${cmd.name}* - ${cmd.description}`
      ).join("\n");

      return {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: ":robot_face: gICM Bot Commands", emoji: true },
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: commandList },
          },
          {
            type: "context",
            elements: [
              { type: "mrkdwn", text: "Use `/gicm <command>` to execute commands" },
            ],
          },
        ],
      };
    });

    // Status command
    this.registerCommand("status", async () => {
      return {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: ":green_circle: System Status", emoji: true },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: "*Status:*\nOnline" },
              { type: "mrkdwn", text: `*Connected Since:*\n${this.status.connectedAt || "N/A"}` },
              { type: "mrkdwn", text: `*Workspace:*\n${this.status.workspaceName || "N/A"}` },
            ],
          },
        ],
      };
    });

    // Pipelines command
    this.registerCommand("pipelines", async (args) => {
      const limit = Number(args.limit) || 5;
      const status = args.status as string;

      return {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: ":gear: Recent Pipelines", emoji: true },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Showing last ${limit} pipelines${status ? ` with status: ${status}` : ""}\n_Connect to Integration Hub API to view real data_`,
            },
          },
        ],
      };
    });

    // Budget command
    this.registerCommand("budget", async (args) => {
      const period = (args.period as string) || "week";

      return {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: ":moneybag: Budget Status", emoji: true },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Budget summary for: *${period}*\n_Connect to Integration Hub API to view real data_`,
            },
          },
        ],
      };
    });

    // Analytics command
    this.registerCommand("analytics", async (args) => {
      const period = (args.period as string) || "week";

      return {
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: ":chart_with_upwards_trend: Analytics", emoji: true },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Analytics summary for: *${period}*\n_Connect to Integration Hub API to view real data_`,
            },
          },
        ],
      };
    });

    // Subscribe command
    this.registerCommand("subscribe", async (args, context) => {
      const category = args.category as string;
      const severity = (args.severity as string) || "info";

      return {
        text: `Channel subscribed to *${category}* notifications (min severity: ${severity})`,
      };
    });

    // Unsubscribe command
    this.registerCommand("unsubscribe", async (args, context) => {
      const category = args.category as string;

      return {
        text: `Channel unsubscribed from *${category}* notifications`,
      };
    });
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let slackInstance: SlackBot | null = null;

export function getSlackBot(config?: SlackConfig): SlackBot {
  if (!slackInstance && config) {
    slackInstance = new SlackBot(config);
  }
  if (!slackInstance) {
    throw new Error("SlackBot not initialized. Provide config on first call.");
  }
  return slackInstance;
}

export function createSlackBot(config: SlackConfig): SlackBot {
  return new SlackBot(config);
}
