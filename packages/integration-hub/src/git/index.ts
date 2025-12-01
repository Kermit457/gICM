/**
 * Git Integration Module
 *
 * Enables pipeline-as-code with GitHub/GitLab/Bitbucket sync
 */

// Types
export {
  // Provider
  GitProviderSchema,
  type GitProvider,

  // Repository Config
  RepoConfigSchema,
  CreateRepoConfigSchema,
  type RepoConfig,
  type CreateRepoConfig,

  // Pipeline YAML Format
  PipelineYAMLStepSchema,
  PipelineYAMLSchema,
  type PipelineYAMLStep,
  type PipelineYAML,

  // Sync Status
  SyncStatusSchema,
  SyncRecordSchema,
  type SyncStatus,
  type SyncRecord,

  // Webhooks
  GitWebhookEventSchema,
  type GitWebhookEvent,

  // Changes
  FileChangeSchema,
  PipelineChangeSchema,
  type FileChange,
  type PipelineChange,

  // PRs
  PipelinePRSchema,
  type PipelinePR,

  // Config
  GitManagerConfigSchema,
  type GitManagerConfig,

  // Events
  type GitEvents,
} from "./types.js";

// YAML Parser
export {
  parsePipelineYAML,
  stringifyPipelineYAML,
  yamlToInternal,
  internalToYAML,
  validatePipelineYAML,
  generatePipelineDiff,
  EXAMPLE_PIPELINES,
  type ParseResult,
  type InternalPipeline,
  type InternalPipelineStep,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from "./yaml-parser.js";

// Git Manager
export {
  GitManager,
  getGitManager,
  createGitManager,
} from "./git-manager.js";
