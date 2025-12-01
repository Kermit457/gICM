/**
 * TypeScript types for gICM CLI
 */
export type ItemKind = "agent" | "skill" | "command" | "mcp" | "setting" | "bundle" | "workflow" | "component";
export interface RegistryItem {
    id: string;
    kind: ItemKind;
    name: string;
    slug: string;
    description: string;
    longDescription?: string;
    category: string;
    tags: string[];
    dependencies?: string[];
    files?: string[];
    install: string;
    envKeys?: string[];
    installs?: number;
    remixes?: number;
    tokenSavings?: number;
    layer?: ".agent" | ".claude" | "docs";
    modelRecommendation?: "sonnet" | "opus" | "haiku";
}
export interface FileContent {
    path: string;
    content: string;
}
export interface BundleStats {
    selectedCount: number;
    totalCount: number;
    dependencyCount: number;
    tokenSavings: number;
    byKind: {
        agent: number;
        skill: number;
        command: number;
        mcp: number;
        setting?: number;
    };
}
export interface BundleResponse {
    command: string;
    items: RegistryItem[];
    stats: BundleStats;
}
export interface ParsedItem {
    kind: ItemKind;
    slug: string;
    original: string;
}
export type Platform = "claude" | "gemini" | "openai";
export interface CLIOptions {
    apiUrl?: string;
    verbose?: boolean;
    skipConfirm?: boolean;
    platform?: Platform;
}
export interface StackInfo {
    id: string;
    name: string;
    description: string;
    tags: string[];
    author?: string;
    version: string;
    featured: boolean;
}
export interface StackStats {
    totalItems: number;
    missingCount: number;
    byKind: {
        agent: number;
        skill: number;
        command: number;
        mcp: number;
        setting: number;
        workflow: number;
    };
    tokenSavings: number;
}
export interface StackResponse {
    stack: StackInfo;
    items: RegistryItem[];
    missingItems: string[];
    stats: StackStats;
}
export interface StackListItem {
    id: string;
    name: string;
    description: string;
    itemCount: number;
    tags: string[];
    author?: string;
    version: string;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface StackListResponse {
    stacks: StackListItem[];
    total: number;
}
export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: Record<string, unknown>;
        required: string[];
    };
}
export interface ToolSearchResult {
    tool: ToolDefinition;
    metadata: {
        id: string;
        kind: string;
        category: string;
        tags: string[];
        install: string;
        platforms: string[];
        qualityScore: number;
        installs: number;
    };
    score: number;
}
export interface ToolSearchResponse {
    tools: ToolDefinition[];
    results: ToolSearchResult[];
    meta: {
        query: string;
        totalMatches: number;
        searchTime: number;
        platform?: string;
        kind?: string;
    };
}
//# sourceMappingURL=types.d.ts.map