/**
 * Processing Pipeline
 *
 * Transforms raw items into rich knowledge.
 */

import { EmbeddingGenerator } from "./embeddings.js";
import { EntityExtractor } from "./entities.js";
import { ContentSummarizer } from "./summarizer.js";
import { ContentClassifier } from "./classifier.js";
import { Logger } from "../utils/logger.js";
import { SOURCE_CREDIBILITY, DECAY_RATES } from "../config.js";
import type { KnowledgeItem, RawItem, ContentType, SourceType } from "../types/index.js";

export class ProcessingPipeline {
  private embedder: EmbeddingGenerator;
  private entityExtractor: EntityExtractor;
  private summarizer: ContentSummarizer;
  private classifier: ContentClassifier;
  private logger = new Logger("Processing");

  constructor() {
    this.embedder = new EmbeddingGenerator();
    this.entityExtractor = new EntityExtractor();
    this.summarizer = new ContentSummarizer();
    this.classifier = new ContentClassifier();
  }

  /**
   * Process raw item into rich knowledge
   */
  async process(raw: RawItem): Promise<KnowledgeItem> {
    this.logger.debug(`Processing: ${raw.id}`);

    // Run processing steps in parallel where possible
    const [embedding, entities, summary, classification] = await Promise.all([
      this.embedder.embed(raw.content),
      this.entityExtractor.extract(raw.content),
      this.summarizer.summarize(raw.content),
      Promise.resolve(this.classifier.classify(raw.content)),
    ]);

    const sourceType = this.getSourceType(raw.source);
    const contentType = this.getContentType(raw.type);

    return {
      id: raw.id,
      source: {
        type: sourceType,
        name: raw.source,
        url: raw.metadata?.url as string | undefined,
        credibility: SOURCE_CREDIBILITY[raw.source] || 50,
      },
      content: {
        raw: raw.content,
        summary,
        type: contentType,
      },
      embedding,
      entities,
      relationships: [], // Relationships are mapped in a separate step
      topics: classification.topics,
      sentiment: classification.sentiment,
      importance: classification.importance,
      timestamp: raw.timestamp,
      decayRate: DECAY_RATES[raw.source] || 0.5,
      processed: true,
      quality: this.assessQuality(raw, classification),
    };
  }

  /**
   * Process multiple items
   */
  async processBatch(items: RawItem[]): Promise<KnowledgeItem[]> {
    const results: KnowledgeItem[] = [];

    for (const item of items) {
      try {
        const processed = await this.process(item);
        results.push(processed);
      } catch (error) {
        this.logger.error(`Failed to process ${item.id}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get source type from string
   */
  private getSourceType(source: string): SourceType {
    const mapping: Record<string, SourceType> = {
      helius: "onchain",
      pumpfun: "onchain",
      twitter: "twitter",
      hackernews: "hackernews",
      arxiv: "paper",
      github: "github",
      producthunt: "producthunt",
    };
    return mapping[source] || "social";
  }

  /**
   * Get content type from string
   */
  private getContentType(type: string): ContentType {
    const mapping: Record<string, ContentType> = {
      token_launch: "event",
      transaction: "transaction",
      tweet: "tweet",
      post: "post",
      paper: "paper",
      code: "code",
      announcement: "announcement",
    };
    return mapping[type] || "article";
  }

  /**
   * Assess content quality (0-100)
   */
  private assessQuality(
    raw: RawItem,
    classification: { confidence: number; importance: number }
  ): number {
    let quality = 50;

    // Content length
    if (raw.content.length > 100) quality += 5;
    if (raw.content.length > 500) quality += 10;
    if (raw.content.length > 2000) quality += 5;

    // Engagement (if available)
    const metadata = raw.metadata || {};
    if (typeof metadata.likes === "number" && metadata.likes > 100) quality += 10;
    if (typeof metadata.retweets === "number" && metadata.retweets > 50) quality += 10;
    if (typeof metadata.score === "number" && metadata.score > 100) quality += 15;
    if (typeof metadata.stars === "number" && metadata.stars > 50) quality += 10;

    // Classification confidence
    quality += classification.confidence * 10;

    // Source credibility
    quality += (SOURCE_CREDIBILITY[raw.source] || 50) / 10;

    return Math.min(100, Math.max(0, quality));
  }

  /**
   * Get embedding generator
   */
  getEmbedder(): EmbeddingGenerator {
    return this.embedder;
  }

  /**
   * Get entity extractor
   */
  getEntityExtractor(): EntityExtractor {
    return this.entityExtractor;
  }
}

// Re-exports
export { EmbeddingGenerator } from "./embeddings.js";
export { EntityExtractor } from "./entities.js";
export { ContentSummarizer } from "./summarizer.js";
export { ContentClassifier, type Classification } from "./classifier.js";
