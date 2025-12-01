/**
 * Integration Hub Types
 */

import { z } from "zod";

// Engine identifiers
export type EngineId = "orchestrator" | "money-engine" | "growth-engine" | "product-engine" | "hunter-agent";

// Event categories
export type EventCategory =
  | "brain"      // Brain/orchestrator events
  | "trading"    // Money engine events
  | "content"    // Growth engine events
  | "discovery"  // Product engine events
  | "hunting"    // Hunter agent events
  | "system";    // System-level events

// Event schema
export const HubEventSchema = z.object({
  id: z.string(),
  source: z.string(),
  category: z.string(),
  type: z.string(),
  payload: z.record(z.unknown()).optional(),
  timestamp: z.number(),
});

export type HubEvent = z.infer<typeof HubEventSchema>;

// Engine status
export interface EngineStatus {
  id: EngineId;
  name: string;
  status: "running" | "stopped" | "error" | "unknown";
  lastHeartbeat: number | null;
  metrics: Record<string, unknown>;
}

// Hub status
export interface HubStatus {
  running: boolean;
  startedAt: number | null;
  engines: EngineStatus[];
  eventCount: number;
  lastEvent: HubEvent | null;
}

// Event types per engine
export interface BrainEvents {
  "brain:phase_started": { phase: string; timestamp: number };
  "brain:phase_completed": { phase: string; duration: number };
  "brain:decision_made": { type: string; action: string; confidence: number };
  "brain:goal_achieved": { goal: string; value: number };
}

export interface TradingEvents {
  "trading:order_placed": { symbol: string; side: "buy" | "sell"; amount: number };
  "trading:order_filled": { orderId: string; price: number; amount: number };
  "trading:position_opened": { symbol: string; size: number };
  "trading:position_closed": { symbol: string; pnl: number };
  "trading:treasury_updated": { balance: number; change: number };
}

export interface ContentEvents {
  "content:blog_generated": { title: string; slug: string };
  "content:blog_published": { slug: string; url: string };
  "content:tweet_posted": { id: string; content: string };
  "content:thread_posted": { id: string; tweetCount: number };
  "content:discord_announced": { type: string; channel: string };
}

export interface DiscoveryEvents {
  "discovery:opportunity_found": { id: string; source: string; score: number };
  "discovery:opportunity_approved": { id: string };
  "discovery:build_started": { opportunityId: string };
  "discovery:build_completed": { opportunityId: string; success: boolean };
  "discovery:component_built": { name: string; category: string };
}

export interface HuntingEvents {
  "hunting:source_scanned": { source: string; count: number };
  "hunting:discovery_found": { source: string; title: string; score: number };
  "hunting:high_value_alert": { source: string; title: string; score: number };
}

export interface SystemEvents {
  "system:engine_started": { engine: EngineId };
  "system:engine_stopped": { engine: EngineId };
  "system:engine_error": { engine: EngineId; error: string };
  "system:heartbeat": { engine: EngineId };
}

// Combined event map
export type AllEvents =
  & BrainEvents
  & TradingEvents
  & ContentEvents
  & DiscoveryEvents
  & HuntingEvents
  & SystemEvents;

export type EventType = keyof AllEvents;
