#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";
import chalk from "chalk";

// src/bus/index.ts
import { EventEmitter } from "eventemitter3";
import { nanoid } from "nanoid";

// src/utils/logger.ts
import pino from "pino";
var Logger = class {
  logger;
  context;
  constructor(context) {
    this.context = context;
    this.logger = pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss"
        }
      }
    });
  }
  info(message, data) {
    this.logger.info({ context: this.context, ...data }, message);
  }
  debug(message, data) {
    this.logger.debug({ context: this.context, ...data }, message);
  }
  warn(message, data) {
    this.logger.warn({ context: this.context, ...data }, message);
  }
  error(message, data) {
    this.logger.error({ context: this.context, ...data }, message);
  }
};

// src/bus/index.ts
var EventBus = class extends EventEmitter {
  logger;
  handlers = /* @__PURE__ */ new Map();
  eventLog = [];
  maxLogSize = 1e4;
  constructor() {
    super();
    this.logger = new Logger("EventBus");
  }
  /**
   * Publish an event
   */
  publish(source, category, type, data, options = {}) {
    const event = {
      id: nanoid(),
      timestamp: Date.now(),
      source,
      category,
      type,
      data,
      correlationId: options.correlationId,
      causationId: options.causationId,
      processed: false,
      processedBy: []
    };
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
    this.emit(type, event);
    this.emit("*", event);
    this.emit(`${category}.*`, event);
    this.logger.debug(`Event published: ${type}`, { source, category });
    return event;
  }
  /**
   * Subscribe to events
   */
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.handlers.get(eventType).add(handler);
    this.on(eventType, handler);
    this.logger.debug(`Subscribed to: ${eventType}`);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
      this.off(eventType, handler);
    };
  }
  /**
   * Subscribe to all events from an engine
   */
  subscribeToEngine(engine, handler) {
    return this.subscribe("*", (event) => {
      if (event.source === engine) {
        handler(event);
      }
    });
  }
  /**
   * Subscribe to all events in a category
   */
  subscribeToCategory(category, handler) {
    return this.subscribe(`${category}.*`, handler);
  }
  /**
   * Get recent events
   */
  getRecentEvents(count = 100) {
    return this.eventLog.slice(-count);
  }
  /**
   * Get events by type
   */
  getEventsByType(type, count = 100) {
    return this.eventLog.filter((e) => e.type === type).slice(-count);
  }
  /**
   * Get events by source
   */
  getEventsBySource(source, count = 100) {
    return this.eventLog.filter((e) => e.source === source).slice(-count);
  }
  /**
   * Clear event log
   */
  clearLog() {
    this.eventLog = [];
  }
  /**
   * Get stats
   */
  getStats() {
    const eventsBySource = {};
    const eventsByCategory = {};
    for (const event of this.eventLog) {
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
    }
    return {
      totalEvents: this.eventLog.length,
      eventsBySource,
      eventsByCategory,
      handlersCount: Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0)
    };
  }
};
var eventBus = new EventBus();

// src/engines/base-connector.ts
var EngineConnector = class {
  name;
  state;
  eventHandlers = [];
  stateHandlers = [];
  constructor(name) {
    this.name = name;
    this.state = this.initState();
  }
  initState() {
    return {
      name: this.name,
      status: "stopped",
      health: {
        status: "healthy",
        lastCheck: Date.now(),
        uptime: 0,
        errors: 0
      },
      metrics: {
        tasksCompleted: 0,
        tasksPerHour: 0,
        avgTaskDuration: 0
      },
      connected: false,
      lastHeartbeat: 0,
      version: "1.0.0"
    };
  }
  getState() {
    return { ...this.state };
  }
  onEvent(handler) {
    this.eventHandlers.push(handler);
  }
  onStateChange(handler) {
    this.stateHandlers.push(handler);
  }
  emitEvent(type, data) {
    for (const handler of this.eventHandlers) {
      handler(type, data);
    }
  }
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    for (const handler of this.stateHandlers) {
      handler(this.state);
    }
  }
};

// src/engines/brain-connector.ts
var HyperBrainConnector = class extends EngineConnector {
  brain = null;
  apiUrl;
  constructor(apiUrl = "http://localhost:3300") {
    super("brain");
    this.apiUrl = apiUrl;
  }
  /**
   * Set a direct reference to the HyperBrain instance
   */
  setBrain(brain) {
    this.brain = brain;
    this.setupBrainEventForwarding();
  }
  /**
   * Setup event forwarding from HYPER BRAIN to Hub
   */
  setupBrainEventForwarding() {
    if (!this.brain) return;
    this.brain.on("knowledge:added", (item) => {
      this.emitEvent("brain.knowledge.added", {
        itemId: item.id,
        source: item.source.name,
        summary: item.content.summary,
        topics: item.topics,
        importance: item.importance,
        timestamp: item.timestamp
      });
    });
    this.brain.on("pattern:discovered", (pattern) => {
      this.emitEvent("brain.pattern.discovered", {
        patternId: pattern.id,
        name: pattern.name,
        description: pattern.description,
        accuracy: pattern.accuracy,
        confidence: pattern.confidence,
        occurrences: pattern.occurrences
      });
    });
    this.brain.on("prediction:made", (prediction) => {
      this.emitEvent("brain.prediction.made", {
        predictionId: prediction.id,
        type: prediction.type,
        outcome: prediction.prediction.outcome,
        probability: prediction.prediction.probability,
        confidence: prediction.prediction.confidence,
        timeframe: prediction.prediction.timeframe
      });
    });
    this.brain.on("started", () => {
      this.updateState({
        status: "running",
        connected: true,
        lastHeartbeat: Date.now()
      });
      this.emitEvent("brain.started", {});
    });
    this.brain.on("stopped", () => {
      this.updateState({
        status: "stopped",
        connected: false
      });
      this.emitEvent("brain.stopped", {});
    });
  }
  async connect() {
    if (this.brain) {
      this.updateState({
        connected: true,
        status: this.brain.isOnline() ? "running" : "stopped",
        lastHeartbeat: Date.now()
      });
      return;
    }
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        this.updateState({
          connected: true,
          status: health.online ? "running" : "stopped",
          lastHeartbeat: Date.now(),
          health: {
            status: "healthy",
            lastCheck: Date.now(),
            uptime: health.uptime || 0,
            errors: 0
          }
        });
      }
    } catch {
      this.updateState({
        connected: false,
        status: "error",
        health: {
          ...this.state.health,
          status: "unhealthy",
          lastCheck: Date.now()
        }
      });
    }
  }
  async disconnect() {
    this.updateState({
      connected: false,
      status: "stopped"
    });
  }
  async sendCommand(command, params) {
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
            await this.brain.ingestSource(params.source);
          } else {
            await this.brain.ingestAll();
          }
        } else {
          const url = params?.source ? `${this.apiUrl}/ingest/${params.source}` : `${this.apiUrl}/ingest`;
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
        const predictType = params?.type || "market";
        const predictCount = params?.count || 5;
        if (this.brain) {
          await this.brain.predict(predictType, predictCount);
        } else {
          await fetch(`${this.apiUrl}/predictions/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: predictType, count: predictCount })
          });
        }
        break;
      case "search":
        if (params?.query && this.brain) {
          const results = await this.brain.search(params.query, params.limit || 10);
          this.emitEvent("brain.search.results", {
            query: params.query,
            count: results.length,
            results
          });
        }
        break;
    }
  }
  async healthCheck() {
    if (this.brain) {
      const isOnline = this.brain.isOnline();
      this.updateState({
        health: {
          ...this.state.health,
          status: isOnline ? "healthy" : "unhealthy",
          lastCheck: Date.now(),
          uptime: this.brain.getUptime()
        }
      });
      return isOnline;
    }
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        this.updateState({
          health: {
            status: health.status === "ok" ? "healthy" : "degraded",
            lastCheck: Date.now(),
            uptime: health.uptime || 0,
            errors: 0
          }
        });
        return health.online;
      }
      return false;
    } catch {
      this.updateState({
        health: {
          ...this.state.health,
          status: "unhealthy",
          lastCheck: Date.now()
        }
      });
      return false;
    }
  }
  /**
   * Get brain stats (direct or via API)
   */
  async getStats() {
    if (this.brain) {
      return this.brain.getStats();
    }
    const response = await fetch(`${this.apiUrl}/stats`);
    return await response.json();
  }
  /**
   * Search the brain (direct or via API)
   */
  async search(query, limit = 10) {
    if (this.brain) {
      return this.brain.search(query, limit);
    }
    const response = await fetch(`${this.apiUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await response.json();
    return data.results || [];
  }
};

// src/engines/index.ts
var EngineManager = class {
  logger;
  engines = /* @__PURE__ */ new Map();
  constructor() {
    this.logger = new Logger("EngineManager");
  }
  /**
   * Register an engine
   */
  registerEngine(name, connector) {
    this.engines.set(name, connector);
    connector.onEvent((type, data) => {
      eventBus.publish(name, name, type, data);
    });
    connector.onStateChange((state) => {
      eventBus.publish(name, "system", `${name}.state.changed`, { state });
    });
    this.logger.info(`Registered engine: ${name}`);
  }
  /**
   * Get engine state
   */
  getEngineState(name) {
    return this.engines.get(name)?.getState();
  }
  /**
   * Get all engine states
   */
  getAllStates() {
    const states = {};
    for (const [name, connector] of this.engines) {
      states[name] = connector.getState();
    }
    return states;
  }
  /**
   * Send command to engine
   */
  async sendCommand(command) {
    const connector = this.engines.get(command.engine);
    if (!connector) {
      this.logger.error(`Engine not found: ${command.engine}`);
      return false;
    }
    try {
      await connector.sendCommand(command.command, command.params);
      eventBus.publish("hub", "system", "engine.command.sent", {
        engine: command.engine,
        command: command.command
      });
      return true;
    } catch (error) {
      this.logger.error(`Command failed: ${error}`);
      return false;
    }
  }
  /**
   * Start all engines
   */
  async startAll() {
    for (const [name] of this.engines) {
      await this.sendCommand({ engine: name, command: "start" });
    }
  }
  /**
   * Stop all engines
   */
  async stopAll() {
    for (const [name] of this.engines) {
      await this.sendCommand({ engine: name, command: "stop" });
    }
  }
  /**
   * Health check all engines
   */
  async healthCheck() {
    const results = {};
    for (const [name, connector] of this.engines) {
      results[name] = await connector.healthCheck();
    }
    return results;
  }
};
var MockEngineConnector = class extends EngineConnector {
  constructor(name) {
    super(name);
  }
  async connect() {
    this.updateState({
      connected: true,
      status: "running",
      lastHeartbeat: Date.now()
    });
  }
  async disconnect() {
    this.updateState({
      connected: false,
      status: "stopped"
    });
  }
  async sendCommand(command, params) {
    switch (command) {
      case "start":
        this.updateState({ status: "running" });
        break;
      case "stop":
        this.updateState({ status: "stopped" });
        break;
      case "pause":
        this.updateState({ status: "paused" });
        break;
      case "resume":
        this.updateState({ status: "running" });
        break;
    }
  }
  async healthCheck() {
    this.updateState({
      health: {
        ...this.state.health,
        lastCheck: Date.now()
      }
    });
    return this.state.status === "running";
  }
};

// src/api/index.ts
import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
var ApiServer = class {
  app;
  logger;
  wsClients = /* @__PURE__ */ new Set();
  getState;
  constructor(getState) {
    this.logger = new Logger("API");
    this.getState = getState;
    this.app = Fastify({ logger: false });
  }
  async start(port = 3100) {
    await this.app.register(fastifyCors, { origin: true });
    await this.app.register(fastifyWebsocket);
    this.setupRoutes();
    this.setupWebSocket();
    eventBus.subscribe("*", (event) => {
      this.broadcast({ type: "event", payload: event, timestamp: Date.now() });
    });
    await this.app.listen({ port, host: "0.0.0.0" });
    this.logger.info(`API server running on port ${port}`);
  }
  async stop() {
    await this.app.close();
  }
  setupRoutes() {
    this.app.get("/health", async () => {
      return { status: "ok", timestamp: Date.now() };
    });
    this.app.get("/api/state", async () => {
      return { success: true, data: this.getState(), timestamp: Date.now() };
    });
    this.app.get("/api/engines", async () => {
      const state = this.getState();
      return { success: true, data: state.engines, timestamp: Date.now() };
    });
    this.app.get("/api/engines/:name", async (req) => {
      const state = this.getState();
      const engine = state.engines[req.params.name];
      if (!engine) {
        return { success: false, error: "Engine not found", timestamp: Date.now() };
      }
      return { success: true, data: engine, timestamp: Date.now() };
    });
    this.app.get("/api/events", async (req) => {
      const count = parseInt(req.query.count || "100");
      const events = eventBus.getRecentEvents(count);
      return { success: true, data: events, timestamp: Date.now() };
    });
    this.app.get("/api/events/stats", async () => {
      return { success: true, data: eventBus.getStats(), timestamp: Date.now() };
    });
    this.app.post("/api/command", async (req) => {
      const { engine, command, params } = req.body;
      eventBus.publish("hub", "system", "engine.command", { engine, command, params });
      return { success: true, data: { message: "Command sent" }, timestamp: Date.now() };
    });
    this.app.get("/api/metrics", async () => {
      const state = this.getState();
      return { success: true, data: state.metrics, timestamp: Date.now() };
    });
    this.app.get("/api/activity", async () => {
      const state = this.getState();
      return { success: true, data: state.activity, timestamp: Date.now() };
    });
  }
  setupWebSocket() {
    this.app.register(async (fastify) => {
      fastify.get("/ws", { websocket: true }, (socket, req) => {
        this.logger.info("WebSocket client connected");
        this.wsClients.add(socket);
        socket.send(JSON.stringify({
          type: "state",
          payload: this.getState(),
          timestamp: Date.now()
        }));
        socket.on("message", (message) => {
          try {
            const data = JSON.parse(message.toString());
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
  handleWsMessage(socket, message) {
    switch (message.type) {
      case "command":
        eventBus.publish("hub", "system", "engine.command", message.payload);
        break;
      case "response":
        break;
      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
    }
  }
  broadcast(message) {
    const data = JSON.stringify(message);
    for (const client of this.wsClients) {
      try {
        client.send(data);
      } catch (error) {
        this.logger.error(`Broadcast failed: ${error}`);
      }
    }
  }
};

// src/coordinator/workflows.ts
var NEW_FEATURE_ANNOUNCEMENT = {
  id: "wf-new-feature-announcement",
  name: "New Feature Announcement",
  description: "Automatically announce new features across all channels",
  trigger: {
    type: "event",
    eventType: "product.deployed",
    eventFilter: { type: "feature" }
  },
  steps: [
    {
      id: "step-1",
      name: "Generate Blog Post",
      engine: "growth",
      action: "generateBlogPost",
      params: { template: "announcement" },
      onError: "continue",
      timeout: 6e4
    },
    {
      id: "step-2",
      name: "Generate Tweets",
      engine: "growth",
      action: "generateTweets",
      params: { type: "product_update", count: 3 },
      onError: "continue",
      timeout: 3e4
    }
  ],
  status: "active",
  executions: 0,
  avgDuration: 0
};
var PROFITABLE_TRADE_REPORT = {
  id: "wf-profitable-trade",
  name: "Profitable Trade Report",
  description: "Announce significant trading wins",
  trigger: {
    type: "event",
    eventType: "money.trade.executed"
  },
  steps: [
    {
      id: "step-1",
      name: "Log Achievement",
      engine: "orchestrator",
      action: "logActivity",
      params: { type: "TRADING_WIN" },
      onError: "continue",
      timeout: 5e3
    }
  ],
  status: "active",
  executions: 0,
  avgDuration: 0
};
var LOW_TREASURY_ALERT = {
  id: "wf-low-treasury",
  name: "Low Treasury Alert",
  description: "Emergency response when funds are low",
  trigger: {
    type: "event",
    eventType: "money.treasury.low"
  },
  steps: [
    {
      id: "step-1",
      name: "Pause Risky Trading",
      engine: "money",
      action: "pauseTradingBots",
      params: { bots: ["arbitrage", "sniper"] },
      onError: "continue",
      timeout: 5e3
    },
    {
      id: "step-2",
      name: "Alert Orchestrator",
      engine: "orchestrator",
      action: "logActivity",
      params: { type: "TREASURY_ALERT", level: "critical" },
      onError: "stop",
      timeout: 5e3
    }
  ],
  status: "active",
  executions: 0,
  avgDuration: 0
};
var DAILY_SUMMARY = {
  id: "wf-daily-summary",
  name: "Daily Summary",
  description: "Generate and publish daily performance summary",
  trigger: {
    type: "schedule",
    schedule: "0 0 * * *"
    // Midnight UTC
  },
  steps: [
    {
      id: "step-1",
      name: "Get Money Metrics",
      engine: "money",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 1e4
    },
    {
      id: "step-2",
      name: "Get Growth Metrics",
      engine: "growth",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 1e4
    },
    {
      id: "step-3",
      name: "Get Product Metrics",
      engine: "product",
      action: "getDailyMetrics",
      params: {},
      onError: "continue",
      timeout: 1e4
    },
    {
      id: "step-4",
      name: "Generate Report",
      engine: "orchestrator",
      action: "generateDailyReport",
      params: {},
      onError: "stop",
      timeout: 3e4
    }
  ],
  status: "active",
  executions: 0,
  avgDuration: 0
};
var COMPETITOR_RESPONSE = {
  id: "wf-competitor-response",
  name: "Competitor Feature Response",
  description: "Respond to competitor feature launches",
  trigger: {
    type: "event",
    eventType: "product.opportunity.discovered"
  },
  steps: [
    {
      id: "step-1",
      name: "Evaluate Feature",
      engine: "orchestrator",
      action: "evaluateOpportunity",
      params: {},
      onError: "stop",
      timeout: 3e4
    }
  ],
  status: "active",
  executions: 0,
  avgDuration: 0
};
var PREDEFINED_WORKFLOWS = [
  NEW_FEATURE_ANNOUNCEMENT,
  PROFITABLE_TRADE_REPORT,
  LOW_TREASURY_ALERT,
  DAILY_SUMMARY,
  COMPETITOR_RESPONSE
];

// src/system/unified-starter.ts
import { HyperBrain, BrainApiServer } from "@gicm/hyper-brain";
var DEFAULT_CONFIG = {
  hubPort: 3100,
  brainPort: 3300,
  enableBrain: true,
  mockOtherEngines: true,
  verbose: true
};
var UnifiedSystem = class {
  config;
  logger;
  hub;
  brain = null;
  brainApi = null;
  isRunning = false;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger("UnifiedSystem");
    this.hub = new IntegrationHub({
      apiPort: this.config.hubPort,
      enableApi: true,
      enableWorkflows: true,
      mockEngines: this.config.mockOtherEngines
    });
  }
  /**
   * Start the unified system
   */
  async start() {
    if (this.isRunning) return;
    this.logger.info("Starting gICM Unified System...");
    this.isRunning = true;
    if (this.config.enableBrain) {
      await this.startBrain();
    }
    await this.hub.start();
    if (this.config.enableBrain && this.brain) {
      this.wireBrainToHub();
    }
    this.logger.info("gICM Unified System online!");
    this.printStatus();
  }
  /**
   * Stop the unified system
   */
  async stop() {
    if (!this.isRunning) return;
    this.logger.info("Stopping gICM Unified System...");
    await this.hub.stop();
    if (this.brainApi) await this.brainApi.stop();
    if (this.brain) await this.brain.stop();
    this.isRunning = false;
    this.logger.info("gICM Unified System offline");
  }
  /**
   * Start HYPER BRAIN
   */
  async startBrain() {
    this.logger.info("Starting HYPER BRAIN...");
    this.brain = new HyperBrain({
      apiPort: this.config.brainPort
    });
    await this.brain.start();
    this.brainApi = new BrainApiServer(this.brain, {
      port: this.config.brainPort,
      enableWebSocket: true
    });
    await this.brainApi.start();
    this.logger.info(`HYPER BRAIN online at http://localhost:${this.config.brainPort}`);
  }
  /**
   * Wire HYPER BRAIN to Hub
   */
  wireBrainToHub() {
    if (!this.brain) return;
    this.logger.info("Wiring HYPER BRAIN to Hub...");
    const brainConnector = new HyperBrainConnector(`http://localhost:${this.config.brainPort}`);
    brainConnector.setBrain(this.brain);
    const engineManager = this.hub.getEngineManager();
    engineManager.registerEngine("brain", brainConnector);
    brainConnector.connect();
    this.logger.info("HYPER BRAIN wired to Hub");
  }
  /**
   * Get Hub instance
   */
  getHub() {
    return this.hub;
  }
  /**
   * Get HYPER BRAIN instance
   */
  getBrain() {
    return this.brain;
  }
  /**
   * Print system status
   */
  printStatus() {
    console.log("\n  gICM Unified System Status");
    console.log("=".repeat(60));
    const hubState = this.hub.getState();
    console.log(`
  Integration Hub:`);
    console.log(`   Port: ${this.config.hubPort}`);
    console.log(`   Events processed: ${hubState.metrics.eventsProcessed}`);
    console.log(`
  Engines:`);
    for (const [name, engine] of Object.entries(hubState.engines)) {
      const status = engine?.status || "not connected";
      const icon = status === "running" ? "[OK]" : status === "stopped" ? "[--]" : "[??]";
      console.log(`   ${icon} ${name}: ${status}`);
    }
    if (this.brain) {
      const brainStats = this.brain.getStats();
      console.log(`
  HYPER BRAIN:`);
      console.log(`   Knowledge items: ${brainStats.knowledge.total}`);
      console.log(`   Patterns: ${brainStats.patterns.total}`);
      console.log(`   Predictions: ${brainStats.predictions.total}`);
    }
    console.log(`
  Endpoints:`);
    console.log(`   Hub API: http://localhost:${this.config.hubPort}`);
    console.log(`   Hub WebSocket: ws://localhost:${this.config.hubPort}/ws`);
    if (this.config.enableBrain) {
      console.log(`   Brain API: http://localhost:${this.config.brainPort}`);
      console.log(`   Brain WebSocket: ws://localhost:${this.config.brainPort}/ws`);
    }
    console.log("=".repeat(60) + "\n");
  }
};

// src/index.ts
var DEFAULT_CONFIG2 = {
  apiPort: 3100,
  enableApi: true,
  enableWorkflows: true,
  mockEngines: true
};
var IntegrationHub = class {
  config;
  logger;
  engineManager;
  apiServer;
  workflows = /* @__PURE__ */ new Map();
  state;
  isRunning = false;
  startTime = 0;
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG2, ...config };
    this.logger = new Logger("Hub");
    this.engineManager = new EngineManager();
    this.apiServer = new ApiServer(() => this.getState());
    this.state = this.initState();
    if (this.config.enableWorkflows) {
      for (const workflow of PREDEFINED_WORKFLOWS) {
        this.workflows.set(workflow.id, workflow);
      }
    }
    if (this.config.mockEngines) {
      this.registerMockEngines();
    }
  }
  initState() {
    return {
      system: {
        startedAt: 0,
        uptime: 0,
        version: "1.0.0"
      },
      engines: {
        orchestrator: void 0,
        money: void 0,
        growth: void 0,
        product: void 0,
        brain: void 0
      },
      metrics: {
        eventsProcessed: 0,
        workflowsExecuted: 0,
        apiRequests: 0,
        errors: 0
      },
      activity: {
        activeWorkflows: 0,
        pendingTasks: 0,
        recentEvents: []
      }
    };
  }
  registerMockEngines() {
    const engines = ["orchestrator", "money", "growth", "product", "brain"];
    for (const name of engines) {
      const connector = new MockEngineConnector(name);
      this.engineManager.registerEngine(name, connector);
    }
  }
  /**
   * Start the hub
   */
  async start() {
    if (this.isRunning) return;
    this.logger.info("Starting gICM Integration Hub...");
    this.isRunning = true;
    this.startTime = Date.now();
    this.state.system.startedAt = this.startTime;
    this.setupEventHandlers();
    if (this.config.enableApi) {
      await this.apiServer.start(this.config.apiPort);
    }
    if (this.config.mockEngines) {
      await this.engineManager.startAll();
    }
    eventBus.publish("hub", "system", "hub.started", {
      version: this.state.system.version,
      config: this.config
    });
    this.logger.info("Integration Hub running");
    this.printStatus();
  }
  /**
   * Stop the hub
   */
  async stop() {
    if (!this.isRunning) return;
    this.logger.info("Stopping Integration Hub...");
    await this.engineManager.stopAll();
    await this.apiServer.stop();
    eventBus.publish("hub", "system", "hub.stopped", {});
    this.isRunning = false;
    this.logger.info("Integration Hub stopped");
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    eventBus.subscribe("*", (event) => {
      this.state.metrics.eventsProcessed++;
      this.state.activity.recentEvents.unshift(event);
      if (this.state.activity.recentEvents.length > 100) {
        this.state.activity.recentEvents.pop();
      }
    });
    setInterval(() => {
      this.state.system.uptime = Date.now() - this.startTime;
    }, 1e3);
    if (this.config.enableWorkflows) {
      eventBus.subscribe("*", async (event) => {
        await this.checkWorkflowTriggers(event);
      });
    }
  }
  /**
   * Check if event triggers any workflow
   */
  async checkWorkflowTriggers(event) {
    for (const [, workflow] of this.workflows) {
      if (workflow.status !== "active") continue;
      if (workflow.trigger.type !== "event") continue;
      if (workflow.trigger.eventType !== event.type) continue;
      this.logger.info(`Workflow triggered: ${workflow.name}`);
      await this.executeWorkflow(workflow, event);
    }
  }
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow, triggerData) {
    this.state.activity.activeWorkflows++;
    this.state.metrics.workflowsExecuted++;
    this.logger.info(`Executing workflow: ${workflow.name}`);
    workflow.executions++;
    workflow.lastExecuted = Date.now();
    this.state.activity.activeWorkflows--;
  }
  /**
   * Get current state
   */
  getState() {
    this.state.engines = this.engineManager.getAllStates();
    return { ...this.state };
  }
  /**
   * Get event bus instance
   */
  getEventBus() {
    return eventBus;
  }
  /**
   * Get engine manager
   */
  getEngineManager() {
    return this.engineManager;
  }
  /**
   * Print status
   */
  printStatus() {
    const state = this.getState();
    console.log("\n  gICM Integration Hub Status");
    console.log("=".repeat(50));
    console.log(`
  System:`);
    console.log(`   Version: ${state.system.version}`);
    console.log(`   Uptime: ${Math.floor(state.system.uptime / 1e3)}s`);
    console.log(`
  Engines:`);
    for (const [name, engine] of Object.entries(state.engines)) {
      const status = engine?.status || "not connected";
      const icon = status === "running" ? "[OK]" : status === "stopped" ? "[--]" : "[!!]";
      console.log(`   ${icon} ${name}: ${status}`);
    }
    console.log(`
  Metrics:`);
    console.log(`   Events processed: ${state.metrics.eventsProcessed}`);
    console.log(`   Workflows executed: ${state.metrics.workflowsExecuted}`);
    console.log(`
  Workflows: ${this.workflows.size} active`);
    console.log(`
  API: http://localhost:${this.config.apiPort}`);
    console.log(`   WebSocket: ws://localhost:${this.config.apiPort}/ws`);
    console.log("=".repeat(50) + "\n");
  }
};

// src/cli.ts
var program = new Command();
program.name("gicm-hub").description("gICM Integration Hub - Central nervous system for the platform").version("1.0.0");
program.command("start").description("Start the Integration Hub").option("-p, --port <port>", "API port", "3100").option("--no-api", "Disable API server").option("--no-workflows", "Disable workflows").option("--no-mock", "Disable mock engines").action(async (options) => {
  console.log(chalk.cyan.bold(`
   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557
  \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551
  \u2588\u2588\u2551  \u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551
  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2551\u255A\u2588\u2588\u2554\u255D\u2588\u2588\u2551
  \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551 \u255A\u2550\u255D \u2588\u2588\u2551
   \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u255D

  Integration Hub - Central Nervous System
`));
  const hub = new IntegrationHub({
    apiPort: parseInt(options.port),
    enableApi: options.api,
    enableWorkflows: options.workflows,
    mockEngines: options.mock
  });
  console.log(chalk.gray("  Starting gICM Hub..."));
  try {
    await hub.start();
    console.log(chalk.green("  Hub is running!"));
    console.log(chalk.gray("\n  Press Ctrl+C to stop\n"));
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\n\n  Shutting down..."));
      await hub.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(chalk.red(`  Failed to start: ${error}`));
    process.exit(1);
  }
});
program.command("status").description("Show hub status").option("-p, --port <port>", "API port", "3100").action(async (options) => {
  console.log(chalk.cyan.bold("\n  gICM Hub Status\n"));
  try {
    const response = await fetch(`http://localhost:${options.port}/api/state`);
    const data = await response.json();
    if (data.success) {
      const state = data.data;
      console.log("  Engines:");
      for (const [name, engine] of Object.entries(state.engines)) {
        const e = engine;
        const status = e?.status || "unknown";
        const icon = status === "running" ? chalk.green("[OK]") : chalk.gray("[--]");
        console.log(`    ${icon} ${name}: ${status}`);
      }
      console.log("\n  Metrics:");
      console.log(`    Events: ${state.metrics.eventsProcessed}`);
      console.log(`    Workflows: ${state.metrics.workflowsExecuted}`);
      console.log(`    Uptime: ${Math.floor(state.system.uptime / 1e3)}s`);
    } else {
      console.log(chalk.red("  Failed to get status"));
    }
  } catch {
    console.log(chalk.yellow("  Hub is not running. Start with: gicm-hub start"));
  }
  console.log();
});
program.command("events").description("Show recent events").option("-n, --count <count>", "Number of events", "20").option("-p, --port <port>", "API port", "3100").action(async (options) => {
  try {
    const response = await fetch(`http://localhost:${options.port}/api/events?count=${options.count}`);
    const data = await response.json();
    if (data.success) {
      console.log(chalk.cyan.bold("\n  Recent Events\n"));
      if (data.data.length === 0) {
        console.log(chalk.gray("  No events yet"));
      } else {
        for (const event of data.data) {
          const time = new Date(event.timestamp).toLocaleTimeString();
          console.log(`  [${time}] ${event.source} -> ${event.type}`);
        }
      }
    }
  } catch {
    console.log(chalk.yellow("  Hub is not running"));
  }
  console.log();
});
program.command("publish").description("Publish a test event").requiredOption("-t, --type <type>", "Event type").option("-s, --source <source>", "Event source", "hub").option("-d, --data <json>", "Event data (JSON)", "{}").option("-p, --port <port>", "API port", "3100").action(async (options) => {
  try {
    const response = await fetch(`http://localhost:${options.port}/api/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engine: options.source,
        command: "emit",
        params: {
          type: options.type,
          data: JSON.parse(options.data)
        }
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log(chalk.green(`
  Event published: ${options.type}
`));
    } else {
      console.log(chalk.red("  Failed to publish event"));
    }
  } catch (error) {
    console.log(chalk.red(`  Error: ${error}`));
  }
});
program.command("unified").description("Start the full gICM unified system (Hub + HYPER BRAIN)").option("--hub-port <port>", "Hub API port", "3100").option("--brain-port <port>", "HYPER BRAIN API port", "3300").option("--no-brain", "Disable HYPER BRAIN").option("--no-mock", "Disable mock engines").action(async (options) => {
  console.log(chalk.cyan.bold(`
   \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557    \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557
  \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551    \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557
  \u2588\u2588\u2551  \u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551    \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551  \u2588\u2588\u2551
  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2551\u255A\u2588\u2588\u2554\u255D\u2588\u2588\u2551    \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u255A\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2551  \u2588\u2588\u2551
  \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551 \u255A\u2550\u255D \u2588\u2588\u2551    \u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551 \u255A\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D
   \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D  \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u255D

  gICM Unified System - All Engines Connected
`));
  const system = new UnifiedSystem({
    hubPort: parseInt(options.hubPort),
    brainPort: parseInt(options.brainPort),
    enableBrain: options.brain !== false,
    mockOtherEngines: options.mock !== false
  });
  console.log(chalk.gray("  Booting unified system..."));
  try {
    await system.start();
    console.log(chalk.green("\n  gICM Unified System is online!"));
    console.log(chalk.gray("\n  Press Ctrl+C to stop\n"));
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\n\n  Shutting down unified system..."));
      await system.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(chalk.red(`  Failed to start: ${error}`));
    process.exit(1);
  }
});
program.parse();
//# sourceMappingURL=cli.js.map