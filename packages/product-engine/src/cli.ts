#!/usr/bin/env node
/**
 * gICM Product Engine CLI
 *
 * Command-line interface for the Product Engine.
 */

// Prevent MaxListenersExceededWarning from pino-pretty
process.setMaxListeners(20);

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { ProductEngine, ComponentBuilder, listComponentTemplates } from "./index.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("CLI");

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const engine = new ProductEngine();

  switch (command) {
    case "start":
      await engine.start();
      logger.info("Product Engine is running. Press Ctrl+C to stop.");

      // Keep running
      process.on("SIGINT", () => {
        engine.stop();
        process.exit(0);
      });
      break;

    case "discover":
      logger.info("Running discovery...");
      const opportunities = await engine.runDiscovery();
      console.log(`\nDiscovered ${opportunities.length} opportunities:\n`);
      opportunities.slice(0, 10).forEach((opp, i) => {
        console.log(`${i + 1}. [${opp.priority}] ${opp.title}`);
        console.log(`   Source: ${opp.source} | Score: ${opp.scores.overall}`);
        console.log(`   ${opp.description.slice(0, 100)}...`);
        console.log();
      });
      break;

    case "backlog":
      const backlog = engine.getBacklog();
      console.log(`\n=== Product Backlog (${backlog.length} items) ===\n`);
      backlog.slice(0, 20).forEach((opp, i) => {
        const icon =
          opp.status === "approved"
            ? "✅"
            : opp.status === "rejected"
            ? "❌"
            : "⏳";
        console.log(`${i + 1}. ${icon} [${opp.priority}] ${opp.title}`);
        console.log(`   ID: ${opp.id}`);
        console.log(`   Score: ${opp.scores.overall} | Source: ${opp.source}`);
        console.log();
      });
      break;

    case "approve":
      const approveId = args[1];
      if (!approveId) {
        logger.error("Usage: product approve <opportunity-id>");
        process.exit(1);
      }
      engine.approveOpportunity(approveId);
      logger.info(`Approved: ${approveId}`);
      break;

    case "reject":
      const rejectId = args[1];
      const reason = args.slice(2).join(" ") || "Rejected via CLI";
      if (!rejectId) {
        logger.error("Usage: product reject <opportunity-id> [reason]");
        process.exit(1);
      }
      engine.rejectOpportunity(rejectId, reason);
      logger.info(`Rejected: ${rejectId}`);
      break;

    case "build":
      logger.info("Processing next build...");
      const task = await engine.processNextBuild();
      if (task) {
        console.log(`\nBuild ${task.status}:`);
        console.log(`  ID: ${task.id}`);
        console.log(`  Type: ${task.type}`);
        console.log(`  Output: ${task.outputPath || "N/A"}`);
        if (task.error) {
          console.log(`  Error: ${task.error}`);
        }
      } else {
        console.log("No opportunities to build. Approve some first!");
      }
      break;

    case "status":
      const status = engine.getStatus();
      console.log("\n=== Product Engine Status ===\n");
      console.log(`Running: ${status.running}`);
      console.log(`Started: ${status.startedAt ? new Date(status.startedAt).toISOString() : "N/A"}`);
      console.log("\nMetrics:");
      console.log(`  Discovered: ${status.metrics.discovered}`);
      console.log(`  Built: ${status.metrics.built}`);
      console.log(`  Deployed: ${status.metrics.deployed}`);
      console.log(`  Failed: ${status.metrics.failed}`);
      console.log(`  Avg Build Time: ${Math.round(status.metrics.avgBuildTime / 1000)}s`);
      console.log(`  Avg Quality Score: ${Math.round(status.metrics.avgQualityScore)}`);
      console.log(`\nBacklog: ${status.backlog.length} items`);
      console.log(`Active Build: ${status.activeBuild?.id || "None"}`);
      console.log(`Recent Builds: ${status.recentBuilds.length}`);
      break;

    case "component":
      const componentCmd = args[1];
      const componentBuilder = new ComponentBuilder();
      switch (componentCmd) {
        case "templates":
          const templates = listComponentTemplates();
          console.log("\n=== Component Templates ===\n");
          templates.forEach((t) => {
            console.log(`  ${t.name}: ${t.description}`);
          });
          break;
        case "build":
          const componentName = args[2];
          if (!componentName) {
            logger.error("Usage: product component build <ComponentName>");
            process.exit(1);
          }
          const spec = {
            name: componentName,
            description: `${componentName} component`,
            props: [
              { name: "className", type: "string", required: false, description: "Custom CSS class" },
            ],
            features: ["Responsive", "Accessible"],
            dependencies: ["react"],
            testCases: [{ name: "renders", description: "Renders without errors" }],
          };
          const buildTask = await componentBuilder.buildComponent(spec);
          console.log(`\nComponent ${buildTask.status}:`);
          console.log(`  Name: ${spec.name}`);
          console.log(`  Output: ${buildTask.outputPath || "N/A"}`);
          buildTask.logs.forEach((log) => console.log(`  - ${log}`));
          break;
        default:
          console.log(`
Component Commands:
  product component templates      List available templates
  product component build <Name>   Build a component
          `);
      }
      break;

    case "help":
    default:
      console.log(`
gICM Product Engine CLI

Usage:
  product start              Start the engine (runs continuously)
  product discover           Run discovery now
  product backlog            View the opportunity backlog
  product approve <id>       Approve an opportunity for building
  product reject <id> [why]  Reject an opportunity
  product build              Build next approved opportunity
  product component <cmd>    Component commands (templates, build)
  product status             Show engine status
  product help               Show this help

Examples:
  product start
  product discover
  product approve opp-gh-123456789
  product build
  product component templates
  product component build TokenBalance
      `);
      break;
  }
}

main().catch((error) => {
  logger.error(`CLI error: ${error}`);
  process.exit(1);
});
