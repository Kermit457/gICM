/**
 * Registry data for gICM Marketplace
 * Contains all agents, skills, commands, MCPs, and workflows
 */

export type ItemKind = "agent" | "skill" | "command" | "mcp" | "setting" | "bundle" | "workflow" | "component";

export interface RegistryItem {
  id: string;
  kind: ItemKind;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  tags: string[];
  dependencies?: string[];
  files?: string[];
  install: string;
  envKeys?: string[];
  installs?: number;
  remixes?: number;
  tokenSavings?: number;
  layer?: ".agent" | ".claude" | "docs";
  modelRecommendation?: "sonnet" | "opus" | "haiku";
}

// Registry items - all available agents, skills, commands, etc.
export const REGISTRY_ITEMS: RegistryItem[] = [
  // Core Agents
  {
    id: "wallet-agent",
    kind: "agent",
    name: "Wallet Agent",
    slug: "wallet-agent",
    description: "Solana wallet operations, token swaps, and portfolio tracking",
    category: "trading",
    tags: ["solana", "wallet", "tokens", "trading"],
    install: "npx @gicm/cli add agent:wallet-agent",
    tokenSavings: 2500,
    installs: 1247,
    modelRecommendation: "sonnet",
  },
  {
    id: "defi-agent",
    kind: "agent",
    name: "DeFi Agent",
    slug: "defi-agent",
    description: "DeFi protocol integration, yield farming, and liquidity management",
    category: "trading",
    tags: ["defi", "yield", "liquidity", "farming"],
    install: "npx @gicm/cli add agent:defi-agent",
    tokenSavings: 3200,
    installs: 892,
    modelRecommendation: "sonnet",
  },
  {
    id: "hunter-agent",
    kind: "agent",
    name: "Hunter Agent",
    slug: "hunter-agent",
    description: "Token opportunity discovery and alpha hunting",
    category: "trading",
    tags: ["alpha", "discovery", "hunting", "tokens"],
    install: "npx @gicm/cli add agent:hunter-agent",
    tokenSavings: 4100,
    installs: 756,
    modelRecommendation: "sonnet",
  },
  {
    id: "audit-agent",
    kind: "agent",
    name: "Audit Agent",
    slug: "audit-agent",
    description: "Smart contract security auditing and vulnerability detection",
    category: "security",
    tags: ["audit", "security", "smart-contracts", "vulnerabilities"],
    install: "npx @gicm/cli add agent:audit-agent",
    tokenSavings: 5500,
    installs: 634,
    modelRecommendation: "opus",
  },
  {
    id: "decision-agent",
    kind: "agent",
    name: "Decision Agent",
    slug: "decision-agent",
    description: "Trade decision making with risk assessment and scoring",
    category: "trading",
    tags: ["decisions", "risk", "trading", "scoring"],
    install: "npx @gicm/cli add agent:decision-agent",
    tokenSavings: 2800,
    installs: 589,
    modelRecommendation: "sonnet",
  },
  {
    id: "social-agent",
    kind: "agent",
    name: "Social Agent",
    slug: "social-agent",
    description: "Social media automation and engagement tracking",
    category: "growth",
    tags: ["social", "twitter", "automation", "engagement"],
    install: "npx @gicm/cli add agent:social-agent",
    tokenSavings: 1800,
    installs: 423,
    modelRecommendation: "haiku",
  },
  {
    id: "bridge-agent",
    kind: "agent",
    name: "Bridge Agent",
    slug: "bridge-agent",
    description: "Cross-chain bridging and asset transfers",
    category: "trading",
    tags: ["bridge", "cross-chain", "transfers", "multichain"],
    install: "npx @gicm/cli add agent:bridge-agent",
    tokenSavings: 2200,
    installs: 312,
    modelRecommendation: "sonnet",
  },
  {
    id: "nft-agent",
    kind: "agent",
    name: "NFT Agent",
    slug: "nft-agent",
    description: "NFT minting, trading, and collection management",
    category: "nft",
    tags: ["nft", "minting", "collections", "trading"],
    install: "npx @gicm/cli add agent:nft-agent",
    tokenSavings: 1500,
    installs: 287,
    modelRecommendation: "sonnet",
  },
  {
    id: "dao-agent",
    kind: "agent",
    name: "DAO Agent",
    slug: "dao-agent",
    description: "DAO governance, proposals, and voting automation",
    category: "governance",
    tags: ["dao", "governance", "voting", "proposals"],
    install: "npx @gicm/cli add agent:dao-agent",
    tokenSavings: 1200,
    installs: 198,
    modelRecommendation: "sonnet",
  },
  {
    id: "builder-agent",
    kind: "agent",
    name: "Builder Agent",
    slug: "builder-agent",
    description: "Code generation and project scaffolding",
    category: "development",
    tags: ["code", "generation", "scaffolding", "development"],
    install: "npx @gicm/cli add agent:builder-agent",
    tokenSavings: 4500,
    installs: 567,
    modelRecommendation: "opus",
  },
  {
    id: "refactor-agent",
    kind: "agent",
    name: "Refactor Agent",
    slug: "refactor-agent",
    description: "Code refactoring and optimization",
    category: "development",
    tags: ["refactor", "optimization", "code-quality", "cleanup"],
    install: "npx @gicm/cli add agent:refactor-agent",
    tokenSavings: 3800,
    installs: 445,
    modelRecommendation: "sonnet",
  },
  {
    id: "deployer-agent",
    kind: "agent",
    name: "Deployer Agent",
    slug: "deployer-agent",
    description: "Deployment automation and CI/CD integration",
    category: "development",
    tags: ["deploy", "ci-cd", "automation", "infrastructure"],
    install: "npx @gicm/cli add agent:deployer-agent",
    tokenSavings: 2100,
    installs: 334,
    modelRecommendation: "sonnet",
  },

  // Skills
  {
    id: "solana-swap",
    kind: "skill",
    name: "Solana Swap",
    slug: "solana-swap",
    description: "Execute token swaps on Solana DEXs (Jupiter, Raydium)",
    category: "trading",
    tags: ["solana", "swap", "dex", "jupiter"],
    install: "npx @gicm/cli add skill:solana-swap",
    tokenSavings: 800,
    installs: 1892,
    modelRecommendation: "haiku",
  },
  {
    id: "price-fetch",
    kind: "skill",
    name: "Price Fetch",
    slug: "price-fetch",
    description: "Real-time price data from multiple sources",
    category: "data",
    tags: ["price", "data", "coingecko", "birdeye"],
    install: "npx @gicm/cli add skill:price-fetch",
    tokenSavings: 500,
    installs: 2341,
    modelRecommendation: "haiku",
  },
  {
    id: "twitter-post",
    kind: "skill",
    name: "Twitter Post",
    slug: "twitter-post",
    description: "Post tweets and threads programmatically",
    category: "social",
    tags: ["twitter", "social", "posting", "automation"],
    install: "npx @gicm/cli add skill:twitter-post",
    tokenSavings: 300,
    installs: 1567,
    modelRecommendation: "haiku",
  },
  {
    id: "contract-verify",
    kind: "skill",
    name: "Contract Verify",
    slug: "contract-verify",
    description: "Verify smart contract source code on explorers",
    category: "development",
    tags: ["contracts", "verification", "solana", "ethereum"],
    install: "npx @gicm/cli add skill:contract-verify",
    tokenSavings: 600,
    installs: 789,
    modelRecommendation: "haiku",
  },
  {
    id: "whale-track",
    kind: "skill",
    name: "Whale Track",
    slug: "whale-track",
    description: "Track whale wallet movements and large transactions",
    category: "analysis",
    tags: ["whales", "tracking", "transactions", "alerts"],
    install: "npx @gicm/cli add skill:whale-track",
    tokenSavings: 900,
    installs: 1234,
    modelRecommendation: "haiku",
  },

  // Commands
  {
    id: "quick-swap",
    kind: "command",
    name: "Quick Swap",
    slug: "quick-swap",
    description: "/swap - Execute a token swap with one command",
    category: "trading",
    tags: ["swap", "quick", "command"],
    install: "npx @gicm/cli add command:quick-swap",
    tokenSavings: 200,
    installs: 3456,
    modelRecommendation: "haiku",
  },
  {
    id: "portfolio-view",
    kind: "command",
    name: "Portfolio View",
    slug: "portfolio-view",
    description: "/portfolio - View your current portfolio allocation",
    category: "trading",
    tags: ["portfolio", "view", "allocation"],
    install: "npx @gicm/cli add command:portfolio-view",
    tokenSavings: 150,
    installs: 2789,
    modelRecommendation: "haiku",
  },
  {
    id: "gas-estimate",
    kind: "command",
    name: "Gas Estimate",
    slug: "gas-estimate",
    description: "/gas - Estimate gas costs for transactions",
    category: "utility",
    tags: ["gas", "fees", "estimate"],
    install: "npx @gicm/cli add command:gas-estimate",
    tokenSavings: 100,
    installs: 1567,
    modelRecommendation: "haiku",
  },

  // MCPs
  {
    id: "context-engine-mcp",
    kind: "mcp",
    name: "Context Engine MCP",
    slug: "context-engine-mcp",
    description: "Semantic code search and codebase understanding",
    category: "development",
    tags: ["mcp", "context", "search", "codebase"],
    install: "npx @gicm/cli add mcp:context-engine-mcp",
    tokenSavings: 8000,
    installs: 456,
    modelRecommendation: "sonnet",
  },
  {
    id: "solana-mcp",
    kind: "mcp",
    name: "Solana MCP",
    slug: "solana-mcp",
    description: "Solana blockchain interaction and RPC access",
    category: "blockchain",
    tags: ["mcp", "solana", "rpc", "blockchain"],
    install: "npx @gicm/cli add mcp:solana-mcp",
    tokenSavings: 5000,
    installs: 678,
    modelRecommendation: "sonnet",
  },
  {
    id: "github-mcp",
    kind: "mcp",
    name: "GitHub MCP",
    slug: "github-mcp",
    description: "GitHub API integration for repositories and issues",
    category: "development",
    tags: ["mcp", "github", "repositories", "issues"],
    install: "npx @gicm/cli add mcp:github-mcp",
    tokenSavings: 3500,
    installs: 923,
    modelRecommendation: "sonnet",
  },

  // Workflows
  {
    id: "token-launch",
    kind: "workflow",
    name: "Token Launch Workflow",
    slug: "token-launch",
    description: "End-to-end token launch automation",
    category: "launch",
    tags: ["workflow", "launch", "token", "automation"],
    dependencies: ["wallet-agent", "defi-agent", "social-agent"],
    install: "npx @gicm/cli add workflow:token-launch",
    tokenSavings: 12000,
    installs: 234,
    modelRecommendation: "opus",
  },
  {
    id: "alpha-hunting",
    kind: "workflow",
    name: "Alpha Hunting Workflow",
    slug: "alpha-hunting",
    description: "Automated alpha discovery and analysis pipeline",
    category: "trading",
    tags: ["workflow", "alpha", "hunting", "analysis"],
    dependencies: ["hunter-agent", "decision-agent", "wallet-agent"],
    install: "npx @gicm/cli add workflow:alpha-hunting",
    tokenSavings: 8500,
    installs: 345,
    modelRecommendation: "sonnet",
  },

  // Orchestration
  {
    id: "ptc-coordinator",
    kind: "agent",
    name: "PTC Coordinator",
    slug: "ptc-coordinator",
    description: "Programmatic Tool Calling coordinator for dynamic tool orchestration",
    category: "orchestration",
    tags: ["ptc", "coordinator", "orchestration", "dynamic"],
    install: "npx @gicm/cli add agent:ptc-coordinator",
    tokenSavings: 15000,
    installs: 189,
    modelRecommendation: "opus",
  },
  {
    id: "autonomy-engine",
    kind: "agent",
    name: "Autonomy Engine",
    slug: "autonomy-engine",
    description: "Level 2+ bounded autonomous execution with human oversight",
    category: "orchestration",
    tags: ["autonomy", "execution", "oversight", "bounded"],
    install: "npx @gicm/cli add agent:autonomy-engine",
    tokenSavings: 10000,
    installs: 156,
    modelRecommendation: "opus",
  },

  // Product & Growth
  {
    id: "product-engine",
    kind: "agent",
    name: "Product Engine",
    slug: "product-engine",
    description: "Autonomous product development - discovery, building, deployment",
    category: "development",
    tags: ["product", "autonomous", "discovery", "building"],
    install: "npx @gicm/cli add agent:product-engine",
    tokenSavings: 20000,
    installs: 123,
    modelRecommendation: "opus",
  },
  {
    id: "growth-engine",
    kind: "agent",
    name: "Growth Engine",
    slug: "growth-engine",
    description: "Autonomous content and marketing automation",
    category: "growth",
    tags: ["growth", "content", "marketing", "automation"],
    install: "npx @gicm/cli add agent:growth-engine",
    tokenSavings: 8000,
    installs: 167,
    modelRecommendation: "sonnet",
  },

  // Engines
  {
    id: "money-engine",
    kind: "agent",
    name: "Money Engine",
    slug: "money-engine",
    description: "Self-funding system with treasury management and DCA bots",
    category: "finance",
    tags: ["money", "treasury", "dca", "self-funding"],
    install: "npx @gicm/cli add agent:money-engine",
    tokenSavings: 25000,
    installs: 89,
    modelRecommendation: "opus",
  },
  {
    id: "hyper-brain",
    kind: "agent",
    name: "Hyper Brain",
    slug: "hyper-brain",
    description: "Knowledge ingestion, learning, and prediction system with Pinecone & Qdrant vector stores",
    longDescription: "Comprehensive knowledge management system with multiple vector store backends (Local, Pinecone, Qdrant). Supports semantic search, embeddings, and AI-powered predictions.",
    category: "knowledge",
    tags: ["knowledge", "embeddings", "vector-db", "pinecone", "qdrant", "semantic-search", "predictions"],
    install: "npx @gicm/cli add agent:hyper-brain",
    tokenSavings: 18000,
    installs: 78,
    modelRecommendation: "sonnet",
  },
];

// Stack definitions
export interface StackInfo {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author?: string;
  version: string;
  featured: boolean;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

export const STACKS: StackInfo[] = [
  {
    id: "ptc-tool-search-stack",
    name: "PTC + Tool Search Stack",
    description: "Programmatic Tool Calling with dynamic tool discovery. 85% context reduction + 37% token savings.",
    tags: ["PTC", "Tool Search", "Orchestration", "Advanced"],
    version: "1.0.0",
    featured: true,
    items: ["ptc-coordinator", "autonomy-engine", "hunter-agent", "defi-agent", "decision-agent", "audit-agent", "wallet-agent", "context-engine-mcp"],
    createdAt: "2025-11-01T00:00:00Z",
    updatedAt: "2025-11-29T00:00:00Z",
  },
  {
    id: "solana-launch-platform",
    name: "Solana Launch Platform",
    description: "Complete stack for building pump.fun-style launch platforms.",
    tags: ["Solana", "DeFi", "Launch Platform"],
    version: "1.0.0",
    featured: true,
    items: ["wallet-agent", "defi-agent", "audit-agent", "social-agent", "solana-mcp", "token-launch"],
    createdAt: "2025-10-15T00:00:00Z",
    updatedAt: "2025-11-28T00:00:00Z",
  },
  {
    id: "alpha-hunter-stack",
    name: "Alpha Hunter Stack",
    description: "Complete alpha hunting setup with whale tracking and decision making.",
    tags: ["Alpha", "Trading", "Analysis"],
    version: "1.0.0",
    featured: false,
    items: ["hunter-agent", "decision-agent", "wallet-agent", "whale-track", "price-fetch", "alpha-hunting"],
    createdAt: "2025-10-20T00:00:00Z",
    updatedAt: "2025-11-25T00:00:00Z",
  },
  {
    id: "developer-toolkit",
    name: "Developer Toolkit",
    description: "Essential tools for blockchain development and deployment.",
    tags: ["Development", "Tools", "CI/CD"],
    version: "1.0.0",
    featured: false,
    items: ["builder-agent", "refactor-agent", "deployer-agent", "context-engine-mcp", "github-mcp", "contract-verify"],
    createdAt: "2025-09-01T00:00:00Z",
    updatedAt: "2025-11-20T00:00:00Z",
  },
  {
    id: "autonomous-growth",
    name: "Autonomous Growth Stack",
    description: "Full autonomous marketing and content generation pipeline.",
    tags: ["Growth", "Marketing", "Automation"],
    version: "1.0.0",
    featured: false,
    items: ["growth-engine", "social-agent", "twitter-post", "product-engine"],
    createdAt: "2025-11-10T00:00:00Z",
    updatedAt: "2025-11-29T00:00:00Z",
  },
];

// Helper functions
export function getItemBySlug(slug: string): RegistryItem | undefined {
  return REGISTRY_ITEMS.find(item => item.slug === slug || item.id === slug);
}

export function getItemsByKind(kind: ItemKind): RegistryItem[] {
  return REGISTRY_ITEMS.filter(item => item.kind === kind);
}

export function searchItems(query: string, kind?: ItemKind): RegistryItem[] {
  const lowerQuery = query.toLowerCase();
  return REGISTRY_ITEMS.filter(item => {
    if (kind && item.kind !== kind) return false;
    return (
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  });
}

export function getStackById(stackId: string): StackInfo | undefined {
  return STACKS.find(stack => stack.id === stackId);
}

export function resolveStackItems(stackId: string): { stack: StackInfo; items: RegistryItem[]; missing: string[] } | null {
  const stack = getStackById(stackId);
  if (!stack) return null;

  const items: RegistryItem[] = [];
  const missing: string[] = [];

  for (const itemId of stack.items) {
    const item = getItemBySlug(itemId);
    if (item) {
      items.push(item);
    } else {
      missing.push(itemId);
    }
  }

  return { stack, items, missing };
}

export function resolveDependencies(itemIds: string[]): RegistryItem[] {
  const resolved = new Map<string, RegistryItem>();
  const toProcess = [...itemIds];

  while (toProcess.length > 0) {
    const id = toProcess.pop()!;
    if (resolved.has(id)) continue;

    const item = getItemBySlug(id);
    if (item) {
      resolved.set(id, item);
      if (item.dependencies) {
        toProcess.push(...item.dependencies);
      }
    }
  }

  return Array.from(resolved.values());
}
