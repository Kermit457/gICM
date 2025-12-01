#!/usr/bin/env node
import {
  getAutonomy
} from "./chunk-OG36YOXN.js";
import "./chunk-WPRSQQBZ.js";
import "./chunk-G7ZQ5H4K.js";
import "./chunk-LO6AQCOL.js";
import "./chunk-LCZP4RP6.js";
import "./chunk-TENKIGAJ.js";
import "./chunk-GBFIXON4.js";
import "./chunk-ZB2ZVSPL.js";

// src/cli.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
var program = new Command();
program.name("gicm-autonomy").description("Level 2+ Autonomy system for gICM platform").version("1.0.0");
program.command("status").description("Show autonomy engine status").action(() => {
  const autonomy = getAutonomy();
  const status = autonomy.getStatus();
  console.log(chalk.cyan("\n=== gICM Autonomy Status ===\n"));
  console.log(chalk.yellow("Engine:"));
  console.log(`  Running: ${status.running ? chalk.green("Yes") : chalk.red("No")}`);
  console.log(`  Level: ${status.level}`);
  console.log(chalk.yellow("\nQueue:"));
  console.log(`  Pending: ${status.queue.pending}`);
  console.log(`  By Urgency: ${JSON.stringify(status.queue.byUrgency)}`);
  console.log(chalk.yellow("\nUsage Today:"));
  console.log(`  Trades: ${status.usage.trades}`);
  console.log(`  Content: ${status.usage.content}`);
  console.log(`  Builds: ${status.usage.builds}`);
  console.log(`  Spending: $${status.usage.spending.toFixed(2)}`);
  console.log(chalk.yellow("\nExecutor:"));
  console.log(`  Total Executions: ${status.executor.totalExecutions}`);
  console.log(`  Currently Executing: ${status.executor.currentlyExecuting}`);
  console.log(`  In Cooldown: ${status.executor.failedInCooldown}`);
  console.log(chalk.yellow("\nAudit:"));
  console.log(`  Total Entries: ${status.audit.totalEntries}`);
  console.log();
});
program.command("queue").description("List pending approvals").option("--json", "Output as JSON").action((options) => {
  const autonomy = getAutonomy();
  const queue = autonomy.getQueue();
  if (options.json) {
    console.log(JSON.stringify(queue, null, 2));
    return;
  }
  console.log(chalk.cyan("\n=== Pending Approvals ===\n"));
  if (queue.length === 0) {
    console.log(chalk.green("No pending approvals\n"));
    return;
  }
  for (const request of queue) {
    const action = request.decision.action;
    const assessment = request.decision.assessment;
    const riskColor = getRiskColor(assessment.level);
    console.log(chalk.white.bold(`[${request.id}]`));
    console.log(`  ${action.description}`);
    console.log(`  Type: ${chalk.yellow(action.type)} | Engine: ${action.engine}`);
    console.log(`  Risk: ${riskColor(assessment.level)} (${assessment.score}/100)`);
    console.log(`  Urgency: ${request.urgency} | Priority: ${request.priority}`);
    console.log(`  Created: ${new Date(request.createdAt).toLocaleString()}`);
    console.log(`  Expires: ${new Date(request.expiresAt).toLocaleString()}`);
    console.log();
  }
  console.log(chalk.gray(`Total: ${queue.length} pending
`));
  console.log(chalk.gray(`Run: gicm-autonomy approve <id> to approve`));
  console.log(chalk.gray(`Run: gicm-autonomy reject <id> --reason "..." to reject
`));
});
program.command("approve <id>").description("Approve a pending request").option("-f, --feedback <text>", "Approval feedback").action(async (id, options) => {
  const spinner = ora("Approving request...").start();
  try {
    const autonomy = getAutonomy();
    const result = await autonomy.approve(id, "cli", options.feedback);
    if (result) {
      spinner.succeed(chalk.green(`Approved: ${result.decision.action.type}`));
    } else {
      spinner.fail(chalk.red(`Request not found: ${id}`));
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
  }
});
program.command("reject <id>").description("Reject a pending request").option("-r, --reason <text>", "Rejection reason", "Rejected via CLI").action(async (id, options) => {
  const spinner = ora("Rejecting request...").start();
  try {
    const autonomy = getAutonomy();
    const result = await autonomy.reject(id, options.reason, "cli");
    if (result) {
      spinner.succeed(chalk.green(`Rejected: ${result.decision.action.type}`));
    } else {
      spinner.fail(chalk.red(`Request not found: ${id}`));
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
  }
});
program.command("batch-approve").description("Approve multiple requests").option("--safe", "Approve all safe/low risk items").option("--category <cat>", "Approve by category").option("--risk <level>", "Approve by risk level").action(async (options) => {
  const spinner = ora("Processing batch...").start();
  try {
    const autonomy = getAutonomy();
    const batch = autonomy.getBatch();
    let result;
    if (options.safe) {
      result = batch.approveAllSafe("cli");
      spinner.succeed(
        chalk.green(`Approved ${result.approved.length} safe/low risk items`)
      );
    } else if (options.category) {
      result = batch.approveFiltered({ category: options.category }, "cli");
      spinner.succeed(
        chalk.green(`Approved ${result.approved.length} ${options.category} items`)
      );
    } else if (options.risk) {
      result = batch.approveFiltered({ riskLevel: options.risk }, "cli");
      spinner.succeed(
        chalk.green(`Approved ${result.approved.length} ${options.risk} risk items`)
      );
    } else {
      spinner.info("Specify --safe, --category, or --risk");
    }
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
  }
});
program.command("boundaries").description("Show or update operational boundaries").option("--set <key=value>", "Set a boundary value").option("--json", "Output as JSON").action((options) => {
  const autonomy = getAutonomy();
  const boundaries = autonomy.getBoundaries();
  if (options.set) {
    const [key, value] = options.set.split("=");
    console.log(chalk.yellow(`Note: Runtime boundary updates not yet implemented`));
    console.log(chalk.gray(`Would set: ${key} = ${value}`));
    return;
  }
  if (options.json) {
    console.log(JSON.stringify(boundaries, null, 2));
    return;
  }
  console.log(chalk.cyan("\n=== Operational Boundaries ===\n"));
  console.log(chalk.yellow("Financial:"));
  for (const [key, value] of Object.entries(boundaries.financial)) {
    console.log(`  ${key}: ${typeof value === "number" ? `$${value}` : value}`);
  }
  console.log(chalk.yellow("\nContent:"));
  for (const [key, value] of Object.entries(boundaries.content)) {
    console.log(`  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
  }
  console.log(chalk.yellow("\nDevelopment:"));
  for (const [key, value] of Object.entries(boundaries.development)) {
    console.log(`  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
  }
  console.log(chalk.yellow("\nTrading:"));
  for (const [key, value] of Object.entries(boundaries.trading)) {
    console.log(`  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
  }
  console.log();
});
program.command("audit").description("View audit log").option("-n, --limit <number>", "Number of entries", "20").option("--type <type>", "Filter by type").option("--action <id>", "Filter by action ID").option("--json", "Output as JSON").action((options) => {
  const autonomy = getAutonomy();
  let entries = autonomy.getAuditLog();
  if (options.type) {
    entries = entries.filter((e) => e.type === options.type);
  }
  if (options.action) {
    entries = entries.filter((e) => e.actionId === options.action);
  }
  const limit = parseInt(options.limit, 10);
  entries = entries.slice(-limit);
  if (options.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  console.log(chalk.cyan("\n=== Audit Log ===\n"));
  if (entries.length === 0) {
    console.log(chalk.gray("No entries found\n"));
    return;
  }
  for (const entry of entries) {
    const typeColor = getTypeColor(entry.type);
    console.log(
      `${chalk.gray(new Date(entry.timestamp).toLocaleString())} ${typeColor(entry.type)}`
    );
    console.log(`  Action: ${entry.actionId}`);
    if (entry.decisionId) {
      console.log(`  Decision: ${entry.decisionId}`);
    }
    console.log();
  }
});
program.command("stats").description("Show detailed statistics").action(() => {
  const autonomy = getAutonomy();
  const queueStats = autonomy.getQueueStats();
  const executorStats = autonomy.getExecutorStats();
  const batch = autonomy.getBatch();
  const batchSummary = batch.getSummary();
  console.log(chalk.cyan("\n=== Autonomy Statistics ===\n"));
  console.log(chalk.yellow("Queue Stats:"));
  console.log(`  Total: ${queueStats.total}`);
  console.log(`  Pending: ${queueStats.pending}`);
  console.log(`  By Urgency: ${JSON.stringify(queueStats.byUrgency)}`);
  console.log(`  Oldest Age: ${Math.round(queueStats.oldestAge / 6e4)} minutes`);
  console.log(`  Avg Wait: ${Math.round(queueStats.avgWaitTime / 6e4)} minutes`);
  console.log(chalk.yellow("\nBatch Summary:"));
  console.log(`  Total Items: ${batchSummary.total}`);
  console.log(`  Total Value: $${batchSummary.totalValue.toFixed(2)}`);
  console.log(`  Avg Score: ${batchSummary.avgScore.toFixed(1)}`);
  console.log(`  By Category: ${JSON.stringify(batchSummary.byCategory)}`);
  console.log(`  By Risk: ${JSON.stringify(batchSummary.byRisk)}`);
  console.log(chalk.yellow("\nExecution Stats:"));
  console.log(`  Total: ${executorStats.totalExecutions}`);
  console.log(`  Active: ${executorStats.currentlyExecuting}`);
  console.log(`  In Cooldown: ${executorStats.failedInCooldown}`);
  console.log();
});
function getRiskColor(level) {
  const colors = {
    safe: chalk.green,
    low: chalk.green,
    medium: chalk.yellow,
    high: chalk.hex("#ff9900"),
    critical: chalk.red
  };
  return colors[level] ?? chalk.white;
}
function getTypeColor(type) {
  if (type.includes("approved") || type.includes("executed")) {
    return chalk.green;
  }
  if (type.includes("rejected") || type.includes("failed")) {
    return chalk.red;
  }
  if (type.includes("escalated") || type.includes("violation")) {
    return chalk.yellow;
  }
  return chalk.cyan;
}
program.parse();
//# sourceMappingURL=cli.js.map