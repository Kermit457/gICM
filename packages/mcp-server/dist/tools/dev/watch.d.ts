/**
 * dev.watch* MCP Tools
 * Live file watching with auto-reindex capabilities
 */
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
export declare function watchStatus(projectPath?: string): Promise<WatchStatusResult>;
/**
 * Get recent file changes
 */
export declare function watchChanges(projectPath?: string, limit?: number): Promise<{
    changes: FileChange[];
    total: number;
}>;
/**
 * Trigger manual reindex of specific files
 */
export declare function watchReindex(files: string[], projectPath?: string, contextEngineUrl?: string): Promise<{
    success: boolean;
    filesIndexed: number;
    error?: string;
}>;
/**
 * Clear the changes log
 */
export declare function watchClear(projectPath?: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare const watchTools: {
    "dev.watch_status": {
        description: string;
        parameters: {
            project_path: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.watch_changes": {
        description: string;
        parameters: {
            project_path: {
                type: string;
                description: string;
                optional: boolean;
            };
            limit: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.watch_reindex": {
        description: string;
        parameters: {
            files: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            project_path: {
                type: string;
                description: string;
                optional: boolean;
            };
            context_engine_url: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.watch_clear": {
        description: string;
        parameters: {
            project_path: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
};
export {};
//# sourceMappingURL=watch.d.ts.map