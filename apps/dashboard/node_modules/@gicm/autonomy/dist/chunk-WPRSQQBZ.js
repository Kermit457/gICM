import {
  ESCALATION_RULES,
  RATE_LIMITS,
  URGENCY_PRIORITY
} from "./chunk-TENKIGAJ.js";
import {
  Logger
} from "./chunk-ZB2ZVSPL.js";

// src/approval/approval-queue.ts
import { EventEmitter } from "eventemitter3";
var ApprovalQueue = class extends EventEmitter {
  logger;
  queue;
  maxPendingItems;
  autoExpireHours;
  expirationTimer = null;
  requestCount = 0;
  constructor(config = {}) {
    super();
    this.logger = new Logger("ApprovalQueue");
    this.queue = /* @__PURE__ */ new Map();
    this.maxPendingItems = config.maxPendingItems ?? 50;
    this.autoExpireHours = config.autoExpireHours ?? 24;
    this.startExpirationChecker();
  }
  /**
   * Add a decision to the approval queue
   */
  add(decision) {
    this.requestCount++;
    const request = {
      id: `apr_${Date.now()}_${this.requestCount}`,
      decision,
      priority: this.calculatePriority(decision),
      urgency: decision.action.metadata.urgency,
      expiresAt: Date.now() + this.autoExpireHours * 60 * 60 * 1e3,
      notificationsSent: [],
      status: "pending",
      createdAt: Date.now()
    };
    if (this.queue.size >= this.maxPendingItems) {
      this.removeLowestPriority();
    }
    this.queue.set(request.id, request);
    this.logger.info(`Added to queue: ${decision.action.type}`, {
      requestId: request.id,
      priority: request.priority,
      urgency: request.urgency
    });
    this.emit("item:added", request);
    this.emit("queue:changed", this.queue.size);
    return request;
  }
  /**
   * Approve a request
   */
  approve(requestId, approvedBy = "human", feedback) {
    const request = this.queue.get(requestId);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return null;
    }
    request.status = "approved";
    request.reviewedBy = approvedBy;
    request.reviewedAt = Date.now();
    request.feedback = feedback;
    request.decision.approvedBy = approvedBy;
    request.decision.approvedAt = Date.now();
    request.decision.outcome = "auto_execute";
    this.queue.delete(requestId);
    this.logger.info(`Approved: ${request.decision.action.type}`, {
      requestId,
      approvedBy
    });
    this.emit("item:approved", request, approvedBy);
    this.emit("queue:changed", this.queue.size);
    return request;
  }
  /**
   * Reject a request
   */
  reject(requestId, reason, rejectedBy = "human") {
    const request = this.queue.get(requestId);
    if (!request) {
      this.logger.warn(`Request not found: ${requestId}`);
      return null;
    }
    request.status = "rejected";
    request.reviewedBy = rejectedBy;
    request.reviewedAt = Date.now();
    request.feedback = reason;
    request.decision.outcome = "reject";
    this.queue.delete(requestId);
    this.logger.info(`Rejected: ${request.decision.action.type}`, {
      requestId,
      reason
    });
    this.emit("item:rejected", request, reason);
    this.emit("queue:changed", this.queue.size);
    return request;
  }
  /**
   * Get a request by ID
   */
  get(requestId) {
    return this.queue.get(requestId);
  }
  /**
   * Get all pending requests, sorted by priority
   */
  getPending() {
    return Array.from(this.queue.values()).filter((r) => r.status === "pending").sort((a, b) => b.priority - a.priority);
  }
  /**
   * Get pending requests by urgency
   */
  getByUrgency(urgency) {
    return this.getPending().filter((r) => r.urgency === urgency);
  }
  /**
   * Get queue statistics
   */
  getStats() {
    const pending = this.getPending();
    const byUrgency = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0
    };
    let totalAge = 0;
    const now = Date.now();
    for (const request of pending) {
      byUrgency[request.urgency]++;
      totalAge += now - request.createdAt;
    }
    const oldestAge = pending.length > 0 ? now - pending[pending.length - 1].createdAt : 0;
    const avgWaitTime = pending.length > 0 ? totalAge / pending.length : 0;
    return {
      total: this.queue.size,
      pending: pending.length,
      byUrgency,
      oldestAge,
      avgWaitTime
    };
  }
  /**
   * Check for items that need escalation
   */
  checkEscalations() {
    const escalated = [];
    const now = Date.now();
    for (const request of this.queue.values()) {
      if (request.status !== "pending") continue;
      const ageHours = (now - request.createdAt) / (60 * 60 * 1e3);
      if (ageHours >= ESCALATION_RULES.ageHoursBeforeEscalation) {
        if (!request.notificationsSent.includes("escalation")) {
          request.notificationsSent.push("escalation");
          escalated.push(request);
          this.emit("item:escalated", request);
        }
      }
      if (ageHours >= ESCALATION_RULES.ageHoursBeforeAutoReject) {
        this.reject(request.id, "Auto-rejected due to age");
      }
      if (ESCALATION_RULES.criticalRiskAutoEscalate && request.decision.assessment.level === "critical") {
        if (!request.notificationsSent.includes("critical_escalation")) {
          request.notificationsSent.push("critical_escalation");
          escalated.push(request);
          this.emit("item:escalated", request);
        }
      }
    }
    return escalated;
  }
  /**
   * Mark notification as sent
   */
  markNotificationSent(requestId, channel) {
    const request = this.queue.get(requestId);
    if (request && !request.notificationsSent.includes(channel)) {
      request.notificationsSent.push(channel);
    }
  }
  /**
   * Get count of pending items
   */
  get size() {
    return this.getPending().length;
  }
  /**
   * Clear all pending items
   */
  clear() {
    this.queue.clear();
    this.emit("queue:changed", 0);
  }
  /**
   * Stop the queue (cleanup)
   */
  stop() {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
  }
  // Private methods
  calculatePriority(decision) {
    const urgencyScore = URGENCY_PRIORITY[decision.action.metadata.urgency] ?? 1;
    const riskScore = this.riskLevelToScore(decision.assessment.level);
    const valueScore = Math.min(
      (decision.action.metadata.estimatedValue ?? 0) / 10,
      10
    );
    return urgencyScore * 10 + riskScore + valueScore;
  }
  riskLevelToScore(level) {
    const scores = {
      safe: 1,
      low: 2,
      medium: 5,
      high: 8,
      critical: 10
    };
    return scores[level] ?? 5;
  }
  removeLowestPriority() {
    const pending = this.getPending();
    if (pending.length === 0) return;
    const lowest = pending[pending.length - 1];
    this.queue.delete(lowest.id);
    this.emit("item:expired", lowest);
    this.logger.info(`Removed lowest priority item: ${lowest.id}`);
  }
  startExpirationChecker() {
    this.expirationTimer = setInterval(() => {
      this.checkExpirations();
      this.checkEscalations();
    }, 60 * 60 * 1e3);
  }
  checkExpirations() {
    const now = Date.now();
    const expired = [];
    for (const [id, request] of this.queue) {
      if (request.status === "pending" && request.expiresAt < now) {
        expired.push(id);
        request.status = "expired";
        this.emit("item:expired", request);
      }
    }
    for (const id of expired) {
      this.queue.delete(id);
    }
    if (expired.length > 0) {
      this.logger.info(`Expired ${expired.length} items`);
      this.emit("queue:changed", this.queue.size);
    }
  }
};

// src/approval/notification-manager.ts
var NotificationManager = class {
  logger;
  channels;
  rateLimitPerMinute;
  messageCount = 0;
  lastResetTime = Date.now();
  constructor(config) {
    this.logger = new Logger("NotificationManager");
    this.channels = config.channels;
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? RATE_LIMITS.maxNotificationsPerMinute;
  }
  /**
   * Notify about a new approval request
   */
  async notifyApprovalNeeded(request) {
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
  async notifyEscalation(request) {
    if (!this.checkRateLimit()) return false;
    const message = this.formatEscalation(request);
    return this.sendToAllChannels(message, "ESCALATION");
  }
  /**
   * Notify about approval decision
   */
  async notifyApprovalDecision(request, approved, reason) {
    if (!this.checkRateLimit()) return false;
    const status = approved ? "Approved" : "Rejected";
    const message = this.formatDecision(request, status, reason);
    return this.sendToAllChannels(message, status);
  }
  /**
   * Send daily summary
   */
  async sendDailySummary(summary) {
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
  isConfigured() {
    return this.channels.some((c) => c.enabled);
  }
  /**
   * Get enabled channels
   */
  getEnabledChannels() {
    return this.channels.filter((c) => c.enabled);
  }
  // Private methods
  async sendToAllChannels(message, title) {
    let success = false;
    for (const channel of this.channels) {
      if (!channel.enabled) continue;
      try {
        switch (channel.type) {
          case "discord":
            success = await this.sendDiscord(channel, message, title) || success;
            break;
          case "telegram":
            success = await this.sendTelegram(channel, message, title) || success;
            break;
          case "slack":
            success = await this.sendSlack(channel, message, title) || success;
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send to ${channel.type}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return success;
  }
  async sendDiscord(channel, message, title) {
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
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              footer: { text: "gICM Autonomy" }
            }
          ]
        })
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
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  async sendTelegram(channel, message, title) {
    const { botToken, chatId } = channel.config;
    if (!botToken || !chatId) return false;
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `*${title}*

${message}`,
          parse_mode: "Markdown"
        })
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
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  async sendSlack(channel, message, title) {
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
              text: { type: "plain_text", text: title }
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: message }
            }
          ]
        })
      });
      return response.ok;
    } catch (error) {
      this.logger.error("Slack send error", {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  formatApprovalRequest(request) {
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
  formatEscalation(request) {
    const action = request.decision.action;
    const ageMinutes = Math.round(
      (Date.now() - request.createdAt) / (60 * 1e3)
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
  formatDecision(request, status, reason) {
    const action = request.decision.action;
    return `
**${status}: ${action.type}**

${action.description}

${reason ? `Reason: ${reason}` : ""}
Reviewed by: ${request.reviewedBy}
    `.trim();
  }
  getRiskEmoji(level) {
    const emojis = {
      safe: "\u{1F7E2}",
      low: "\u{1F7E2}",
      medium: "\u{1F7E1}",
      high: "\u{1F7E0}",
      critical: "\u{1F534}"
    };
    return emojis[level] ?? "\u26AA";
  }
  getTitleColor(title) {
    if (title.includes("ESCALATION")) return 16711680;
    if (title.includes("Rejected")) return 16739179;
    if (title.includes("Approved")) return 65280;
    if (title.includes("Summary")) return 39423;
    return 16755200;
  }
  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastResetTime > 6e4) {
      this.messageCount = 0;
      this.lastResetTime = now;
    }
    if (this.messageCount >= this.rateLimitPerMinute) {
      return false;
    }
    this.messageCount++;
    return true;
  }
};

// src/approval/batch-approval.ts
var BatchApproval = class {
  logger;
  queue;
  constructor(queue) {
    this.logger = new Logger("BatchApproval");
    this.queue = queue;
  }
  /**
   * Get summary of all pending items
   */
  getSummary() {
    const pending = this.queue.getPending();
    const now = Date.now();
    const byCategory = {
      trading: 0,
      content: 0,
      build: 0,
      deployment: 0,
      configuration: 0
    };
    const byRisk = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    const byEngine = {};
    let totalValue = 0;
    let totalScore = 0;
    let oldestAge = 0;
    for (const request of pending) {
      const action = request.decision.action;
      const assessment = request.decision.assessment;
      byCategory[action.category]++;
      byRisk[assessment.level]++;
      byEngine[action.engine] = (byEngine[action.engine] ?? 0) + 1;
      totalValue += action.metadata.estimatedValue ?? 0;
      totalScore += assessment.score;
      const age = now - request.createdAt;
      if (age > oldestAge) oldestAge = age;
    }
    return {
      total: pending.length,
      byCategory,
      byRisk,
      byEngine,
      totalValue,
      oldestAge,
      avgScore: pending.length > 0 ? totalScore / pending.length : 0
    };
  }
  /**
   * Get items matching a filter
   */
  filter(filter) {
    const pending = this.queue.getPending();
    const now = Date.now();
    return pending.filter((request) => {
      const action = request.decision.action;
      const assessment = request.decision.assessment;
      if (filter.category && action.category !== filter.category) return false;
      if (filter.riskLevel && assessment.level !== filter.riskLevel) return false;
      if (filter.engine && action.engine !== filter.engine) return false;
      if (filter.minScore && assessment.score < filter.minScore) return false;
      if (filter.maxScore && assessment.score > filter.maxScore) return false;
      if (filter.olderThanHours) {
        const ageHours = (now - request.createdAt) / (60 * 60 * 1e3);
        if (ageHours < filter.olderThanHours) return false;
      }
      return true;
    });
  }
  /**
   * Approve all items matching a filter
   */
  approveFiltered(filter, approvedBy = "batch", feedback) {
    const items = this.filter(filter);
    const approved = [];
    const failed = [];
    for (const item of items) {
      const result = this.queue.approve(item.id, approvedBy, feedback);
      if (result) {
        approved.push(result);
      } else {
        failed.push(item.id);
      }
    }
    this.logger.info(`Batch approved ${approved.length} items`, {
      filter,
      failed: failed.length
    });
    return { approved, failed };
  }
  /**
   * Reject all items matching a filter
   */
  rejectFiltered(filter, reason, rejectedBy = "batch") {
    const items = this.filter(filter);
    const rejected = [];
    const failed = [];
    for (const item of items) {
      const result = this.queue.reject(item.id, reason, rejectedBy);
      if (result) {
        rejected.push(result);
      } else {
        failed.push(item.id);
      }
    }
    this.logger.info(`Batch rejected ${rejected.length} items`, {
      filter,
      reason,
      failed: failed.length
    });
    return { rejected, failed };
  }
  /**
   * Approve all safe/low risk items
   */
  approveAllSafe(approvedBy = "batch") {
    const safeItems = this.filter({ riskLevel: "safe" });
    const lowItems = this.filter({ riskLevel: "low" });
    const approved = [];
    for (const item of [...safeItems, ...lowItems]) {
      const result = this.queue.approve(item.id, approvedBy, "Auto-approved (low risk)");
      if (result) approved.push(result);
    }
    this.logger.info(`Auto-approved ${approved.length} safe/low risk items`);
    return { approved };
  }
  /**
   * Reject all expired or very old items
   */
  cleanupOld(olderThanHours = 48) {
    const oldItems = this.filter({ olderThanHours });
    const rejected = [];
    for (const item of oldItems) {
      const result = this.queue.reject(item.id, `Auto-rejected: older than ${olderThanHours}h`);
      if (result) rejected.push(result);
    }
    this.logger.info(`Cleaned up ${rejected.length} old items`);
    return { rejected };
  }
  /**
   * Get items grouped by category
   */
  groupByCategory() {
    const pending = this.queue.getPending();
    const grouped = {
      trading: [],
      content: [],
      build: [],
      deployment: [],
      configuration: []
    };
    for (const request of pending) {
      grouped[request.decision.action.category].push(request);
    }
    return grouped;
  }
  /**
   * Get items grouped by risk level
   */
  groupByRisk() {
    const pending = this.queue.getPending();
    const grouped = {
      safe: [],
      low: [],
      medium: [],
      high: [],
      critical: []
    };
    for (const request of pending) {
      grouped[request.decision.assessment.level].push(request);
    }
    return grouped;
  }
  /**
   * Get quick actions for common batch operations
   */
  getQuickActions() {
    return {
      approveSafe: () => this.approveAllSafe(),
      cleanupOld: () => this.cleanupOld(),
      approveAll: (by) => this.approveFiltered({}, by),
      rejectAll: (reason) => this.rejectFiltered({}, reason)
    };
  }
};

export {
  ApprovalQueue,
  NotificationManager,
  BatchApproval
};
//# sourceMappingURL=chunk-WPRSQQBZ.js.map