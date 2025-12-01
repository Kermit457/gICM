/**
 * Content Summarizer
 *
 * Summarizes content for quick retrieval.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Logger } from "../utils/logger.js";

export class ContentSummarizer {
  private anthropic: Anthropic | null = null;
  private logger = new Logger("Summarizer");
  private cache: Map<string, string> = new Map();

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic();
    }
  }

  /**
   * Summarize text content
   */
  async summarize(text: string, maxLength: number = 200): Promise<string> {
    // Short text doesn't need summarization
    if (text.length <= maxLength) {
      return text;
    }

    // Check cache
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let summary: string;

    if (this.anthropic && text.length > 500) {
      summary = await this.summarizeWithLLM(text, maxLength);
    } else {
      summary = this.summarizeSimple(text, maxLength);
    }

    // Cache
    this.cache.set(cacheKey, summary);

    return summary;
  }

  /**
   * Summarize using Claude
   */
  private async summarizeWithLLM(text: string, maxLength: number): Promise<string> {
    try {
      const response = await this.anthropic!.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `Summarize this in ${maxLength} characters or less. Be concise and capture the key point:

${text.slice(0, 3000)}

Summary:`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text.slice(0, maxLength);
      }
    } catch (error) {
      this.logger.error(`LLM summarization failed: ${error}`);
    }

    // Fallback to simple summarization
    return this.summarizeSimple(text, maxLength);
  }

  /**
   * Simple extractive summarization
   */
  private summarizeSimple(text: string, maxLength: number): string {
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    if (sentences.length === 0) {
      return text.slice(0, maxLength);
    }

    // Score sentences by position and length
    const scored = sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      score: this.scoreSentence(sentence, index, sentences.length),
    }));

    // Sort by score and take top sentences
    scored.sort((a, b) => b.score - a.score);

    // Build summary
    let summary = "";
    for (const { sentence } of scored) {
      if (summary.length + sentence.length + 2 <= maxLength) {
        summary += (summary ? ". " : "") + sentence;
      } else {
        break;
      }
    }

    return summary || text.slice(0, maxLength);
  }

  /**
   * Score a sentence for importance
   */
  private scoreSentence(
    sentence: string,
    index: number,
    totalSentences: number
  ): number {
    let score = 0;

    // Position score (first and last sentences are often important)
    if (index === 0) score += 2;
    if (index === totalSentences - 1) score += 1;

    // Length score (not too short, not too long)
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 30) score += 1;

    // Keyword indicators
    const importantPatterns = [
      /\b(important|key|main|significant|notable)\b/i,
      /\b(announces?|launches?|releases?|introduces?)\b/i,
      /\b(first|new|latest|biggest|largest)\b/i,
      /\$[A-Z]+/,
      /\d+%/,
      /\$[\d,]+/,
    ];

    for (const pattern of importantPatterns) {
      if (pattern.test(sentence)) score += 0.5;
    }

    return score;
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
