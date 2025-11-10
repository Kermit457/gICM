/**
 * Configuration for Live Activity Dashboard
 */

export const LIVE_CONFIG = {
  // Polling interval for activity feed updates (ms)
  pollInterval: 3000,

  // Maximum number of activities to show in feed
  activityFeedSize: 50,

  // Ratio of real to simulated events (0.6 = 60% real, 40% simulated)
  realToSimulatedRatio: 0.6,

  // Auto-scroll speed (ms per item)
  scrollSpeed: 3000,

  // Animation duration for transitions (ms)
  animationDuration: 500,

  // Show debug information (dev only)
  showDebugInfo: process.env.NODE_ENV === "development",

  // Rate limiting (requests per minute per IP)
  rateLimitPerMinute: 30,

  // Stats update interval (ms)
  statsUpdateInterval: 5000,

  // Activity simulation settings
  simulation: {
    // Minimum time between simulated events (ms)
    minInterval: 2000,

    // Maximum time between simulated events (ms)
    maxInterval: 8000,

    // Activity types that can be simulated
    enabledTypes: [
      "item_add_to_stack",
      "bundle_created",
      "offspring_remix",
      "project_completed",
      "install_command",
      "stack_deployed",
    ] as const,

    // Probability weights for different activity types
    typeWeights: {
      item_add_to_stack: 0.3,
      bundle_created: 0.2,
      offspring_remix: 0.15,
      project_completed: 0.15,
      install_command: 0.1,
      stack_deployed: 0.1,
    },
  },

  // Display settings
  display: {
    // Max items visible in ticker at once
    maxVisibleItems: 15,

    // Item height in pixels
    itemHeight: 80,

    // Padding between items
    itemGap: 12,
  },

  // Color palette
  colors: {
    background: "#000000",
    text: "#FFFFFF",
    accent: "#84cc16", // lime
    secondary: "#06b6d4", // cyan
    tertiary: "#8b5cf6", // purple
    success: "#10b981", // green
    warning: "#f59e0b", // amber
    error: "#ef4444", // red
  },
} as const;

export type LiveConfig = typeof LIVE_CONFIG;
