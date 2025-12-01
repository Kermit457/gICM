/**
 * Source Registry
 *
 * Manages all data sources.
 */

import { BaseSource } from "./base.js";
import { OnChainSource } from "./crypto/onchain.js";
import { ArxivSource } from "./ai/arxiv.js";
import { GitHubSource } from "./ai/github.js";
import { HackerNewsSource } from "./social/hackernews.js";
import { TwitterSource } from "./social/twitter.js";
import { ProductHuntSource } from "./business/producthunt.js";
import { Logger } from "../../utils/logger.js";

export class SourceRegistry {
  private sources: Map<string, BaseSource> = new Map();
  private logger = new Logger("SourceRegistry");

  /**
   * Register all available sources
   */
  async registerAll(): Promise<void> {
    // Crypto sources
    this.register(new OnChainSource());

    // AI sources
    this.register(new ArxivSource());
    this.register(new GitHubSource());

    // Social sources
    this.register(new HackerNewsSource());
    this.register(new TwitterSource());

    // Business sources
    this.register(new ProductHuntSource());

    this.logger.info(`Registered ${this.sources.size} data sources`);
  }

  /**
   * Register a single source
   */
  register(source: BaseSource): void {
    if (!source.enabled) {
      this.logger.info(`Source ${source.name} is disabled, skipping`);
      return;
    }

    this.sources.set(source.name, source);
    this.logger.info(`Registered source: ${source.name} (${source.type})`);
  }

  /**
   * Get a source by name
   */
  get(name: string): BaseSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Get all sources
   */
  getAll(): BaseSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get source count
   */
  count(): number {
    return this.sources.size;
  }

  /**
   * Get sources by type
   */
  getByType(type: string): BaseSource[] {
    return this.getAll().filter((s) => s.type === type);
  }

  /**
   * Get sources sorted by priority
   */
  getByPriority(): BaseSource[] {
    return this.getAll().sort((a, b) => b.priority - a.priority);
  }
}

// Re-export
export { BaseSource, type RawItem } from "./base.js";
export { OnChainSource } from "./crypto/onchain.js";
export { ArxivSource } from "./ai/arxiv.js";
export { GitHubSource } from "./ai/github.js";
export { HackerNewsSource } from "./social/hackernews.js";
export { TwitterSource } from "./social/twitter.js";
export { ProductHuntSource } from "./business/producthunt.js";
