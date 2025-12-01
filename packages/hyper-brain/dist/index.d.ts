import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';

/**
 * HYPER BRAIN Logger
 */
declare class Logger {
    private logger;
    private prefix;
    constructor(prefix: string);
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
    debug(message: string, data?: Record<string, unknown>): void;
    child(bindings: Record<string, unknown>): Logger;
}

/**
 * HYPER BRAIN Types
 */

declare const SourceTypeSchema: z.ZodEnum<["onchain", "dex", "whale", "news", "social", "paper", "github", "blog", "docs", "tutorial", "twitter", "reddit", "discord", "hackernews", "producthunt", "competitor", "user_feedback"]>;
type SourceType = z.infer<typeof SourceTypeSchema>;
declare const ContentTypeSchema: z.ZodEnum<["article", "paper", "tweet", "post", "comment", "code", "documentation", "transaction", "event", "announcement", "analysis", "tutorial"]>;
type ContentType = z.infer<typeof ContentTypeSchema>;
declare const RawItemSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    type: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    source: string;
    content: string;
    timestamp: number;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    type: string;
    source: string;
    content: string;
    timestamp: number;
    metadata?: Record<string, any> | undefined;
}>;
type RawItem = z.infer<typeof RawItemSchema>;
declare const EntityTypeSchema: z.ZodEnum<["person", "company", "token", "technology", "concept", "event"]>;
declare const EntitySchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["person", "company", "token", "technology", "concept", "event"]>;
    name: z.ZodString;
    aliases: z.ZodArray<z.ZodString, "many">;
    attributes: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "event" | "person" | "company" | "token" | "technology" | "concept";
    name: string;
    aliases: string[];
    attributes: Record<string, any>;
}, {
    id: string;
    type: "event" | "person" | "company" | "token" | "technology" | "concept";
    name: string;
    aliases: string[];
    attributes: Record<string, any>;
}>;
type Entity = z.infer<typeof EntitySchema>;
declare const RelationshipSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    type: z.ZodString;
    strength: z.ZodNumber;
    evidence: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: string;
    from: string;
    to: string;
    strength: number;
    evidence: string[];
}, {
    type: string;
    from: string;
    to: string;
    strength: number;
    evidence: string[];
}>;
type Relationship = z.infer<typeof RelationshipSchema>;
declare const KnowledgeItemSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodObject<{
        type: z.ZodEnum<["onchain", "dex", "whale", "news", "social", "paper", "github", "blog", "docs", "tutorial", "twitter", "reddit", "discord", "hackernews", "producthunt", "competitor", "user_feedback"]>;
        name: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        credibility: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "onchain" | "dex" | "whale" | "news" | "social" | "paper" | "github" | "blog" | "docs" | "tutorial" | "twitter" | "reddit" | "discord" | "hackernews" | "producthunt" | "competitor" | "user_feedback";
        name: string;
        credibility: number;
        url?: string | undefined;
    }, {
        type: "onchain" | "dex" | "whale" | "news" | "social" | "paper" | "github" | "blog" | "docs" | "tutorial" | "twitter" | "reddit" | "discord" | "hackernews" | "producthunt" | "competitor" | "user_feedback";
        name: string;
        credibility: number;
        url?: string | undefined;
    }>;
    content: z.ZodObject<{
        raw: z.ZodString;
        summary: z.ZodString;
        type: z.ZodEnum<["article", "paper", "tweet", "post", "comment", "code", "documentation", "transaction", "event", "announcement", "analysis", "tutorial"]>;
    }, "strip", z.ZodTypeAny, {
        type: "code" | "paper" | "tutorial" | "article" | "tweet" | "post" | "comment" | "documentation" | "transaction" | "event" | "announcement" | "analysis";
        raw: string;
        summary: string;
    }, {
        type: "code" | "paper" | "tutorial" | "article" | "tweet" | "post" | "comment" | "documentation" | "transaction" | "event" | "announcement" | "analysis";
        raw: string;
        summary: string;
    }>;
    embedding: z.ZodArray<z.ZodNumber, "many">;
    entities: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["person", "company", "token", "technology", "concept", "event"]>;
        name: z.ZodString;
        aliases: z.ZodArray<z.ZodString, "many">;
        attributes: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "event" | "person" | "company" | "token" | "technology" | "concept";
        name: string;
        aliases: string[];
        attributes: Record<string, any>;
    }, {
        id: string;
        type: "event" | "person" | "company" | "token" | "technology" | "concept";
        name: string;
        aliases: string[];
        attributes: Record<string, any>;
    }>, "many">;
    relationships: z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        type: z.ZodString;
        strength: z.ZodNumber;
        evidence: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        type: string;
        from: string;
        to: string;
        strength: number;
        evidence: string[];
    }, {
        type: string;
        from: string;
        to: string;
        strength: number;
        evidence: string[];
    }>, "many">;
    topics: z.ZodArray<z.ZodString, "many">;
    sentiment: z.ZodNumber;
    importance: z.ZodNumber;
    timestamp: z.ZodNumber;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    decayRate: z.ZodNumber;
    processed: z.ZodBoolean;
    quality: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topics: string[];
    id: string;
    source: {
        type: "onchain" | "dex" | "whale" | "news" | "social" | "paper" | "github" | "blog" | "docs" | "tutorial" | "twitter" | "reddit" | "discord" | "hackernews" | "producthunt" | "competitor" | "user_feedback";
        name: string;
        credibility: number;
        url?: string | undefined;
    };
    content: {
        type: "code" | "paper" | "tutorial" | "article" | "tweet" | "post" | "comment" | "documentation" | "transaction" | "event" | "announcement" | "analysis";
        raw: string;
        summary: string;
    };
    embedding: number[];
    entities: {
        id: string;
        type: "event" | "person" | "company" | "token" | "technology" | "concept";
        name: string;
        aliases: string[];
        attributes: Record<string, any>;
    }[];
    relationships: {
        type: string;
        from: string;
        to: string;
        strength: number;
        evidence: string[];
    }[];
    sentiment: number;
    importance: number;
    timestamp: number;
    decayRate: number;
    processed: boolean;
    quality: number;
    expiresAt?: number | undefined;
}, {
    topics: string[];
    id: string;
    source: {
        type: "onchain" | "dex" | "whale" | "news" | "social" | "paper" | "github" | "blog" | "docs" | "tutorial" | "twitter" | "reddit" | "discord" | "hackernews" | "producthunt" | "competitor" | "user_feedback";
        name: string;
        credibility: number;
        url?: string | undefined;
    };
    content: {
        type: "code" | "paper" | "tutorial" | "article" | "tweet" | "post" | "comment" | "documentation" | "transaction" | "event" | "announcement" | "analysis";
        raw: string;
        summary: string;
    };
    embedding: number[];
    entities: {
        id: string;
        type: "event" | "person" | "company" | "token" | "technology" | "concept";
        name: string;
        aliases: string[];
        attributes: Record<string, any>;
    }[];
    relationships: {
        type: string;
        from: string;
        to: string;
        strength: number;
        evidence: string[];
    }[];
    sentiment: number;
    importance: number;
    timestamp: number;
    decayRate: number;
    processed: boolean;
    quality: number;
    expiresAt?: number | undefined;
}>;
type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;
declare const ConditionOperatorSchema: z.ZodEnum<[">", "<", "==", "contains", "matches"]>;
declare const ConditionSchema: z.ZodObject<{
    type: z.ZodEnum<["threshold", "sequence", "correlation", "absence"]>;
    field: z.ZodString;
    operator: z.ZodEnum<[">", "<", "==", "contains", "matches"]>;
    value: z.ZodAny;
    timeframe: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "threshold" | "sequence" | "correlation" | "absence";
    field: string;
    operator: ">" | "<" | "==" | "contains" | "matches";
    value?: any;
    timeframe?: number | undefined;
}, {
    type: "threshold" | "sequence" | "correlation" | "absence";
    field: string;
    operator: ">" | "<" | "==" | "contains" | "matches";
    value?: any;
    timeframe?: number | undefined;
}>;
type Condition = z.infer<typeof ConditionSchema>;
declare const ActionSchema: z.ZodObject<{
    type: z.ZodString;
    params: z.ZodRecord<z.ZodString, z.ZodAny>;
    priority: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    params: Record<string, any>;
    type: string;
    priority: number;
}, {
    params: Record<string, any>;
    type: string;
    priority: number;
}>;
type Action = z.infer<typeof ActionSchema>;
declare const PatternSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    conditions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["threshold", "sequence", "correlation", "absence"]>;
        field: z.ZodString;
        operator: z.ZodEnum<[">", "<", "==", "contains", "matches"]>;
        value: z.ZodAny;
        timeframe: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "threshold" | "sequence" | "correlation" | "absence";
        field: string;
        operator: ">" | "<" | "==" | "contains" | "matches";
        value?: any;
        timeframe?: number | undefined;
    }, {
        type: "threshold" | "sequence" | "correlation" | "absence";
        field: string;
        operator: ">" | "<" | "==" | "contains" | "matches";
        value?: any;
        timeframe?: number | undefined;
    }>, "many">;
    occurrences: z.ZodNumber;
    accuracy: z.ZodNumber;
    lastSeen: z.ZodNumber;
    suggestedActions: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodAny>;
        priority: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, any>;
        type: string;
        priority: number;
    }, {
        params: Record<string, any>;
        type: string;
        priority: number;
    }>, "many">;
    discovered: z.ZodNumber;
    confidence: z.ZodNumber;
    evolving: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    conditions: {
        type: "threshold" | "sequence" | "correlation" | "absence";
        field: string;
        operator: ">" | "<" | "==" | "contains" | "matches";
        value?: any;
        timeframe?: number | undefined;
    }[];
    occurrences: number;
    accuracy: number;
    lastSeen: number;
    suggestedActions: {
        params: Record<string, any>;
        type: string;
        priority: number;
    }[];
    discovered: number;
    confidence: number;
    evolving: boolean;
}, {
    id: string;
    name: string;
    description: string;
    conditions: {
        type: "threshold" | "sequence" | "correlation" | "absence";
        field: string;
        operator: ">" | "<" | "==" | "contains" | "matches";
        value?: any;
        timeframe?: number | undefined;
    }[];
    occurrences: number;
    accuracy: number;
    lastSeen: number;
    suggestedActions: {
        params: Record<string, any>;
        type: string;
        priority: number;
    }[];
    discovered: number;
    confidence: number;
    evolving: boolean;
}>;
type Pattern = z.infer<typeof PatternSchema>;
declare const PredictionTypeSchema: z.ZodEnum<["market", "content", "product", "agent"]>;
type PredictionType = z.infer<typeof PredictionTypeSchema>;
declare const PredictionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["market", "content", "product", "agent"]>;
    prediction: z.ZodObject<{
        outcome: z.ZodString;
        probability: z.ZodNumber;
        confidence: z.ZodNumber;
        timeframe: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeframe: number;
        confidence: number;
        outcome: string;
        probability: number;
    }, {
        timeframe: number;
        confidence: number;
        outcome: string;
        probability: number;
    }>;
    basis: z.ZodObject<{
        patterns: z.ZodArray<z.ZodString, "many">;
        knowledge: z.ZodArray<z.ZodString, "many">;
        reasoning: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        patterns: string[];
        knowledge: string[];
        reasoning: string;
    }, {
        patterns: string[];
        knowledge: string[];
        reasoning: string;
    }>;
    madeAt: z.ZodNumber;
    expiresAt: z.ZodNumber;
    outcome: z.ZodOptional<z.ZodObject<{
        correct: z.ZodBoolean;
        actual: z.ZodString;
        evaluatedAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        correct: boolean;
        actual: string;
        evaluatedAt: number;
    }, {
        correct: boolean;
        actual: string;
        evaluatedAt: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "content" | "market" | "product" | "agent";
    expiresAt: number;
    prediction: {
        timeframe: number;
        confidence: number;
        outcome: string;
        probability: number;
    };
    basis: {
        patterns: string[];
        knowledge: string[];
        reasoning: string;
    };
    madeAt: number;
    outcome?: {
        correct: boolean;
        actual: string;
        evaluatedAt: number;
    } | undefined;
}, {
    id: string;
    type: "content" | "market" | "product" | "agent";
    expiresAt: number;
    prediction: {
        timeframe: number;
        confidence: number;
        outcome: string;
        probability: number;
    };
    basis: {
        patterns: string[];
        knowledge: string[];
        reasoning: string;
    };
    madeAt: number;
    outcome?: {
        correct: boolean;
        actual: string;
        evaluatedAt: number;
    } | undefined;
}>;
type Prediction = z.infer<typeof PredictionSchema>;
declare const AgentEvolutionSchema: z.ZodObject<{
    agentId: z.ZodString;
    currentVersion: z.ZodString;
    history: z.ZodArray<z.ZodObject<{
        version: z.ZodString;
        successRate: z.ZodNumber;
        avgSpeed: z.ZodNumber;
        userSatisfaction: z.ZodNumber;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        version: string;
        successRate: number;
        avgSpeed: number;
        userSatisfaction: number;
    }, {
        timestamp: number;
        version: string;
        successRate: number;
        avgSpeed: number;
        userSatisfaction: number;
    }>, "many">;
    variants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        changes: z.ZodArray<z.ZodString, "many">;
        performance: z.ZodNumber;
        sampleSize: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        changes: string[];
        performance: number;
        sampleSize: number;
    }, {
        id: string;
        changes: string[];
        performance: number;
        sampleSize: number;
    }>, "many">;
    successfulMutations: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        improvement: z.ZodNumber;
        appliedAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        improvement: number;
        appliedAt: number;
    }, {
        type: string;
        description: string;
        improvement: number;
        appliedAt: number;
    }>, "many">;
    evolutionRate: z.ZodNumber;
    autoEvolve: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    currentVersion: string;
    history: {
        timestamp: number;
        version: string;
        successRate: number;
        avgSpeed: number;
        userSatisfaction: number;
    }[];
    variants: {
        id: string;
        changes: string[];
        performance: number;
        sampleSize: number;
    }[];
    successfulMutations: {
        type: string;
        description: string;
        improvement: number;
        appliedAt: number;
    }[];
    evolutionRate: number;
    autoEvolve: boolean;
}, {
    agentId: string;
    currentVersion: string;
    history: {
        timestamp: number;
        version: string;
        successRate: number;
        avgSpeed: number;
        userSatisfaction: number;
    }[];
    variants: {
        id: string;
        changes: string[];
        performance: number;
        sampleSize: number;
    }[];
    successfulMutations: {
        type: string;
        description: string;
        improvement: number;
        appliedAt: number;
    }[];
    evolutionRate: number;
    autoEvolve: boolean;
}>;
type AgentEvolution = z.infer<typeof AgentEvolutionSchema>;
interface DataSourceConfig {
    name: string;
    type: SourceType;
    interval: number;
    enabled: boolean;
    priority: number;
    rateLimit?: {
        requests: number;
        window: number;
    };
}
interface BrainConfig {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    heliusApiKey?: string;
    twitterBearerToken?: string;
    vectorDb: "pinecone" | "qdrant" | "local";
    graphDb: "neo4j" | "local";
    embeddingModel: string;
    maxConcurrentIngests: number;
    apiPort: number;
    enableApi: boolean;
    enableWebSocket: boolean;
}
interface BrainStats {
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
interface SearchResult extends KnowledgeItem {
    score: number;
}

/**
 * Base Data Source
 *
 * Abstract base class for all data sources.
 */

declare abstract class BaseSource implements DataSourceConfig {
    abstract name: string;
    abstract type: SourceType;
    abstract interval: number;
    enabled: boolean;
    priority: number;
    rateLimit?: {
        requests: number;
        window: number;
    };
    protected logger: Logger;
    protected requestCount: number;
    protected windowStart: number;
    constructor();
    /**
     * Fetch raw items from this source
     */
    abstract fetch(): Promise<RawItem[]>;
    /**
     * Check if rate limit allows request
     */
    protected checkRateLimit(): boolean;
    /**
     * Make a rate-limited fetch request
     */
    protected rateLimitedFetch(url: string, options?: RequestInit): Promise<Response>;
    /**
     * Generate unique ID for item
     */
    protected generateId(prefix: string, identifier: string): string;
    /**
     * Get source config
     */
    getConfig(): DataSourceConfig;
}

/**
 * Source Registry
 *
 * Manages all data sources.
 */

declare class SourceRegistry {
    private sources;
    private logger;
    /**
     * Register all available sources
     */
    registerAll(): Promise<void>;
    /**
     * Register a single source
     */
    register(source: BaseSource): void;
    /**
     * Get a source by name
     */
    get(name: string): BaseSource | undefined;
    /**
     * Get all sources
     */
    getAll(): BaseSource[];
    /**
     * Get source count
     */
    count(): number;
    /**
     * Get sources by type
     */
    getByType(type: string): BaseSource[];
    /**
     * Get sources sorted by priority
     */
    getByPriority(): BaseSource[];
}

/**
 * Ingestion Orchestrator
 *
 * Coordinates all data source ingestion.
 */

interface IngestEvents {
    "item:ingested": (item: RawItem) => void;
    "batch:complete": (source: string, count: number) => void;
    "error": (source: string, error: Error) => void;
}
interface IngestStats {
    totalIngested: number;
    bySource: Record<string, number>;
    errors: number;
    lastRun: Record<string, number>;
}
declare class IngestOrchestrator extends EventEmitter<IngestEvents> {
    private scheduler;
    private sources;
    private logger;
    private isRunning;
    private stats;
    private rawItems;
    private maxRawItems;
    constructor();
    /**
     * Start ingestion
     */
    start(): Promise<void>;
    /**
     * Stop ingestion
     */
    stop(): void;
    /**
     * Ingest from a specific source
     */
    ingestSource(sourceName: string): Promise<number>;
    /**
     * Force ingest all sources
     */
    ingestAll(): Promise<IngestStats>;
    /**
     * Get ingestion stats
     */
    getStats(): IngestStats;
    /**
     * Get recent raw items
     */
    getRecentItems(count?: number): RawItem[];
    /**
     * Get raw items by source
     */
    getItemsBySource(source: string): RawItem[];
    /**
     * Search raw items
     */
    searchItems(query: string): RawItem[];
    /**
     * Add raw item to store
     */
    private addRawItem;
    /**
     * Get source registry
     */
    getSources(): SourceRegistry;
}

/**
 * Embedding Generator
 *
 * Generates vector embeddings for semantic search.
 */
declare class EmbeddingGenerator {
    private logger;
    private cache;
    private model;
    constructor(model?: string);
    /**
     * Generate embedding for text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Embed multiple texts in batch
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Generate embedding using API
     */
    private generateEmbedding;
    /**
     * Generate mock embedding for development
     */
    private mockEmbedding;
    /**
     * Seeded random number generator
     */
    private seededRandom;
    /**
     * Calculate cosine similarity between embeddings
     */
    static cosineSimilarity(a: number[], b: number[]): number;
    /**
     * Simple text hash for caching
     */
    private hashText;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Get cache size
     */
    getCacheSize(): number;
}

/**
 * Vector Store Interface
 *
 * Abstracts vector storage implementations.
 */

type VectorStoreType = "local" | "pinecone" | "qdrant";

/**
 * Storage Orchestrator
 *
 * Coordinates all storage systems.
 */

interface StorageConfig {
    vectorStore: VectorStoreType;
    dataDir: string;
}
declare class StorageOrchestrator {
    private vectorStore;
    private memoryStore;
    private logger;
    private initialized;
    constructor(config?: Partial<StorageConfig>);
    /**
     * Initialize all stores
     */
    init(): Promise<void>;
    /**
     * Store knowledge item
     */
    storeKnowledge(item: KnowledgeItem): Promise<void>;
    /**
     * Store multiple knowledge items
     */
    storeKnowledgeBatch(items: KnowledgeItem[]): Promise<void>;
    /**
     * Get knowledge item by ID
     */
    getKnowledge(id: string): KnowledgeItem | undefined;
    /**
     * Search knowledge by text
     */
    searchKnowledge(query: string, embedder: EmbeddingGenerator, limit?: number): Promise<SearchResult[]>;
    /**
     * Search knowledge by embedding
     */
    searchByEmbedding(embedding: number[], limit?: number): Promise<SearchResult[]>;
    /**
     * Filter knowledge
     */
    filterKnowledge(predicate: (item: KnowledgeItem) => boolean): KnowledgeItem[];
    /**
     * Get all knowledge
     */
    getAllKnowledge(): KnowledgeItem[];
    /**
     * Get knowledge count
     */
    getKnowledgeCount(): number;
    /**
     * Store pattern
     */
    storePattern(pattern: Pattern): void;
    /**
     * Get pattern
     */
    getPattern(id: string): Pattern | undefined;
    /**
     * Get all patterns
     */
    getAllPatterns(): Pattern[];
    /**
     * Update pattern
     */
    updatePattern(id: string, updates: Partial<Pattern>): boolean;
    /**
     * Store prediction
     */
    storePrediction(prediction: Prediction): void;
    /**
     * Get prediction
     */
    getPrediction(id: string): Prediction | undefined;
    /**
     * Get all predictions
     */
    getAllPredictions(): Prediction[];
    /**
     * Get pending predictions
     */
    getPendingPredictions(): Prediction[];
    /**
     * Update prediction outcome
     */
    updatePredictionOutcome(id: string, outcome: {
        correct: boolean;
        actual: string;
    }): boolean;
    /**
     * Set short-term memory
     */
    setShortTerm<T>(key: string, value: T, ttl?: number): void;
    /**
     * Get short-term memory
     */
    getShortTerm<T>(key: string): T | undefined;
    /**
     * Set long-term memory
     */
    setLongTerm<T>(key: string, value: T): void;
    /**
     * Get long-term memory
     */
    getLongTerm<T>(key: string): T | undefined;
    /**
     * Get storage stats
     */
    getStats(): {
        knowledge: number;
        patterns: number;
        predictions: number;
        memory: {
            shortTerm: number;
            longTerm: number;
        };
    };
    /**
     * Save all data
     */
    save(): Promise<void>;
    /**
     * Shutdown
     */
    shutdown(): Promise<void>;
}

/**
 * Retrieval System
 *
 * Semantic search and hybrid retrieval.
 */

interface RetrievalOptions {
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
declare class RetrievalSystem {
    private storage;
    private embedder;
    private logger;
    constructor(storage: StorageOrchestrator, embedder: EmbeddingGenerator);
    /**
     * Search by text query
     */
    search(query: string, options?: RetrievalOptions): Promise<SearchResult[]>;
    /**
     * Hybrid search (semantic + keyword)
     */
    hybridSearch(query: string, options?: RetrievalOptions): Promise<SearchResult[]>;
    /**
     * Get similar items
     */
    getSimilar(itemId: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Get by topic
     */
    getByTopic(topic: string, limit?: number): KnowledgeItem[];
    /**
     * Get by source
     */
    getBySource(source: string, limit?: number): KnowledgeItem[];
    /**
     * Get recent items
     */
    getRecent(limit?: number): KnowledgeItem[];
    /**
     * Get important items
     */
    getImportant(limit?: number): KnowledgeItem[];
    /**
     * Keyword search
     */
    private keywordSearch;
    /**
     * Merge and deduplicate results
     */
    private mergeResults;
    /**
     * Apply filters to results
     */
    private applyFilters;
    /**
     * Rerank results (simple implementation)
     */
    private rerank;
}

/**
 * HYPER BRAIN Configuration
 */

declare function loadConfig(overrides?: Partial<BrainConfig>): BrainConfig;

/**
 * Entity Extractor
 *
 * Extracts entities (people, companies, tokens, etc.) from content.
 */

declare class EntityExtractor {
    private anthropic;
    private logger;
    private cache;
    constructor();
    /**
     * Extract entities from text
     */
    extract(text: string): Promise<Entity[]>;
    /**
     * Extract entities using Claude
     */
    private extractWithLLM;
    /**
     * Extract entities using regex patterns
     */
    private extractWithRegex;
    /**
     * Simple text hash for caching
     */
    private hashText;
    /**
     * Clear cache
     */
    clearCache(): void;
}

/**
 * Processing Pipeline
 *
 * Transforms raw items into rich knowledge.
 */

declare class ProcessingPipeline {
    private embedder;
    private entityExtractor;
    private summarizer;
    private classifier;
    private logger;
    constructor();
    /**
     * Process raw item into rich knowledge
     */
    process(raw: RawItem): Promise<KnowledgeItem>;
    /**
     * Process multiple items
     */
    processBatch(items: RawItem[]): Promise<KnowledgeItem[]>;
    /**
     * Get source type from string
     */
    private getSourceType;
    /**
     * Get content type from string
     */
    private getContentType;
    /**
     * Assess content quality (0-100)
     */
    private assessQuality;
    /**
     * Get embedding generator
     */
    getEmbedder(): EmbeddingGenerator;
    /**
     * Get entity extractor
     */
    getEntityExtractor(): EntityExtractor;
}

/**
 * Learning System
 *
 * Pattern recognition and self-improvement.
 */

declare class LearningSystem {
    private storage;
    private logger;
    constructor(storage: StorageOrchestrator);
    /**
     * Analyze knowledge for patterns
     */
    analyzePatterns(): Promise<Pattern[]>;
    /**
     * Find frequency patterns (things that appear often together)
     */
    private findFrequencyPatterns;
    /**
     * Find correlation patterns (topic + sentiment correlations)
     */
    private findCorrelationPatterns;
    /**
     * Find temporal patterns (time-based trends)
     */
    private findTemporalPatterns;
    /**
     * Get pattern statistics
     */
    getPatternStats(): {
        total: number;
        active: number;
        avgAccuracy: number;
    };
    /**
     * Match patterns against item
     */
    matchPatterns(item: KnowledgeItem): Pattern[];
    /**
     * Check if item matches conditions
     */
    private matchesConditions;
    /**
     * Check single condition
     */
    private matchesCondition;
    /**
     * Get field value from item
     */
    private getFieldValue;
}

/**
 * Prediction Engine
 *
 * Generates predictions based on patterns and knowledge.
 */

declare class PredictionEngine {
    private storage;
    private retrieval;
    private learning;
    private anthropic;
    private logger;
    constructor(storage: StorageOrchestrator, retrieval: RetrievalSystem, learning: LearningSystem);
    /**
     * Generate predictions for a type
     */
    predict(type: PredictionType, count?: number): Promise<Prediction[]>;
    /**
     * Generate market predictions
     */
    private predictMarket;
    /**
     * Generate content predictions
     */
    private predictContent;
    /**
     * Generate product predictions
     */
    private predictProduct;
    /**
     * Generate agent predictions
     */
    private predictAgent;
    /**
     * Generate prediction using LLM
     */
    private generateLLMPrediction;
    /**
     * Create simple rule-based prediction
     */
    private createSimplePrediction;
    /**
     * Calculate average sentiment
     */
    private calculateAverageSentiment;
    /**
     * Evaluate pending predictions
     */
    evaluatePredictions(): Promise<{
        evaluated: number;
        correct: number;
    }>;
    /**
     * Evaluate a single prediction
     */
    private evaluatePrediction;
    /**
     * Get prediction statistics
     */
    getStats(): {
        total: number;
        correct: number;
        accuracy: number;
        pending: number;
    };
}

/**
 * HYPER BRAIN API Server
 *
 * HTTP + WebSocket API for real-time knowledge queries.
 */

interface ApiConfig {
    port: number;
    host: string;
    enableWebSocket: boolean;
}
declare class BrainApiServer {
    private app;
    private brain;
    private config;
    private logger;
    private wsClients;
    constructor(brain: HyperBrain, config?: Partial<ApiConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupRoutes;
    private setupWebSocket;
    private handleWsMessage;
    private setupEventForwarding;
    private broadcast;
}

/**
 * gICM HYPER BRAIN
 *
 * Knowledge ingestion, learning, and prediction system.
 */

interface BrainEvents {
    "started": () => void;
    "stopped": () => void;
    "knowledge:added": (item: KnowledgeItem) => void;
    "pattern:discovered": (pattern: Pattern) => void;
    "prediction:made": (prediction: Prediction) => void;
    "error": (error: Error) => void;
}
declare class HyperBrain extends EventEmitter<BrainEvents> {
    private config;
    private logger;
    private ingest;
    private processing;
    private storage;
    private retrieval;
    private learning;
    private prediction;
    private isRunning;
    private startTime;
    constructor(config?: Partial<BrainConfig>);
    /**
     * Start the HYPER BRAIN
     */
    start(): Promise<void>;
    /**
     * Stop the HYPER BRAIN
     */
    stop(): Promise<void>;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Force ingest from all sources
     */
    ingestAll(): Promise<IngestStats>;
    /**
     * Ingest from specific source
     */
    ingestSource(source: string): Promise<number>;
    /**
     * Get ingestion stats
     */
    getIngestStats(): IngestStats;
    /**
     * Search knowledge base
     */
    search(query: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Advanced search with options
     */
    advancedSearch(query: string, options: RetrievalOptions): Promise<SearchResult[]>;
    /**
     * Get similar items
     */
    getSimilar(itemId: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Get by topic
     */
    getByTopic(topic: string, limit?: number): KnowledgeItem[];
    /**
     * Get recent items
     */
    getRecent(limit?: number): KnowledgeItem[];
    /**
     * Analyze and discover patterns
     */
    analyzePatterns(): Promise<Pattern[]>;
    /**
     * Get all patterns
     */
    getPatterns(): Pattern[];
    /**
     * Get pattern stats
     */
    getPatternStats(): {
        total: number;
        active: number;
        avgAccuracy: number;
    };
    /**
     * Generate predictions
     */
    predict(type: PredictionType, count?: number): Promise<Prediction[]>;
    /**
     * Get all predictions
     */
    getPredictions(): Prediction[];
    /**
     * Get prediction stats
     */
    getPredictionStats(): {
        total: number;
        correct: number;
        accuracy: number;
        pending: number;
    };
    /**
     * Evaluate pending predictions
     */
    evaluatePredictions(): Promise<{
        evaluated: number;
        correct: number;
    }>;
    /**
     * Get comprehensive brain stats
     */
    getStats(): BrainStats;
    /**
     * Get uptime
     */
    getUptime(): number;
    /**
     * Check if running
     */
    isOnline(): boolean;
}

export { type Action, ActionSchema, type AgentEvolution, AgentEvolutionSchema, BrainApiServer, type BrainConfig, type BrainStats, type Condition, ConditionOperatorSchema, ConditionSchema, type ContentType, ContentTypeSchema, type DataSourceConfig, type Entity, EntitySchema, EntityTypeSchema, HyperBrain, IngestOrchestrator, type KnowledgeItem, KnowledgeItemSchema, LearningSystem, type Pattern, PatternSchema, type Prediction, PredictionEngine, PredictionSchema, type PredictionType, PredictionTypeSchema, ProcessingPipeline, type RawItem, RawItemSchema, type Relationship, RelationshipSchema, RetrievalSystem, type SearchResult, type SourceType, SourceTypeSchema, StorageOrchestrator, loadConfig };
