/**
 * dev.status - Get project and indexing status
 *
 * Returns information about the current project configuration,
 * indexing status, and available capabilities.
 */
import * as fs from "fs";
import * as path from "path";
export async function getStatus(projectPath) {
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
    let config;
    try {
        config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    catch {
        return {
            initialized: true,
            indexing: { enabled: false },
            mcp: { running: true, port: 3100, contextEngineUrl: "http://localhost:8000" },
            autonomy: { level: 1, levelName: "Manual" },
            capabilities: { installed: [], available: 500 },
        };
    }
    const autonomyLabels = {
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
//# sourceMappingURL=status.js.map