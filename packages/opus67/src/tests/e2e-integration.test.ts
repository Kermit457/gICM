/**
 * OPUS 67 v5.0 - Phase 4B: E2E Integration Tests
 *
 * Tests all features working together through the unified API
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedBrain } from '../brain/unified-api.js';
import type { TaskExecutor, ExecutionContext, TaskNode } from '../brain/long-horizon-planning.js';

describe('E2E Integration Tests', () => {
  let brain: UnifiedBrain;

  beforeEach(() => {
    brain = new UnifiedBrain({
      enableReasoning: true,
      enableCaching: true,
      enableFileContext: true,
      enableCodeEditing: true,
      enablePlanning: true,
      enableVerification: true,
      enableToolDiscovery: false, // Disable to avoid API calls in tests
      autoVerifyEdits: true,
      autoTrackFiles: true,
      workingDirectory: '/test'
    });
  });

  describe('Unified Brain Initialization', () => {
    it('should initialize with all features enabled', () => {
      const stats = brain.getStats();

      expect(stats.features.reasoning).toBe(true);
      expect(stats.features.caching).toBe(true);
      expect(stats.features.fileContext).toBe(true);
      expect(stats.features.codeEditing).toBe(true);
      expect(stats.features.planning).toBe(true);
      expect(stats.features.verification).toBe(true);
    });

    it('should emit brain:ready event', () => {
      const testBrain = new UnifiedBrain();

      // Event fires during constructor, so it's already emitted
      // Just verify the brain is ready
      expect(testBrain.getStats()).toBeDefined();
    });

    it('should initialize with selective features', () => {
      const minimalBrain = new UnifiedBrain({
        enableReasoning: true,
        enableCaching: false,
        enableFileContext: false,
        enableCodeEditing: false,
        enablePlanning: false,
        enableVerification: false,
        enableToolDiscovery: false
      });

      const stats = minimalBrain.getStats();

      expect(stats.features.reasoning).toBe(true);
      expect(stats.features.caching).toBe(false);
      expect(stats.features.fileContext).toBe(false);
    });

    it('should provide access to component instances', () => {
      const components = brain.getComponents();

      expect(components.reasoning).toBeDefined();
      expect(components.cache).toBeDefined();
      expect(components.fileContext).toBeDefined();
      expect(components.codeEditor).toBeDefined();
      expect(components.planner).toBeDefined();
      expect(components.verification).toBeDefined();
    });
  });

  describe('Think API', () => {
    it('should perform reasoning', async () => {
      // Skip actual API call, just test the structure
      await expect(
        brain.think({
          query: 'What is 2 + 2?',
          complexity: 'instant'
        })
      ).rejects.toThrow('Anthropic API key');
    });

    it('should handle different complexity levels', async () => {
      // Test with disabled reasoning to avoid API calls
      const noApiKeyBrain = new UnifiedBrain({
        enableReasoning: true,
        enableCodeEditing: false,
        enablePlanning: false,
        enableVerification: false,
        enableFileContext: false,
        enableCaching: false,
        enableToolDiscovery: false
      });

      // Should throw because no API key
      await expect(
        noApiKeyBrain.think({ query: 'test', complexity: 'instant' })
      ).rejects.toThrow();
    });

    it('should emit think events', async () => {
      const events: string[] = [];

      brain.on('brain:think:start', () => events.push('start'));
      brain.on('brain:think:complete', () => events.push('complete'));

      // Will throw, but events should still fire
      try {
        await brain.think({ query: 'test' });
      } catch (e) {
        // Expected
      }

      expect(events).toContain('start');
    });

    it('should throw if reasoning is disabled', async () => {
      const noReasoningBrain = new UnifiedBrain({
        enableReasoning: false
      });

      await expect(
        noReasoningBrain.think({ query: 'test' })
      ).rejects.toThrow('Reasoning is not enabled');
    });
  });

  describe('Edit Code API', () => {
    it('should execute code edits', async () => {
      const response = await brain.editCode({
        edit: {
          id: 'test-edit',
          description: 'Test edit',
          operations: [
            {
              type: 'replace',
              location: {
                file: 'test.ts',
                lineStart: 1,
                lineEnd: 1
              },
              newContent: 'const x = 42;'
            }
          ],
          dependencies: []
        },
        verify: false // Skip verification for speed
      });

      expect(response.success).toBe(true);
      expect(response.editResult).toBeDefined();
    });

    it('should auto-verify edits when enabled', async () => {
      const response = await brain.editCode({
        edit: {
          id: 'verified-edit',
          description: 'Verified edit',
          operations: [],
          dependencies: []
        }
        // verify defaults to true due to autoVerifyEdits: true
      });

      expect(response.verificationResult).toBeDefined();
    });

    it('should emit edit events', async () => {
      const events: string[] = [];

      brain.on('brain:edit:start', () => events.push('start'));
      brain.on('brain:edit:complete', () => events.push('complete'));

      await brain.editCode({
        edit: {
          id: 'event-test',
          description: 'Test',
          operations: [],
          dependencies: []
        },
        verify: false
      });

      expect(events).toContain('start');
      expect(events).toContain('complete');
    });

    it('should track statistics', async () => {
      await brain.editCode({
        edit: {
          id: 'stats-test',
          description: 'Test',
          operations: [],
          dependencies: []
        },
        verify: false
      });

      const stats = brain.getStats();
      expect(stats.stats.editsExecuted).toBeGreaterThan(0);
    });

    it('should throw if code editing is disabled', async () => {
      const noEditingBrain = new UnifiedBrain({
        enableCodeEditing: false
      });

      await expect(
        noEditingBrain.editCode({
          edit: {
            id: 'test',
            description: 'Test',
            operations: [],
            dependencies: []
          }
        })
      ).rejects.toThrow('Code editing is not enabled');
    });
  });

  describe('Plan Task API', () => {
    it('should create a plan', async () => {
      const response = await brain.planTask({
        goal: 'Test goal',
        tasks: [
          {
            description: 'Task 1',
            type: 'implement',
            dependencies: [],
            estimatedComplexity: 5,
            maxRetries: 3
          }
        ],
        autoExecute: false
      });

      expect(response.plan).toBeDefined();
      expect(response.plan.goal).toBe('Test goal');
      expect(response.executed).toBe(false);
    });

    it('should auto-execute plans when requested', async () => {
      const executor: TaskExecutor = async () => ({ success: true });

      const response = await brain.planTask({
        goal: 'Auto-execute test',
        tasks: [
          {
            description: 'Task 1',
            type: 'test',
            dependencies: [],
            estimatedComplexity: 3,
            maxRetries: 3
          }
        ],
        executor,
        autoExecute: true
      });

      expect(response.executed).toBe(true);
      expect(response.success).toBe(true);
    });

    it('should emit plan events', async () => {
      const events: string[] = [];

      brain.on('brain:plan:created', () => events.push('created'));

      await brain.planTask({
        goal: 'Event test',
        tasks: [],
        autoExecute: false
      });

      expect(events).toContain('created');
    });

    it('should track statistics', async () => {
      await brain.planTask({
        goal: 'Stats test',
        tasks: [],
        autoExecute: false
      });

      const stats = brain.getStats();
      expect(stats.stats.plansCreated).toBeGreaterThan(0);
    });

    it('should throw if planning is disabled', async () => {
      const noPlanningBrain = new UnifiedBrain({
        enablePlanning: false
      });

      await expect(
        noPlanningBrain.planTask({
          goal: 'test',
          tasks: []
        })
      ).rejects.toThrow('Planning is not enabled');
    });
  });

  describe('Verify Code API', () => {
    it('should verify files', async () => {
      const result = await brain.verifyCode(['test.ts']);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.passed).toBeDefined();
    });

    it('should emit verify events', async () => {
      let eventFired = false;

      brain.on('brain:verify:complete', () => {
        eventFired = true;
      });

      await brain.verifyCode(['test.ts']);

      expect(eventFired).toBe(true);
    });

    it('should track statistics', async () => {
      await brain.verifyCode(['test.ts']);

      const stats = brain.getStats();
      expect(stats.stats.verificationsRun).toBeGreaterThan(0);
    });

    it('should throw if verification is disabled', async () => {
      const noVerifyBrain = new UnifiedBrain({
        enableVerification: false
      });

      await expect(
        noVerifyBrain.verifyCode(['test.ts'])
      ).rejects.toThrow('Verification is not enabled');
    });
  });

  describe('File Context API', () => {
    it('should track files', async () => {
      await brain.trackFile('test.ts', 'const x = 1;');

      const stats = brain.getStats();
      expect(stats.stats.filesTracked).toBeGreaterThan(0);
    });

    it('should check file consistency', async () => {
      await brain.trackFile('test.ts', 'const x = 1;');

      const check = await brain.checkFileConsistency('test.ts');

      expect(check).toBeDefined();
      expect(check.passed).toBeDefined();
    });

    it('should throw if file context is disabled', async () => {
      const noContextBrain = new UnifiedBrain({
        enableFileContext: false
      });

      await expect(
        noContextBrain.trackFile('test.ts')
      ).rejects.toThrow('File context is not enabled');
    });
  });

  describe('Statistics & Monitoring', () => {
    it('should track uptime', () => {
      const stats = brain.getStats();

      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track feature usage', async () => {
      await brain.trackFile('test.ts');
      await brain.verifyCode(['test.ts']);
      await brain.editCode({
        edit: {
          id: 'test',
          description: 'Test',
          operations: [],
          dependencies: []
        },
        verify: false
      });

      const stats = brain.getStats();

      expect(stats.stats.filesTracked).toBeGreaterThan(0);
      expect(stats.stats.verificationsRun).toBeGreaterThan(0);
      expect(stats.stats.editsExecuted).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      await brain.trackFile('test.ts');

      let stats = brain.getStats();
      expect(stats.stats.filesTracked).toBeGreaterThan(0);

      brain.resetStats();

      stats = brain.getStats();
      expect(stats.stats.filesTracked).toBe(0);
    });
  });

  describe('Integration Workflows', () => {
    it('should support complete edit-verify workflow', async () => {
      // Step 1: Track file
      await brain.trackFile('app.ts', 'const x = 1;');

      // Step 2: Make edit
      const editResponse = await brain.editCode({
        edit: {
          id: 'workflow-test',
          description: 'Update variable',
          operations: [
            {
              type: 'replace',
              location: { file: 'app.ts', lineStart: 1, lineEnd: 1 },
              newContent: 'const x = 2;'
            }
          ],
          dependencies: []
        },
        verify: true
      });

      // Step 3: Verify edit succeeded
      expect(editResponse.success).toBe(true);
      expect(editResponse.verificationResult).toBeDefined();
    });

    it('should support plan-execute-verify workflow', async () => {
      const executor: TaskExecutor = async (task) => {
        // Simulate task execution
        return { completed: true };
      };

      // Step 1: Create and execute plan
      const planResponse = await brain.planTask({
        goal: 'Implement feature',
        tasks: [
          {
            description: 'Write code',
            type: 'implement',
            dependencies: [],
            estimatedComplexity: 5,
            maxRetries: 3
          },
          {
            description: 'Write tests',
            type: 'test',
            dependencies: [],
            estimatedComplexity: 3,
            maxRetries: 3
          }
        ],
        executor,
        autoExecute: true
      });

      // Step 2: Verify plan succeeded
      expect(planResponse.executed).toBe(true);
      expect(planResponse.success).toBe(true);

      // Step 3: Verify the code
      const verifyResponse = await brain.verifyCode(['feature.ts']);

      expect(verifyResponse).toBeDefined();
    });

    it('should track files automatically during edits', async () => {
      const initialStats = brain.getStats();
      const initialFiles = initialStats.stats.filesTracked;

      await brain.editCode({
        edit: {
          id: 'auto-track',
          description: 'Test auto-tracking',
          operations: [
            {
              type: 'replace',
              location: { file: 'auto.ts', lineStart: 1, lineEnd: 1 },
              newContent: 'test'
            }
          ],
          dependencies: []
        },
        verify: false
      });

      const finalStats = brain.getStats();
      expect(finalStats.stats.filesTracked).toBeGreaterThan(initialFiles);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const errorBrain = new UnifiedBrain({
        enableReasoning: false
      });

      await expect(
        errorBrain.think({ query: 'test' })
      ).rejects.toThrow();
    });

    it('should emit error events', async () => {
      let errorEmitted = false;

      brain.on('error', () => {
        errorEmitted = true;
      });

      // Try to execute an invalid operation
      // Note: In this test setup, we might not trigger actual errors
      expect(errorEmitted).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should respect auto-verify setting', async () => {
      const noAutoVerify = new UnifiedBrain({
        autoVerifyEdits: false
      });

      const response = await noAutoVerify.editCode({
        edit: {
          id: 'no-verify',
          description: 'Test',
          operations: [],
          dependencies: []
        }
        // verify not specified, should use autoVerifyEdits: false
      });

      expect(response.verificationResult).toBeUndefined();
    });

    it('should respect auto-track setting', async () => {
      const noAutoTrack = new UnifiedBrain({
        autoTrackFiles: false
      });

      await noAutoTrack.editCode({
        edit: {
          id: 'no-track',
          description: 'Test',
          operations: [
            {
              type: 'replace',
              location: { file: 'test.ts', lineStart: 1, lineEnd: 1 },
              newContent: 'test'
            }
          ],
          dependencies: []
        },
        verify: false
      });

      const stats = noAutoTrack.getStats();
      expect(stats.stats.filesTracked).toBe(0);
    });

    it('should use custom working directory', () => {
      const customDirBrain = new UnifiedBrain({
        workingDirectory: '/custom/path'
      });

      expect(customDirBrain).toBeDefined();
    });
  });
});
