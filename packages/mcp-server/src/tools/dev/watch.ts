/**
 * dev.watch* MCP Tools
 * Live file watching with auto-reindex capabilities
 */

import * as fs from "fs";
import * as path from "path";

interface WatchStatusResult {
  running: boolean;
  pid?: number;
  path: string;
  stats?: {
    totalChanges: number;
    lastChangeAt?: string;
    pendingIndex: number;
  };
}

interface FileChange {
  type: "add" | "change" | "unlink";
  path: string;
  timestamp: string;
  size?: number;
}

/**
 * Check if watcher is running
 */
export async function watchStatus(projectPath?: string): Promise<WatchStatusResult> {
  const targetPath = projectPath || process.cwd();
  const pidFile = path.join(targetPath, ".gicm", "watch.pid");

  if (!fs.existsSync(pidFile)) {
    return { running: false, path: targetPath };
  }

  try {
    const pid = parseInt(fs.readFileSync(pidFile, "utf-8").trim(), 10);
    // Check if process is still running
    process.kill(pid, 0);

    // Read stats if available
    const statsFile = path.join(targetPath, ".gicm", "watch-stats.json");
    let stats: WatchStatusResult["stats"];
    if (fs.existsSync(statsFile)) {
      stats = JSON.parse(fs.readFileSync(statsFile, "utf-8"));
    }

    return { running: true, pid, path: targetPath, stats };
  } catch {
    // Process not running, clean up stale PID file
    fs.unlinkSync(pidFile);
    return { running: false, path: targetPath };
  }
}

/**
 * Get recent file changes
 */
export async function watchChanges(
  projectPath?: string,
  limit: number = 20
): Promise<{ changes: FileChange[]; total: number }> {
  const targetPath = projectPath || process.cwd();
  const changesLogPath = path.join(targetPath, ".gicm", "changes.log");

  if (!fs.existsSync(changesLogPath)) {
    return { changes: [], total: 0 };
  }

  try {
    const content = fs.readFileSync(changesLogPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const total = lines.length;
    const changes = lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as FileChange)
      .reverse();

    return { changes, total };
  } catch {
    return { changes: [], total: 0 };
  }
}

/**
 * Trigger manual reindex of specific files
 */
export async function watchReindex(
  files: string[],
  projectPath?: string,
  contextEngineUrl?: string
): Promise<{ success: boolean; filesIndexed: number; error?: string }> {
  const targetPath = projectPath || process.cwd();
  const engineUrl = contextEngineUrl || "http://localhost:8000";

  try {
    // Check if context-engine is accessible
    const healthResponse = await fetch(`${engineUrl}/health`);
    if (!healthResponse.ok) {
      return {
        success: false,
        filesIndexed: 0,
        error: "Context engine not available",
      };
    }

    // Build file changes payload
    const changes = files.map((file) => ({
      type: "change" as const,
      path: path.resolve(targetPath, file),
      timestamp: new Date().toISOString(),
    }));

    // Index files
    const indexResponse = await fetch(`${engineUrl}/index/incremental`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: changes.map((c) => c.path),
        repository: path.basename(targetPath),
      }),
    });

    if (!indexResponse.ok) {
      const error = await indexResponse.text();
      return {
        success: false,
        filesIndexed: 0,
        error: `Index failed: ${error}`,
      };
    }

    return { success: true, filesIndexed: changes.length };
  } catch (error) {
    return {
      success: false,
      filesIndexed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clear the changes log
 */
export async function watchClear(
  projectPath?: string
): Promise<{ success: boolean; message: string }> {
  const targetPath = projectPath || process.cwd();
  const changesLogPath = path.join(targetPath, ".gicm", "changes.log");

  try {
    if (fs.existsSync(changesLogPath)) {
      fs.unlinkSync(changesLogPath);
      return { success: true, message: "Changes log cleared" };
    }
    return { success: true, message: "No changes log to clear" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clear log",
    };
  }
}

// Tool definitions for dev.watch* namespace
export const watchTools = {
  "dev.watch_status": {
    description:
      "Check if the file watcher is running and get statistics about file changes.",
    parameters: {
      project_path: {
        type: "string",
        description: "Path to project (defaults to current directory)",
        optional: true,
      },
    },
  },

  "dev.watch_changes": {
    description:
      "Get recent file changes tracked by the watcher. Useful for seeing what files have been modified recently.",
    parameters: {
      project_path: {
        type: "string",
        description: "Path to project (defaults to current directory)",
        optional: true,
      },
      limit: {
        type: "number",
        description: "Maximum number of changes to return (default: 20)",
        optional: true,
      },
    },
  },

  "dev.watch_reindex": {
    description:
      "Manually trigger reindexing of specific files. Use this when you want to ensure certain files are freshly indexed for semantic search.",
    parameters: {
      files: {
        type: "array",
        description: "Array of file paths to reindex (relative to project)",
        items: { type: "string" },
      },
      project_path: {
        type: "string",
        description: "Path to project (defaults to current directory)",
        optional: true,
      },
      context_engine_url: {
        type: "string",
        description: "URL of the context engine (default: http://localhost:8000)",
        optional: true,
      },
    },
  },

  "dev.watch_clear": {
    description:
      "Clear the file changes log. Use this to start fresh with change tracking.",
    parameters: {
      project_path: {
        type: "string",
        description: "Path to project (defaults to current directory)",
        optional: true,
      },
    },
  },
};
