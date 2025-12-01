/**
 * Retrieval System
 *
 * Semantic search and hybrid retrieval.
 */

import { Logger } from "../utils/logger.js";
import { StorageOrchestrator } from "../store/index.js";
import { EmbeddingGenerator } from "../process/embeddings.js";
import type { KnowledgeItem, SearchResult } from "../types/index.js";

export interface RetrievalOptions {
  limit?: number;
  minScore?: number;
  filters?: {
    sources?: string[];
    topics?: string[];
    after?: number;
    before?: number;
    minImportance?: number;
  };
  rerank?: boolean;
}

export class RetrievalSystem {
  private storage: StorageOrchestrator;
  private embedder: EmbeddingGenerator;
  private logger = new Logger("Retrieval");

  constructor(storage: StorageOrchestrator, embedder: EmbeddingGenerator) {
    this.storage = storage;
    this.embedder = embedder;
  }

  /**
   * Search by text query
   */
  async search(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.3;

    // Semantic search
    let results = await this.storage.searchKnowledge(query, this.embedder, limit * 2);

    // Apply filters
    if (options.filters) {
      results = this.applyFilters(results, options.filters);
    }

    // Filter by min score
    results = results.filter((r) => r.score >= minScore);

    // Rerank if requested
    if (options.rerank) {
      results = await this.rerank(query, results);
    }

    return results.slice(0, limit);
  }

  /**
   * Hybrid search (semantic + keyword)
   */
  async hybridSearch(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 10;

    // Semantic search
    const semanticResults = await this.search(query, { ...options, limit: limit * 2 });

    // Keyword search
    const keywordResults = this.keywordSearch(query, limit * 2);

    // Merge and deduplicate
    const merged = this.mergeResults(semanticResults, keywordResults);

    // Apply filters
    let results = options.filters
      ? this.applyFilters(merged, options.filters)
      : merged;

    // Rerank
    if (options.rerank) {
      results = await this.rerank(query, results);
    }

    return results.slice(0, limit);
  }

  /**
   * Get similar items
   */
  async getSimilar(itemId: string, limit: number = 10): Promise<SearchResult[]> {
    const item = this.storage.getKnowledge(itemId);
    if (!item) return [];

    return this.storage.searchByEmbedding(item.embedding, limit + 1).then((results) =>
      results.filter((r) => r.id !== itemId).slice(0, limit)
    );
  }

  /**
   * Get by topic
   */
  getByTopic(topic: string, limit: number = 20): KnowledgeItem[] {
    return this.storage
      .filterKnowledge((item) => item.topics.includes(topic))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Get by source
   */
  getBySource(source: string, limit: number = 20): KnowledgeItem[] {
    return this.storage
      .filterKnowledge((item) => item.source.name === source)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get recent items
   */
  getRecent(limit: number = 20): KnowledgeItem[] {
    return this.storage
      .getAllKnowledge()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get important items
   */
  getImportant(limit: number = 20): KnowledgeItem[] {
    return this.storage
      .getAllKnowledge()
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Keyword search
   */
  private keywordSearch(query: string, limit: number): SearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    for (const item of this.storage.getAllKnowledge()) {
      const content = item.content.raw.toLowerCase();
      let matchCount = 0;

      for (const word of queryWords) {
        if (content.includes(word)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = matchCount / queryWords.length;
        results.push({ ...item, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Merge and deduplicate results
   */
  private mergeResults(
    semantic: SearchResult[],
    keyword: SearchResult[]
  ): SearchResult[] {
    const merged = new Map<string, SearchResult>();

    // Add semantic results with higher weight
    for (const result of semantic) {
      merged.set(result.id, { ...result, score: result.score * 0.7 });
    }

    // Add keyword results
    for (const result of keyword) {
      const existing = merged.get(result.id);
      if (existing) {
        // Boost score if found in both
        existing.score += result.score * 0.3;
      } else {
        merged.set(result.id, { ...result, score: result.score * 0.3 });
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Apply filters to results
   */
  private applyFilters(
    results: SearchResult[],
    filters: RetrievalOptions["filters"]
  ): SearchResult[] {
    if (!filters) return results;

    return results.filter((result) => {
      if (filters.sources && !filters.sources.includes(result.source.name)) {
        return false;
      }
      if (filters.topics && !filters.topics.some((t) => result.topics.includes(t))) {
        return false;
      }
      if (filters.after && result.timestamp < filters.after) {
        return false;
      }
      if (filters.before && result.timestamp > filters.before) {
        return false;
      }
      if (filters.minImportance && result.importance < filters.minImportance) {
        return false;
      }
      return true;
    });
  }

  /**
   * Rerank results (simple implementation)
   */
  private async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    // Simple reranking based on:
    // 1. Recency boost
    // 2. Importance boost
    // 3. Quality boost

    const now = Date.now();
    const oneDay = 86400000;

    return results
      .map((result) => {
        let score = result.score;

        // Recency boost (items from last 24h get up to 20% boost)
        const age = now - result.timestamp;
        if (age < oneDay) {
          score *= 1 + 0.2 * (1 - age / oneDay);
        }

        // Importance boost (up to 15%)
        score *= 1 + (result.importance / 100) * 0.15;

        // Quality boost (up to 10%)
        score *= 1 + (result.quality / 100) * 0.1;

        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score);
  }
}
