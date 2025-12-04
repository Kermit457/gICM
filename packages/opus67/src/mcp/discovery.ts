/**
 * OPUS 67 v5.0 - Dynamic Tool Discovery
 *
 * Implements intelligent tool discovery using semantic matching and keyword analysis.
 * Connects only relevant MCPs instead of all 84 connections.
 *
 * Future: Will use Claude Opus 4.5 Tool Search API when available.
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'eventemitter3';
import type { MCPConnection, MCPTool } from './hub.js';

// Types
export interface DiscoveryConfig {
  maxResults?: number; // Max tools to discover (default: 5)
  threshold?: number; // Relevance threshold 0-1 (default: 0.3)
  enableAISearch?: boolean; // Use AI for semantic matching (default: true)
  anthropicApiKey?: string;
}

export interface DiscoveryResult {
  connections: MCPConnection[];
  relevanceScores: Map<string, number>; // MCP ID → relevance score
  reasoning: string;
  method: 'keyword' | 'semantic' | 'ai_powered';
}

export interface ToolMatch {
  mcpId: string;
  toolName: string;
  relevance: number;
  reason: string;
}

interface DiscoveryEvents {
  'discovery:start': (task: string) => void;
  'discovery:complete': (result: DiscoveryResult) => void;
  'discovery:fallback': (reason: string) => void;
}

/**
 * Dynamic Tool Discovery Engine
 *
 * Analyzes task requirements and discovers relevant MCPs/tools dynamically.
 */
export class DynamicToolDiscovery extends EventEmitter<DiscoveryEvents> {
  private config: Required<DiscoveryConfig>;
  private anthropic: Anthropic | null = null;
  private toolLibrary: Map<string, MCPConnection> = new Map();

  constructor(config?: DiscoveryConfig) {
    super();

    this.config = {
      maxResults: config?.maxResults ?? 5,
      threshold: config?.threshold ?? 0.3,
      enableAISearch: config?.enableAISearch ?? true,
      anthropicApiKey: config?.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? ''
    };

    // Initialize Anthropic client if API key available
    if (this.config.anthropicApiKey && this.config.enableAISearch) {
      this.anthropic = new Anthropic({
        apiKey: this.config.anthropicApiKey
      });
    }
  }

  /**
   * Register available MCP connections
   */
  registerConnections(connections: MCPConnection[]): void {
    for (const conn of connections) {
      this.toolLibrary.set(conn.id, conn);
    }
  }

  /**
   * Discover relevant tools for a task
   */
  async discoverTools(task: string): Promise<DiscoveryResult> {
    this.emit('discovery:start', task);

    // Try AI-powered discovery first (if available)
    if (this.anthropic && this.config.enableAISearch) {
      try {
        return await this.aiPoweredDiscovery(task);
      } catch (error) {
        console.warn('[DynamicToolDiscovery] AI discovery failed, falling back:', error);
        this.emit('discovery:fallback', 'AI discovery unavailable, using semantic matching');
      }
    }

    // Fallback to semantic matching
    return await this.semanticDiscovery(task);
  }

  /**
   * AI-powered discovery using Claude's understanding
   */
  private async aiPoweredDiscovery(task: string): Promise<DiscoveryResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    // Build tool descriptions
    const toolDescriptions = Array.from(this.toolLibrary.values()).map(conn => ({
      id: conn.id,
      name: conn.name,
      category: conn.category,
      tools: conn.tools.map(t => `${t.name}: ${t.description}`).join('; ')
    }));

    const prompt = `Analyze this task and identify the most relevant MCP tools:

Task: "${task}"

Available MCPs:
${toolDescriptions.map(t => `- ${t.id} (${t.name}): ${t.tools}`).join('\n')}

Return a JSON array of the top ${this.config.maxResults} most relevant MCP IDs with relevance scores (0-1) and reasoning.

Format:
[
  { "id": "jupiter", "score": 0.95, "reason": "Direct Jupiter API access for Solana DEX" },
  ...
]`;

    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse response
    let content = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      }
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const matches = JSON.parse(jsonMatch[0]) as Array<{ id: string; score: number; reason: string }>;

    // Filter by threshold and build result
    const relevantMatches = matches
      .filter(m => m.score >= this.config.threshold)
      .slice(0, this.config.maxResults);

    const connections = relevantMatches
      .map(m => this.toolLibrary.get(m.id))
      .filter((c): c is MCPConnection => c !== undefined);

    const relevanceScores = new Map(
      relevantMatches.map(m => [m.id, m.score])
    );

    const reasoning = relevantMatches
      .map(m => `${m.id} (${(m.score * 100).toFixed(0)}%): ${m.reason}`)
      .join('\n');

    const result: DiscoveryResult = {
      connections,
      relevanceScores,
      reasoning,
      method: 'ai_powered'
    };

    this.emit('discovery:complete', result);
    return result;
  }

  /**
   * Semantic discovery using keyword matching and heuristics
   */
  private async semanticDiscovery(task: string): Promise<DiscoveryResult> {
    const taskLower = task.toLowerCase();
    const matches: Array<{ conn: MCPConnection; score: number; reason: string }> = [];

    // Analyze each MCP connection
    for (const [id, conn] of this.toolLibrary) {
      let score = 0;
      const reasons: string[] = [];

      // Check category match (weight: 0.2)
      if (taskLower.includes(conn.category.toLowerCase())) {
        score += 0.2;
        reasons.push(`category match (${conn.category})`);
      }

      // Check name match (weight: 0.3)
      const nameWords = conn.name.toLowerCase().split(/[\s-_]/);
      for (const word of nameWords) {
        if (word.length > 3 && taskLower.includes(word)) {
          score += 0.3;
          reasons.push(`name match (${word})`);
          break;
        }
      }

      // Check tool descriptions (weight: 0.5)
      for (const tool of conn.tools) {
        const descWords = tool.description.toLowerCase().split(/\s+/);
        const taskWords = taskLower.split(/\s+/);
        const overlap = descWords.filter(w => taskWords.includes(w) && w.length > 3);

        if (overlap.length > 0) {
          const toolScore = Math.min(0.5, overlap.length * 0.1);
          score += toolScore;
          reasons.push(`tool match: ${tool.name}`);
        }
      }

      // Apply priority boost (weight: 0.1)
      if (conn.priority >= 4) {
        score += 0.1;
        reasons.push('high priority');
      }

      if (score >= this.config.threshold) {
        matches.push({
          conn,
          score: Math.min(score, 1.0),
          reason: reasons.join(', ')
        });
      }
    }

    // Sort by score and take top results
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, this.config.maxResults);

    const connections = topMatches.map(m => m.conn);
    const relevanceScores = new Map(
      topMatches.map(m => [m.conn.id, m.score])
    );

    const reasoning = topMatches.length > 0
      ? topMatches.map(m => `${m.conn.id} (${(m.score * 100).toFixed(0)}%): ${m.reason}`).join('\n')
      : 'No relevant tools found above threshold';

    const result: DiscoveryResult = {
      connections,
      relevanceScores,
      reasoning,
      method: 'semantic'
    };

    this.emit('discovery:complete', result);
    return result;
  }

  /**
   * Keyword-based discovery (fastest, least accurate)
   */
  private keywordDiscovery(task: string): DiscoveryResult {
    const taskLower = task.toLowerCase();
    const matches: Array<{ conn: MCPConnection; score: number }> = [];

    // Simple keyword matching
    for (const [id, conn] of this.toolLibrary) {
      if (
        taskLower.includes(conn.id.toLowerCase()) ||
        taskLower.includes(conn.name.toLowerCase()) ||
        taskLower.includes(conn.category.toLowerCase())
      ) {
        matches.push({ conn, score: 0.8 });
      }
    }

    const connections = matches.slice(0, this.config.maxResults).map(m => m.conn);
    const relevanceScores = new Map(
      matches.slice(0, this.config.maxResults).map(m => [m.conn.id, m.score])
    );

    return {
      connections,
      relevanceScores,
      reasoning: connections.length > 0
        ? `Found ${connections.length} keyword matches`
        : 'No keyword matches found',
      method: 'keyword'
    };
  }

  /**
   * Get all registered connections
   */
  getAllConnections(): MCPConnection[] {
    return Array.from(this.toolLibrary.values());
  }

  /**
   * Get connection by ID
   */
  getConnection(id: string): MCPConnection | undefined {
    return this.toolLibrary.get(id);
  }

  /**
   * Clear tool library
   */
  clear(): void {
    this.toolLibrary.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<DiscoveryConfig>> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DiscoveryConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize Anthropic if API key changed
    if (config.anthropicApiKey && this.config.enableAISearch) {
      this.anthropic = new Anthropic({
        apiKey: config.anthropicApiKey
      });
    }
  }
}

/**
 * Factory function
 */
export function createDiscovery(config?: DiscoveryConfig): DynamicToolDiscovery {
  return new DynamicToolDiscovery(config);
}

/**
 * Global singleton (optional)
 */
let globalDiscovery: DynamicToolDiscovery | null = null;

export function getDiscovery(config?: DiscoveryConfig): DynamicToolDiscovery {
  if (!globalDiscovery) {
    globalDiscovery = new DynamicToolDiscovery(config);
  }
  return globalDiscovery;
}
