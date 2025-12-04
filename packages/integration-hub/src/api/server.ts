/**
 * API Server - Fastify REST + WebSocket server
 */

import Fastify, { type FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import type { IntegrationHub } from "../hub.js";
import { registerRoutes } from "./routes.js";
import authPlugin from "./auth-plugin.js";

export interface ApiServerConfig {
  port?: number;
  host?: string;
}

export class ApiServer {
  private fastify: FastifyInstance;
  private hub: IntegrationHub;
  private config: Required<ApiServerConfig>;

  constructor(hub: IntegrationHub, config?: ApiServerConfig) {
    this.hub = hub;
    this.config = {
      port: config?.port ?? 3001,  // Dashboard expects 3001
      host: config?.host ?? "0.0.0.0",
    };

    this.fastify = Fastify({
      logger: false,
    });
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    // Register CORS - Secure configuration
    await this.fastify.register(fastifyCors, {
      origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) return cb(null, true);

        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3200",
          "https://gicm.dev",
          "https://dashboard.gicm.dev",
          "https://gicm-dashboard.vercel.app",
          process.env.DASHBOARD_URL,
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          // Log unauthorized origin attempts in development
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[HUB-API] CORS blocked origin: ${origin}`);
          }
          cb(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    // Register WebSocket
    await this.fastify.register(fastifyWebsocket);

    // Register Authentication plugin
    await this.fastify.register(authPlugin, {
      jwtSecret: process.env.GICM_JWT_SECRET,
      apiKeyPrefix: process.env.GICM_API_KEY_PREFIX || "gicm",
      enabled: process.env.NODE_ENV === "production" || process.env.GICM_AUTH_ENABLED === "true",
      publicRoutes: [
        "/",
        "/health",
        "/ws",
        "/api/status",
        "/api/brain/status",
        "/api/events",
        "/api/events/*",
        "/api/predictions/*",
        "/api/v1/predictions/*",
        "/api/autonomy/status",
        "/api/money/status",
        "/api/growth/status",
        "/api/product/status",
        "/api/hunter/status",
      ],
    });

    // Register REST routes
    await registerRoutes(this.fastify, this.hub);

    // WebSocket endpoint
    this.fastify.get("/ws", { websocket: true }, (socket) => {
      console.log("[HUB-API] WebSocket client connected");

      // Send welcome message immediately
      socket.send(JSON.stringify({
        type: "connected",
        timestamp: Date.now(),
        message: "Connected to gICM Hub"
      }));

      // Subscribe to all events
      const handler = (event: any) => {
        try {
          socket.send(JSON.stringify(event));
        } catch {
          // Client disconnected
        }
      };

      this.hub.getEventBus().on("*", handler);

      socket.on("close", () => {
        console.log("[HUB-API] WebSocket client disconnected");
        this.hub.getEventBus().off("*", handler);
      });

      socket.on("error", (err) => {
        console.log("[HUB-API] WebSocket error:", err.message);
      });

      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Handle incoming commands
          if (data.type === "ping") {
            socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          } else if (data.type === "subscribe") {
            // Acknowledge subscription request
            socket.send(JSON.stringify({
              type: "subscribed",
              channels: data.channels || [],
              timestamp: Date.now()
            }));
          } else if (data.action === "subscribe") {
            // Alternative format from useWebSocket hook
            socket.send(JSON.stringify({
              type: "subscribed",
              rooms: data.rooms || [],
              timestamp: Date.now()
            }));
          }
        } catch {
          // Invalid message - ignore
        }
      });
    });

    // Health check
    this.fastify.get("/health", async () => {
      return { ok: true, timestamp: Date.now() };
    });

    // Root route - API info
    this.fastify.get("/", async () => {
      return {
        service: "gICM Integration Hub",
        version: "0.1.0",
        status: "running",
        endpoints: {
          health: "/health",
          api: "/api",
          websocket: "/ws",
          status: "/api/status",
          brain: "/api/brain/status",
        },
        timestamp: Date.now(),
      };
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    await this.fastify.listen({
      port: this.config.port,
      host: this.config.host,
    });

    console.log("[HUB-API] Server listening on port", this.config.port);
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await this.fastify.close();
    console.log("[HUB-API] Server stopped");
  }

  /**
   * Get the Fastify instance
   */
  getFastify(): FastifyInstance {
    return this.fastify;
  }
}
