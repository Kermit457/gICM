export declare function getClaudeDir(): Promise<string>;
export declare function ensureClaudeDir(): Promise<string>;
export declare function writeFile(filePath: string, content: string): Promise<void>;
export declare function readFile(filePath: string): Promise<string>;
export declare function fileExists(filePath: string): Promise<boolean>;
export declare function deleteFile(filePath: string): Promise<void>;
export declare function getInstalledItems(): Promise<any[]>;
export declare function saveInstalledItems(items: any[]): Promise<void>;
export declare function getInstallPath(kind: string, filename: string, claudeDir: string): string;
//# sourceMappingURL=files.d.ts.map