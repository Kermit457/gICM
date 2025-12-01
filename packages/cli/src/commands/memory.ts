/**
 * Memory CLI Commands
 * Persistent context storage management
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";

export function registerMemoryCommands(program: Command): void {
  const memory = program
    .command("memory")
    .description("Manage AI memory (persistent context storage)");

  // gicm memory remember
  memory
    .command("remember <key> <value>")
    .description("Store a memory")
    .option("-t, --type <type>", "Memory type (fact, preference, context, decision, outcome)", "fact")
    .option("-c, --confidence <number>", "Confidence score (0-1)", "1")
    .option("--tags <tags>", "Comma-separated tags")
    .option("-n, --namespace <namespace>", "Memory namespace", "default")
    .option("-e, --expires <seconds>", "Expiration time in seconds")
    .action(async (key: string, value: string, options) => {
      const spinner = ora("Storing memory...").start();

      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        // Parse value as JSON if possible
        let parsedValue: unknown = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string
        }

        const entry = await mem.remember({
          key,
          value: parsedValue,
          type: options.type as "fact" | "preference" | "context" | "decision" | "outcome",
          confidence: parseFloat(options.confidence),
          tags: options.tags ? options.tags.split(",").map((t: string) => t.trim()) : undefined,
          namespace: options.namespace,
          expiresIn: options.expires ? parseInt(options.expires, 10) : undefined,
        });

        spinner.succeed(chalk.green("Memory stored"));
        console.log(chalk.gray(`  ID: ${entry.id}`));
        console.log(chalk.gray(`  Key: ${entry.key}`));
        console.log(chalk.gray(`  Type: ${entry.type}`));
        if (entry.expiresAt) {
          console.log(chalk.gray(`  Expires: ${entry.expiresAt}`));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to store memory"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory recall
  memory
    .command("recall <key>")
    .description("Recall a memory by key")
    .option("-n, --namespace <namespace>", "Memory namespace", "default")
    .action(async (key: string, options) => {
      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        const entry = await mem.recall(key, options.namespace);

        if (!entry) {
          console.log(chalk.yellow(`No memory found for key: ${key}`));
          return;
        }

        console.log(chalk.bold("\nMemory:"));
        console.log(chalk.cyan(`  Key: ${entry.key}`));
        console.log(`  Type: ${entry.type}`);
        console.log(`  Value: ${JSON.stringify(entry.value, null, 2)}`);
        console.log(chalk.gray(`  Confidence: ${entry.confidence}`));
        console.log(chalk.gray(`  Tags: ${entry.tags.join(", ") || "none"}`));
        console.log(chalk.gray(`  Created: ${entry.createdAt}`));
        console.log(chalk.gray(`  Accessed: ${entry.accessCount} times`));
        if (entry.expiresAt) {
          console.log(chalk.gray(`  Expires: ${entry.expiresAt}`));
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory forget
  memory
    .command("forget <key>")
    .description("Forget (delete) a memory")
    .option("-n, --namespace <namespace>", "Memory namespace", "default")
    .action(async (key: string, options) => {
      const spinner = ora("Forgetting memory...").start();

      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        const deleted = await mem.forget(key, options.namespace);

        if (deleted) {
          spinner.succeed(chalk.green("Memory forgotten"));
        } else {
          spinner.warn(chalk.yellow(`No memory found for key: ${key}`));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to forget memory"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory search
  memory
    .command("search")
    .description("Search memories")
    .option("-t, --type <type>", "Filter by type")
    .option("--tags <tags>", "Filter by tags (comma-separated)")
    .option("-k, --key <pattern>", "Filter by key pattern (regex)")
    .option("-n, --namespace <namespace>", "Memory namespace", "default")
    .option("-l, --limit <number>", "Maximum results", "20")
    .action(async (options) => {
      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        const entries = await mem.search({
          type: options.type as "fact" | "preference" | "context" | "decision" | "outcome" | undefined,
          tags: options.tags ? options.tags.split(",").map((t: string) => t.trim()) : undefined,
          keyPattern: options.key,
          namespace: options.namespace,
          limit: parseInt(options.limit, 10),
        });

        if (entries.length === 0) {
          console.log(chalk.yellow("No memories found"));
          return;
        }

        const table = new Table({
          head: ["Key", "Type", "Value", "Confidence", "Tags"],
          colWidths: [20, 12, 30, 12, 20],
        });

        for (const entry of entries) {
          const valueStr = typeof entry.value === "string"
            ? entry.value
            : JSON.stringify(entry.value);
          table.push([
            entry.key,
            entry.type,
            valueStr.substring(0, 27) + (valueStr.length > 27 ? "..." : ""),
            entry.confidence.toFixed(2),
            entry.tags.slice(0, 3).join(", "),
          ]);
        }

        console.log(chalk.bold(`\nMemories (${entries.length}):`));
        console.log(table.toString());
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory stats
  memory
    .command("stats")
    .description("Show memory statistics")
    .action(async () => {
      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        const stats = await mem.getStats();

        console.log(chalk.bold("\nMemory Statistics:"));
        console.log(`  Total entries: ${chalk.cyan(stats.totalEntries)}`);
        console.log(`  Storage size: ${chalk.cyan(formatBytes(stats.storageSize))}`);
        console.log(`  Expiring soon: ${chalk.yellow(stats.expiringSoon)}`);
        console.log();
        console.log(chalk.bold("  By Type:"));
        for (const [type, count] of Object.entries(stats.byType)) {
          console.log(`    ${type}: ${count}`);
        }
        console.log();
        console.log(chalk.bold("  By Namespace:"));
        for (const [ns, count] of Object.entries(stats.byNamespace)) {
          console.log(`    ${ns}: ${count}`);
        }
        if (stats.oldestEntry) {
          console.log(chalk.gray(`\n  Oldest: ${stats.oldestEntry}`));
        }
        if (stats.newestEntry) {
          console.log(chalk.gray(`  Newest: ${stats.newestEntry}`));
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory namespaces
  memory
    .command("namespaces")
    .description("List memory namespaces")
    .action(async () => {
      try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();

        const namespaces = await mem.getNamespaces();

        console.log(chalk.bold("\nNamespaces:"));
        for (const ns of namespaces) {
          console.log(`  ${chalk.cyan(ns.name)} (${ns.id})`);
          if (ns.description) {
            console.log(chalk.gray(`    ${ns.description}`));
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm memory export
  memory
    .command("export")
    .description("Export memories to JSON")
    .option("-n, --namespace <namespace>", "Memory namespace", "default")
    .option("-o, --output <file>", "Output file path")
    .action(async (options) => {
      const spinner = ora("Exporting memories...").start();

      try {
        const { Memory } = await import("@gicm/memory");
        const fs = await import("fs");
        const mem = new Memory();

        const entries = await mem.export(options.namespace);

        if (options.output) {
          fs.writeFileSync(options.output, JSON.stringify(entries, null, 2));
          spinner.succeed(chalk.green(`Exported ${entries.length} memories to ${options.output}`));
        } else {
          spinner.stop();
          console.log(JSON.stringify(entries, null, 2));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to export memories"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
