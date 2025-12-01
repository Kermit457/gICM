#!/usr/bin/env node
/**
 * gICM Hub CLI
 *
 * Command-line interface for the Integration Hub.
 */

import { Command } from "commander";
import chalk from "chalk";
import { IntegrationHub } from "./index.js";
import { UnifiedSystem } from "./system/unified-starter.js";

const program = new Command();

program
  .name("gicm-hub")
  .description("gICM Integration Hub - Central nervous system for the platform")
  .version("1.0.0");

program
  .command("start")
  .description("Start the Integration Hub")
  .option("-p, --port <port>", "API port", "3100")
  .option("--no-api", "Disable API server")
  .option("--no-workflows", "Disable workflows")
  .option("--no-mock", "Disable mock engines")
  .action(async (options) => {
    console.log(chalk.cyan.bold(`
   ██████╗ ██╗ ██████╗███╗   ███╗
  ██╔════╝ ██║██╔════╝████╗ ████║
  ██║  ███╗██║██║     ██╔████╔██║
  ██║   ██║██║██║     ██║╚██╔╝██║
  ╚██████╔╝██║╚██████╗██║ ╚═╝ ██║
   ╚═════╝ ╚═╝ ╚═════╝╚═╝     ╚═╝

  Integration Hub - Central Nervous System
`));

    const hub = new IntegrationHub({
      apiPort: parseInt(options.port),
      enableApi: options.api,
      enableWorkflows: options.workflows,
      mockEngines: options.mock,
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

program
  .command("status")
  .description("Show hub status")
  .option("-p, --port <port>", "API port", "3100")
  .action(async (options) => {
    console.log(chalk.cyan.bold("\n  gICM Hub Status\n"));

    try {
      const response = await fetch(`http://localhost:${options.port}/api/state`);
      const data = await response.json() as { success: boolean; data: any };

      if (data.success) {
        const state = data.data;

        console.log("  Engines:");
        for (const [name, engine] of Object.entries(state.engines)) {
          const e = engine as { status?: string } | undefined;
          const status = e?.status || "unknown";
          const icon = status === "running" ? chalk.green("[OK]") : chalk.gray("[--]");
          console.log(`    ${icon} ${name}: ${status}`);
        }

        console.log("\n  Metrics:");
        console.log(`    Events: ${state.metrics.eventsProcessed}`);
        console.log(`    Workflows: ${state.metrics.workflowsExecuted}`);
        console.log(`    Uptime: ${Math.floor(state.system.uptime / 1000)}s`);
      } else {
        console.log(chalk.red("  Failed to get status"));
      }
    } catch {
      console.log(chalk.yellow("  Hub is not running. Start with: gicm-hub start"));
    }
    console.log();
  });

program
  .command("events")
  .description("Show recent events")
  .option("-n, --count <count>", "Number of events", "20")
  .option("-p, --port <port>", "API port", "3100")
  .action(async (options) => {
    try {
      const response = await fetch(`http://localhost:${options.port}/api/events?count=${options.count}`);
      const data = await response.json() as { success: boolean; data: any[] };

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

program
  .command("publish")
  .description("Publish a test event")
  .requiredOption("-t, --type <type>", "Event type")
  .option("-s, --source <source>", "Event source", "hub")
  .option("-d, --data <json>", "Event data (JSON)", "{}")
  .option("-p, --port <port>", "API port", "3100")
  .action(async (options) => {
    try {
      const response = await fetch(`http://localhost:${options.port}/api/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: options.source,
          command: "emit",
          params: {
            type: options.type,
            data: JSON.parse(options.data),
          },
        }),
      });

      const data = await response.json() as { success: boolean };

      if (data.success) {
        console.log(chalk.green(`\n  Event published: ${options.type}\n`));
      } else {
        console.log(chalk.red("  Failed to publish event"));
      }
    } catch (error) {
      console.log(chalk.red(`  Error: ${error}`));
    }
  });

program
  .command("unified")
  .description("Start the full gICM unified system (Hub + HYPER BRAIN)")
  .option("--hub-port <port>", "Hub API port", "3100")
  .option("--brain-port <port>", "HYPER BRAIN API port", "3300")
  .option("--no-brain", "Disable HYPER BRAIN")
  .option("--no-mock", "Disable mock engines")
  .action(async (options) => {
    console.log(chalk.cyan.bold(`
   ██████╗ ██╗ ██████╗███╗   ███╗    ██╗   ██╗███╗   ██╗██╗███████╗██╗███████╗██████╗
  ██╔════╝ ██║██╔════╝████╗ ████║    ██║   ██║████╗  ██║██║██╔════╝██║██╔════╝██╔══██╗
  ██║  ███╗██║██║     ██╔████╔██║    ██║   ██║██╔██╗ ██║██║█████╗  ██║█████╗  ██║  ██║
  ██║   ██║██║██║     ██║╚██╔╝██║    ██║   ██║██║╚██╗██║██║██╔══╝  ██║██╔══╝  ██║  ██║
  ╚██████╔╝██║╚██████╗██║ ╚═╝ ██║    ╚██████╔╝██║ ╚████║██║██║     ██║███████╗██████╔╝
   ╚═════╝ ╚═╝ ╚═════╝╚═╝     ╚═╝     ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝╚═════╝

  gICM Unified System - All Engines Connected
`));

    const system = new UnifiedSystem({
      hubPort: parseInt(options.hubPort),
      brainPort: parseInt(options.brainPort),
      enableBrain: options.brain !== false,
      mockOtherEngines: options.mock !== false,
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
