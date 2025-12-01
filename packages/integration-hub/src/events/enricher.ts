/**
 * Event Enricher - Adds metadata to events for better display
 */

import {
  EventCategory,
  EventSeverity,
  getEventSeverity,
  getEventIcon,
  getCategoryIcon,
  getCategoryColor,
  isValidCategory,
} from "./categories.js";

// ============================================================================
// TYPES
// ============================================================================

export interface RawEvent {
  id?: string;
  timestamp?: number;
  source: string;
  category: string;
  type: string;
  payload?: Record<string, unknown>;
}

export interface EventAction {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string; // Action type to emit
}

export interface EnrichedEvent {
  id: string;
  timestamp: number;
  category: EventCategory | string;
  type: string;
  source: string;
  title: string;
  description: string;
  icon: string;
  categoryIcon: string;
  color: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  actions: EventAction[];
  relatedId?: string; // ID of related entity (trade, pipeline, etc.)
}

// ============================================================================
// EVENT TITLE GENERATORS
// ============================================================================

const TITLE_GENERATORS: Record<string, (payload: Record<string, unknown>) => string> = {
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
  "treasury.runway_critical": (p) => `Runway Critical: ${p.days || 0} days remaining`,
};

// ============================================================================
// DESCRIPTION GENERATORS
// ============================================================================

const DESCRIPTION_GENERATORS: Record<string, (payload: Record<string, unknown>) => string> = {
  "brain.phase_started": (p) => `Brain entering ${p.phase || "new"} phase. ${p.description || ""}`,
  "brain.decision_made": (p) => `${p.reasoning || "Decision was made based on analysis."}`,
  "trade.order_filled": (p) => `${p.side || "Order"} ${p.size || 0} ${p.symbol || ""} at $${p.price || 0}. Total value: $${p.valueUsd || 0}`,
  "trade.position_closed": (p) => `Closed position with ${Number(p.pnl || 0) >= 0 ? "profit" : "loss"} of $${Math.abs(Number(p.pnl || 0))}`,
  "discovery.opportunity_scored": (p) => `User demand: ${p.userDemand || 0}, Tech fit: ${p.technicalFit || 0}, Impact: ${p.impact || 0}`,
  "pipeline.completed": (p) => `Pipeline finished in ${p.duration || 0}ms with ${p.status || "unknown"} status`,
};

// ============================================================================
// ACTION GENERATORS
// ============================================================================

function generateActions(eventType: string, payload: Record<string, unknown>): EventAction[] {
  const actions: EventAction[] = [];

  // Add actions based on event type
  if (eventType.startsWith("autonomy.action_queued")) {
    actions.push(
      { id: "approve", label: "Approve", icon: "✅", action: "autonomy.approve" },
      { id: "reject", label: "Reject", icon: "❌", action: "autonomy.reject" }
    );
  }

  if (eventType.startsWith("discovery.opportunity_found") || eventType.startsWith("discovery.opportunity_scored")) {
    actions.push(
      { id: "approve", label: "Approve", icon: "✅", action: "discovery.approve" },
      { id: "reject", label: "Reject", icon: "❌", action: "discovery.reject" },
      { id: "view", label: "View Details", icon: "👁️", href: `/discovery/${payload.id || ""}` }
    );
  }

  if (eventType.startsWith("trade.")) {
    actions.push({ id: "view", label: "View Trade", icon: "📈", href: `/trading/${payload.id || ""}` });
  }

  if (eventType.startsWith("pipeline.")) {
    actions.push({ id: "view", label: "View Pipeline", icon: "🔄", href: `/pipelines/${payload.executionId || payload.pipelineId || ""}` });
  }

  if (eventType.startsWith("content.")) {
    if (payload.url) {
      actions.push({ id: "view", label: "View Content", icon: "👁️", href: String(payload.url) });
    }
  }

  return actions;
}

// ============================================================================
// ENRICHER
// ============================================================================

let eventCounter = 0;

export function enrichEvent(raw: RawEvent): EnrichedEvent {
  const eventType = `${raw.category}.${raw.type}`;
  const payload = raw.payload || {};

  // Generate ID if not provided
  const id = raw.id || `evt_${Date.now()}_${++eventCounter}`;

  // Get title
  const titleGenerator = TITLE_GENERATORS[eventType];
  const title = titleGenerator ? titleGenerator(payload) : `${raw.category}: ${raw.type}`;

  // Get description
  const descGenerator = DESCRIPTION_GENERATORS[eventType];
  const description = descGenerator
    ? descGenerator(payload)
    : (payload.description as string) || (payload.message as string) || "";

  // Get category info
  const category = isValidCategory(raw.category) ? raw.category : raw.category;
  const categoryIcon = isValidCategory(raw.category) ? getCategoryIcon(raw.category) : "📌";
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
    relatedId: (payload.id as string) || (payload.executionId as string) || (payload.tradeId as string),
  };
}

// ============================================================================
// BATCH ENRICHMENT
// ============================================================================

export function enrichEvents(events: RawEvent[]): EnrichedEvent[] {
  return events.map(enrichEvent);
}

// ============================================================================
// FILTER HELPERS
// ============================================================================

export function filterEventsByCategory(events: EnrichedEvent[], category: string): EnrichedEvent[] {
  return events.filter((e) => e.category === category);
}

export function filterEventsBySeverity(events: EnrichedEvent[], severity: EventSeverity): EnrichedEvent[] {
  return events.filter((e) => e.severity === severity);
}

export function filterEventsWithActions(events: EnrichedEvent[]): EnrichedEvent[] {
  return events.filter((e) => e.actions.length > 0);
}
