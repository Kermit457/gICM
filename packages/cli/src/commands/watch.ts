/**
 * Watch CLI Commands
 * Live file watching with auto-reindex
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";

export function registerWatchCommands(program: Command): void {
  const watch = program
    .command("watch")
    .description("Live file watching with auto-reindex");

  // gicm watch start
  watch
    .command("start")
    .description("Start watching for file changes")
    .option("-p, --path <path>", "Path to watch", process.cwd())
    .option("-d, --debounce <ms>", "Debounce delay in ms", "500")
    .option("--no-auto-index", "Disable auto-indexing")
    .option("-b, --background", "Run in background")
    .action(async (options) => {
      const spinner = ora("Starting watcher...").start();

      try {
        // Dynamic import to avoid bundling issues
        const { FileWatcher } = await import("@gicm/watcher");

        const watcher = new FileWatcher({
          path: options.path,
          debounceMs: parseInt(options.debounce, 10),
          autoIndex: options.autoIndex,
        });

        // Set up event handlers
        watcher.on("started", (state) => {
          spinner.succeed(chalk.green("Watcher started"));
          console.log(chalk.gray(`  Path: ${state.watchPath}`));
          console.log(chalk.gray(`  Auto-index: ${options.autoIndex}`));
          console.log(chalk.gray(`  Debounce: ${options.debounce}ms`));
          console.log();
          console.log(chalk.cyan("Watching for changes... Press Ctrl+C to stop"));
        });

        watcher.on("change", (change) => {
          const icon =
            change.type === "add"
              ? chalk.green("+")
              : change.type === "unlink"
              ? chalk.red("-")
              : chalk.yellow("~");
          console.log(`${icon} ${change.path}`);
        });

        watcher.on("indexed", (files, duration) => {
          console.log(
            chalk.blue(`  ↳ Indexed ${files.length} files in ${duration}ms`)
          );
        });

        watcher.on("error", (error) => {
          console.error(chalk.red(`Error: ${error.message}`));
        });

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
          console.log();
          const stopSpinner = ora("Stopping watcher...").start();
          await watcher.stop();
          stopSpinner.succeed(chalk.green("Watcher stopped"));
          process.exit(0);
        });

        await watcher.start();
      } catch (error) {
        spinner.fail(chalk.red("Failed to start watcher"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm watch stop
  watch
    .command("stop")
    .description("Stop the running watcher")
    .option("-p, --path <path>", "Path being watched", process.cwd())
    .action(async (options) => {
      const spinner = ora("Stopping watcher...").start();

      try {
        const { FileWatcher } = await import("@gicm/watcher");
        const status = FileWatcher.isRunning(options.path);

        if (!status.running) {
          spinner.info(chalk.yellow("No watcher is running"));
          return;
        }

        // Send SIGTERM to the watcher process
        if (status.pid) {
          process.kill(status.pid, "SIGTERM");
          spinner.succeed(chalk.green(`Watcher stopped (PID: ${status.pid})`));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to stop watcher"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm watch status
  watch
    .command("status")
    .description("Check watcher status")
    .option("-p, --path <path>", "Path being watched", process.cwd())
    .action(async (options) => {
      try {
        const { FileWatcher } = await import("@gicm/watcher");
        const status = FileWatcher.isRunning(options.path);

        if (status.running) {
          console.log(chalk.green("● Watcher is running"));
          console.log(chalk.gray(`  PID: ${status.pid}`));
          console.log(chalk.gray(`  Path: ${options.path}`));
        } else {
          console.log(chalk.yellow("○ Watcher is not running"));
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm watch changes
  watch
    .command("changes")
    .description("Show recent file changes")
    .option("-p, --path <path>", "Path being watched", process.cwd())
    .option("-n, --limit <number>", "Number of changes to show", "20")
    .action(async (options) => {
      try {
        const { FileWatcher } = await import("@gicm/watcher");
        const watcher = new FileWatcher({ path: options.path });
        const changes = watcher.getRecentChanges(parseInt(options.limit, 10));

        if (changes.length === 0) {
          console.log(chalk.gray("No recent changes"));
          return;
        }

        console.log(chalk.bold("Recent Changes:\n"));

        for (const change of changes) {
          const icon =
            change.type === "add"
              ? chalk.green("+")
              : change.type === "unlink"
              ? chalk.red("-")
              : chalk.yellow("~");
          const time = new Date(change.timestamp).toLocaleTimeString();
          console.log(`${icon} ${chalk.gray(time)} ${change.path}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  // gicm watch clear
  watch
    .command("clear")
    .description("Clear the changes log")
    .option("-p, --path <path>", "Path being watched", process.cwd())
    .action(async (options) => {
      const spinner = ora("Clearing changes log...").start();

      try {
        const fs = await import("fs");
        const path = await import("path");
        const logPath = path.join(options.path, ".gicm", "changes.log");

        if (fs.existsSync(logPath)) {
          fs.unlinkSync(logPath);
          spinner.succeed(chalk.green("Changes log cleared"));
        } else {
          spinner.info(chalk.yellow("No changes log found"));
        }
      } catch (error) {
        spinner.fail(chalk.red("Failed to clear changes log"));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });
}
