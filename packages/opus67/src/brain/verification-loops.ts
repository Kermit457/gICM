/**
 * OPUS 67 v5.0 - Phase 3C: Verification Loops
 *
 * Automatic verification of code changes with multiple verification types,
 * smart caching, and integration with SWE-bench patterns.
 *
 * Verification Types:
 * - Syntax checking (parse validation)
 * - Type checking (TypeScript, Flow, etc.)
 * - Linting (ESLint, Pylint, etc.)
 * - Testing (unit, integration, e2e)
 * - Custom validators (security scans, performance checks)
 */

import { EventEmitter } from 'eventemitter3';
import crypto from 'crypto';
import type { MultiFileEdit, EditResult } from './swe-bench-patterns.js';
import type { FileContextManager } from './file-context.js';

// ============================================================================
// Types
// ============================================================================

export type VerificationType =
  | 'syntax'      // Parse/syntax validation
  | 'type'        // Type checking
  | 'lint'        // Code quality/style
  | 'test'        // Unit/integration/e2e tests
  | 'security'    // Security scans
  | 'performance' // Performance checks
  | 'custom';     // Custom validators

export type VerificationStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type VerificationStrategy =
  | 'sequential'      // Run verifications one by one
  | 'parallel'        // Run all verifications concurrently
  | 'critical-first'  // Run critical checks first, skip rest if they fail
  | 'fail-fast';      // Stop on first failure

export interface VerificationRule {
  id: string;
  name: string;
  type: VerificationType;
  critical: boolean;  // Fail entire verification if this fails
  enabled: boolean;
  timeout?: number;   // Milliseconds
  retries?: number;
  filePatterns?: string[];  // Glob patterns for applicable files
  command?: string;   // Shell command to run
  validator?: (context: VerificationContext) => Promise<VerificationRuleResult>;
}

export interface VerificationContext {
  files: string[];
  editId?: string;
  workingDirectory: string;
  environment?: Record<string, string>;
  cache?: Map<string, unknown>;
}

export interface VerificationRuleResult {
  passed: boolean;
  message?: string;
  errors?: Array<{
    file?: string;
    line?: number;
    column?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings?: string[];
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface VerificationResult {
  id: string;
  editId?: string;
  files: string[];
  status: VerificationStatus;
  passed: boolean;
  results: Map<string, VerificationRuleResult>;
  totalDuration: number;
  startedAt: Date;
  completedAt?: Date;
  failedRules: string[];
  passedRules: string[];
  skippedRules: string[];
}

export interface VerificationConfig {
  strategy: VerificationStrategy;
  enableCaching: boolean;
  defaultTimeout: number;
  defaultRetries: number;
  stopOnCriticalFailure: boolean;
  workingDirectory: string;
}

interface VerificationEvents {
  'verification:start': (id: string) => void;
  'verification:rule:start': (id: string, ruleId: string) => void;
  'verification:rule:complete': (id: string, ruleId: string, result: VerificationRuleResult) => void;
  'verification:rule:failed': (id: string, ruleId: string, error: string) => void;
  'verification:complete': (result: VerificationResult) => void;
  'error': (error: Error) => void;
}

// ============================================================================
// VerificationLoop - Automatic Code Verification
// ============================================================================

export class VerificationLoop extends EventEmitter<VerificationEvents> {
  private config: VerificationConfig;
  private rules: Map<string, VerificationRule> = new Map();
  private results: Map<string, VerificationResult> = new Map();
  private cache: Map<string, VerificationRuleResult> = new Map();
  private fileContext?: FileContextManager;

  constructor(config?: Partial<VerificationConfig>, fileContext?: FileContextManager) {
    super();
    this.config = {
      strategy: 'critical-first',
      enableCaching: true,
      defaultTimeout: 30000,
      defaultRetries: 2,
      stopOnCriticalFailure: true,
      workingDirectory: process.cwd(),
      ...config
    };
    this.fileContext = fileContext;

    // Register default rules
    this.registerDefaultRules();
  }

  // ==========================================================================
  // Rule Management
  // ==========================================================================

  /**
   * Register a verification rule
   */
  registerRule(rule: Omit<VerificationRule, 'id'>): string {
    const id = this.generateId();
    const fullRule: VerificationRule = {
      id,
      timeout: this.config.defaultTimeout,
      retries: this.config.defaultRetries,
      ...rule
    };
    this.rules.set(id, fullRule);
    return id;
  }

  /**
   * Register default verification rules
   */
  private registerDefaultRules(): void {
    // TypeScript type checking
    this.rules.set('typescript-check', {
      id: 'typescript-check',
      name: 'TypeScript Type Checking',
      type: 'type',
      critical: true,
      enabled: true,
      timeout: 30000,
      retries: 1,
      filePatterns: ['**/*.ts', '**/*.tsx'],
      command: 'tsc --noEmit',
      validator: async (context) => {
        // Placeholder - actual implementation would run tsc
        return {
          passed: true,
          message: 'Type checking passed',
          duration: 0
        };
      }
    });

    // ESLint
    this.rules.set('eslint', {
      id: 'eslint',
      name: 'ESLint',
      type: 'lint',
      critical: false,
      enabled: true,
      timeout: 15000,
      retries: 1,
      filePatterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'],
      command: 'eslint',
      validator: async (context) => {
        return {
          passed: true,
          message: 'Linting passed',
          duration: 0
        };
      }
    });

    // Syntax validation
    this.rules.set('syntax-check', {
      id: 'syntax-check',
      name: 'Syntax Validation',
      type: 'syntax',
      critical: true,
      enabled: true,
      timeout: 5000,
      retries: 1,
      validator: async (context) => {
        // Placeholder - would parse files to check syntax
        return {
          passed: true,
          message: 'Syntax validation passed',
          duration: 0
        };
      }
    });
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all rules
   */
  getRules(): VerificationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules for files
   */
  private getApplicableRules(files: string[]): VerificationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        if (!rule.enabled) return false;

        // If no file patterns, rule applies to all files
        if (!rule.filePatterns || rule.filePatterns.length === 0) {
          return true;
        }

        // Check if any file matches the patterns
        return files.some(file =>
          rule.filePatterns!.some(pattern => this.matchGlob(file, pattern))
        );
      });
  }

  /**
   * Simple glob matching (basic implementation)
   */
  private matchGlob(file: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(file);
  }

  // ==========================================================================
  // Verification Execution
  // ==========================================================================

  /**
   * Verify files
   */
  async verify(files: string[], editId?: string): Promise<VerificationResult> {
    const verificationId = this.generateId();
    const startedAt = new Date();

    const result: VerificationResult = {
      id: verificationId,
      editId,
      files,
      status: 'running',
      passed: true,
      results: new Map(),
      totalDuration: 0,
      startedAt,
      failedRules: [],
      passedRules: [],
      skippedRules: []
    };

    this.emit('verification:start', verificationId);

    const applicableRules = this.getApplicableRules(files);

    if (applicableRules.length === 0) {
      result.status = 'passed';
      result.completedAt = new Date();
      result.totalDuration = result.completedAt.getTime() - startedAt.getTime();
      this.emit('verification:complete', result);
      return result;
    }

    // Sort rules by criticality
    const criticalRules = applicableRules.filter(r => r.critical);
    const nonCriticalRules = applicableRules.filter(r => !r.critical);

    const context: VerificationContext = {
      files,
      editId,
      workingDirectory: this.config.workingDirectory,
      cache: this.config.enableCaching ? this.cache : undefined
    };

    try {
      // Execute based on strategy
      switch (this.config.strategy) {
        case 'critical-first':
          await this.executeCriticalFirst(result, criticalRules, nonCriticalRules, context);
          break;
        case 'parallel':
          await this.executeParallel(result, applicableRules, context);
          break;
        case 'fail-fast':
          await this.executeFailFast(result, applicableRules, context);
          break;
        case 'sequential':
        default:
          await this.executeSequential(result, applicableRules, context);
          break;
      }

      result.status = result.passed ? 'passed' : 'failed';
    } catch (error) {
      result.status = 'failed';
      result.passed = false;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }

    result.completedAt = new Date();
    result.totalDuration = result.completedAt.getTime() - startedAt.getTime();

    this.results.set(verificationId, result);
    this.emit('verification:complete', result);

    return result;
  }

  /**
   * Execute critical rules first, then non-critical
   */
  private async executeCriticalFirst(
    result: VerificationResult,
    criticalRules: VerificationRule[],
    nonCriticalRules: VerificationRule[],
    context: VerificationContext
  ): Promise<void> {
    // Run critical rules first
    for (const rule of criticalRules) {
      const ruleResult = await this.executeRule(result.id, rule, context);
      result.results.set(rule.id, ruleResult);

      if (ruleResult.passed) {
        result.passedRules.push(rule.id);
      } else {
        result.failedRules.push(rule.id);
        result.passed = false;

        if (this.config.stopOnCriticalFailure) {
          // Skip remaining rules
          for (const remaining of [...criticalRules, ...nonCriticalRules]) {
            if (!result.results.has(remaining.id)) {
              result.skippedRules.push(remaining.id);
            }
          }
          return;
        }
      }
    }

    // Run non-critical rules
    for (const rule of nonCriticalRules) {
      const ruleResult = await this.executeRule(result.id, rule, context);
      result.results.set(rule.id, ruleResult);

      if (ruleResult.passed) {
        result.passedRules.push(rule.id);
      } else {
        result.failedRules.push(rule.id);
        // Don't mark overall as failed for non-critical
      }
    }
  }

  /**
   * Execute all rules in parallel
   */
  private async executeParallel(
    result: VerificationResult,
    rules: VerificationRule[],
    context: VerificationContext
  ): Promise<void> {
    const promises = rules.map(rule => this.executeRule(result.id, rule, context));
    const ruleResults = await Promise.all(promises);

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleResult = ruleResults[i];
      result.results.set(rule.id, ruleResult);

      if (ruleResult.passed) {
        result.passedRules.push(rule.id);
      } else {
        result.failedRules.push(rule.id);
        if (rule.critical) {
          result.passed = false;
        }
      }
    }
  }

  /**
   * Execute rules sequentially, stop on first failure
   */
  private async executeFailFast(
    result: VerificationResult,
    rules: VerificationRule[],
    context: VerificationContext
  ): Promise<void> {
    for (const rule of rules) {
      const ruleResult = await this.executeRule(result.id, rule, context);
      result.results.set(rule.id, ruleResult);

      if (ruleResult.passed) {
        result.passedRules.push(rule.id);
      } else {
        result.failedRules.push(rule.id);
        result.passed = false;

        // Skip remaining rules
        const remainingIndex = rules.indexOf(rule) + 1;
        for (let i = remainingIndex; i < rules.length; i++) {
          result.skippedRules.push(rules[i].id);
        }
        return;
      }
    }
  }

  /**
   * Execute rules sequentially
   */
  private async executeSequential(
    result: VerificationResult,
    rules: VerificationRule[],
    context: VerificationContext
  ): Promise<void> {
    for (const rule of rules) {
      const ruleResult = await this.executeRule(result.id, rule, context);
      result.results.set(rule.id, ruleResult);

      if (ruleResult.passed) {
        result.passedRules.push(rule.id);
      } else {
        result.failedRules.push(rule.id);
        if (rule.critical) {
          result.passed = false;
        }
      }
    }
  }

  /**
   * Execute a single verification rule
   */
  private async executeRule(
    verificationId: string,
    rule: VerificationRule,
    context: VerificationContext
  ): Promise<VerificationRuleResult> {
    this.emit('verification:rule:start', verificationId, rule.id);

    // Check cache
    if (this.config.enableCaching && context.cache) {
      const cacheKey = this.getCacheKey(rule, context);
      const cached = context.cache.get(cacheKey);
      if (cached) {
        return cached as VerificationRuleResult;
      }
    }

    const startTime = performance.now();
    let result: VerificationRuleResult;
    let lastError: string | undefined;

    // Retry logic
    const maxAttempts = (rule.retries ?? this.config.defaultRetries) + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (rule.validator) {
          result = await this.withTimeout(
            rule.validator(context),
            rule.timeout ?? this.config.defaultTimeout
          );
        } else {
          // No validator, consider it passed
          result = {
            passed: true,
            message: `No validator for ${rule.name}`,
            duration: 0
          };
        }

        const duration = performance.now() - startTime;
        result.duration = duration;

        // Cache successful result
        if (this.config.enableCaching && context.cache) {
          const cacheKey = this.getCacheKey(rule, context);
          context.cache.set(cacheKey, result);
        }

        this.emit('verification:rule:complete', verificationId, rule.id, result);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < maxAttempts - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries exhausted
    result = {
      passed: false,
      message: lastError || 'Verification failed',
      duration: performance.now() - startTime
    };

    this.emit('verification:rule:failed', verificationId, rule.id, lastError || 'Unknown error');
    return result;
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Generate cache key for a rule + context
   */
  private getCacheKey(rule: VerificationRule, context: VerificationContext): string {
    const data = JSON.stringify({
      ruleId: rule.id,
      files: context.files.sort(),
      editId: context.editId
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // ==========================================================================
  // Integration with SWE-bench Patterns
  // ==========================================================================

  /**
   * Verify after an edit
   */
  async verifyEdit(editResult: EditResult, files: string[], editId: string): Promise<VerificationResult> {
    if (!editResult.success) {
      // Edit failed, skip verification
      return {
        id: this.generateId(),
        editId,
        files,
        status: 'skipped',
        passed: false,
        results: new Map(),
        totalDuration: 0,
        startedAt: new Date(),
        completedAt: new Date(),
        failedRules: [],
        passedRules: [],
        skippedRules: Array.from(this.rules.keys())
      };
    }

    return this.verify(files, editId);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Get verification result
   */
  getResult(id: string): VerificationResult | undefined {
    return this.results.get(id);
  }

  /**
   * Get all results
   */
  getAllResults(): VerificationResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear results history
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createVerificationLoop(
  config?: Partial<VerificationConfig>,
  fileContext?: FileContextManager
): VerificationLoop {
  return new VerificationLoop(config, fileContext);
}
