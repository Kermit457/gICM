/**
 * Event Bus
 *
 * Central event system for cross-engine communication.
 */

import { EventEmitter } from "eventemitter3";
import { nanoid } from "nanoid";
import type { HubEvent, EngineName, EventCategory } from "../core/types.js";
import { Logger } from "../utils/logger.js";

type EventHandler = (event: HubEvent) => void | Promise<void>;

export class EventBus extends EventEmitter {
  private logger: Logger;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: HubEvent[] = [];
  private maxLogSize: number = 10000;

  constructor() {
    super();
    this.logger = new Logger("EventBus");
  }

  /**
   * Publish an event
   */
  publish(
    source: EngineName | "hub",
    category: EventCategory,
    type: string,
    data: Record<string, unknown>,
    options: { correlationId?: string; causationId?: string } = {}
  ): HubEvent {
    const event: HubEvent = {
      id: nanoid(),
      timestamp: Date.now(),
      source,
      category,
      type,
      data,
      correlationId: options.correlationId,
      causationId: options.causationId,
      processed: false,
      processedBy: [],
    };

    // Log event
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Emit to all listeners
    this.emit(type, event);
    this.emit("*", event);  // Wildcard for all events
    this.emit(`${category}.*`, event);  // Category wildcard

    this.logger.debug(`Event published: ${type}`, { source, category });

    return event;
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);
    this.on(eventType, handler);

    this.logger.debug(`Subscribed to: ${eventType}`);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
      this.off(eventType, handler);
    };
  }

  /**
   * Subscribe to all events from an engine
   */
  subscribeToEngine(engine: EngineName, handler: EventHandler): () => void {
    return this.subscribe("*", (event) => {
      if (event.source === engine) {
        handler(event);
      }
    });
  }

  /**
   * Subscribe to all events in a category
   */
  subscribeToCategory(category: EventCategory, handler: EventHandler): () => void {
    return this.subscribe(`${category}.*`, handler);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 100): HubEvent[] {
    return this.eventLog.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string, count: number = 100): HubEvent[] {
    return this.eventLog
      .filter(e => e.type === type)
      .slice(-count);
  }

  /**
   * Get events by source
   */
  getEventsBySource(source: EngineName | "hub", count: number = 100): HubEvent[] {
    return this.eventLog
      .filter(e => e.source === source)
      .slice(-count);
  }

  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  /**
   * Get stats
   */
  getStats(): {
    totalEvents: number;
    eventsBySource: Record<string, number>;
    eventsByCategory: Record<string, number>;
    handlersCount: number;
  } {
    const eventsBySource: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};

    for (const event of this.eventLog) {
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
    }

    return {
      totalEvents: this.eventLog.length,
      eventsBySource,
      eventsByCategory,
      handlersCount: Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0),
    };
  }
}

// Singleton instance
export const eventBus = new EventBus();
