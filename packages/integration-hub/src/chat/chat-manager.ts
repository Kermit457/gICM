/**
 * Chat Manager
 * Phase 11B: Slack/Discord Bot Integration
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import {
  type ChatPlatform,
  type ConnectionStatus,
  type ChatCredentials,
  type ChatChannel,
  type ChatUser,
  type ChatMessage,
  type SendMessageOptions,
  type SlashCommand,
  type CommandInvocation,
  type ButtonInteraction,
  type NotificationType,
  type NotificationTemplate,
  type NotificationConfig,
  type BotConfig,
  type ChatManagerConfig,
  type ChatEvents,
  DEFAULT_NOTIFICATION_TEMPLATES,
  ChatManagerConfigSchema,
} from "./types.js";

// ============================================================================
// Chat Manager Class
// ============================================================================

export class ChatManager extends EventEmitter<ChatEvents> {
  private config: ChatManagerConfig;
  private bots: Map<string, BotConfig> = new Map();
  private connections: Map<ChatPlatform, ConnectionStatus> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private commandHandlers: Map<string, (invocation: CommandInvocation) => Promise<void>> = new Map();
  private messageQueue: SendMessageOptions[] = [];
  private rateLimitTokens: number;
  private lastTokenRefill: number;

  constructor(config: Partial<ChatManagerConfig> = {}) {
    super();
    this.config = ChatManagerConfigSchema.parse(config);
    this.rateLimitTokens = this.config.rateLimitPerMinute;
    this.lastTokenRefill = Date.now();

    // Load default templates
    for (const template of DEFAULT_NOTIFICATION_TEMPLATES) {
      this.templates.set(`${template.type}:${template.platform}`, template);
    }

    // Load bots from config
    if (this.config.bots) {
      for (const bot of this.config.bots) {
        this.bots.set(bot.id, bot);
      }
    }
  }

  // ============================================================================
  // Bot Management
  // ============================================================================

  /**
   * Connect a bot to a platform
   */
  async connectBot(credentials: ChatCredentials): Promise<BotConfig> {
    const { platform } = credentials;

    // Check if already connected
    if (this.connections.get(platform) === "connected") {
      throw new Error(`Already connected to ${platform}`);
    }

    this.connections.set(platform, "connecting");

    try {
      // Platform-specific connection logic
      const bot = await this.initializePlatformBot(credentials);

      this.bots.set(bot.id, bot);
      this.connections.set(platform, "connected");

      this.emit("connected", platform);

      return bot;
    } catch (error) {
      this.connections.set(platform, "error");
      this.emit("error", platform, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Disconnect a bot
   */
  async disconnectBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot not found: ${botId}`);
    }

    // Platform-specific disconnect logic would go here
    this.bots.delete(botId);
    this.connections.set(bot.platform, "disconnected");

    this.emit("disconnected", bot.platform, "Manual disconnect");
  }

  /**
   * Get bot status
   */
  getBotStatus(botId: string): BotConfig | undefined {
    return this.bots.get(botId);
  }

  /**
   * Get all connected platforms
   */
  getConnectedPlatforms(): ChatPlatform[] {
    const connected: ChatPlatform[] = [];
    for (const [platform, status] of this.connections) {
      if (status === "connected") {
        connected.push(platform);
      }
    }
    return connected;
  }

  // ============================================================================
  // Messaging
  // ============================================================================

  /**
   * Send a message to a channel
   */
  async sendMessage(options: SendMessageOptions, platform?: ChatPlatform): Promise<ChatMessage> {
    const targetPlatform = platform || this.config.defaultPlatform;
    if (!targetPlatform) {
      throw new Error("No platform specified and no default platform configured");
    }

    // Check rate limit
    await this.checkRateLimit();

    const message: ChatMessage = {
      id: randomUUID(),
      platform: targetPlatform,
      channelId: options.channelId,
      userId: "bot",
      content: options.content,
      blocks: options.blocks,
      threadId: options.threadId,
      timestamp: new Date(),
    };

    // Platform-specific send logic would go here
    await this.sendPlatformMessage(targetPlatform, options);

    this.emit("messageSent", message);

    return message;
  }

  /**
   * Send a notification
   */
  async sendNotification(
    type: NotificationType,
    data: Record<string, unknown>,
    config?: NotificationConfig
  ): Promise<void> {
    // Find notification configs for this type
    const configs = config
      ? [config]
      : Array.from(this.bots.values())
          .flatMap((bot) => bot.notifications || [])
          .filter((n) => n.enabledTypes.includes(type));

    if (configs.length === 0) {
      console.warn(`No notification config found for type: ${type}`);
      return;
    }

    for (const notificationConfig of configs) {
      try {
        // Check quiet hours
        if (this.isInQuietHours(notificationConfig)) {
          continue;
        }

        // Get template
        const templateKey = `${type}:${notificationConfig.platform}`;
        const template = this.templates.get(templateKey);
        if (!template) {
          console.warn(`No template found for: ${templateKey}`);
          continue;
        }

        // Render message
        const content = this.renderTemplate(template.bodyTemplate, data);
        const blocks = this.buildNotificationBlocks(template, data);

        // Build mentions
        const mentions = this.buildMentions(notificationConfig);
        const finalContent = mentions ? `${mentions}\n${content}` : content;

        // Send
        await this.sendMessage(
          {
            channelId: notificationConfig.channelId,
            content: finalContent,
            blocks,
          },
          notificationConfig.platform
        );

        this.emit("notificationSent", type, notificationConfig.channelId);
      } catch (error) {
        this.emit(
          "notificationFailed",
          type,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  // ============================================================================
  // Commands
  // ============================================================================

  /**
   * Register a slash command
   */
  registerCommand(
    command: SlashCommand,
    handler: (invocation: CommandInvocation) => Promise<void>
  ): void {
    this.commandHandlers.set(command.name, handler);

    // Register with platforms
    for (const bot of this.bots.values()) {
      if (!bot.commands) {
        bot.commands = [];
      }
      bot.commands.push(command);
    }
  }

  /**
   * Handle incoming command
   */
  async handleCommand(invocation: CommandInvocation): Promise<void> {
    this.emit("commandReceived", invocation);

    const handler = this.commandHandlers.get(invocation.command);
    if (!handler) {
      await this.sendMessage(
        {
          channelId: invocation.channelId,
          content: `Unknown command: ${invocation.command}`,
        },
        invocation.platform
      );
      return;
    }

    try {
      await handler(invocation);
    } catch (error) {
      await this.sendMessage(
        {
          channelId: invocation.channelId,
          content: `Error executing command: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
        invocation.platform
      );
    }
  }

  /**
   * Handle button interaction
   */
  async handleButtonClick(interaction: ButtonInteraction): Promise<void> {
    this.emit("buttonClicked", interaction);

    // Route to appropriate handler based on actionId
    switch (interaction.actionId) {
      case "approve":
        await this.handleApprovalAction(interaction, true);
        break;
      case "reject":
        await this.handleApprovalAction(interaction, false);
        break;
      case "view_results":
      case "view_logs":
        await this.handleViewAction(interaction);
        break;
      case "retry_pipeline":
        await this.handleRetryAction(interaction);
        break;
      case "investigate":
        await this.handleInvestigateAction(interaction);
        break;
      case "dismiss":
        await this.handleDismissAction(interaction);
        break;
      default:
        console.warn(`Unknown action: ${interaction.actionId}`);
    }
  }

  // ============================================================================
  // Templates
  // ============================================================================

  /**
   * Add or update a notification template
   */
  setTemplate(template: NotificationTemplate): void {
    const key = `${template.type}:${template.platform}`;
    this.templates.set(key, template);
  }

  /**
   * Get template
   */
  getTemplate(type: NotificationType, platform: ChatPlatform): NotificationTemplate | undefined {
    return this.templates.get(`${type}:${platform}`);
  }

  // ============================================================================
  // Pipeline Integration
  // ============================================================================

  /**
   * Register default pipeline commands
   */
  registerPipelineCommands(): void {
    // /pipeline list
    this.registerCommand(
      {
        name: "pipeline",
        description: "Manage pipelines",
        options: [
          {
            name: "action",
            description: "Action to perform",
            type: "string",
            required: true,
            choices: [
              { name: "list", value: "list" },
              { name: "run", value: "run" },
              { name: "status", value: "status" },
              { name: "stop", value: "stop" },
            ],
          },
          {
            name: "pipeline_id",
            description: "Pipeline ID",
            type: "string",
            required: false,
          },
        ],
        handler: "pipeline_command",
      },
      async (invocation) => {
        const action = invocation.args.action as string;
        const pipelineId = invocation.args.pipeline_id as string | undefined;

        switch (action) {
          case "list":
            await this.sendMessage(
              {
                channelId: invocation.channelId,
                content: "Available pipelines:\n- content-generation\n- data-extraction\n- reporting",
              },
              invocation.platform
            );
            break;
          case "run":
            if (!pipelineId) {
              await this.sendMessage(
                {
                  channelId: invocation.channelId,
                  content: "Please specify a pipeline ID: `/pipeline run --pipeline_id <id>`",
                },
                invocation.platform
              );
              return;
            }
            await this.sendMessage(
              {
                channelId: invocation.channelId,
                content: `Starting pipeline: ${pipelineId}...`,
              },
              invocation.platform
            );
            // Would trigger actual pipeline execution here
            break;
          case "status":
            await this.sendMessage(
              {
                channelId: invocation.channelId,
                content: pipelineId
                  ? `Pipeline ${pipelineId} status: running`
                  : "All pipelines: 3 running, 2 idle",
              },
              invocation.platform
            );
            break;
          case "stop":
            if (!pipelineId) {
              await this.sendMessage(
                {
                  channelId: invocation.channelId,
                  content: "Please specify a pipeline ID to stop",
                },
                invocation.platform
              );
              return;
            }
            await this.sendMessage(
              {
                channelId: invocation.channelId,
                content: `Stopping pipeline: ${pipelineId}`,
              },
              invocation.platform
            );
            break;
        }
      }
    );

    // /budget
    this.registerCommand(
      {
        name: "budget",
        description: "Check budget status",
        options: [],
        handler: "budget_command",
      },
      async (invocation) => {
        await this.sendMessage(
          {
            channelId: invocation.channelId,
            content: `Budget Status:\n- Daily: $45.20 / $100 (45%)\n- Monthly: $890 / $2000 (44.5%)\n- Per-pipeline avg: $2.30`,
            blocks: [
              { type: "header", content: "Budget Overview" },
              { type: "text", content: "Daily spend: $45.20 / $100" },
              { type: "text", content: "Monthly spend: $890 / $2000" },
              { type: "divider" },
              { type: "text", content: "All budgets are within limits." },
            ],
          },
          invocation.platform
        );
      }
    );

    // /help
    this.registerCommand(
      {
        name: "help",
        description: "Show available commands",
        options: [],
        handler: "help_command",
      },
      async (invocation) => {
        const commands = Array.from(this.commandHandlers.keys());
        await this.sendMessage(
          {
            channelId: invocation.channelId,
            content: `Available commands:\n${commands.map((c) => `- /${c}`).join("\n")}`,
          },
          invocation.platform
        );
      }
    );
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async initializePlatformBot(credentials: ChatCredentials): Promise<BotConfig> {
    // Platform-specific initialization would go here
    // This is a mock implementation
    return {
      id: randomUUID(),
      platform: credentials.platform,
      name: `${credentials.platform}-bot`,
      status: "connected",
      credentials: credentials.credentials,
      commands: [],
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async sendPlatformMessage(
    platform: ChatPlatform,
    options: SendMessageOptions
  ): Promise<void> {
    // Platform-specific message sending would go here
    // This is where you'd integrate with actual SDKs:
    // - @slack/web-api for Slack
    // - discord.js for Discord
    // - node-telegram-bot-api for Telegram
    // - @microsoft/bot-framework for Teams
    console.log(`[${platform}] Sending to ${options.channelId}: ${options.content}`);
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastTokenRefill;

    // Refill tokens every minute
    if (elapsed >= 60000) {
      this.rateLimitTokens = this.config.rateLimitPerMinute;
      this.lastTokenRefill = now;
    }

    if (this.rateLimitTokens <= 0) {
      const waitTime = 60000 - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.rateLimitTokens = this.config.rateLimitPerMinute;
      this.lastTokenRefill = Date.now();
    }

    this.rateLimitTokens--;
  }

  private isInQuietHours(config: NotificationConfig): boolean {
    if (!config.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const [startHour, startMin] = config.quietHours.start.split(":").map(Number);
    const [endHour, endMin] = config.quietHours.end.split(":").map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  private renderTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }

  private buildNotificationBlocks(
    template: NotificationTemplate,
    data: Record<string, unknown>
  ): { type: string; content?: string; url?: string }[] {
    const blocks: { type: string; content?: string; url?: string }[] = [
      { type: "header", content: template.title },
      { type: "text", content: this.renderTemplate(template.bodyTemplate, data) },
    ];

    if (template.actions && template.actions.length > 0) {
      blocks.push({ type: "divider" });
      for (const action of template.actions) {
        blocks.push({
          type: "button",
          content: action.label,
          url: action.actionId,
        });
      }
    }

    return blocks;
  }

  private buildMentions(config: NotificationConfig): string {
    const mentions: string[] = [];

    if (config.mentionUsers) {
      mentions.push(...config.mentionUsers.map((u) => `<@${u}>`));
    }

    if (config.mentionRoles) {
      mentions.push(...config.mentionRoles.map((r) => `<@&${r}>`));
    }

    return mentions.join(" ");
  }

  // Action handlers
  private async handleApprovalAction(
    interaction: ButtonInteraction,
    approved: boolean
  ): Promise<void> {
    await this.sendMessage(
      {
        channelId: interaction.channelId,
        content: approved
          ? `Approved by <@${interaction.userId}>`
          : `Rejected by <@${interaction.userId}>`,
        threadId: interaction.messageId,
      },
      interaction.platform
    );
  }

  private async handleViewAction(interaction: ButtonInteraction): Promise<void> {
    await this.sendMessage(
      {
        channelId: interaction.channelId,
        content: `View details: https://dashboard.example.com/execution/${interaction.value}`,
        threadId: interaction.messageId,
      },
      interaction.platform
    );
  }

  private async handleRetryAction(interaction: ButtonInteraction): Promise<void> {
    await this.sendMessage(
      {
        channelId: interaction.channelId,
        content: `Retrying pipeline... Started by <@${interaction.userId}>`,
        threadId: interaction.messageId,
      },
      interaction.platform
    );
  }

  private async handleInvestigateAction(interaction: ButtonInteraction): Promise<void> {
    await this.sendMessage(
      {
        channelId: interaction.channelId,
        content: `Creating investigation ticket for <@${interaction.userId}>...`,
        threadId: interaction.messageId,
      },
      interaction.platform
    );
  }

  private async handleDismissAction(interaction: ButtonInteraction): Promise<void> {
    await this.sendMessage(
      {
        channelId: interaction.channelId,
        content: `Dismissed by <@${interaction.userId}>`,
        threadId: interaction.messageId,
      },
      interaction.platform
    );
  }

  /**
   * Get summary of chat manager state
   */
  getSummary(): {
    connectedPlatforms: ChatPlatform[];
    totalBots: number;
    registeredCommands: number;
    templatesCount: number;
  } {
    return {
      connectedPlatforms: this.getConnectedPlatforms(),
      totalBots: this.bots.size,
      registeredCommands: this.commandHandlers.size,
      templatesCount: this.templates.size,
    };
  }
}

// ============================================================================
// Singleton & Factory
// ============================================================================

let chatManagerInstance: ChatManager | null = null;

export function getChatManager(): ChatManager {
  if (!chatManagerInstance) {
    chatManagerInstance = new ChatManager();
  }
  return chatManagerInstance;
}

export function createChatManager(config: Partial<ChatManagerConfig> = {}): ChatManager {
  return new ChatManager(config);
}
