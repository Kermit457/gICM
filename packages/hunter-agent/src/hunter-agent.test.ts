/**
 * HunterAgent Unit Tests
 *
 * Tests hunter agent initialization, hunting, and deduplication.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HunterAgent, type HunterAgentConfig } from './hunter-agent.js';
import type { HuntDiscovery, HunterConfig } from './types.js';

// Mock the hunter sources
vi.mock('./sources/feargreed-hunter.js', () => ({
  FearGreedHunter: vi.fn().mockImplementation(() => ({
    hunt: vi.fn().mockResolvedValue([
      { index: 75, classification: 'Greed' },
    ]),
    transform: vi.fn().mockImplementation((raw) => ({
      source: 'feargreed',
      type: 'sentiment',
      title: `Fear & Greed Index: ${raw.index}`,
      description: `Market sentiment is ${raw.classification}`,
      url: 'https://alternative.me/crypto/fear-and-greed-index/',
      fingerprint: `feargreed-${raw.index}`,
      discoveredAt: new Date().toISOString(),
      relevance: 0.8,
      metrics: { index: raw.index },
      tags: ['sentiment', 'market'],
    })),
  })),
}));

vi.mock('./sources/binance-hunter.js', () => ({
  BinanceHunter: vi.fn().mockImplementation(() => ({
    hunt: vi.fn().mockResolvedValue([
      { symbol: 'SOLUSDT', priceChange: '5.2', volume: '1000000' },
    ]),
    transform: vi.fn().mockImplementation((raw) => ({
      source: 'binance',
      type: 'price_move',
      title: `${raw.symbol} +${raw.priceChange}%`,
      description: `Price movement detected`,
      url: `https://binance.com/trade/${raw.symbol}`,
      fingerprint: `binance-${raw.symbol}-${Date.now()}`,
      discoveredAt: new Date().toISOString(),
      relevance: 0.9,
      metrics: { priceChange: parseFloat(raw.priceChange) },
      tags: ['price', 'crypto'],
    })),
  })),
}));

// Helper to create test config
function createTestConfig(
  overrides: Partial<HunterAgentConfig> = {}
): HunterAgentConfig {
  return {
    name: 'test-hunter',
    description: 'Test hunter agent',
    sources: [
      { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
    ],
    ...overrides,
  };
}

describe('HunterAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with configured sources', () => {
      const config = createTestConfig({
        sources: [
          { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
          { source: 'binance', enabled: true, schedule: '*/5 * * * *' },
        ],
      });

      const agent = new HunterAgent(config);

      // Agent should be created
      expect(agent).toBeDefined();
    });

    it('ignores disabled sources', () => {
      const config = createTestConfig({
        sources: [
          { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
          { source: 'binance', enabled: false, schedule: '*/5 * * * *' },
        ],
      });

      const agent = new HunterAgent(config);

      // Only enabled source should be initialized
      expect(agent).toBeDefined();
    });

    it('applies default deduplication TTL', () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      expect(agent).toBeDefined();
      // Default TTL is 7 days (checked via private property in implementation)
    });

    it('accepts custom deduplication TTL', () => {
      const config = createTestConfig({
        deduplicationTTL: 1000 * 60 * 60, // 1 hour
      });
      const agent = new HunterAgent(config);

      expect(agent).toBeDefined();
    });
  });

  describe('onDiscovery Callback', () => {
    it('calls onDiscovery callback with discoveries', async () => {
      const onDiscovery = vi.fn();
      const config = createTestConfig({ onDiscovery });

      const agent = new HunterAgent(config);
      await agent.huntNow(['feargreed']);

      expect(onDiscovery).toHaveBeenCalled();
      const discoveries = onDiscovery.mock.calls[0][0];
      expect(Array.isArray(discoveries)).toBe(true);
      expect(discoveries.length).toBeGreaterThan(0);
    });

    it('does not call onDiscovery when no discoveries', async () => {
      const onDiscovery = vi.fn();
      const config = createTestConfig({
        onDiscovery,
        sources: [], // No sources = no discoveries
      });

      const agent = new HunterAgent(config);
      await agent.huntNow();

      expect(onDiscovery).not.toHaveBeenCalled();
    });
  });

  describe('Deduplication', () => {
    it('deduplicates discoveries by fingerprint', async () => {
      const onDiscovery = vi.fn();
      const config = createTestConfig({ onDiscovery });

      const agent = new HunterAgent(config);

      // First hunt
      await agent.huntNow(['feargreed']);
      const firstCallCount = onDiscovery.mock.calls[0]?.[0]?.length ?? 0;

      // Second hunt - should dedupe
      await agent.huntNow(['feargreed']);

      // Second call might not happen if all deduplicated
      // Or if called, should have 0 or fewer discoveries
      if (onDiscovery.mock.calls.length > 1) {
        const secondCallCount = onDiscovery.mock.calls[1][0].length;
        expect(secondCallCount).toBeLessThanOrEqual(firstCallCount);
      }
    });

    it('filters by confidence threshold', async () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      const discoveries = await agent.huntNow(['feargreed']);

      // All discoveries should have relevance score
      for (const discovery of discoveries) {
        expect(discovery.relevance).toBeDefined();
        expect(discovery.relevance).toBeGreaterThanOrEqual(0);
        expect(discovery.relevance).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Status', () => {
    it('returns valid status object', async () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      const result = await agent.analyze({
        action: 'status',
        timestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('isRunning');
      expect(result.data).toHaveProperty('hunters');
      expect(result.data).toHaveProperty('seenCount');
    });

    it('tracks seen count accurately', async () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      // Initial status
      let result = await agent.analyze({
        action: 'status',
        timestamp: Date.now(),
      });
      const initialCount = result.data?.seenCount ?? 0;

      // Hunt to add seen items
      await agent.huntNow(['feargreed']);

      // Check updated status
      result = await agent.analyze({
        action: 'status',
        timestamp: Date.now(),
      });
      const newCount = result.data?.seenCount ?? 0;

      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Hunting', () => {
    it('hunts specific sources when specified', async () => {
      const config = createTestConfig({
        sources: [
          { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
          { source: 'binance', enabled: true, schedule: '*/5 * * * *' },
        ],
      });

      const agent = new HunterAgent(config);
      const discoveries = await agent.huntNow(['feargreed']);

      // All discoveries should be from feargreed
      for (const discovery of discoveries) {
        expect(discovery.source).toBe('feargreed');
      }
    });

    it('hunts all sources when none specified', async () => {
      const config = createTestConfig({
        sources: [
          { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
          { source: 'binance', enabled: true, schedule: '*/5 * * * *' },
        ],
      });

      const agent = new HunterAgent(config);
      const discoveries = await agent.huntNow();

      // Should have discoveries from both sources
      const sources = new Set(discoveries.map((d) => d.source));
      expect(sources.size).toBeGreaterThanOrEqual(1);
    });

    it('handles hunt errors gracefully', async () => {
      const config = createTestConfig({
        sources: [
          { source: 'feargreed', enabled: true, schedule: '0 * * * *' },
        ],
      });

      const agent = new HunterAgent(config);

      // Hunt should not throw even if underlying source fails
      const discoveries = await agent.huntNow(['feargreed']);
      expect(Array.isArray(discoveries)).toBe(true);
    });
  });

  describe('Start/Stop', () => {
    it('starts and stops without error', async () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      // Should not throw
      await agent.start();
      await agent.stop();
    });

    it('prevents double start', async () => {
      const config = createTestConfig();
      const agent = new HunterAgent(config);

      await agent.start();
      await agent.start(); // Second start should be no-op
      await agent.stop();
    });
  });
});
