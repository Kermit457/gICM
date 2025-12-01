/**
 * Git Integration Types
 *
 * Enables pipeline-as-code with GitHub/GitLab/Bitbucket sync
 */

import { z } from "zod";

// =============================================================================
// GIT PROVIDERS
// =============================================================================

export const GitProviderSchema = z.enum(["github", "gitlab", "bitbucket"]);
export type GitProvider = z.infer<typeof GitProviderSchema>;

// =============================================================================
// REPOSITORY CONFIG
// =============================================================================

export const RepoConfigSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  provider: GitProviderSchema,
  owner: z.string(),
  repo: z.string(),
  branch: z.string().default("main"),
  path: z.string().default(".gicm/pipelines"), // Where pipeline YAML files live
  accessToken: z.string().optional(), // Encrypted
  webhookSecret: z.string().optional(), // For validating webhooks
  syncEnabled: z.boolean().default(true),
  autoSync: z.boolean().default(true), // Auto-sync on push
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RepoConfig = z.infer<typeof RepoConfigSchema>;

export const CreateRepoConfigSchema = RepoConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRepoConfig = z.infer<typeof CreateRepoConfigSchema>;

// =============================================================================
// PIPELINE YAML FORMAT
// =============================================================================

export const PipelineYAMLStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  tool: z.string(),
  config: z.record(z.unknown()).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  condition: z.string().optional(), // e.g., "previous.success"
  dependsOn: z.array(z.string()).optional(),
});
export type PipelineYAMLStep = z.infer<typeof PipelineYAMLStepSchema>;

export const PipelineYAMLSchema = z.object({
  version: z.literal("1.0"),
  name: z.string(),
  description: z.string().optional(),
  schedule: z.string().optional(), // Cron expression
  trigger: z.object({
    events: z.array(z.enum(["push", "pull_request", "schedule", "manual", "webhook"])).optional(),
    branches: z.array(z.string()).optional(),
    paths: z.array(z.string()).optional(),
  }).optional(),
  env: z.record(z.string()).optional(),
  steps: z.array(PipelineYAMLStepSchema),
  notifications: z.object({
    onSuccess: z.array(z.string()).optional(), // Webhook URLs
    onFailure: z.array(z.string()).optional(),
  }).optional(),
  budget: z.object({
    maxCostPerRun: z.number().optional(),
    maxDailyCost: z.number().optional(),
  }).optional(),
});
export type PipelineYAML = z.infer<typeof PipelineYAMLSchema>;

// =============================================================================
// SYNC STATUS
// =============================================================================

export const SyncStatusSchema = z.enum([
  "synced",
  "pending",
  "syncing",
  "conflict",
  "error",
]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const SyncRecordSchema = z.object({
  id: z.string(),
  repoConfigId: z.string(),
  pipelineId: z.string(),
  filePath: z.string(),
  commitSha: z.string(),
  status: SyncStatusSchema,
  direction: z.enum(["pull", "push"]),
  message: z.string().optional(),
  createdAt: z.string(),
});
export type SyncRecord = z.infer<typeof SyncRecordSchema>;

// =============================================================================
// WEBHOOK EVENTS
// =============================================================================

export const GitWebhookEventSchema = z.object({
  id: z.string(),
  provider: GitProviderSchema,
  event: z.string(), // "push", "pull_request", etc.
  action: z.string().optional(), // "opened", "closed", etc.
  repo: z.object({
    owner: z.string(),
    name: z.string(),
  }),
  ref: z.string().optional(), // "refs/heads/main"
  commit: z.object({
    sha: z.string(),
    message: z.string(),
    author: z.string(),
  }).optional(),
  pullRequest: z.object({
    number: z.number(),
    title: z.string(),
    state: z.string(),
    sourceBranch: z.string(),
    targetBranch: z.string(),
  }).optional(),
  sender: z.object({
    login: z.string(),
    avatarUrl: z.string().optional(),
  }),
  receivedAt: z.string(),
});
export type GitWebhookEvent = z.infer<typeof GitWebhookEventSchema>;

// =============================================================================
// DIFF & CHANGES
// =============================================================================

export const FileChangeSchema = z.object({
  path: z.string(),
  status: z.enum(["added", "modified", "deleted", "renamed"]),
  oldPath: z.string().optional(), // For renames
  additions: z.number(),
  deletions: z.number(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;

export const PipelineChangeSchema = z.object({
  pipelineId: z.string().optional(), // Null for new pipelines
  pipelineName: z.string(),
  filePath: z.string(),
  changeType: z.enum(["create", "update", "delete"]),
  oldYaml: PipelineYAMLSchema.optional(),
  newYaml: PipelineYAMLSchema.optional(),
  diff: z.string().optional(), // Unified diff format
});
export type PipelineChange = z.infer<typeof PipelineChangeSchema>;

// =============================================================================
// PR-BASED CHANGES
// =============================================================================

export const PipelinePRSchema = z.object({
  id: z.string(),
  repoConfigId: z.string(),
  prNumber: z.number(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["open", "merged", "closed"]),
  changes: z.array(PipelineChangeSchema),
  author: z.string(),
  createdAt: z.string(),
  mergedAt: z.string().optional(),
  reviewStatus: z.enum(["pending", "approved", "changes_requested"]).optional(),
});
export type PipelinePR = z.infer<typeof PipelinePRSchema>;

// =============================================================================
// GIT MANAGER CONFIG
// =============================================================================

export const GitManagerConfigSchema = z.object({
  // Default provider settings
  defaultProvider: GitProviderSchema.default("github"),

  // Sync settings
  syncIntervalMs: z.number().default(60000), // 1 minute
  maxConcurrentSyncs: z.number().default(5),

  // Conflict resolution
  conflictStrategy: z.enum(["local_wins", "remote_wins", "manual"]).default("manual"),

  // Webhook settings
  webhookPath: z.string().default("/api/git/webhook"),

  // Security
  encryptTokens: z.boolean().default(true),
});
export type GitManagerConfig = z.infer<typeof GitManagerConfigSchema>;

// =============================================================================
// EVENTS
// =============================================================================

export interface GitEvents {
  "repo:connected": (repo: RepoConfig) => void;
  "repo:disconnected": (repoId: string) => void;
  "sync:started": (repoId: string, direction: "pull" | "push") => void;
  "sync:completed": (record: SyncRecord) => void;
  "sync:failed": (repoId: string, error: Error) => void;
  "webhook:received": (event: GitWebhookEvent) => void;
  "pipeline:imported": (pipelineId: string, filePath: string) => void;
  "pipeline:exported": (pipelineId: string, filePath: string) => void;
  "conflict:detected": (pipelineId: string, filePath: string) => void;
  "pr:opened": (pr: PipelinePR) => void;
  "pr:merged": (pr: PipelinePR) => void;
}
