export interface RegistryItem {
    id: string;
    kind: 'agent' | 'skill' | 'command' | 'mcp';
    name: string;
    slug: string;
    description: string;
    longDescription?: string;
    category?: string;
    tags: string[];
    dependencies: string[];
    files: string[];
    install?: string;
    setup?: string;
    layer?: string;
    modelRecommendation?: string;
    envKeys?: string[];
    installs?: number;
    remixes?: number;
    tokenSavings?: number;
}
export interface InstallConfig {
    claudeDir: string;
    installedItems: InstalledItem[];
}
export interface InstalledItem {
    id: string;
    slug: string;
    kind: string;
    installedAt: string;
    files: string[];
}
//# sourceMappingURL=types.d.ts.map