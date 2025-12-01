/**
 * Core Types for Commit Agent
 *
 * Zod schemas + TypeScript types for git operations, commit messages, and results
 */

import { z } from "zod";

// ============================================================================
// FILE CHANGE TYPES
// ============================================================================

export const FileChangeTypeSchema = z.enum([
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
]);
export type FileChangeType = z.infer<typeof FileChangeTypeSchema>;

export const FileChangeSchema = z.object({
  path: z.string(),
  type: FileChangeTypeSchema,
  linesAdded: z.number().default(0),
  linesRemoved: z.number().default(0),
  binary: z.boolean().default(false),
  oldPath: z.string().optional(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

export const DiffSummarySchema = z.object({
  files: z.array(FileChangeSchema),
  totalLinesAdded: z.number(),
  totalLinesRemoved: z.number(),
  totalFilesChanged: z.number(),
  diffContent: z.string(),
  staged: z.boolean(),
});
export type DiffSummary = z.infer<typeof DiffSummarySchema>;

// ============================================================================
// GIT STATUS
// ============================================================================

export const GitStatusSchema = z.object({
  branch: z.string(),
  ahead: z.number().default(0),
  behind: z.number().default(0),
  staged: z.array(FileChangeSchema),
  unstaged: z.array(FileChangeSchema),
  untracked: z.array(z.string()),
  isClean: z.boolean(),
  hasRemote: z.boolean(),
});
export type GitStatus = z.infer<typeof GitStatusSchema>;

// ============================================================================
// CONVENTIONAL COMMIT TYPES
// ============================================================================

export const ConventionalTypeSchema = z.enum([
  "feat", // New feature
  "fix", // Bug fix
  "docs", // Documentation only
  "style", // Code style (formatting, semicolons)
  "refactor", // Code change that neither fixes nor adds
  "perf", // Performance improvement
  "test", // Adding or correcting tests
  "build", // Build system or dependencies
  "ci", // CI configuration
  "chore", // Other changes (maintenance)
  "revert", // Revert a previous commit
]);
export type ConventionalType = z.infer<typeof ConventionalTypeSchema>;

export const CommitMessageSchema = z.object({
  type: ConventionalTypeSchema,
  scope: z.string().optional(),
  subject: z.string().min(1).max(72),
  body: z.string().optional(),
  footer: z.string().optional(),
  breaking: z.boolean().default(false),
  coAuthors: z.array(z.string()).default([]),
});
export type CommitMessage = z.infer<typeof CommitMessageSchema>;

export const GeneratedMessageSchema = z.object({
  message: CommitMessageSchema,
  fullText: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  alternatives: z.array(CommitMessageSchema).optional(),
});
export type GeneratedMessage = z.infer<typeof GeneratedMessageSchema>;

// ============================================================================
// COMMIT REQUEST/RESULT
// ============================================================================

export const CommitRequestSchema = z.object({
  staged: z.boolean().default(true),
  all: z.boolean().default(false),
  files: z.array(z.string()).optional(),
  message: z.string().optional(),
  push: z.boolean().default(false),
  createPr: z.boolean().default(false),
  prTitle: z.string().optional(),
  prBody: z.string().optional(),
  prBase: z.string().default("main"),
  dryRun: z.boolean().default(false),
  amend: z.boolean().default(false),
});
export type CommitRequest = z.infer<typeof CommitRequestSchema>;

export const CommitResultSchema = z.object({
  success: z.boolean(),
  commitHash: z.string().optional(),
  message: GeneratedMessageSchema.optional(),
  diff: DiffSummarySchema.optional(),
  pushed: z.boolean().default(false),
  prUrl: z.string().optional(),
  error: z.string().optional(),
  riskScore: z.number().optional(),
  approvalRequired: z.boolean().default(false),
});
export type CommitResult = z.infer<typeof CommitResultSchema>;

// ============================================================================
// PUSH OPTIONS/RESULT
// ============================================================================

export const PushOptionsSchema = z.object({
  remote: z.string().default("origin"),
  branch: z.string().optional(),
  force: z.boolean().default(false),
  setUpstream: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});
export type PushOptions = z.infer<typeof PushOptionsSchema>;

export const PushResultSchema = z.object({
  success: z.boolean(),
  remote: z.string(),
  branch: z.string(),
  commits: z.number(),
  error: z.string().optional(),
});
export type PushResult = z.infer<typeof PushResultSchema>;

// ============================================================================
// PR OPTIONS/RESULT
// ============================================================================

export const PROptionsSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  base: z.string().default("main"),
  head: z.string().optional(),
  draft: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});
export type PROptions = z.infer<typeof PROptionsSchema>;

export const PRResultSchema = z.object({
  success: z.boolean(),
  url: z.string().optional(),
  number: z.number().optional(),
  title: z.string().optional(),
  error: z.string().optional(),
});
export type PRResult = z.infer<typeof PRResultSchema>;

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export const CommitRiskFactorSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  reason: z.string(),
});
export type CommitRiskFactor = z.infer<typeof CommitRiskFactorSchema>;

export const CommitRiskAssessmentSchema = z.object({
  totalScore: z.number().min(0).max(100),
  factors: z.array(CommitRiskFactorSchema),
  recommendation: z.enum(["auto_execute", "queue_approval", "escalate", "reject"]),
  criticalPaths: z.array(z.string()),
  isBreakingChange: z.boolean(),
});
export type CommitRiskAssessment = z.infer<typeof CommitRiskAssessmentSchema>;

// ============================================================================
// AGENT CONFIG
// ============================================================================

export const CommitAgentConfigSchema = z.object({
  name: z.string().default("commit-agent"),
  description: z.string().optional(),
  llmProvider: z.enum(["openai", "anthropic", "gemini"]).default("anthropic"),
  llmModel: z.string().optional(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.3),
  maxTokens: z.number().default(2048),
  verbose: z.boolean().default(false),
  conventionalCommits: z.boolean().default(true),
  signCommits: z.boolean().default(false),
  includeCoAuthors: z.boolean().default(true),
  coAuthorName: z.string().default("Claude"),
  coAuthorEmail: z.string().default("noreply@anthropic.com"),
  maxMessageLength: z.number().default(72),
  // Risk thresholds
  autoCommitMaxLines: z.number().default(100),
  autoCommitMaxFiles: z.number().default(5),
  criticalPaths: z.array(z.string()).default([
    "src/core/",
    "src/config/",
    ".env",
    "secrets",
    "credentials",
    "package.json",
    "pnpm-workspace.yaml",
    ".github/workflows/",
  ]),
});
export type CommitAgentConfig = z.infer<typeof CommitAgentConfigSchema>;
