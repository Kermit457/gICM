/**
 * dev.status - Get project and indexing status
 *
 * Returns information about the current project configuration,
 * indexing status, and available capabilities.
 */

import * as fs from "fs";
import * as path from "path";

interface ProjectStatus {
  initialized: boolean;
  project?: {
    name: string;
    type: string;
    language: string;
    frameworks: string[];
  };
  indexing: {
    enabled: boolean;
    lastIndexed?: string;
    fileCount?: number;
    chunkCount?: number;
  };
  mcp: {
    running: boolean;
    port: number;
    contextEngineUrl: string;
  };
  autonomy: {
    level: number;
    levelName: string;
  };
  capabilities: {
    installed: string[];
    available: number;
  };
}

interface GICMConfig {
  project: {
    name: string;
    type: string;
    language: string;
    frameworks: string[];
  };
  indexing: {
    enabled: boolean;
    lastIndexed?: string;
    fileCount?: number;
    chunkCount?: number;
  };
  mcp: {
    port: number;
    contextEngineUrl: string;
  };
  autonomy: {
    level: number;
  };
  capabilities: {
    installed: string[];
  };
}

export async function getStatus(projectPath?: string): Promise<ProjectStatus> {
  const basePath = projectPath || process.env.GICM_PROJECT_PATH || process.cwd();
  const configPath = path.join(basePath, ".gicm", "config.json");

  // Check if initialized
  const initialized = fs.existsSync(configPath);

  if (!initialized) {
    return {
      initialized: false,
      indexing: {
        enabled: false,
      },
      mcp: {
        running: true,
        port: 3100,
        contextEngineUrl: "http://localhost:8000",
      },
      autonomy: {
        level: 1,
        levelName: "Manual",
      },
      capabilities: {
        installed: [],
        available: 500,
      },
    };
  }

  // Load config
  let config: GICMConfig;
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {
      initialized: true,
      indexing: { enabled: false },
      mcp: { running: true, port: 3100, contextEngineUrl: "http://localhost:8000" },
      autonomy: { level: 1, levelName: "Manual" },
      capabilities: { installed: [], available: 500 },
    };
  }

  const autonomyLabels: Record<number, string> = {
    1: "Manual",
    2: "Bounded",
    3: "Supervised",
    4: "Autonomous",
  };

  return {
    initialized: true,
    project: config.project,
    indexing: {
      enabled: config.indexing.enabled,
      lastIndexed: config.indexing.lastIndexed,
      fileCount: config.indexing.fileCount,
      chunkCount: config.indexing.chunkCount,
    },
    mcp: {
      running: true,
      port: config.mcp.port,
      contextEngineUrl: config.mcp.contextEngineUrl,
    },
    autonomy: {
      level: config.autonomy.level,
      levelName: autonomyLabels[config.autonomy.level] || "Unknown",
    },
    capabilities: {
      installed: config.capabilities.installed,
      available: 500,
    },
  };
}
