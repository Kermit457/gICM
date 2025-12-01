/**
 * Test Fixtures: Action Objects
 *
 * Sample Action objects for testing autonomy decision routing
 */

export interface TestAction {
  id: string;
  engine: "money" | "growth" | "product" | "orchestrator";
  category: "trading" | "content" | "operations" | "configuration";
  type: string;
  description: string;
  params: Record<string, unknown>;
  metadata: {
    estimatedValue: number;
    reversible: boolean;
    urgency: "low" | "normal" | "high" | "critical";
  };
  timestamp: number;
}

// Safe actions - should auto-execute
export const safeActions: TestAction[] = [
  {
    id: "safe-tweet-1",
    engine: "growth",
    category: "content",
    type: "tweet_post",
    description: "Post daily tech tip",
    params: { content: "Today's TypeScript tip: Use const assertions!" },
    metadata: {
      estimatedValue: 0,
      reversible: true,
      urgency: "low",
    },
    timestamp: Date.now(),
  },
  {
    id: "safe-analytics-1",
    engine: "growth",
    category: "operations",
    type: "collect_metrics",
    description: "Collect daily analytics",
    params: {},
    metadata: {
      estimatedValue: 0,
      reversible: true,
      urgency: "normal",
    },
    timestamp: Date.now(),
  },
];

// Low-value trading - should auto-execute at level 2+
export const lowValueTrading: TestAction[] = [
  {
    id: "low-trade-1",
    engine: "money",
    category: "trading",
    type: "dca_buy",
    description: "DCA $10 into SOL",
    params: { token: "SOL", amount: 10 },
    metadata: {
      estimatedValue: 10,
      reversible: false,
      urgency: "normal",
    },
    timestamp: Date.now(),
  },
  {
    id: "low-trade-2",
    engine: "money",
    category: "trading",
    type: "dca_buy",
    description: "DCA $25 into ETH",
    params: { token: "ETH", amount: 25 },
    metadata: {
      estimatedValue: 25,
      reversible: false,
      urgency: "normal",
    },
    timestamp: Date.now(),
  },
];

// Medium-risk actions - may require approval
export const mediumRiskActions: TestAction[] = [
  {
    id: "medium-trade-1",
    engine: "money",
    category: "trading",
    type: "swap",
    description: "Swap $200 USDC for SOL",
    params: { fromToken: "USDC", toToken: "SOL", amount: 200 },
    metadata: {
      estimatedValue: 200,
      reversible: false,
      urgency: "normal",
    },
    timestamp: Date.now(),
  },
  {
    id: "medium-content-1",
    engine: "growth",
    category: "content",
    type: "blog_publish",
    description: "Publish new blog post",
    params: { title: "How to Build Web3 Apps" },
    metadata: {
      estimatedValue: 0,
      reversible: true,
      urgency: "high",
    },
    timestamp: Date.now(),
  },
];

// High-risk actions - should queue for approval
export const highRiskActions: TestAction[] = [
  {
    id: "high-trade-1",
    engine: "money",
    category: "trading",
    type: "swap",
    description: "Swap $500 USDC for new memecoin",
    params: { fromToken: "USDC", toToken: "PEPE", amount: 500 },
    metadata: {
      estimatedValue: 500,
      reversible: false,
      urgency: "high",
    },
    timestamp: Date.now(),
  },
  {
    id: "high-deploy-1",
    engine: "product",
    category: "operations",
    type: "deploy_package",
    description: "Deploy @gicm/new-agent to npm",
    params: { package: "@gicm/new-agent", version: "1.0.0" },
    metadata: {
      estimatedValue: 0,
      reversible: false,
      urgency: "normal",
    },
    timestamp: Date.now(),
  },
];

// Critical actions - should always escalate
export const criticalActions: TestAction[] = [
  {
    id: "critical-trade-1",
    engine: "money",
    category: "trading",
    type: "swap",
    description: "Large position: $2000 into SOL",
    params: { fromToken: "USDC", toToken: "SOL", amount: 2000 },
    metadata: {
      estimatedValue: 2000,
      reversible: false,
      urgency: "critical",
    },
    timestamp: Date.now(),
  },
  {
    id: "critical-config-1",
    engine: "orchestrator",
    category: "configuration",
    type: "change_api_keys",
    description: "Rotate API keys",
    params: {},
    metadata: {
      estimatedValue: 0,
      reversible: false,
      urgency: "critical",
    },
    timestamp: Date.now(),
  },
];

// All actions combined
export const allTestActions = [
  ...safeActions,
  ...lowValueTrading,
  ...mediumRiskActions,
  ...highRiskActions,
  ...criticalActions,
];
