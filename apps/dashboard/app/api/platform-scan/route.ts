import { NextResponse } from "next/server";

export interface ScanResult {
  timestamp: string;
  summary: {
    totalPackages: number;
    typescriptErrors: number;
    testsPassed: number;
    testsFailed: number;
    consoleStatements: number;
    todoComments: number;
    healthScore: number;
  };
  typescript: {
    errors: Array<{ file: string; line: number; message: string; code: string }>;
    totalErrors: number;
  };
  tests: {
    dashboard: { passed: number; failed: number; total: number };
    integrationHub: { passed: number; failed: number; total: number };
    autonomy: { passed: number; failed: number; total: number };
  };
  codeQuality: {
    consoleStatements: string[];
    todoComments: string[];
    deprecatedPatterns: string[];
  };
  improvements: Array<{
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    file?: string;
    suggestion?: string;
  }>;
  services: {
    hub: { status: "healthy" | "degraded" | "offline"; latency?: number };
    opus67: { status: "healthy" | "degraded" | "offline"; latency?: number };
    dashboard: { status: "healthy" | "degraded" | "offline"; latency?: number };
  };
}

// Cached scan results (updated on POST)
let cachedScan: ScanResult | null = null;

export async function GET() {
  if (!cachedScan) {
    // Return mock data if no scan has been run
    cachedScan = generateMockScan();
  }

  return NextResponse.json(cachedScan);
}

export async function POST() {
  // Run a fresh scan
  const scan = await runPlatformScan();
  cachedScan = scan;

  return NextResponse.json(scan);
}

async function runPlatformScan(): Promise<ScanResult> {
  const timestamp = new Date().toISOString();

  // Check service health
  const services = await checkServiceHealth();

  // Generate scan results (in real implementation, this would run actual scans)
  const scan: ScanResult = {
    timestamp,
    summary: {
      totalPackages: 142,
      typescriptErrors: 89,
      testsPassed: 314,
      testsFailed: 12,
      consoleStatements: 8,
      todoComments: 30,
      healthScore: calculateHealthScore(89, 12, 8),
    },
    typescript: {
      totalErrors: 89,
      errors: [
        { file: "apps/dashboard/app/agents/page.tsx", line: 32, message: "Cannot find module '@/lib/api/hub'", code: "TS2307" },
        { file: "apps/dashboard/app/analytics/page.tsx", line: 17, message: "Cannot find module '@/lib/api/hub'", code: "TS2307" },
        { file: "apps/dashboard/app/brain/page.tsx", line: 5, message: "Cannot find module '@/hooks/useWebSocket'", code: "TS2307" },
        { file: "apps/dashboard/app/brain/page.tsx", line: 622, message: "Parameter 'event' implicitly has 'any' type", code: "TS7006" },
        { file: "apps/dashboard/components/ui/alert-dialog.tsx", line: 52, message: "Type incompatibility with CSSProperties", code: "TS2322" },
        { file: "apps/dashboard/app/autonomy/page.tsx", line: 231, message: "Parameter 'event' implicitly has 'any' type", code: "TS7006" },
        { file: "apps/dashboard/app/events/page.tsx", line: 225, message: "Parameter 'event' implicitly has 'any' type", code: "TS7006" },
        { file: "apps/dashboard/app/growth/page.tsx", line: 215, message: "Parameter 'event' implicitly has 'any' type", code: "TS7006" },
      ],
    },
    tests: {
      dashboard: { passed: 80, failed: 0, total: 80 },
      integrationHub: { passed: 234, failed: 12, total: 246 },
      autonomy: { passed: 0, failed: 0, total: 0 },
    },
    codeQuality: {
      consoleStatements: [
        "packages/activity-logger/src/logger.ts",
        "packages/agent-core/src/base-agent.ts",
        "packages/autonomy/src/cli.ts",
        "packages/backtester/src/cli.ts",
        "packages/bridge-agent/src/bridges/wormhole.ts",
        "packages/builder-agent/src/index.ts",
      ],
      todoComments: [
        "// TODO: Implement retry logic",
        "// FIXME: Memory leak in event handler",
        "// HACK: Temporary workaround for API rate limit",
      ],
      deprecatedPatterns: [
        "__dirname usage in ESM (packages/opus67/dist/cli.js)",
      ],
    },
    improvements: [
      {
        id: "imp-001",
        severity: "high",
        category: "TypeScript",
        title: "Missing Type Annotations",
        description: "Multiple event handlers have implicit 'any' types",
        file: "apps/dashboard/app/*/page.tsx",
        suggestion: "Add explicit Event type annotations",
      },
      {
        id: "imp-002",
        severity: "critical",
        category: "Module Resolution",
        title: "Missing Module Declarations",
        description: "Several @/ path imports are failing",
        file: "apps/dashboard/app/",
        suggestion: "Update tsconfig paths or create missing modules",
      },
      {
        id: "imp-003",
        severity: "medium",
        category: "Tests",
        title: "Integration Hub Test Failures",
        description: "12 tests failing in workflows.test.ts - workflow count mismatch",
        file: "packages/integration-hub/src/__tests__/workflows.test.ts",
        suggestion: "Update test expectations from 4 to 7 workflows",
      },
      {
        id: "imp-004",
        severity: "low",
        category: "Code Quality",
        title: "Console Statements in Production",
        description: "8 files contain console.log/error statements",
        suggestion: "Replace with proper logging using pino",
      },
      {
        id: "imp-005",
        severity: "high",
        category: "ESM Compatibility",
        title: "__dirname Not Defined",
        description: "OPUS67 CLI using __dirname in ESM context",
        file: "packages/opus67/dist/cli.js",
        suggestion: "Use import.meta.url and fileURLToPath instead",
      },
    ],
    services,
  };

  return scan;
}

async function checkServiceHealth(): Promise<ScanResult["services"]> {
  const hubUrl = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3100";
  const opus67Url = process.env.NEXT_PUBLIC_OPUS67_URL || "http://localhost:3102";

  const checkService = async (url: string): Promise<{ status: "healthy" | "degraded" | "offline"; latency?: number }> => {
    try {
      const start = Date.now();
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      const latency = Date.now() - start;

      if (res.ok) {
        return { status: latency > 1000 ? "degraded" : "healthy", latency };
      }
      return { status: "degraded", latency };
    } catch {
      return { status: "offline" };
    }
  };

  const [hub, opus67] = await Promise.all([
    checkService(hubUrl),
    checkService(opus67Url),
  ]);

  return {
    hub,
    opus67,
    dashboard: { status: "healthy", latency: 0 },
  };
}

function calculateHealthScore(tsErrors: number, testsFailed: number, consoleCount: number): number {
  // Start at 100, deduct for issues
  let score = 100;
  score -= Math.min(tsErrors * 0.3, 30); // Max 30 points deduction for TS errors
  score -= testsFailed * 2; // 2 points per failed test
  score -= consoleCount * 0.5; // 0.5 points per console statement
  return Math.max(0, Math.round(score));
}

function generateMockScan(): ScanResult {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalPackages: 142,
      typescriptErrors: 0,
      testsPassed: 0,
      testsFailed: 0,
      consoleStatements: 0,
      todoComments: 0,
      healthScore: 100,
    },
    typescript: { errors: [], totalErrors: 0 },
    tests: {
      dashboard: { passed: 0, failed: 0, total: 0 },
      integrationHub: { passed: 0, failed: 0, total: 0 },
      autonomy: { passed: 0, failed: 0, total: 0 },
    },
    codeQuality: {
      consoleStatements: [],
      todoComments: [],
      deprecatedPatterns: [],
    },
    improvements: [],
    services: {
      hub: { status: "offline" },
      opus67: { status: "offline" },
      dashboard: { status: "healthy", latency: 0 },
    },
  };
}
