/**
 * OPUS 67 Graphiti Memory
 * Temporal knowledge graph using Neo4j for persistent AI memory
 *
 * Features:
 * - Neo4j Aura free tier compatible
 * - Vector embeddings for semantic search
 * - Temporal queries for time-based retrieval
 * - Local fallback for development
 * - Relationship management between memories
 */

import { EventEmitter } from 'eventemitter3';

// Simple embedding function (for local fallback)
function simpleEmbed(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const dims = 64;
  const embedding = new Array(dims).fill(0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (j + 1)) % dims;
      embedding[idx] += 1 / words.length;
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// Types
export interface MemoryNode {
  id: string;
  key: string;
  value: string;
  namespace: string;
  type: 'episode' | 'fact' | 'improvement' | 'goal' | 'context';
  embedding?: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface MemoryEdge {
  id: string;
  fromId: string;
  toId: string;
  type: 'relates_to' | 'caused_by' | 'improves' | 'references' | 'follows';
  weight: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Episode {
  name?: string;
  content: string;
  type?: 'success' | 'failure' | 'learning' | 'decision';
  source?: string;
  actors?: string[];
  context?: Record<string, unknown>;
  timestamp?: Date;
}

export interface Improvement {
  component: string;
  changeType: 'fix' | 'enhancement' | 'refactor' | 'optimization';
  before: string;
  after: string;
  impact: number;
  automated: boolean;
}

export interface Goal {
  description: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  milestones?: string[];
}

export interface SearchResult {
  node: MemoryNode;
  score: number;
  matchType: 'semantic' | 'keyword' | 'exact';
}

export interface GraphitiConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  namespace?: string;
  embeddingModel?: string;
  maxResults?: number;
  fallbackToLocal?: boolean;
}

interface GraphitiEvents {
  'connected': () => void;
  'disconnected': () => void;
  'error': (error: Error) => void;
  'memory:added': (node: MemoryNode) => void;
  'memory:updated': (node: MemoryNode) => void;
  'memory:deleted': (id: string) => void;
  'search:complete': (query: string, results: SearchResult[]) => void;
}

/**
 * GraphitiMemory - Neo4j-based temporal knowledge graph
 */
export class GraphitiMemory extends EventEmitter<GraphitiEvents> {
  private config: GraphitiConfig;
  private connected = false;
  private driver: any = null;
  private localCache: Map<string, MemoryNode> = new Map();
  private useLocalFallback = true;

  constructor(config?: Partial<GraphitiConfig>) {
    super();
    this.config = {
      uri: config?.uri ?? process.env.NEO4J_URI ?? '',
      username: config?.username ?? process.env.NEO4J_USERNAME ?? 'neo4j',
      password: config?.password ?? process.env.NEO4J_PASSWORD ?? '',
      database: config?.database ?? 'neo4j',
      namespace: config?.namespace ?? 'opus67',
      embeddingModel: config?.embeddingModel ?? 'local',
      maxResults: config?.maxResults ?? 10,
      fallbackToLocal: config?.fallbackToLocal ?? true,
    };

    // Force local fallback if explicitly requested or no credentials
    if (this.config.fallbackToLocal || !this.config.uri || !this.config.password) {
      this.useLocalFallback = true;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Connect to Neo4j
   */
  async connect(): Promise<boolean> {
    if (!this.config.uri || !this.config.password) {
      console.warn('[Graphiti] No Neo4j credentials, using local fallback');
      this.useLocalFallback = true;
      return false;
    }

    try {
      // Dynamic import of neo4j-driver
      const neo4j = await import('neo4j-driver').catch(() => null);

      if (!neo4j) {
        console.warn('[Graphiti] neo4j-driver not installed, using local fallback');
        this.useLocalFallback = true;
        return false;
      }

      this.driver = neo4j.default.driver(
        this.config.uri,
        neo4j.default.auth.basic(this.config.username, this.config.password)
      );

      // Verify connection
      const session = this.driver.session({ database: this.config.database });
      await session.run('RETURN 1');
      await session.close();

      this.connected = true;
      this.useLocalFallback = false;
      this.emit('connected');

      // Initialize schema
      await this.initializeSchema();

      return true;
    } catch (error) {
      console.warn('[Graphiti] Connection failed, using local fallback:', error);
      this.useLocalFallback = true;
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Initialize Neo4j schema
   */
  private async initializeSchema(): Promise<void> {
    if (!this.driver) return;

    const session = this.driver.session({ database: this.config.database });
    try {
      // Create indexes
      await session.run(`
        CREATE INDEX memory_key IF NOT EXISTS FOR (m:Memory) ON (m.key)
      `);
      await session.run(`
        CREATE INDEX memory_namespace IF NOT EXISTS FOR (m:Memory) ON (m.namespace)
      `);
      await session.run(`
        CREATE INDEX memory_type IF NOT EXISTS FOR (m:Memory) ON (m.type)
      `);
    } finally {
      await session.close();
    }
  }

  /**
   * Disconnect from Neo4j
   */
  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.connected = false;
      this.emit('disconnected');
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Use local embedding for fallback or when no external API is configured
    return simpleEmbed(text);
  }

  /**
   * Add an episode to memory
   */
  async addEpisode(episode: Episode): Promise<MemoryNode> {
    const episodeKey = episode.name ?? `episode:${episode.type ?? 'general'}:${Date.now()}`;
    const embedding = await this.generateEmbedding(episode.content);

    const node: MemoryNode = {
      id: this.generateId(),
      key: episodeKey,
      value: episode.content,
      namespace: this.config.namespace!,
      type: 'episode',
      embedding,
      metadata: {
        episodeType: episode.type,
        source: episode.source,
        actors: episode.actors,
        context: episode.context,
        originalTimestamp: episode.timestamp
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.useLocalFallback) {
      this.localCache.set(node.id, node);
    } else {
      await this.writeNode(node);
    }

    this.emit('memory:added', node);
    return node;
  }

  /**
   * Store a fact
   */
  async addFact(key: string, value: string, metadata?: Record<string, unknown>): Promise<MemoryNode> {
    const embedding = await this.generateEmbedding(`${key} ${value}`);

    const node: MemoryNode = {
      id: this.generateId(),
      key,
      value,
      namespace: this.config.namespace!,
      type: 'fact',
      embedding,
      metadata: metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.useLocalFallback) {
      this.localCache.set(node.id, node);
    } else {
      await this.writeNode(node);
    }

    this.emit('memory:added', node);
    return node;
  }

  /**
   * Store an improvement record
   */
  async storeImprovement(improvement: Improvement): Promise<MemoryNode> {
    const node: MemoryNode = {
      id: this.generateId(),
      key: `improvement:${improvement.component}`,
      value: JSON.stringify(improvement),
      namespace: this.config.namespace!,
      type: 'improvement',
      metadata: {
        component: improvement.component,
        changeType: improvement.changeType,
        impact: improvement.impact,
        automated: improvement.automated
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.useLocalFallback) {
      this.localCache.set(node.id, node);
    } else {
      await this.writeNode(node);
    }

    this.emit('memory:added', node);
    return node;
  }

  /**
   * Track a goal
   */
  async trackGoal(goal: Goal): Promise<MemoryNode> {
    const node: MemoryNode = {
      id: this.generateId(),
      key: `goal:${goal.description.slice(0, 50)}`,
      value: JSON.stringify(goal),
      namespace: this.config.namespace!,
      type: 'goal',
      metadata: {
        progress: goal.progress,
        status: goal.status,
        milestones: goal.milestones
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.useLocalFallback) {
      this.localCache.set(node.id, node);
    } else {
      await this.writeNode(node);
    }

    this.emit('memory:added', node);
    return node;
  }

  /**
   * Write node to Neo4j
   */
  private async writeNode(node: MemoryNode): Promise<void> {
    if (!this.driver) return;

    const session = this.driver.session({ database: this.config.database });
    try {
      await session.run(`
        MERGE (m:Memory {id: $id})
        SET m.key = $key,
            m.value = $value,
            m.namespace = $namespace,
            m.type = $type,
            m.metadata = $metadata,
            m.createdAt = $createdAt,
            m.updatedAt = $updatedAt
      `, {
        id: node.id,
        key: node.key,
        value: node.value,
        namespace: node.namespace,
        type: node.type,
        metadata: JSON.stringify(node.metadata),
        createdAt: node.createdAt.toISOString(),
        updatedAt: node.updatedAt.toISOString()
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Search memories (with semantic search support)
   */
  async search(query: string, options?: { type?: string; limit?: number; semantic?: boolean }): Promise<SearchResult[]> {
    const limit = options?.limit ?? this.config.maxResults!;
    const useSemantic = options?.semantic ?? true;
    const results: SearchResult[] = [];

    if (this.useLocalFallback) {
      // Local search with optional semantic matching
      const queryLower = query.toLowerCase();
      const queryEmbedding = useSemantic && query ? await this.generateEmbedding(query) : null;

      for (const node of this.localCache.values()) {
        // Filter by type if specified
        if (options?.type && node.type !== options.type) continue;

        // Empty query returns all (filtered by type above)
        if (!query) {
          results.push({
            node,
            score: 0.5,
            matchType: 'keyword'
          });
          continue;
        }

        // Match by key and value (keyword search)
        const nodeKey = node.key ?? '';
        const nodeValue = node.value ?? '';
        const keyMatch = nodeKey.toLowerCase().includes(queryLower);
        const valueMatch = nodeValue.toLowerCase().includes(queryLower);

        // Semantic search using embeddings
        let semanticScore = 0;
        if (queryEmbedding && node.embedding) {
          semanticScore = cosineSimilarity(queryEmbedding, node.embedding);
        }

        // Combine keyword and semantic scores
        const keywordScore = keyMatch ? 1.0 : valueMatch ? 0.8 : 0;
        const combinedScore = Math.max(keywordScore, semanticScore);

        if (combinedScore > 0.3) {
          results.push({
            node,
            score: combinedScore,
            matchType: semanticScore > keywordScore ? 'semantic' : 'keyword'
          });
        }
      }
    } else {
      // Neo4j search
      const session = this.driver.session({ database: this.config.database });
      try {
        const result = await session.run(`
          MATCH (m:Memory)
          WHERE m.namespace = $namespace
            AND (m.key CONTAINS $query OR m.value CONTAINS $query)
            ${options?.type ? 'AND m.type = $type' : ''}
          RETURN m
          ORDER BY m.updatedAt DESC
          LIMIT $limit
        `, {
          namespace: this.config.namespace,
          query,
          type: options?.type,
          limit
        });

        for (const record of result.records) {
          const m = record.get('m').properties;
          results.push({
            node: {
              id: m.id,
              key: m.key,
              value: m.value,
              namespace: m.namespace,
              type: m.type,
              metadata: JSON.parse(m.metadata || '{}'),
              createdAt: new Date(m.createdAt),
              updatedAt: new Date(m.updatedAt)
            },
            score: 0.9,
            matchType: 'keyword'
          });
        }
      } finally {
        await session.close();
      }
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    const limited = results.slice(0, limit);

    this.emit('search:complete', query, limited);
    return limited;
  }

  /**
   * Get context for a topic
   */
  async getContext(topic: string): Promise<{ memories: MemoryNode[]; summary: string }> {
    const results = await this.search(topic, { limit: 5 });
    const memories = results.map(r => r.node);

    // Generate summary
    const summary = memories.length > 0
      ? `Found ${memories.length} relevant memories:\n${memories.map(m => `- ${m.key}: ${m.value.slice(0, 100)}...`).join('\n')}`
      : `No memories found for "${topic}"`;

    return { memories, summary };
  }

  /**
   * Get all improvements
   */
  async getImprovements(): Promise<Improvement[]> {
    const results = await this.search('', { type: 'improvement', limit: 100 });
    return results.map(r => JSON.parse(r.node.value) as Improvement);
  }

  /**
   * Get all goals
   */
  async getGoals(): Promise<Goal[]> {
    const results = await this.search('', { type: 'goal', limit: 100 });
    return results.map(r => JSON.parse(r.node.value) as Goal);
  }

  /**
   * Update goal progress
   */
  async updateGoal(goalId: string, progress: number, status?: Goal['status']): Promise<MemoryNode | null> {
    if (this.useLocalFallback) {
      const node = this.localCache.get(goalId);
      if (node && node.type === 'goal') {
        const goal = JSON.parse(node.value) as Goal;
        goal.progress = progress;
        if (status) goal.status = status;
        node.value = JSON.stringify(goal);
        node.metadata.progress = progress;
        node.metadata.status = status ?? goal.status;
        node.updatedAt = new Date();
        this.emit('memory:updated', node);
        return node;
      }
    } else {
      // Update in Neo4j
      const session = this.driver.session({ database: this.config.database });
      try {
        const result = await session.run(`
          MATCH (m:Memory {id: $id, type: 'goal'})
          SET m.metadata = $metadata, m.updatedAt = $updatedAt
          RETURN m
        `, {
          id: goalId,
          metadata: JSON.stringify({ progress, status }),
          updatedAt: new Date().toISOString()
        });
        // Parse and return
      } finally {
        await session.close();
      }
    }
    return null;
  }

  /**
   * Delete a memory
   */
  async delete(id: string): Promise<boolean> {
    if (this.useLocalFallback) {
      const deleted = this.localCache.delete(id);
      if (deleted) this.emit('memory:deleted', id);
      return deleted;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      await session.run(`
        MATCH (m:Memory {id: $id})
        DELETE m
      `, { id });
      this.emit('memory:deleted', id);
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relationship between two memories
   */
  async createRelationship(
    fromId: string,
    toId: string,
    type: MemoryEdge['type'],
    metadata?: Record<string, unknown>
  ): Promise<MemoryEdge | null> {
    const edge: MemoryEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromId,
      toId,
      type,
      weight: 1.0,
      metadata: metadata ?? {},
      createdAt: new Date()
    };

    if (this.useLocalFallback) {
      // Store edge in metadata of both nodes
      const fromNode = this.localCache.get(fromId);
      const toNode = this.localCache.get(toId);
      if (fromNode && toNode) {
        fromNode.metadata._edges = fromNode.metadata._edges ?? [];
        (fromNode.metadata._edges as MemoryEdge[]).push(edge);
        return edge;
      }
      return null;
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      await session.run(`
        MATCH (from:Memory {id: $fromId}), (to:Memory {id: $toId})
        CREATE (from)-[r:${type.toUpperCase()} {
          id: $edgeId,
          weight: $weight,
          metadata: $metadata,
          createdAt: $createdAt
        }]->(to)
        RETURN r
      `, {
        fromId,
        toId,
        edgeId: edge.id,
        weight: edge.weight,
        metadata: JSON.stringify(edge.metadata),
        createdAt: edge.createdAt.toISOString()
      });
      return edge;
    } finally {
      await session.close();
    }
  }

  /**
   * Get related memories
   */
  async getRelated(id: string, options?: { type?: MemoryEdge['type']; depth?: number }): Promise<MemoryNode[]> {
    const depth = options?.depth ?? 1;

    if (this.useLocalFallback) {
      const node = this.localCache.get(id);
      if (!node) return [];

      const edges = (node.metadata._edges as MemoryEdge[]) ?? [];
      const relatedIds = edges
        .filter(e => !options?.type || e.type === options.type)
        .map(e => e.toId);

      return relatedIds
        .map(rid => this.localCache.get(rid))
        .filter((n): n is MemoryNode => n !== undefined);
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const typeClause = options?.type ? `:${options.type.toUpperCase()}` : '';
      const result = await session.run(`
        MATCH (m:Memory {id: $id})-[${typeClause}*1..${depth}]->(related:Memory)
        RETURN DISTINCT related
      `, { id });

      return result.records.map(record => {
        const m = record.get('related').properties;
        return {
          id: m.id,
          key: m.key,
          value: m.value,
          namespace: m.namespace,
          type: m.type,
          metadata: JSON.parse(m.metadata || '{}'),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt)
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Search memories by time range
   */
  async searchByTimeRange(
    startDate: Date,
    endDate: Date,
    options?: { type?: string; limit?: number }
  ): Promise<MemoryNode[]> {
    const limit = options?.limit ?? this.config.maxResults!;

    if (this.useLocalFallback) {
      const results: MemoryNode[] = [];
      for (const node of this.localCache.values()) {
        if (options?.type && node.type !== options.type) continue;
        if (node.createdAt >= startDate && node.createdAt <= endDate) {
          results.push(node);
        }
      }
      return results
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const result = await session.run(`
        MATCH (m:Memory)
        WHERE m.namespace = $namespace
          AND datetime(m.createdAt) >= datetime($startDate)
          AND datetime(m.createdAt) <= datetime($endDate)
          ${options?.type ? 'AND m.type = $type' : ''}
        RETURN m
        ORDER BY m.createdAt DESC
        LIMIT $limit
      `, {
        namespace: this.config.namespace,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: options?.type,
        limit
      });

      return result.records.map(record => {
        const m = record.get('m').properties;
        return {
          id: m.id,
          key: m.key,
          value: m.value,
          namespace: m.namespace,
          type: m.type,
          metadata: JSON.parse(m.metadata || '{}'),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt)
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get recent memories
   */
  async getRecent(limit: number = 10, type?: string): Promise<MemoryNode[]> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.searchByTimeRange(weekAgo, now, { type, limit });
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalNodes: number;
    totalMemories: number;
    facts: number;
    episodes: number;
    goals: number;
    improvements: number;
    byType: Record<string, number>;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    if (this.useLocalFallback) {
      const byType: Record<string, number> = {};
      let oldest: Date | null = null;
      let newest: Date | null = null;

      for (const node of this.localCache.values()) {
        byType[node.type] = (byType[node.type] || 0) + 1;
        if (!oldest || node.createdAt < oldest) oldest = node.createdAt;
        if (!newest || node.createdAt > newest) newest = node.createdAt;
      }

      return {
        totalNodes: this.localCache.size,
        totalMemories: this.localCache.size,
        facts: byType['fact'] ?? 0,
        episodes: byType['episode'] ?? 0,
        goals: byType['goal'] ?? 0,
        improvements: byType['improvement'] ?? 0,
        byType,
        oldestMemory: oldest,
        newestMemory: newest
      };
    }

    const session = this.driver.session({ database: this.config.database });
    try {
      const result = await session.run(`
        MATCH (m:Memory {namespace: $namespace})
        RETURN m.type as type, count(*) as count,
               min(m.createdAt) as oldest,
               max(m.createdAt) as newest
      `, { namespace: this.config.namespace });

      const byType: Record<string, number> = {};
      let oldest: Date | null = null;
      let newest: Date | null = null;
      let total = 0;

      for (const record of result.records) {
        const type = record.get('type');
        const count = record.get('count').toNumber();
        byType[type] = count;
        total += count;

        const o = record.get('oldest');
        const n = record.get('newest');
        if (o && (!oldest || new Date(o) < oldest)) oldest = new Date(o);
        if (n && (!newest || new Date(n) > newest)) newest = new Date(n);
      }

      return {
        totalNodes: total,
        totalMemories: total,
        facts: byType['fact'] ?? 0,
        episodes: byType['episode'] ?? 0,
        goals: byType['goal'] ?? 0,
        improvements: byType['improvement'] ?? 0,
        byType,
        oldestMemory: oldest,
        newestMemory: newest
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && !this.useLocalFallback;
  }

  /**
   * Format memory status
   */
  async formatStatus(): Promise<string> {
    const stats = await this.getStats();
    const mode = this.useLocalFallback ? 'LOCAL FALLBACK' : 'NEO4J CONNECTED';

    return `
┌─ GRAPHITI MEMORY STATUS ────────────────────────────────────────┐
│                                                                  │
│  MODE: ${mode.padEnd(54)} │
│  NAMESPACE: ${this.config.namespace?.padEnd(49)} │
│                                                                  │
│  STATISTICS                                                      │
│  ────────────────────────────────────────────────────────────    │
│  Total Memories: ${String(stats.totalMemories).padEnd(44)} │
${Object.entries(stats.byType).map(([type, count]) =>
`│  - ${type.padEnd(15)}: ${String(count).padEnd(40)} │`).join('\n')}
│                                                                  │
│  Oldest: ${stats.oldestMemory?.toISOString().slice(0, 19) ?? 'N/A'.padEnd(50)} │
│  Newest: ${stats.newestMemory?.toISOString().slice(0, 19) ?? 'N/A'.padEnd(50)} │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`;
  }
}

// Export factory
export function createMemory(config?: Partial<GraphitiConfig>): GraphitiMemory {
  return new GraphitiMemory(config);
}

// Export default singleton
export const memory = new GraphitiMemory();
