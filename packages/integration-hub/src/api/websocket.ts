/**
 * WebSocket Manager
 *
 * Manages WebSocket connections with room-based subscriptions.
 * Integrates with Fastify via @fastify/websocket.
 */

import { EventEmitter } from "eventemitter3";
import { randomUUID } from "crypto";
import type { WebSocket } from "ws";
import type { FastifyInstance } from "fastify";
import {
  type WSEvent,
  type WSEventType,
  type ClientMessage,
  ClientMessageSchema,
  ROOM_PATTERNS,
} from "./ws-types.js";

// =========================================================================
// TYPES
// =========================================================================

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  rooms: Set<string>;
  connectedAt: Date;
  lastPing: Date;
  userId?: string;
  metadata: Record<string, unknown>;
}

export interface WebSocketManagerConfig {
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Client timeout in ms (default: 60000) */
  clientTimeout?: number;
  /** Max clients per room (default: 1000) */
  maxClientsPerRoom?: number;
  /** Max rooms per client (default: 50) */
  maxRoomsPerClient?: number;
}

export interface WebSocketManagerEvents {
  "client:connected": (client: WebSocketClient) => void;
  "client:disconnected": (clientId: string) => void;
  "client:message": (clientId: string, message: ClientMessage) => void;
  "room:joined": (clientId: string, room: string) => void;
  "room:left": (clientId: string, room: string) => void;
  "broadcast": (room: string, event: WSEvent) => void;
  "error": (error: Error) => void;
}

// =========================================================================
// WEBSOCKET MANAGER
// =========================================================================

export class WebSocketManager extends EventEmitter<WebSocketManagerEvents> {
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // room -> clientIds
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private config: Required<WebSocketManagerConfig>;
  private isRunning = false;

  constructor(config: WebSocketManagerConfig = {}) {
    super();
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000,
      clientTimeout: config.clientTimeout || 60000,
      maxClientsPerRoom: config.maxClientsPerRoom || 1000,
      maxRoomsPerClient: config.maxRoomsPerClient || 50,
    };
  }

  /**
   * Start the WebSocket manager
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
      this.cleanupStaleClients();
    }, this.config.heartbeatInterval);

    console.log("[WebSocket] Manager started");
  }

  /**
   * Stop the WebSocket manager
   */
  stop(): void {
    this.isRunning = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close all connections
    for (const client of this.clients.values()) {
      client.socket.close(1001, "Server shutting down");
    }

    this.clients.clear();
    this.rooms.clear();

    console.log("[WebSocket] Manager stopped");
  }

  /**
   * Register Fastify WebSocket routes
   */
  registerRoutes(fastify: FastifyInstance): void {
    // Main WebSocket endpoint
    fastify.get("/ws", { websocket: true }, (connection, req) => {
      this.handleConnection(connection.socket, req.headers["x-user-id"] as string | undefined);
    });

    // Pipeline-specific WebSocket endpoint
    fastify.get("/ws/pipeline/:executionId", { websocket: true }, (connection, req) => {
      const { executionId } = req.params as { executionId: string };
      const client = this.handleConnection(connection.socket);
      if (client) {
        this.joinRoom(client.id, ROOM_PATTERNS.pipeline(executionId));
      }
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: WebSocket, userId?: string): WebSocketClient | null {
    const clientId = randomUUID();
    const client: WebSocketClient = {
      id: clientId,
      socket,
      rooms: new Set(),
      connectedAt: new Date(),
      lastPing: new Date(),
      userId,
      metadata: {},
    };

    this.clients.set(clientId, client);
    this.emit("client:connected", client);

    // Send connected event
    this.sendToClient(clientId, {
      type: "system:connected",
      payload: {
        clientId,
        connectedAt: client.connectedAt.toISOString(),
        rooms: [],
      },
      timestamp: new Date().toISOString(),
    });

    // Handle messages
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        this.sendError(clientId, "INVALID_MESSAGE", "Failed to parse message");
      }
    });

    // Handle close
    socket.on("close", () => {
      this.handleDisconnect(clientId);
    });

    // Handle error
    socket.on("error", (error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
      this.emit("error", error);
    });

    // Handle pong
    socket.on("pong", () => {
      client.lastPing = new Date();
    });

    console.log(`[WebSocket] Client connected: ${clientId}`);
    return client;
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave all rooms
    for (const room of client.rooms) {
      this.leaveRoom(clientId, room);
    }

    this.clients.delete(clientId);
    this.emit("client:disconnected", clientId);
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
  }

  /**
   * Handle client message
   */
  private handleMessage(clientId: string, rawMessage: unknown): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate message
    const result = ClientMessageSchema.safeParse(rawMessage);
    if (!result.success) {
      this.sendError(clientId, "INVALID_MESSAGE", result.error.message);
      return;
    }

    const message = result.data;
    this.emit("client:message", clientId, message);

    switch (message.action) {
      case "subscribe":
        for (const room of message.rooms) {
          this.joinRoom(clientId, room);
        }
        break;

      case "unsubscribe":
        for (const room of message.rooms) {
          this.leaveRoom(clientId, room);
        }
        break;

      case "ping":
        client.lastPing = new Date();
        this.sendToClient(clientId, {
          type: "system:heartbeat",
          payload: {
            timestamp: new Date().toISOString(),
            serverTime: Date.now(),
            uptime: process.uptime(),
          },
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  /**
   * Join a room
   */
  joinRoom(clientId: string, room: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    // Check limits
    if (client.rooms.size >= this.config.maxRoomsPerClient) {
      this.sendError(clientId, "MAX_ROOMS", "Maximum rooms per client exceeded");
      return false;
    }

    const roomClients = this.rooms.get(room);
    if (roomClients && roomClients.size >= this.config.maxClientsPerRoom) {
      this.sendError(clientId, "ROOM_FULL", "Room is at capacity");
      return false;
    }

    // Add to room
    client.rooms.add(room);
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(clientId);

    // Send confirmation
    this.sendToClient(clientId, {
      type: "room:joined",
      payload: {
        room,
        clientId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      room,
    });

    this.emit("room:joined", clientId, room);
    console.log(`[WebSocket] Client ${clientId} joined room: ${room}`);
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(clientId: string, room: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.rooms.delete(room);
    this.rooms.get(room)?.delete(clientId);

    // Cleanup empty rooms
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room);
    }

    // Send confirmation
    this.sendToClient(clientId, {
      type: "room:left",
      payload: {
        room,
        clientId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      room,
    });

    this.emit("room:left", clientId, room);
    return true;
  }

  /**
   * Broadcast event to room
   */
  broadcast(room: string, event: Omit<WSEvent, "timestamp">): void {
    const fullEvent: WSEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      room,
    };

    const clients = this.rooms.get(room);
    if (!clients) return;

    for (const clientId of clients) {
      this.sendToClient(clientId, fullEvent);
    }

    this.emit("broadcast", room, fullEvent);
  }

  /**
   * Broadcast to all clients
   */
  broadcastAll(event: Omit<WSEvent, "timestamp" | "room">): void {
    const fullEvent: WSEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    for (const client of this.clients.values()) {
      this.sendRaw(client.socket, fullEvent);
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(clientId: string, event: WSEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    return this.sendRaw(client.socket, event);
  }

  /**
   * Send error to client
   */
  sendError(clientId: string, code: string, message: string): void {
    this.sendToClient(clientId, {
      type: "system:error",
      payload: { code, message },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send raw message to socket
   */
  private sendRaw(socket: WebSocket, data: unknown): boolean {
    if (socket.readyState !== socket.OPEN) return false;

    try {
      socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("[WebSocket] Send error:", error);
      return false;
    }
  }

  /**
   * Send heartbeat to all clients
   */
  private sendHeartbeat(): void {
    const heartbeat: WSEvent = {
      type: "system:heartbeat",
      payload: {
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    };

    for (const client of this.clients.values()) {
      // Send ping frame
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.ping();
      }
    }
  }

  /**
   * Cleanup stale clients
   */
  private cleanupStaleClients(): void {
    const now = Date.now();
    const timeout = this.config.clientTimeout;

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing.getTime() > timeout) {
        console.log(`[WebSocket] Client ${clientId} timed out`);
        client.socket.close(1001, "Connection timeout");
        this.handleDisconnect(clientId);
      }
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get client by ID
   */
  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients in room
   */
  getRoomClients(room: string): WebSocketClient[] {
    const clientIds = this.rooms.get(room);
    if (!clientIds) return [];

    return Array.from(clientIds)
      .map((id) => this.clients.get(id))
      .filter((c): c is WebSocketClient => c !== undefined);
  }

  /**
   * Get connection stats
   */
  getStats(): {
    totalClients: number;
    totalRooms: number;
    clientsPerRoom: Record<string, number>;
  } {
    const clientsPerRoom: Record<string, number> = {};
    for (const [room, clients] of this.rooms.entries()) {
      clientsPerRoom[room] = clients.size;
    }

    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      clientsPerRoom,
    };
  }

  // =========================================================================
  // CONVENIENCE BROADCAST METHODS
  // =========================================================================

  /**
   * Broadcast pipeline started event
   */
  broadcastPipelineStarted(executionId: string, payload: {
    pipelineId: string;
    pipelineName: string;
    steps: Array<{ id: string; tool: string }>;
  }): void {
    this.broadcast(ROOM_PATTERNS.pipeline(executionId), {
      type: "pipeline:started",
      payload: {
        executionId,
        ...payload,
        startedAt: new Date().toISOString(),
        steps: payload.steps.map((s) => ({ ...s, status: "pending" })),
      },
    });
  }

  /**
   * Broadcast pipeline progress
   */
  broadcastPipelineProgress(executionId: string, progress: number, currentStep?: string, message?: string): void {
    this.broadcast(ROOM_PATTERNS.pipeline(executionId), {
      type: "pipeline:progress",
      payload: { executionId, progress, currentStep, message },
    });
  }

  /**
   * Broadcast pipeline step event
   */
  broadcastPipelineStep(
    executionId: string,
    stepId: string,
    tool: string,
    status: "started" | "completed" | "failed",
    extra?: { duration?: number; tokens?: number; cost?: number; error?: string; result?: unknown }
  ): void {
    this.broadcast(ROOM_PATTERNS.pipeline(executionId), {
      type: `pipeline:step:${status}` as WSEventType,
      payload: {
        executionId,
        stepId,
        tool,
        status,
        ...(status === "started" ? { startedAt: new Date().toISOString() } : {}),
        ...(status !== "started" ? { completedAt: new Date().toISOString() } : {}),
        ...extra,
      },
    });
  }

  /**
   * Broadcast pipeline completed
   */
  broadcastPipelineCompleted(executionId: string, payload: {
    pipelineId: string;
    status: "completed" | "failed" | "cancelled";
    duration: number;
    totalTokens: number;
    totalCost: number;
    steps: Array<{ id: string; tool: string; status: string; duration?: number; tokens?: number }>;
    error?: string;
    result?: unknown;
  }): void {
    this.broadcast(ROOM_PATTERNS.pipeline(executionId), {
      type: payload.status === "completed" ? "pipeline:completed" : "pipeline:failed",
      payload: {
        executionId,
        ...payload,
        completedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast queue stats
   */
  broadcastQueueStats(stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
    throughput?: number;
  }): void {
    this.broadcast(ROOM_PATTERNS.queue(), {
      type: "queue:stats",
      payload: stats,
    });
  }

  /**
   * Broadcast analytics update
   */
  broadcastAnalyticsUpdate(payload: {
    period: "day" | "hour" | "minute";
    executions: number;
    successful: number;
    failed: number;
    tokens: number;
    cost: number;
    avgDuration: number;
  }): void {
    this.broadcast(ROOM_PATTERNS.analytics(), {
      type: "analytics:update",
      payload,
    });
  }
}

// =========================================================================
// SINGLETON
// =========================================================================

let wsManagerInstance: WebSocketManager | null = null;

/**
 * Get or create WebSocket manager singleton
 */
export function getWebSocketManager(config?: WebSocketManagerConfig): WebSocketManager {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager(config);
  }
  return wsManagerInstance;
}

/**
 * Create a new WebSocket manager instance
 */
export function createWebSocketManager(config?: WebSocketManagerConfig): WebSocketManager {
  return new WebSocketManager(config);
}
