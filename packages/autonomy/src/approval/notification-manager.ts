/**
 * Notification Manager for Level 2 Autonomy
 *
 * Sends alerts to Discord/Telegram for:
 * - New approval requests
 * - Escalations
 * - Daily summaries
 */

import type {
  ApprovalRequest,
  Decision,
  NotificationChannel,
  RiskLevel,
} from "../core/types.js";
import { RATE_LIMITS } from "../core/constants.js";
import { Logger } from "../utils/logger.js";

export interface NotificationManagerConfig {
  channels: NotificationChannel[];
  rateLimitPerMinute?: number;
}

export class NotificationManager {
  private logger: Logger;
  private channels: NotificationChannel[];
  private rateLimitPerMinute: number;
  private messageCount = 0;
  private lastResetTime = Date.now();

  constructor(config: NotificationManagerConfig) {
    this.logger = new Logger("NotificationManager");
    this.channels = config.channels;
    this.rateLimitPerMinute =
      config.rateLimitPerMinute ?? RATE_LIMITS.maxNotificationsPerMinute;
  }

  /**
   * Notify about a new approval request
   */
  async notifyApprovalNeeded(request: ApprovalRequest): Promise<boolean> {
    if (!this.checkRateLimit()) {
      this.logger.warn("Rate limit exceeded for notifications");
      return false;
    }

    const message = this.formatApprovalRequest(request);
    return this.sendToAllChannels(message, "Approval Required");
  }

  /**
   * Notify about an escalation
   */
  async notifyEscalation(request: ApprovalRequest): Promise<boolean> {
    if (!this.checkRateLimit()) return false;

    const message = this.formatEscalation(request);
    return this.sendToAllChannels(message, "ESCALATION");
  }

  /**
   * Notify about approval decision
   */
  async notifyApprovalDecision(
    request: ApprovalRequest,
    approved: boolean,
    reason?: string
  ): Promise<boolean> {
    if (!this.checkRateLimit()) return false;

    const status = approved ? "Approved" : "Rejected";
    const message = this.formatDecision(request, status, reason);
    return this.sendToAllChannels(message, status);
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(summary: {
    autoExecuted: number;
    queued: number;
    approved: number;
    rejected: number;
    escalated: number;
    totalValue: number;
  }): Promise<boolean> {
    const message = `
**Daily Autonomy Summary**

Auto-executed: ${summary.autoExecuted}
Queued: ${summary.queued}
Approved: ${summary.approved}
Rejected: ${summary.rejected}
Escalated: ${summary.escalated}

Total value processed: $${summary.totalValue.toFixed(2)}
    `.trim();

    return this.sendToAllChannels(message, "Daily Summary");
  }

  /**
   * Check if notifications are configured
   */
  isConfigured(): boolean {
    return this.channels.some((c) => c.enabled);
  }

  /**
   * Get enabled channels
   */
  getEnabledChannels(): NotificationChannel[] {
    return this.channels.filter((c) => c.enabled);
  }

  // Private methods

  private async sendToAllChannels(
    message: string,
    title: string
  ): Promise<boolean> {
    let success = false;

    for (const channel of this.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case "discord":
            success = (await this.sendDiscord(channel, message, title)) || success;
            break;
          case "telegram":
            success = (await this.sendTelegram(channel, message, title)) || success;
            break;
          case "slack":
            success = (await this.sendSlack(channel, message, title)) || success;
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send to ${channel.type}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return success;
  }

  private async sendDiscord(
    channel: NotificationChannel,
    message: string,
    title: string
  ): Promise<boolean> {
    const webhookUrl = channel.config.webhookUrl;
    if (!webhookUrl) return false;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title,
              description: message,
              color: this.getTitleColor(title),
              timestamp: new Date().toISOString(),
              footer: { text: "gICM Autonomy" },
            },
          ],
        }),
      });

      if (response.ok) {
        this.logger.debug(`Discord notification sent: ${title}`);
        return true;
      } else {
        this.logger.warn(`Discord notification failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error("Discord send error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private async sendTelegram(
    channel: NotificationChannel,
    message: string,
    title: string
  ): Promise<boolean> {
    const { botToken, chatId } = channel.config;
    if (!botToken || !chatId) return false;

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `*${title}*\n\n${message}`,
          parse_mode: "Markdown",
        }),
      });

      if (response.ok) {
        this.logger.debug(`Telegram notification sent: ${title}`);
        return true;
      } else {
        this.logger.warn(`Telegram notification failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logger.error("Telegram send error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private async sendSlack(
    channel: NotificationChannel,
    message: string,
    title: string
  ): Promise<boolean> {
    const webhookUrl = channel.config.webhookUrl;
    if (!webhookUrl) return false;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: title },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: message },
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error("Slack send error", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private formatApprovalRequest(request: ApprovalRequest): string {
    const action = request.decision.action;
    const assessment = request.decision.assessment;

    return `
**${action.description}**

Action: \`${action.type}\`
Engine: ${action.engine}
Category: ${action.category}

Risk: ${this.getRiskEmoji(assessment.level)} ${assessment.level.toUpperCase()} (${assessment.score}/100)
Value: ${action.metadata.estimatedValue ? `$${action.metadata.estimatedValue}` : "N/A"}
Reversible: ${action.metadata.reversible ? "Yes" : "No"}

ID: \`${request.id}\`
Expires: ${new Date(request.expiresAt).toLocaleString()}

\`gicm-autonomy approve ${request.id}\`
    `.trim();
  }

  private formatEscalation(request: ApprovalRequest): string {
    const action = request.decision.action;
    const ageMinutes = Math.round(
      (Date.now() - request.createdAt) / (60 * 1000)
    );

    return `
**REQUIRES IMMEDIATE ATTENTION**

${action.description}

Action: \`${action.type}\`
Risk: ${request.decision.assessment.level.toUpperCase()}
Waiting: ${ageMinutes} minutes

ID: \`${request.id}\`

\`gicm-autonomy approve ${request.id}\`
    `.trim();
  }

  private formatDecision(
    request: ApprovalRequest,
    status: string,
    reason?: string
  ): string {
    const action = request.decision.action;

    return `
**${status}: ${action.type}**

${action.description}

${reason ? `Reason: ${reason}` : ""}
Reviewed by: ${request.reviewedBy}
    `.trim();
  }

  private getRiskEmoji(level: RiskLevel): string {
    const emojis: Record<RiskLevel, string> = {
      safe: "🟢",
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      critical: "🔴",
    };
    return emojis[level] ?? "⚪";
  }

  private getTitleColor(title: string): number {
    if (title.includes("ESCALATION")) return 0xff0000; // Red
    if (title.includes("Rejected")) return 0xff6b6b; // Light red
    if (title.includes("Approved")) return 0x00ff00; // Green
    if (title.includes("Summary")) return 0x0099ff; // Blue
    return 0xffaa00; // Orange (default for approvals)
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.messageCount = 0;
      this.lastResetTime = now;
    }

    if (this.messageCount >= this.rateLimitPerMinute) {
      return false;
    }

    this.messageCount++;
    return true;
  }
}
