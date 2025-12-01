/**
 * Hunter Agent PTC Tool Handler
 *
 * Wraps the Hunter Agent for use in PTC pipelines.
 * Enables discovery → scoring → filtering workflows.
 */

import type { ToolDefinition, ToolHandler, SharedContext } from '../types.js';

// Tool Definition for Claude
export const hunterToolDefinition: ToolDefinition = {
  name: 'hunter_discover',
  description: `Hunt for opportunities across 17 sources: GitHub, HackerNews, Twitter, Reddit, ProductHunt, ArXiv, Lobsters, DevTo, TikTok, DeFiLlama, GeckoTerminal, Fear&Greed, Binance, FRED, SEC, Finnhub, NPM.

Use this tool to:
- Find trending repos and projects
- Discover alpha in DeFi (new pools, TVL changes)
- Track market sentiment and crypto trends
- Monitor economic indicators
- Find viral content and emerging narratives

Returns HuntDiscovery[] with metrics, relevance factors, and source-specific data.`,
  input_schema: {
    type: 'object',
    properties: {
      sources: {
        type: 'string',
        description: 'Comma-separated source names to hunt (e.g., "github,hackernews,defillama"). Leave empty for all sources.',
      },
      category: {
        type: 'string',
        description: 'Filter by category: web3, ai, defi, nft, tooling, other',
        enum: ['web3', 'ai', 'defi', 'nft', 'tooling', 'other'],
      },
      minEngagement: {
        type: 'string',
        description: 'Minimum engagement score (stars, points, likes depending on source)',
      },
      keywords: {
        type: 'string',
        description: 'Comma-separated keywords to filter results',
      },
    },
    required: [],
  },
};

// Score tool for post-processing
export const hunterScoreToolDefinition: ToolDefinition = {
  name: 'hunter_score',
  description: `Score and rank hunt discoveries using Six Thinking Hats analysis.
Takes raw discoveries from hunter_discover and applies multi-perspective scoring:
- WHITE (Facts): Objective metrics
- RED (Emotions): Sentiment/hype level
- BLACK (Risks): Potential downsides
- YELLOW (Benefits): Upside potential
- GREEN (Creativity): Novel aspects
- BLUE (Process): Actionability

Returns scored discoveries with aggregate ranking.`,
  input_schema: {
    type: 'object',
    properties: {
      discoveries: {
        type: 'string',
        description: 'JSON string of discoveries to score (from hunter_discover)',
      },
      weights: {
        type: 'string',
        description: 'Optional JSON object of hat weights (e.g., {"yellow": 2, "black": 1.5})',
      },
    },
    required: ['discoveries'],
  },
};

// Filter tool for pipelines
export const hunterFilterToolDefinition: ToolDefinition = {
  name: 'hunter_filter',
  description: `Filter hunt discoveries based on criteria.
Use after hunter_discover to narrow down results.`,
  input_schema: {
    type: 'object',
    properties: {
      discoveries: {
        type: 'string',
        description: 'JSON string of discoveries to filter',
      },
      minScore: {
        type: 'string',
        description: 'Minimum score to include (0-100)',
      },
      maxAge: {
        type: 'string',
        description: 'Maximum age in hours',
      },
      categories: {
        type: 'string',
        description: 'Comma-separated categories to include',
      },
      hasWeb3: {
        type: 'string',
        description: 'Filter to only Web3-related discoveries (true/false)',
      },
      hasAI: {
        type: 'string',
        description: 'Filter to only AI-related discoveries (true/false)',
      },
      limit: {
        type: 'string',
        description: 'Maximum number of results',
      },
    },
    required: ['discoveries'],
  },
};

// Handler implementations
export const createHunterDiscoverHandler = (
  hunterAgentFactory: () => Promise<{ huntNow: (sources?: string[]) => Promise<unknown[]> }>
): ToolHandler => {
  return async (inputs: Record<string, unknown>, context: SharedContext): Promise<unknown> => {
    // Parse inputs
    const sourcesStr = inputs.sources as string | undefined;
    const sources = sourcesStr ? sourcesStr.split(',').map(s => s.trim()) : undefined;
    const category = inputs.category as string | undefined;
    const minEngagementStr = inputs.minEngagement as string | undefined;
    const minEngagement = minEngagementStr ? parseInt(minEngagementStr, 10) : 0;
    const keywordsStr = inputs.keywords as string | undefined;
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim().toLowerCase()) : [];

    try {
      // Create hunter agent instance
      const hunter = await hunterAgentFactory();

      // Perform hunt
      const discoveries = await hunter.huntNow(sources);

      // Apply filters
      let filtered = discoveries as Array<{
        category?: string;
        metrics?: { stars?: number; points?: number; likes?: number };
        title?: string;
        description?: string;
        tags?: string[];
        relevanceFactors?: Record<string, boolean>;
      }>;

      // Filter by category
      if (category) {
        filtered = filtered.filter(d => d.category === category);
      }

      // Filter by minimum engagement
      if (minEngagement > 0) {
        filtered = filtered.filter(d => {
          const engagement = Math.max(
            d.metrics?.stars ?? 0,
            d.metrics?.points ?? 0,
            d.metrics?.likes ?? 0
          );
          return engagement >= minEngagement;
        });
      }

      // Filter by keywords
      if (keywords.length > 0) {
        filtered = filtered.filter(d => {
          const text = `${d.title ?? ''} ${d.description ?? ''} ${(d.tags ?? []).join(' ')}`.toLowerCase();
          return keywords.some(k => text.includes(k));
        });
      }

      return {
        success: true,
        count: filtered.length,
        discoveries: filtered,
        sources: sources ?? ['all'],
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        discoveries: [],
      };
    }
  };
};

export const createHunterScoreHandler = (): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const discoveriesStr = inputs.discoveries as string;
    const weightsStr = inputs.weights as string | undefined;

    try {
      const discoveries = JSON.parse(discoveriesStr) as Array<{
        title?: string;
        description?: string;
        metrics?: { stars?: number; points?: number; likes?: number; forks?: number; comments?: number };
        relevanceFactors?: Record<string, boolean>;
        publishedAt?: string;
        source?: string;
      }>;
      const weights = weightsStr ? JSON.parse(weightsStr) : {};

      // Default weights for Six Thinking Hats
      const hatWeights = {
        white: weights.white ?? 1,    // Facts
        red: weights.red ?? 0.8,      // Emotions
        black: weights.black ?? 1.2,  // Risks (inversely impacts score)
        yellow: weights.yellow ?? 1.5, // Benefits
        green: weights.green ?? 1.3,  // Creativity
        blue: weights.blue ?? 1,      // Process
      };

      const scoredDiscoveries = discoveries.map(d => {
        // WHITE: Factual metrics
        const metrics = d.metrics ?? {};
        const whiteScore = Math.min(100, (
          (metrics.stars ?? 0) / 100 +
          (metrics.points ?? 0) / 10 +
          (metrics.forks ?? 0) / 50 +
          (metrics.comments ?? 0) / 20
        ) * 10);

        // RED: Emotional/hype indicators
        const factors = d.relevanceFactors ?? {};
        const redScore = (
          (factors.highEngagement ? 30 : 0) +
          (factors.isShowHN ? 20 : 0) +
          (metrics.likes ?? 0 > 100 ? 30 : 0) +
          20 // Base
        );

        // BLACK: Risk factors (lower is better)
        const blackScore = 100 - (
          (factors.hasWeb3Keywords ? 0 : 20) +
          (factors.hasSolanaKeywords || factors.hasEthereumKeywords ? 0 : 10) +
          ((d.publishedAt && Date.now() - new Date(d.publishedAt).getTime() > 7 * 24 * 60 * 60 * 1000) ? 30 : 0)
        );

        // YELLOW: Benefit potential
        const yellowScore = (
          (factors.hasWeb3Keywords ? 25 : 0) +
          (factors.hasAIKeywords ? 25 : 0) +
          (factors.hasTypeScript ? 15 : 0) +
          (factors.recentActivity ? 20 : 0) +
          15 // Base
        );

        // GREEN: Creativity/novelty
        const greenScore = (
          (d.source === 'arxiv' ? 30 : 0) +
          (d.source === 'producthunt' ? 25 : 0) +
          (factors.isShowHN ? 25 : 0) +
          20 // Base
        );

        // BLUE: Actionability
        const blueScore = (
          (factors.hasWeb3Keywords && factors.hasTypeScript ? 40 : 0) +
          (factors.recentActivity ? 30 : 0) +
          30 // Base
        );

        // Weighted aggregate
        const aggregateScore = (
          whiteScore * hatWeights.white +
          redScore * hatWeights.red +
          blackScore * hatWeights.black +
          yellowScore * hatWeights.yellow +
          greenScore * hatWeights.green +
          blueScore * hatWeights.blue
        ) / (
          hatWeights.white +
          hatWeights.red +
          hatWeights.black +
          hatWeights.yellow +
          hatWeights.green +
          hatWeights.blue
        );

        return {
          ...d,
          sixHatsScores: {
            white: Math.round(whiteScore),
            red: Math.round(redScore),
            black: Math.round(blackScore),
            yellow: Math.round(yellowScore),
            green: Math.round(greenScore),
            blue: Math.round(blueScore),
          },
          aggregateScore: Math.round(aggregateScore),
        };
      });

      // Sort by aggregate score
      scoredDiscoveries.sort((a, b) => b.aggregateScore - a.aggregateScore);

      return {
        success: true,
        count: scoredDiscoveries.length,
        discoveries: scoredDiscoveries,
        topScore: scoredDiscoveries[0]?.aggregateScore ?? 0,
        averageScore: Math.round(
          scoredDiscoveries.reduce((sum, d) => sum + d.aggregateScore, 0) / scoredDiscoveries.length
        ),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid JSON input',
        discoveries: [],
      };
    }
  };
};

export const createHunterFilterHandler = (): ToolHandler => {
  return async (inputs: Record<string, unknown>, _context: SharedContext): Promise<unknown> => {
    const discoveriesStr = inputs.discoveries as string;

    try {
      const discoveries = JSON.parse(discoveriesStr) as Array<{
        aggregateScore?: number;
        discoveredAt?: string;
        category?: string;
        relevanceFactors?: Record<string, boolean>;
      }>;

      let filtered = [...discoveries];

      // Filter by score
      const minScoreStr = inputs.minScore as string | undefined;
      if (minScoreStr) {
        const minScore = parseInt(minScoreStr, 10);
        filtered = filtered.filter(d => (d.aggregateScore ?? 0) >= minScore);
      }

      // Filter by age
      const maxAgeStr = inputs.maxAge as string | undefined;
      if (maxAgeStr) {
        const maxAgeHours = parseInt(maxAgeStr, 10);
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const now = Date.now();
        filtered = filtered.filter(d => {
          if (!d.discoveredAt) return true;
          return now - new Date(d.discoveredAt).getTime() <= maxAgeMs;
        });
      }

      // Filter by categories
      const categoriesStr = inputs.categories as string | undefined;
      if (categoriesStr) {
        const categories = categoriesStr.split(',').map(c => c.trim());
        filtered = filtered.filter(d => d.category && categories.includes(d.category));
      }

      // Filter by Web3
      const hasWeb3Str = inputs.hasWeb3 as string | undefined;
      if (hasWeb3Str === 'true') {
        filtered = filtered.filter(d => d.relevanceFactors?.hasWeb3Keywords);
      }

      // Filter by AI
      const hasAIStr = inputs.hasAI as string | undefined;
      if (hasAIStr === 'true') {
        filtered = filtered.filter(d => d.relevanceFactors?.hasAIKeywords);
      }

      // Apply limit
      const limitStr = inputs.limit as string | undefined;
      if (limitStr) {
        const limit = parseInt(limitStr, 10);
        filtered = filtered.slice(0, limit);
      }

      return {
        success: true,
        count: filtered.length,
        discoveries: filtered,
        filtersApplied: {
          minScore: minScoreStr,
          maxAge: maxAgeStr,
          categories: categoriesStr,
          hasWeb3: hasWeb3Str,
          hasAI: hasAIStr,
          limit: limitStr,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid JSON input',
        discoveries: [],
      };
    }
  };
};

// Export all hunter tools
export const hunterTools = {
  definitions: [
    hunterToolDefinition,
    hunterScoreToolDefinition,
    hunterFilterToolDefinition,
  ],
  createHandlers: (hunterFactory: () => Promise<{ huntNow: (sources?: string[]) => Promise<unknown[]> }>) => ({
    'hunter_discover': createHunterDiscoverHandler(hunterFactory),
    'hunter_score': createHunterScoreHandler(),
    'hunter_filter': createHunterFilterHandler(),
  }),
};
