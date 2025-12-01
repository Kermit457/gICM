import { BaseAgent, AgentConfig, AgentContext, AgentResult } from '@gicm/agent-core';
import { z } from 'zod';

declare const BuildRequestSchema: z.ZodObject<{
    discoveryId: z.ZodString;
    type: z.ZodEnum<["agent", "skill", "mcp", "integration"]>;
    name: z.ZodString;
    description: z.ZodString;
    sourceUrl: z.ZodString;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    discoveryId: string;
    type: "agent" | "skill" | "mcp" | "integration";
    name: string;
    description: string;
    sourceUrl: string;
    features?: string[] | undefined;
    dependencies?: string[] | undefined;
}, {
    discoveryId: string;
    type: "agent" | "skill" | "mcp" | "integration";
    name: string;
    description: string;
    sourceUrl: string;
    features?: string[] | undefined;
    dependencies?: string[] | undefined;
}>;
type BuildRequest = z.infer<typeof BuildRequestSchema>;
declare const BuildResultSchema: z.ZodObject<{
    buildId: z.ZodString;
    request: z.ZodObject<{
        discoveryId: z.ZodString;
        type: z.ZodEnum<["agent", "skill", "mcp", "integration"]>;
        name: z.ZodString;
        description: z.ZodString;
        sourceUrl: z.ZodString;
        features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        discoveryId: string;
        type: "agent" | "skill" | "mcp" | "integration";
        name: string;
        description: string;
        sourceUrl: string;
        features?: string[] | undefined;
        dependencies?: string[] | undefined;
    }, {
        discoveryId: string;
        type: "agent" | "skill" | "mcp" | "integration";
        name: string;
        description: string;
        sourceUrl: string;
        features?: string[] | undefined;
        dependencies?: string[] | undefined;
    }>;
    status: z.ZodEnum<["pending", "building", "testing", "completed", "failed"]>;
    outputPath: z.ZodOptional<z.ZodString>;
    artifacts: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    generatedCode: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "building" | "testing" | "completed" | "failed";
    buildId: string;
    request: {
        discoveryId: string;
        type: "agent" | "skill" | "mcp" | "integration";
        name: string;
        description: string;
        sourceUrl: string;
        features?: string[] | undefined;
        dependencies?: string[] | undefined;
    };
    artifacts: string[];
    outputPath?: string | undefined;
    generatedCode?: Record<string, string> | undefined;
    error?: string | undefined;
}, {
    status: "pending" | "building" | "testing" | "completed" | "failed";
    buildId: string;
    request: {
        discoveryId: string;
        type: "agent" | "skill" | "mcp" | "integration";
        name: string;
        description: string;
        sourceUrl: string;
        features?: string[] | undefined;
        dependencies?: string[] | undefined;
    };
    outputPath?: string | undefined;
    artifacts?: string[] | undefined;
    generatedCode?: Record<string, string> | undefined;
    error?: string | undefined;
}>;
type BuildResult = z.infer<typeof BuildResultSchema>;
interface BuilderAgentConfig extends AgentConfig {
    outputDir?: string;
}
declare class BuilderAgent extends BaseAgent {
    private outputDir;
    private llmClient?;
    constructor(config: BuilderAgentConfig);
    private logProgress;
    getSystemPrompt(): string;
    analyze(context: AgentContext): Promise<AgentResult>;
    /**
     * Build a full package from a discovery request
     */
    build(request: BuildRequest): Promise<BuildResult>;
    /**
     * Generate code using templates or LLM
     */
    private generateCode;
    /**
     * Use LLM to generate enhanced code based on features
     */
    private enhanceWithLLM;
    /**
     * Write generated code to files
     */
    private writeFiles;
    /**
     * Quick generate without full build request
     */
    generate(type: "agent" | "skill" | "mcp" | "integration", name: string, description: string): Promise<BuildResult>;
    private handleBuild;
    private handleGenerate;
}

export { type BuildRequest, BuildRequestSchema, type BuildResult, BuildResultSchema, BuilderAgent, type BuilderAgentConfig, BuilderAgent as default };
