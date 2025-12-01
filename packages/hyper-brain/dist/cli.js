#!/usr/bin/env node
import { HyperBrain, BrainApiServer } from './chunk-2M4QCTL7.js';
import './chunk-7D4SUZUM.js';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

var program = new Command();
var LOGO = `
${chalk.cyan("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557")}
${chalk.cyan("\u2551")}  ${chalk.yellow("\u{1F9E0}")} ${chalk.bold.white("gICM HYPER BRAIN")}                                          ${chalk.cyan("\u2551")}
${chalk.cyan("\u2551")}  ${chalk.gray("Consume Everything. Learn Everything. Win Every Day.")}        ${chalk.cyan("\u2551")}
${chalk.cyan("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D")}
`;
program.name("hyper-brain").description("gICM HYPER BRAIN - Knowledge & Learning System").version("1.0.0");
program.command("start").description("Start the HYPER BRAIN").option("-p, --port <port>", "API port", "3300").option("--no-api", "Disable API server").option("--no-ws", "Disable WebSocket").action(async (options) => {
  console.log(LOGO);
  const spinner = ora("Initializing HYPER BRAIN...").start();
  const brain = new HyperBrain({
    apiPort: parseInt(options.port)
  });
  let apiServer = null;
  try {
    await brain.start();
    if (options.api !== false) {
      apiServer = new BrainApiServer(brain, {
        port: parseInt(options.port),
        enableWebSocket: options.ws !== false
      });
      await apiServer.start();
    }
    spinner.succeed(chalk.green("HYPER BRAIN online!"));
    console.log();
    console.log(chalk.green("  \u{1F4E1} Knowledge ingestion started"));
    console.log(chalk.green("  \u{1F504} Processing pipeline active"));
    console.log(chalk.green("  \u{1F9E0} Learning system enabled"));
    console.log(chalk.green("  \u{1F52E} Prediction engine ready"));
    if (options.api !== false) {
      console.log(chalk.green(`  \u{1F310} API server: http://localhost:${options.port}`));
      if (options.ws !== false) {
        console.log(chalk.green(`  \u{1F50C} WebSocket: ws://localhost:${options.port}/ws`));
      }
    }
    console.log();
    console.log(chalk.gray("  Press Ctrl+C to stop"));
    console.log();
    process.on("SIGINT", async () => {
      console.log(chalk.yellow("\n\n  Shutting down..."));
      if (apiServer) await apiServer.stop();
      await brain.stop();
      process.exit(0);
    });
  } catch (error) {
    spinner.fail(chalk.red(`Failed to start: ${error}`));
    process.exit(1);
  }
});
program.command("ingest").description("Force ingest from all sources").option("-s, --source <source>", "Specific source to ingest").action(async (options) => {
  console.log(LOGO);
  const spinner = ora("Ingesting knowledge...").start();
  const brain = new HyperBrain();
  await brain.start();
  if (options.source) {
    const count = await brain.ingestSource(options.source);
    spinner.succeed(`Ingested ${count} items from ${options.source}`);
  } else {
    const stats = await brain.ingestAll();
    spinner.succeed(`Ingested ${stats.totalIngested} items`);
    console.log(chalk.gray(`  By source: ${JSON.stringify(stats.bySource)}`));
  }
  await brain.stop();
});
program.command("search <query>").description("Search the knowledge base").option("-n, --limit <limit>", "Number of results", "10").option("-t, --topic <topic>", "Filter by topic").action(async (query, options) => {
  const brain = new HyperBrain();
  await brain.start();
  const results = await brain.search(query, parseInt(options.limit));
  console.log(chalk.bold(`
\u{1F50D} Results for "${query}":
`));
  if (results.length === 0) {
    console.log(chalk.gray("  No results found"));
  } else {
    for (const result of results) {
      console.log(chalk.cyan(`\u2022 ${result.content.summary}`));
      console.log(
        chalk.gray(
          `  Source: ${result.source.name} | Score: ${result.score.toFixed(2)} | Topics: ${result.topics.join(", ")}`
        )
      );
      console.log();
    }
  }
  await brain.stop();
});
program.command("patterns").description("Show discovered patterns").option("--analyze", "Run pattern analysis first").action(async (options) => {
  const brain = new HyperBrain();
  await brain.start();
  if (options.analyze) {
    const spinner = ora("Analyzing patterns...").start();
    const newPatterns = await brain.analyzePatterns();
    spinner.succeed(`Discovered ${newPatterns.length} patterns`);
  }
  const patterns = brain.getPatterns();
  const stats = brain.getPatternStats();
  console.log(chalk.bold("\n\u{1F504} PATTERNS\n"));
  console.log(chalk.white(`  Total: ${stats.total}`));
  console.log(chalk.white(`  Active: ${stats.active}`));
  console.log(chalk.white(`  Avg Accuracy: ${(stats.avgAccuracy * 100).toFixed(1)}%`));
  console.log();
  for (const pattern of patterns.slice(0, 10)) {
    console.log(chalk.cyan(`\u2022 ${pattern.name}`));
    console.log(
      chalk.gray(
        `  ${pattern.description} (accuracy: ${(pattern.accuracy * 100).toFixed(0)}%, seen: ${pattern.occurrences}x)`
      )
    );
  }
  await brain.stop();
});
program.command("predict <type>").description("Generate predictions (market|content|product|agent)").option("-n, --count <count>", "Number of predictions", "5").action(async (type, options) => {
  const validTypes = ["market", "content", "product", "agent"];
  if (!validTypes.includes(type)) {
    console.log(chalk.red(`Invalid type. Use: ${validTypes.join(", ")}`));
    process.exit(1);
  }
  const brain = new HyperBrain();
  await brain.start();
  const spinner = ora(`Generating ${type} predictions...`).start();
  const predictions = await brain.predict(type, parseInt(options.count));
  spinner.succeed(`Generated ${predictions.length} predictions`);
  console.log(chalk.bold(`
\u{1F52E} ${type.toUpperCase()} PREDICTIONS
`));
  for (const pred of predictions) {
    console.log(chalk.cyan(`\u2022 ${pred.prediction.outcome}`));
    console.log(
      chalk.gray(
        `  Probability: ${(pred.prediction.probability * 100).toFixed(0)}% | Confidence: ${pred.prediction.confidence}/100`
      )
    );
    console.log();
  }
  await brain.stop();
});
program.command("stats").description("Show HYPER BRAIN statistics").action(async () => {
  console.log(LOGO);
  const brain = new HyperBrain();
  await brain.start();
  const stats = brain.getStats();
  console.log(chalk.bold("\u{1F4CA} HYPER BRAIN STATS\n"));
  console.log(chalk.white("  Knowledge:"));
  console.log(chalk.gray(`    Total Items: ${stats.knowledge.total.toLocaleString()}`));
  console.log(chalk.gray(`    By Source: ${JSON.stringify(stats.knowledge.bySource)}`));
  console.log(chalk.white("\n  Patterns:"));
  console.log(chalk.gray(`    Total: ${stats.patterns.total}`));
  console.log(chalk.gray(`    Active: ${stats.patterns.active}`));
  console.log(chalk.gray(`    Accuracy: ${(stats.patterns.accuracy * 100).toFixed(1)}%`));
  console.log(chalk.white("\n  Predictions:"));
  console.log(chalk.gray(`    Total: ${stats.predictions.total}`));
  console.log(chalk.gray(`    Correct: ${stats.predictions.correct}`));
  console.log(chalk.gray(`    Accuracy: ${(stats.predictions.accuracy * 100).toFixed(1)}%`));
  console.log(chalk.gray(`    Pending: ${stats.predictions.pending}`));
  console.log(chalk.white("\n  Ingestion:"));
  console.log(chalk.gray(`    Total Ingested: ${stats.ingestion.totalIngested.toLocaleString()}`));
  console.log(chalk.gray(`    Errors: ${stats.ingestion.errors}`));
  console.log();
  await brain.stop();
});
program.command("recent").description("Show recent knowledge items").option("-n, --limit <limit>", "Number of items", "20").action(async (options) => {
  const brain = new HyperBrain();
  await brain.start();
  const items = brain.getRecent(parseInt(options.limit));
  console.log(chalk.bold("\n\u{1F4F0} RECENT KNOWLEDGE\n"));
  for (const item of items) {
    const time = new Date(item.timestamp).toLocaleString();
    console.log(chalk.cyan(`\u2022 ${item.content.summary.slice(0, 80)}...`));
    console.log(
      chalk.gray(
        `  ${item.source.name} | ${time} | Topics: ${item.topics.join(", ")}`
      )
    );
    console.log();
  }
  await brain.stop();
});
program.command("topics").description("Show topic distribution").action(async () => {
  const brain = new HyperBrain();
  await brain.start();
  brain.getStats();
  const topicCounts = {};
  for (const item of brain.getRecent(1e3)) {
    for (const topic of item.topics) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log(chalk.bold("\n\u{1F4CA} TOPIC DISTRIBUTION\n"));
  for (const [topic, count] of sorted) {
    const bar = "\u2588".repeat(Math.min(count / 5, 30));
    console.log(`  ${chalk.cyan(topic.padEnd(15))} ${chalk.green(bar)} ${count}`);
  }
  console.log();
  await brain.stop();
});
program.parse();
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map