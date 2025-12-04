# AI-Native Stack

> **ID:** `ai-native-stack`
> **Tier:** 1
> **Token Cost:** 15000
> **MCP Connections:** anthropic, openai, langchain, pinecone, mem0

## 🎯 What This Skill Does

Build production-ready AI-native applications with Claude, streaming responses, embeddings, RAG pipelines, and intelligent caching. This is the complete guide for modern AI-first architecture in 2025.

**Core Components:**
- Claude API integration with streaming
- Vector databases (Pinecone, Qdrant, Weaviate)
- RAG (Retrieval-Augmented Generation) pipelines
- Semantic caching and optimization
- Agent frameworks and tool calling
- Memory systems and context management

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** ai, claude, openai, rag, embeddings, vector, agents, llm
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities

### 1. Claude API Integration with Streaming

**Philosophy:**
Modern AI applications require real-time streaming responses for better UX. Claude 3.5 Sonnet is the best model for production applications (as of 2025) due to superior reasoning, speed, and cost efficiency.

**Architecture:**

```typescript
// src/ai/claude-client.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ConversationSchema = z.array(MessageSchema);

export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
  }) {
    this.client = new Anthropic({
      apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = config?.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config?.maxTokens || 4096;
  }

  /**
   * Send a single message (no streaming)
   */
  async send(prompt: string, options?: {
    system?: string;
    temperature?: number;
  }): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: options?.system,
      temperature: options?.temperature ?? 1.0,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(block => block.type === 'text');
    return textContent ? textContent.text : '';
  }

  /**
   * Stream a response in real-time
   */
  async *stream(prompt: string, options?: {
    system?: string;
    temperature?: number;
    onStart?: () => void;
    onToken?: (token: string) => void;
  }): AsyncGenerator<string> {
    options?.onStart?.();

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: options?.system,
      temperature: options?.temperature ?? 1.0,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta') {
        const token = chunk.delta.text;
        options?.onToken?.(token);
        yield token;
      }
    }
  }

  /**
   * Multi-turn conversation
   */
  async sendConversation(
    messages: z.infer<typeof ConversationSchema>,
    options?: {
      system?: string;
      temperature?: number;
    }
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: options?.system,
      temperature: options?.temperature ?? 1.0,
      messages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent ? textContent.text : '';
  }

  /**
   * Tool calling (function calling)
   */
  async callWithTools(
    prompt: string,
    tools: Array<{
      name: string;
      description: string;
      input_schema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
      };
    }>,
    options?: {
      system?: string;
      onToolCall?: (name: string, input: any) => Promise<any>;
    }
  ): Promise<{ text: string; toolCalls: Array<{ name: string; input: any; result: any }> }> {
    const toolCalls: Array<{ name: string; input: any; result: any }> = [];
    let currentMessages: any[] = [{ role: 'user', content: prompt }];

    while (true) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: options?.system,
        tools,
        messages: currentMessages,
      });

      // Check for tool use
      const toolUse = response.content.find(block => block.type === 'tool_use');

      if (!toolUse) {
        // No more tool calls, return final text
        const textContent = response.content.find(block => block.type === 'text');
        return {
          text: textContent ? textContent.text : '',
          toolCalls,
        };
      }

      // Execute tool
      const toolResult = await options?.onToolCall?.(toolUse.name, toolUse.input);
      toolCalls.push({
        name: toolUse.name,
        input: toolUse.input,
        result: toolResult,
      });

      // Add tool result to conversation
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(toolResult),
          }],
        },
      ];
    }
  }
}
```

**Usage Examples:**

```typescript
// Simple message
const claude = new ClaudeClient();
const response = await claude.send('What is the capital of France?');

// Streaming response (React Server Component)
async function StreamingResponse({ prompt }: { prompt: string }) {
  const claude = new ClaudeClient();
  const stream = claude.stream(prompt, {
    system: 'You are a helpful assistant.',
  });

  return (
    <Suspense fallback={<Loading />}>
      <StreamedText stream={stream} />
    </Suspense>
  );
}

// Tool calling
const response = await claude.callWithTools(
  'What is the weather in San Francisco and what should I wear?',
  [
    {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      input_schema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
    },
  ],
  {
    onToolCall: async (name, input) => {
      if (name === 'get_weather') {
        return { temp: 72, condition: 'sunny' };
      }
    },
  }
);
```

**Best Practices:**
- Always use environment variables for API keys
- Implement retry logic with exponential backoff
- Cache responses when possible (see Semantic Caching section)
- Use streaming for better UX on long responses
- Set appropriate max_tokens to control costs
- Validate all inputs and outputs with Zod
- Use TypeScript for type safety
- Implement rate limiting on the client side
- Monitor token usage and costs

**Common Patterns:**

```typescript
// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.status === 429 || error.status >= 500) {
        await new Promise(resolve =>
          setTimeout(resolve, baseDelay * Math.pow(2, i))
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const response = await withRetry(() =>
  claude.send('Your prompt here')
);
```

**Gotchas:**
- Claude API has rate limits (check your tier)
- Streaming requires proper error handling for disconnects
- Tool calling can loop infinitely if not handled properly
- System prompts count toward token limits
- Context window is 200K tokens but costs scale linearly

### 2. Vector Databases and Embeddings

**Philosophy:**
Vector databases enable semantic search and RAG by storing embeddings (numerical representations of text). In 2025, the top choices are Pinecone (managed, easiest), Qdrant (self-hosted, fast), and Weaviate (feature-rich).

**Architecture:**

```typescript
// src/ai/embeddings.ts
import OpenAI from 'openai';
import { z } from 'zod';

const EmbeddingSchema = z.object({
  text: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.any()).optional(),
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;

  constructor(config?: {
    apiKey?: string;
    model?: string;
  }) {
    this.openai = new OpenAI({
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
    });
    this.model = config?.model || 'text-embedding-3-small';
  }

  /**
   * Generate embeddings for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Batch embed multiple texts (more efficient)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // OpenAI supports up to 2048 inputs per request
    const batchSize = 2048;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: batch,
      });

      results.push(...response.data.map(d => d.embedding));
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// src/ai/vector-store.ts
import { Pinecone } from '@pinecone-database/pinecone';

export class VectorStore {
  private pinecone: Pinecone;
  private indexName: string;
  private embeddings: EmbeddingService;

  constructor(config: {
    apiKey?: string;
    indexName: string;
    embeddingService?: EmbeddingService;
  }) {
    this.pinecone = new Pinecone({
      apiKey: config.apiKey || process.env.PINECONE_API_KEY!,
    });
    this.indexName = config.indexName;
    this.embeddings = config.embeddingService || new EmbeddingService();
  }

  /**
   * Initialize index (call once on setup)
   */
  async createIndex(dimension: number = 1536) {
    await this.pinecone.createIndex({
      name: this.indexName,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
  }

  /**
   * Upsert vectors (add or update)
   */
  async upsert(documents: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>) {
    const index = this.pinecone.index(this.indexName);

    // Generate embeddings
    const embeddings = await this.embeddings.embedBatch(
      documents.map(d => d.text)
    );

    // Prepare vectors
    const vectors = documents.map((doc, i) => ({
      id: doc.id,
      values: embeddings[i],
      metadata: {
        text: doc.text,
        ...doc.metadata,
      },
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }

  /**
   * Semantic search
   */
  async search(query: string, options?: {
    topK?: number;
    filter?: Record<string, any>;
  }): Promise<Array<{
    id: string;
    score: number;
    text: string;
    metadata: Record<string, any>;
  }>> {
    const index = this.pinecone.index(this.indexName);

    // Generate query embedding
    const queryEmbedding = await this.embeddings.embed(query);

    // Search
    const results = await index.query({
      vector: queryEmbedding,
      topK: options?.topK || 5,
      filter: options?.filter,
      includeMetadata: true,
    });

    return results.matches.map(match => ({
      id: match.id,
      score: match.score || 0,
      text: match.metadata?.text as string,
      metadata: match.metadata || {},
    }));
  }

  /**
   * Delete vectors
   */
  async delete(ids: string[]) {
    const index = this.pinecone.index(this.indexName);
    await index.deleteMany(ids);
  }

  /**
   * Clear entire index
   */
  async clear() {
    const index = this.pinecone.index(this.indexName);
    await index.deleteAll();
  }
}
```

**Usage Examples:**

```typescript
// Initialize
const vectorStore = new VectorStore({
  indexName: 'my-knowledge-base',
});

// Add documents
await vectorStore.upsert([
  {
    id: 'doc1',
    text: 'Claude is an AI assistant created by Anthropic.',
    metadata: { category: 'AI', source: 'documentation' },
  },
  {
    id: 'doc2',
    text: 'Paris is the capital of France.',
    metadata: { category: 'geography', source: 'wikipedia' },
  },
]);

// Semantic search
const results = await vectorStore.search('Tell me about Claude', {
  topK: 3,
  filter: { category: 'AI' },
});

console.log(results);
// [{ id: 'doc1', score: 0.95, text: '...', metadata: {...} }]
```

**Best Practices:**
- Use text-embedding-3-small for cost efficiency (62% cheaper)
- Use text-embedding-3-large for maximum quality
- Batch embed when possible (much faster)
- Store original text in metadata for retrieval
- Use metadata filters for multi-tenant applications
- Implement chunking for long documents (max 8191 tokens)
- Monitor embedding costs (track number of API calls)
- Cache embeddings for frequently queried content
- Use namespaces in Pinecone for logical separation

**Common Patterns:**

```typescript
// Document chunking
function chunkText(text: string, maxTokens: number = 512): string[] {
  // Simple word-based chunking
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    // Rough estimate: 1 token ≈ 0.75 words
    if (currentChunk.length >= maxTokens * 0.75) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Hybrid search (keyword + semantic)
async function hybridSearch(
  query: string,
  vectorStore: VectorStore,
  fullTextIndex: any // Your keyword search system
): Promise<any[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorStore.search(query, { topK: 10 }),
    fullTextIndex.search(query, { limit: 10 }),
  ]);

  // Combine and re-rank
  const combinedResults = [...vectorResults, ...keywordResults];
  const uniqueResults = Array.from(
    new Map(combinedResults.map(r => [r.id, r])).values()
  );

  return uniqueResults
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);
}
```

**Gotchas:**
- Embeddings are not deterministic (slight variations)
- Dimension must match index configuration
- Metadata has size limits (40KB in Pinecone)
- Cosine similarity range is -1 to 1 (typically 0.7+ is relevant)
- Rate limits apply (especially on free tier)

### 3. RAG (Retrieval-Augmented Generation) Pipeline

**Philosophy:**
RAG combines retrieval from a knowledge base with LLM generation. This allows LLMs to access external knowledge without fine-tuning, reduces hallucinations, and provides source attribution.

**Architecture:**

```typescript
// src/ai/rag.ts
import { ClaudeClient } from './claude-client';
import { VectorStore } from './vector-store';

export class RAGPipeline {
  private claude: ClaudeClient;
  private vectorStore: VectorStore;

  constructor(config: {
    claudeClient?: ClaudeClient;
    vectorStore: VectorStore;
  }) {
    this.claude = config.claudeClient || new ClaudeClient();
    this.vectorStore = config.vectorStore;
  }

  /**
   * Query with RAG
   */
  async query(question: string, options?: {
    topK?: number;
    systemPrompt?: string;
    includeSource?: boolean;
  }): Promise<{
    answer: string;
    sources: Array<{ id: string; text: string; score: number }>;
  }> {
    // 1. Retrieve relevant documents
    const results = await this.vectorStore.search(question, {
      topK: options?.topK || 5,
    });

    // 2. Build context from top results
    const context = results
      .map((r, i) => `[${i + 1}] ${r.text}`)
      .join('\n\n');

    // 3. Build prompt
    const prompt = `Based on the following context, answer the question. If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

    // 4. Generate response
    const answer = await this.claude.send(prompt, {
      system: options?.systemPrompt || 'You are a helpful assistant that answers questions based on provided context.',
    });

    // 5. Return answer with sources
    return {
      answer: options?.includeSource
        ? `${answer}\n\nSources: ${results.map(r => r.id).join(', ')}`
        : answer,
      sources: results.map(r => ({
        id: r.id,
        text: r.text,
        score: r.score,
      })),
    };
  }

  /**
   * Streaming RAG query
   */
  async *queryStream(question: string, options?: {
    topK?: number;
    systemPrompt?: string;
  }): AsyncGenerator<string> {
    // Retrieve documents
    const results = await this.vectorStore.search(question, {
      topK: options?.topK || 5,
    });

    const context = results
      .map((r, i) => `[${i + 1}] ${r.text}`)
      .join('\n\n');

    const prompt = `Based on the following context, answer the question.

Context:
${context}

Question: ${question}

Answer:`;

    // Stream response
    for await (const token of this.claude.stream(prompt, {
      system: options?.systemPrompt,
    })) {
      yield token;
    }
  }

  /**
   * Multi-hop RAG (iterative retrieval)
   */
  async multiHopQuery(question: string, maxHops: number = 3): Promise<{
    answer: string;
    reasoning: string[];
  }> {
    const reasoning: string[] = [];
    let currentQuestion = question;
    let allContext = '';

    for (let hop = 0; hop < maxHops; hop++) {
      // Retrieve documents for current question
      const results = await this.vectorStore.search(currentQuestion, {
        topK: 3,
      });

      const context = results.map(r => r.text).join('\n\n');
      allContext += '\n\n' + context;

      // Ask Claude if it can answer or needs more info
      const response = await this.claude.send(
        `Context so far:\n${allContext}\n\nQuestion: ${question}\n\nCan you answer this question with the context provided? If yes, provide the answer. If no, what specific information do you need? Respond in JSON format: { "canAnswer": boolean, "answer": string | null, "nextQuestion": string | null }`,
        { system: 'You are a research assistant.' }
      );

      try {
        const parsed = JSON.parse(response);
        reasoning.push(`Hop ${hop + 1}: ${parsed.nextQuestion || 'Final answer'}`);

        if (parsed.canAnswer) {
          return {
            answer: parsed.answer,
            reasoning,
          };
        }

        currentQuestion = parsed.nextQuestion;
      } catch (error) {
        // Fallback: generate answer with available context
        const answer = await this.claude.send(
          `Based on this context, answer the question:\n\n${allContext}\n\nQuestion: ${question}`,
        );
        return { answer, reasoning };
      }
    }

    // Max hops reached, generate best answer
    const answer = await this.claude.send(
      `Based on all available context, answer this question:\n\n${allContext}\n\nQuestion: ${question}`,
    );

    return { answer, reasoning };
  }

  /**
   * Conversational RAG (maintains history)
   */
  async conversationalQuery(
    question: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { topK?: number }
  ): Promise<{
    answer: string;
    sources: Array<{ id: string; text: string }>;
  }> {
    // Retrieve documents
    const results = await this.vectorStore.search(question, {
      topK: options?.topK || 5,
    });

    const context = results.map(r => r.text).join('\n\n');

    // Build messages with history
    const messages = [
      ...history,
      {
        role: 'user' as const,
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ];

    const answer = await this.claude.sendConversation(messages, {
      system: 'You are a helpful assistant that answers questions based on provided context and conversation history.',
    });

    return {
      answer,
      sources: results.map(r => ({ id: r.id, text: r.text })),
    };
  }
}
```

**Usage Examples:**

```typescript
// Simple RAG query
const rag = new RAGPipeline({
  vectorStore: new VectorStore({ indexName: 'docs' }),
});

const result = await rag.query('What is Claude?');
console.log(result.answer);
console.log('Sources:', result.sources);

// Streaming RAG
for await (const token of rag.queryStream('Explain RAG')) {
  process.stdout.write(token);
}

// Multi-hop reasoning
const result = await rag.multiHopQuery(
  'How does Claude handle long contexts compared to GPT-4?'
);
console.log(result.answer);
console.log('Reasoning steps:', result.reasoning);

// Conversational RAG
const history = [
  { role: 'user', content: 'What is Anthropic?' },
  { role: 'assistant', content: 'Anthropic is an AI safety company...' },
];

const result = await rag.conversationalQuery(
  'Who founded it?',
  history
);
```

**Best Practices:**
- Retrieve more documents than you use (filter by relevance score)
- Set a relevance threshold (e.g., score > 0.7)
- Implement re-ranking for better results (use a cross-encoder)
- Include source citations in responses
- Handle "I don't know" cases gracefully
- Cache frequently asked questions
- Monitor retrieval quality (log scores, user feedback)
- Use conversational context for follow-up questions
- Implement query expansion for better retrieval

**Common Patterns:**

```typescript
// Relevance filtering
async function filterRelevantDocs(
  results: any[],
  threshold: number = 0.7
): Promise<any[]> {
  return results.filter(r => r.score >= threshold);
}

// Query expansion
async function expandQuery(
  query: string,
  claude: ClaudeClient
): Promise<string[]> {
  const response = await claude.send(
    `Generate 3 alternative phrasings of this query for better search results: "${query}"\nReturn as JSON array.`,
  );

  try {
    return JSON.parse(response);
  } catch {
    return [query];
  }
}

// Re-ranking with cross-encoder
import { pipeline } from '@xenova/transformers';

async function rerank(
  query: string,
  documents: string[]
): Promise<Array<{ text: string; score: number }>> {
  const reranker = await pipeline('text-classification',
    'cross-encoder/ms-marco-MiniLM-L-6-v2'
  );

  const scores = await Promise.all(
    documents.map(doc =>
      reranker(`${query} [SEP] ${doc}`)
    )
  );

  return documents
    .map((text, i) => ({ text, score: scores[i].score }))
    .sort((a, b) => b.score - a.score);
}
```

**Gotchas:**
- Context window limits (Claude: 200K tokens, but costs scale)
- Retrieval quality depends on embedding quality
- Too many documents can confuse the LLM
- Need to handle contradictory information in context
- User queries may need reformulation for better retrieval

### 4. Semantic Caching and Optimization

**Philosophy:**
AI API calls are expensive. Semantic caching stores responses based on meaning, not exact match. A cache hit can save 95% of costs and reduce latency from seconds to milliseconds.

**Architecture:**

```typescript
// src/ai/semantic-cache.ts
import { EmbeddingService } from './embeddings';
import Redis from 'ioredis';

export class SemanticCache {
  private redis: Redis;
  private embeddings: EmbeddingService;
  private similarityThreshold: number;
  private ttl: number;

  constructor(config?: {
    redisUrl?: string;
    embeddingService?: EmbeddingService;
    similarityThreshold?: number;
    ttl?: number; // seconds
  }) {
    this.redis = new Redis(config?.redisUrl || process.env.REDIS_URL!);
    this.embeddings = config?.embeddingService || new EmbeddingService();
    this.similarityThreshold = config?.similarityThreshold || 0.95;
    this.ttl = config?.ttl || 3600; // 1 hour default
  }

  /**
   * Get from cache if similar query exists
   */
  async get(prompt: string): Promise<string | null> {
    // Generate embedding for prompt
    const promptEmbedding = await this.embeddings.embed(prompt);

    // Get all cached embeddings
    const keys = await this.redis.keys('cache:*:embedding');

    for (const key of keys) {
      const cachedEmbedding = await this.redis.get(key);
      if (!cachedEmbedding) continue;

      const embedding = JSON.parse(cachedEmbedding);
      const similarity = this.embeddings.cosineSimilarity(
        promptEmbedding,
        embedding
      );

      if (similarity >= this.similarityThreshold) {
        // Cache hit! Return cached response
        const responseKey = key.replace(':embedding', ':response');
        const response = await this.redis.get(responseKey);

        // Update TTL
        await this.redis.expire(responseKey, this.ttl);
        await this.redis.expire(key, this.ttl);

        return response;
      }
    }

    return null;
  }

  /**
   * Store in cache
   */
  async set(prompt: string, response: string): Promise<void> {
    const embedding = await this.embeddings.embed(prompt);
    const id = this.generateId(prompt);

    await Promise.all([
      this.redis.setex(
        `cache:${id}:embedding`,
        this.ttl,
        JSON.stringify(embedding)
      ),
      this.redis.setex(
        `cache:${id}:response`,
        this.ttl,
        response
      ),
    ]);
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    const keys = await this.redis.keys('cache:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{
    entries: number;
    memoryUsage: string;
  }> {
    const keys = await this.redis.keys('cache:*:response');
    const info = await this.redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);

    return {
      entries: keys.length,
      memoryUsage: memoryMatch ? memoryMatch[1] : 'unknown',
    };
  }

  private generateId(text: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(text)
      .digest('hex')
      .slice(0, 16);
  }
}

// src/ai/cached-claude.ts
export class CachedClaudeClient extends ClaudeClient {
  private cache: SemanticCache;

  constructor(config?: {
    cache?: SemanticCache;
    apiKey?: string;
    model?: string;
  }) {
    super(config);
    this.cache = config?.cache || new SemanticCache();
  }

  async send(prompt: string, options?: {
    system?: string;
    temperature?: number;
    bypassCache?: boolean;
  }): Promise<string> {
    // Check cache first (unless bypassed)
    if (!options?.bypassCache) {
      const cached = await this.cache.get(prompt);
      if (cached) {
        console.log('[Cache HIT]', prompt.slice(0, 50));
        return cached;
      }
    }

    console.log('[Cache MISS]', prompt.slice(0, 50));

    // Call API
    const response = await super.send(prompt, options);

    // Store in cache
    await this.cache.set(prompt, response);

    return response;
  }
}
```

**Usage Examples:**

```typescript
// Use cached client
const claude = new CachedClaudeClient({
  cache: new SemanticCache({
    similarityThreshold: 0.95, // Very similar queries
    ttl: 3600, // Cache for 1 hour
  }),
});

// First call: cache miss, calls API
const response1 = await claude.send('What is the capital of France?');

// Similar call: cache hit, instant response
const response2 = await claude.send('What is France\'s capital city?');

// Very different: cache miss
const response3 = await claude.send('What is the weather today?');

// Check cache stats
const stats = await claude.cache.stats();
console.log(`Cache entries: ${stats.entries}`);
```

**Best Practices:**
- Use Redis for distributed caching across instances
- Set appropriate TTL based on content freshness needs
- Monitor cache hit rate (target 40%+)
- Use lower threshold (0.90) for more aggressive caching
- Invalidate cache when underlying data changes
- Log cache hits/misses for monitoring
- Consider cost savings vs. freshness tradeoff
- Use different caches for different use cases

**Common Patterns:**

```typescript
// Versioned caching (invalidate on data changes)
class VersionedCache extends SemanticCache {
  private version: string;

  constructor(config: any) {
    super(config);
    this.version = config.version || '1';
  }

  async get(prompt: string): Promise<string | null> {
    const versionedPrompt = `v${this.version}:${prompt}`;
    return super.get(versionedPrompt);
  }

  async set(prompt: string, response: string): Promise<void> {
    const versionedPrompt = `v${this.version}:${prompt}`;
    return super.set(versionedPrompt, response);
  }

  async invalidate(): Promise<void> {
    this.version = Date.now().toString();
  }
}

// Tiered caching (memory + Redis)
class TieredCache extends SemanticCache {
  private memoryCache = new Map<string, { response: string; timestamp: number }>();
  private memoryCacheTTL = 300; // 5 minutes

  async get(prompt: string): Promise<string | null> {
    // Check memory first
    const cached = this.memoryCache.get(prompt);
    if (cached && Date.now() - cached.timestamp < this.memoryCacheTTL * 1000) {
      return cached.response;
    }

    // Check Redis
    const response = await super.get(prompt);
    if (response) {
      // Store in memory
      this.memoryCache.set(prompt, {
        response,
        timestamp: Date.now(),
      });
    }

    return response;
  }
}
```

**Gotchas:**
- Embedding generation adds latency to cache checks
- Cache can return stale data if TTL is too long
- Need to handle cache failures gracefully
- Memory usage grows with cache size
- Similarity threshold requires tuning per use case

### 5. Agent Frameworks and Tool Calling

**Philosophy:**
Modern AI agents can use tools (functions) to extend their capabilities. This enables AI to query databases, call APIs, execute code, and more. The key is designing reliable tool interfaces and orchestration.

**Architecture:**

```typescript
// src/ai/tools.ts
import { z } from 'zod';

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
  execute: z.function(),
});

export type Tool = z.infer<typeof ToolSchema>;

// Example tools
export const tools = {
  calculator: {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 2")',
        },
      },
      required: ['expression'],
    },
    execute: async ({ expression }: { expression: string }) => {
      try {
        // Safe eval using Function constructor
        const result = new Function(`return ${expression}`)();
        return { result };
      } catch (error: any) {
        return { error: error.message };
      }
    },
  },

  search: {
    name: 'search',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
    execute: async ({ query }: { query: string }) => {
      // Implement web search (Tavily, Brave, etc.)
      const response = await fetch(
        `https://api.tavily.com/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
          },
        }
      );
      return await response.json();
    },
  },

  database: {
    name: 'query_database',
    description: 'Query the database for information',
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query to execute' },
      },
      required: ['sql'],
    },
    execute: async ({ sql }: { sql: string }) => {
      // Implement safe SQL execution
      // In production, use parameterized queries and validation
      return { rows: [], message: 'SQL execution not implemented' };
    },
  },
};

// src/ai/agent.ts
export class Agent {
  private claude: ClaudeClient;
  private tools: Map<string, any>;
  private maxIterations: number;

  constructor(config: {
    claudeClient?: ClaudeClient;
    tools: any[];
    maxIterations?: number;
  }) {
    this.claude = config.claudeClient || new ClaudeClient();
    this.tools = new Map(config.tools.map(t => [t.name, t]));
    this.maxIterations = config.maxIterations || 10;
  }

  /**
   * Run agent with tool access
   */
  async run(task: string, options?: {
    systemPrompt?: string;
    verbose?: boolean;
  }): Promise<{
    result: string;
    toolCalls: Array<{ tool: string; input: any; output: any }>;
    iterations: number;
  }> {
    const toolCalls: Array<{ tool: string; input: any; output: any }> = [];
    let iterations = 0;

    const toolDefinitions = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));

    const response = await this.claude.callWithTools(
      task,
      toolDefinitions,
      {
        system: options?.systemPrompt || 'You are a helpful AI assistant with access to tools.',
        onToolCall: async (name, input) => {
          iterations++;

          if (iterations > this.maxIterations) {
            throw new Error('Max iterations exceeded');
          }

          const tool = this.tools.get(name);
          if (!tool) {
            throw new Error(`Tool ${name} not found`);
          }

          if (options?.verbose) {
            console.log(`[Tool Call ${iterations}] ${name}`, input);
          }

          const output = await tool.execute(input);

          if (options?.verbose) {
            console.log(`[Tool Output ${iterations}]`, output);
          }

          toolCalls.push({ tool: name, input, output });

          return output;
        },
      }
    );

    return {
      result: response.text,
      toolCalls: response.toolCalls,
      iterations,
    };
  }

  /**
   * Stream agent execution
   */
  async *runStream(task: string, options?: {
    systemPrompt?: string;
    onToolCall?: (name: string, input: any) => void;
  }): AsyncGenerator<{ type: 'text' | 'tool_call'; content: any }> {
    // Implement streaming with tool calls
    // This is complex with Claude's API, but doable
    yield { type: 'text', content: 'Streaming with tools not yet implemented' };
  }
}
```

**Usage Examples:**

```typescript
// Create agent with tools
const agent = new Agent({
  tools: [tools.calculator, tools.search],
  maxIterations: 5,
});

// Run task
const result = await agent.run(
  'What is 15% of the population of France? Search for France\'s current population first.',
  { verbose: true }
);

console.log(result.result);
console.log(`Tool calls: ${result.toolCalls.length}`);
console.log(`Iterations: ${result.iterations}`);

// Output:
// [Tool Call 1] search { query: 'France population 2025' }
// [Tool Output 1] { population: 67000000 }
// [Tool Call 2] calculator { expression: '67000000 * 0.15' }
// [Tool Output 2] { result: 10050000 }
// Result: "15% of France's population (67 million) is 10.05 million people."
```

**Best Practices:**
- Validate tool inputs with Zod schemas
- Implement rate limiting on tools
- Log all tool executions for debugging
- Set max iterations to prevent infinite loops
- Handle tool errors gracefully
- Use tool descriptions that guide the LLM
- Implement tool execution timeouts
- Consider security implications (SQL injection, etc.)
- Test tools independently before using with LLM

**Common Patterns:**

```typescript
// Tool with validation
const validatedTool = {
  name: 'send_email',
  description: 'Send an email to a user',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', format: 'email' },
      subject: { type: 'string' },
      body: { type: 'string' },
    },
    required: ['to', 'subject', 'body'],
  },
  execute: async (input: any) => {
    // Validate with Zod
    const schema = z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    });

    const validated = schema.parse(input);

    // Send email
    // await emailService.send(validated);

    return { success: true };
  },
};

// Composable tools (one tool calls another)
const composedTools = {
  research: {
    name: 'research_topic',
    description: 'Research a topic and summarize findings',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
      },
      required: ['topic'],
    },
    execute: async ({ topic }: { topic: string }) => {
      // Use search tool
      const searchResult = await tools.search.execute({
        query: topic,
      });

      // Summarize with Claude
      const claude = new ClaudeClient();
      const summary = await claude.send(
        `Summarize these search results about ${topic}:\n\n${JSON.stringify(searchResult)}`
      );

      return { summary };
    },
  },
};
```

**Gotchas:**
- Tool calling adds latency (one round-trip per tool)
- LLMs can hallucinate tool names or parameters
- Need to handle partial tool results gracefully
- Tool calling costs scale with iterations
- Some tasks may loop if not converging

### 6. Memory Systems and Context Management

**Philosophy:**
Long-running AI applications need memory to maintain context across sessions. This includes conversation history, user preferences, learned facts, and long-term knowledge.

**Architecture:**

```typescript
// src/ai/memory.ts
import { VectorStore } from './vector-store';
import { z } from 'zod';

const MemorySchema = z.object({
  id: z.string(),
  type: z.enum(['conversation', 'fact', 'preference', 'event']),
  content: z.string(),
  metadata: z.object({
    timestamp: z.number(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    importance: z.number().min(0).max(1).optional(),
  }),
});

export type Memory = z.infer<typeof MemorySchema>;

export class MemorySystem {
  private vectorStore: VectorStore;
  private shortTermMemory: Memory[] = [];
  private maxShortTermMemories: number;

  constructor(config: {
    vectorStore: VectorStore;
    maxShortTermMemories?: number;
  }) {
    this.vectorStore = config.vectorStore;
    this.maxShortTermMemories = config.maxShortTermMemories || 20;
  }

  /**
   * Add a memory
   */
  async remember(memory: Omit<Memory, 'id'>): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullMemory: Memory = { id, ...memory };

    // Add to short-term memory
    this.shortTermMemory.push(fullMemory);

    // Trim if too large
    if (this.shortTermMemory.length > this.maxShortTermMemories) {
      const removed = this.shortTermMemory.shift()!;

      // Move to long-term (vector store) if important
      if (removed.metadata.importance && removed.metadata.importance > 0.5) {
        await this.vectorStore.upsert([{
          id: removed.id,
          text: removed.content,
          metadata: {
            type: removed.type,
            ...removed.metadata,
          },
        }]);
      }
    }

    return id;
  }

  /**
   * Recall relevant memories
   */
  async recall(query: string, options?: {
    topK?: number;
    type?: Memory['type'];
    userId?: string;
  }): Promise<Memory[]> {
    // Search short-term memory
    const shortTerm = this.shortTermMemory.filter(m => {
      if (options?.type && m.type !== options.type) return false;
      if (options?.userId && m.metadata.userId !== options.userId) return false;
      return m.content.toLowerCase().includes(query.toLowerCase());
    });

    // Search long-term memory (vector store)
    const filter: any = {};
    if (options?.type) filter.type = options.type;
    if (options?.userId) filter.userId = options.userId;

    const longTerm = await this.vectorStore.search(query, {
      topK: options?.topK || 5,
      filter,
    });

    // Combine and deduplicate
    const allMemories = [
      ...shortTerm,
      ...longTerm.map(r => ({
        id: r.id,
        type: r.metadata.type as Memory['type'],
        content: r.text,
        metadata: {
          timestamp: r.metadata.timestamp,
          userId: r.metadata.userId,
          sessionId: r.metadata.sessionId,
          importance: r.metadata.importance,
        },
      })),
    ];

    const unique = Array.from(
      new Map(allMemories.map(m => [m.id, m])).values()
    );

    return unique
      .sort((a, b) => (b.metadata.importance || 0) - (a.metadata.importance || 0))
      .slice(0, options?.topK || 10);
  }

  /**
   * Forget a memory
   */
  async forget(id: string): Promise<void> {
    // Remove from short-term
    this.shortTermMemory = this.shortTermMemory.filter(m => m.id !== id);

    // Remove from long-term
    await this.vectorStore.delete([id]);
  }

  /**
   * Get conversation summary
   */
  async summarizeConversation(
    sessionId: string,
    claude: ClaudeClient
  ): Promise<string> {
    const memories = await this.recall('', {
      type: 'conversation',
    });

    const conversationMemories = memories.filter(
      m => m.metadata.sessionId === sessionId
    );

    if (conversationMemories.length === 0) {
      return 'No conversation history.';
    }

    const conversation = conversationMemories
      .sort((a, b) => a.metadata.timestamp - b.metadata.timestamp)
      .map(m => m.content)
      .join('\n');

    const summary = await claude.send(
      `Summarize this conversation in 2-3 sentences:\n\n${conversation}`,
      { system: 'You are a helpful assistant that summarizes conversations.' }
    );

    // Store summary as a fact
    await this.remember({
      type: 'fact',
      content: `Conversation summary (${sessionId}): ${summary}`,
      metadata: {
        timestamp: Date.now(),
        sessionId,
        importance: 0.8,
      },
    });

    return summary;
  }

  /**
   * Extract facts from conversation
   */
  async extractFacts(
    content: string,
    claude: ClaudeClient,
    metadata: Memory['metadata']
  ): Promise<void> {
    const response = await claude.send(
      `Extract important facts from this text. Return as JSON array of strings:\n\n${content}`,
      { system: 'You extract facts from text.' }
    );

    try {
      const facts: string[] = JSON.parse(response);

      for (const fact of facts) {
        await this.remember({
          type: 'fact',
          content: fact,
          metadata: {
            ...metadata,
            importance: 0.7,
          },
        });
      }
    } catch (error) {
      console.error('Failed to extract facts:', error);
    }
  }

  /**
   * Get memory statistics
   */
  stats(): {
    shortTerm: number;
    byType: Record<Memory['type'], number>;
  } {
    const byType = this.shortTermMemory.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<Memory['type'], number>);

    return {
      shortTerm: this.shortTermMemory.length,
      byType,
    };
  }
}

// src/ai/conversational-agent.ts
export class ConversationalAgent {
  private agent: Agent;
  private memory: MemorySystem;
  private sessionId: string;

  constructor(config: {
    agent: Agent;
    memory: MemorySystem;
    sessionId: string;
  }) {
    this.agent = config.agent;
    this.memory = config.memory;
    this.sessionId = config.sessionId;
  }

  async chat(message: string, userId?: string): Promise<string> {
    // Remember user message
    await this.memory.remember({
      type: 'conversation',
      content: `User: ${message}`,
      metadata: {
        timestamp: Date.now(),
        userId,
        sessionId: this.sessionId,
        importance: 0.5,
      },
    });

    // Recall relevant context
    const relevantMemories = await this.memory.recall(message, {
      topK: 5,
      userId,
    });

    const context = relevantMemories.length > 0
      ? `Relevant context:\n${relevantMemories.map(m => m.content).join('\n')}\n\n`
      : '';

    // Run agent with context
    const result = await this.agent.run(
      `${context}User message: ${message}`,
      {
        systemPrompt: 'You are a helpful conversational AI assistant with memory.',
      }
    );

    // Remember assistant response
    await this.memory.remember({
      type: 'conversation',
      content: `Assistant: ${result.result}`,
      metadata: {
        timestamp: Date.now(),
        userId,
        sessionId: this.sessionId,
        importance: 0.5,
      },
    });

    // Extract facts for long-term memory
    await this.memory.extractFacts(
      `${message}\n${result.result}`,
      this.agent['claude'],
      {
        timestamp: Date.now(),
        userId,
        sessionId: this.sessionId,
      }
    );

    return result.result;
  }
}
```

**Usage Examples:**

```typescript
// Initialize memory system
const memory = new MemorySystem({
  vectorStore: new VectorStore({ indexName: 'memories' }),
  maxShortTermMemories: 20,
});

// Create conversational agent
const conversationalAgent = new ConversationalAgent({
  agent: new Agent({ tools: [] }),
  memory,
  sessionId: 'session_123',
});

// Chat with memory
const response1 = await conversationalAgent.chat(
  'My favorite color is blue',
  'user_456'
);

const response2 = await conversationalAgent.chat(
  'What is my favorite color?',
  'user_456'
);
// Response: "Your favorite color is blue."

// Get conversation summary
const summary = await memory.summarizeConversation(
  'session_123',
  new ClaudeClient()
);
console.log(summary);
```

**Best Practices:**
- Store conversation history for context
- Extract and store important facts
- Implement importance scoring for memory retention
- Use vector search for semantic recall
- Implement memory decay (older = less important)
- Separate short-term (fast) and long-term (persistent) memory
- Compress old conversations into summaries
- Handle memory limits gracefully
- Implement privacy controls (user can delete memories)

**Common Patterns:**

```typescript
// Memory decay (reduce importance over time)
async function decayMemories(memory: MemorySystem, decayRate: number = 0.1) {
  // Implement in your MemorySystem class
  // Reduce importance by decayRate per day
}

// Memory consolidation (compress multiple memories)
async function consolidateMemories(
  memories: Memory[],
  claude: ClaudeClient
): Promise<Memory> {
  const combined = memories.map(m => m.content).join('\n');
  const summary = await claude.send(
    `Consolidate these memories into a single concise memory:\n\n${combined}`
  );

  return {
    id: `consolidated_${Date.now()}`,
    type: 'fact',
    content: summary,
    metadata: {
      timestamp: Date.now(),
      importance: Math.max(...memories.map(m => m.metadata.importance || 0)),
    },
  };
}

// Importance scoring
function scoreImportance(memory: Memory, context: {
  userEngagement: number; // 0-1
  recallFrequency: number; // number of times recalled
  recency: number; // days since created
}): number {
  const baseImportance = memory.metadata.importance || 0.5;
  const engagementBoost = context.userEngagement * 0.3;
  const frequencyBoost = Math.min(context.recallFrequency * 0.1, 0.3);
  const recencyPenalty = Math.max(0, context.recency * 0.01);

  return Math.min(
    1,
    baseImportance + engagementBoost + frequencyBoost - recencyPenalty
  );
}
```

**Gotchas:**
- Memory systems can grow unbounded without pruning
- Vector search for memories adds latency
- Privacy concerns with storing user data
- Memory retrieval quality depends on query formulation
- Need to handle conflicting memories

## 💡 Real-World Examples

### Example 1: AI Documentation Assistant

A production RAG system that answers questions about your codebase.

```typescript
// src/examples/docs-assistant.ts
import { ClaudeClient } from '../ai/claude-client';
import { VectorStore } from '../ai/vector-store';
import { RAGPipeline } from '../ai/rag';
import { SemanticCache } from '../ai/semantic-cache';
import { CachedClaudeClient } from '../ai/cached-claude';

async function buildDocsAssistant() {
  // Initialize components
  const vectorStore = new VectorStore({
    indexName: 'documentation',
  });

  const claude = new CachedClaudeClient({
    cache: new SemanticCache({
      similarityThreshold: 0.92,
      ttl: 7200, // 2 hours
    }),
  });

  const rag = new RAGPipeline({
    claudeClient: claude,
    vectorStore,
  });

  // Ingest documentation
  await ingestDocs(vectorStore);

  // Query function
  return async function query(question: string): Promise<string> {
    const result = await rag.query(question, {
      topK: 3,
      systemPrompt: 'You are a helpful documentation assistant. Answer based on the provided context. If the answer is not in the context, say "I don\'t have information about that in the documentation."',
      includeSource: true,
    });

    return result.answer;
  };
}

async function ingestDocs(vectorStore: VectorStore) {
  // Read all .md files from docs/
  const { glob } = await import('glob');
  const { readFile } = await import('fs/promises');

  const files = await glob('docs/**/*.md');

  const documents = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file, 'utf-8');
      const chunks = chunkMarkdown(content);

      return chunks.map((chunk, i) => ({
        id: `${file}#${i}`,
        text: chunk,
        metadata: {
          file,
          chunkIndex: i,
        },
      }));
    })
  );

  // Flatten and upsert
  const allDocs = documents.flat();
  await vectorStore.upsert(allDocs);

  console.log(`Ingested ${allDocs.length} document chunks`);
}

function chunkMarkdown(content: string, maxChunkSize: number = 1000): string[] {
  // Split by ## headers
  const sections = content.split(/^##\s+/m);
  const chunks: string[] = [];

  for (const section of sections) {
    if (section.length <= maxChunkSize) {
      chunks.push(section);
    } else {
      // Further split large sections
      const words = section.split(/\s+/);
      let currentChunk: string[] = [];

      for (const word of words) {
        currentChunk.push(word);
        if (currentChunk.join(' ').length >= maxChunkSize) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }
    }
  }

  return chunks;
}

// Usage
const query = await buildDocsAssistant();
const answer = await query('How do I implement RAG?');
console.log(answer);
```

### Example 2: AI Code Review Agent

An agent that reviews pull requests and suggests improvements.

```typescript
// src/examples/code-review-agent.ts
import { Agent } from '../ai/agent';
import { ClaudeClient } from '../ai/claude-client';

const codeReviewTools = [
  {
    name: 'get_pr_diff',
    description: 'Get the diff for a pull request',
    parameters: {
      type: 'object',
      properties: {
        prNumber: { type: 'number' },
      },
      required: ['prNumber'],
    },
    execute: async ({ prNumber }: { prNumber: number }) => {
      // Call GitHub API
      const response = await fetch(
        `https://api.github.com/repos/owner/repo/pulls/${prNumber}`,
        {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      );

      const pr = await response.json();
      const diffResponse = await fetch(pr.diff_url);
      const diff = await diffResponse.text();

      return { diff, title: pr.title, body: pr.body };
    },
  },

  {
    name: 'post_review_comment',
    description: 'Post a review comment on a pull request',
    parameters: {
      type: 'object',
      properties: {
        prNumber: { type: 'number' },
        comment: { type: 'string' },
        path: { type: 'string' },
        line: { type: 'number' },
      },
      required: ['prNumber', 'comment'],
    },
    execute: async (params: any) => {
      // Post comment to GitHub
      console.log('Would post comment:', params);
      return { success: true };
    },
  },

  {
    name: 'run_linter',
    description: 'Run linter on changed files',
    parameters: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
      },
      required: ['files'],
    },
    execute: async ({ files }: { files: string[] }) => {
      // Run ESLint or similar
      return {
        errors: [],
        warnings: ['Prefer const over let'],
      };
    },
  },
];

async function reviewPR(prNumber: number): Promise<string> {
  const agent = new Agent({
    tools: codeReviewTools,
    maxIterations: 10,
  });

  const result = await agent.run(
    `Review pull request #${prNumber}. Check for:
1. Code quality issues
2. Security vulnerabilities
3. Performance problems
4. Best practice violations
5. Missing tests

Get the PR diff, run the linter, and post constructive feedback.`,
    {
      systemPrompt: 'You are an expert code reviewer. Be constructive, specific, and helpful.',
      verbose: true,
    }
  );

  return result.result;
}

// Usage
const review = await reviewPR(123);
console.log(review);
```

## 🔗 Related Skills

- **react-nextjs-stack** - Frontend integration for AI features
- **api-design-patterns** - REST/GraphQL APIs for AI backends
- **postgres-prisma-stack** - Store conversation history and user data
- **observability-stack** - Monitor AI costs and performance

## 📖 Further Reading

- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Vector Database Docs](https://docs.pinecone.io/)
- [Building RAG Applications](https://www.anthropic.com/research/retrieval-augmented-generation)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
