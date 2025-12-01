// src/templates/index.ts
var researchAndAnalyze = {
  id: "research-and-analyze",
  name: "Research & Analyze",
  description: "Hunt for opportunities, analyze findings, and generate decision scores",
  version: "1.0.0",
  steps: [
    {
      id: "hunt",
      tool: "hunter_agent",
      inputs: {
        task: "${inputs.query}",
        sources: "${inputs.sources}"
      },
      timeout: 6e4
    },
    {
      id: "analyze",
      tool: "defi_agent",
      inputs: {
        task: "Analyze the discovered opportunities",
        data: "${results.hunt}"
      },
      dependsOn: ["hunt"]
    },
    {
      id: "decide",
      tool: "decision_agent",
      inputs: {
        task: "Score and rank opportunities",
        analysis: "${results.analyze}"
      },
      dependsOn: ["analyze"]
    }
  ],
  inputs: {
    query: {
      type: "string",
      description: "What to search for",
      required: true
    },
    sources: {
      type: "string",
      description: "Data sources to use",
      default: "github,twitter,hackernews"
    }
  },
  outputs: ["results.decide"],
  metadata: {
    category: "research",
    tags: ["hunter", "analysis", "decision"],
    riskLevel: "safe",
    estimatedDuration: 12e4
  }
};
var swapToken = {
  id: "swap-token",
  name: "Token Swap",
  description: "Check wallet, get DEX quote, execute swap with slippage protection",
  version: "1.0.0",
  steps: [
    {
      id: "check_balance",
      tool: "wallet_agent",
      inputs: {
        task: "Check wallet balance",
        token: "${inputs.fromToken}"
      }
    },
    {
      id: "get_quote",
      tool: "defi_agent",
      inputs: {
        task: "Get DEX quote",
        fromToken: "${inputs.fromToken}",
        toToken: "${inputs.toToken}",
        amount: "${inputs.amount}"
      },
      dependsOn: ["check_balance"],
      condition: "results.check_balance.balance >= inputs.amount"
    },
    {
      id: "validate",
      tool: "audit_agent",
      inputs: {
        task: "Validate swap safety",
        quote: "${results.get_quote}",
        slippage: "${inputs.maxSlippage}"
      },
      dependsOn: ["get_quote"]
    },
    {
      id: "execute",
      tool: "wallet_agent",
      inputs: {
        task: "Execute swap",
        quote: "${results.get_quote}"
      },
      dependsOn: ["validate"],
      condition: "results.validate.safe === true"
    }
  ],
  inputs: {
    fromToken: {
      type: "string",
      description: "Token to swap from",
      required: true
    },
    toToken: {
      type: "string",
      description: "Token to swap to",
      required: true
    },
    amount: {
      type: "number",
      description: "Amount to swap",
      required: true
    },
    maxSlippage: {
      type: "number",
      description: "Maximum slippage percentage",
      default: 1
    }
  },
  outputs: ["results.execute"],
  metadata: {
    category: "trading",
    tags: ["swap", "defi", "trading"],
    riskLevel: "high",
    estimatedDuration: 3e4
  }
};
var contentGeneration = {
  id: "content-generation",
  name: "Content Generation",
  description: "Research keywords, generate content, schedule publishing",
  version: "1.0.0",
  steps: [
    {
      id: "keywords",
      tool: "seo_researcher",
      inputs: {
        task: "Research keywords",
        topic: "${inputs.topic}"
      }
    },
    {
      id: "generate",
      tool: "content_generator",
      inputs: {
        task: "Generate content",
        topic: "${inputs.topic}",
        keywords: "${results.keywords}",
        format: "${inputs.format}"
      },
      dependsOn: ["keywords"]
    },
    {
      id: "optimize",
      tool: "seo_optimizer",
      inputs: {
        task: "Optimize for SEO",
        content: "${results.generate}",
        keywords: "${results.keywords}"
      },
      dependsOn: ["generate"]
    },
    {
      id: "schedule",
      tool: "scheduler",
      inputs: {
        task: "Schedule publishing",
        content: "${results.optimize}",
        platform: "${inputs.platform}"
      },
      dependsOn: ["optimize"],
      condition: "inputs.autoPublish === true"
    }
  ],
  inputs: {
    topic: {
      type: "string",
      description: "Content topic",
      required: true
    },
    format: {
      type: "string",
      description: "Output format (blog, tweet, thread)",
      default: "blog"
    },
    platform: {
      type: "string",
      description: "Publishing platform",
      default: "twitter"
    },
    autoPublish: {
      type: "boolean",
      description: "Auto-schedule publishing",
      default: false
    }
  },
  outputs: ["results.optimize", "results.schedule"],
  metadata: {
    category: "content",
    tags: ["seo", "content", "marketing"],
    riskLevel: "low",
    estimatedDuration: 9e4
  }
};
var securityAudit = {
  id: "security-audit",
  name: "Security Audit",
  description: "Scan contract, analyze vulnerabilities, generate security report",
  version: "1.0.0",
  steps: [
    {
      id: "scan",
      tool: "audit_agent",
      inputs: {
        task: "Scan smart contract",
        contract: "${inputs.contract}",
        chain: "${inputs.chain}"
      },
      timeout: 12e4
    },
    {
      id: "analyze",
      tool: "security_analyzer",
      inputs: {
        task: "Analyze vulnerabilities",
        scanResults: "${results.scan}",
        severity: "${inputs.minSeverity}"
      },
      dependsOn: ["scan"]
    },
    {
      id: "report",
      tool: "report_generator",
      inputs: {
        task: "Generate security report",
        analysis: "${results.analyze}",
        format: "${inputs.reportFormat}"
      },
      dependsOn: ["analyze"]
    }
  ],
  inputs: {
    contract: {
      type: "string",
      description: "Contract address or code",
      required: true
    },
    chain: {
      type: "string",
      description: "Blockchain network",
      default: "solana"
    },
    minSeverity: {
      type: "string",
      description: "Minimum severity to report",
      default: "medium"
    },
    reportFormat: {
      type: "string",
      description: "Report format (markdown, json, pdf)",
      default: "markdown"
    }
  },
  outputs: ["results.report"],
  metadata: {
    category: "security",
    tags: ["audit", "security", "smart-contract"],
    riskLevel: "safe",
    estimatedDuration: 18e4
  }
};
var portfolioAnalysis = {
  id: "portfolio-analysis",
  name: "Portfolio Analysis",
  description: "Analyze wallet holdings, calculate metrics, generate recommendations",
  version: "1.0.0",
  steps: [
    {
      id: "holdings",
      tool: "wallet_agent",
      inputs: {
        task: "Get wallet holdings",
        wallet: "${inputs.wallet}"
      }
    },
    {
      id: "prices",
      tool: "defi_agent",
      inputs: {
        task: "Get current prices",
        tokens: "${results.holdings.tokens}"
      },
      dependsOn: ["holdings"]
    },
    {
      id: "metrics",
      tool: "analytics_agent",
      inputs: {
        task: "Calculate portfolio metrics",
        holdings: "${results.holdings}",
        prices: "${results.prices}"
      },
      dependsOn: ["holdings", "prices"]
    },
    {
      id: "recommendations",
      tool: "decision_agent",
      inputs: {
        task: "Generate rebalancing recommendations",
        metrics: "${results.metrics}",
        riskProfile: "${inputs.riskProfile}"
      },
      dependsOn: ["metrics"]
    }
  ],
  inputs: {
    wallet: {
      type: "string",
      description: "Wallet address",
      required: true
    },
    riskProfile: {
      type: "string",
      description: "Risk tolerance (conservative, moderate, aggressive)",
      default: "moderate"
    }
  },
  outputs: ["results.metrics", "results.recommendations"],
  metadata: {
    category: "analytics",
    tags: ["portfolio", "analysis", "recommendations"],
    riskLevel: "safe",
    estimatedDuration: 6e4
  }
};
var PIPELINE_TEMPLATES = {
  "research-and-analyze": researchAndAnalyze,
  "swap-token": swapToken,
  "content-generation": contentGeneration,
  "security-audit": securityAudit,
  "portfolio-analysis": portfolioAnalysis
};
function getTemplate(id) {
  return PIPELINE_TEMPLATES[id];
}
function listTemplates() {
  return Object.values(PIPELINE_TEMPLATES);
}
function listTemplatesByCategory(category) {
  return Object.values(PIPELINE_TEMPLATES).filter(
    (p) => p.metadata?.category === category
  );
}

export {
  researchAndAnalyze,
  swapToken,
  contentGeneration,
  securityAudit,
  portfolioAnalysis,
  PIPELINE_TEMPLATES,
  getTemplate,
  listTemplates,
  listTemplatesByCategory
};
