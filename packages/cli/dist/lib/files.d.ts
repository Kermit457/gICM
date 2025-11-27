/**
 * File writing utilities for gICM CLI
 */
import type { RegistryItem, FileContent } from './types';
export declare class FileWriter {
    private basePath;
    private platform;
    constructor(basePath?: string, platform?: "claude" | "gemini" | "openai");
    /**
     * Get the root configuration directory name (.claude or .gemini)
     */
    private get configDirName();
    /**
     * Write files for a marketplace item
     */
    writeItem(item: RegistryItem, files: FileContent[]): Promise<void>;
    /**
     * Write a single file
     */
    private writeFile;
    /**
     * Check if config directory exists and is writable
     */
    ensureConfigDir(): Promise<void>;
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