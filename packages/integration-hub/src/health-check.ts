/**
 * Health Check System
 *
 * Monitors all engines and reports their status.
 */

import type { EngineId, EngineStatus, HubStatus } from "./types.js";
import { EventBus } from "./event-bus.js";

const HEARTBEAT_TIMEOUT = 60000; // 1 minute

export class HealthMonitor {
  private bus: EventBus;
  private engines: Map<EngineId, EngineStatus> = new Map();
  private startedAt: number | null = null;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.initializeEngines();
    this.setupListeners();
  }

  private initializeEngines(): void {
    const engineConfigs: Array<{ id: EngineId; name: string }> = [
      { id: "orchestrator", name: "Brain/Orchestrator" },
      { id: "money-engine", name: "Money Engine" },
      { id: "growth-engine", name: "Growth Engine" },
      { id: "product-engine", name: "Product Engine" },
      { id: "hunter-agent", name: "Hunter Agent" },
    ];

    for (const config of engineConfigs) {
      this.engines.set(config.id, {
        id: config.id,
        name: config.name,
        status: "unknown",
        lastHeartbeat: null,
        metrics: {},
      });
    }
  }

  private setupListeners(): void {
    // Listen for heartbeats
    this.bus.on("system:heartbeat", (event) => {
      const engine = this.engines.get(event.engine);
      if (engine) {
        engine.status = "running";
        engine.lastHeartbeat = event._meta.timestamp;
      }
    });

    // Listen for engine starts
    this.bus.on("system:engine_started", (event) => {
      const engine = this.engines.get(event.engine);
      if (engine) {
        engine.status = "running";
        engine.lastHeartbeat = event._meta.timestamp;
      }
    });

    // Listen for engine stops
    this.bus.on("system:engine_stopped", (event) => {
      const engine = this.engines.get(event.engine);
      if (engine) {
        engine.status = "stopped";
      }
    });

    // Listen for engine errors
    this.bus.on("system:engine_error", (event) => {
      const engine = this.engines.get(event.engine);
      if (engine) {
        engine.status = "error";
        engine.metrics.lastError = event.error;
        engine.metrics.errorTime = event._meta.timestamp;
      }
    });
  }

  /**
   * Start health monitoring
   */
  start(): void {
    this.startedAt = Date.now();

    // Check for stale heartbeats periodically
    setInterval(() => {
      const now = Date.now();
      for (const [, engine] of this.engines) {
        if (engine.status === "running" && engine.lastHeartbeat) {
          if (now - engine.lastHeartbeat > HEARTBEAT_TIMEOUT) {
            engine.status = "unknown";
          }
        }
      }
    }, 30000);
  }

  /**
   * Get status of a specific engine
   */
  getEngineStatus(id: EngineId): EngineStatus | undefined {
    return this.engines.get(id);
  }

  /**
   * Get all engine statuses
   */
  getAllEngineStatuses(): EngineStatus[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get hub status
   */
  getHubStatus(): HubStatus {
    return {
      running: this.startedAt !== null,
      startedAt: this.startedAt,
      engines: this.getAllEngineStatuses(),
      eventCount: this.bus.getEventCount(),
      lastEvent: this.bus.getLastEvent(),
    };
  }

  /**
   * Check if all engines are healthy
   */
  isHealthy(): boolean {
    for (const [, engine] of this.engines) {
      if (engine.status === "error") return false;
    }
    return true;
  }

  /**
   * Get running engines
   */
  getRunningEngines(): EngineStatus[] {
    return Array.from(this.engines.values()).filter((e) => e.status === "running");
  }

  /**
   * Get engines with issues
   */
  getProblematicEngines(): EngineStatus[] {
    return Array.from(this.engines.values()).filter(
      (e) => e.status === "error" || e.status === "unknown"
    );
  }
}
