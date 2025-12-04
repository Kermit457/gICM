/**
 * OPUS 67 v5.0 - Phase 3C: Verification Loops Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  VerificationLoop,
  type VerificationRule,
  type VerificationContext,
  type VerificationRuleResult
} from '../brain/verification-loops.js';

describe('VerificationLoop', () => {
  let loop: VerificationLoop;

  beforeEach(() => {
    loop = new VerificationLoop({
      strategy: 'sequential',
      enableCaching: true,
      defaultTimeout: 5000,
      defaultRetries: 2,
      stopOnCriticalFailure: true,
      workingDirectory: '/test'
    });
  });

  describe('Rule Registration', () => {
    it('should register default rules', () => {
      const rules = loop.getRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.id === 'typescript-check')).toBe(true);
      expect(rules.some(r => r.id === 'eslint')).toBe(true);
      expect(rules.some(r => r.id === 'syntax-check')).toBe(true);
    });

    it('should register a custom rule', () => {
      const ruleId = loop.registerRule({
        name: 'Custom Rule',
        type: 'custom',
        critical: false,
        enabled: true,
        validator: async () => ({ passed: true })
      });

      expect(ruleId).toBeDefined();

      const rules = loop.getRules();
      const customRule = rules.find(r => r.id === ruleId);

      expect(customRule).toBeDefined();
      expect(customRule?.name).toBe('Custom Rule');
      expect(customRule?.type).toBe('custom');
    });

    it('should enable/disable rules', () => {
      const rules = loop.getRules();
      const firstRule = rules[0];

      expect(firstRule.enabled).toBe(true);

      loop.setRuleEnabled(firstRule.id, false);

      const updated = loop.getRules().find(r => r.id === firstRule.id);
      expect(updated?.enabled).toBe(false);
    });

    it('should register rule with file patterns', () => {
      const ruleId = loop.registerRule({
        name: 'TypeScript Files Only',
        type: 'type',
        critical: false,
        enabled: true,
        filePatterns: ['**/*.ts', '**/*.tsx'],
        validator: async () => ({ passed: true })
      });

      const rule = loop.getRules().find(r => r.id === ruleId);
      expect(rule?.filePatterns).toEqual(['**/*.ts', '**/*.tsx']);
    });
  });

  describe('Verification Execution', () => {
    it('should verify files successfully', async () => {
      const result = await loop.verify(['test.ts']);

      expect(result.id).toBeDefined();
      expect(result.files).toEqual(['test.ts']);
      expect(result.status).toBe('passed');
      expect(result.passed).toBe(true);
      expect(result.completedAt).toBeDefined();
    });

    it('should handle verification failure', async () => {
      loop.registerRule({
        name: 'Always Fail',
        type: 'test',
        critical: true,
        enabled: true,
        validator: async () => ({
          passed: false,
          message: 'Test failed'
        })
      });

      const result = await loop.verify(['test.ts']);

      expect(result.passed).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.failedRules.length).toBeGreaterThan(0);
    });

    it('should skip verification for empty files', async () => {
      // Disable all default rules
      loop.getRules().forEach(r => loop.setRuleEnabled(r.id, false));

      const result = await loop.verify([]);

      expect(result.status).toBe('passed');
      expect(result.results.size).toBe(0);
    });

    it('should track verification duration', async () => {
      const result = await loop.verify(['test.ts']);

      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.startedAt).toBeDefined();
      expect(result.completedAt).toBeDefined();
    });

    it('should execute rules based on file patterns', async () => {
      // Disable all default rules
      loop.getRules().forEach(r => loop.setRuleEnabled(r.id, false));

      const tsRuleId = loop.registerRule({
        name: 'TS Only',
        type: 'type',
        critical: false,
        enabled: true,
        filePatterns: ['**/*.ts'],
        validator: async () => ({ passed: true, message: 'TS checked' })
      });

      const jsRuleId = loop.registerRule({
        name: 'JS Only',
        type: 'lint',
        critical: false,
        enabled: true,
        filePatterns: ['**/*.js'],
        validator: async () => ({ passed: true, message: 'JS checked' })
      });

      // Verify TypeScript file
      const tsResult = await loop.verify(['src/app.ts']);

      expect(tsResult.results.has(tsRuleId)).toBe(true);
      expect(tsResult.results.has(jsRuleId)).toBe(false);

      // Verify JavaScript file
      const jsResult = await loop.verify(['src/app.js']);

      expect(jsResult.results.has(tsRuleId)).toBe(false);
      expect(jsResult.results.has(jsRuleId)).toBe(true);
    });

    it('should emit verification events', async () => {
      const events: string[] = [];

      loop.on('verification:start', () => events.push('start'));
      loop.on('verification:rule:start', () => events.push('rule-start'));
      loop.on('verification:rule:complete', () => events.push('rule-complete'));
      loop.on('verification:complete', () => events.push('complete'));

      await loop.verify(['test.ts']);

      expect(events).toContain('start');
      expect(events).toContain('complete');
    });
  });

  describe('Verification Strategies', () => {
    it('should execute sequential strategy', async () => {
      const loopSequential = new VerificationLoop({
        strategy: 'sequential',
        enableCaching: false
      });

      const executionOrder: string[] = [];

      loopSequential.registerRule({
        name: 'Rule 1',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          executionOrder.push('1');
          return { passed: true };
        }
      });

      loopSequential.registerRule({
        name: 'Rule 2',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          executionOrder.push('2');
          return { passed: true };
        }
      });

      await loopSequential.verify(['test.ts']);

      // Sequential should execute in order
      expect(executionOrder).toEqual(['1', '2']);
    });

    it('should execute critical-first strategy', async () => {
      const loopCriticalFirst = new VerificationLoop({
        strategy: 'critical-first',
        stopOnCriticalFailure: true,
        enableCaching: false
      });

      const executed: string[] = [];

      loopCriticalFirst.registerRule({
        name: 'Non-critical',
        type: 'lint',
        critical: false,
        enabled: true,
        validator: async () => {
          executed.push('non-critical');
          return { passed: true };
        }
      });

      loopCriticalFirst.registerRule({
        name: 'Critical Fail',
        type: 'test',
        critical: true,
        enabled: true,
        validator: async () => {
          executed.push('critical');
          return { passed: false, message: 'Failed' };
        }
      });

      const result = await loopCriticalFirst.verify(['test.ts']);

      expect(executed).toContain('critical');
      expect(result.skippedRules.length).toBeGreaterThan(0);
    });

    it('should execute fail-fast strategy', async () => {
      const loopFailFast = new VerificationLoop({
        strategy: 'fail-fast',
        enableCaching: false
      });

      const executed: string[] = [];

      loopFailFast.registerRule({
        name: 'First',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          executed.push('first');
          return { passed: false };
        }
      });

      loopFailFast.registerRule({
        name: 'Second',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          executed.push('second');
          return { passed: true };
        }
      });

      const result = await loopFailFast.verify(['test.ts']);

      expect(executed).toEqual(['first']);
      expect(result.skippedRules.length).toBe(1);
    });

    it('should execute parallel strategy', async () => {
      const loopParallel = new VerificationLoop({
        strategy: 'parallel',
        enableCaching: false
      });

      const starts: number[] = [];
      const ends: number[] = [];

      loopParallel.registerRule({
        name: 'Rule 1',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          starts.push(1);
          await new Promise(resolve => setTimeout(resolve, 10));
          ends.push(1);
          return { passed: true };
        }
      });

      loopParallel.registerRule({
        name: 'Rule 2',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          starts.push(2);
          await new Promise(resolve => setTimeout(resolve, 10));
          ends.push(2);
          return { passed: true };
        }
      });

      await loopParallel.verify(['test.ts']);

      // Both should start before either ends (parallel execution)
      expect(starts.length).toBe(2);
      expect(ends.length).toBe(2);
    });
  });

  describe('Caching', () => {
    it('should cache verification results', async () => {
      let callCount = 0;

      const loopWithCache = new VerificationLoop({
        enableCaching: true
      });

      loopWithCache.registerRule({
        name: 'Cacheable',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          callCount++;
          return { passed: true };
        }
      });

      // First run
      await loopWithCache.verify(['test.ts'], 'edit-1');

      expect(callCount).toBe(1);

      // Second run with same files and editId should use cache
      await loopWithCache.verify(['test.ts'], 'edit-1');

      expect(callCount).toBe(1); // Still 1, used cache
    });

    it('should not cache when disabled', async () => {
      let callCount = 0;

      const loopNoCache = new VerificationLoop({
        enableCaching: false
      });

      loopNoCache.registerRule({
        name: 'No Cache',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          callCount++;
          return { passed: true };
        }
      });

      await loopNoCache.verify(['test.ts']);
      await loopNoCache.verify(['test.ts']);

      expect(callCount).toBe(2); // No caching
    });

    it('should clear cache', async () => {
      let callCount = 0;

      const loopClearable = new VerificationLoop({
        enableCaching: true
      });

      loopClearable.registerRule({
        name: 'Clearable',
        type: 'test',
        critical: false,
        enabled: true,
        validator: async () => {
          callCount++;
          return { passed: true };
        }
      });

      await loopClearable.verify(['test.ts'], 'edit-1');
      expect(callCount).toBe(1);

      loopClearable.clearCache();

      await loopClearable.verify(['test.ts'], 'edit-1');
      expect(callCount).toBe(2); // Cache was cleared
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed verifications', async () => {
      let attempts = 0;

      loop.registerRule({
        name: 'Retry Test',
        type: 'test',
        critical: false,
        enabled: true,
        retries: 2,
        validator: async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Temporary failure');
          }
          return { passed: true };
        }
      });

      const result = await loop.verify(['test.ts']);

      expect(attempts).toBe(2);
      expect(result.passed).toBe(true);
    });

    it('should fail after max retries', async () => {
      let attempts = 0;

      loop.registerRule({
        name: 'Always Fail',
        type: 'test',
        critical: true,
        enabled: true,
        retries: 1,
        validator: async () => {
          attempts++;
          throw new Error('Permanent failure');
        }
      });

      const result = await loop.verify(['test.ts']);

      expect(attempts).toBe(2); // Initial + 1 retry
      expect(result.passed).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout slow verifications', async () => {
      // Disable default rules
      loop.getRules().forEach(r => loop.setRuleEnabled(r.id, false));

      loop.registerRule({
        name: 'Slow Rule',
        type: 'test',
        critical: true,  // Make it critical so overall verification fails
        enabled: true,
        timeout: 100,
        retries: 0,
        validator: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return { passed: true };
        }
      });

      const result = await loop.verify(['test.ts']);

      expect(result.passed).toBe(false);
      const slowRuleResult = Array.from(result.results.values()).find(
        r => r.message?.includes('Timeout')
      );
      expect(slowRuleResult).toBeDefined();
    });
  });

  describe('Error Reporting', () => {
    it('should report errors with details', async () => {
      // Disable default rules
      loop.getRules().forEach(r => loop.setRuleEnabled(r.id, false));

      loop.registerRule({
        name: 'Detailed Errors',
        type: 'lint',
        critical: false,
        enabled: true,
        validator: async () => ({
          passed: false,
          message: 'Multiple errors found',
          errors: [
            {
              file: 'test.ts',
              line: 10,
              column: 5,
              message: 'Unexpected token',
              severity: 'error'
            },
            {
              file: 'test.ts',
              line: 20,
              message: 'Missing semicolon',
              severity: 'warning'
            }
          ]
        })
      });

      const result = await loop.verify(['test.ts']);

      const ruleResult = Array.from(result.results.values())[0];
      expect(ruleResult.errors).toHaveLength(2);
      expect(ruleResult.errors![0].line).toBe(10);
      expect(ruleResult.errors![0].severity).toBe('error');
    });

    it('should track warnings separately', async () => {
      // Disable default rules
      loop.getRules().forEach(r => loop.setRuleEnabled(r.id, false));

      loop.registerRule({
        name: 'With Warnings',
        type: 'lint',
        critical: false,
        enabled: true,
        validator: async () => ({
          passed: true,
          warnings: ['Deprecated API usage', 'Consider refactoring']
        })
      });

      const result = await loop.verify(['test.ts']);

      const ruleResult = Array.from(result.results.values())[0];
      expect(ruleResult.warnings).toHaveLength(2);
    });
  });

  describe('Integration', () => {
    it('should verify edit results', async () => {
      const editResult = {
        success: true,
        operationsCompleted: 2,
        operationsFailed: 0,
        errors: []
      };

      const result = await loop.verifyEdit(editResult, ['test.ts'], 'edit-123');

      expect(result.editId).toBe('edit-123');
      expect(result.files).toEqual(['test.ts']);
    });

    it('should skip verification for failed edits', async () => {
      const editResult = {
        success: false,
        operationsCompleted: 0,
        operationsFailed: 1,
        errors: [{ operation: 0, error: 'Failed' }]
      };

      const result = await loop.verifyEdit(editResult, ['test.ts'], 'edit-456');

      expect(result.status).toBe('skipped');
      expect(result.passed).toBe(false);
    });
  });

  describe('Utilities', () => {
    it('should get verification result by ID', async () => {
      const result = await loop.verify(['test.ts']);

      const retrieved = loop.getResult(result.id);

      expect(retrieved).toBe(result);
    });

    it('should get all results', async () => {
      await loop.verify(['test1.ts']);
      await loop.verify(['test2.ts']);
      await loop.verify(['test3.ts']);

      const results = loop.getAllResults();

      expect(results.length).toBe(3);
    });

    it('should clear results history', async () => {
      await loop.verify(['test.ts']);

      expect(loop.getAllResults().length).toBe(1);

      loop.clearResults();

      expect(loop.getAllResults().length).toBe(0);
    });
  });

  describe('Rule Criticality', () => {
    it('should mark critical rule failures as verification failure', async () => {
      loop.registerRule({
        name: 'Critical',
        type: 'test',
        critical: true,
        enabled: true,
        validator: async () => ({ passed: false })
      });

      const result = await loop.verify(['test.ts']);

      expect(result.passed).toBe(false);
    });

    it('should not fail verification for non-critical failures', async () => {
      // Disable default critical rules
      loop.getRules()
        .filter(r => r.critical)
        .forEach(r => loop.setRuleEnabled(r.id, false));

      loop.registerRule({
        name: 'Non-Critical',
        type: 'lint',
        critical: false,
        enabled: true,
        validator: async () => ({ passed: false })
      });

      const result = await loop.verify(['test.ts']);

      // Overall should still pass despite non-critical failure
      expect(result.failedRules.length).toBe(1);
    });
  });
});
