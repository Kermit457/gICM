/**
 * Discord Module
 *
 * Discord integration for gICM Growth Engine.
 */

import { DiscordClient, type DiscordConfig } from "./client.js";
import { DiscordAnnouncer, type AnnouncerConfig } from "./announcer.js";
import type { BlogPost } from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

export interface DiscordManagerConfig {
  client: Partial<DiscordConfig>;
  announcer: Partial<AnnouncerConfig>;
}

export class DiscordManager {
  private logger: Logger;
  private client: DiscordClient;
  private announcer: DiscordAnnouncer;

  constructor(config: Partial<DiscordManagerConfig> = {}) {
    this.logger = new Logger("DiscordManager");
    this.client = new DiscordClient(config.client);
    this.announcer = new DiscordAnnouncer(this.client, config.announcer);
  }

  /**
   * Connect and start
   */
  async start(): Promise<void> {
    await this.client.connect();
    this.announcer.start();
    this.logger.info("Discord manager started");
  }

  /**
   * Stop and disconnect
   */
  async stop(): Promise<void> {
    this.announcer.stop();
    await this.client.disconnect();
    this.logger.info("Discord manager stopped");
  }

  /**
   * Announce blog post
   */
  async announceBlogPost(post: BlogPost): Promise<void> {
    await this.announcer.announceBlogPost(post);
  }

  /**
   * Announce new feature
   */
  async announceFeature(feature: { name: string; description: string; url?: string }): Promise<void> {
    await this.announcer.announceFeature(feature);
  }

  /**
   * Announce new agent
   */
  async announceAgent(agent: { name: string; description: string; capabilities: string[] }): Promise<void> {
    await this.announcer.announceAgent(agent);
  }

  /**
   * Announce new component
   */
  async announceComponent(component: { name: string; description: string; category: string }): Promise<void> {
    await this.announcer.announceComponent(component);
  }

  /**
   * Announce version update
   */
  async announceUpdate(version: string, changes: string[]): Promise<void> {
    await this.announcer.announceUpdate(version, changes);
  }

  /**
   * Get member count
   */
  async getMemberCount(): Promise<number> {
    return this.client.getMemberCount();
  }

  /**
   * Get recent feedback
   */
  async getRecentFeedback(limit?: number): Promise<
    Array<{ id: string; content: string; author: string; timestamp: Date }>
  > {
    return this.client.getRecentFeedback(limit);
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.client.isReady();
  }
}

export { DiscordClient, type DiscordConfig } from "./client.js";
export { DiscordAnnouncer, type AnnouncerConfig } from "./announcer.js";
