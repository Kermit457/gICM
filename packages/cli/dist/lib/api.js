"use strict";
/**
 * API client for gICM marketplace
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceAPI = exports.GICMAPIClient = void 0;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
class GICMAPIClient {
    constructor(apiUrl) {
        this.baseURL = apiUrl || 'https://gicm-marketplace.vercel.app/api';
        this.client = axios_1.default.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Fetch a single item by slug
     */
    async getItem(slug) {
        try {
            const { data } = await this.client.get(`/items/${slug}`);
            return data;
        }
        catch (error) {
            this.handleError(error, `Failed to fetch item: ${slug}`);
            throw error;
        }
    }
    /**
     * Download file contents for an item
     */
    async getFiles(slug) {
        try {
            const { data } = await this.client.get(`/items/${slug}/files`);
            return data;
        }
        catch (error) {
            this.handleError(error, `Failed to download files for: ${slug}`);
            throw error;
        }
    }
    /**
     * Resolve dependencies for a list of items
     */
    async resolveBundle(itemIds) {
        try {
            const { data } = await this.client.post('/bundles/generate', {
                itemIds,
            });
            return data;
        }
        catch (error) {
            this.handleError(error, 'Failed to resolve dependencies');
            throw error;
        }
    }
    /**
     * Fetch all registry items
     */
    async getRegistry() {
        try {
            const { data } = await this.client.get('/registry');
            return data;
        }
        catch (error) {
            this.handleError(error, 'Failed to fetch registry');
            throw error;
        }
    }
    /**
     * Search items
     */
    async search(query, kind) {
        try {
            const params = new URLSearchParams({ q: query });
            if (kind)
                params.append('kind', kind);
            const { data } = await this.client.get(`/search?${params}`);
            return data;
        }
        catch (error) {
            this.handleError(error, 'Search failed');
            throw error;
        }
    }
    /**
     * Fetch a stack by ID
     */
    async getStack(stackId) {
        try {
            const { data } = await this.client.get(`/stacks/${stackId}`);
            return data;
        }
        catch (error) {
            this.handleError(error, `Failed to fetch stack: ${stackId}`);
            throw error;
        }
    }
    /**
     * List all available stacks
     */
    async listStacks() {
        try {
            const { data } = await this.client.get('/stacks');
            return data;
        }
        catch (error) {
            this.handleError(error, 'Failed to fetch stacks');
            throw error;
        }
    }
    /**
     * Search for PTC-compatible tools
     */
    async searchTools(query, options = {}) {
        try {
            const { data } = await this.client.post('/tools/search', {
                query,
                limit: options.limit || 10,
                platform: options.platform,
                kind: options.kind,
                minQuality: options.minQuality,
            });
            return data;
        }
        catch (error) {
            this.handleError(error, 'Tool search failed');
            throw error;
        }
    }
    /**
     * Save a context to cloud storage
     */
    async saveContext(contextData) {
        try {
            const { data } = await this.client.post('/contexts', contextData);
            return data;
        }
        catch (error) {
            this.handleError(error, 'Failed to save context');
            throw error;
        }
    }
    /**
     * Load a context from cloud storage
     */
    async loadContext(contextId) {
        try {
            const { data } = await this.client.get(`/contexts/${contextId}`);
            return data;
        }
        catch (error) {
            this.handleError(error, `Failed to load context: ${contextId}`);
            throw error;
        }
    }
    /**
     * List available contexts
     */
    async listContexts(mineOnly) {
        try {
            const params = mineOnly ? '?mine=true' : '';
            const { data } = await this.client.get(`/contexts${params}`);
            return data;
        }
        catch (error) {
            this.handleError(error, 'Failed to list contexts');
            throw error;
        }
    }
    /**
     * Handle API errors with user-friendly messages
     */
    handleError(error, context) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.response?.status === 404) {
                console.error(chalk_1.default.red(`\n✗ ${context}`));
                console.error(chalk_1.default.yellow('  Item not found in the marketplace.'));
                console.error(chalk_1.default.gray('  Tip: Use `gicm search <query>` to find available items.\n'));
            }
            else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
                console.error(chalk_1.default.red(`\n✗ Cannot connect to gICM marketplace`));
                console.error(chalk_1.default.yellow('  Please check your internet connection.'));
                console.error(chalk_1.default.gray(`  API URL: ${this.baseURL}\n`));
            }
            else if (axiosError.code === 'ETIMEDOUT') {
                console.error(chalk_1.default.red(`\n✗ Request timed out`));
                console.error(chalk_1.default.yellow('  The marketplace API is taking too long to respond.'));
                console.error(chalk_1.default.gray('  Please try again later.\n'));
            }
            else {
                console.error(chalk_1.default.red(`\n✗ ${context}`));
                console.error(chalk_1.default.yellow(`  ${axiosError.message}\n`));
            }
        }
        else {
            console.error(chalk_1.default.red(`\n✗ ${context}`));
            console.error(chalk_1.default.yellow(`  ${error}\n`));
        }
    }
}
exports.GICMAPIClient = GICMAPIClient;
exports.MarketplaceAPI = GICMAPIClient;
//# sourceMappingURL=api.js.map