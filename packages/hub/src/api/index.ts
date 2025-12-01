/**
 * API Server
 *
 * REST + WebSocket API for Dashboard and external access.
 */

import Fastify, { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import type { HubState, WebSocketMessage, EngineName } from "../core/types.js";
import { eventBus } from "../bus/index.js";
import { Logger } from "../utils/logger.js";
import type { WebSocket } from "ws";

export class ApiServer {
  private app: FastifyInstance;
  private logger: Logger;
  private wsClients: Set<WebSocket> = new Set();
  private getState: () => HubState;

  constructor(getState: () => HubState) {
    this.logger = new Logger("API");
    this.getState = getState;
    this.app = Fastify({ logger: false });
  }

  async start(port: number = 3100): Promise<void> {
    // Register plugins
    await this.app.register(fastifyCors, { origin: true });
    await this.app.register(fastifyWebsocket);

    // Setup routes
    this.setupRoutes();
    this.setupWebSocket();

    // Subscribe to events for WebSocket broadcast
    eventBus.subscribe("*", (event) => {
      this.broadcast({ type: "event", payload: event, timestamp: Date.now() });
    });

    await this.app.listen({ port, host: "0.0.0.0" });
    this.logger.info(`API server running on port ${port}`);
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", async () => {
      return { status: "ok", timestamp: Date.now() };
    });

    // Get full state
    this.app.get("/api/state", async () => {
      return { success: true, data: this.getState(), timestamp: Date.now() };
    });

    // Get engine states
    this.app.get("/api/engines", async () => {
      const state = this.getState();
      return { success: true, data: state.engines, timestamp: Date.now() };
    });

    // Get specific engine
    this.app.get<{ Params: { name: string } }>("/api/engines/:name", async (req) => {
      const state = this.getState();
      const engine = state.engines[req.params.name as EngineName];
      if (!engine) {
        return { success: false, error: "Engine not found", timestamp: Date.now() };
      }
      return { success: true, data: engine, timestamp: Date.now() };
    });

    // Get recent events
    this.app.get<{ Querystring: { count?: string } }>("/api/events", async (req) => {
      const count = parseInt(req.query.count || "100");
      const events = eventBus.getRecentEvents(count);
      return { success: true, data: events, timestamp: Date.now() };
    });

    // Get event bus stats
    this.app.get("/api/events/stats", async () => {
      return { success: true, data: eventBus.getStats(), timestamp: Date.now() };
    });

    // Send command to engine
    this.app.post<{ Body: { engine: string; command: string; params?: unknown } }>("/api/command", async (req) => {
      const { engine, command, params } = req.body;

      // Publish command event
      eventBus.publish("hub", "system", "engine.command", { engine, command, params });

      return { success: true, data: { message: "Command sent" }, timestamp: Date.now() };
    });

    // Get metrics
    this.app.get("/api/metrics", async () => {
      const state = this.getState();
      return { success: true, data: state.metrics, timestamp: Date.now() };
    });

    // Get activity
    this.app.get("/api/activity", async () => {
      const state = this.getState();
      return { success: true, data: state.activity, timestamp: Date.now() };
    });
  }

  private setupWebSocket(): void {
    this.app.register(async (fastify) => {
      fastify.get("/ws", { websocket: true }, (socket, req) => {
        this.logger.info("WebSocket client connected");
        this.wsClients.add(socket);

        // Send initial state
        socket.send(JSON.stringify({
          type: "state",
          payload: this.getState(),
          timestamp: Date.now(),
        }));

        socket.on("message", (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString()) as WebSocketMessage;
            this.handleWsMessage(socket, data);
          } catch (error) {
            this.logger.error(`Invalid WebSocket message: ${error}`);
          }
        });

        socket.on("close", () => {
          this.logger.info("WebSocket client disconnected");
          this.wsClients.delete(socket);
        });
      });
    });
  }

  private handleWsMessage(socket: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case "command":
        eventBus.publish("hub", "system", "engine.command", message.payload as Record<string, unknown>);
        break;

      case "response":
        // Handle response
        break;

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  private broadcast(message: WebSocketMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.wsClients) {
      try {
        client.send(data);
      } catch (error) {
        this.logger.error(`Broadcast failed: ${error}`);
      }
    }
  }
}
