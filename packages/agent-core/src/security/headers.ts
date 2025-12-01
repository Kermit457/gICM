/**
 * Security Headers for gICM platform
 *
 * Features:
 * - Content Security Policy (CSP)
 * - Cross-Origin Resource Sharing (CORS)
 * - HTTP Strict Transport Security (HSTS)
 * - XSS Protection
 * - Content Type Options
 * - Frame Options
 * - Referrer Policy
 */

import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export const CspDirectiveSchema = z.object({
  "default-src": z.array(z.string()).optional(),
  "script-src": z.array(z.string()).optional(),
  "style-src": z.array(z.string()).optional(),
  "img-src": z.array(z.string()).optional(),
  "font-src": z.array(z.string()).optional(),
  "connect-src": z.array(z.string()).optional(),
  "media-src": z.array(z.string()).optional(),
  "object-src": z.array(z.string()).optional(),
  "frame-src": z.array(z.string()).optional(),
  "frame-ancestors": z.array(z.string()).optional(),
  "form-action": z.array(z.string()).optional(),
  "base-uri": z.array(z.string()).optional(),
  "worker-src": z.array(z.string()).optional(),
  "manifest-src": z.array(z.string()).optional(),
  "upgrade-insecure-requests": z.boolean().optional(),
  "block-all-mixed-content": z.boolean().optional(),
  "report-uri": z.string().optional(),
  "report-to": z.string().optional(),
});

export type CspDirectives = z.infer<typeof CspDirectiveSchema>;

export const CorsConfigSchema = z.object({
  /** Allowed origins (use '*' for any, or array of specific origins) */
  allowedOrigins: z.union([z.literal("*"), z.array(z.string())]).default("*"),
  /** Allowed HTTP methods */
  allowedMethods: z
    .array(z.string())
    .default(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]),
  /** Allowed headers */
  allowedHeaders: z
    .array(z.string())
    .default(["Content-Type", "Authorization", "X-Requested-With"]),
  /** Exposed headers */
  exposedHeaders: z.array(z.string()).optional(),
  /** Allow credentials */
  credentials: z.boolean().default(false),
  /** Max age for preflight cache (seconds) */
  maxAge: z.number().default(86400),
});

export type CorsConfig = z.infer<typeof CorsConfigSchema>;

export const SecurityHeadersConfigSchema = z.object({
  /** Content Security Policy */
  csp: CspDirectiveSchema.optional(),
  /** Report-only CSP (for testing) */
  cspReportOnly: z.boolean().default(false),
  /** CORS configuration */
  cors: CorsConfigSchema.optional(),
  /** HTTP Strict Transport Security */
  hsts: z
    .object({
      maxAge: z.number().default(31536000), // 1 year
      includeSubDomains: z.boolean().default(true),
      preload: z.boolean().default(false),
    })
    .optional(),
  /** X-Content-Type-Options */
  noSniff: z.boolean().default(true),
  /** X-Frame-Options */
  frameOptions: z.enum(["DENY", "SAMEORIGIN"]).default("DENY"),
  /** X-XSS-Protection (legacy but still useful) */
  xssProtection: z.boolean().default(true),
  /** Referrer-Policy */
  referrerPolicy: z
    .enum([
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ])
    .default("strict-origin-when-cross-origin"),
  /** Permissions-Policy */
  permissionsPolicy: z.record(z.array(z.string())).optional(),
  /** Cross-Origin-Embedder-Policy */
  coep: z.enum(["require-corp", "credentialless", "unsafe-none"]).optional(),
  /** Cross-Origin-Opener-Policy */
  coop: z.enum(["same-origin", "same-origin-allow-popups", "unsafe-none"]).optional(),
  /** Cross-Origin-Resource-Policy */
  corp: z.enum(["same-site", "same-origin", "cross-origin"]).optional(),
});

export type SecurityHeadersConfig = z.infer<typeof SecurityHeadersConfigSchema>;

// ============================================================================
// CSP Builder
// ============================================================================

/**
 * Build a Content Security Policy string from directives
 */
export function buildCspString(directives: CspDirectives): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined) continue;

    if (typeof value === "boolean") {
      if (value) {
        parts.push(key);
      }
    } else if (typeof value === "string") {
      parts.push(`${key} ${value}`);
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${key} ${value.join(" ")}`);
    }
  }

  return parts.join("; ");
}

/**
 * CSP presets for common use cases
 */
export const CSP_PRESETS = {
  strict: {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": true,
  } as CspDirectives,

  moderate: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "https:"],
    "connect-src": ["'self'", "https:"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'self'"],
    "upgrade-insecure-requests": true,
  } as CspDirectives,

  relaxed: {
    "default-src": ["'self'", "https:"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
    "style-src": ["'self'", "'unsafe-inline'", "https:"],
    "img-src": ["*", "data:", "blob:"],
    "font-src": ["*", "data:"],
    "connect-src": ["*"],
    "object-src": ["'none'"],
  } as CspDirectives,

  api: {
    "default-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "form-action": ["'none'"],
  } as CspDirectives,
};

// ============================================================================
// CORS Handler
// ============================================================================

export interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods"?: string;
  "Access-Control-Allow-Headers"?: string;
  "Access-Control-Expose-Headers"?: string;
  "Access-Control-Allow-Credentials"?: string;
  "Access-Control-Max-Age"?: string;
}

/**
 * Generate CORS headers for a request
 */
export function generateCorsHeaders(
  origin: string | undefined,
  config: CorsConfig,
  isPreflight = false
): CorsHeaders | null {
  // Check if origin is allowed
  let allowedOrigin: string | null = null;

  if (config.allowedOrigins === "*") {
    allowedOrigin = config.credentials ? (origin ?? "*") : "*";
  } else if (origin && config.allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  } else if (origin && config.allowedOrigins.some((o) => o.endsWith("*"))) {
    // Handle wildcard subdomains (e.g., "*.example.com")
    for (const pattern of config.allowedOrigins) {
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        if (origin.startsWith(prefix)) {
          allowedOrigin = origin;
          break;
        }
      }
    }
  }

  if (!allowedOrigin) {
    return null;
  }

  const headers: CorsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
  };

  if (config.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  if (isPreflight) {
    headers["Access-Control-Allow-Methods"] = config.allowedMethods.join(", ");
    headers["Access-Control-Allow-Headers"] = config.allowedHeaders.join(", ");
    headers["Access-Control-Max-Age"] = String(config.maxAge);
  }

  if (config.exposedHeaders && config.exposedHeaders.length > 0) {
    headers["Access-Control-Expose-Headers"] = config.exposedHeaders.join(", ");
  }

  return headers;
}

// ============================================================================
// Security Headers Generator
// ============================================================================

/**
 * Generate all security headers based on configuration
 */
export function generateSecurityHeaders(
  config: SecurityHeadersConfig,
  options?: { origin?: string; isPreflight?: boolean }
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Content Security Policy
  if (config.csp) {
    const cspString = buildCspString(config.csp);
    if (cspString) {
      const headerName = config.cspReportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";
      headers[headerName] = cspString;
    }
  }

  // CORS
  if (config.cors) {
    const corsHeaders = generateCorsHeaders(
      options?.origin,
      config.cors,
      options?.isPreflight
    );
    if (corsHeaders) {
      Object.assign(headers, corsHeaders);
    }
  }

  // HSTS
  if (config.hsts) {
    let hsts = `max-age=${config.hsts.maxAge}`;
    if (config.hsts.includeSubDomains) {
      hsts += "; includeSubDomains";
    }
    if (config.hsts.preload) {
      hsts += "; preload";
    }
    headers["Strict-Transport-Security"] = hsts;
  }

  // X-Content-Type-Options
  if (config.noSniff) {
    headers["X-Content-Type-Options"] = "nosniff";
  }

  // X-Frame-Options
  if (config.frameOptions) {
    headers["X-Frame-Options"] = config.frameOptions;
  }

  // X-XSS-Protection
  if (config.xssProtection) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  // Referrer-Policy
  if (config.referrerPolicy) {
    headers["Referrer-Policy"] = config.referrerPolicy;
  }

  // Permissions-Policy
  if (config.permissionsPolicy) {
    const policy = Object.entries(config.permissionsPolicy)
      .map(([feature, allowlist]) => {
        if (allowlist.length === 0) {
          return `${feature}=()`;
        }
        return `${feature}=(${allowlist.join(" ")})`;
      })
      .join(", ");
    headers["Permissions-Policy"] = policy;
  }

  // Cross-Origin headers
  if (config.coep) {
    headers["Cross-Origin-Embedder-Policy"] = config.coep;
  }
  if (config.coop) {
    headers["Cross-Origin-Opener-Policy"] = config.coop;
  }
  if (config.corp) {
    headers["Cross-Origin-Resource-Policy"] = config.corp;
  }

  return headers;
}

// ============================================================================
// Security Headers Middleware
// ============================================================================

export interface HttpRequest {
  method: string;
  headers: Record<string, string | undefined>;
  url?: string;
}

export interface HttpResponse {
  headers: Record<string, string>;
  statusCode?: number;
}

/**
 * SecurityHeadersMiddleware applies security headers to responses
 */
export class SecurityHeadersMiddleware {
  private readonly config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = SecurityHeadersConfigSchema.parse(config ?? {});
  }

  /**
   * Apply security headers to a response
   */
  apply(request: HttpRequest, response: HttpResponse): HttpResponse {
    const origin = request.headers.origin ?? request.headers.Origin;
    const isPreflight = request.method === "OPTIONS";

    const securityHeaders = generateSecurityHeaders(this.config, {
      origin,
      isPreflight,
    });

    return {
      ...response,
      headers: {
        ...response.headers,
        ...securityHeaders,
      },
    };
  }

  /**
   * Handle CORS preflight request
   */
  handlePreflight(request: HttpRequest): HttpResponse | null {
    if (request.method !== "OPTIONS") {
      return null;
    }

    const origin = request.headers.origin ?? request.headers.Origin;

    if (!this.config.cors || !origin) {
      return null;
    }

    const corsHeaders = generateCorsHeaders(origin, this.config.cors, true);

    if (!corsHeaders) {
      return { headers: {}, statusCode: 403 };
    }

    // Filter out undefined values and create Record<string, string>
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value !== undefined) {
        headers[key] = value;
      }
    }

    return {
      headers,
      statusCode: 204,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityHeadersConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Pre-configured security header profiles
 */
export const SECURITY_PRESETS = {
  /** Strict security for production APIs */
  strictApi: {
    csp: CSP_PRESETS.api,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    frameOptions: "DENY",
    xssProtection: true,
    referrerPolicy: "no-referrer",
    coep: "require-corp",
    coop: "same-origin",
    corp: "same-origin",
  } as SecurityHeadersConfig,

  /** Moderate security for web applications */
  webApp: {
    csp: CSP_PRESETS.moderate,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: true,
    referrerPolicy: "strict-origin-when-cross-origin",
  } as SecurityHeadersConfig,

  /** Relaxed for development */
  development: {
    csp: CSP_PRESETS.relaxed,
    cspReportOnly: true,
    cors: {
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["*"],
      credentials: true,
    },
    noSniff: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: true,
    referrerPolicy: "no-referrer-when-downgrade",
  } as SecurityHeadersConfig,

  /** For public APIs with CORS */
  publicApi: {
    csp: CSP_PRESETS.api,
    cors: {
      allowedOrigins: "*",
      allowedMethods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    frameOptions: "DENY",
    xssProtection: true,
    referrerPolicy: "no-referrer",
  } as SecurityHeadersConfig,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a nonce for inline scripts/styles
 */
export function generateNonce(): string {
  const crypto = globalThis.crypto ?? require("crypto");
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

/**
 * Add nonce to CSP directives
 */
export function addNonceToCsp(
  directives: CspDirectives,
  nonce: string,
  targets: ("script-src" | "style-src")[] = ["script-src", "style-src"]
): CspDirectives {
  const result = { ...directives };
  const nonceValue = `'nonce-${nonce}'`;

  for (const target of targets) {
    const current = result[target] ?? [];
    result[target] = [...current, nonceValue];
  }

  return result;
}

/**
 * Merge CSP directives
 */
export function mergeCspDirectives(
  base: CspDirectives,
  override: Partial<CspDirectives>
): CspDirectives {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      const k = key as keyof CspDirectives;
      if (Array.isArray(value) && Array.isArray(result[k])) {
        // Merge arrays
        (result as Record<string, unknown>)[k] = [
          ...(result[k] as string[]),
          ...value,
        ];
      } else {
        (result as Record<string, unknown>)[k] = value;
      }
    }
  }

  return result;
}

/**
 * Validate an origin against allowed origins
 */
export function isOriginAllowed(
  origin: string,
  allowedOrigins: string[] | "*"
): boolean {
  if (allowedOrigins === "*") {
    return true;
  }

  for (const allowed of allowedOrigins) {
    if (allowed === origin) {
      return true;
    }

    // Handle wildcards (e.g., "*.example.com")
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2);
      const originDomain = new URL(origin).hostname;
      if (originDomain === domain || originDomain.endsWith(`.${domain}`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Create security headers for static file serving
 */
export function createStaticFileHeaders(
  contentType: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
  };

  // Add caching headers for static assets
  if (
    contentType.startsWith("image/") ||
    contentType.startsWith("font/") ||
    contentType === "application/javascript" ||
    contentType === "text/css"
  ) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  }

  // Specific headers for HTML
  if (contentType === "text/html") {
    headers["X-Frame-Options"] = "SAMEORIGIN";
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  return headers;
}
