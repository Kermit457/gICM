import { AgentConfig, BaseAgent, AgentContext, AgentResult } from '@gicm/agent-core';
import { z } from 'zod';

declare const DeployTargetSchema: z.ZodEnum<["gicm_registry", "npm", "github"]>;
type DeployTarget = z.infer<typeof DeployTargetSchema>;
declare const DeployRequestSchema: z.ZodObject<{
    buildId: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    targets: z.ZodArray<z.ZodEnum<["gicm_registry", "npm", "github"]>, "many">;
    changelog: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    buildId: string;
    name: string;
    version: string;
    targets: ("gicm_registry" | "npm" | "github")[];
    changelog?: string | undefined;
}, {
    buildId: string;
    name: string;
    version: string;
    targets: ("gicm_registry" | "npm" | "github")[];
    changelog?: string | undefined;
}>;
type DeployRequest = z.infer<typeof DeployRequestSchema>;
declare const DeployResultSchema: z.ZodObject<{
    deployId: z.ZodString;
    request: z.ZodObject<{
        buildId: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        targets: z.ZodArray<z.ZodEnum<["gicm_registry", "npm", "github"]>, "many">;
        changelog: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        buildId: string;
        name: string;
        version: string;
        targets: ("gicm_registry" | "npm" | "github")[];
        changelog?: string | undefined;
    }, {
        buildId: string;
        name: string;
        version: string;
        targets: ("gicm_registry" | "npm" | "github")[];
        changelog?: string | undefined;
    }>;
    status: z.ZodEnum<["pending", "deploying", "completed", "failed"]>;
    results: z.ZodArray<z.ZodObject<{
        target: z.ZodEnum<["gicm_registry", "npm", "github"]>;
        success: z.ZodBoolean;
        url: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        target: "gicm_registry" | "npm" | "github";
        success: boolean;
        url?: string | undefined;
        error?: string | undefined;
    }, {
        target: "gicm_registry" | "npm" | "github";
        success: boolean;
        url?: string | undefined;
        error?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "deploying" | "completed" | "failed";
    deployId: string;
    request: {
        buildId: string;
        name: string;
        version: string;
        targets: ("gicm_registry" | "npm" | "github")[];
        changelog?: string | undefined;
    };
    results: {
        target: "gicm_registry" | "npm" | "github";
        success: boolean;
        url?: string | undefined;
        error?: string | undefined;
    }[];
}, {
    status: "pending" | "deploying" | "completed" | "failed";
    deployId: string;
    request: {
        buildId: string;
        name: string;
        version: string;
        targets: ("gicm_registry" | "npm" | "github")[];
        changelog?: string | undefined;
    };
    results: {
        target: "gicm_registry" | "npm" | "github";
        success: boolean;
        url?: string | undefined;
        error?: string | undefined;
    }[];
}>;
type DeployResult = z.infer<typeof DeployResultSchema>;
interface DeployerAgentConfig extends AgentConfig {
    registryApiUrl?: string;
    npmToken?: string;
    githubToken?: string;
    githubOwner?: string;
    packageDir?: string;
}
declare class DeployerAgent extends BaseAgent {
    private registryApiUrl;
    private npmToken?;
    private githubToken?;
    private githubOwner;
    private packageDir?;
    constructor(config: DeployerAgentConfig);
    getSystemPrompt(): string;
    analyze(context: AgentContext): Promise<AgentResult>;
    deploy(request: DeployRequest): Promise<DeployResult>;
    private deployToTarget;
    /**
     * Deploy to gICM Registry via API
     */
    private deployToRegistry;
    /**
     * Deploy to npm registry
     */
    private deployToNpm;
    /**
     * Create GitHub release
     */
    private deployToGitHub;
    private handleDeploy;
}

export { type DeployRequest, DeployRequestSchema, type DeployResult, DeployResultSchema, type DeployTarget, DeployTargetSchema, DeployerAgent, type DeployerAgentConfig };
