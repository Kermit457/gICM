/**
 * Entity Extractor
 *
 * Extracts entities (people, companies, tokens, etc.) from content.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Logger } from "../utils/logger.js";
import type { Entity } from "../types/index.js";

export class EntityExtractor {
  private anthropic: Anthropic | null = null;
  private logger = new Logger("EntityExtractor");
  private cache: Map<string, Entity[]> = new Map();

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
  }

  /**
   * Extract entities from text
   */
  async extract(text: string): Promise<Entity[]> {
    // Check cache
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Use LLM or fallback to regex-based extraction
    let entities: Entity[];
    if (this.anthropic && text.length > 100) {
      entities = await this.extractWithLLM(text);
    } else {
      entities = this.extractWithRegex(text);
    }

    // Cache
    this.cache.set(cacheKey, entities);

    return entities;
  }

  /**
   * Extract entities using Claude
   */
  private async extractWithLLM(text: string): Promise<Entity[]> {
    try {
      const response = await this.anthropic!.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Extract entities from this text. Return as JSON array with format: [{"type": "person|company|token|technology|concept|event", "name": "...", "aliases": [...]}]

Text: ${text.slice(0, 2000)}

JSON:`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        // Parse JSON from response
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Array<{
            type: string;
            name: string;
            aliases?: string[];
          }>;

          return parsed.map((e, i) => ({
            id: `entity-${i}-${e.name.toLowerCase().replace(/\s+/g, "-")}`,
            type: e.type as Entity["type"],
            name: e.name,
            aliases: e.aliases || [],
            attributes: {},
          }));
        }
      }
    } catch (error) {
      this.logger.error(`LLM extraction failed: ${error}`);
    }

    // Fallback to regex
    return this.extractWithRegex(text);
  }

  /**
   * Extract entities using regex patterns
   */
  private extractWithRegex(text: string): Entity[] {
    const entities: Entity[] = [];
    const seen = new Set<string>();

    // Token patterns ($SOL, $BTC, etc.)
    const tokenPattern = /\$([A-Z]{2,10})\b/g;
    let match;
    while ((match = tokenPattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        entities.push({
          id: `token-${name.toLowerCase()}`,
          type: "token",
          name,
          aliases: [`$${name}`],
          attributes: {},
        });
      }
    }

    // Technology patterns
    const techPatterns = [
      /\b(GPT-\d+|Claude|Gemini|LLaMA|Mistral|Anthropic|OpenAI|DeepMind)\b/gi,
      /\b(Solana|Ethereum|Bitcoin|Polygon|Arbitrum|Base)\b/gi,
      /\b(React|Next\.js|TypeScript|Python|Rust|Go)\b/gi,
      /\b(Jupiter|Raydium|Uniswap|Aave|pump\.fun)\b/gi,
    ];

    for (const pattern of techPatterns) {
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const normalizedName = name.toLowerCase();
        if (!seen.has(normalizedName)) {
          seen.add(normalizedName);
          entities.push({
            id: `tech-${normalizedName.replace(/[.\s]/g, "-")}`,
            type: "technology",
            name,
            aliases: [],
            attributes: {},
          });
        }
      }
    }

    // Company patterns (basic)
    const companyPatterns = [
      /\b(Anthropic|OpenAI|Google|Meta|Microsoft|Apple|Tesla|NVIDIA)\b/gi,
      /\b(Coinbase|Binance|FTX|Alameda|a16z|Sequoia)\b/gi,
    ];

    for (const pattern of companyPatterns) {
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1];
        const normalizedName = name.toLowerCase();
        if (!seen.has(normalizedName)) {
          seen.add(normalizedName);
          entities.push({
            id: `company-${normalizedName}`,
            type: "company",
            name,
            aliases: [],
            attributes: {},
          });
        }
      }
    }

    // Person patterns (Twitter handles, etc.)
    const personPattern = /@([A-Za-z0-9_]{1,15})\b/g;
    while ((match = personPattern.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name.toLowerCase()) && name.length > 2) {
        seen.add(name.toLowerCase());
        entities.push({
          id: `person-${name.toLowerCase()}`,
          type: "person",
          name: `@${name}`,
          aliases: [name],
          attributes: {},
        });
      }
    }

    return entities;
  }

  /**
   * Simple text hash for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 500); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
