/**
 * Secrets Management Types
 * Phase 13A: Security & Secrets
 */

import { z } from "zod";

// ============================================================================
// Secret Provider Types
// ============================================================================

export const SecretProviderSchema = z.enum([
  "env",
  "vault",
  "aws",
  "azure",
  "gcp",
  "memory",
]);
export type SecretProvider = z.infer<typeof SecretProviderSchema>;

// ============================================================================
// Secret Types
// ============================================================================

export const SecretTypeSchema = z.enum([
  "string",
  "json",
  "certificate",
  "key_pair",
  "api_key",
  "connection_string",
]);
export type SecretType = z.infer<typeof SecretTypeSchema>;

export const SecretMetadataSchema = z.object({
  type: SecretTypeSchema.default("string"),
  version: z.number().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
  rotatedAt: z.date().optional(),
  provider: SecretProviderSchema,
  path: z.string(),
  tags: z.record(z.string()).optional(),
});
export type SecretMetadata = z.infer<typeof SecretMetadataSchema>;

export const SecretValueSchema = z.object({
  name: z.string(),
  value: z.string(),
  metadata: SecretMetadataSchema,
});
export type SecretValue = z.infer<typeof SecretValueSchema>;

// ============================================================================
// Provider Configurations
// ============================================================================

export const EnvProviderConfigSchema = z.object({
  provider: z.literal("env"),
  prefix: z.string().optional(),
  transform: z.enum(["none", "uppercase", "lowercase"]).default("uppercase"),
});
export type EnvProviderConfig = z.infer<typeof EnvProviderConfigSchema>;

export const VaultProviderConfigSchema = z.object({
  provider: z.literal("vault"),
  address: z.string().url(),
  token: z.string().optional(),
  roleId: z.string().optional(),
  secretId: z.string().optional(),
  namespace: z.string().optional(),
  mountPath: z.string().default("secret"),
  engineVersion: z.enum(["v1", "v2"]).default("v2"),
  tlsSkipVerify: z.boolean().default(false),
  renewLease: z.boolean().default(true),
});
export type VaultProviderConfig = z.infer<typeof VaultProviderConfigSchema>;

export const AWSProviderConfigSchema = z.object({
  provider: z.literal("aws"),
  region: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  sessionToken: z.string().optional(),
  profile: z.string().optional(),
  roleArn: z.string().optional(),
});
export type AWSProviderConfig = z.infer<typeof AWSProviderConfigSchema>;

export const AzureProviderConfigSchema = z.object({
  provider: z.literal("azure"),
  vaultUrl: z.string().url(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  useManagedIdentity: z.boolean().default(false),
});
export type AzureProviderConfig = z.infer<typeof AzureProviderConfigSchema>;

export const GCPProviderConfigSchema = z.object({
  provider: z.literal("gcp"),
  projectId: z.string(),
  credentials: z.string().optional(), // JSON credentials
  useDefaultCredentials: z.boolean().default(true),
});
export type GCPProviderConfig = z.infer<typeof GCPProviderConfigSchema>;

export const MemoryProviderConfigSchema = z.object({
  provider: z.literal("memory"),
  encrypted: z.boolean().default(false),
  encryptionKey: z.string().optional(),
});
export type MemoryProviderConfig = z.infer<typeof MemoryProviderConfigSchema>;

export const ProviderConfigSchema = z.discriminatedUnion("provider", [
  EnvProviderConfigSchema,
  VaultProviderConfigSchema,
  AWSProviderConfigSchema,
  AzureProviderConfigSchema,
  GCPProviderConfigSchema,
  MemoryProviderConfigSchema,
]);
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ============================================================================
// Rotation Configuration
// ============================================================================

export const RotationStrategySchema = z.enum([
  "manual",
  "scheduled",
  "on_expiry",
  "on_access_count",
]);
export type RotationStrategy = z.infer<typeof RotationStrategySchema>;

export const RotationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: RotationStrategySchema.default("manual"),
  intervalDays: z.number().optional(),
  maxAccessCount: z.number().optional(),
  notifyBeforeDays: z.number().default(7),
  autoRotate: z.boolean().default(false),
  rotationFunction: z.string().optional(), // Function name to call for rotation
});
export type RotationConfig = z.infer<typeof RotationConfigSchema>;

// ============================================================================
// Access Control
// ============================================================================

export const SecretAccessSchema = z.object({
  secretName: z.string(),
  accessor: z.string(), // User/service identifier
  action: z.enum(["read", "write", "delete", "rotate"]),
  timestamp: z.date(),
  allowed: z.boolean(),
  reason: z.string().optional(),
});
export type SecretAccess = z.infer<typeof SecretAccessSchema>;

export const SecretPolicySchema = z.object({
  name: z.string(),
  pattern: z.string(), // Glob pattern for secret names
  allowedAccessors: z.array(z.string()).optional(),
  deniedAccessors: z.array(z.string()).optional(),
  permissions: z.array(z.enum(["read", "write", "delete", "rotate"])),
  conditions: z.object({
    timeWindow: z.object({
      start: z.string(), // HH:mm
      end: z.string(),
      timezone: z.string(),
    }).optional(),
    ipWhitelist: z.array(z.string()).optional(),
    requireMfa: z.boolean().optional(),
  }).optional(),
});
export type SecretPolicy = z.infer<typeof SecretPolicySchema>;

// ============================================================================
// Lease Management
// ============================================================================

export const SecretLeaseSchema = z.object({
  id: z.string(),
  secretName: z.string(),
  duration: z.number(), // Seconds
  renewable: z.boolean(),
  createdAt: z.date(),
  expiresAt: z.date(),
  renewedAt: z.date().optional(),
  renewCount: z.number().default(0),
  maxRenewals: z.number().optional(),
});
export type SecretLease = z.infer<typeof SecretLeaseSchema>;

// ============================================================================
// Secrets Manager Configuration
// ============================================================================

export const SecretsManagerConfigSchema = z.object({
  providers: z.array(ProviderConfigSchema).min(1),
  defaultProvider: SecretProviderSchema.default("env"),
  cacheEnabled: z.boolean().default(true),
  cacheTTL: z.number().default(300000), // 5 minutes
  auditEnabled: z.boolean().default(true),
  encryptionAtRest: z.boolean().default(false),
  encryptionKey: z.string().optional(),
  rotationConfig: RotationConfigSchema.optional(),
  policies: z.array(SecretPolicySchema).optional(),
});
export type SecretsManagerConfig = z.infer<typeof SecretsManagerConfigSchema>;

// ============================================================================
// Events
// ============================================================================

export type SecretsEvents = {
  // Secret lifecycle
  secretAccessed: (name: string, accessor: string) => void;
  secretCreated: (name: string) => void;
  secretUpdated: (name: string, version: number) => void;
  secretDeleted: (name: string) => void;
  secretRotated: (name: string, newVersion: number) => void;

  // Expiration
  secretExpiring: (name: string, daysUntilExpiry: number) => void;
  secretExpired: (name: string) => void;

  // Lease
  leaseCreated: (lease: SecretLease) => void;
  leaseRenewed: (lease: SecretLease) => void;
  leaseExpired: (lease: SecretLease) => void;

  // Access control
  accessDenied: (access: SecretAccess) => void;
  policyViolation: (policy: string, accessor: string, action: string) => void;

  // Provider
  providerConnected: (provider: SecretProvider) => void;
  providerDisconnected: (provider: SecretProvider, reason: string) => void;
  providerError: (provider: SecretProvider, error: Error) => void;

  // General
  error: (error: Error) => void;
};

// ============================================================================
// Reference Schemas
// ============================================================================

export const SecretReferenceSchema = z.object({
  name: z.string(),
  provider: SecretProviderSchema.optional(),
  version: z.number().optional(),
  key: z.string().optional(), // For JSON secrets, specific key to extract
});
export type SecretReference = z.infer<typeof SecretReferenceSchema>;

// Format: ${secret:name} or ${secret:provider/name} or ${secret:name#key}
export const SECRET_REFERENCE_PATTERN = /\$\{secret:([a-zA-Z0-9_\-\/]+)(#[a-zA-Z0-9_\-\.]+)?\}/g;

// ============================================================================
// Encrypted Secret
// ============================================================================

export const EncryptedSecretSchema = z.object({
  algorithm: z.string().default("aes-256-gcm"),
  iv: z.string(), // Base64 encoded
  ciphertext: z.string(), // Base64 encoded
  authTag: z.string().optional(), // For GCM mode
  keyId: z.string().optional(), // Key identifier for rotation
});
export type EncryptedSecret = z.infer<typeof EncryptedSecretSchema>;
