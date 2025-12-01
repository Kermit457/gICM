// src/watcher.ts
import { EventEmitter } from "eventemitter3";
import chokidar from "chokidar";
import * as fs2 from "fs";
import * as path2 from "path";
import pino from "pino";

// src/debouncer.ts
var Debouncer = class {
  pending = /* @__PURE__ */ new Map();
  timer = null;
  debounceMs;
  callback;
  constructor(debounceMs, callback) {
    this.debounceMs = debounceMs;
    this.callback = callback;
  }
  /**
   * Add a change to be debounced
   */
  add(change) {
    this.pending.set(change.path, change);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }
  /**
   * Flush all pending changes
   */
  flush() {
    if (this.pending.size === 0) {
      return;
    }
    const changes = Array.from(this.pending.values());
    this.pending.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callback(changes);
  }
  /**
   * Get count of pending changes
   */
  getPendingCount() {
    return this.pending.size;
  }
  /**
   * Cancel all pending changes
   */
  cancel() {
    this.pending.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
};

// src/incremental-indexer.ts
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
var IncrementalIndexer = class {
  contextEngineUrl;
  constructor(contextEngineUrl) {
    this.contextEngineUrl = contextEngineUrl;
  }
  /**
   * Index a set of changed files
   */
  async indexChanges(changes) {
    const startTime = Date.now();
    const filesToIndex = [];
    for (const change of changes) {
      if (change.type === "unlink") {
        continue;
      }
      if (fs.existsSync(change.path)) {
        filesToIndex.push(change.path);
      }
    }
    if (filesToIndex.length === 0) {
      return {
        success: true,
        filesIndexed: 0,
        duration: Date.now() - startTime
      };
    }
    try {
      const files = filesToIndex.map((filePath) => ({
        path: filePath,
        content: fs.readFileSync(filePath, "utf-8"),
        type: this.getFileType(filePath)
      }));
      const response = await axios.post(
        `${this.contextEngineUrl}/index/incremental`,
        { files },
        { timeout: 3e4 }
      );
      return {
        success: response.data?.success ?? true,
        filesIndexed: filesToIndex.length,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        filesIndexed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Get file type from extension
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".rs": "rust",
      ".go": "go",
      ".md": "markdown",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml"
    };
    return typeMap[ext] || "text";
  }
  /**
   * Check if context engine is available
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.contextEngineUrl}/health`, {
        timeout: 2e3
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
};

// src/watcher.ts
var FileWatcher = class extends EventEmitter {
  config;
  watcher = null;
  debouncer;
  indexer;
  state;
  logger;
  changesLogPath;
  pidFilePath;
  constructor(config = {}) {
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
        "**/*.log"
      ],
      contextEngineUrl: config.contextEngineUrl || "http://localhost:8000"
    };
    this.state = {
      status: "idle",
      watchPath: this.config.path,
      totalChanges: 0,
      pendingIndex: 0
    };
    this.logger = pino({
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true }
      }
    });
    this.indexer = new IncrementalIndexer(this.config.contextEngineUrl);
    this.debouncer = new Debouncer(
      this.config.debounceMs,
      (changes) => this.handleDebouncedChanges(changes)
    );
    const gicmDir = path2.join(this.config.path, ".gicm");
    this.changesLogPath = path2.join(gicmDir, "changes.log");
    this.pidFilePath = path2.join(gicmDir, "watch.pid");
  }
  /**
   * Start watching
   */
  async start() {
    if (this.state.status === "watching") {
      this.logger.warn("Watcher already running");
      return;
    }
    const gicmDir = path2.dirname(this.pidFilePath);
    if (!fs2.existsSync(gicmDir)) {
      fs2.mkdirSync(gicmDir, { recursive: true });
    }
    fs2.writeFileSync(this.pidFilePath, String(process.pid));
    this.watcher = chokidar.watch(this.config.path, {
      ignored: this.config.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });
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
      this.state.startedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.logger.info({ path: this.config.path }, "Watcher started");
      this.emit("started", this.state);
    });
  }
  /**
   * Stop watching
   */
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.debouncer.cancel();
    this.state.status = "stopped";
    if (fs2.existsSync(this.pidFilePath)) {
      fs2.unlinkSync(this.pidFilePath);
    }
    this.logger.info("Watcher stopped");
    this.emit("stopped", this.state);
  }
  /**
   * Get current state
   */
  getState() {
    return {
      ...this.state,
      pendingIndex: this.debouncer.getPendingCount()
    };
  }
  /**
   * Get recent changes
   */
  getRecentChanges(limit = 50) {
    if (!fs2.existsSync(this.changesLogPath)) {
      return [];
    }
    try {
      const content = fs2.readFileSync(this.changesLogPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines.slice(-limit).map((line) => JSON.parse(line)).reverse();
    } catch {
      return [];
    }
  }
  /**
   * Handle a file change
   */
  handleChange(type, filePath) {
    const change = {
      type,
      path: filePath,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (type !== "unlink" && fs2.existsSync(filePath)) {
      try {
        const stats = fs2.statSync(filePath);
        change.size = stats.size;
      } catch {
      }
    }
    this.state.totalChanges++;
    this.state.lastChangeAt = change.timestamp;
    this.logChange(change);
    this.emit("change", change);
    if (this.config.autoIndex) {
      this.debouncer.add(change);
    }
  }
  /**
   * Handle debounced changes (batch)
   */
  async handleDebouncedChanges(changes) {
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
  logChange(change) {
    try {
      const dir = path2.dirname(this.changesLogPath);
      if (!fs2.existsSync(dir)) {
        fs2.mkdirSync(dir, { recursive: true });
      }
      fs2.appendFileSync(this.changesLogPath, JSON.stringify(change) + "\n");
      const stats = fs2.statSync(this.changesLogPath);
      if (stats.size > 1024 * 1024) {
        this.rotateLog();
      }
    } catch {
    }
  }
  /**
   * Rotate log file
   */
  rotateLog() {
    const backupPath = this.changesLogPath + ".old";
    if (fs2.existsSync(backupPath)) {
      fs2.unlinkSync(backupPath);
    }
    fs2.renameSync(this.changesLogPath, backupPath);
  }
  /**
   * Check if watcher process is already running
   */
  static isRunning(watchPath = process.cwd()) {
    const pidFile = path2.join(watchPath, ".gicm", "watch.pid");
    if (!fs2.existsSync(pidFile)) {
      return { running: false };
    }
    try {
      const pid = parseInt(fs2.readFileSync(pidFile, "utf-8").trim(), 10);
      process.kill(pid, 0);
      return { running: true, pid };
    } catch {
      fs2.unlinkSync(pidFile);
      return { running: false };
    }
  }
};

// src/supabase-sync.ts
var SupabaseSync = class {
  client = null;
  config;
  tableName;
  channel = null;
  changeHandlers = [];
  constructor(config) {
    this.config = config;
    const prefix = config.tablePrefix || "gicm";
    this.tableName = `${prefix}_file_changes`;
  }
  /**
   * Lazy initialize Supabase client
   */
  async getClient() {
    if (this.client) return this.client;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      this.client = createClient(
        this.config.supabaseUrl,
        this.config.supabaseKey
      );
      return this.client;
    } catch {
      throw new Error(
        "Supabase client not available. Install @supabase/supabase-js: pnpm add @supabase/supabase-js"
      );
    }
  }
  /**
   * Sync file changes to Supabase
   */
  async syncChanges(changes) {
    if (changes.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }
    try {
      const client = await this.getClient();
      const rows = changes.map((change) => ({
        project_id: this.config.projectId,
        team_id: this.config.teamId,
        type: change.type,
        path: change.path,
        size: change.size,
        timestamp: change.timestamp,
        synced_by: process.env.USER || process.env.USERNAME || "unknown"
      }));
      const { error } = await client.from(this.tableName).insert(rows);
      if (error) {
        return {
          success: false,
          synced: 0,
          failed: changes.length,
          error: error.message
        };
      }
      return {
        success: true,
        synced: changes.length,
        failed: 0
      };
    } catch (error) {
      return {
        success: false,
        synced: 0,
        failed: changes.length,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Get recent changes from Supabase (for team sync)
   */
  async getRemoteChanges(since, limit = 100) {
    try {
      const client = await this.getClient();
      let query = client.from(this.tableName).select("*").eq("project_id", this.config.projectId);
      if (this.config.teamId) {
        query = query.eq("team_id", this.config.teamId);
      }
      query = query.order("timestamp", { ascending: false }).limit(limit);
      const { data, error } = await query;
      if (error || !data) {
        return [];
      }
      return data.map((row) => ({
        type: row.type,
        path: row.path,
        size: row.size,
        timestamp: row.timestamp
      }));
    } catch {
      return [];
    }
  }
  /**
   * Subscribe to realtime changes (for team collaboration)
   */
  async subscribeToChanges(handler) {
    if (!this.config.enableRealtime) {
      return;
    }
    try {
      const client = await this.getClient();
      this.changeHandlers.push(handler);
      if (!this.channel) {
        this.channel = client.channel(`${this.tableName}:${this.config.projectId}`);
        this.channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: this.tableName,
            filter: `project_id=eq.${this.config.projectId}`
          },
          (payload) => {
            const row = payload.new;
            const change = {
              type: row.type,
              path: row.path,
              size: row.size,
              timestamp: row.timestamp
            };
            for (const h of this.changeHandlers) {
              h(change);
            }
          }
        );
        this.channel.subscribe();
      }
    } catch {
    }
  }
  /**
   * Unsubscribe from realtime changes
   */
  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.changeHandlers = [];
  }
  /**
   * Check if Supabase is configured and available
   */
  async isAvailable() {
    try {
      await this.getClient();
      return true;
    } catch {
      return false;
    }
  }
};
function createSyncFromEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  const projectId = process.env.GICM_PROJECT_ID;
  if (!url || !key || !projectId) {
    return null;
  }
  return new SupabaseSync({
    supabaseUrl: url,
    supabaseKey: key,
    projectId,
    teamId: process.env.GICM_TEAM_ID,
    tablePrefix: process.env.GICM_TABLE_PREFIX || "gicm",
    enableRealtime: process.env.GICM_REALTIME === "true"
  });
}
export {
  Debouncer,
  FileWatcher,
  IncrementalIndexer,
  SupabaseSync,
  createSyncFromEnv
};
//# sourceMappingURL=index.js.map