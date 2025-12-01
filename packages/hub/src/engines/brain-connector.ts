/**
 * HYPER BRAIN Engine Connector
 *
 * Connects HYPER BRAIN to the Integration Hub.
 */

import { EngineConnector } from "./base-connector.js";
import type { HyperBrain } from "@gicm/hyper-brain";

export class HyperBrainConnector extends EngineConnector {
  private brain: HyperBrain | null = null;
  private apiUrl: string;

  constructor(apiUrl: string = "http://localhost:3300") {
    super("brain");
    this.apiUrl = apiUrl;
  }

  /**
   * Set a direct reference to the HyperBrain instance
   */
  setBrain(brain: HyperBrain): void {
    this.brain = brain;
    this.setupBrainEventForwarding();
  }

  /**
   * Setup event forwarding from HYPER BRAIN to Hub
   */
  private setupBrainEventForwarding(): void {
    if (!this.brain) return;

    // Forward knowledge events
    this.brain.on("knowledge:added", (item) => {
      this.emitEvent("brain.knowledge.added", {
        itemId: item.id,
        source: item.source.name,
        summary: item.content.summary,
        topics: item.topics,
        importance: item.importance,
        timestamp: item.timestamp,
      });
    });

    // Forward pattern events
    this.brain.on("pattern:discovered", (pattern) => {
      this.emitEvent("brain.pattern.discovered", {
        patternId: pattern.id,
        name: pattern.name,
        description: pattern.description,
        accuracy: pattern.accuracy,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences,
      });
    });

    // Forward prediction events
    this.brain.on("prediction:made", (prediction) => {
      this.emitEvent("brain.prediction.made", {
        predictionId: prediction.id,
        type: prediction.type,
        outcome: prediction.prediction.outcome,
        probability: prediction.prediction.probability,
        confidence: prediction.prediction.confidence,
        timeframe: prediction.prediction.timeframe,
      });
    });

    // Forward started/stopped events
    this.brain.on("started", () => {
      this.updateState({
        status: "running",
        connected: true,
        lastHeartbeat: Date.now(),
      });
      this.emitEvent("brain.started", {});
    });

    this.brain.on("stopped", () => {
      this.updateState({
        status: "stopped",
        connected: false,
      });
      this.emitEvent("brain.stopped", {});
    });
  }

  async connect(): Promise<void> {
    if (this.brain) {
      // Direct connection via instance reference
      this.updateState({
        connected: true,
        status: this.brain.isOnline() ? "running" : "stopped",
        lastHeartbeat: Date.now(),
      });
      return;
    }

    // API-based connection
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        const health = (await response.json()) as { status: string; online: boolean; uptime?: number };
        this.updateState({
          connected: true,
          status: health.online ? "running" : "stopped",
          lastHeartbeat: Date.now(),
          health: {
            status: "healthy",
            lastCheck: Date.now(),
            uptime: health.uptime || 0,
            errors: 0,
          },
        });
      }
    } catch {
      this.updateState({
        connected: false,
        status: "error",
        health: {
          ...this.state.health,
          status: "unhealthy",
          lastCheck: Date.now(),
        },
      });
    }
  }

  async disconnect(): Promise<void> {
    this.updateState({
      connected: false,
      status: "stopped",
    });
  }

  async sendCommand(command: string, params?: Record<string, unknown>): Promise<void> {
    switch (command) {
      case "start":
        if (this.brain && !this.brain.isOnline()) {
          await this.brain.start();
        }
        this.updateState({ status: "running" });
        break;

      case "stop":
        if (this.brain && this.brain.isOnline()) {
          await this.brain.stop();
        }
        this.updateState({ status: "stopped" });
        break;

      case "ingest":
        if (this.brain) {
          if (params?.source) {
            await this.brain.ingestSource(params.source as string);
          } else {
            await this.brain.ingestAll();
          }
        } else {
          // API fallback
          const url = params?.source
            ? `${this.apiUrl}/ingest/${params.source}`
            : `${this.apiUrl}/ingest`;
          await fetch(url, { method: "POST" });
        }
        break;

      case "analyze":
        if (this.brain) {
          await this.brain.analyzePatterns();
        } else {
          await fetch(`${this.apiUrl}/patterns/analyze`, { method: "POST" });
        }
        break;

      case "predict":
        const predictType = (params?.type as string) || "market";
        const predictCount = (params?.count as number) || 5;
        if (this.brain) {
          await this.brain.predict(predictType as any, predictCount);
        } else {
          await fetch(`${this.apiUrl}/predictions/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: predictType, count: predictCount }),
          });
        }
        break;

      case "search":
        if (params?.query && this.brain) {
          const results = await this.brain.search(params.query as string, (params.limit as number) || 10);
          this.emitEvent("brain.search.results", {
            query: params.query,
            count: results.length,
            results,
          });
        }
        break;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.brain) {
      const isOnline = this.brain.isOnline();
      this.updateState({
        health: {
          ...this.state.health,
          status: isOnline ? "healthy" : "unhealthy",
          lastCheck: Date.now(),
          uptime: this.brain.getUptime(),
        },
      });
      return isOnline;
    }

    // API-based health check
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        const health = (await response.json()) as { status: string; online: boolean; uptime?: number };
        this.updateState({
          health: {
            status: health.status === "ok" ? "healthy" : "degraded",
            lastCheck: Date.now(),
            uptime: health.uptime || 0,
            errors: 0,
          },
        });
        return health.online;
      }
      return false;
    } catch {
      this.updateState({
        health: {
          ...this.state.health,
          status: "unhealthy",
          lastCheck: Date.now(),
        },
      });
      return false;
    }
  }

  /**
   * Get brain stats (direct or via API)
   */
  async getStats(): Promise<Record<string, unknown>> {
    if (this.brain) {
      return this.brain.getStats() as unknown as Record<string, unknown>;
    }

    const response = await fetch(`${this.apiUrl}/stats`);
    return (await response.json()) as Record<string, unknown>;
  }

  /**
   * Search the brain (direct or via API)
   */
  async search(query: string, limit: number = 10): Promise<unknown[]> {
    if (this.brain) {
      return this.brain.search(query, limit);
    }

    const response = await fetch(`${this.apiUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    const data = (await response.json()) as { results?: unknown[] };
    return data.results || [];
  }
}
