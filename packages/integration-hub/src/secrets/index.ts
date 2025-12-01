/**
 * Secrets Module
 * Phase 13A: Secrets Management
 */

// Types & Schemas
export {
  // Provider Types
  SecretProviderSchema,
  type SecretProvider,

  // Provider Configs
  EnvProviderConfigSchema,
  type EnvProviderConfig,
  VaultProviderConfigSchema,
  type VaultProviderConfig,
  AWSProviderConfigSchema,
  type AWSProviderConfig,
  AzureProviderConfigSchema,
  type AzureProviderConfig,
  GCPProviderConfigSchema,
  type GCPProviderConfig,

  // Secret Types
  SecretMetadataSchema,
  type SecretMetadata,
  SecretEntrySchema,
  type SecretEntry,
  SecretLeaseSchema,
  type SecretLease,
  SecretPolicySchema,
  type SecretPolicy,
  RotationConfigSchema,
  type RotationConfig,

  // Manager Config
  SecretsManagerConfigSchema,
  type SecretsManagerConfig,

  // Events
  type SecretsEvents,

  // Constants
  SECRET_REFERENCE_PATTERN,
} from "./types.js";

// Secrets Manager
export {
  SecretsManager,
  SecretNotFoundError,
  SecretAccessDeniedError,
  SecretProviderError,
  getSecretsManager,
  createSecretsManager,
} from "./secrets-manager.js";
