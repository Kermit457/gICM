/**
 * Event Factory - Create test events
 */

import type { HubEvent, EventCategory } from "../../event-bus.js";

let eventCounter = 0;

/**
 * Create a test HubEvent with defaults
 */
export function createTestEvent(
  overrides: Partial<HubEvent> = {}
): HubEvent {
  eventCounter++;
  return {
    id: `test-event-${eventCounter}`,
    timestamp: Date.now(),
    source: "test-source",
    category: "engine" as EventCategory,
    type: "engine.started",
    payload: {},
    ...overrides,
  };
}

/**
 * Create multiple test events
 */
export function createTestEvents(
  count: number,
  overrides: Partial<HubEvent> = {}
): HubEvent[] {
  return Array.from({ length: count }, () => createTestEvent(overrides));
}

/**
 * Create an engine event
 */
export function createEngineEvent(
  type: "started" | "stopped" | "error" | "heartbeat",
  payload: Record<string, unknown> = {}
): HubEvent {
  return createTestEvent({
    category: "engine",
    type: `engine.${type}`,
    payload,
  });
}

/**
 * Create a pipeline event
 */
export function createPipelineEvent(
  type:
    | "started"
    | "completed"
    | "failed"
    | "step_started"
    | "step_completed"
    | "step_failed",
  payload: Record<string, unknown> = {}
): HubEvent {
  return createTestEvent({
    category: "pipeline",
    type: `pipeline.${type}`,
    payload,
  });
}

/**
 * Create a trade event
 */
export function createTradeEvent(
  type: "executed" | "profit" | "loss",
  payload: Record<string, unknown> = {}
): HubEvent {
  return createTestEvent({
    category: "trade",
    type: `trade.${type}`,
    payload,
  });
}

/**
 * Create a content event
 */
export function createContentEvent(
  type: "published" | "scheduled",
  payload: Record<string, unknown> = {}
): HubEvent {
  return createTestEvent({
    category: "content",
    type: `content.${type}`,
    payload,
  });
}

/**
 * Reset event counter (useful between tests)
 */
export function resetEventCounter(): void {
  eventCounter = 0;
}
