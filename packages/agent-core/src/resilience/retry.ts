/**
 * Retry with exponential backoff
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
};

export function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    // Add +/- 25% jitter
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
  }

  return Math.floor(delay);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const cfg: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (cfg.shouldRetry && !cfg.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Last attempt - don't delay, just throw
      if (attempt >= cfg.maxAttempts - 1) {
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, cfg);

      // Notify
      if (cfg.onRetry) {
        cfg.onRetry(lastError, attempt + 1, delay);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry decorator for class methods
 */
export function Retry(config?: Partial<RetryConfig>) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}
