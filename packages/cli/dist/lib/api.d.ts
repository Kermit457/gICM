/**
 * API client for gICM marketplace
 */
import type { RegistryItem, FileContent, BundleResponse } from './types';
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
     * Handle API errors with user-friendly messages
     */
    private handleError;
}
//# sourceMappingURL=api.d.ts.map