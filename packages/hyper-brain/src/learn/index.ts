/**
 * Learning System
 *
 * Pattern recognition and self-improvement.
 */

import { Logger } from "../utils/logger.js";
import { StorageOrchestrator } from "../store/index.js";
import type { Pattern, KnowledgeItem, Condition, Action } from "../types/index.js";

export class LearningSystem {
  private storage: StorageOrchestrator;
  private logger = new Logger("Learning");

  constructor(storage: StorageOrchestrator) {
    this.storage = storage;
  }

  /**
   * Analyze knowledge for patterns
   */
  async analyzePatterns(): Promise<Pattern[]> {
    const knowledge = this.storage.getAllKnowledge();
    const discovered: Pattern[] = [];

    // Look for frequency patterns
    const frequencyPatterns = this.findFrequencyPatterns(knowledge);
    discovered.push(...frequencyPatterns);

    // Look for correlation patterns
    const correlationPatterns = this.findCorrelationPatterns(knowledge);
    discovered.push(...correlationPatterns);

    // Look for temporal patterns
    const temporalPatterns = this.findTemporalPatterns(knowledge);
    discovered.push(...temporalPatterns);

    // Store new patterns
    for (const pattern of discovered) {
      const existing = this.storage.getPattern(pattern.id);
      if (existing) {
        // Update existing pattern
        this.storage.updatePattern(pattern.id, {
          occurrences: existing.occurrences + pattern.occurrences,
          lastSeen: Date.now(),
          confidence: (existing.confidence + pattern.confidence) / 2,
        });
      } else {
        // Add new pattern
        this.storage.storePattern(pattern);
      }
    }

    this.logger.info(`Discovered ${discovered.length} patterns`);
    return discovered;
  }

  /**
   * Find frequency patterns (things that appear often together)
   */
  private findFrequencyPatterns(knowledge: KnowledgeItem[]): Pattern[] {
    const patterns: Pattern[] = [];
    const entityPairs: Map<string, number> = new Map();

    // Count entity co-occurrences
    for (const item of knowledge) {
      const entities = item.entities;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const key = [entities[i].id, entities[j].id].sort().join("|");
          entityPairs.set(key, (entityPairs.get(key) || 0) + 1);
        }
      }
    }

    // Convert frequent pairs to patterns
    for (const [key, count] of entityPairs) {
      if (count >= 3) {
        const [entity1, entity2] = key.split("|");
        patterns.push({
          id: `freq-${key}`,
          name: `Co-occurrence: ${entity1} + ${entity2}`,
          description: `${entity1} and ${entity2} frequently appear together`,
          conditions: [
            {
              type: "correlation",
              field: "entities",
              operator: "contains",
              value: [entity1, entity2],
            },
          ],
          occurrences: count,
          accuracy: 0.7,
          lastSeen: Date.now(),
          suggestedActions: [],
          discovered: Date.now(),
          confidence: Math.min(count / 10, 1),
          evolving: true,
        });
      }
    }

    return patterns;
  }

  /**
   * Find correlation patterns (topic + sentiment correlations)
   */
  private findCorrelationPatterns(knowledge: KnowledgeItem[]): Pattern[] {
    const patterns: Pattern[] = [];
    const topicSentiments: Map<string, number[]> = new Map();

    // Collect sentiment by topic
    for (const item of knowledge) {
      for (const topic of item.topics) {
        const sentiments = topicSentiments.get(topic) || [];
        sentiments.push(item.sentiment);
        topicSentiments.set(topic, sentiments);
      }
    }

    // Find topics with consistent sentiment
    for (const [topic, sentiments] of topicSentiments) {
      if (sentiments.length < 5) continue;

      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      const variance = sentiments.reduce((a, b) => a + Math.pow(b - avgSentiment, 2), 0) / sentiments.length;

      if (variance < 0.2 && Math.abs(avgSentiment) > 0.3) {
        const sentiment = avgSentiment > 0 ? "positive" : "negative";
        patterns.push({
          id: `corr-sentiment-${topic}`,
          name: `${topic} sentiment tendency`,
          description: `Topic "${topic}" tends to have ${sentiment} sentiment`,
          conditions: [
            {
              type: "correlation",
              field: "topics",
              operator: "contains",
              value: topic,
            },
            {
              type: "threshold",
              field: "sentiment",
              operator: avgSentiment > 0 ? ">" : "<",
              value: 0,
            },
          ],
          occurrences: sentiments.length,
          accuracy: 1 - variance,
          lastSeen: Date.now(),
          suggestedActions: [],
          discovered: Date.now(),
          confidence: Math.min(sentiments.length / 20, 1),
          evolving: true,
        });
      }
    }

    return patterns;
  }

  /**
   * Find temporal patterns (time-based trends)
   */
  private findTemporalPatterns(knowledge: KnowledgeItem[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Group by hour of day
    const hourlyTopics: Map<number, Map<string, number>> = new Map();

    for (const item of knowledge) {
      const hour = new Date(item.timestamp).getHours();
      const topics = hourlyTopics.get(hour) || new Map();

      for (const topic of item.topics) {
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }

      hourlyTopics.set(hour, topics);
    }

    // Find topics that peak at certain hours
    for (let hour = 0; hour < 24; hour++) {
      const topics = hourlyTopics.get(hour);
      if (!topics) continue;

      for (const [topic, count] of topics) {
        if (count < 5) continue;

        // Check if this hour has significantly more of this topic
        let totalOtherHours = 0;
        let otherHourCount = 0;

        for (let h = 0; h < 24; h++) {
          if (h === hour) continue;
          const otherTopics = hourlyTopics.get(h);
          if (otherTopics) {
            totalOtherHours += otherTopics.get(topic) || 0;
            otherHourCount++;
          }
        }

        const avgOther = totalOtherHours / Math.max(otherHourCount, 1);
        if (count > avgOther * 2) {
          patterns.push({
            id: `temporal-${topic}-${hour}`,
            name: `${topic} peaks at ${hour}:00`,
            description: `Topic "${topic}" appears more frequently around ${hour}:00`,
            conditions: [
              {
                type: "sequence",
                field: "timestamp",
                operator: "==",
                value: hour,
                timeframe: 3600000,
              },
              {
                type: "correlation",
                field: "topics",
                operator: "contains",
                value: topic,
              },
            ],
            occurrences: count,
            accuracy: 0.6,
            lastSeen: Date.now(),
            suggestedActions: [],
            discovered: Date.now(),
            confidence: Math.min(count / avgOther / 5, 1),
            evolving: true,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(): {
    total: number;
    active: number;
    avgAccuracy: number;
  } {
    const patterns = this.storage.getAllPatterns();
    const activePatterns = patterns.filter(
      (p) => Date.now() - p.lastSeen < 7 * 24 * 60 * 60 * 1000
    );

    const totalAccuracy = patterns.reduce((sum, p) => sum + p.accuracy, 0);

    return {
      total: patterns.length,
      active: activePatterns.length,
      avgAccuracy: patterns.length > 0 ? totalAccuracy / patterns.length : 0,
    };
  }

  /**
   * Match patterns against item
   */
  matchPatterns(item: KnowledgeItem): Pattern[] {
    const patterns = this.storage.getAllPatterns();
    const matched: Pattern[] = [];

    for (const pattern of patterns) {
      if (this.matchesConditions(item, pattern.conditions)) {
        matched.push(pattern);
      }
    }

    return matched;
  }

  /**
   * Check if item matches conditions
   */
  private matchesConditions(item: KnowledgeItem, conditions: Condition[]): boolean {
    for (const condition of conditions) {
      if (!this.matchesCondition(item, condition)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check single condition
   */
  private matchesCondition(item: KnowledgeItem, condition: Condition): boolean {
    const value = this.getFieldValue(item, condition.field);

    switch (condition.operator) {
      case ">":
        return typeof value === "number" && value > condition.value;
      case "<":
        return typeof value === "number" && value < condition.value;
      case "==":
        return value === condition.value;
      case "contains":
        if (Array.isArray(value)) {
          if (Array.isArray(condition.value)) {
            return condition.value.every((v: unknown) => value.includes(v));
          }
          return value.includes(condition.value);
        }
        if (typeof value === "string") {
          return value.includes(condition.value);
        }
        return false;
      case "matches":
        if (typeof value === "string") {
          return new RegExp(condition.value).test(value);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Get field value from item
   */
  private getFieldValue(item: KnowledgeItem, field: string): unknown {
    const parts = field.split(".");
    let value: unknown = item;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}
