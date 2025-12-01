/**
 * Bot Manager
 *
 * Unified manager for Slack and Discord bots
 */

import { EventEmitter } from "eventemitter3";
import {
  type BotConfig,
  type SlackConfig,
  type DiscordConfig,
  type Notification,
  type NotificationCategory,
  type NotificationSeverity,
  type ChannelSubscription,
  type BotStatus,
  type BotManagerConfig,
  type BotEvents,
  BotManagerConfigSchema,
} from "./types.js";
import { SlackBot, createSlackBot } from "./slack-bot.js";
import { DiscordBot, createDiscordBot } from "./discord-bot.js";

// =============================================================================
// BOT MANAGER
// =============================================================================

export class BotManager extends EventEmitter<BotEvents> {
  private config: BotManagerConfig;
  private slackBot: SlackBot | null = null;
  private discordBot: DiscordBot | null = null;
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private notificationCount: { minute: number; hour: number; lastMinute: number; lastHour: number } = {
    minute: 0,
    hour: 0,
    lastMinute: 0,
    lastHour: 0,
  };
  private recentNotifications: Map<string, number> = new Map(); // For deduplication
  private notificationQueue: Array<{ notification: Notification; channelId: string; platform: "slack" | "discord" }> = [];
  private queueInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<BotManagerConfig> = {}) {
    super();
    this.config = BotManagerConfigSchema.parse(config);
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize Slack bot
   */
  async initSlack(config: SlackConfig): Promise<void> {
    this.slackBot = createSlackBot(config);

    // Forward events
    this.slackBot.on("bot:connected", (platform, status) => this.emit("bot:connected", platform, status));
    this.slackBot.on("bot:disconnected", (platform, reason) => this.emit("bot:disconnected", platform, reason));
    this.slackBot.on("bot:error", (platform, error) => this.emit("bot:error", platform, error));
    this.slackBot.on("notification:sent", (platform, notification, channelId) =>
      this.emit("notification:sent", platform, notification, channelId)
    );
    this.slackBot.on("notification:failed", (platform, notification, error) =>
      this.emit("notification:failed", platform, notification, error)
    );
    this.slackBot.on("command:received", (platform, command, context) =>
      this.emit("command:received", platform, command, context)
    );
    this.slackBot.on("command:executed", (platform, command, context) =>
      this.emit("command:executed", platform, command, context)
    );
    this.slackBot.on("interaction:received", (platform, interaction) =>
      this.emit("interaction:received", platform, interaction)
    );

    await this.slackBot.connect();
  }

  /**
   * Initialize Discord bot
   */
  async initDiscord(config: DiscordConfig): Promise<void> {
    this.discordBot = createDiscordBot(config);

    // Forward events
    this.discordBot.on("bot:connected", (platform, status) => this.emit("bot:connected", platform, status));
    this.discordBot.on("bot:disconnected", (platform, reason) => this.emit("bot:disconnected", platform, reason));
    this.discordBot.on("bot:error", (platform, error) => this.emit("bot:error", platform, error));
    this.discordBot.on("notification:sent", (platform, notification, channelId) =>
      this.emit("notification:sent", platform, notification, channelId)
    );
    this.discordBot.on("notification:failed", (platform, notification, error) =>
      this.emit("notification:failed", platform, notification, error)
    );
    this.discordBot.on("command:received", (platform, command, context) =>
      this.emit("command:received", platform, command, context)
    );
    this.discordBot.on("command:executed", (platform, command, context) =>
      this.emit("command:executed", platform, command, context)
    );
    this.discordBot.on("interaction:received", (platform, interaction) =>
      this.emit("interaction:received", platform, interaction)
    );

    await this.discordBot.connect();
  }

  /**
   * Start the notification queue processor
   */
  startQueueProcessor(): void {
    if (this.queueInterval) return;

    this.queueInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Stop the notification queue processor
   */
  stopQueueProcessor(): void {
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
  }

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  /**
   * Subscribe a channel to notifications
   */
  subscribe(subscription: Omit<ChannelSubscription, "id" | "createdAt">): ChannelSubscription {
    const sub: ChannelSubscription = {
      ...subscription,
      id: generateId("sub"),
      createdAt: new Date().toISOString(),
    };

    this.subscriptions.set(sub.id, sub);
    this.emit("subscription:added", sub);

    return sub;
  }

  /**
   * Unsubscribe a channel
   */
  unsubscribe(subscriptionId: string): boolean {
    const existed = this.subscriptions.delete(subscriptionId);
    if (existed) {
      this.emit("subscription:removed", subscriptionId);
    }
    return existed;
  }

  /**
   * Get all subscriptions
   */
  getSubscriptions(): ChannelSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions for a channel
   */
  getChannelSubscriptions(platform: "slack" | "discord", channelId: string): ChannelSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.platform === platform && sub.channelId === channelId
    );
  }

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  /**
   * Broadcast a notification to all subscribed channels
   */
  async broadcast(notification: Notification): Promise<void> {
    // Check rate limits
    if (!this.checkRateLimits()) {
      console.warn("[BOT] Rate limit exceeded, queuing notification");
      if (this.config.queueEnabled) {
        this.queueNotificationForAllSubscribers(notification);
      }
      return;
    }

    // Check deduplication
    const dedupeKey = `${notification.category}:${notification.title}:${notification.message}`;
    const lastSent = this.recentNotifications.get(dedupeKey);
    if (lastSent && Date.now() - lastSent < this.config.dedupeWindowMs) {
      console.warn("[BOT] Duplicate notification suppressed");
      return;
    }
    this.recentNotifications.set(dedupeKey, Date.now());

    // Find matching subscriptions
    const matchingSubs = Array.from(this.subscriptions.values()).filter((sub) => {
      if (!sub.enabled) return false;
      if (!sub.categories.includes(notification.category)) return false;
      if (getSeverityLevel(notification.severity) < getSeverityLevel(sub.minSeverity)) return false;
      return true;
    });

    // Send to all matching channels
    const promises = matchingSubs.map((sub) =>
      this.sendToChannel(sub.platform, sub.channelId, notification).catch((err) => {
        console.error(`[BOT] Failed to send to ${sub.platform}/${sub.channelId}:`, err);
      })
    );

    await Promise.all(promises);
    this.incrementNotificationCount();
  }

  /**
   * Send notification to a specific channel
   */
  async sendToChannel(
    platform: "slack" | "discord",
    channelId: string,
    notification: Notification
  ): Promise<void> {
    if (platform === "slack" && this.slackBot) {
      await this.slackBot.sendNotification(notification, channelId);
    } else if (platform === "discord" && this.discordBot) {
      await this.discordBot.sendNotification(notification, channelId);
    } else {
      throw new Error(`Bot not initialized for platform: ${platform}`);
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDM(
    platform: "slack" | "discord",
    userId: string,
    notification: Notification
  ): Promise<void> {
    if (platform === "slack" && this.slackBot) {
      await this.slackBot.sendDirectMessage(userId, notification);
    } else if (platform === "discord" && this.discordBot) {
      await this.discordBot.sendDirectMessage(userId, notification);
    } else {
      throw new Error(`Bot not initialized for platform: ${platform}`);
    }
  }

  // ===========================================================================
  // RATE LIMITING
  // ===========================================================================

  private checkRateLimits(): boolean {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    // Reset counters if in new period
    if (currentMinute !== this.notificationCount.lastMinute) {
      this.notificationCount.minute = 0;
      this.notificationCount.lastMinute = currentMinute;
    }
    if (currentHour !== this.notificationCount.lastHour) {
      this.notificationCount.hour = 0;
      this.notificationCount.lastHour = currentHour;
    }

    // Check limits
    if (this.notificationCount.minute >= this.config.maxNotificationsPerMinute) {
      return false;
    }
    if (this.notificationCount.hour >= this.config.maxNotificationsPerHour) {
      return false;
    }

    return true;
  }

  private incrementNotificationCount(): void {
    this.notificationCount.minute++;
    this.notificationCount.hour++;
  }

  // ===========================================================================
  // QUEUE
  // ===========================================================================

  private queueNotificationForAllSubscribers(notification: Notification): void {
    const matchingSubs = Array.from(this.subscriptions.values()).filter((sub) => {
      if (!sub.enabled) return false;
      if (!sub.categories.includes(notification.category)) return false;
      return getSeverityLevel(notification.severity) >= getSeverityLevel(sub.minSeverity);
    });

    for (const sub of matchingSubs) {
      if (this.notificationQueue.length < this.config.maxQueueSize) {
        this.notificationQueue.push({
          notification,
          channelId: sub.channelId,
          platform: sub.platform,
        });
      }
    }
  }

  private async processQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;
    if (!this.checkRateLimits()) return;

    const item = this.notificationQueue.shift();
    if (!item) return;

    try {
      await this.sendToChannel(item.platform, item.channelId, item.notification);
      this.incrementNotificationCount();
    } catch (error) {
      // Re-queue with retry limit
      console.error("[BOT] Queue processing failed:", error);
    }
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  /**
   * Get bot statuses
   */
  getStatus(): { slack: BotStatus | null; discord: BotStatus | null } {
    return {
      slack: this.slackBot?.getStatus() || null,
      discord: this.discordBot?.getStatus() || null,
    };
  }

  /**
   * Get Slack bot instance
   */
  getSlackBot(): SlackBot | null {
    return this.slackBot;
  }

  /**
   * Get Discord bot instance
   */
  getDiscordBot(): DiscordBot | null {
    return this.discordBot;
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Disconnect all bots
   */
  async disconnect(): Promise<void> {
    this.stopQueueProcessor();

    if (this.slackBot) {
      await this.slackBot.disconnect();
    }
    if (this.discordBot) {
      await this.discordBot.disconnect();
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSeverityLevel(severity: NotificationSeverity): number {
  switch (severity) {
    case "info":
      return 0;
    case "success":
      return 1;
    case "warning":
      return 2;
    case "error":
      return 3;
    case "critical":
      return 4;
    default:
      return 0;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: BotManager | null = null;

export function getBotManager(config?: Partial<BotManagerConfig>): BotManager {
  if (!instance) {
    instance = new BotManager(config);
  }
  return instance;
}

export function createBotManager(config?: Partial<BotManagerConfig>): BotManager {
  return new BotManager(config);
}
