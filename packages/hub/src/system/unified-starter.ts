/**
 * Unified System Starter
 *
 * Boots all gICM engines and wires them to the Integration Hub.
 */

import { IntegrationHub } from "../index.js";
import { HyperBrainConnector } from "../engines/brain-connector.js";
import { HyperBrain, BrainApiServer } from "@gicm/hyper-brain";
import { Logger } from "../utils/logger.js";

export interface UnifiedSystemConfig {
  // Hub
  hubPort: number;

  // HYPER BRAIN
  brainPort: number;
  enableBrain: boolean;

  // Mock other engines
  mockOtherEngines: boolean;

  // Logging
  verbose: boolean;
}

const DEFAULT_CONFIG: UnifiedSystemConfig = {
  hubPort: 3100,
  brainPort: 3300,
  enableBrain: true,
  mockOtherEngines: true,
  verbose: true,
};

export class UnifiedSystem {
  private config: UnifiedSystemConfig;
  private logger: Logger;

  private hub: IntegrationHub;
  private brain: HyperBrain | null = null;
  private brainApi: BrainApiServer | null = null;

  private isRunning = false;

  constructor(config: Partial<UnifiedSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger("UnifiedSystem");

    // Create Hub without mock engines - we'll add real ones
    this.hub = new IntegrationHub({
      apiPort: this.config.hubPort,
      enableApi: true,
      enableWorkflows: true,
      mockEngines: this.config.mockOtherEngines,
    });
  }

  /**
   * Start the unified system
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.logger.info("Starting gICM Unified System...");
    this.isRunning = true;

    // 1. Start HYPER BRAIN if enabled
    if (this.config.enableBrain) {
      await this.startBrain();
    }

    // 2. Start Hub
    await this.hub.start();

    // 3. Wire HYPER BRAIN to Hub
    if (this.config.enableBrain && this.brain) {
      this.wireBrainToHub();
    }

    this.logger.info("gICM Unified System online!");
    this.printStatus();
  }

  /**
   * Stop the unified system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info("Stopping gICM Unified System...");

    // Stop Hub first
    await this.hub.stop();

    // Stop HYPER BRAIN
    if (this.brainApi) await this.brainApi.stop();
    if (this.brain) await this.brain.stop();

    this.isRunning = false;
    this.logger.info("gICM Unified System offline");
  }

  /**
   * Start HYPER BRAIN
   */
  private async startBrain(): Promise<void> {
    this.logger.info("Starting HYPER BRAIN...");

    this.brain = new HyperBrain({
      apiPort: this.config.brainPort,
    });

    await this.brain.start();

    // Start Brain API server
    this.brainApi = new BrainApiServer(this.brain, {
      port: this.config.brainPort,
      enableWebSocket: true,
    });

    await this.brainApi.start();

    this.logger.info(`HYPER BRAIN online at http://localhost:${this.config.brainPort}`);
  }

  /**
   * Wire HYPER BRAIN to Hub
   */
  private wireBrainToHub(): void {
    if (!this.brain) return;

    this.logger.info("Wiring HYPER BRAIN to Hub...");

    // Create connector with direct brain reference
    const brainConnector = new HyperBrainConnector(`http://localhost:${this.config.brainPort}`);
    brainConnector.setBrain(this.brain);

    // Register with Hub's engine manager
    const engineManager = this.hub.getEngineManager();
    engineManager.registerEngine("brain", brainConnector);

    // Connect the engine
    brainConnector.connect();

    this.logger.info("HYPER BRAIN wired to Hub");
  }

  /**
   * Get Hub instance
   */
  getHub(): IntegrationHub {
    return this.hub;
  }

  /**
   * Get HYPER BRAIN instance
   */
  getBrain(): HyperBrain | null {
    return this.brain;
  }

  /**
   * Print system status
   */
  printStatus(): void {
    console.log("\n  gICM Unified System Status");
    console.log("=".repeat(60));

    // Hub status
    const hubState = this.hub.getState();
    console.log(`\n  Integration Hub:`);
    console.log(`   Port: ${this.config.hubPort}`);
    console.log(`   Events processed: ${hubState.metrics.eventsProcessed}`);

    // Engine status
    console.log(`\n  Engines:`);
    for (const [name, engine] of Object.entries(hubState.engines)) {
      const status = engine?.status || "not connected";
      const icon = status === "running" ? "[OK]" : status === "stopped" ? "[--]" : "[??]";
      console.log(`   ${icon} ${name}: ${status}`);
    }

    // HYPER BRAIN stats
    if (this.brain) {
      const brainStats = this.brain.getStats();
      console.log(`\n  HYPER BRAIN:`);
      console.log(`   Knowledge items: ${brainStats.knowledge.total}`);
      console.log(`   Patterns: ${brainStats.patterns.total}`);
      console.log(`   Predictions: ${brainStats.predictions.total}`);
    }

    console.log(`\n  Endpoints:`);
    console.log(`   Hub API: http://localhost:${this.config.hubPort}`);
    console.log(`   Hub WebSocket: ws://localhost:${this.config.hubPort}/ws`);
    if (this.config.enableBrain) {
      console.log(`   Brain API: http://localhost:${this.config.brainPort}`);
      console.log(`   Brain WebSocket: ws://localhost:${this.config.brainPort}/ws`);
    }

    console.log("=".repeat(60) + "\n");
  }
}
