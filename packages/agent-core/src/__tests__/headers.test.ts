import { describe, it, expect } from "vitest";
import {
  buildCspString,
  CSP_PRESETS,
  generateCorsHeaders,
  generateSecurityHeaders,
  SecurityHeadersMiddleware,
  SECURITY_PRESETS,
  generateNonce,
  addNonceToCsp,
  mergeCspDirectives,
  isOriginAllowed,
  createStaticFileHeaders,
} from "../security/headers.js";

describe("buildCspString", () => {
  it("builds CSP string from directives", () => {
    const directives = {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
    };

    const csp = buildCspString(directives);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it("handles boolean directives", () => {
    const directives = {
      "upgrade-insecure-requests": true,
      "block-all-mixed-content": true,
    };

    const csp = buildCspString(directives);

    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).toContain("block-all-mixed-content");
  });

  it("handles string directives", () => {
    const directives = {
      "report-uri": "https://example.com/csp-report",
    };

    const csp = buildCspString(directives);

    expect(csp).toContain("report-uri https://example.com/csp-report");
  });

  it("skips undefined directives", () => {
    const directives = {
      "default-src": ["'self'"],
      "script-src": undefined,
    };

    const csp = buildCspString(directives);

    expect(csp).toContain("default-src");
    expect(csp).not.toContain("script-src");
  });

  it("skips false boolean directives", () => {
    const directives = {
      "upgrade-insecure-requests": false,
    };

    const csp = buildCspString(directives);

    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

describe("CSP_PRESETS", () => {
  it("has strict preset", () => {
    expect(CSP_PRESETS.strict).toBeDefined();
    expect(CSP_PRESETS.strict["default-src"]).toContain("'self'");
    expect(CSP_PRESETS.strict["object-src"]).toContain("'none'");
  });

  it("has moderate preset", () => {
    expect(CSP_PRESETS.moderate).toBeDefined();
    expect(CSP_PRESETS.moderate["script-src"]).toContain("'unsafe-inline'");
  });

  it("has relaxed preset", () => {
    expect(CSP_PRESETS.relaxed).toBeDefined();
    expect(CSP_PRESETS.relaxed["script-src"]).toContain("'unsafe-eval'");
  });

  it("has api preset", () => {
    expect(CSP_PRESETS.api).toBeDefined();
    expect(CSP_PRESETS.api["default-src"]).toContain("'none'");
  });
});

describe("generateCorsHeaders", () => {
  it("allows any origin with wildcard", () => {
    const config = { allowedOrigins: "*" as const };
    const headers = generateCorsHeaders("https://example.com", config);

    expect(headers).not.toBeNull();
    expect(headers?.["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("returns specific origin when credentials are enabled", () => {
    const config = {
      allowedOrigins: "*" as const,
      credentials: true,
    };
    const headers = generateCorsHeaders("https://example.com", config);

    expect(headers?.["Access-Control-Allow-Origin"]).toBe("https://example.com");
    expect(headers?.["Access-Control-Allow-Credentials"]).toBe("true");
  });

  it("allows specific origins", () => {
    const config = {
      allowedOrigins: ["https://example.com", "https://other.com"],
    };

    const headers1 = generateCorsHeaders("https://example.com", config);
    expect(headers1?.["Access-Control-Allow-Origin"]).toBe("https://example.com");

    const headers2 = generateCorsHeaders("https://other.com", config);
    expect(headers2?.["Access-Control-Allow-Origin"]).toBe("https://other.com");
  });

  it("rejects disallowed origins", () => {
    const config = {
      allowedOrigins: ["https://allowed.com"],
    };

    const headers = generateCorsHeaders("https://not-allowed.com", config);
    expect(headers).toBeNull();
  });

  it("includes preflight headers", () => {
    const config = {
      allowedOrigins: "*" as const,
      allowedMethods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      maxAge: 3600,
    };

    const headers = generateCorsHeaders("https://example.com", config, true);

    expect(headers?.["Access-Control-Allow-Methods"]).toBe("GET, POST");
    expect(headers?.["Access-Control-Allow-Headers"]).toBe("Content-Type");
    expect(headers?.["Access-Control-Max-Age"]).toBe("3600");
  });

  it("includes exposed headers", () => {
    const config = {
      allowedOrigins: "*" as const,
      exposedHeaders: ["X-Custom-Header", "X-Another"],
    };

    const headers = generateCorsHeaders("https://example.com", config);

    expect(headers?.["Access-Control-Expose-Headers"]).toBe(
      "X-Custom-Header, X-Another"
    );
  });
});

describe("generateSecurityHeaders", () => {
  it("generates CSP header", () => {
    const config = {
      csp: CSP_PRESETS.strict,
    };

    const headers = generateSecurityHeaders(config);

    expect(headers["Content-Security-Policy"]).toBeDefined();
    expect(headers["Content-Security-Policy"]).toContain("default-src");
  });

  it("generates CSP report-only header", () => {
    const config = {
      csp: CSP_PRESETS.strict,
      cspReportOnly: true,
    };

    const headers = generateSecurityHeaders(config);

    expect(headers["Content-Security-Policy-Report-Only"]).toBeDefined();
    expect(headers["Content-Security-Policy"]).toBeUndefined();
  });

  it("generates HSTS header", () => {
    const config = {
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    };

    const headers = generateSecurityHeaders(config);

    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=31536000; includeSubDomains; preload"
    );
  });

  it("generates noSniff header", () => {
    const config = { noSniff: true };
    const headers = generateSecurityHeaders(config);

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("generates frame options header", () => {
    const config = { frameOptions: "DENY" as const };
    const headers = generateSecurityHeaders(config);

    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("generates XSS protection header", () => {
    const config = { xssProtection: true };
    const headers = generateSecurityHeaders(config);

    expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
  });

  it("generates referrer policy header", () => {
    const config = { referrerPolicy: "no-referrer" as const };
    const headers = generateSecurityHeaders(config);

    expect(headers["Referrer-Policy"]).toBe("no-referrer");
  });

  it("generates permissions policy header", () => {
    const config = {
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: ["self"],
      },
    };

    const headers = generateSecurityHeaders(config);

    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["Permissions-Policy"]).toContain("geolocation=(self)");
  });

  it("generates cross-origin headers", () => {
    const config = {
      coep: "require-corp" as const,
      coop: "same-origin" as const,
      corp: "same-origin" as const,
    };

    const headers = generateSecurityHeaders(config);

    expect(headers["Cross-Origin-Embedder-Policy"]).toBe("require-corp");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });
});

describe("SecurityHeadersMiddleware", () => {
  it("applies security headers to response", () => {
    const middleware = new SecurityHeadersMiddleware({
      noSniff: true,
      frameOptions: "DENY",
      xssProtection: true,
    });

    const request = { method: "GET", headers: {} };
    const response = { headers: { "Content-Type": "text/html" } };

    const result = middleware.apply(request, response);

    expect(result.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(result.headers["X-Frame-Options"]).toBe("DENY");
    expect(result.headers["Content-Type"]).toBe("text/html");
  });

  it("handles preflight requests", () => {
    const middleware = new SecurityHeadersMiddleware({
      cors: {
        allowedOrigins: ["https://example.com"],
        allowedMethods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      },
    });

    const request = {
      method: "OPTIONS",
      headers: { origin: "https://example.com" },
    };

    const response = middleware.handlePreflight(request);

    expect(response).not.toBeNull();
    expect(response?.statusCode).toBe(204);
    expect(response?.headers["Access-Control-Allow-Origin"]).toBe(
      "https://example.com"
    );
  });

  it("rejects preflight from disallowed origin", () => {
    const middleware = new SecurityHeadersMiddleware({
      cors: {
        allowedOrigins: ["https://allowed.com"],
      },
    });

    const request = {
      method: "OPTIONS",
      headers: { origin: "https://not-allowed.com" },
    };

    const response = middleware.handlePreflight(request);

    expect(response?.statusCode).toBe(403);
  });

  it("returns null for non-OPTIONS requests", () => {
    const middleware = new SecurityHeadersMiddleware({
      cors: { allowedOrigins: "*" },
    });

    const request = { method: "GET", headers: {} };
    const response = middleware.handlePreflight(request);

    expect(response).toBeNull();
  });

  it("returns config", () => {
    const middleware = new SecurityHeadersMiddleware({
      noSniff: true,
    });

    const config = middleware.getConfig();
    expect(config.noSniff).toBe(true);
  });
});

describe("SECURITY_PRESETS", () => {
  it("has strictApi preset", () => {
    expect(SECURITY_PRESETS.strictApi).toBeDefined();
    expect(SECURITY_PRESETS.strictApi.csp).toBeDefined();
    expect(SECURITY_PRESETS.strictApi.hsts?.preload).toBe(true);
  });

  it("has webApp preset", () => {
    expect(SECURITY_PRESETS.webApp).toBeDefined();
    expect(SECURITY_PRESETS.webApp.frameOptions).toBe("SAMEORIGIN");
  });

  it("has development preset", () => {
    expect(SECURITY_PRESETS.development).toBeDefined();
    expect(SECURITY_PRESETS.development.cspReportOnly).toBe(true);
    expect(SECURITY_PRESETS.development.cors?.credentials).toBe(true);
  });

  it("has publicApi preset", () => {
    expect(SECURITY_PRESETS.publicApi).toBeDefined();
    expect(SECURITY_PRESETS.publicApi.cors?.allowedOrigins).toBe("*");
  });
});

describe("generateNonce", () => {
  it("generates a base64 nonce", () => {
    const nonce = generateNonce();
    expect(nonce).toBeDefined();
    expect(nonce.length).toBeGreaterThan(0);
  });

  it("generates unique nonces", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
  });
});

describe("addNonceToCsp", () => {
  it("adds nonce to script-src and style-src by default", () => {
    const directives = {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
    };

    const result = addNonceToCsp(directives, "abc123");

    expect(result["script-src"]).toContain("'nonce-abc123'");
    expect(result["style-src"]).toContain("'nonce-abc123'");
  });

  it("adds nonce only to specified targets", () => {
    const directives = {
      "script-src": ["'self'"],
      "style-src": ["'self'"],
    };

    const result = addNonceToCsp(directives, "abc123", ["script-src"]);

    expect(result["script-src"]).toContain("'nonce-abc123'");
    expect(result["style-src"]).not.toContain("'nonce-abc123'");
  });

  it("creates directive if not exists", () => {
    const directives = {};
    const result = addNonceToCsp(directives, "abc123", ["script-src"]);

    expect(result["script-src"]).toContain("'nonce-abc123'");
  });
});

describe("mergeCspDirectives", () => {
  it("merges directives", () => {
    const base = {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
    };

    const override = {
      "script-src": ["https://cdn.example.com"],
      "img-src": ["data:"],
    };

    const result = mergeCspDirectives(base, override);

    expect(result["default-src"]).toEqual(["'self'"]);
    expect(result["script-src"]).toContain("'self'");
    expect(result["script-src"]).toContain("https://cdn.example.com");
    expect(result["img-src"]).toEqual(["data:"]);
  });

  it("preserves base when no override", () => {
    const base = {
      "default-src": ["'self'"],
      "object-src": ["'none'"],
    };

    const result = mergeCspDirectives(base, {});

    expect(result).toEqual(base);
  });
});

describe("isOriginAllowed", () => {
  it("allows any origin with wildcard", () => {
    expect(isOriginAllowed("https://any.com", "*")).toBe(true);
  });

  it("allows exact match", () => {
    const allowed = ["https://example.com", "https://other.com"];
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
  });

  it("rejects non-matching origin", () => {
    const allowed = ["https://example.com"];
    expect(isOriginAllowed("https://other.com", allowed)).toBe(false);
  });

  it("handles wildcard subdomains", () => {
    const allowed = ["*.example.com"];
    expect(isOriginAllowed("https://sub.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://deep.sub.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://example.com", allowed)).toBe(true);
    expect(isOriginAllowed("https://other.com", allowed)).toBe(false);
  });
});

describe("createStaticFileHeaders", () => {
  it("adds nosniff header for all content types", () => {
    const headers = createStaticFileHeaders("text/plain");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("adds caching headers for images", () => {
    const headers = createStaticFileHeaders("image/png");
    expect(headers["Cache-Control"]).toContain("max-age=31536000");
    expect(headers["Cache-Control"]).toContain("immutable");
  });

  it("adds caching headers for fonts", () => {
    const headers = createStaticFileHeaders("font/woff2");
    expect(headers["Cache-Control"]).toContain("max-age=31536000");
  });

  it("adds caching headers for JS", () => {
    const headers = createStaticFileHeaders("application/javascript");
    expect(headers["Cache-Control"]).toContain("max-age=31536000");
  });

  it("adds caching headers for CSS", () => {
    const headers = createStaticFileHeaders("text/css");
    expect(headers["Cache-Control"]).toContain("max-age=31536000");
  });

  it("adds security headers for HTML", () => {
    const headers = createStaticFileHeaders("text/html");
    expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
  });
});
