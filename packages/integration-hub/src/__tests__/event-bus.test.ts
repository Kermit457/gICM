/**
 * Event Bus Tests
 * Phase 17B: Core Module Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus, type HubEvent } from "../event-bus.js";
import {
  createTestEvent,
  createEngineEvent,
  createPipelineEvent,
  resetEventCounter,
} from "./factories/event.factory.js";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    resetEventCounter();
  });

  // ===========================================================================
  // EMIT TESTS
  // ===========================================================================

  describe("emit", () => {
    it("should emit an event to listeners", () => {
      const handler = vi.fn();
      const event = createEngineEvent("started");

      eventBus.on("engine.started", handler);
      eventBus.emit("engine.started", event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should emit to wildcard listeners", () => {
      const wildcardHandler = vi.fn();
      const specificHandler = vi.fn();
      const event = createEngineEvent("started");

      eventBus.on("*", wildcardHandler);
      eventBus.on("engine.started", specificHandler);
      eventBus.emit("engine.started", event);

      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(wildcardHandler).toHaveBeenCalledTimes(1);
      expect(wildcardHandler).toHaveBeenCalledWith(event);
    });

    it("should log events to the event log", () => {
      const event = createEngineEvent("started");
      eventBus.emit("engine.started", event);

      const recentEvents = eventBus.getRecentEvents();
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0]).toEqual(event);
    });

    it("should limit event log size to maxLogSize", () => {
      // Emit more than maxLogSize (1000) events
      for (let i = 0; i < 1050; i++) {
        eventBus.emit("engine.heartbeat", createEngineEvent("heartbeat"));
      }

      const recentEvents = eventBus.getRecentEvents(2000);
      expect(recentEvents.length).toBeLessThanOrEqual(1000);
    });

    it("should return true when listeners exist", () => {
      eventBus.on("engine.started", vi.fn());
      const result = eventBus.emit("engine.started", createEngineEvent("started"));
      expect(result).toBe(true);
    });
  });

  // ===========================================================================
  // PUBLISH TESTS
  // ===========================================================================

  describe("publish", () => {
    it("should create and emit an event with correct structure", () => {
      const handler = vi.fn();
      eventBus.on("engine.started", handler);

      eventBus.publish("test-engine", "engine.started", { name: "TestEngine" });

      expect(handler).toHaveBeenCalledTimes(1);
      const emittedEvent = handler.mock.calls[0][0] as HubEvent;

      expect(emittedEvent).toMatchObject({
        source: "test-engine",
        category: "engine",
        type: "engine.started",
        payload: { name: "TestEngine" },
      });
      expect(emittedEvent.id).toBeDefined();
      expect(emittedEvent.timestamp).toBeDefined();
    });

    it("should extract category from event type", () => {
      const handler = vi.fn();
      eventBus.on("pipeline.completed", handler);

      eventBus.publish("orchestrator", "pipeline.completed", { pipelineId: "123" });

      const emittedEvent = handler.mock.calls[0][0] as HubEvent;
      expect(emittedEvent.category).toBe("pipeline");
    });

    it("should use empty payload by default", () => {
      const handler = vi.fn();
      eventBus.on("engine.stopped", handler);

      eventBus.publish("test-engine", "engine.stopped");

      const emittedEvent = handler.mock.calls[0][0] as HubEvent;
      expect(emittedEvent.payload).toEqual({});
    });
  });

  // ===========================================================================
  // SUBSCRIBE TESTS
  // ===========================================================================

  describe("subscribe", () => {
    it("should subscribe to events", () => {
      const handler = vi.fn();
      eventBus.subscribe("test-source", "engine.started", handler);

      const event = createEngineEvent("started");
      eventBus.emit("engine.started", event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should handle multiple subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.subscribe("source1", "engine.started", handler1);
      eventBus.subscribe("source2", "engine.started", handler2);

      const event = createEngineEvent("started");
      eventBus.emit("engine.started", event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // GET RECENT EVENTS TESTS
  // ===========================================================================

  describe("getRecentEvents", () => {
    it("should return empty array when no events", () => {
      expect(eventBus.getRecentEvents()).toEqual([]);
    });

    it("should return events in order", () => {
      const event1 = createEngineEvent("started");
      const event2 = createEngineEvent("heartbeat");
      const event3 = createEngineEvent("stopped");

      eventBus.emit("engine.started", event1);
      eventBus.emit("engine.heartbeat", event2);
      eventBus.emit("engine.stopped", event3);

      const events = eventBus.getRecentEvents();
      expect(events).toHaveLength(3);
      expect(events[0]).toEqual(event1);
      expect(events[1]).toEqual(event2);
      expect(events[2]).toEqual(event3);
    });

    it("should respect limit parameter", () => {
      for (let i = 0; i < 10; i++) {
        eventBus.emit("engine.heartbeat", createEngineEvent("heartbeat"));
      }

      const events = eventBus.getRecentEvents(5);
      expect(events).toHaveLength(5);
    });

    it("should return most recent events when limit is less than total", () => {
      const events: HubEvent[] = [];
      for (let i = 0; i < 10; i++) {
        const event = createEngineEvent("heartbeat");
        events.push(event);
        eventBus.emit("engine.heartbeat", event);
      }

      const recentEvents = eventBus.getRecentEvents(3);
      expect(recentEvents).toHaveLength(3);
      // Should be the last 3 events
      expect(recentEvents[0]).toEqual(events[7]);
      expect(recentEvents[1]).toEqual(events[8]);
      expect(recentEvents[2]).toEqual(events[9]);
    });
  });

  // ===========================================================================
  // GET EVENTS BY CATEGORY TESTS
  // ===========================================================================

  describe("getEventsByCategory", () => {
    it("should return empty array when no events in category", () => {
      eventBus.emit("engine.started", createEngineEvent("started"));
      const pipelineEvents = eventBus.getEventsByCategory("pipeline");
      expect(pipelineEvents).toEqual([]);
    });

    it("should filter events by category", () => {
      const engineEvent = createEngineEvent("started");
      const pipelineEvent = createPipelineEvent("started");
      const tradeEvent = createTestEvent({ category: "trade", type: "trade.executed" });

      eventBus.emit("engine.started", engineEvent);
      eventBus.emit("pipeline.started", pipelineEvent);
      eventBus.emit("trade.executed", tradeEvent);

      const engineEvents = eventBus.getEventsByCategory("engine");
      expect(engineEvents).toHaveLength(1);
      expect(engineEvents[0]).toEqual(engineEvent);

      const pipelineEvents = eventBus.getEventsByCategory("pipeline");
      expect(pipelineEvents).toHaveLength(1);
      expect(pipelineEvents[0]).toEqual(pipelineEvent);
    });

    it("should respect limit parameter", () => {
      for (let i = 0; i < 10; i++) {
        eventBus.emit("engine.heartbeat", createEngineEvent("heartbeat"));
      }

      const events = eventBus.getEventsByCategory("engine", 5);
      expect(events).toHaveLength(5);
    });
  });

  // ===========================================================================
  // CLEAR LOG TESTS
  // ===========================================================================

  describe("clearLog", () => {
    it("should clear all events from log", () => {
      eventBus.emit("engine.started", createEngineEvent("started"));
      eventBus.emit("engine.stopped", createEngineEvent("stopped"));

      expect(eventBus.getRecentEvents()).toHaveLength(2);

      eventBus.clearLog();

      expect(eventBus.getRecentEvents()).toHaveLength(0);
    });

    it("should not affect event listeners", () => {
      const handler = vi.fn();
      eventBus.on("engine.started", handler);

      eventBus.emit("engine.started", createEngineEvent("started"));
      eventBus.clearLog();
      eventBus.emit("engine.started", createEngineEvent("started"));

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // EVENT LISTENER TESTS
  // ===========================================================================

  describe("event listeners", () => {
    it("should support multiple events types", () => {
      const startedHandler = vi.fn();
      const stoppedHandler = vi.fn();

      eventBus.on("engine.started", startedHandler);
      eventBus.on("engine.stopped", stoppedHandler);

      eventBus.emit("engine.started", createEngineEvent("started"));

      expect(startedHandler).toHaveBeenCalledTimes(1);
      expect(stoppedHandler).not.toHaveBeenCalled();
    });

    it("should support removing listeners with off", () => {
      const handler = vi.fn();

      eventBus.on("engine.started", handler);
      eventBus.emit("engine.started", createEngineEvent("started"));
      expect(handler).toHaveBeenCalledTimes(1);

      eventBus.off("engine.started", handler);
      eventBus.emit("engine.started", createEngineEvent("started"));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should support once listeners", () => {
      const handler = vi.fn();

      eventBus.once("engine.started", handler);

      eventBus.emit("engine.started", createEngineEvent("started"));
      eventBus.emit("engine.started", createEngineEvent("started"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should support removeAllListeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on("engine.started", handler1);
      eventBus.on("engine.stopped", handler2);

      eventBus.removeAllListeners();

      eventBus.emit("engine.started", createEngineEvent("started"));
      eventBus.emit("engine.stopped", createEngineEvent("stopped"));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // EDGE CASE TESTS
  // ===========================================================================

  describe("edge cases", () => {
    it("should handle events with complex payloads", () => {
      const handler = vi.fn();
      eventBus.on("pipeline.completed", handler);

      const complexPayload = {
        pipelineId: "123",
        steps: [
          { id: "step1", status: "completed" },
          { id: "step2", status: "completed" },
        ],
        metadata: {
          duration: 5000,
          nested: { deep: { value: true } },
        },
      };

      eventBus.publish("orchestrator", "pipeline.completed", complexPayload);

      const emittedEvent = handler.mock.calls[0][0] as HubEvent;
      expect(emittedEvent.payload).toEqual(complexPayload);
    });

    it("should handle rapid event emission", () => {
      const handler = vi.fn();
      eventBus.on("engine.heartbeat", handler);

      for (let i = 0; i < 100; i++) {
        eventBus.emit("engine.heartbeat", createEngineEvent("heartbeat"));
      }

      expect(handler).toHaveBeenCalledTimes(100);
    });

    it("should handle events with empty string source", () => {
      const handler = vi.fn();
      eventBus.on("engine.started", handler);

      eventBus.publish("", "engine.started", {});

      const emittedEvent = handler.mock.calls[0][0] as HubEvent;
      expect(emittedEvent.source).toBe("");
    });
  });
});
