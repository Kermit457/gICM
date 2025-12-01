/**
 * Event Categories - Defines all event types for the gICM platform
 */

// ============================================================================
// EVENT CATEGORY DEFINITIONS
// ============================================================================

export const EVENT_CATEGORIES = {
  brain: [
    "phase_started",
    "phase_completed",
    "decision_made",
    "knowledge_ingested",
    "pattern_found",
    "prediction_made",
    "goal_achieved",
    "goal_failed",
    "cycle_started",
    "cycle_completed",
  ],
  engine: [
    "started",
    "stopped",
    "heartbeat",
    "error",
    "recovered",
    "config_changed",
  ],
  trade: [
    "signal_generated",
    "order_placed",
    "order_filled",
    "order_cancelled",
    "position_opened",
    "position_closed",
    "pnl_update",
    "stop_hit",
    "take_profit_hit",
  ],
  content: [
    "blog_generated",
    "blog_published",
    "tweet_generated",
    "tweet_posted",
    "tweet_scheduled",
    "seo_analyzed",
    "content_approved",
    "content_rejected",
  ],
  discovery: [
    "opportunity_found",
    "opportunity_scored",
    "opportunity_approved",
    "opportunity_rejected",
    "opportunity_building",
    "opportunity_completed",
    "source_scanned",
  ],
  autonomy: [
    "action_queued",
    "action_approved",
    "action_rejected",
    "action_executed",
    "action_escalated",
    "action_failed",
    "boundary_hit",
    "level_changed",
  ],
  system: [
    "startup",
    "shutdown",
    "config_changed",
    "error",
    "warning",
    "info",
    "health_check",
    "backup_created",
  ],
  pipeline: [
    "started",
    "step_started",
    "step_completed",
    "step_failed",
    "completed",
    "failed",
    "cancelled",
  ],
  treasury: [
    "balance_updated",
    "allocation_changed",
    "expense_paid",
    "income_received",
    "runway_warning",
    "runway_critical",
  ],
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;
export type EventType<C extends EventCategory> = (typeof EVENT_CATEGORIES)[C][number];

// ============================================================================
// EVENT ICONS & COLORS
// ============================================================================

export const CATEGORY_ICONS: Record<EventCategory, string> = {
  brain: "🧠",
  engine: "⚙️",
  trade: "📈",
  content: "📝",
  discovery: "🔍",
  autonomy: "🤖",
  system: "💻",
  pipeline: "🔄",
  treasury: "💰",
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  brain: "purple",
  engine: "gray",
  trade: "green",
  content: "blue",
  discovery: "yellow",
  autonomy: "orange",
  system: "slate",
  pipeline: "cyan",
  treasury: "emerald",
};

export const EVENT_ICONS: Record<string, string> = {
  // Brain events
  "brain.phase_started": "🌅",
  "brain.phase_completed": "✅",
  "brain.decision_made": "🎯",
  "brain.knowledge_ingested": "📚",
  "brain.pattern_found": "🔮",
  "brain.prediction_made": "🔮",
  "brain.goal_achieved": "🏆",
  "brain.cycle_started": "🔄",
  "brain.cycle_completed": "✨",

  // Engine events
  "engine.started": "▶️",
  "engine.stopped": "⏹️",
  "engine.heartbeat": "💓",
  "engine.error": "❌",
  "engine.recovered": "✅",

  // Trade events
  "trade.signal_generated": "📊",
  "trade.order_placed": "📝",
  "trade.order_filled": "✅",
  "trade.position_opened": "📈",
  "trade.position_closed": "📉",
  "trade.pnl_update": "💵",
  "trade.stop_hit": "🛑",
  "trade.take_profit_hit": "🎯",

  // Content events
  "content.blog_generated": "📝",
  "content.blog_published": "📰",
  "content.tweet_generated": "🐦",
  "content.tweet_posted": "✅",
  "content.tweet_scheduled": "📅",

  // Discovery events
  "discovery.opportunity_found": "🔍",
  "discovery.opportunity_scored": "📊",
  "discovery.opportunity_approved": "✅",
  "discovery.opportunity_rejected": "❌",
  "discovery.opportunity_building": "🔨",
  "discovery.opportunity_completed": "🎉",

  // Autonomy events
  "autonomy.action_queued": "📋",
  "autonomy.action_approved": "✅",
  "autonomy.action_rejected": "❌",
  "autonomy.action_executed": "⚡",
  "autonomy.action_escalated": "⬆️",
  "autonomy.boundary_hit": "🚧",

  // System events
  "system.startup": "🚀",
  "system.shutdown": "🔴",
  "system.error": "❌",
  "system.warning": "⚠️",
  "system.info": "ℹ️",

  // Pipeline events
  "pipeline.started": "▶️",
  "pipeline.step_started": "➡️",
  "pipeline.step_completed": "✅",
  "pipeline.step_failed": "❌",
  "pipeline.completed": "🎉",
  "pipeline.failed": "💥",
  "pipeline.cancelled": "🚫",

  // Treasury events
  "treasury.balance_updated": "💰",
  "treasury.expense_paid": "💸",
  "treasury.income_received": "💵",
  "treasury.runway_warning": "⚠️",
  "treasury.runway_critical": "🚨",
};

// ============================================================================
// SEVERITY MAPPING
// ============================================================================

export type EventSeverity = "info" | "success" | "warning" | "error";

export const EVENT_SEVERITY: Record<string, EventSeverity> = {
  // Errors
  "engine.error": "error",
  "system.error": "error",
  "pipeline.failed": "error",
  "pipeline.step_failed": "error",
  "autonomy.action_failed": "error",
  "treasury.runway_critical": "error",

  // Warnings
  "system.warning": "warning",
  "autonomy.action_escalated": "warning",
  "autonomy.boundary_hit": "warning",
  "treasury.runway_warning": "warning",
  "trade.stop_hit": "warning",

  // Success
  "brain.phase_completed": "success",
  "brain.goal_achieved": "success",
  "engine.started": "success",
  "engine.recovered": "success",
  "trade.order_filled": "success",
  "trade.take_profit_hit": "success",
  "content.blog_published": "success",
  "content.tweet_posted": "success",
  "discovery.opportunity_approved": "success",
  "discovery.opportunity_completed": "success",
  "autonomy.action_approved": "success",
  "autonomy.action_executed": "success",
  "pipeline.completed": "success",
  "pipeline.step_completed": "success",
  "treasury.income_received": "success",

  // Default is info
};

export function getEventSeverity(eventType: string): EventSeverity {
  return EVENT_SEVERITY[eventType] || "info";
}

export function getEventIcon(eventType: string): string {
  return EVENT_ICONS[eventType] || "📌";
}

export function getCategoryIcon(category: EventCategory): string {
  return CATEGORY_ICONS[category] || "📌";
}

export function getCategoryColor(category: EventCategory): string {
  return CATEGORY_COLORS[category] || "gray";
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAllCategories(): EventCategory[] {
  return Object.keys(EVENT_CATEGORIES) as EventCategory[];
}

export function getEventsForCategory(category: EventCategory): readonly string[] {
  return EVENT_CATEGORIES[category];
}

export function isValidCategory(category: string): category is EventCategory {
  return category in EVENT_CATEGORIES;
}

export function isValidEventType(category: EventCategory, type: string): boolean {
  return (EVENT_CATEGORIES[category] as readonly string[]).includes(type);
}
