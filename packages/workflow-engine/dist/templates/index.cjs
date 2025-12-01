"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/templates/index.ts
var templates_exports = {};
__export(templates_exports, {
  auditDeployTemplate: () => auditDeployTemplate,
  getTemplate: () => getTemplate,
  listTemplates: () => listTemplates,
  researchDecideTemplate: () => researchDecideTemplate,
  scanAnalyzeTradeTemplate: () => scanAnalyzeTradeTemplate,
  templates: () => templates
});
module.exports = __toCommonJS(templates_exports);

// src/templates/audit-deploy.ts
var auditDeployTemplate = {
  name: "audit-deploy",
  description: "Audit smart contract, get approval decision, then deploy if approved",
  steps: [
    {
      id: "audit",
      agent: "audit-agent",
      input: {
        contractPath: "${variables.contractPath}",
        severity: "${variables.severity || 'high'}"
      },
      onError: "fail",
      timeout: 12e4
      // 2 min for audit
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        context: "Contract audit results",
        auditResult: "${results.audit}",
        threshold: "${variables.approvalThreshold || 80}"
      },
      dependsOn: ["audit"],
      onError: "fail"
    },
    {
      id: "deploy",
      agent: "deployer-agent",
      input: {
        contractPath: "${variables.contractPath}",
        network: "${variables.network || 'devnet'}",
        auditReport: "${results.audit}",
        decisionReport: "${results.decide}"
      },
      dependsOn: ["decide"],
      condition: "results.decide.approved === true",
      onError: "fail"
    }
  ],
  variables: {
    contractPath: "",
    network: "devnet",
    severity: "high",
    approvalThreshold: 80
  }
};

// src/templates/research-decide.ts
var researchDecideTemplate = {
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
        limit: "${variables.limit || 10}"
      },
      onError: "fail",
      timeout: 6e4
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        opportunities: "${results.hunt}",
        strategy: "${variables.strategy || 'conservative'}",
        maxAllocation: "${variables.maxAllocation || 100}",
        riskTolerance: "${variables.riskTolerance || 'medium'}"
      },
      dependsOn: ["hunt"],
      onError: "fail"
    },
    {
      id: "trade",
      agent: "wallet-agent",
      input: {
        action: "swap",
        token: "${results.decide.selectedToken}",
        amount: "${results.decide.recommendedAmount}",
        slippage: "${variables.slippage || 1}",
        dryRun: "${variables.dryRun || true}"
      },
      dependsOn: ["decide"],
      condition: "results.decide.shouldTrade === true",
      onError: "skip"
    }
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
    dryRun: true
  }
};

// src/templates/scan-analyze-trade.ts
var scanAnalyzeTradeTemplate = {
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
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
    },
    {
      id: "scan-eth",
      agent: "hunter-agent",
      input: {
        chain: "ethereum",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
    },
    {
      id: "scan-base",
      agent: "hunter-agent",
      input: {
        chain: "base",
        scanType: "${variables.scanType || 'new-tokens'}",
        minLiquidity: "${variables.minLiquidity || 10000}",
        limit: "${variables.limit || 20}"
      },
      onError: "skip",
      timeout: 45e3
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
        riskProfile: "${variables.riskProfile || 'balanced'}"
      },
      dependsOn: ["scan-solana", "scan-eth", "scan-base"],
      onError: "fail"
    },
    // Execute trades based on analysis
    {
      id: "execute",
      agent: "wallet-agent",
      input: {
        trades: "${results.analyze.recommendedTrades}",
        totalBudget: "${variables.budget || 500}",
        dryRun: "${variables.dryRun || true}"
      },
      dependsOn: ["analyze"],
      condition: "results.analyze.recommendedTrades && results.analyze.recommendedTrades.length > 0",
      onError: "skip"
    }
  ],
  variables: {
    scanType: "new-tokens",
    minLiquidity: 1e4,
    limit: 20,
    strategy: "multi-chain-diversified",
    maxPositions: 3,
    riskProfile: "balanced",
    budget: 500,
    dryRun: true
  }
};

// src/templates/index.ts
var templates = {
  "audit-deploy": auditDeployTemplate,
  "research-decide-trade": researchDecideTemplate,
  "scan-all-chains": scanAnalyzeTradeTemplate
};
function getTemplate(name) {
  return templates[name];
}
function listTemplates() {
  return Object.entries(templates).map(([name, template]) => ({
    name,
    description: template.description || ""
  }));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  auditDeployTemplate,
  getTemplate,
  listTemplates,
  researchDecideTemplate,
  scanAnalyzeTradeTemplate,
  templates
});
