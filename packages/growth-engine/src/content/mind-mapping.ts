/**
 * Mind Mapping Content Ideation
 *
 * Uses visual/hierarchical thinking to generate content ideas:
 * - Central topic branches into related concepts
 * - Each branch can have sub-branches
 * - Cross-connections create unique content angles
 */

import { z } from "zod";
import { Logger } from "../utils/logger.js";

// ============================================================================
// MIND MAP TYPES
// ============================================================================

export const BranchTypeSchema = z.enum([
  "problem",     // Problems this topic solves
  "solution",    // Solutions/approaches
  "example",     // Real-world examples
  "comparison",  // Comparisons to alternatives
  "tutorial",    // How-to content
  "future",      // Future possibilities
  "community",   // Community aspects
  "tool",        // Related tools
]);
export type BranchType = z.infer<typeof BranchTypeSchema>;

export const MindMapNodeSchema = z.object({
  id: z.string(),
  concept: z.string(),
  description: z.string().optional(),
  branchType: BranchTypeSchema.optional(),
  children: z.array(z.lazy(() => MindMapNodeSchema)).default([]),
  contentIdeas: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});
export type MindMapNode = z.infer<typeof MindMapNodeSchema>;

export const MindMapSchema = z.object({
  id: z.string(),
  topic: z.string(),
  description: z.string(),
  root: MindMapNodeSchema,
  branches: z.record(BranchTypeSchema, MindMapNodeSchema).optional(),
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    relationship: z.string(),
  })).default([]),
  generatedAt: z.number(),
});
export type MindMap = z.infer<typeof MindMapSchema>;

export const ContentIdeaSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["blog", "tweet", "thread", "video", "tutorial"]),
  description: z.string(),
  sourceNodes: z.array(z.string()), // Node IDs that inspired this
  keywords: z.array(z.string()),
  priority: z.number().min(1).max(10),
  estimatedEffort: z.enum(["low", "medium", "high"]),
});
export type ContentIdea = z.infer<typeof ContentIdeaSchema>;

// ============================================================================
// MIND MAPPING ENGINE
// ============================================================================

export class MindMapper {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("MindMapper");
  }

  /**
   * Generate a mind map from a central topic
   */
  generateMindMap(topic: string, context?: string): MindMap {
    this.logger.info(`Generating mind map for: ${topic}`);

    const mapId = `map-${Date.now()}`;
    const root = this.createRootNode(topic, context);
    const branches = this.generateBranches(topic, context);

    // Add children to root
    root.children = Object.values(branches);

    // Generate cross-connections
    const connections = this.findConnections(branches);

    const mindMap: MindMap = {
      id: mapId,
      topic,
      description: context || `Mind map exploring ${topic}`,
      root,
      branches,
      connections,
      generatedAt: Date.now(),
    };

    this.logger.info(`Mind map generated with ${Object.keys(branches).length} branches`);
    return mindMap;
  }

  /**
   * Extract content ideas from a mind map
   */
  extractContentIdeas(mindMap: MindMap): ContentIdea[] {
    const ideas: ContentIdea[] = [];
    let ideaCount = 0;

    // Process each branch for content ideas
    for (const [branchType, branch] of Object.entries(mindMap.branches || {})) {
      const branchIdeas = this.processBranchForContent(
        branch,
        branchType as BranchType,
        mindMap.topic
      );
      ideas.push(...branchIdeas);
      ideaCount += branchIdeas.length;
    }

    // Generate cross-connection ideas
    for (const conn of mindMap.connections) {
      const crossIdea = this.generateCrossConnectionIdea(
        mindMap,
        conn.from,
        conn.to,
        conn.relationship
      );
      if (crossIdea) {
        ideas.push(crossIdea);
        ideaCount++;
      }
    }

    this.logger.info(`Extracted ${ideaCount} content ideas from mind map`);
    return ideas.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create root node for topic
   */
  private createRootNode(topic: string, context?: string): MindMapNode {
    return {
      id: "root",
      concept: topic,
      description: context || `Central concept: ${topic}`,
      children: [],
      contentIdeas: [],
      keywords: this.extractKeywords(topic),
    };
  }

  /**
   * Generate standard branches for a topic
   */
  private generateBranches(topic: string, context?: string): Record<BranchType, MindMapNode> {
    const topicLower = topic.toLowerCase();
    const isWeb3 = topicLower.includes("web3") || topicLower.includes("blockchain") ||
                   topicLower.includes("crypto") || topicLower.includes("defi");
    const isAI = topicLower.includes("ai") || topicLower.includes("llm") ||
                 topicLower.includes("agent") || topicLower.includes("ml");

    return {
      problem: this.createProblemBranch(topic, isWeb3, isAI),
      solution: this.createSolutionBranch(topic, isWeb3, isAI),
      example: this.createExampleBranch(topic, isWeb3, isAI),
      comparison: this.createComparisonBranch(topic, isWeb3, isAI),
      tutorial: this.createTutorialBranch(topic, isWeb3, isAI),
      future: this.createFutureBranch(topic, isWeb3, isAI),
      community: this.createCommunityBranch(topic, isWeb3, isAI),
      tool: this.createToolBranch(topic, isWeb3, isAI),
    };
  }

  private createProblemBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "prob-1", concept: "Transaction complexity", children: [], contentIdeas: [], keywords: ["gas", "fees", "UX"] },
        { id: "prob-2", concept: "Security vulnerabilities", children: [], contentIdeas: [], keywords: ["security", "audit", "smart contracts"] },
        { id: "prob-3", concept: "Scalability limitations", children: [], contentIdeas: [], keywords: ["L2", "scaling", "throughput"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "prob-4", concept: "Hallucination issues", children: [], contentIdeas: [], keywords: ["accuracy", "grounding", "RAG"] },
        { id: "prob-5", concept: "Context limitations", children: [], contentIdeas: [], keywords: ["context window", "memory", "retrieval"] },
        { id: "prob-6", concept: "Cost optimization", children: [], contentIdeas: [], keywords: ["tokens", "API costs", "efficiency"] }
      );
    }

    // Generic problems
    children.push(
      { id: "prob-7", concept: "Learning curve", children: [], contentIdeas: [], keywords: ["onboarding", "documentation", "tutorials"] },
      { id: "prob-8", concept: "Integration challenges", children: [], contentIdeas: [], keywords: ["API", "SDK", "compatibility"] }
    );

    return {
      id: "branch-problem",
      concept: `Problems ${topic} Solves`,
      branchType: "problem",
      children,
      contentIdeas: [
        `The Top 5 Pain Points ${topic} Addresses`,
        `Why Traditional Approaches to ${topic} Fail`,
      ],
      keywords: ["problems", "challenges", "pain points"],
    };
  }

  private createSolutionBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "sol-1", concept: "Account abstraction", children: [], contentIdeas: [], keywords: ["ERC-4337", "smart accounts"] },
        { id: "sol-2", concept: "Modular architecture", children: [], contentIdeas: [], keywords: ["composability", "protocols"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "sol-3", concept: "RAG implementation", children: [], contentIdeas: [], keywords: ["retrieval", "embeddings", "vector DB"] },
        { id: "sol-4", concept: "Agent orchestration", children: [], contentIdeas: [], keywords: ["multi-agent", "coordination"] }
      );
    }

    children.push(
      { id: "sol-5", concept: "Automation", children: [], contentIdeas: [], keywords: ["workflow", "efficiency"] },
      { id: "sol-6", concept: "Developer experience", children: [], contentIdeas: [], keywords: ["DX", "tooling", "SDK"] }
    );

    return {
      id: "branch-solution",
      concept: `How ${topic} Works`,
      branchType: "solution",
      children,
      contentIdeas: [
        `${topic}: A Complete Technical Deep Dive`,
        `The Architecture Behind ${topic}`,
      ],
      keywords: ["solution", "how it works", "architecture"],
    };
  }

  private createExampleBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "ex-1", concept: "DeFi integration", children: [], contentIdeas: [], keywords: ["Uniswap", "Aave", "DeFi"] },
        { id: "ex-2", concept: "NFT use cases", children: [], contentIdeas: [], keywords: ["NFT", "marketplace", "gaming"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "ex-3", concept: "Code generation", children: [], contentIdeas: [], keywords: ["copilot", "code review"] },
        { id: "ex-4", concept: "Data analysis", children: [], contentIdeas: [], keywords: ["analytics", "insights"] }
      );
    }

    children.push(
      { id: "ex-5", concept: "Real-world deployment", children: [], contentIdeas: [], keywords: ["production", "case study"] },
      { id: "ex-6", concept: "Enterprise usage", children: [], contentIdeas: [], keywords: ["enterprise", "B2B"] }
    );

    return {
      id: "branch-example",
      concept: `${topic} in Action`,
      branchType: "example",
      children,
      contentIdeas: [
        `5 Real-World Examples of ${topic}`,
        `Case Study: How Company X Uses ${topic}`,
      ],
      keywords: ["examples", "case studies", "use cases"],
    };
  }

  private createComparisonBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "cmp-1", concept: "vs Traditional Finance", children: [], contentIdeas: [], keywords: ["TradFi", "DeFi comparison"] },
        { id: "cmp-2", concept: "vs Other L1/L2", children: [], contentIdeas: [], keywords: ["Ethereum", "Solana", "comparison"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "cmp-3", concept: "vs GPT-4", children: [], contentIdeas: [], keywords: ["OpenAI", "comparison"] },
        { id: "cmp-4", concept: "vs Claude", children: [], contentIdeas: [], keywords: ["Anthropic", "Claude"] }
      );
    }

    children.push(
      { id: "cmp-5", concept: "vs Manual approach", children: [], contentIdeas: [], keywords: ["automation", "efficiency"] },
      { id: "cmp-6", concept: "vs Competitors", children: [], contentIdeas: [], keywords: ["alternatives", "market"] }
    );

    return {
      id: "branch-comparison",
      concept: `${topic} vs Alternatives`,
      branchType: "comparison",
      children,
      contentIdeas: [
        `${topic} vs The Competition: Complete Comparison`,
        `When to Use ${topic} (and When Not To)`,
      ],
      keywords: ["comparison", "vs", "alternatives"],
    };
  }

  private createTutorialBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    children.push(
      { id: "tut-1", concept: "Getting started", children: [], contentIdeas: [], keywords: ["quickstart", "setup"] },
      { id: "tut-2", concept: "First project", children: [], contentIdeas: [], keywords: ["tutorial", "beginner"] },
      { id: "tut-3", concept: "Advanced patterns", children: [], contentIdeas: [], keywords: ["advanced", "patterns"] },
      { id: "tut-4", concept: "Best practices", children: [], contentIdeas: [], keywords: ["best practices", "tips"] },
      { id: "tut-5", concept: "Troubleshooting", children: [], contentIdeas: [], keywords: ["debugging", "errors"] }
    );

    return {
      id: "branch-tutorial",
      concept: `Learning ${topic}`,
      branchType: "tutorial",
      children,
      contentIdeas: [
        `${topic}: Complete Beginner's Guide`,
        `Build Your First Project with ${topic}`,
        `${topic} Best Practices: 10 Tips from Experts`,
      ],
      keywords: ["tutorial", "guide", "learn", "how to"],
    };
  }

  private createFutureBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "fut-1", concept: "Mass adoption", children: [], contentIdeas: [], keywords: ["adoption", "mainstream"] },
        { id: "fut-2", concept: "Regulatory clarity", children: [], contentIdeas: [], keywords: ["regulation", "compliance"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "fut-3", concept: "AGI implications", children: [], contentIdeas: [], keywords: ["AGI", "future"] },
        { id: "fut-4", concept: "Autonomous systems", children: [], contentIdeas: [], keywords: ["autonomy", "self-improving"] }
      );
    }

    children.push(
      { id: "fut-5", concept: "Roadmap", children: [], contentIdeas: [], keywords: ["roadmap", "plans"] },
      { id: "fut-6", concept: "Industry trends", children: [], contentIdeas: [], keywords: ["trends", "predictions"] }
    );

    return {
      id: "branch-future",
      concept: `Future of ${topic}`,
      branchType: "future",
      children,
      contentIdeas: [
        `${topic} in 2025: What's Coming Next`,
        `The Future of ${topic}: Expert Predictions`,
      ],
      keywords: ["future", "predictions", "trends", "roadmap"],
    };
  }

  private createCommunityBranch(topic: string, _isWeb3: boolean, _isAI: boolean): MindMapNode {
    return {
      id: "branch-community",
      concept: `${topic} Community`,
      branchType: "community",
      children: [
        { id: "com-1", concept: "Discord community", children: [], contentIdeas: [], keywords: ["Discord", "community"] },
        { id: "com-2", concept: "Open source", children: [], contentIdeas: [], keywords: ["open source", "GitHub"] },
        { id: "com-3", concept: "Contributors", children: [], contentIdeas: [], keywords: ["contributors", "team"] },
        { id: "com-4", concept: "Events", children: [], contentIdeas: [], keywords: ["events", "hackathons"] },
      ],
      contentIdeas: [
        `Join the ${topic} Community: A Complete Guide`,
        `How to Contribute to ${topic}`,
      ],
      keywords: ["community", "open source", "contribute"],
    };
  }

  private createToolBranch(topic: string, isWeb3: boolean, isAI: boolean): MindMapNode {
    const children: MindMapNode[] = [];

    if (isWeb3) {
      children.push(
        { id: "tool-1", concept: "Wallets", children: [], contentIdeas: [], keywords: ["wallet", "Phantom", "MetaMask"] },
        { id: "tool-2", concept: "Block explorers", children: [], contentIdeas: [], keywords: ["Etherscan", "Solscan"] }
      );
    }

    if (isAI) {
      children.push(
        { id: "tool-3", concept: "LLM APIs", children: [], contentIdeas: [], keywords: ["API", "OpenAI", "Anthropic"] },
        { id: "tool-4", concept: "Vector databases", children: [], contentIdeas: [], keywords: ["Pinecone", "Qdrant"] }
      );
    }

    children.push(
      { id: "tool-5", concept: "Development tools", children: [], contentIdeas: [], keywords: ["IDE", "CLI", "SDK"] },
      { id: "tool-6", concept: "Testing tools", children: [], contentIdeas: [], keywords: ["testing", "debugging"] }
    );

    return {
      id: "branch-tool",
      concept: `${topic} Tools & Resources`,
      branchType: "tool",
      children,
      contentIdeas: [
        `Essential Tools for ${topic} Development`,
        `${topic} Toolkit: Everything You Need`,
      ],
      keywords: ["tools", "resources", "SDK", "API"],
    };
  }

  /**
   * Find connections between branches
   */
  private findConnections(branches: Record<BranchType, MindMapNode>): Array<{ from: string; to: string; relationship: string }> {
    const connections: Array<{ from: string; to: string; relationship: string }> = [];

    // Problem -> Solution connections
    connections.push({
      from: "branch-problem",
      to: "branch-solution",
      relationship: "solves",
    });

    // Solution -> Tutorial connections
    connections.push({
      from: "branch-solution",
      to: "branch-tutorial",
      relationship: "teaches",
    });

    // Tutorial -> Example connections
    connections.push({
      from: "branch-tutorial",
      to: "branch-example",
      relationship: "demonstrates",
    });

    // Tool -> Solution connections
    connections.push({
      from: "branch-tool",
      to: "branch-solution",
      relationship: "enables",
    });

    // Future -> Problem connections
    connections.push({
      from: "branch-future",
      to: "branch-problem",
      relationship: "anticipates",
    });

    return connections;
  }

  /**
   * Process a branch to generate content ideas
   */
  private processBranchForContent(
    branch: MindMapNode,
    branchType: BranchType,
    topic: string
  ): ContentIdea[] {
    const ideas: ContentIdea[] = [];
    let idCount = 0;

    // Add branch's own content ideas
    for (const idea of branch.contentIdeas) {
      ideas.push({
        id: `idea-${branchType}-${idCount++}`,
        title: idea,
        type: this.determineContentType(branchType),
        description: `Content idea from ${branchType} branch`,
        sourceNodes: [branch.id],
        keywords: [...branch.keywords, topic],
        priority: this.calculatePriority(branchType),
        estimatedEffort: this.estimateEffort(branchType),
      });
    }

    // Generate ideas from children
    for (const child of branch.children) {
      const childIdea: ContentIdea = {
        id: `idea-${branchType}-${idCount++}`,
        title: `${child.concept}: A Deep Dive into ${topic}`,
        type: "blog",
        description: child.description || `Exploring ${child.concept} in context of ${topic}`,
        sourceNodes: [branch.id, child.id],
        keywords: [...child.keywords, topic],
        priority: 5,
        estimatedEffort: "medium",
      };
      ideas.push(childIdea);
    }

    return ideas;
  }

  /**
   * Generate idea from cross-connection
   */
  private generateCrossConnectionIdea(
    mindMap: MindMap,
    from: string,
    to: string,
    relationship: string
  ): ContentIdea | null {
    const fromType = from.replace("branch-", "") as BranchType;
    const toType = to.replace("branch-", "") as BranchType;

    return {
      id: `idea-cross-${from}-${to}`,
      title: `How ${mindMap.topic} ${relationship}: From ${fromType} to ${toType}`,
      type: "thread",
      description: `Cross-connection content linking ${fromType} and ${toType} perspectives`,
      sourceNodes: [from, to],
      keywords: [mindMap.topic, fromType, toType, relationship],
      priority: 7,
      estimatedEffort: "medium",
    };
  }

  /**
   * Determine best content type for branch
   */
  private determineContentType(branchType: BranchType): ContentIdea["type"] {
    const typeMap: Record<BranchType, ContentIdea["type"]> = {
      problem: "blog",
      solution: "blog",
      example: "tutorial",
      comparison: "blog",
      tutorial: "tutorial",
      future: "thread",
      community: "tweet",
      tool: "blog",
    };
    return typeMap[branchType] || "blog";
  }

  /**
   * Calculate priority for branch type
   */
  private calculatePriority(branchType: BranchType): number {
    const priorityMap: Record<BranchType, number> = {
      tutorial: 9,
      example: 8,
      problem: 7,
      solution: 7,
      comparison: 6,
      tool: 6,
      future: 5,
      community: 4,
    };
    return priorityMap[branchType] || 5;
  }

  /**
   * Estimate effort for branch type
   */
  private estimateEffort(branchType: BranchType): ContentIdea["estimatedEffort"] {
    const effortMap: Record<BranchType, ContentIdea["estimatedEffort"]> = {
      tutorial: "high",
      example: "high",
      problem: "medium",
      solution: "high",
      comparison: "medium",
      tool: "low",
      future: "low",
      community: "low",
    };
    return effortMap[branchType] || "medium";
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(["the", "a", "an", "is", "are", "for", "to", "of", "and", "in", "on"]);
    return words.filter((w) => w.length > 2 && !stopWords.has(w));
  }
}
