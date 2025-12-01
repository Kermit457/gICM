/**
 * dev.status - Get project and indexing status
 *
 * Returns information about the current project configuration,
 * indexing status, and available capabilities.
 */
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
export declare function getStatus(projectPath?: string): Promise<ProjectStatus>;
export {};
//# sourceMappingURL=status.d.ts.map