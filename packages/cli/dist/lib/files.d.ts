/**
 * File writing utilities for gICM CLI
 */
import type { RegistryItem, FileContent } from './types';
export declare class FileWriter {
    private basePath;
    constructor(basePath?: string);
    /**
     * Write files for a marketplace item
     */
    writeItem(item: RegistryItem, files: FileContent[]): Promise<void>;
    /**
     * Write a single file
     */
    private writeFile;
    /**
     * Check if .claude directory exists and is writable
     */
    ensureClaudeDir(): Promise<void>;
    /**
     * Get installation paths for different item types
     */
    getInstallPath(item: RegistryItem): string;
    /**
     * Check if item is already installed
     */
    isInstalled(item: RegistryItem): Promise<boolean>;
    /**
     * Get list of installed items by kind
     */
    getInstalledItems(kind?: string): Promise<string[]>;
    /**
     * Handle file writing errors
     */
    private handleError;
}
//# sourceMappingURL=files.d.ts.map