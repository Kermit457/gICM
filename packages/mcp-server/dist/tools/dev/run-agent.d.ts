/**
 * dev.run_agent - Execute a gICM agent
 *
 * Dispatches to Integration Hub to run specialized agents
 * with proper autonomy level enforcement.
 */
interface AgentResult {
    success: boolean;
    agentId: string;
    result?: unknown;
    error?: string;
    executionTime: number;
    autonomyDecision: {
        action: "auto_execute" | "queue_approval" | "escalate" | "reject";
        reason: string;
    };
}
export declare function runAgent(agentId: string, input: Record<string, unknown>, options?: {
    timeout?: number;
    autonomyOverride?: number;
    dryRun?: boolean;
}): Promise<AgentResult>;
export declare function listAgents(): Promise<{
    agents: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
    }>;
}>;
export {};
//# sourceMappingURL=run-agent.d.ts.map