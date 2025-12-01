/**
 * Research-Decide-Trade Workflow Template
 * hunter-agent → decision-agent → wallet-agent
 */

import type { CreateWorkflowInput } from "../types.js";

export const researchDecideTemplate: CreateWorkflowInput = {
  name: "research-decide-trade",
  description: "Hunt for tokens, analyze with decision agent, execute trade if approved",
  steps: [
    {
      id: "hunt",
      agent: "hunter-agent",
      input: {
        sources: "${variables.sources || ['twitter', 'github']}",
        keywords: "${variables.keywords}",
        minScore: "${variables.minScore || 70}",
        limit: "${variables.limit || 10}",
      },
      onError: "fail",
      timeout: 60000,
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        opportunities: "${results.hunt}",
        strategy: "${variables.strategy || 'conservative'}",
        maxAllocation: "${variables.maxAllocation || 100}",
        riskTolerance: "${variables.riskTolerance || 'medium'}",
      },
      dependsOn: ["hunt"],
      onError: "fail",
    },
    {
      id: "trade",
      agent: "wallet-agent",
      input: {
        action: "swap",
        token: "${results.decide.selectedToken}",
        amount: "${results.decide.recommendedAmount}",
        slippage: "${variables.slippage || 1}",
        dryRun: "${variables.dryRun || true}",
      },
      dependsOn: ["decide"],
      condition: "results.decide.shouldTrade === true",
      onError: "skip",
    },
  ],
  variables: {
    sources: ["twitter", "github"],
    keywords: [],
    minScore: 70,
    limit: 10,
    strategy: "conservative",
    maxAllocation: 100,
    riskTolerance: "medium",
    slippage: 1,
    dryRun: true,
  },
};
