/**
 * PTC Tool Handlers Index
 *
 * Exports all tool definitions and handlers for PTC pipelines.
 * These tools wrap gICM engines for orchestrated execution.
 */

// Hunter Agent Tools
export {
  hunterToolDefinition,
  hunterScoreToolDefinition,
  hunterFilterToolDefinition,
  hunterTools,
  createHunterDiscoverHandler,
  createHunterScoreHandler,
  createHunterFilterHandler,
} from './hunter-tool.js';

// Money Engine Tools
export {
  dcaTradeToolDefinition,
  treasuryStatusToolDefinition,
  expenseStatusToolDefinition,
  healthCheckToolDefinition,
  moneyEngineTools,
  createDCATradeHandler,
  createTreasuryStatusHandler,
  createExpenseStatusHandler,
  createHealthCheckHandler,
} from './money-engine-tool.js';

// Growth Engine Tools
export {
  blogGenerateToolDefinition,
  tweetGenerateToolDefinition,
  keywordResearchToolDefinition,
  seoAnalyzeToolDefinition,
  contentCalendarToolDefinition,
  discordAnnounceToolDefinition,
  growthEngineTools,
  createBlogGenerateHandler,
  createTweetGenerateHandler,
  createKeywordResearchHandler,
  createSEOAnalyzeHandler,
  createContentCalendarHandler,
  createDiscordAnnounceHandler,
} from './growth-engine-tool.js';

// Autonomy Tools
export {
  classifyRiskToolDefinition,
  checkApprovalToolDefinition,
  checkBoundariesToolDefinition,
  logAuditToolDefinition,
  autonomyStatusToolDefinition,
  autonomyTools,
  createClassifyRiskHandler,
  createCheckApprovalHandler,
  createCheckBoundariesHandler,
  createLogAuditHandler,
  createAutonomyStatusHandler,
} from './autonomy-tool.js';

import { hunterTools } from './hunter-tool.js';
import { moneyEngineTools } from './money-engine-tool.js';
import { growthEngineTools } from './growth-engine-tool.js';
import { autonomyTools } from './autonomy-tool.js';
import type { ToolDefinition, ToolHandler } from '../types.js';

/**
 * Get all tool definitions
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return [
    ...hunterTools.definitions,
    ...moneyEngineTools.definitions,
    ...growthEngineTools.definitions,
    ...autonomyTools.definitions,
  ];
}

/**
 * Create all tool handlers with factory functions
 */
export function createAllHandlers(factories: {
  hunterAgent?: () => Promise<{ huntNow: (sources?: string[]) => Promise<unknown[]> }>;
  moneyEngine?: () => Promise<any>;
  growthEngine?: () => Promise<any>;
  autonomyEngine?: () => Promise<any>;
  autonomyCheck?: (action: any) => Promise<{ approved: boolean; reason?: string; requiresApproval?: boolean }>;
}): Record<string, ToolHandler> {
  const handlers: Record<string, ToolHandler> = {};

  // Hunter tools (require hunter agent factory)
  if (factories.hunterAgent) {
    Object.assign(handlers, hunterTools.createHandlers(factories.hunterAgent));
  }

  // Money engine tools (require money engine factory + optional autonomy check)
  if (factories.moneyEngine) {
    Object.assign(handlers, moneyEngineTools.createHandlers(
      factories.moneyEngine,
      factories.autonomyCheck
    ));
  }

  // Growth engine tools (require growth engine factory)
  if (factories.growthEngine) {
    Object.assign(handlers, growthEngineTools.createHandlers(factories.growthEngine));
  }

  // Autonomy tools (optional autonomy engine factory)
  Object.assign(handlers, autonomyTools.createHandlers(factories.autonomyEngine));

  return handlers;
}

/**
 * Tool categories for UI organization
 */
export const toolCategories = {
  hunter: {
    name: 'Hunter Agent',
    description: 'Discover opportunities across 17 data sources',
    tools: ['hunter_discover', 'hunter_score', 'hunter_filter'],
    icon: 'Target',
  },
  money: {
    name: 'Money Engine',
    description: 'Treasury management and DCA trading',
    tools: ['money_dca_trade', 'money_treasury_status', 'money_expenses', 'money_health_check'],
    icon: 'Wallet',
  },
  growth: {
    name: 'Growth Engine',
    description: 'Content generation and marketing automation',
    tools: ['growth_generate_blog', 'growth_generate_tweets', 'growth_keyword_research', 'growth_seo_analyze', 'growth_content_calendar', 'growth_discord_announce'],
    icon: 'TrendingUp',
  },
  autonomy: {
    name: 'Autonomy Engine',
    description: 'Risk classification and approval workflows',
    tools: ['autonomy_classify_risk', 'autonomy_check_approval', 'autonomy_check_boundaries', 'autonomy_log_audit', 'autonomy_status'],
    icon: 'Shield',
  },
};

/**
 * Pre-built pipeline templates using these tools
 */
export const pipelineTemplates = {
  // Research and analyze workflow
  researchAndAnalyze: {
    id: 'research-analyze',
    name: 'Research & Analyze',
    description: 'Hunt for opportunities, score them, and filter top results',
    steps: [
      { id: 'hunt', tool: 'hunter_discover', inputs: { sources: 'github,hackernews,defillama' } },
      { id: 'score', tool: 'hunter_score', inputs: { discoveries: '${results.hunt.discoveries}' }, dependsOn: ['hunt'] },
      { id: 'filter', tool: 'hunter_filter', inputs: { discoveries: '${results.score.discoveries}', minScore: '60', limit: '10' }, dependsOn: ['score'] },
    ],
    metadata: { category: 'research', riskLevel: 'safe', tags: ['hunter', 'analysis'] },
  },

  // Content generation workflow
  contentGeneration: {
    id: 'content-gen',
    name: 'Content Generation',
    description: 'Research keywords, generate blog post, create social posts',
    steps: [
      { id: 'keywords', tool: 'growth_keyword_research', inputs: { topic: '${inputs.topic}', depth: 'standard' } },
      { id: 'blog', tool: 'growth_generate_blog', inputs: { topic: '${inputs.topic}', keywords: '${results.keywords.keywords[0].keyword}' }, dependsOn: ['keywords'] },
      { id: 'seo', tool: 'growth_seo_analyze', inputs: { content: '${results.blog.blog.content}', targetKeywords: '${inputs.topic}' }, dependsOn: ['blog'] },
      { id: 'tweets', tool: 'growth_generate_tweets', inputs: { topic: '${inputs.topic}', count: '5', style: 'promotional' }, dependsOn: ['blog'] },
    ],
    metadata: { category: 'content', riskLevel: 'low', tags: ['growth', 'marketing'] },
  },

  // DCA trading with autonomy
  dcaWithAutonomy: {
    id: 'dca-autonomy',
    name: 'DCA Trade (Safe)',
    description: 'Execute DCA trade with risk classification and boundary checks',
    steps: [
      { id: 'classify', tool: 'autonomy_classify_risk', inputs: { action: '{"type":"trade","asset":"${inputs.asset}","amount":${inputs.amount}}', category: 'financial', estimatedImpact: '${inputs.amount}' } },
      { id: 'boundaries', tool: 'autonomy_check_boundaries', inputs: { boundaryType: 'financial', value: '${inputs.amount}' }, dependsOn: ['classify'] },
      { id: 'trade', tool: 'money_dca_trade', inputs: { asset: '${inputs.asset}', amountUsd: '${inputs.amount}', mode: '${inputs.mode}' }, dependsOn: ['boundaries'], condition: 'results.boundaries.withinBoundaries && results.classify.risk.recommendation !== "reject"' },
      { id: 'audit', tool: 'autonomy_log_audit', inputs: { action: '{"type":"trade","asset":"${inputs.asset}","amount":${inputs.amount}}', result: '${results.trade.success ? "success" : "failed"}' }, dependsOn: ['trade'] },
    ],
    metadata: { category: 'trading', riskLevel: 'medium', tags: ['money', 'autonomy', 'trading'] },
  },

  // Financial health check
  financialHealthCheck: {
    id: 'health-check',
    name: 'Financial Health Check',
    description: 'Complete treasury and expense analysis',
    steps: [
      { id: 'treasury', tool: 'money_treasury_status', inputs: {} },
      { id: 'expenses', tool: 'money_expenses', inputs: { days: '30' } },
      { id: 'health', tool: 'money_health_check', inputs: {}, dependsOn: ['treasury', 'expenses'] },
      { id: 'autonomy', tool: 'autonomy_status', inputs: {} },
    ],
    metadata: { category: 'monitoring', riskLevel: 'safe', tags: ['money', 'health'] },
  },

  // Full discovery pipeline
  fullDiscovery: {
    id: 'full-discovery',
    name: 'Full Discovery Pipeline',
    description: 'Hunt all sources, score, filter, and generate content about top findings',
    steps: [
      { id: 'hunt', tool: 'hunter_discover', inputs: {} },
      { id: 'score', tool: 'hunter_score', inputs: { discoveries: '${JSON.stringify(results.hunt.discoveries)}' }, dependsOn: ['hunt'] },
      { id: 'filter', tool: 'hunter_filter', inputs: { discoveries: '${JSON.stringify(results.score.discoveries)}', minScore: '70', limit: '5' }, dependsOn: ['score'] },
      { id: 'tweets', tool: 'growth_generate_tweets', inputs: { topic: '${results.filter.discoveries[0]?.title || "tech trends"}', count: '3', style: 'informative' }, dependsOn: ['filter'] },
    ],
    metadata: { category: 'research', riskLevel: 'low', tags: ['hunter', 'growth', 'full-stack'] },
  },
};
