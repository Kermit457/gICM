/**
 * dev.memory* MCP Tools
 * AI Memory - Persistent context storage across sessions
 */
interface MemoryEntry {
    id: string;
    key: string;
    value: unknown;
    type: "fact" | "preference" | "context" | "decision" | "outcome";
    confidence: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    expiresAt?: string;
    source?: string;
    accessCount?: number;
    lastAccessedAt?: string;
}
/**
 * Remember something
 */
export declare function memoryRemember(params: {
    key: string;
    value: unknown;
    type: MemoryEntry["type"];
    confidence?: number;
    tags?: string[];
    expiresInSeconds?: number;
    namespace?: string;
}): Promise<{
    success: boolean;
    entry?: MemoryEntry;
    error?: string;
}>;
/**
 * Recall a memory
 */
export declare function memoryRecall(params: {
    key: string;
    namespace?: string;
}): Promise<{
    found: boolean;
    entry?: MemoryEntry;
    error?: string;
}>;
/**
 * Search memories
 */
export declare function memorySearch(params: {
    type?: MemoryEntry["type"];
    tags?: string[];
    keyPattern?: string;
    namespace?: string;
    limit?: number;
}): Promise<{
    entries: MemoryEntry[];
    error?: string;
}>;
/**
 * Forget a memory
 */
export declare function memoryForget(params: {
    key: string;
    namespace?: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Get memory stats
 */
export declare function memoryStats(): Promise<{
    totalEntries: number;
    byType: Record<string, number>;
    byNamespace: Record<string, number>;
    storageSize: number;
    error?: string;
}>;
export declare const memoryTools: {
    "dev.memory_remember": {
        description: string;
        parameters: {
            key: {
                type: string;
                description: string;
            };
            value: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
                enum: string[];
            };
            confidence: {
                type: string;
                description: string;
                optional: boolean;
            };
            tags: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
                optional: boolean;
            };
            expires_in_seconds: {
                type: string;
                description: string;
                optional: boolean;
            };
            namespace: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.memory_recall": {
        description: string;
        parameters: {
            key: {
                type: string;
                description: string;
            };
            namespace: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.memory_search": {
        description: string;
        parameters: {
            type: {
                type: string;
                description: string;
                enum: string[];
                optional: boolean;
            };
            tags: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
                optional: boolean;
            };
            key_pattern: {
                type: string;
                description: string;
                optional: boolean;
            };
            namespace: {
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
    "dev.memory_forget": {
        description: string;
        parameters: {
            key: {
                type: string;
                description: string;
            };
            namespace: {
                type: string;
                description: string;
                optional: boolean;
            };
        };
    };
    "dev.memory_stats": {
        description: string;
        parameters: {};
    };
};
export {};
//# sourceMappingURL=memory.d.ts.map