/**
 * Cross-Engine Workflows
 *
 * Predefined workflows that coordinate multiple engines.
 */

import type { Workflow } from "../core/types.js";

/**
 * WORKFLOW: New Feature Announcement
 */
export const NEW_FEATURE_ANNOUNCEMENT: Workflow = {
  id: "wf-new-feature-announcement",
  name: "New Feature Announcement",
  description: "Automatically announce new features across all channels",

  trigger: {
    type: "event",
    eventType: "product.deployed",
    eventFilter: { type: "feature" },
  },

  steps: [
    {
      id: "step-1",
      name: "Generate Blog Post",
      engine: "growth",
      action: "generateBlogPost",
      params: { template: "announcement" },
      onError: "continue",
      timeout: 60000,
    },
    {
      id: "step-2",
      name: "Generate Tweets",
      engine: "growth",
      action: "generateTweets",
      params: { type: "product_update", count: 3 },
      onError: "continue",
      timeout: 30000,
    },
  ],

  status: "active",
  executions: 0,
  avgDuration: 0,
};

/**
 * WORKFLOW: Profitable Trade Report
 */
export const PROFITABLE_TRADE_REPORT: Workflow = {
  id: "wf-profitable-trade",
  name: "Profitable Trade Report",
  description: "Announce significant trading wins",

  trigger: {
    type: "event",
    eventType: "money.trade.executed",
  },

  steps: [
    {
      id: "step-1",
      name: "Log Achievement",
      engine: "orchestrator",
      action: "logActivity",
      params: { type: "TRADING_WIN" },
      onError: "continue",
      timeout: 5000,
    },
  ],

  status: "active",
  executions: 0,
  avgDuration: 0,
};

/**
 * WORKFLOW: Low Treasury Alert
 */
export const LOW_TREASURY_ALERT: Workflow = {
  id: "wf-low-treasury",
  name: "Low Treasury Alert",
  description: "Emergency response when funds are low",

  trigger: {
    type: "event",
    eventType: "money.treasury.low",
  },

  steps: [
    {
      id: "step-1",
      name: "Pause Risky Trading",
      engine: "money",
      action: "pauseTradingBots",
      params: { bots: ["arbitrage", "sniper"] },
      onError: "continue",
      timeout: 5000,
    },
    {
      id: "step-2",
      name: "Alert Orchestrator",
      engine: "orchestrator",
      action: "logActivity",
      params: { type: "TREASURY_ALERT", level: "critical" },
      onError: "stop",
      timeout: 5000,
    },
  ],

  status: "active",
  executions: 0,
  avgDuration: 0,
};

/**
 * WORKFLOW: Daily Summary
 */
export const DAILY_SUMMARY: Workflow = {
  id: "wf-daily-summary",
  name: "Daily Summary",
  description: "Generate and publish daily performance summary",

  trigger: {
    type: "schedule",
    schedule: "0 0 * * *",  // Midnight UTC
  },

  steps: [
    {
      id: "step-1",
      name: "Get Money Metrics",
      engine: "money",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 10000,
    },
    {
      id: "step-2",
      name: "Get Growth Metrics",
      engine: "growth",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 10000,
    },
    {
      id: "step-3",
      name: "Get Product Metrics",
      engine: "product",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 10000,
    },
    {
      id: "step-4",
      name: "Generate Report",
      engine: "orchestrator",
      action: "generateDailyReport",
      params: {},
      onError: "stop",
      timeout: 30000,
    },
  ],

  status: "active",
  executions: 0,
  avgDuration: 0,
};

/**
 * WORKFLOW: Competitor Feature Response
 */
export const COMPETITOR_RESPONSE: Workflow = {
  id: "wf-competitor-response",
  name: "Competitor Feature Response",
  description: "Respond to competitor feature launches",

  trigger: {
    type: "event",
    eventType: "product.opportunity.discovered",
  },

  steps: [
    {
      id: "step-1",
      name: "Evaluate Feature",
      engine: "orchestrator",
      action: "evaluateOpportunity",
      params: {},
      onError: "stop",
      timeout: 30000,
    },
  ],

  status: "active",
  executions: 0,
  avgDuration: 0,
};

/**
 * All predefined workflows
 */
export const PREDEFINED_WORKFLOWS: Workflow[] = [
  NEW_FEATURE_ANNOUNCEMENT,
  PROFITABLE_TRADE_REPORT,
  LOW_TREASURY_ALERT,
  DAILY_SUMMARY,
  COMPETITOR_RESPONSE,
];
