/**
 * Discord Announcer
 *
 * Automated announcements for gICM Discord.
 */

import { CronJob } from "cron";
import type { BlogPost } from "../../core/types.js";
import { DiscordClient } from "./client.js";
import { Logger } from "../../utils/logger.js";

export interface AnnouncerConfig {
  autoAnnounce: boolean;
  dailyTipEnabled: boolean;
  dailyTipTime: string; // Cron format
}

const DEFAULT_CONFIG: AnnouncerConfig = {
  autoAnnounce: true,
  dailyTipEnabled: true,
  dailyTipTime: "0 14 * * *", // 2 PM UTC daily
};

export class DiscordAnnouncer {
  private logger: Logger;
  private client: DiscordClient;
  private config: AnnouncerConfig;
  private dailyTipCron?: CronJob;

  constructor(client: DiscordClient, config: Partial<AnnouncerConfig> = {}) {
    this.logger = new Logger("DiscordAnnouncer");
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start announcer
   */
  start(): void {
    if (this.config.dailyTipEnabled) {
      this.dailyTipCron = new CronJob(this.config.dailyTipTime, async () => {
        await this.postDailyTip();
      });
      this.dailyTipCron.start();
      this.logger.info("Daily tip cron started");
    }

    this.logger.info("Discord announcer started");
  }

  /**
   * Stop announcer
   */
  stop(): void {
    if (this.dailyTipCron) {
      this.dailyTipCron.stop();
    }
    this.logger.info("Discord announcer stopped");
  }

  /**
   * Announce new blog post
   */
  async announceBlogPost(post: BlogPost): Promise<void> {
    if (!this.config.autoAnnounce) return;

    await this.client.shareContent({
      title: post.title,
      description: post.excerpt,
      url: `https://gicm.dev/blog/${post.slug}`,
      type: "blog",
      tags: post.tags.slice(0, 5),
    });
  }

  /**
   * Announce new feature
   */
  async announceFeature(feature: {
    name: string;
    description: string;
    url?: string;
  }): Promise<void> {
    await this.client.announce({
      title: `✨ New Feature: ${feature.name}`,
      description: feature.description,
      url: feature.url,
      color: 0x00ff88,
    });
  }

  /**
   * Announce new agent
   */
  async announceAgent(agent: {
    name: string;
    description: string;
    capabilities: string[];
  }): Promise<void> {
    await this.client.announce({
      title: `🤖 New Agent: ${agent.name}`,
      description: agent.description,
      color: 0x5865f2,
      fields: [
        {
          name: "Capabilities",
          value: agent.capabilities.map((c) => `• ${c}`).join("\n"),
        },
      ],
    });
  }

  /**
   * Announce new component
   */
  async announceComponent(component: {
    name: string;
    description: string;
    category: string;
  }): Promise<void> {
    await this.client.announce({
      title: `🧩 New Component: ${component.name}`,
      description: component.description,
      color: 0xffaa00,
      fields: [{ name: "Category", value: component.category, inline: true }],
    });
  }

  /**
   * Post daily tip
   */
  private async postDailyTip(): Promise<void> {
    const tips = [
      {
        title: "Use Claude Code for faster development",
        description: "gICM integrates with Claude Code to give you AI-powered development superpowers.",
      },
      {
        title: "Check out our component library",
        description: "Over 100+ React components ready to use in your Web3 projects.",
      },
      {
        title: "Try our AI agents",
        description: "Let AI handle the heavy lifting - trading, research, content generation, and more.",
      },
      {
        title: "Join the community",
        description: "Ask questions, share your projects, and connect with other builders.",
      },
      {
        title: "Contribute to gICM",
        description: "gICM is open source! Check out our GitHub and submit your first PR.",
      },
    ];

    const tip = tips[Math.floor(Math.random() * tips.length)];

    await this.client.shareContent({
      title: tip.title,
      description: tip.description,
      url: "https://gicm.dev",
      type: "tip",
    });
  }

  /**
   * Announce version update
   */
  async announceUpdate(version: string, changes: string[]): Promise<void> {
    await this.client.announce({
      title: `🚀 gICM v${version} Released!`,
      description: "Check out what's new in this release.",
      color: 0x00d4aa,
      fields: [
        {
          name: "Changes",
          value: changes.map((c) => `• ${c}`).join("\n"),
        },
      ],
    });
  }
}
