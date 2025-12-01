/**
 * Capability Router - Suggests and auto-installs tools based on task context
 */
interface CapabilitySuggestion {
    id: string;
    name: string;
    kind: "agent" | "skill" | "command" | "mcp";
    description: string;
    relevance: number;
    reason: string;
    installCommand: string;
    isInstalled: boolean;
}
interface SuggestResult {
    task: string;
    projectType: string;
    suggestions: CapabilitySuggestion[];
    autoInstallable: string[];
    message: string;
}
/**
 * Analyze task and suggest relevant capabilities
 */
export declare function suggestCapabilities(task: string, autoInstall?: boolean, maxSuggestions?: number): Promise<SuggestResult>;
export declare const suggestCapabilitiesTool: {
    "dev.suggest_capabilities": {
        description: string;
        parameters: {
            task: {
                type: string;
                description: string;
            };
            auto_install: {
                type: string;
                description: string;
                default: boolean;
                optional: boolean;
            };
            max_suggestions: {
                type: string;
                description: string;
                default: number;
                optional: boolean;
            };
        };
    };
};
export {};
//# sourceMappingURL=suggest-capabilities.d.ts.map