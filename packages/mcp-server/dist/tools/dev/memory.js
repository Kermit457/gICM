/**
 * dev.memory* MCP Tools
 * AI Memory - Persistent context storage across sessions
 */
/**
 * Remember something
 */
export async function memoryRemember(params) {
    try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();
        const entry = await mem.remember({
            key: params.key,
            value: params.value,
            type: params.type,
            confidence: params.confidence,
            tags: params.tags,
            expiresIn: params.expiresInSeconds,
            namespace: params.namespace,
        });
        return { success: true, entry: entry };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * Recall a memory
 */
export async function memoryRecall(params) {
    try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();
        const entry = await mem.recall(params.key, params.namespace || "default");
        return { found: !!entry, entry: entry };
    }
    catch (error) {
        return {
            found: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * Search memories
 */
export async function memorySearch(params) {
    try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();
        const entries = await mem.search({
            type: params.type,
            tags: params.tags,
            keyPattern: params.keyPattern,
            namespace: params.namespace || "default",
            limit: params.limit || 20,
        });
        return { entries: entries };
    }
    catch (error) {
        return {
            entries: [],
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * Forget a memory
 */
export async function memoryForget(params) {
    try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();
        const deleted = await mem.forget(params.key, params.namespace || "default");
        return { success: deleted };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * Get memory stats
 */
export async function memoryStats() {
    try {
        const { Memory } = await import("@gicm/memory");
        const mem = new Memory();
        const stats = await mem.getStats();
        return {
            totalEntries: stats.totalEntries,
            byType: stats.byType,
            byNamespace: stats.byNamespace,
            storageSize: stats.storageSize,
        };
    }
    catch (error) {
        return {
            totalEntries: 0,
            byType: {},
            byNamespace: {},
            storageSize: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
// Tool definitions for dev.memory* namespace
export const memoryTools = {
    "dev.memory_remember": {
        description: "Store a memory for later recall. Use this to remember facts, preferences, decisions, or context that should persist across sessions.",
        parameters: {
            key: {
                type: "string",
                description: "Unique key for the memory",
            },
            value: {
                type: "any",
                description: "The value to remember (can be any JSON-serializable value)",
            },
            type: {
                type: "string",
                description: "Memory type: fact (immutable truth), preference (user choice), context (session info), decision (choice made), outcome (result)",
                enum: ["fact", "preference", "context", "decision", "outcome"],
            },
            confidence: {
                type: "number",
                description: "Confidence score from 0 to 1 (default: 1)",
                optional: true,
            },
            tags: {
                type: "array",
                description: "Tags for categorizing the memory",
                items: { type: "string" },
                optional: true,
            },
            expires_in_seconds: {
                type: "number",
                description: "Expiration time in seconds (optional)",
                optional: true,
            },
            namespace: {
                type: "string",
                description: "Memory namespace (default: 'default')",
                optional: true,
            },
        },
    },
    "dev.memory_recall": {
        description: "Recall a stored memory by its key. Returns the memory if found and not expired.",
        parameters: {
            key: {
                type: "string",
                description: "Key of the memory to recall",
            },
            namespace: {
                type: "string",
                description: "Memory namespace (default: 'default')",
                optional: true,
            },
        },
    },
    "dev.memory_search": {
        description: "Search memories by type, tags, or key pattern. Useful for finding related memories.",
        parameters: {
            type: {
                type: "string",
                description: "Filter by memory type",
                enum: ["fact", "preference", "context", "decision", "outcome"],
                optional: true,
            },
            tags: {
                type: "array",
                description: "Filter by tags (memories must have ALL specified tags)",
                items: { type: "string" },
                optional: true,
            },
            key_pattern: {
                type: "string",
                description: "Regex pattern to match memory keys",
                optional: true,
            },
            namespace: {
                type: "string",
                description: "Memory namespace (default: 'default')",
                optional: true,
            },
            limit: {
                type: "number",
                description: "Maximum number of results (default: 20)",
                optional: true,
            },
        },
    },
    "dev.memory_forget": {
        description: "Delete a memory. Use this when information is no longer valid or needed.",
        parameters: {
            key: {
                type: "string",
                description: "Key of the memory to forget",
            },
            namespace: {
                type: "string",
                description: "Memory namespace (default: 'default')",
                optional: true,
            },
        },
    },
    "dev.memory_stats": {
        description: "Get memory statistics including total entries, types breakdown, and storage usage.",
        parameters: {},
    },
};
//# sourceMappingURL=memory.js.map