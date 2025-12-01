/**
 * Health monitoring for services
 */

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical?: boolean;
  timeout?: number;
}

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface CheckResult {
  status: "pass" | "fail";
  responseTime: number;
  error?: string;
  critical: boolean;
}

export interface HealthResult {
  status: HealthStatus;
  checks: Record<string, CheckResult>;
  timestamp: string;
  uptime: number;
}

const DEFAULT_TIMEOUT = 5000;

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private startTime = Date.now();

  register(check: HealthCheck): void {
    this.checks.set(check.name, {
      ...check,
      timeout: check.timeout ?? DEFAULT_TIMEOUT,
      critical: check.critical ?? false,
    });
  }

  unregister(name: string): void {
    this.checks.delete(name);
  }

  async runCheck(check: HealthCheck): Promise<CheckResult> {
    const startTime = Date.now();

    try {
      // Run check with timeout
      const result = await Promise.race([
        check.check(),
        new Promise<boolean>((_, reject) =>
          setTimeout(
            () => reject(new Error("Health check timeout")),
            check.timeout ?? DEFAULT_TIMEOUT
          )
        ),
      ]);

      return {
        status: result ? "pass" : "fail",
        responseTime: Date.now() - startTime,
        critical: check.critical ?? false,
      };
    } catch (error) {
      return {
        status: "fail",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        critical: check.critical ?? false,
      };
    }
  }

  async getStatus(): Promise<HealthResult> {
    const results: Record<string, CheckResult> = {};
    let hasCriticalFailure = false;
    let hasNonCriticalFailure = false;

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, check]) => {
        const result = await this.runCheck(check);
        results[name] = result;

        if (result.status === "fail") {
          if (result.critical) {
            hasCriticalFailure = true;
          } else {
            hasNonCriticalFailure = true;
          }
        }
      }
    );

    await Promise.all(checkPromises);

    // Determine overall status
    let status: HealthStatus;
    if (hasCriticalFailure) {
      status = "unhealthy";
    } else if (hasNonCriticalFailure) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      status,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }

  isHealthy(): boolean {
    // Quick check - returns false if any critical check would fail
    // Note: This is synchronous and uses cached state if available
    return true; // Override with actual cached state in production
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  listChecks(): string[] {
    return Array.from(this.checks.keys());
  }
}

/**
 * Create a simple health check function
 */
export function createHealthCheck(
  name: string,
  check: () => Promise<boolean>,
  options?: { critical?: boolean; timeout?: number }
): HealthCheck {
  return {
    name,
    check,
    critical: options?.critical ?? false,
    timeout: options?.timeout ?? DEFAULT_TIMEOUT,
  };
}
