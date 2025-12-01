/**
 * dev.run_agent - Execute a gICM agent
 *
 * Dispatches to Integration Hub to run specialized agents
 * with proper autonomy level enforcement.
 */

import axios from "axios";

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

const INTEGRATION_HUB_URL =
  process.env.GICM_INTEGRATION_HUB_URL || "http://localhost:3001";

export async function runAgent(
  agentId: string,
  input: Record<string, unknown>,
  options: {
    timeout?: number;
    autonomyOverride?: number;
    dryRun?: boolean;
  } = {}
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    // Call Integration Hub to execute agent
    const response = await axios.post(
      `${INTEGRATION_HUB_URL}/api/agents/execute`,
      {
        agentId,
        input,
        options: {
          timeout: options.timeout || 30000,
          autonomyLevel: options.autonomyOverride,
          dryRun: options.dryRun,
        },
      },
      {
        timeout: options.timeout || 30000,
      }
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      agentId,
      result: response.data.result,
      executionTime,
      autonomyDecision: response.data.autonomyDecision || {
        action: "auto_execute",
        reason: "Agent execution completed",
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Check if Integration Hub is not available
    if (axios.isAxiosError(error) && (error as { code?: string }).code === "ECONNREFUSED") {
      return {
        success: false,
        agentId,
        error:
          "Integration Hub not available. Start it with: pnpm --filter @gicm/integration-hub start",
        executionTime,
        autonomyDecision: {
          action: "reject",
          reason: "Integration Hub not available",
        },
      };
    }

    return {
      success: false,
      agentId,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime,
      autonomyDecision: {
        action: "reject",
        reason: "Agent execution failed",
      },
    };
  }
}

// List available agents
export async function listAgents(): Promise<{
  agents: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
}> {
  try {
    const response = await axios.get(`${INTEGRATION_HUB_URL}/api/agents/list`);
    return response.data;
  } catch {
    // Return static list if Integration Hub not available
    return {
      agents: [
        {
          id: "wallet-agent",
          name: "Wallet Agent",
          description: "Wallet operations and token swaps",
          category: "trading",
        },
        {
          id: "defi-agent",
          name: "DeFi Agent",
          description: "DeFi protocols and yield farming",
          category: "trading",
        },
        {
          id: "audit-agent",
          name: "Audit Agent",
          description: "Smart contract security auditing",
          category: "security",
        },
        {
          id: "hunter-agent",
          name: "Hunter Agent",
          description: "Token opportunity hunting",
          category: "trading",
        },
        {
          id: "decision-agent",
          name: "Decision Agent",
          description: "Trade decision making",
          category: "trading",
        },
        {
          id: "builder-agent",
          name: "Builder Agent",
          description: "Code generation",
          category: "development",
        },
        {
          id: "refactor-agent",
          name: "Refactor Agent",
          description: "Code refactoring",
          category: "development",
        },
      ],
    };
  }
}
