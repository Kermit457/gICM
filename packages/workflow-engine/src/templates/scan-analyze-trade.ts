/**
 * Multi-Chain Scan Workflow Template
 * parallel(solana-scan, eth-scan, base-scan) → merge → decision → trade
 */

import type { CreateWorkflowInput } from "../types.js";

export const scanAnalyzeTradeTemplate: CreateWorkflowInput = {
  name: "scan-all-chains",
  description: "Scan multiple chains in parallel, merge results, analyze and trade",
  steps: [
    // Parallel chain scans
    {
      id: "scan-solana",
      agent: "hunter-agent",
      input: {
        chain: "solana",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}",
      },
      onError: "skip",
      timeout: 45000,
    },
    {
      id: "scan-eth",
      agent: "hunter-agent",
      input: {
        chain: "ethereum",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}",
      },
      onError: "skip",
      timeout: 45000,
    },
    {
      id: "scan-base",
      agent: "hunter-agent",
      input: {
        chain: "base",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}",
      },
      onError: "skip",
      timeout: 45000,
    },
    // Merge and analyze (waits for all scans)
    {
      id: "analyze",
      agent: "decision-agent",
      input: {
        solanaResults: "${results['scan-solana']}",
        ethResults: "${results['scan-eth']}",
        baseResults: "${results['scan-base']}",
        strategy: "${variables.strategy || 'multi-chain-diversified'}",
        maxPositions: "${variables.maxPositions || 3}",
        riskProfile: "${variables.riskProfile || 'balanced'}",
      },
      dependsOn: ["scan-solana", "scan-eth", "scan-base"],
      onError: "fail",
    },
    // Execute trades based on analysis
    {
      id: "execute",
      agent: "wallet-agent",
      input: {
        trades: "${results.analyze.recommendedTrades}",
        totalBudget: "${variables.budget || 500}",
        dryRun: "${variables.dryRun || true}",
      },
      dependsOn: ["analyze"],
      condition: "results.analyze.recommendedTrades && results.analyze.recommendedTrades.length > 0",
      onError: "skip",
    },
  ],
  variables: {
    scanType: "new-tokens",
    minLiquidity: 10000,
    limit: 20,
    strategy: "multi-chain-diversified",
    maxPositions: 3,
    riskProfile: "balanced",
    budget: 500,
    dryRun: true,
  },
};
