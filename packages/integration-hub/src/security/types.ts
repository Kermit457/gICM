/**
 * Security Headers Types
 * Phase 13D: Security Headers
 */

import { z } from "zod";

// =============================================================================
// Content Security Policy (CSP)
// =============================================================================

export const CSPDirectiveSchema = z.enum([
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "media-src",
  "object-src",
  "frame-src",
  "child-src",
  "worker-src",
  "manifest-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
  "navigate-to",
  "report-uri",
  "report-to",
  "upgrade-insecure-requests",
  "block-all-mixed-content",
]);
export type CSPDirective = z.infer<typeof CSPDirectiveSchema>;

export const CSPSourceSchema = z.enum([
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "'unsafe-hashes'",
  "'strict-dynamic'",
  "'none'",
  "data:",
  "blob:",
  "https:",
  "http:",
  "wss:",
  "ws:",
]);
export type CSPSource = z.infer<typeof CSPSourceSchema>;

export const CSPConfigSchema = z.object({
  directives: z.record(
    CSPDirectiveSchema,
    z.array(z.string())
  ),
  reportOnly: z.boolean().default(false),
  reportUri: z.string().optional(),
  reportTo: z.string().optional(),
  nonce: z.boolean().default(false).describe("Generate nonces for scripts/styles"),
});
export type CSPConfig = z.infer<typeof CSPConfigSchema>;

// =============================================================================
// Cross-Origin Resource Sharing (CORS)
// =============================================================================

export const CORSConfigSchema = z.object({
  enabled: z.boolean().default(true),
  origins: z.union([
    z.literal("*"),
    z.array(z.string()),
  ]).default("*"),
  methods: z.array(z.enum([
    "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD",
  ])).default(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  allowedHeaders: z.array(z.string()).default([
    "Content-Type", "Authorization", "X-Requested-With",
  ]),
  exposedHeaders: z.array(z.string()).default([]),
  credentials: z.boolean().default(false),
  maxAge: z.number().default(86400).describe("Preflight cache in seconds"),
  preflightContinue: z.boolean().default(false),
  optionsSuccessStatus: z.number().default(204),
});
export type CORSConfig = z.infer<typeof CORSConfigSchema>;

// =============================================================================
// HTTP Strict Transport Security (HSTS)
// =============================================================================

export const HSTSConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxAge: z.number().default(31536000).describe("Max age in seconds (1 year default)"),
  includeSubDomains: z.boolean().default(true),
  preload: z.boolean().default(false).describe("Submit to HSTS preload list"),
});
export type HSTSConfig = z.infer<typeof HSTSConfigSchema>;

// =============================================================================
// X-Frame-Options
// =============================================================================

export const FrameOptionsSchema = z.enum(["DENY", "SAMEORIGIN"]);
export type FrameOptions = z.infer<typeof FrameOptionsSchema>;

export const FrameOptionsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  value: FrameOptionsSchema.default("DENY"),
});
export type FrameOptionsConfig = z.infer<typeof FrameOptionsConfigSchema>;

// =============================================================================
// X-Content-Type-Options
// =============================================================================

export const ContentTypeOptionsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  nosniff: z.boolean().default(true),
});
export type ContentTypeOptionsConfig = z.infer<typeof ContentTypeOptionsConfigSchema>;

// =============================================================================
// Referrer Policy
// =============================================================================

export const ReferrerPolicySchema = z.enum([
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
]);
export type ReferrerPolicy = z.infer<typeof ReferrerPolicySchema>;

export const ReferrerPolicyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  policy: ReferrerPolicySchema.default("strict-origin-when-cross-origin"),
});
export type ReferrerPolicyConfig = z.infer<typeof ReferrerPolicyConfigSchema>;

// =============================================================================
// Permissions Policy (Feature Policy)
// =============================================================================

export const PermissionsPolicyFeatureSchema = z.enum([
  "accelerometer",
  "ambient-light-sensor",
  "autoplay",
  "battery",
  "camera",
  "display-capture",
  "document-domain",
  "encrypted-media",
  "fullscreen",
  "geolocation",
  "gyroscope",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  "screen-wake-lock",
  "usb",
  "web-share",
  "xr-spatial-tracking",
]);
export type PermissionsPolicyFeature = z.infer<typeof PermissionsPolicyFeatureSchema>;

export const PermissionsPolicyConfigSchema = z.object({
  enabled: z.boolean().default(true),
  features: z.record(
    PermissionsPolicyFeatureSchema,
    z.union([
      z.literal("*"),
      z.literal("self"),
      z.literal("none"),
      z.array(z.string()),
    ])
  ).default({}),
});
export type PermissionsPolicyConfig = z.infer<typeof PermissionsPolicyConfigSchema>;

// =============================================================================
// Cross-Origin Policies
// =============================================================================

export const CrossOriginOpenerPolicySchema = z.enum([
  "unsafe-none",
  "same-origin-allow-popups",
  "same-origin",
]);
export type CrossOriginOpenerPolicy = z.infer<typeof CrossOriginOpenerPolicySchema>;

export const CrossOriginEmbedderPolicySchema = z.enum([
  "unsafe-none",
  "require-corp",
  "credentialless",
]);
export type CrossOriginEmbedderPolicy = z.infer<typeof CrossOriginEmbedderPolicySchema>;

export const CrossOriginResourcePolicySchema = z.enum([
  "same-site",
  "same-origin",
  "cross-origin",
]);
export type CrossOriginResourcePolicy = z.infer<typeof CrossOriginResourcePolicySchema>;

export const CrossOriginPoliciesConfigSchema = z.object({
  opener: z.object({
    enabled: z.boolean().default(false),
    policy: CrossOriginOpenerPolicySchema.default("same-origin"),
  }).optional(),
  embedder: z.object({
    enabled: z.boolean().default(false),
    policy: CrossOriginEmbedderPolicySchema.default("require-corp"),
  }).optional(),
  resource: z.object({
    enabled: z.boolean().default(false),
    policy: CrossOriginResourcePolicySchema.default("same-origin"),
  }).optional(),
});
export type CrossOriginPoliciesConfig = z.infer<typeof CrossOriginPoliciesConfigSchema>;

// =============================================================================
// Cache Control
// =============================================================================

export const CacheControlConfigSchema = z.object({
  enabled: z.boolean().default(true),
  directives: z.object({
    public: z.boolean().optional(),
    private: z.boolean().optional(),
    noCache: z.boolean().optional(),
    noStore: z.boolean().optional(),
    noTransform: z.boolean().optional(),
    mustRevalidate: z.boolean().optional(),
    proxyRevalidate: z.boolean().optional(),
    maxAge: z.number().optional(),
    sMaxAge: z.number().optional(),
    immutable: z.boolean().optional(),
    staleWhileRevalidate: z.number().optional(),
    staleIfError: z.number().optional(),
  }).default({}),
});
export type CacheControlConfig = z.infer<typeof CacheControlConfigSchema>;

// =============================================================================
// Custom Headers
// =============================================================================

export const CustomHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  override: z.boolean().default(false).describe("Override if exists"),
});
export type CustomHeader = z.infer<typeof CustomHeaderSchema>;

// =============================================================================
// Remove Headers
// =============================================================================

export const RemoveHeadersConfigSchema = z.object({
  enabled: z.boolean().default(true),
  headers: z.array(z.string()).default([
    "X-Powered-By",
    "Server",
    "X-AspNet-Version",
    "X-AspNetMvc-Version",
  ]),
});
export type RemoveHeadersConfig = z.infer<typeof RemoveHeadersConfigSchema>;

// =============================================================================
// Security Headers Manager Config
// =============================================================================

export const SecurityHeadersConfigSchema = z.object({
  csp: CSPConfigSchema.optional(),
  cors: CORSConfigSchema.optional(),
  hsts: HSTSConfigSchema.optional(),
  frameOptions: FrameOptionsConfigSchema.optional(),
  contentTypeOptions: ContentTypeOptionsConfigSchema.optional(),
  referrerPolicy: ReferrerPolicyConfigSchema.optional(),
  permissionsPolicy: PermissionsPolicyConfigSchema.optional(),
  crossOriginPolicies: CrossOriginPoliciesConfigSchema.optional(),
  cacheControl: CacheControlConfigSchema.optional(),
  customHeaders: z.array(CustomHeaderSchema).default([]),
  removeHeaders: RemoveHeadersConfigSchema.optional(),
});
export type SecurityHeadersConfig = z.infer<typeof SecurityHeadersConfigSchema>;

// =============================================================================
// Request/Response Types
// =============================================================================

export const SecurityRequestSchema = z.object({
  method: z.string(),
  path: z.string(),
  origin: z.string().optional(),
  headers: z.record(z.string()),
});
export type SecurityRequest = z.infer<typeof SecurityRequestSchema>;

export const SecurityResponseSchema = z.object({
  statusCode: z.number().optional(),
  headers: z.record(z.string()),
});
export type SecurityResponse = z.infer<typeof SecurityResponseSchema>;

// =============================================================================
// Events
// =============================================================================

export type SecurityHeadersEvents = {
  // Headers Applied
  headersApplied: (request: SecurityRequest, headers: Record<string, string>) => void;
  headerRemoved: (name: string) => void;

  // CORS
  corsAllowed: (origin: string) => void;
  corsBlocked: (origin: string) => void;
  preflightHandled: (origin: string) => void;

  // CSP
  cspViolation: (report: unknown) => void;
  nonceGenerated: (nonce: string) => void;

  // Errors
  error: (error: Error) => void;
};

// =============================================================================
// Path Matching
// =============================================================================

export const PathConfigSchema = z.object({
  pattern: z.string().describe("Glob pattern or regex"),
  config: SecurityHeadersConfigSchema,
});
export type PathConfig = z.infer<typeof PathConfigSchema>;

export const SecurityManagerConfigSchema = z.object({
  global: SecurityHeadersConfigSchema.optional(),
  paths: z.array(PathConfigSchema).default([]),
  excludePaths: z.array(z.string()).default([]),
});
export type SecurityManagerConfig = z.infer<typeof SecurityManagerConfigSchema>;
