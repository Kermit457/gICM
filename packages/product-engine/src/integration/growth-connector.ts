/**
 * Growth Engine Connector
 *
 * Connects Product Engine to Growth Engine for automated promotion.
 * When new agents/components are built, they get announced on Discord & Twitter.
 */

import type { BuildTask, Opportunity } from "../core/types.js";
import { Logger } from "../utils/logger.js";

export interface GrowthConnectorConfig {
  enabled: boolean;
  autoAnnounce: boolean;
  discordWebhook?: string;
  growthEngineUrl?: string;
}

const DEFAULT_CONFIG: GrowthConnectorConfig = {
  enabled: true,
  autoAnnounce: true,
};

export interface AnnouncementPayload {
  type: "agent" | "component" | "feature" | "update";
  name: string;
  description: string;
  category?: string;
  capabilities?: string[];
  url?: string;
  version?: string;
  changes?: string[];
}

export class GrowthConnector {
  private logger: Logger;
  private config: GrowthConnectorConfig;
  private pendingAnnouncements: AnnouncementPayload[] = [];

  constructor(config: Partial<GrowthConnectorConfig> = {}) {
    this.logger = new Logger("GrowthConnector");
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Notify of a successful build
   */
  async notifyBuildComplete(task: BuildTask, opportunity: Opportunity): Promise<void> {
    if (!this.config.enabled || !this.config.autoAnnounce) {
      return;
    }

    const payload: AnnouncementPayload = {
      type: task.type as "agent" | "component",
      name: task.spec.name,
      description: task.spec.description,
      capabilities: task.spec.capabilities,
      category: opportunity.type,
    };

    await this.announce(payload);
  }

  /**
   * Queue an announcement
   */
  async announce(payload: AnnouncementPayload): Promise<void> {
    this.logger.info(`Announcing: ${payload.type} - ${payload.name}`);

    // If webhook configured, send directly
    if (this.config.discordWebhook) {
      await this.sendDiscordWebhook(payload);
    }

    // If Growth Engine URL configured, call API
    if (this.config.growthEngineUrl) {
      await this.callGrowthEngine(payload);
    }

    // Otherwise queue for later
    if (!this.config.discordWebhook && !this.config.growthEngineUrl) {
      this.pendingAnnouncements.push(payload);
      this.logger.info(`Queued announcement (${this.pendingAnnouncements.length} pending)`);
    }
  }

  /**
   * Send Discord webhook
   */
  private async sendDiscordWebhook(payload: AnnouncementPayload): Promise<void> {
    if (!this.config.discordWebhook) return;

    const embed = this.buildEmbed(payload);

    try {
      const response = await fetch(this.config.discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }

      this.logger.info("Discord webhook sent");
    } catch (error) {
      this.logger.error(`Discord webhook error: ${error}`);
    }
  }

  /**
   * Call Growth Engine API
   */
  private async callGrowthEngine(payload: AnnouncementPayload): Promise<void> {
    if (!this.config.growthEngineUrl) return;

    try {
      const endpoint = `${this.config.growthEngineUrl}/api/announce`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Growth Engine API failed: ${response.status}`);
      }

      this.logger.info("Growth Engine notified");
    } catch (error) {
      this.logger.error(`Growth Engine API error: ${error}`);
    }
  }

  /**
   * Build Discord embed
   */
  private buildEmbed(payload: AnnouncementPayload): object {
    const colors: Record<string, number> = {
      agent: 0x5865f2,
      component: 0xffaa00,
      feature: 0x00ff88,
      update: 0x00d4aa,
    };

    const icons: Record<string, string> = {
      agent: "🤖",
      component: "🧩",
      feature: "✨",
      update: "🚀",
    };

    const embed: Record<string, unknown> = {
      title: `${icons[payload.type]} New ${payload.type}: ${payload.name}`,
      description: payload.description,
      color: colors[payload.type] || 0x5865f2,
      timestamp: new Date().toISOString(),
      footer: { text: "gICM Product Engine" },
    };

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (payload.category) {
      fields.push({ name: "Category", value: payload.category, inline: true });
    }

    if (payload.capabilities && payload.capabilities.length > 0) {
      fields.push({
        name: "Capabilities",
        value: payload.capabilities.map((c) => `• ${c}`).join("\n"),
      });
    }

    if (payload.changes && payload.changes.length > 0) {
      fields.push({
        name: "Changes",
        value: payload.changes.map((c) => `• ${c}`).join("\n"),
      });
    }

    if (fields.length > 0) {
      embed.fields = fields;
    }

    if (payload.url) {
      embed.url = payload.url;
    }

    return embed;
  }

  /**
   * Get pending announcements
   */
  getPendingAnnouncements(): AnnouncementPayload[] {
    return [...this.pendingAnnouncements];
  }

  /**
   * Flush pending announcements
   */
  async flushPending(): Promise<void> {
    if (this.pendingAnnouncements.length === 0) return;

    this.logger.info(`Flushing ${this.pendingAnnouncements.length} announcements...`);

    for (const payload of this.pendingAnnouncements) {
      await this.announce(payload);
    }

    this.pendingAnnouncements = [];
  }
}
