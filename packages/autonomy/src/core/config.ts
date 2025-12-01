/**
 * Default Configuration for Level 2 Autonomy
 */

import type { AutonomyConfig, Boundaries } from "./types.js";

export const DEFAULT_BOUNDARIES: Boundaries = {
  financial: {
    maxAutoExpense: 50,
    maxQueuedExpense: 200,
    maxDailySpend: 100,
    maxTradeSize: 500,
    maxDailyTradingLossPercent: 5,
    minTreasuryBalance: 1000,
  },
  content: {
    maxAutoPostsPerDay: 10,
    maxAutoBlogsPerWeek: 3,
    requireReviewForTopics: ["financial_advice", "controversial", "competitor_criticism"],
  },
  development: {
    maxAutoCommitLines: 100,
    maxAutoFilesChanged: 5,
    requireReviewForPaths: ["src/core/", "src/config/", ".env"],
    autoDeployToStaging: true,
    autoDeployToProduction: false,
  },
  trading: {
    allowedBots: ["dca"],
    allowedTokens: ["SOL", "USDC"],
    maxPositionPercent: 20,
    requireApprovalForNewTokens: true,
  },
  time: {
    activeHoursStart: 6,
    activeHoursEnd: 22,
    quietHoursStart: 23,
    quietHoursEnd: 6,
  },
};

export const DEFAULT_CONFIG: AutonomyConfig = {
  enabled: true,
  level: 2,
  boundaries: DEFAULT_BOUNDARIES,
  notifications: {
    channels: [],
    rateLimitPerMinute: 10,
  },
  approval: {
    maxPendingItems: 50,
    autoExpireHours: 24,
    notifyOnNewItem: true,
  },
  audit: {
    retentionDays: 90,
    storageDir: "./data/audit",
  },
};

/**
 * Create config with defaults merged with overrides
 */
export function createConfig(overrides?: Partial<AutonomyConfig>): AutonomyConfig {
  if (!overrides) return DEFAULT_CONFIG;

  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    boundaries: {
      ...DEFAULT_BOUNDARIES,
      ...overrides.boundaries,
      financial: {
        ...DEFAULT_BOUNDARIES.financial,
        ...overrides.boundaries?.financial,
      },
      content: {
        ...DEFAULT_BOUNDARIES.content,
        ...overrides.boundaries?.content,
      },
      development: {
        ...DEFAULT_BOUNDARIES.development,
        ...overrides.boundaries?.development,
      },
      trading: {
        ...DEFAULT_BOUNDARIES.trading,
        ...overrides.boundaries?.trading,
      },
      time: {
        ...DEFAULT_BOUNDARIES.time,
        ...overrides.boundaries?.time,
      },
    },
    notifications: {
      ...DEFAULT_CONFIG.notifications,
      ...overrides.notifications,
    },
    approval: {
      ...DEFAULT_CONFIG.approval,
      ...overrides.approval,
    },
    audit: {
      ...DEFAULT_CONFIG.audit,
      ...overrides.audit,
    },
  };
}

/**
 * Load config from environment variables
 */
export function loadConfigFromEnv(): Partial<AutonomyConfig> {
  const config: Partial<AutonomyConfig> = {};

  // Financial boundaries from env
  if (process.env.GICM_MAX_AUTO_EXPENSE) {
    config.boundaries = config.boundaries ?? {} as any;
    (config.boundaries as any).financial = (config.boundaries as any).financial ?? {};
    (config.boundaries as any).financial.maxAutoExpense = Number(process.env.GICM_MAX_AUTO_EXPENSE);
  }
  if (process.env.GICM_MAX_DAILY_SPEND) {
    config.boundaries = config.boundaries ?? {} as any;
    (config.boundaries as any).financial = (config.boundaries as any).financial ?? {};
    (config.boundaries as any).financial.maxDailySpend = Number(process.env.GICM_MAX_DAILY_SPEND);
  }
  if (process.env.GICM_MAX_TRADE_SIZE) {
    config.boundaries = config.boundaries ?? {} as any;
    (config.boundaries as any).financial = (config.boundaries as any).financial ?? {};
    (config.boundaries as any).financial.maxTradeSize = Number(process.env.GICM_MAX_TRADE_SIZE);
  }

  // Notification channels from env
  if (process.env.DISCORD_WEBHOOK_URL) {
    config.notifications = config.notifications ?? { channels: [], rateLimitPerMinute: 10 };
    config.notifications.channels.push({
      type: "discord",
      enabled: true,
      config: { webhookUrl: process.env.DISCORD_WEBHOOK_URL },
    });
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    config.notifications = config.notifications ?? { channels: [], rateLimitPerMinute: 10 };
    config.notifications.channels.push({
      type: "telegram",
      enabled: true,
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
      },
    });
  }

  return config;
}
