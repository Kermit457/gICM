/**
 * Security Headers Module
 * Phase 13D: Security Headers
 */

// Types & Schemas
export {
  // CSP
  CSPDirectiveSchema,
  type CSPDirective,
  CSPSourceSchema,
  type CSPSource,
  CSPConfigSchema,
  type CSPConfig,

  // CORS
  CORSConfigSchema,
  type CORSConfig,

  // HSTS
  HSTSConfigSchema,
  type HSTSConfig,

  // Frame Options
  FrameOptionsSchema,
  type FrameOptions,
  FrameOptionsConfigSchema,
  type FrameOptionsConfig,

  // Content Type Options
  ContentTypeOptionsConfigSchema,
  type ContentTypeOptionsConfig,

  // Referrer Policy
  ReferrerPolicySchema,
  type ReferrerPolicy,
  ReferrerPolicyConfigSchema,
  type ReferrerPolicyConfig,

  // Permissions Policy
  PermissionsPolicyFeatureSchema,
  type PermissionsPolicyFeature,
  PermissionsPolicyConfigSchema,
  type PermissionsPolicyConfig,

  // Cross-Origin Policies
  CrossOriginOpenerPolicySchema,
  type CrossOriginOpenerPolicy,
  CrossOriginEmbedderPolicySchema,
  type CrossOriginEmbedderPolicy,
  CrossOriginResourcePolicySchema,
  type CrossOriginResourcePolicy,
  CrossOriginPoliciesConfigSchema,
  type CrossOriginPoliciesConfig,

  // Cache Control
  CacheControlConfigSchema,
  type CacheControlConfig,

  // Custom Headers
  CustomHeaderSchema,
  type CustomHeader,

  // Remove Headers
  RemoveHeadersConfigSchema,
  type RemoveHeadersConfig,

  // Main Config
  SecurityHeadersConfigSchema,
  type SecurityHeadersConfig,

  // Request/Response
  SecurityRequestSchema,
  type SecurityRequest,
  SecurityResponseSchema,
  type SecurityResponse,

  // Path Config
  PathConfigSchema,
  type PathConfig,
  SecurityManagerConfigSchema,
  type SecurityManagerConfig,

  // Events
  type SecurityHeadersEvents,
} from "./types.js";

// Security Headers Manager
export {
  SecurityHeadersManager,
  getSecurityHeadersManager,
  createSecurityHeadersManager,
  SECURITY_PRESETS,
  CSPBuilder,
  csp,
} from "./security-headers.js";
