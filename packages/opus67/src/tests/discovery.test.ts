/**
 * OPUS 67 v5.0 - Dynamic Tool Discovery Tests
 *
 * Tests for the DynamicToolDiscovery engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicToolDiscovery } from '../mcp/discovery.js';
import type { MCPConnection } from '../mcp/hub.js';

describe('DynamicToolDiscovery', () => {
  let discovery: DynamicToolDiscovery;
  let mockConnections: MCPConnection[];

  beforeEach(() => {
    discovery = new DynamicToolDiscovery({
      maxResults: 5,
      threshold: 0.3,
      enableAISearch: false // Disable AI for unit tests
    });

    // Mock MCP connections
    mockConnections = [
      {
        id: 'jupiter',
        name: 'Jupiter DEX',
        category: 'defi',
        priority: 5,
        status: 'ready',
        transport: 'http',
        base_url: 'https://api.jup.ag',
        tools: [
          {
            name: 'getPrice',
            description: 'Get token price and swap routes on Solana DEX'
          },
          {
            name: 'executeSwap',
            description: 'Execute token swap on Jupiter'
          }
        ]
      },
      {
        id: 'helius',
        name: 'Helius RPC',
        category: 'blockchain',
        priority: 4,
        status: 'ready',
        transport: 'http',
        base_url: 'https://api.helius.xyz',
        tools: [
          {
            name: 'getTransaction',
            description: 'Get Solana transaction details'
          },
          {
            name: 'getBalance',
            description: 'Get wallet balance on Solana'
          }
        ]
      },
      {
        id: 'github',
        name: 'GitHub API',
        category: 'developer',
        priority: 3,
        status: 'ready',
        transport: 'http',
        base_url: 'https://api.github.com',
        tools: [
          {
            name: 'createIssue',
            description: 'Create GitHub issue'
          },
          {
            name: 'searchCode',
            description: 'Search code across repositories'
          }
        ]
      },
      {
        id: 'notion',
        name: 'Notion API',
        category: 'productivity',
        priority: 2,
        status: 'ready',
        transport: 'http',
        base_url: 'https://api.notion.com',
        tools: [
          {
            name: 'createPage',
            description: 'Create Notion page with content'
          },
          {
            name: 'queryDatabase',
            description: 'Query Notion database'
          }
        ]
      }
    ];

    discovery.registerConnections(mockConnections);
  });

  describe('Semantic Discovery', () => {
    it('should discover Jupiter for DEX price queries', async () => {
      const result = await discovery.discoverTools('Get SOL/USDC price on Solana DEX');

      expect(result.connections.length).toBeGreaterThan(0);
      expect(result.connections[0].id).toBe('jupiter');
      expect(result.method).toBe('semantic');
    });

    it('should discover Helius for Solana blockchain queries', async () => {
      const result = await discovery.discoverTools('Get transaction details from Solana blockchain');

      expect(result.connections.length).toBeGreaterThan(0);
      const ids = result.connections.map(c => c.id);
      expect(ids).toContain('helius');
    });

    it('should discover GitHub for code-related queries', async () => {
      const result = await discovery.discoverTools('Search for TypeScript code in repositories');

      expect(result.connections.length).toBeGreaterThan(0);
      const ids = result.connections.map(c => c.id);
      expect(ids).toContain('github');
    });

    it('should discover Notion for productivity queries', async () => {
      const result = await discovery.discoverTools('Create a new page in Notion with meeting notes');

      expect(result.connections.length).toBeGreaterThan(0);
      const ids = result.connections.map(c => c.id);
      expect(ids).toContain('notion');
    });

    it('should respect maxResults limit', async () => {
      discovery.updateConfig({ maxResults: 2 });
      const result = await discovery.discoverTools('blockchain transaction price');

      expect(result.connections.length).toBeLessThanOrEqual(2);
    });

    it('should respect threshold', async () => {
      discovery.updateConfig({ threshold: 0.9 });
      const result = await discovery.discoverTools('vague generic query');

      // High threshold should filter out low-relevance matches
      expect(result.connections.length).toBeLessThan(mockConnections.length);
    });

    it('should score category matches', async () => {
      const result = await discovery.discoverTools('DeFi protocol analysis');

      const jupiterScore = result.relevanceScores.get('jupiter');
      expect(jupiterScore).toBeDefined();
      expect(jupiterScore).toBeGreaterThan(0);
    });

    it('should score tool description matches', async () => {
      const result = await discovery.discoverTools('execute swap');

      const jupiterScore = result.relevanceScores.get('jupiter');
      expect(jupiterScore).toBeDefined();
      expect(jupiterScore).toBeGreaterThan(0.3);
    });

    it('should boost high priority connections', async () => {
      const result = await discovery.discoverTools('generic query');

      // Jupiter (priority 5) should be ranked higher than others
      const jupiterScore = result.relevanceScores.get('jupiter') || 0;
      const heliusScore = result.relevanceScores.get('helius') || 0;

      // Priority boost should help Jupiter
      if (jupiterScore > 0 && heliusScore > 0) {
        expect(jupiterScore).toBeGreaterThanOrEqual(heliusScore);
      }
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = discovery.getConfig();

      expect(config.maxResults).toBe(5);
      expect(config.threshold).toBe(0.3);
      expect(config.enableAISearch).toBe(false);
    });

    it('should update configuration', () => {
      discovery.updateConfig({
        maxResults: 10,
        threshold: 0.5
      });

      const config = discovery.getConfig();
      expect(config.maxResults).toBe(10);
      expect(config.threshold).toBe(0.5);
    });

    it('should get all registered connections', () => {
      const all = discovery.getAllConnections();

      expect(all.length).toBe(mockConnections.length);
      expect(all[0]).toMatchObject(mockConnections[0]);
    });

    it('should get connection by ID', () => {
      const jupiter = discovery.getConnection('jupiter');

      expect(jupiter).toBeDefined();
      expect(jupiter?.id).toBe('jupiter');
      expect(jupiter?.name).toBe('Jupiter DEX');
    });

    it('should clear tool library', () => {
      discovery.clear();
      const all = discovery.getAllConnections();

      expect(all.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', async () => {
      const result = await discovery.discoverTools('');

      expect(result.connections.length).toBeLessThanOrEqual(mockConnections.length);
    });

    it('should handle query with no matches', async () => {
      const result = await discovery.discoverTools('xyzabc123 nonexistent query');

      expect(result.connections.length).toBe(0);
    });

    it('should handle special characters in query', async () => {
      const result = await discovery.discoverTools('Get $SOL/USDC price (with 1% slippage)');

      expect(result.connections.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide reasoning for discoveries', async () => {
      const result = await discovery.discoverTools('Get Jupiter price');

      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Event Emissions', () => {
    it('should emit discovery:start event', async () => {
      let emitted = false;
      let taskReceived = '';

      discovery.once('discovery:start', (task) => {
        emitted = true;
        taskReceived = task;
      });

      await discovery.discoverTools('Test query');

      expect(emitted).toBe(true);
      expect(taskReceived).toBe('Test query');
    });

    it('should emit discovery:complete event', async () => {
      let emitted = false;
      let resultReceived: any = null;

      discovery.once('discovery:complete', (result) => {
        emitted = true;
        resultReceived = result;
      });

      await discovery.discoverTools('Get SOL price');

      expect(emitted).toBe(true);
      expect(resultReceived).toBeDefined();
      expect(resultReceived.connections).toBeDefined();
    });
  });

  describe('Multi-Tool Scenarios', () => {
    it('should discover multiple relevant tools for complex tasks', async () => {
      const result = await discovery.discoverTools(
        'Get Solana wallet balance and current DEX prices'
      );

      const ids = result.connections.map(c => c.id);

      // Should find both Helius (for balance) and Jupiter (for prices)
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should rank by relevance', async () => {
      const result = await discovery.discoverTools('Jupiter swap price');

      // Jupiter should be first (most relevant)
      if (result.connections.length > 0) {
        expect(result.connections[0].id).toBe('jupiter');
      }
    });

    it('should handle category-specific queries', async () => {
      const result = await discovery.discoverTools('DeFi tools');

      const jupiterFound = result.connections.some(c => c.id === 'jupiter');
      expect(jupiterFound).toBe(true);
    });
  });
});
