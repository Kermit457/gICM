/**
 * Base Data Source
 *
 * Abstract base class for all data sources.
 */

import { Logger } from "../../utils/logger.js";
import type { RawItem, SourceType, DataSourceConfig } from "../../types/index.js";

export abstract class BaseSource implements DataSourceConfig {
  abstract name: string;
  abstract type: SourceType;
  abstract interval: number;

  enabled: boolean = true;
  priority: number = 50;
  rateLimit?: { requests: number; window: number };

  protected logger: Logger;
  protected requestCount: number = 0;
  protected windowStart: number = Date.now();

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Fetch raw items from this source
   */
  abstract fetch(): Promise<RawItem[]>;

  /**
   * Check if rate limit allows request
   */
  protected checkRateLimit(): boolean {
    if (!this.rateLimit) return true;

    const now = Date.now();
    if (now - this.windowStart > this.rateLimit.window) {
      // Reset window
      this.windowStart = now;
      this.requestCount = 0;
    }

    if (this.requestCount >= this.rateLimit.requests) {
      this.logger.warn(`Rate limit reached for ${this.name}`);
      return false;
    }

    this.requestCount++;
    return true;
  }

  /**
   * Make a rate-limited fetch request
   */
  protected async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    if (!this.checkRateLimit()) {
      throw new Error(`Rate limit exceeded for ${this.name}`);
    }
    return fetch(url, options);
  }

  /**
   * Generate unique ID for item
   */
  protected generateId(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Get source config
   */
  getConfig(): DataSourceConfig {
    return {
      name: this.name,
      type: this.type,
      interval: this.interval,
      enabled: this.enabled,
      priority: this.priority,
      rateLimit: this.rateLimit,
    };
  }
}

export { RawItem };
