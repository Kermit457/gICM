// src/events/categories.ts
var EVENT_CATEGORIES = {
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
    "cycle_completed"
  ],
  engine: [
    "started",
    "stopped",
    "heartbeat",
    "error",
    "recovered",
    "config_changed"
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
    "take_profit_hit"
  ],
  content: [
    "blog_generated",
    "blog_published",
    "tweet_generated",
    "tweet_posted",
    "tweet_scheduled",
    "seo_analyzed",
    "content_approved",
    "content_rejected"
  ],
  discovery: [
    "opportunity_found",
    "opportunity_scored",
    "opportunity_approved",
    "opportunity_rejected",
    "opportunity_building",
    "opportunity_completed",
    "source_scanned"
  ],
  autonomy: [
    "action_queued",
    "action_approved",
    "action_rejected",
    "action_executed",
    "action_escalated",
    "action_failed",
    "boundary_hit",
    "level_changed"
  ],
  system: [
    "startup",
    "shutdown",
    "config_changed",
    "error",
    "warning",
    "info",
    "health_check",
    "backup_created"
  ],
  pipeline: [
    "started",
    "step_started",
    "step_completed",
    "step_failed",
    "completed",
    "failed",
    "cancelled"
  ],
  treasury: [
    "balance_updated",
    "allocation_changed",
    "expense_paid",
    "income_received",
    "runway_warning",
    "runway_critical"
  ]
};
var CATEGORY_ICONS = {
  brain: "\u{1F9E0}",
  engine: "\u2699\uFE0F",
  trade: "\u{1F4C8}",
  content: "\u{1F4DD}",
  discovery: "\u{1F50D}",
  autonomy: "\u{1F916}",
  system: "\u{1F4BB}",
  pipeline: "\u{1F504}",
  treasury: "\u{1F4B0}"
};
var CATEGORY_COLORS = {
  brain: "purple",
  engine: "gray",
  trade: "green",
  content: "blue",
  discovery: "yellow",
  autonomy: "orange",
  system: "slate",
  pipeline: "cyan",
  treasury: "emerald"
};
var EVENT_ICONS = {
  // Brain events
  "brain.phase_started": "\u{1F305}",
  "brain.phase_completed": "\u2705",
  "brain.decision_made": "\u{1F3AF}",
  "brain.knowledge_ingested": "\u{1F4DA}",
  "brain.pattern_found": "\u{1F52E}",
  "brain.prediction_made": "\u{1F52E}",
  "brain.goal_achieved": "\u{1F3C6}",
  "brain.cycle_started": "\u{1F504}",
  "brain.cycle_completed": "\u2728",
  // Engine events
  "engine.started": "\u25B6\uFE0F",
  "engine.stopped": "\u23F9\uFE0F",
  "engine.heartbeat": "\u{1F493}",
  "engine.error": "\u274C",
  "engine.recovered": "\u2705",
  // Trade events
  "trade.signal_generated": "\u{1F4CA}",
  "trade.order_placed": "\u{1F4DD}",
  "trade.order_filled": "\u2705",
  "trade.position_opened": "\u{1F4C8}",
  "trade.position_closed": "\u{1F4C9}",
  "trade.pnl_update": "\u{1F4B5}",
  "trade.stop_hit": "\u{1F6D1}",
  "trade.take_profit_hit": "\u{1F3AF}",
  // Content events
  "content.blog_generated": "\u{1F4DD}",
  "content.blog_published": "\u{1F4F0}",
  "content.tweet_generated": "\u{1F426}",
  "content.tweet_posted": "\u2705",
  "content.tweet_scheduled": "\u{1F4C5}",
  // Discovery events
  "discovery.opportunity_found": "\u{1F50D}",
  "discovery.opportunity_scored": "\u{1F4CA}",
  "discovery.opportunity_approved": "\u2705",
  "discovery.opportunity_rejected": "\u274C",
  "discovery.opportunity_building": "\u{1F528}",
  "discovery.opportunity_completed": "\u{1F389}",
  // Autonomy events
  "autonomy.action_queued": "\u{1F4CB}",
  "autonomy.action_approved": "\u2705",
  "autonomy.action_rejected": "\u274C",
  "autonomy.action_executed": "\u26A1",
  "autonomy.action_escalated": "\u2B06\uFE0F",
  "autonomy.boundary_hit": "\u{1F6A7}",
  // System events
  "system.startup": "\u{1F680}",
  "system.shutdown": "\u{1F534}",
  "system.error": "\u274C",
  "system.warning": "\u26A0\uFE0F",
  "system.info": "\u2139\uFE0F",
  // Pipeline events
  "pipeline.started": "\u25B6\uFE0F",
  "pipeline.step_started": "\u27A1\uFE0F",
  "pipeline.step_completed": "\u2705",
  "pipeline.step_failed": "\u274C",
  "pipeline.completed": "\u{1F389}",
  "pipeline.failed": "\u{1F4A5}",
  "pipeline.cancelled": "\u{1F6AB}",
  // Treasury events
  "treasury.balance_updated": "\u{1F4B0}",
  "treasury.expense_paid": "\u{1F4B8}",
  "treasury.income_received": "\u{1F4B5}",
  "treasury.runway_warning": "\u26A0\uFE0F",
  "treasury.runway_critical": "\u{1F6A8}"
};
var EVENT_SEVERITY = {
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
  "treasury.income_received": "success"
  // Default is info
};
function getEventSeverity(eventType) {
  return EVENT_SEVERITY[eventType] || "info";
}
function getEventIcon(eventType) {
  return EVENT_ICONS[eventType] || "\u{1F4CC}";
}
function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || "\u{1F4CC}";
}
function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || "gray";
}
function getAllCategories() {
  return Object.keys(EVENT_CATEGORIES);
}
function getEventsForCategory(category) {
  return EVENT_CATEGORIES[category];
}
function isValidCategory(category) {
  return category in EVENT_CATEGORIES;
}
function isValidEventType(category, type) {
  return EVENT_CATEGORIES[category].includes(type);
}

// src/events/enricher.ts
var TITLE_GENERATORS = {
  // Brain
  "brain.phase_started": (p) => `Phase Started: ${p.phase || "Unknown"}`,
  "brain.phase_completed": (p) => `Phase Completed: ${p.phase || "Unknown"}`,
  "brain.decision_made": (p) => `Decision: ${p.decision || "Action taken"}`,
  "brain.knowledge_ingested": (p) => `Knowledge Ingested from ${p.source || "source"}`,
  "brain.pattern_found": (p) => `Pattern Discovered: ${p.name || "New pattern"}`,
  "brain.prediction_made": (p) => `Prediction: ${p.subject || "New prediction"}`,
  "brain.goal_achieved": (p) => `Goal Achieved: ${p.goal || "Milestone reached"}`,
  "brain.cycle_started": (p) => `Cycle #${p.cycle || "?"} Started`,
  "brain.cycle_completed": (p) => `Cycle #${p.cycle || "?"} Completed`,
  // Engine
  "engine.started": (p) => `${p.engine || "Engine"} Started`,
  "engine.stopped": (p) => `${p.engine || "Engine"} Stopped`,
  "engine.heartbeat": (p) => `Heartbeat: ${p.engine || "Engine"}`,
  "engine.error": (p) => `Error in ${p.engine || "Engine"}`,
  "engine.recovered": (p) => `${p.engine || "Engine"} Recovered`,
  // Trade
  "trade.signal_generated": (p) => `Signal: ${p.symbol || "Asset"} ${p.direction || ""}`,
  "trade.order_placed": (p) => `Order Placed: ${p.side || ""} ${p.symbol || ""}`,
  "trade.order_filled": (p) => `Order Filled: ${p.side || ""} ${p.symbol || ""} @ $${p.price || "?"}`,
  "trade.position_opened": (p) => `Position Opened: ${p.symbol || ""} ${p.side || ""}`,
  "trade.position_closed": (p) => `Position Closed: ${p.symbol || ""} PnL: $${p.pnl || 0}`,
  "trade.pnl_update": (p) => `PnL Update: $${p.pnl || 0}`,
  "trade.stop_hit": (p) => `Stop Hit: ${p.symbol || ""} @ $${p.price || "?"}`,
  "trade.take_profit_hit": (p) => `Take Profit: ${p.symbol || ""} @ $${p.price || "?"}`,
  // Content
  "content.blog_generated": (p) => `Blog Draft: ${p.title || "New post"}`,
  "content.blog_published": (p) => `Blog Published: ${p.title || "New post"}`,
  "content.tweet_generated": (p) => `Tweet Generated`,
  "content.tweet_posted": (p) => `Tweet Posted`,
  "content.tweet_scheduled": (p) => `Tweet Scheduled for ${p.scheduledAt || "later"}`,
  // Discovery
  "discovery.opportunity_found": (p) => `New Opportunity: ${p.name || "Discovery"}`,
  "discovery.opportunity_scored": (p) => `Scored: ${p.name || "Opportunity"} (${p.score || 0}/100)`,
  "discovery.opportunity_approved": (p) => `Approved: ${p.name || "Opportunity"}`,
  "discovery.opportunity_rejected": (p) => `Rejected: ${p.name || "Opportunity"}`,
  "discovery.opportunity_building": (p) => `Building: ${p.name || "Opportunity"}`,
  "discovery.opportunity_completed": (p) => `Completed: ${p.name || "Opportunity"}`,
  "discovery.source_scanned": (p) => `Scanned: ${p.source || "Source"}`,
  // Autonomy
  "autonomy.action_queued": (p) => `Action Queued: ${p.action || "Request"}`,
  "autonomy.action_approved": (p) => `Action Approved: ${p.action || "Request"}`,
  "autonomy.action_rejected": (p) => `Action Rejected: ${p.action || "Request"}`,
  "autonomy.action_executed": (p) => `Action Executed: ${p.action || "Request"}`,
  "autonomy.action_escalated": (p) => `Action Escalated: ${p.action || "Request"}`,
  "autonomy.boundary_hit": (p) => `Boundary Hit: ${p.boundary || "Limit reached"}`,
  // System
  "system.startup": () => "System Starting Up",
  "system.shutdown": () => "System Shutting Down",
  "system.error": (p) => `System Error: ${p.message || "Unknown error"}`,
  "system.warning": (p) => `Warning: ${p.message || "Attention needed"}`,
  "system.info": (p) => `${p.message || "Information"}`,
  // Pipeline
  "pipeline.started": (p) => `Pipeline Started: ${p.pipelineName || p.pipelineId || "Pipeline"}`,
  "pipeline.step_started": (p) => `Step Started: ${p.tool || p.stepId || "Step"}`,
  "pipeline.step_completed": (p) => `Step Completed: ${p.tool || p.stepId || "Step"}`,
  "pipeline.step_failed": (p) => `Step Failed: ${p.tool || p.stepId || "Step"}`,
  "pipeline.completed": (p) => `Pipeline Completed: ${p.pipelineName || "Pipeline"}`,
  "pipeline.failed": (p) => `Pipeline Failed: ${p.pipelineName || "Pipeline"}`,
  "pipeline.cancelled": (p) => `Pipeline Cancelled: ${p.pipelineName || "Pipeline"}`,
  // Treasury
  "treasury.balance_updated": (p) => `Balance Updated: $${p.total || p.amount || 0}`,
  "treasury.expense_paid": (p) => `Expense Paid: $${p.amount || 0} for ${p.description || "expense"}`,
  "treasury.income_received": (p) => `Income Received: $${p.amount || 0}`,
  "treasury.runway_warning": (p) => `Runway Warning: ${p.days || 0} days remaining`,
  "treasury.runway_critical": (p) => `Runway Critical: ${p.days || 0} days remaining`
};
var DESCRIPTION_GENERATORS = {
  "brain.phase_started": (p) => `Brain entering ${p.phase || "new"} phase. ${p.description || ""}`,
  "brain.decision_made": (p) => `${p.reasoning || "Decision was made based on analysis."}`,
  "trade.order_filled": (p) => `${p.side || "Order"} ${p.size || 0} ${p.symbol || ""} at $${p.price || 0}. Total value: $${p.valueUsd || 0}`,
  "trade.position_closed": (p) => `Closed position with ${Number(p.pnl || 0) >= 0 ? "profit" : "loss"} of $${Math.abs(Number(p.pnl || 0))}`,
  "discovery.opportunity_scored": (p) => `User demand: ${p.userDemand || 0}, Tech fit: ${p.technicalFit || 0}, Impact: ${p.impact || 0}`,
  "pipeline.completed": (p) => `Pipeline finished in ${p.duration || 0}ms with ${p.status || "unknown"} status`
};
function generateActions(eventType, payload) {
  const actions = [];
  if (eventType.startsWith("autonomy.action_queued")) {
    actions.push(
      { id: "approve", label: "Approve", icon: "\u2705", action: "autonomy.approve" },
      { id: "reject", label: "Reject", icon: "\u274C", action: "autonomy.reject" }
    );
  }
  if (eventType.startsWith("discovery.opportunity_found") || eventType.startsWith("discovery.opportunity_scored")) {
    actions.push(
      { id: "approve", label: "Approve", icon: "\u2705", action: "discovery.approve" },
      { id: "reject", label: "Reject", icon: "\u274C", action: "discovery.reject" },
      { id: "view", label: "View Details", icon: "\u{1F441}\uFE0F", href: `/discovery/${payload.id || ""}` }
    );
  }
  if (eventType.startsWith("trade.")) {
    actions.push({ id: "view", label: "View Trade", icon: "\u{1F4C8}", href: `/trading/${payload.id || ""}` });
  }
  if (eventType.startsWith("pipeline.")) {
    actions.push({ id: "view", label: "View Pipeline", icon: "\u{1F504}", href: `/pipelines/${payload.executionId || payload.pipelineId || ""}` });
  }
  if (eventType.startsWith("content.")) {
    if (payload.url) {
      actions.push({ id: "view", label: "View Content", icon: "\u{1F441}\uFE0F", href: String(payload.url) });
    }
  }
  return actions;
}
var eventCounter = 0;
function enrichEvent(raw) {
  const eventType = `${raw.category}.${raw.type}`;
  const payload = raw.payload || {};
  const id = raw.id || `evt_${Date.now()}_${++eventCounter}`;
  const titleGenerator = TITLE_GENERATORS[eventType];
  const title = titleGenerator ? titleGenerator(payload) : `${raw.category}: ${raw.type}`;
  const descGenerator = DESCRIPTION_GENERATORS[eventType];
  const description = descGenerator ? descGenerator(payload) : payload.description || payload.message || "";
  const category = isValidCategory(raw.category) ? raw.category : raw.category;
  const categoryIcon = isValidCategory(raw.category) ? getCategoryIcon(raw.category) : "\u{1F4CC}";
  const color = isValidCategory(raw.category) ? getCategoryColor(raw.category) : "gray";
  return {
    id,
    timestamp: raw.timestamp || Date.now(),
    category,
    type: raw.type,
    source: raw.source,
    title,
    description,
    icon: getEventIcon(eventType),
    categoryIcon,
    color,
    severity: getEventSeverity(eventType),
    payload,
    actions: generateActions(eventType, payload),
    relatedId: payload.id || payload.executionId || payload.tradeId
  };
}
function enrichEvents(events) {
  return events.map(enrichEvent);
}
function filterEventsByCategory(events, category) {
  return events.filter((e) => e.category === category);
}
function filterEventsBySeverity(events, severity) {
  return events.filter((e) => e.severity === severity);
}
function filterEventsWithActions(events) {
  return events.filter((e) => e.actions.length > 0);
}
export {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  EVENT_CATEGORIES,
  EVENT_ICONS,
  EVENT_SEVERITY,
  enrichEvent,
  enrichEvents,
  filterEventsByCategory,
  filterEventsBySeverity,
  filterEventsWithActions,
  getAllCategories,
  getCategoryColor,
  getCategoryIcon,
  getEventIcon,
  getEventSeverity,
  getEventsForCategory,
  isValidCategory,
  isValidEventType
};
//# sourceMappingURL=events-DJE52GQV.js.map