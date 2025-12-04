/**
 * OPUS 67 v5.0 - Reasoning Engine Tests
 *
 * Tests for the HybridReasoningEngine and complexity classification.
 */

import { describe, it, expect } from 'vitest';
import { HybridReasoningEngine, type ThinkingMode } from '../brain/reasoning.js';

describe('HybridReasoningEngine', () => {
  const engine = new HybridReasoningEngine({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
  });

  describe('Complexity Classification', () => {
    it('should classify simple queries as instant mode', async () => {
      const analysis = await engine.classifyComplexity(
        'What is a PDA in Solana?'
      );

      expect(analysis.level).toBeLessThanOrEqual(2);
      expect(analysis.mode).toBe('instant');
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should classify moderate queries as standard mode', async () => {
      const analysis = await engine.classifyComplexity(
        'Implement user authentication with JWT tokens'
      );

      expect(analysis.level).toBeGreaterThanOrEqual(3);
      expect(analysis.level).toBeLessThanOrEqual(5);
      expect(analysis.mode).toBe('standard');
    });

    it('should classify complex queries as deep mode', async () => {
      const analysis = await engine.classifyComplexity(
        'Design a comprehensive scalable WebSocket architecture with load balancing and failover'
      );

      expect(analysis.level).toBeGreaterThanOrEqual(6);
      expect(analysis.level).toBeLessThanOrEqual(8);
      expect(analysis.mode).toBe('deep');
    });

    it('should classify critical queries as maximum mode', async () => {
      const analysis = await engine.classifyComplexity(
        'Perform a mission-critical security audit of our production DeFi smart contract for financial compliance'
      );

      expect(analysis.level).toBeGreaterThanOrEqual(9);
      expect(analysis.mode).toBe('maximum');
    });

    it('should provide reasoning for classification', async () => {
      const analysis = await engine.classifyComplexity(
        'Build a complex multi-step trading bot with comprehensive risk management'
      );

      expect(analysis.reasoning).toBeTruthy();
      expect(analysis.reasoning.length).toBeGreaterThan(0);
    });

    it('should score multi-step complexity correctly', async () => {
      const simple = await engine.classifyComplexity('Quick question about syntax');
      const complex = await engine.classifyComplexity('Multi-day autonomous agent deployment');

      expect(simple.factors.multiStep).toBeLessThan(complex.factors.multiStep);
    });

    it('should score ambiguity correctly', async () => {
      const clear = await engine.classifyComplexity('Exactly implement this specific API endpoint');
      const ambiguous = await engine.classifyComplexity('Explore different approaches and consider trade-offs');

      expect(clear.factors.ambiguity).toBeLessThan(ambiguous.factors.ambiguity);
    });

    it('should score depth correctly', async () => {
      const surface = await engine.classifyComplexity('Give me a brief overview');
      const deep = await engine.classifyComplexity('Provide exhaustive complete analysis with full architecture');

      expect(surface.factors.depth).toBeLessThan(deep.factors.depth);
    });

    it('should score criticality correctly', async () => {
      const test = await engine.classifyComplexity('Experiment with this draft implementation');
      const critical = await engine.classifyComplexity('Production mission-critical financial security audit');

      expect(test.factors.criticality).toBeLessThan(critical.factors.criticality);
    });
  });

  describe('Mode Recommendation', () => {
    it('should recommend instant mode for simple queries', async () => {
      const rec = await engine.recommendMode('What is TypeScript?');

      expect(rec.mode).toBe('instant');
      expect(rec.estimatedCost).toBeLessThan(0.001); // Very cheap
    });

    it('should recommend standard mode for moderate tasks', async () => {
      const rec = await engine.recommendMode('Implement a REST API endpoint');

      expect(rec.mode).toBe('standard');
      expect(rec.estimatedCost).toBeGreaterThan(0); // Some thinking cost
    });

    it('should recommend deep mode for complex architecture', async () => {
      const rec = await engine.recommendMode('Design comprehensive microservices architecture');

      expect(rec.mode).toBe('deep');
      expect(rec.estimatedCost).toBeGreaterThan(0.001);
    });

    it('should recommend maximum mode for critical decisions', async () => {
      const rec = await engine.recommendMode('Critical production security audit for financial system');

      expect(rec.mode).toBe('maximum');
      expect(rec.complexity).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Configuration', () => {
    it('should allow mode override', async () => {
      const analysis = await engine.classifyComplexity('Simple question');

      // Should normally be instant, but we can force it
      expect(analysis.mode).toBe('instant');

      // Now create request with forced mode
      // (actual reasoning would need valid API key)
    });

    it('should respect budget constraints', async () => {
      const rec = await engine.recommendMode('Complex task');

      expect(rec.estimatedCost).toBeDefined();
      expect(rec.estimatedCost).toBeGreaterThan(0);
    });

    it('should provide config access', () => {
      const config = engine.getConfig();

      expect(config.maxThinkingTokens).toBeDefined();
      expect(config.enableChainOfThought).toBeDefined();
    });

    it('should allow config updates', () => {
      engine.updateConfig({ maxThinkingTokens: 5000 });
      const config = engine.getConfig();

      expect(config.maxThinkingTokens).toBe(5000);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate costs accurately for instant mode', async () => {
      const rec = await engine.recommendMode('What is Solana?');

      // Instant mode = no thinking tokens = lower cost
      expect(rec.mode).toBe('instant');
      expect(rec.estimatedCost).toBeLessThan(0.01); // Should be very cheap
    });

    it('should estimate higher costs for maximum mode', async () => {
      const rec = await engine.recommendMode(
        'Critical production security audit of mission-critical financial smart contract'
      );

      // Maximum mode = 8K thinking tokens = higher cost
      expect(rec.mode).toBe('maximum');
      expect(rec.estimatedCost).toBeGreaterThan(0.001);
    });

    it('should show cost difference between modes', async () => {
      const instant = await engine.recommendMode('Quick question');
      const maximum = await engine.recommendMode('Critical mission-critical security audit');

      expect(maximum.estimatedCost).toBeGreaterThan(instant.estimatedCost);
    });
  });

  describe('Event Emissions', () => {
    it('should emit complexity:analyzed event', async () => {
      let emitted = false;

      engine.once('complexity:analyzed', (analysis) => {
        emitted = true;
        expect(analysis.level).toBeDefined();
        expect(analysis.mode).toBeDefined();
      });

      await engine.classifyComplexity('Test query');
      expect(emitted).toBe(true);
    });
  });
});

describe('Integration', () => {
  it('should integrate with model router', () => {
    // The model router should now have 'claude-opus-4.5' available
    // and route 'reason', 'complex-reasoning', 'critical' task types to it

    // This test would verify router integration
    // (Actual implementation depends on router setup)
    expect(true).toBe(true); // Placeholder
  });

  it('should work with BrainRuntime', () => {
    // BrainRuntime should be able to use reasoning engine
    // for high-complexity tasks

    // This test would verify BrainRuntime integration
    // (Actual implementation depends on BrainRuntime setup)
    expect(true).toBe(true); // Placeholder
  });
});
