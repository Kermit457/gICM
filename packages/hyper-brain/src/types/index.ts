/**
 * HYPER BRAIN Types
 */

import { z } from "zod";

// ============================================================================
// SOURCE TYPES
// ============================================================================

export const SourceTypeSchema = z.enum([
  "onchain", "dex", "whale", "news", "social",
  "paper", "github", "blog", "docs", "tutorial",
  "twitter", "reddit", "discord", "hackernews",
  "producthunt", "competitor", "user_feedback"
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const ContentTypeSchema = z.enum([
  "article", "paper", "tweet", "post", "comment",
  "code", "documentation", "transaction", "event",
  "announcement", "analysis", "tutorial"
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

// ============================================================================
// RAW ITEM (from sources)
// ============================================================================

export const RawItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number(),
});
export type RawItem = z.infer<typeof RawItemSchema>;

// ============================================================================
// ENTITIES & RELATIONSHIPS
// ============================================================================

export const EntityTypeSchema = z.enum([
  "person", "company", "token", "technology", "concept", "event"
]);

export const EntitySchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  name: z.string(),
  aliases: z.array(z.string()),
  attributes: z.record(z.any()),
});
export type Entity = z.infer<typeof EntitySchema>;

export const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.string(),
  strength: z.number().min(0).max(1),
  evidence: z.array(z.string()),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

// ============================================================================
// KNOWLEDGE ITEM (processed)
// ============================================================================

export const KnowledgeItemSchema = z.object({
  id: z.string(),

  // Source
  source: z.object({
    type: SourceTypeSchema,
    name: z.string(),
    url: z.string().optional(),
    credibility: z.number().min(0).max(100),
  }),

  // Content
  content: z.object({
    raw: z.string(),
    summary: z.string(),
    type: ContentTypeSchema,
  }),

  // Embeddings
  embedding: z.array(z.number()),

  // Entities & Relationships
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),

  // Classification
  topics: z.array(z.string()),
  sentiment: z.number().min(-1).max(1),
  importance: z.number().min(0).max(100),

  // Temporal
  timestamp: z.number(),
  expiresAt: z.number().optional(),
  decayRate: z.number(),

  // Meta
  processed: z.boolean(),
  quality: z.number().min(0).max(100),
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

// ============================================================================
// PATTERNS
// ============================================================================

export const ConditionOperatorSchema = z.enum([">", "<", "==", "contains", "matches"]);

export const ConditionSchema = z.object({
  type: z.enum(["threshold", "sequence", "correlation", "absence"]),
  field: z.string(),
  operator: ConditionOperatorSchema,
  value: z.any(),
  timeframe: z.number().optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ActionSchema = z.object({
  type: z.string(),
  params: z.record(z.any()),
  priority: z.number().min(0).max(100),
});
export type Action = z.infer<typeof ActionSchema>;

export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  // Pattern definition
  conditions: z.array(ConditionSchema),

  // Performance
  occurrences: z.number(),
  accuracy: z.number(),
  lastSeen: z.number(),

  // Actions
  suggestedActions: z.array(ActionSchema),

  // Learning
  discovered: z.number(),
  confidence: z.number(),
  evolving: z.boolean(),
});
export type Pattern = z.infer<typeof PatternSchema>;

// ============================================================================
// PREDICTIONS
// ============================================================================

export const PredictionTypeSchema = z.enum(["market", "content", "product", "agent"]);
export type PredictionType = z.infer<typeof PredictionTypeSchema>;

export const PredictionSchema = z.object({
  id: z.string(),
  type: PredictionTypeSchema,

  // Prediction
  prediction: z.object({
    outcome: z.string(),
    probability: z.number().min(0).max(1),
    confidence: z.number().min(0).max(100),
    timeframe: z.number(),
  }),

  // Basis
  basis: z.object({
    patterns: z.array(z.string()),
    knowledge: z.array(z.string()),
    reasoning: z.string(),
  }),

  // Tracking
  madeAt: z.number(),
  expiresAt: z.number(),
  outcome: z.object({
    correct: z.boolean(),
    actual: z.string(),
    evaluatedAt: z.number(),
  }).optional(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

// ============================================================================
// AGENT EVOLUTION
// ============================================================================

export const AgentEvolutionSchema = z.object({
  agentId: z.string(),
  currentVersion: z.string(),

  history: z.array(z.object({
    version: z.string(),
    successRate: z.number(),
    avgSpeed: z.number(),
    userSatisfaction: z.number(),
    timestamp: z.number(),
  })),

  variants: z.array(z.object({
    id: z.string(),
    changes: z.array(z.string()),
    performance: z.number(),
    sampleSize: z.number(),
  })),

  successfulMutations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    improvement: z.number(),
    appliedAt: z.number(),
  })),

  evolutionRate: z.number(),
  autoEvolve: z.boolean(),
});
export type AgentEvolution = z.infer<typeof AgentEvolutionSchema>;

// ============================================================================
// DATA SOURCE CONFIG
// ============================================================================

export interface DataSourceConfig {
  name: string;
  type: SourceType;
  interval: number; // ms
  enabled: boolean;
  priority: number;
  rateLimit?: {
    requests: number;
    window: number; // ms
  };
}

// ============================================================================
// BRAIN CONFIG
// ============================================================================

export interface BrainConfig {
  // API Keys
  anthropicApiKey?: string;
  openaiApiKey?: string;
  heliusApiKey?: string;
  twitterBearerToken?: string;

  // Storage
  vectorDb: "pinecone" | "qdrant" | "local";
  graphDb: "neo4j" | "local";

  // Processing
  embeddingModel: string;
  maxConcurrentIngests: number;

  // API
  apiPort: number;
  enableApi: boolean;
  enableWebSocket: boolean;
}

// ============================================================================
// BRAIN STATS
// ============================================================================

export interface BrainStats {
  knowledge: {
    total: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
  };
  patterns: {
    total: number;
    active: number;
    accuracy: number;
  };
  predictions: {
    total: number;
    correct: number;
    accuracy: number;
    pending: number;
  };
  wins: {
    total: number;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
  };
  ingestion: {
    totalIngested: number;
    last24h: number;
    errors: number;
    lastRun: Record<string, number>;
  };
}

// ============================================================================
// SEARCH RESULT
// ============================================================================

export interface SearchResult extends KnowledgeItem {
  score: number;
}
