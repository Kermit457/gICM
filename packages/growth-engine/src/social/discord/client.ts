/**
 * Discord Client
 *
 * Discord.js wrapper for gICM Growth Engine.
 */

import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, type Message } from "discord.js";
import { Logger } from "../../utils/logger.js";

export interface DiscordConfig {
  token: string;
  guildId: string;
  announcementChannelId: string;
  contentChannelId: string;
  feedbackChannelId?: string;
}

export class DiscordClient {
  private client: Client;
  private logger: Logger;
  private config: DiscordConfig;
  private ready: boolean = false;

  constructor(config?: Partial<DiscordConfig>) {
    this.logger = new Logger("DiscordClient");

    this.config = {
      token: config?.token || process.env.DISCORD_BOT_TOKEN!,
      guildId: config?.guildId || process.env.DISCORD_GUILD_ID!,
      announcementChannelId: config?.announcementChannelId || process.env.DISCORD_ANNOUNCEMENT_CHANNEL!,
      contentChannelId: config?.contentChannelId || process.env.DISCORD_CONTENT_CHANNEL!,
      feedbackChannelId: config?.feedbackChannelId || process.env.DISCORD_FEEDBACK_CHANNEL,
    };

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.client.on("ready", () => {
      this.ready = true;
      this.logger.info(`Discord bot ready as ${this.client.user?.tag}`);
    });

    this.client.on("error", (error) => {
      this.logger.error(`Discord error: ${error.message}`);
    });
  }

  /**
   * Connect to Discord
   */
  async connect(): Promise<void> {
    if (!this.config.token) {
      this.logger.warn("No Discord token provided, skipping connection");
      return;
    }

    try {
      await this.client.login(this.config.token);
      this.logger.info("Connected to Discord");
    } catch (error) {
      this.logger.error(`Failed to connect: ${error}`);
      throw error;
    }
  }

  /**
   * Disconnect from Discord
   */
  async disconnect(): Promise<void> {
    await this.client.destroy();
    this.ready = false;
    this.logger.info("Disconnected from Discord");
  }

  /**
   * Send announcement
   */
  async announce(content: {
    title: string;
    description: string;
    url?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }): Promise<Message | null> {
    if (!this.ready) {
      this.logger.warn("Discord not ready, skipping announcement");
      return null;
    }

    try {
      const channel = await this.client.channels.fetch(this.config.announcementChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.error("Announcement channel not found");
        return null;
      }

      const embed = new EmbedBuilder()
        .setTitle(content.title)
        .setDescription(content.description)
        .setColor(content.color || 0x5865f2)
        .setTimestamp();

      if (content.url) {
        embed.setURL(content.url);
      }

      if (content.fields) {
        embed.addFields(content.fields);
      }

      const message = await channel.send({ embeds: [embed] });
      this.logger.info(`Sent announcement: ${content.title}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send announcement: ${error}`);
      return null;
    }
  }

  /**
   * Share content (blog post, update, etc.)
   */
  async shareContent(content: {
    title: string;
    description: string;
    url: string;
    type: "blog" | "update" | "feature" | "tip";
    tags?: string[];
  }): Promise<Message | null> {
    if (!this.ready) return null;

    try {
      const channel = await this.client.channels.fetch(this.config.contentChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.error("Content channel not found");
        return null;
      }

      const typeEmoji = {
        blog: "📝",
        update: "🚀",
        feature: "✨",
        tip: "💡",
      };

      const embed = new EmbedBuilder()
        .setTitle(`${typeEmoji[content.type]} ${content.title}`)
        .setDescription(content.description)
        .setURL(content.url)
        .setColor(0x00d4aa)
        .setTimestamp();

      if (content.tags?.length) {
        embed.setFooter({ text: content.tags.map((t) => `#${t}`).join(" ") });
      }

      const message = await channel.send({ embeds: [embed] });
      this.logger.info(`Shared content: ${content.title}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to share content: ${error}`);
      return null;
    }
  }

  /**
   * Send simple message
   */
  async sendMessage(channelId: string, content: string): Promise<Message | null> {
    if (!this.ready) return null;

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        return null;
      }

      return await channel.send(content);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      return null;
    }
  }

  /**
   * Get feedback from feedback channel
   */
  async getRecentFeedback(limit: number = 50): Promise<
    Array<{
      id: string;
      content: string;
      author: string;
      timestamp: Date;
    }>
  > {
    if (!this.ready || !this.config.feedbackChannelId) return [];

    try {
      const channel = await this.client.channels.fetch(this.config.feedbackChannelId);
      if (!channel || !(channel instanceof TextChannel)) {
        return [];
      }

      const messages = await channel.messages.fetch({ limit });

      return messages.map((m) => ({
        id: m.id,
        content: m.content,
        author: m.author.username,
        timestamp: m.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch feedback: ${error}`);
      return [];
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Get guild member count
   */
  async getMemberCount(): Promise<number> {
    if (!this.ready) return 0;

    try {
      const guild = await this.client.guilds.fetch(this.config.guildId);
      return guild.memberCount;
    } catch {
      return 0;
    }
  }
}
