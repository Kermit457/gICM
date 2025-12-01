/**
 * Discord Bot
 *
 * Discord integration for notifications and slash commands
 */

import { EventEmitter } from "eventemitter3";
import {
  type DiscordConfig,
  type Notification,
  type CommandContext,
  type CommandResponse,
  type BotStatus,
  type InteractionPayload,
  type BotEvents,
  type BotCommand,
  SEVERITY_COLORS,
  CATEGORY_EMOJIS,
  BUILT_IN_COMMANDS,
} from "./types.js";

// =============================================================================
// DISCORD EMBED BUILDER
// =============================================================================

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
}

interface DiscordButton {
  type: 2; // Button type
  style: 1 | 2 | 3 | 4 | 5; // Primary, Secondary, Success, Danger, Link
  label: string;
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

interface DiscordActionRow {
  type: 1; // Action row type
  components: DiscordButton[];
}

function colorToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function buildDiscordEmbed(notification: Notification): DiscordEmbed {
  const emoji = CATEGORY_EMOJIS[notification.category];
  const color = SEVERITY_COLORS[notification.severity];

  const embed: DiscordEmbed = {
    title: `${emoji} ${notification.title}`.replace(/:/g, ""), // Remove Slack-style emoji
    description: notification.message,
    color: colorToInt(color),
    timestamp: notification.createdAt,
    footer: {
      text: `${notification.severity.toUpperCase()} | ${notification.category}`,
    },
  };

  // Add data as fields
  if (notification.data && Object.keys(notification.data).length > 0) {
    embed.fields = Object.entries(notification.data)
      .slice(0, 25) // Discord max 25 fields
      .map(([name, value]) => ({
        name,
        value: String(value).substring(0, 1024), // Max 1024 chars
        inline: true,
      }));
  }

  return embed;
}

function buildDiscordComponents(notification: Notification): DiscordActionRow[] {
  if (!notification.actions || notification.actions.length === 0) {
    return [];
  }

  const buttons: DiscordButton[] = notification.actions.map((action) => ({
    type: 2,
    style: action.style === "danger" ? 4 : action.style === "primary" ? 1 : 2,
    label: action.label,
    custom_id: `${action.id}:${action.value}`,
  }));

  return [
    {
      type: 1,
      components: buttons.slice(0, 5), // Max 5 buttons per row
    },
  ];
}

// =============================================================================
// DISCORD BOT
// =============================================================================

export class DiscordBot extends EventEmitter<BotEvents> {
  private config: DiscordConfig;
  private status: BotStatus;
  private commandHandlers: Map<string, (args: Record<string, unknown>, context: CommandContext) => Promise<CommandResponse>> = new Map();
  private websocket: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private sessionId: string | null = null;
  private sequence: number | null = null;

  constructor(config: DiscordConfig) {
    super();
    this.config = config;
    this.status = {
      platform: "discord",
      connected: false,
    };

    // Register default command handlers
    this.registerDefaultCommands();
  }

  // ===========================================================================
  // CONNECTION
  // ===========================================================================

  /**
   * Connect to Discord Gateway
   */
  async connect(): Promise<void> {
    try {
      // Get gateway URL
      const gatewayResponse = await fetch("https://discord.com/api/v10/gateway/bot", {
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
        },
      });

      if (!gatewayResponse.ok) {
        throw new Error(`Failed to get gateway: ${gatewayResponse.status}`);
      }

      const gateway = await gatewayResponse.json();

      // Connect to WebSocket (simplified - in production use discord.js or similar)
      this.status = {
        platform: "discord",
        connected: true,
        connectedAt: new Date().toISOString(),
        guildCount: gateway.shards || 1,
      };

      this.emit("bot:connected", "discord", this.status);
      console.log("[DISCORD] Connected to gateway");

      // Register slash commands
      await this.registerSlashCommands();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("bot:error", "discord", err);
      throw err;
    }
  }

  /**
   * Disconnect from Discord
   */
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.status.connected = false;
    this.emit("bot:disconnected", "discord", "Manual disconnect");
  }

  /**
   * Get connection status
   */
  getStatus(): BotStatus {
    return { ...this.status };
  }

  // ===========================================================================
  // SLASH COMMANDS
  // ===========================================================================

  /**
   * Register slash commands with Discord
   */
  private async registerSlashCommands(): Promise<void> {
    const commands = BUILT_IN_COMMANDS.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options?.map((opt) => ({
        name: opt.name,
        description: opt.description,
        type: this.getOptionType(opt.type),
        required: opt.required,
        choices: opt.choices,
      })),
    }));

    // Register global commands (or guild-specific if guildId provided)
    const url = this.config.guildId
      ? `https://discord.com/api/v10/applications/${this.config.applicationId}/guilds/${this.config.guildId}/commands`
      : `https://discord.com/api/v10/applications/${this.config.applicationId}/commands`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${this.config.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.error("[DISCORD] Failed to register commands:", await response.text());
    } else {
      console.log("[DISCORD] Slash commands registered");
    }
  }

  private getOptionType(type: string): number {
    switch (type) {
      case "string":
        return 3;
      case "number":
        return 4;
      case "boolean":
        return 5;
      case "user":
        return 6;
      case "channel":
        return 7;
      default:
        return 3;
    }
  }

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  /**
   * Send a notification to a channel
   */
  async sendNotification(notification: Notification, channelId: string): Promise<void> {
    try {
      const embed = buildDiscordEmbed(notification);
      const components = buildDiscordComponents(notification);

      const body: Record<string, unknown> = {
        embeds: [embed],
      };

      if (components.length > 0) {
        body.components = components;
      }

      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${this.config.botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send message: ${error}`);
      }

      this.emit("notification:sent", "discord", notification, channelId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("notification:failed", "discord", notification, err);
      throw err;
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(userId: string, notification: Notification): Promise<void> {
    try {
      // Create DM channel
      const dmResponse = await fetch("https://discord.com/api/v10/users/@me/channels", {
        method: "POST",
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_id: userId }),
      });

      if (!dmResponse.ok) {
        throw new Error("Failed to create DM channel");
      }

      const dm = await dmResponse.json();
      await this.sendNotification(notification, dm.id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("notification:failed", "discord", notification, err);
      throw err;
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
   * Handle incoming slash command interaction
   */
  async handleSlashCommand(
    commandName: string,
    options: Record<string, unknown>,
    context: CommandContext
  ): Promise<CommandResponse> {
    this.emit("command:received", "discord", commandName, context);

    const handler = this.commandHandlers.get(commandName);
    if (!handler) {
      return {
        text: `Unknown command: ${commandName}`,
        ephemeral: true,
      };
    }

    try {
      const response = await handler(options, context);
      this.emit("command:executed", "discord", commandName, context);
      return response;
    } catch (error) {
      return {
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        ephemeral: true,
      };
    }
  }

  /**
   * Respond to an interaction
   */
  async respondToInteraction(
    interactionId: string,
    interactionToken: string,
    response: CommandResponse
  ): Promise<void> {
    const body: Record<string, unknown> = {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: response.text,
        flags: response.ephemeral ? 64 : 0, // EPHEMERAL flag
      },
    };

    if (response.blocks) {
      // Convert to Discord embeds
      body.data = {
        ...body.data as object,
        embeds: response.blocks,
      };
    }

    await fetch(
      `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
  }

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  /**
   * Handle button/select interaction
   */
  async handleInteraction(payload: InteractionPayload): Promise<CommandResponse> {
    this.emit("interaction:received", "discord", payload);

    const [actionId, value] = payload.actionId.split(":");

    switch (actionId) {
      case "approve_pipeline":
        return { text: "Pipeline approved!" };
      case "cancel_pipeline":
        return { text: "Pipeline cancelled." };
      case "view_details":
        return { text: `Viewing: ${value}` };
      default:
        return { text: "Action received" };
    }
  }

  // ===========================================================================
  // DEFAULT COMMANDS
  // ===========================================================================

  private registerDefaultCommands(): void {
    // Help command
    this.registerCommand("help", async () => {
      const embed: DiscordEmbed = {
        title: "gICM Bot Commands",
        color: colorToInt("#5865F2"),
        fields: BUILT_IN_COMMANDS.map((cmd) => ({
          name: `/${cmd.name}`,
          value: cmd.description,
          inline: true,
        })),
      };

      return { blocks: [embed] as unknown[] };
    });

    // Status command
    this.registerCommand("status", async () => {
      const embed: DiscordEmbed = {
        title: "System Status",
        color: colorToInt("#57F287"),
        fields: [
          { name: "Status", value: "Online", inline: true },
          { name: "Connected Since", value: this.status.connectedAt || "N/A", inline: true },
          { name: "Guilds", value: String(this.status.guildCount || 0), inline: true },
        ],
      };

      return { blocks: [embed] as unknown[] };
    });

    // Pipelines command
    this.registerCommand("pipelines", async (args) => {
      const limit = Number(args.limit) || 5;
      const status = args.status as string;

      const embed: DiscordEmbed = {
        title: "Recent Pipelines",
        color: colorToInt("#5865F2"),
        description: `Showing last ${limit} pipelines${status ? ` with status: ${status}` : ""}\n_Connect to Integration Hub API for real data_`,
      };

      return { blocks: [embed] as unknown[] };
    });

    // Budget command
    this.registerCommand("budget", async (args) => {
      const period = (args.period as string) || "week";

      const embed: DiscordEmbed = {
        title: "Budget Status",
        color: colorToInt("#FEE75C"),
        description: `Budget summary for: **${period}**\n_Connect to Integration Hub API for real data_`,
      };

      return { blocks: [embed] as unknown[] };
    });

    // Analytics command
    this.registerCommand("analytics", async (args) => {
      const period = (args.period as string) || "week";

      const embed: DiscordEmbed = {
        title: "Analytics",
        color: colorToInt("#5865F2"),
        description: `Analytics summary for: **${period}**\n_Connect to Integration Hub API for real data_`,
      };

      return { blocks: [embed] as unknown[] };
    });

    // Subscribe command
    this.registerCommand("subscribe", async (args) => {
      const category = args.category as string;
      const severity = (args.severity as string) || "info";

      return {
        text: `Channel subscribed to **${category}** notifications (min severity: ${severity})`,
      };
    });

    // Unsubscribe command
    this.registerCommand("unsubscribe", async (args) => {
      const category = args.category as string;

      return {
        text: `Channel unsubscribed from **${category}** notifications`,
      };
    });
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let discordInstance: DiscordBot | null = null;

export function getDiscordBot(config?: DiscordConfig): DiscordBot {
  if (!discordInstance && config) {
    discordInstance = new DiscordBot(config);
  }
  if (!discordInstance) {
    throw new Error("DiscordBot not initialized. Provide config on first call.");
  }
  return discordInstance;
}

export function createDiscordBot(config: DiscordConfig): DiscordBot {
  return new DiscordBot(config);
}
