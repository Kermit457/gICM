/**
 * File Watcher
 * Main watcher class using chokidar for file system watching
 */

import { EventEmitter } from "eventemitter3";
import chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import pino from "pino";
import type {
  WatcherConfig,
  WatcherState,
  WatcherEvents,
  FileChange,
  DEFAULT_WATCHER_CONFIG,
} from "./types.js";
import { Debouncer } from "./debouncer.js";
import { IncrementalIndexer } from "./incremental-indexer.js";

export class FileWatcher extends EventEmitter<WatcherEvents> {
  private config: WatcherConfig;
  private watcher: chokidar.FSWatcher | null = null;
  private debouncer: Debouncer;
  private indexer: IncrementalIndexer;
  private state: WatcherState;
  private logger: pino.Logger;
  private changesLogPath: string;
  private pidFilePath: string;

  constructor(config: Partial<WatcherConfig> = {}) {
    super();
    this.config = {
      path: config.path || process.cwd(),
      autoIndex: config.autoIndex ?? true,
      debounceMs: config.debounceMs ?? 500,
      ignorePatterns: config.ignorePatterns || [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**",
        "**/*.log",
      ],
      contextEngineUrl: config.contextEngineUrl || "http://localhost:8000",
    };

    this.state = {
      status: "idle",
      watchPath: this.config.path,
      totalChanges: 0,
      pendingIndex: 0,
    };

    this.logger = pino({
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    });

    this.indexer = new IncrementalIndexer(this.config.contextEngineUrl);
    this.debouncer = new Debouncer(this.config.debounceMs, (changes) =>
      this.handleDebouncedChanges(changes)
    );

    // Setup paths
    const gicmDir = path.join(this.config.path, ".gicm");
    this.changesLogPath = path.join(gicmDir, "changes.log");
    this.pidFilePath = path.join(gicmDir, "watch.pid");
  }

  /**
   * Start watching
   */
  async start(): Promise<void> {
    if (this.state.status === "watching") {
      this.logger.warn("Watcher already running");
      return;
    }

    // Ensure .gicm directory exists
    const gicmDir = path.dirname(this.pidFilePath);
    if (!fs.existsSync(gicmDir)) {
      fs.mkdirSync(gicmDir, { recursive: true });
    }

    // Write PID file
    fs.writeFileSync(this.pidFilePath, String(process.pid));

    // Initialize watcher
    this.watcher = chokidar.watch(this.config.path, {
      ignored: this.config.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    // Set up event handlers
    this.watcher.on("add", (filePath) => this.handleChange("add", filePath));
    this.watcher.on("change", (filePath) => this.handleChange("change", filePath));
    this.watcher.on("unlink", (filePath) => this.handleChange("unlink", filePath));
    this.watcher.on("error", (error) => {
      this.state.status = "error";
      this.state.error = error.message;
      this.emit("error", error);
    });

    this.watcher.on("ready", () => {
      this.state.status = "watching";
      this.state.startedAt = new Date().toISOString();
      this.logger.info({ path: this.config.path }, "Watcher started");
      this.emit("started", this.state);
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.debouncer.cancel();
    this.state.status = "stopped";

    // Remove PID file
    if (fs.existsSync(this.pidFilePath)) {
      fs.unlinkSync(this.pidFilePath);
    }

    this.logger.info("Watcher stopped");
    this.emit("stopped", this.state);
  }

  /**
   * Get current state
   */
  getState(): WatcherState {
    return {
      ...this.state,
      pendingIndex: this.debouncer.getPendingCount(),
    };
  }

  /**
   * Get recent changes
   */
  getRecentChanges(limit: number = 50): FileChange[] {
    if (!fs.existsSync(this.changesLogPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.changesLogPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines
        .slice(-limit)
        .map((line) => JSON.parse(line) as FileChange)
        .reverse();
    } catch {
      return [];
    }
  }

  /**
   * Handle a file change
   */
  private handleChange(type: "add" | "change" | "unlink", filePath: string): void {
    const change: FileChange = {
      type,
      path: filePath,
      timestamp: new Date().toISOString(),
    };

    // Get file size for adds/changes
    if (type !== "unlink" && fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        change.size = stats.size;
      } catch {
        // Ignore stat errors
      }
    }

    this.state.totalChanges++;
    this.state.lastChangeAt = change.timestamp;

    // Log change
    this.logChange(change);

    // Emit event
    this.emit("change", change);

    // Add to debouncer for batched indexing
    if (this.config.autoIndex) {
      this.debouncer.add(change);
    }
  }

  /**
   * Handle debounced changes (batch)
   */
  private async handleDebouncedChanges(changes: FileChange[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    this.state.status = "indexing";
    this.logger.info({ count: changes.length }, "Indexing changes");

    const startTime = Date.now();
    const result = await this.indexer.indexChanges(changes);

    this.state.status = "watching";

    if (result.success) {
      this.logger.info(
        { files: result.filesIndexed, duration: result.duration },
        "Indexing complete"
      );
      this.emit(
        "indexed",
        changes.map((c) => c.path),
        result.duration
      );
    } else {
      this.logger.warn({ error: result.error }, "Indexing failed");
    }
  }

  /**
   * Log change to file
   */
  private logChange(change: FileChange): void {
    try {
      const dir = path.dirname(this.changesLogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(this.changesLogPath, JSON.stringify(change) + "\n");

      // Rotate log if too large (> 1MB)
      const stats = fs.statSync(this.changesLogPath);
      if (stats.size > 1024 * 1024) {
        this.rotateLog();
      }
    } catch {
      // Ignore log errors
    }
  }

  /**
   * Rotate log file
   */
  private rotateLog(): void {
    const backupPath = this.changesLogPath + ".old";
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    fs.renameSync(this.changesLogPath, backupPath);
  }

  /**
   * Check if watcher process is already running
   */
  static isRunning(watchPath: string = process.cwd()): { running: boolean; pid?: number } {
    const pidFile = path.join(watchPath, ".gicm", "watch.pid");
    if (!fs.existsSync(pidFile)) {
      return { running: false };
    }

    try {
      const pid = parseInt(fs.readFileSync(pidFile, "utf-8").trim(), 10);
      // Check if process is still running
      process.kill(pid, 0);
      return { running: true, pid };
    } catch {
      // Process not running, clean up stale PID file
      fs.unlinkSync(pidFile);
      return { running: false };
    }
  }
}
