/**
 * API client for gICM marketplace
 */
import type { RegistryItem, FileContent, BundleResponse, StackResponse, StackListResponse, ToolSearchResponse } from './types';
export declare class GICMAPIClient {
    private client;
    private baseURL;
    constructor(apiUrl?: string);
    /**
     * Fetch a single item by slug
     */
    getItem(slug: string): Promise<RegistryItem>;
    /**
     * Download file contents for an item
     */
    getFiles(slug: string): Promise<FileContent[]>;
    /**
     * Resolve dependencies for a list of items
     */
    resolveBundle(itemIds: string[]): Promise<BundleResponse>;
    /**
     * Fetch all registry items
     */
    getRegistry(): Promise<RegistryItem[]>;
    /**
     * Search items
     */
    search(query: string, kind?: string): Promise<RegistryItem[]>;
    /**
     * Fetch a stack by ID
     */
    getStack(stackId: string): Promise<StackResponse>;
    /**
     * List all available stacks
     */
    listStacks(): Promise<StackListResponse>;
    /**
     * Search for PTC-compatible tools
     */
    searchTools(query: string, options?: {
        limit?: number;
        platform?: string;
        kind?: string;
        minQuality?: number;
    }): Promise<ToolSearchResponse>;
    /**
     * Save a context to cloud storage
     */
    saveContext(contextData: {
        name: string;
        description?: string;
        projectType: string;
        language: string;
        frameworks: string[];
        indexingConfig: Record<string, unknown>;
        mcpConfig: Record<string, unknown>;
        autonomyLevel: number;
        capabilities: string[];
        isPublic: boolean;
    }): Promise<{
        id: string;
        name: string;
        isPublic: boolean;
    }>;
    /**
     * Load a context from cloud storage
     */
    loadContext(contextId: string): Promise<{
        id: string;
        name: string;
        description?: string;
        projectType: string;
        language: string;
        frameworks: string[];
        indexingConfig: Record<string, unknown>;
        mcpConfig: Record<string, unknown>;
        autonomyLevel: number;
        capabilities: string[];
        isPublic: boolean;
        createdAt: string;
    }>;
    /**
     * List available contexts
     */
    listContexts(mineOnly?: boolean): Promise<Array<{
        id: string;
        name: string;
        description?: string;
        projectType: string;
        language: string;
        frameworks: string[];
        indexingConfig: Record<string, unknown>;
        mcpConfig: Record<string, unknown>;
        autonomyLevel: number;
        capabilities: string[];
        isPublic: boolean;
        createdAt: string;
    }>>;
    /**
     * Handle API errors with user-friendly messages
     */
    private handleError;
}
export { GICMAPIClient as MarketplaceAPI };
//# sourceMappingURL=api.d.ts.map