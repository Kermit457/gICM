/**
 * HYPER BRAIN API Server
 *
 * HTTP + WebSocket API for real-time knowledge queries.
 */

import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import type { HyperBrain } from "../index.js";
import { Logger } from "../utils/logger.js";

interface ApiConfig {
  port: number;
  host: string;
  enableWebSocket: boolean;
}

const DEFAULT_CONFIG: ApiConfig = {
  port: 3300,
  host: "0.0.0.0",
  enableWebSocket: true,
};

export class BrainApiServer {
  private app: FastifyInstance;
  private brain: HyperBrain;
  private config: ApiConfig;
  private logger: Logger;
  private wsClients: Set<WebSocket> = new Set();

  constructor(brain: HyperBrain, config: Partial<ApiConfig> = {}) {
    this.brain = brain;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger("BrainAPI");

    this.app = Fastify({ logger: false });
  }

  async start(): Promise<void> {
    // Register plugins
    await this.app.register(cors, { origin: true });

    if (this.config.enableWebSocket) {
      await this.app.register(websocket);
    }

    // Setup routes
    this.setupRoutes();

    // Setup WebSocket
    if (this.config.enableWebSocket) {
      this.setupWebSocket();
    }

    // Setup brain event forwarding
    this.setupEventForwarding();

    // Start server
    await this.app.listen({ port: this.config.port, host: this.config.host });
    this.logger.info(`API server running on http://${this.config.host}:${this.config.port}`);
  }

  async stop(): Promise<void> {
    await this.app.close();
    this.logger.info("API server stopped");
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", async () => ({
      status: "ok",
      online: this.brain.isOnline(),
      uptime: this.brain.getUptime(),
    }));

    // Stats
    this.app.get("/stats", async () => this.brain.getStats());

    // Search
    this.app.get<{ Querystring: { q: string; limit?: string } }>(
      "/search",
      async (request) => {
        const { q, limit = "10" } = request.query;
        if (!q) {
          return { error: "Query parameter 'q' is required" };
        }
        const results = await this.brain.search(q, parseInt(limit));
        return { query: q, count: results.length, results };
      }
    );

    // Advanced search
    this.app.post<{
      Body: {
        query: string;
        limit?: number;
        sources?: string[];
        topics?: string[];
        minImportance?: number;
        timeRange?: { from: number; to: number };
      };
    }>("/search/advanced", async (request) => {
      const { query, limit = 10, sources, topics, minImportance, timeRange } = request.body;
      const results = await this.brain.advancedSearch(query, {
        limit,
        filters: {
          sources,
          topics,
          minImportance,
          after: timeRange?.from,
          before: timeRange?.to,
        },
      });
      return { query, count: results.length, results };
    });

    // Get similar items
    this.app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
      "/similar/:id",
      async (request) => {
        const { id } = request.params;
        const { limit = "10" } = request.query;
        const results = await this.brain.getSimilar(id, parseInt(limit));
        return { itemId: id, count: results.length, results };
      }
    );

    // Get by topic
    this.app.get<{ Params: { topic: string }; Querystring: { limit?: string } }>(
      "/topic/:topic",
      async (request) => {
        const { topic } = request.params;
        const { limit = "20" } = request.query;
        const items = this.brain.getByTopic(topic, parseInt(limit));
        return { topic, count: items.length, items };
      }
    );

    // Get recent
    this.app.get<{ Querystring: { limit?: string } }>("/recent", async (request) => {
      const { limit = "20" } = request.query;
      const items = this.brain.getRecent(parseInt(limit));
      return { count: items.length, items };
    });

    // Patterns
    this.app.get("/patterns", async () => {
      const patterns = this.brain.getPatterns();
      const stats = this.brain.getPatternStats();
      return { stats, patterns };
    });

    // Analyze patterns
    this.app.post("/patterns/analyze", async () => {
      const newPatterns = await this.brain.analyzePatterns();
      return { discovered: newPatterns.length, patterns: newPatterns };
    });

    // Predictions
    this.app.get("/predictions", async () => {
      const predictions = this.brain.getPredictions();
      const stats = this.brain.getPredictionStats();
      return { stats, predictions };
    });

    // Generate predictions
    this.app.post<{ Body: { type: string; count?: number } }>(
      "/predictions/generate",
      async (request) => {
        const { type, count = 5 } = request.body;
        const validTypes = ["market", "content", "product", "agent"];
        if (!validTypes.includes(type)) {
          return { error: `Invalid type. Use: ${validTypes.join(", ")}` };
        }
        const predictions = await this.brain.predict(type as any, count);
        return { type, count: predictions.length, predictions };
      }
    );

    // Evaluate predictions
    this.app.post("/predictions/evaluate", async () => {
      const result = await this.brain.evaluatePredictions();
      return result;
    });

    // Ingest
    this.app.post("/ingest", async () => {
      const stats = await this.brain.ingestAll();
      return { success: true, stats };
    });

    // Ingest specific source
    this.app.post<{ Params: { source: string } }>("/ingest/:source", async (request) => {
      const { source } = request.params;
      const count = await this.brain.ingestSource(source);
      return { success: true, source, itemsIngested: count };
    });

    // Ingestion stats
    this.app.get("/ingest/stats", async () => this.brain.getIngestStats());
  }

  private setupWebSocket(): void {
    this.app.get("/ws", { websocket: true }, (socket) => {
      this.wsClients.add(socket as unknown as WebSocket);
      this.logger.info(`WebSocket client connected (${this.wsClients.size} total)`);

      socket.on("message", (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWsMessage(socket, data);
        } catch {
          socket.send(JSON.stringify({ error: "Invalid JSON" }));
        }
      });

      socket.on("close", () => {
        this.wsClients.delete(socket as unknown as WebSocket);
        this.logger.info(`WebSocket client disconnected (${this.wsClients.size} total)`);
      });

      // Send initial state
      socket.send(
        JSON.stringify({
          type: "connected",
          stats: this.brain.getStats(),
        })
      );
    });
  }

  private handleWsMessage(socket: any, data: any): void {
    switch (data.type) {
      case "search":
        this.brain.search(data.query, data.limit || 10).then((results) => {
          socket.send(JSON.stringify({ type: "search_results", query: data.query, results }));
        });
        break;

      case "subscribe":
        // Client wants to subscribe to events
        socket.send(JSON.stringify({ type: "subscribed", events: data.events || ["all"] }));
        break;

      case "stats":
        socket.send(JSON.stringify({ type: "stats", stats: this.brain.getStats() }));
        break;

      case "ping":
        socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;

      default:
        socket.send(JSON.stringify({ error: `Unknown message type: ${data.type}` }));
    }
  }

  private setupEventForwarding(): void {
    // Forward brain events to WebSocket clients
    this.brain.on("knowledge:added", (item) => {
      this.broadcast({
        type: "knowledge:added",
        item: {
          id: item.id,
          source: item.source.name,
          summary: item.content.summary,
          topics: item.topics,
          importance: item.importance,
          timestamp: item.timestamp,
        },
      });
    });

    this.brain.on("pattern:discovered", (pattern) => {
      this.broadcast({
        type: "pattern:discovered",
        pattern: {
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          accuracy: pattern.accuracy,
          confidence: pattern.confidence,
        },
      });
    });

    this.brain.on("prediction:made", (prediction) => {
      this.broadcast({
        type: "prediction:made",
        prediction: {
          id: prediction.id,
          type: prediction.type,
          outcome: prediction.prediction.outcome,
          probability: prediction.prediction.probability,
          confidence: prediction.prediction.confidence,
        },
      });
    });
  }

  private broadcast(message: object): void {
    const json = JSON.stringify(message);
    for (const client of this.wsClients) {
      try {
        (client as any).send(json);
      } catch {
        this.wsClients.delete(client);
      }
    }
  }
}
