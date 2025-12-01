/**
 * Security Headers Manager
 * Phase 13D: Security Headers
 */

import { EventEmitter } from "eventemitter3";
import { randomBytes } from "crypto";
import {
  type SecurityManagerConfig,
  SecurityManagerConfigSchema,
  type SecurityHeadersConfig,
  type SecurityRequest,
  type SecurityResponse,
  type SecurityHeadersEvents,
  type CSPConfig,
  type CORSConfig,
} from "./types.js";

// =============================================================================
// Security Headers Manager
// =============================================================================

export class SecurityHeadersManager extends EventEmitter<SecurityHeadersEvents> {
  private config: SecurityManagerConfig;
  private currentNonce: string | null = null;

  constructor(config: Partial<SecurityManagerConfig> = {}) {
    super();
    this.config = SecurityManagerConfigSchema.parse(config);
  }

  // ---------------------------------------------------------------------------
  // Main Methods
  // ---------------------------------------------------------------------------

  apply(request: SecurityRequest, response: SecurityResponse = { headers: {} }): SecurityResponse {
    // Check if path is excluded
    if (this.isExcluded(request.path)) {
      return response;
    }

    // Get effective config (merge global with path-specific)
    const effectiveConfig = this.getEffectiveConfig(request.path);
    if (!effectiveConfig) {
      return response;
    }

    const headers: Record<string, string> = { ...response.headers };

    // Apply each security header type
    this.applyCSP(effectiveConfig, headers);
    this.applyCORS(effectiveConfig, request, headers);
    this.applyHSTS(effectiveConfig, headers);
    this.applyFrameOptions(effectiveConfig, headers);
    this.applyContentTypeOptions(effectiveConfig, headers);
    this.applyReferrerPolicy(effectiveConfig, headers);
    this.applyPermissionsPolicy(effectiveConfig, headers);
    this.applyCrossOriginPolicies(effectiveConfig, headers);
    this.applyCacheControl(effectiveConfig, headers);
    this.applyCustomHeaders(effectiveConfig, headers);
    this.removeHeaders(effectiveConfig, headers);

    this.emit("headersApplied", request, headers);

    return {
      ...response,
      headers,
    };
  }

  handlePreflight(request: SecurityRequest): SecurityResponse | null {
    if (request.method !== "OPTIONS") {
      return null;
    }

    const effectiveConfig = this.getEffectiveConfig(request.path);
    const corsConfig = effectiveConfig?.cors;

    if (!corsConfig?.enabled) {
      return null;
    }

    const headers: Record<string, string> = {};
    const origin = request.origin ?? request.headers["origin"];

    if (!this.isOriginAllowed(origin, corsConfig)) {
      this.emit("corsBlocked", origin ?? "unknown");
      return { statusCode: 403, headers: {} };
    }

    // Set CORS headers
    if (corsConfig.origins === "*") {
      headers["Access-Control-Allow-Origin"] = "*";
    } else if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
    }

    headers["Access-Control-Allow-Methods"] = corsConfig.methods.join(", ");
    headers["Access-Control-Allow-Headers"] = corsConfig.allowedHeaders.join(", ");

    if (corsConfig.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (corsConfig.maxAge) {
      headers["Access-Control-Max-Age"] = String(corsConfig.maxAge);
    }

    this.emit("preflightHandled", origin ?? "unknown");

    return {
      statusCode: corsConfig.optionsSuccessStatus,
      headers,
    };
  }

  // ---------------------------------------------------------------------------
  // Nonce Management
  // ---------------------------------------------------------------------------

  generateNonce(): string {
    this.currentNonce = randomBytes(16).toString("base64");
    this.emit("nonceGenerated", this.currentNonce);
    return this.currentNonce;
  }

  getNonce(): string | null {
    return this.currentNonce;
  }

  // ---------------------------------------------------------------------------
  // CSP Report Handler
  // ---------------------------------------------------------------------------

  handleCSPReport(report: unknown): void {
    this.emit("cspViolation", report);
  }

  // ---------------------------------------------------------------------------
  // Config Methods
  // ---------------------------------------------------------------------------

  getConfig(): SecurityManagerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SecurityManagerConfig>): void {
    this.config = SecurityManagerConfigSchema.parse({
      ...this.config,
      ...config,
    });
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private isExcluded(path: string): boolean {
    return this.config.excludePaths.some(pattern => {
      const regex = this.patternToRegex(pattern);
      return regex.test(path);
    });
  }

  private getEffectiveConfig(path: string): SecurityHeadersConfig | null {
    // Start with global config
    let effective: SecurityHeadersConfig = { ...(this.config.global ?? {}) };

    // Apply path-specific configs (later ones override earlier)
    for (const pathConfig of this.config.paths) {
      const regex = this.patternToRegex(pathConfig.pattern);
      if (regex.test(path)) {
        effective = this.mergeConfigs(effective, pathConfig.config);
      }
    }

    return effective;
  }

  private mergeConfigs(
    base: SecurityHeadersConfig,
    override: SecurityHeadersConfig
  ): SecurityHeadersConfig {
    return {
      ...base,
      ...override,
      customHeaders: [
        ...(base.customHeaders ?? []),
        ...(override.customHeaders ?? []),
      ],
    };
  }

  private patternToRegex(pattern: string): RegExp {
    // Simple glob to regex conversion
    const regex = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    return new RegExp(`^${regex}$`);
  }

  // ---------------------------------------------------------------------------
  // Header Application
  // ---------------------------------------------------------------------------

  private applyCSP(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.csp) return;

    const csp = config.csp;
    const directives: string[] = [];

    for (const [directive, sources] of Object.entries(csp.directives)) {
      let sourceList = [...sources];

      // Add nonce if enabled
      if (csp.nonce && this.currentNonce) {
        if (directive === "script-src" || directive === "style-src") {
          sourceList.push(`'nonce-${this.currentNonce}'`);
        }
      }

      directives.push(`${directive} ${sourceList.join(" ")}`);
    }

    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    if (csp.reportTo) {
      directives.push(`report-to ${csp.reportTo}`);
    }

    const headerName = csp.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";

    headers[headerName] = directives.join("; ");
  }

  private applyCORS(
    config: SecurityHeadersConfig,
    request: SecurityRequest,
    headers: Record<string, string>
  ): void {
    if (!config.cors?.enabled) return;

    const cors = config.cors;
    const origin = request.origin ?? request.headers["origin"];

    if (!this.isOriginAllowed(origin, cors)) {
      if (origin) {
        this.emit("corsBlocked", origin);
      }
      return;
    }

    // Set origin header
    if (cors.origins === "*") {
      headers["Access-Control-Allow-Origin"] = "*";
    } else if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }

    // Expose headers
    if (cors.exposedHeaders.length > 0) {
      headers["Access-Control-Expose-Headers"] = cors.exposedHeaders.join(", ");
    }

    // Credentials
    if (cors.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (origin) {
      this.emit("corsAllowed", origin);
    }
  }

  private isOriginAllowed(origin: string | undefined, cors: CORSConfig): boolean {
    if (!origin) return true; // Same-origin request
    if (cors.origins === "*") return true;

    return (cors.origins as string[]).some(allowed => {
      if (allowed === origin) return true;
      // Support wildcards in origin patterns
      const regex = new RegExp(`^${allowed.replace(/\*/g, ".*")}$`);
      return regex.test(origin);
    });
  }

  private applyHSTS(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.hsts?.enabled) return;

    const hsts = config.hsts;
    let value = `max-age=${hsts.maxAge}`;

    if (hsts.includeSubDomains) {
      value += "; includeSubDomains";
    }

    if (hsts.preload) {
      value += "; preload";
    }

    headers["Strict-Transport-Security"] = value;
  }

  private applyFrameOptions(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.frameOptions?.enabled) return;
    headers["X-Frame-Options"] = config.frameOptions.value;
  }

  private applyContentTypeOptions(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.contentTypeOptions?.enabled) return;
    if (config.contentTypeOptions.nosniff) {
      headers["X-Content-Type-Options"] = "nosniff";
    }
  }

  private applyReferrerPolicy(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.referrerPolicy?.enabled) return;
    headers["Referrer-Policy"] = config.referrerPolicy.policy;
  }

  private applyPermissionsPolicy(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.permissionsPolicy?.enabled) return;

    const features = config.permissionsPolicy.features;
    const policies: string[] = [];

    for (const [feature, value] of Object.entries(features)) {
      if (value === "none") {
        policies.push(`${feature}=()`);
      } else if (value === "self") {
        policies.push(`${feature}=(self)`);
      } else if (value === "*") {
        policies.push(`${feature}=*`);
      } else if (Array.isArray(value)) {
        policies.push(`${feature}=(${value.join(" ")})`);
      }
    }

    if (policies.length > 0) {
      headers["Permissions-Policy"] = policies.join(", ");
    }
  }

  private applyCrossOriginPolicies(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    const policies = config.crossOriginPolicies;
    if (!policies) return;

    if (policies.opener?.enabled) {
      headers["Cross-Origin-Opener-Policy"] = policies.opener.policy;
    }

    if (policies.embedder?.enabled) {
      headers["Cross-Origin-Embedder-Policy"] = policies.embedder.policy;
    }

    if (policies.resource?.enabled) {
      headers["Cross-Origin-Resource-Policy"] = policies.resource.policy;
    }
  }

  private applyCacheControl(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.cacheControl?.enabled) return;

    const directives = config.cacheControl.directives;
    const parts: string[] = [];

    if (directives.public) parts.push("public");
    if (directives.private) parts.push("private");
    if (directives.noCache) parts.push("no-cache");
    if (directives.noStore) parts.push("no-store");
    if (directives.noTransform) parts.push("no-transform");
    if (directives.mustRevalidate) parts.push("must-revalidate");
    if (directives.proxyRevalidate) parts.push("proxy-revalidate");
    if (directives.maxAge !== undefined) parts.push(`max-age=${directives.maxAge}`);
    if (directives.sMaxAge !== undefined) parts.push(`s-maxage=${directives.sMaxAge}`);
    if (directives.immutable) parts.push("immutable");
    if (directives.staleWhileRevalidate !== undefined) {
      parts.push(`stale-while-revalidate=${directives.staleWhileRevalidate}`);
    }
    if (directives.staleIfError !== undefined) {
      parts.push(`stale-if-error=${directives.staleIfError}`);
    }

    if (parts.length > 0) {
      headers["Cache-Control"] = parts.join(", ");
    }
  }

  private applyCustomHeaders(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    for (const custom of config.customHeaders ?? []) {
      if (custom.override || !(custom.name in headers)) {
        headers[custom.name] = custom.value;
      }
    }
  }

  private removeHeaders(config: SecurityHeadersConfig, headers: Record<string, string>): void {
    if (!config.removeHeaders?.enabled) return;

    for (const name of config.removeHeaders.headers) {
      if (name in headers) {
        delete headers[name];
        this.emit("headerRemoved", name);
      }
      // Also check lowercase
      const lower = name.toLowerCase();
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === lower) {
          delete headers[key];
          this.emit("headerRemoved", key);
        }
      }
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let defaultManager: SecurityHeadersManager | null = null;

export function getSecurityHeadersManager(): SecurityHeadersManager {
  if (!defaultManager) {
    defaultManager = new SecurityHeadersManager();
  }
  return defaultManager;
}

export function createSecurityHeadersManager(
  config: Partial<SecurityManagerConfig> = {}
): SecurityHeadersManager {
  const manager = new SecurityHeadersManager(config);
  if (!defaultManager) {
    defaultManager = manager;
  }
  return manager;
}

// =============================================================================
// Presets
// =============================================================================

export const SECURITY_PRESETS = {
  // Strict preset for APIs
  strict: {
    global: {
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameOptions: {
        enabled: true,
        value: "DENY" as const,
      },
      contentTypeOptions: {
        enabled: true,
        nosniff: true,
      },
      referrerPolicy: {
        enabled: true,
        policy: "no-referrer" as const,
      },
      cors: {
        enabled: true,
        origins: [] as string[],
        methods: ["GET" as const, "POST" as const, "PUT" as const, "DELETE" as const],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
        maxAge: 86400,
        preflightContinue: false,
        optionsSuccessStatus: 204,
        exposedHeaders: [],
      },
      removeHeaders: {
        enabled: true,
        headers: ["X-Powered-By", "Server"],
      },
      cacheControl: {
        enabled: true,
        directives: {
          noStore: true,
          noCache: true,
          mustRevalidate: true,
          private: true,
        },
      },
    },
  },

  // Relaxed preset for development
  development: {
    global: {
      cors: {
        enabled: true,
        origins: "*" as const,
        methods: ["GET" as const, "POST" as const, "PUT" as const, "PATCH" as const, "DELETE" as const, "OPTIONS" as const, "HEAD" as const],
        allowedHeaders: ["*"],
        credentials: true,
        maxAge: 0,
        preflightContinue: false,
        optionsSuccessStatus: 204,
        exposedHeaders: [],
      },
      hsts: {
        enabled: false,
        maxAge: 0,
        includeSubDomains: false,
        preload: false,
      },
    },
  },

  // Standard preset for production web apps
  standard: {
    global: {
      hsts: {
        enabled: true,
        maxAge: 31536000,
        includeSubDomains: true,
        preload: false,
      },
      frameOptions: {
        enabled: true,
        value: "SAMEORIGIN" as const,
      },
      contentTypeOptions: {
        enabled: true,
        nosniff: true,
      },
      referrerPolicy: {
        enabled: true,
        policy: "strict-origin-when-cross-origin" as const,
      },
      permissionsPolicy: {
        enabled: true,
        features: {
          geolocation: "none" as const,
          microphone: "none" as const,
          camera: "none" as const,
        },
      },
      removeHeaders: {
        enabled: true,
        headers: ["X-Powered-By", "Server"],
      },
    },
  },
} as const;

// =============================================================================
// CSP Builder
// =============================================================================

export class CSPBuilder {
  private directives: Record<string, string[]> = {};
  private reportOnly = false;
  private reportUri?: string;
  private reportTo?: string;
  private useNonce = false;

  defaultSrc(...sources: string[]): this {
    this.directives["default-src"] = sources;
    return this;
  }

  scriptSrc(...sources: string[]): this {
    this.directives["script-src"] = sources;
    return this;
  }

  styleSrc(...sources: string[]): this {
    this.directives["style-src"] = sources;
    return this;
  }

  imgSrc(...sources: string[]): this {
    this.directives["img-src"] = sources;
    return this;
  }

  fontSrc(...sources: string[]): this {
    this.directives["font-src"] = sources;
    return this;
  }

  connectSrc(...sources: string[]): this {
    this.directives["connect-src"] = sources;
    return this;
  }

  frameSrc(...sources: string[]): this {
    this.directives["frame-src"] = sources;
    return this;
  }

  frameAncestors(...sources: string[]): this {
    this.directives["frame-ancestors"] = sources;
    return this;
  }

  formAction(...sources: string[]): this {
    this.directives["form-action"] = sources;
    return this;
  }

  baseUri(...sources: string[]): this {
    this.directives["base-uri"] = sources;
    return this;
  }

  objectSrc(...sources: string[]): this {
    this.directives["object-src"] = sources;
    return this;
  }

  workerSrc(...sources: string[]): this {
    this.directives["worker-src"] = sources;
    return this;
  }

  upgradeInsecureRequests(): this {
    this.directives["upgrade-insecure-requests"] = [];
    return this;
  }

  blockAllMixedContent(): this {
    this.directives["block-all-mixed-content"] = [];
    return this;
  }

  withNonce(): this {
    this.useNonce = true;
    return this;
  }

  withReportUri(uri: string): this {
    this.reportUri = uri;
    return this;
  }

  withReportTo(endpoint: string): this {
    this.reportTo = endpoint;
    return this;
  }

  reportOnlyMode(): this {
    this.reportOnly = true;
    return this;
  }

  build(): CSPConfig {
    return {
      directives: this.directives as CSPConfig["directives"],
      reportOnly: this.reportOnly,
      reportUri: this.reportUri,
      reportTo: this.reportTo,
      nonce: this.useNonce,
    };
  }
}

export function csp(): CSPBuilder {
  return new CSPBuilder();
}
