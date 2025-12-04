# Embeddings & RAG Expert

> **ID:** `embeddings-expert`
> **Tier:** 2
> **Token Cost:** 10000
> **MCP Connections:** context7, pinecone, qdrant

## 🎯 What This Skill Does

- Vector embeddings generation with OpenAI, Cohere, Voyage AI
- Vector database integration (Pinecone, Qdrant, Weaviate, ChromaDB)
- Advanced chunking strategies (token-aware, semantic, recursive)
- Similarity search and semantic retrieval
- Reranking with Cohere Rerank API
- Complete RAG (Retrieval Augmented Generation) pipelines
- Multi-tenant vector isolation patterns
- Cost optimization for embeddings at scale
- Production-ready code search and document QA systems

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** embeddings, vector, rag, retrieval, semantic search, similarity, pinecone, qdrant, weaviate, chromadb, rerank
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities

### 1. Embeddings Generation

**OpenAI Embeddings (text-embedding-3-small, text-embedding-3-large)**

```typescript
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Single text embedding
async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", // 1536 dims, $0.02/1M tokens
    input: text,
    encoding_format: "float", // or "base64"
  });

  return response.data[0].embedding;
}

// Batch embeddings (up to 2048 inputs)
async function batchEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large", // 3072 dims, $0.13/1M tokens
    input: texts,
  });

  return response.data.map(d => d.embedding);
}

// Reduced dimensionality (for cost/storage savings)
async function getReducedEmbedding(text: string, dimensions: number = 1024) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
    dimensions, // 256-3072 for large, 256-1536 for small
  });

  return response.data[0].embedding;
}
```

**Cohere Embeddings (embed-english-v3.0, embed-multilingual-v3.0)**

```typescript
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// High-quality embeddings with input type
async function getCohereEmbedding(
  texts: string[],
  inputType: "search_document" | "search_query" | "classification" | "clustering"
) {
  const response = await cohere.embed({
    model: "embed-english-v3.0", // 1024 dims
    texts,
    inputType,
    embeddingTypes: ["float"],
  });

  return response.embeddings.float!;
}

// Usage pattern
const docEmbeddings = await getCohereEmbedding(
  ["Document 1", "Document 2"],
  "search_document"
);

const queryEmbedding = await getCohereEmbedding(["user query"], "search_query");
```

**Voyage AI Embeddings (voyage-large-2, voyage-code-2)**

```typescript
import voyageai from "voyageai";

const voyage = new voyageai.Client({
  apiKey: process.env.VOYAGE_API_KEY,
});

// General purpose embeddings
async function getVoyageEmbedding(texts: string[]) {
  const response = await voyage.embed({
    model: "voyage-large-2", // 1536 dims, best quality
    input: texts,
    inputType: "document", // or "query"
  });

  return response.embeddings;
}

// Code-optimized embeddings
async function getCodeEmbedding(codeSnippets: string[]) {
  const response = await voyage.embed({
    model: "voyage-code-2", // 1536 dims, optimized for code
    input: codeSnippets,
    inputType: "document",
  });

  return response.embeddings;
}
```

**Best Practices:**

- Use `text-embedding-3-small` for cost-sensitive applications ($0.02/1M tokens)
- Use `text-embedding-3-large` for highest quality retrieval ($0.13/1M tokens)
- Use Cohere for multilingual needs and built-in reranking
- Use Voyage AI for code embeddings (`voyage-code-2`)
- Always specify `inputType` for Cohere (improves quality by ~5%)
- Batch embeddings requests (up to 2048 texts) for better throughput
- Cache embeddings - they're deterministic for same model + text

**Common Patterns:**

```typescript
// Embedding cache layer
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

async function getCachedEmbedding(text: string): Promise<number[]> {
  const cacheKey = `emb:${Buffer.from(text).toString("base64").slice(0, 32)}`;

  const cached = await redis.get<number[]>(cacheKey);
  if (cached) return cached;

  const embedding = await getEmbedding(text);
  await redis.set(cacheKey, embedding, { ex: 7 * 24 * 60 * 60 }); // 7 days

  return embedding;
}

// Cost tracking
let totalTokens = 0;

async function getEmbeddingWithTracking(text: string) {
  const tokens = estimateTokens(text); // rough estimate
  totalTokens += tokens;

  console.log(
    `Tokens used: ${tokens}, Total: ${totalTokens}, Cost: $${(totalTokens / 1_000_000) * 0.02}`
  );

  return await getEmbedding(text);
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}
```

**Gotchas:**

- OpenAI embeddings are NOT deterministic across API versions
- Cohere requires different embeddings for documents vs queries
- Voyage AI code embeddings work best with full functions, not snippets
- Never mix embeddings from different models (incompatible vector spaces)
- Rate limits: OpenAI 3000 RPM, Cohere 10k RPM, Voyage 300 RPM

### 2. Vector Databases

**Pinecone (Managed, Production-Ready)**

```typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize index
const index = pinecone.index("my-index");

// Upsert vectors
async function upsertVectors(
  documents: Array<{ id: string; text: string; metadata: Record<string, any> }>
) {
  const embeddings = await batchEmbeddings(documents.map(d => d.text));

  await index.upsert(
    documents.map((doc, i) => ({
      id: doc.id,
      values: embeddings[i],
      metadata: {
        text: doc.text,
        ...doc.metadata,
      },
    }))
  );
}

// Query with filters
async function semanticSearch(query: string, filter?: Record<string, any>) {
  const queryEmbedding = await getEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK: 10,
    includeMetadata: true,
    filter, // e.g., { userId: "123", category: "docs" }
  });

  return results.matches.map(match => ({
    id: match.id,
    score: match.score,
    text: match.metadata?.text,
    metadata: match.metadata,
  }));
}

// Namespace isolation (multi-tenant)
async function upsertWithNamespace(namespace: string, vectors: any[]) {
  const ns = index.namespace(namespace);
  await ns.upsert(vectors);
}

async function queryNamespace(namespace: string, query: string) {
  const queryEmbedding = await getEmbedding(query);
  const ns = index.namespace(namespace);

  return await ns.query({
    vector: queryEmbedding,
    topK: 10,
    includeMetadata: true,
  });
}
```

**Qdrant (Open Source, Self-Hosted)**

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

// Create collection
async function createCollection() {
  await qdrant.createCollection("documents", {
    vectors: {
      size: 1536,
      distance: "Cosine", // or "Euclid", "Dot"
    },
  });
}

// Upsert with payload filtering
async function upsertQdrant(
  documents: Array<{ id: string; text: string; metadata: any }>
) {
  const embeddings = await batchEmbeddings(documents.map(d => d.text));

  await qdrant.upsert("documents", {
    points: documents.map((doc, i) => ({
      id: doc.id,
      vector: embeddings[i],
      payload: {
        text: doc.text,
        ...doc.metadata,
      },
    })),
  });
}

// Search with filters
async function searchQdrant(query: string, filter?: any) {
  const queryEmbedding = await getEmbedding(query);

  const results = await qdrant.search("documents", {
    vector: queryEmbedding,
    limit: 10,
    filter, // Qdrant filter DSL
    with_payload: true,
  });

  return results.map(r => ({
    id: r.id,
    score: r.score,
    text: r.payload?.text,
    metadata: r.payload,
  }));
}

// Complex filtering
const filter = {
  must: [
    { key: "userId", match: { value: "user123" } },
    { key: "category", match: { value: "docs" } },
  ],
  should: [{ key: "priority", match: { value: "high" } }],
  must_not: [{ key: "archived", match: { value: true } }],
};
```

**ChromaDB (Local Development, Prototyping)**

```typescript
import { ChromaClient } from "chromadb";

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

// Get or create collection
const collection = await chroma.getOrCreateCollection({
  name: "documents",
  metadata: { "hnsw:space": "cosine" },
});

// Add documents
await collection.add({
  ids: ["doc1", "doc2"],
  embeddings: await batchEmbeddings(["text1", "text2"]),
  documents: ["text1", "text2"],
  metadatas: [{ type: "article" }, { type: "blog" }],
});

// Query
const results = await collection.query({
  queryEmbeddings: [await getEmbedding("query")],
  nResults: 10,
  where: { type: "article" }, // Filter
});
```

**Weaviate (Hybrid Search, Production)**

```typescript
import weaviate from "weaviate-ts-client";

const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_HOST!,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

// Define schema
await client.schema
  .classCreator()
  .withClass({
    class: "Document",
    vectorizer: "none", // we provide embeddings
    properties: [
      { name: "text", dataType: ["text"] },
      { name: "category", dataType: ["string"] },
    ],
  })
  .do();

// Insert with vector
await client.data
  .creator()
  .withClassName("Document")
  .withProperties({
    text: "example",
    category: "docs",
  })
  .withVector(await getEmbedding("example"))
  .do();

// Hybrid search (vector + keyword)
const results = await client.graphql
  .get()
  .withClassName("Document")
  .withHybrid({
    query: "search term",
    alpha: 0.7, // 0=keyword, 1=vector, 0.7=balanced
  })
  .withLimit(10)
  .withFields("text category _additional { distance }")
  .do();
```

**Best Practices:**

- Use Pinecone for managed, zero-ops production workloads
- Use Qdrant for self-hosted with advanced filtering needs
- Use ChromaDB for local dev and prototyping
- Use Weaviate for hybrid search (vector + BM25)
- Always use namespaces or filters for multi-tenant isolation
- Set appropriate `topK` limits (10-50 for most use cases)
- Use metadata filtering to reduce search space before vector comparison
- Batch upserts (100-1000 vectors at a time) for better performance

**Gotchas:**

- Pinecone pricing: $70/mo for 100k vectors (1536 dims)
- Qdrant: Requires careful index tuning for large datasets (>1M vectors)
- ChromaDB: Not production-ready (single-node, no HA)
- Weaviate: Higher complexity, best for advanced use cases
- Always normalize vectors if using "Cosine" distance (most libraries do this)

### 3. Chunking Strategies

**Token-Aware Chunking (Respects token limits)**

```typescript
import { encoding_for_model } from "tiktoken";

const encoder = encoding_for_model("gpt-4");

function chunkByTokens(
  text: string,
  maxTokens: number = 512,
  overlap: number = 50
): string[] {
  const tokens = encoder.encode(text);
  const chunks: string[] = [];

  for (let i = 0; i < tokens.length; i += maxTokens - overlap) {
    const chunkTokens = tokens.slice(i, i + maxTokens);
    const chunkText = encoder.decode(chunkTokens);
    chunks.push(chunkText);
  }

  encoder.free();
  return chunks;
}

// Usage
const chunks = chunkByTokens(longDocument, 512, 50);
```

**Semantic Chunking (Respects sentence boundaries)**

```typescript
import * as natural from "natural";

const tokenizer = new natural.SentenceTokenizer();

function chunkBySentences(
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const sentences = tokenizer.tokenize(text);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (
      (currentChunk + sentence).length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());

      // Overlap: keep last N chars
      currentChunk = currentChunk.slice(-overlap) + " " + sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

**Recursive Character Splitting (LangChain-style)**

```typescript
function recursiveChunk(
  text: string,
  maxChunkSize: number = 1000,
  separators: string[] = ["\n\n", "\n", ". ", " ", ""]
): string[] {
  const chunks: string[] = [];

  function split(text: string, separatorIndex: number) {
    if (text.length <= maxChunkSize) {
      chunks.push(text);
      return;
    }

    if (separatorIndex >= separators.length) {
      // Force split if no separator works
      for (let i = 0; i < text.length; i += maxChunkSize) {
        chunks.push(text.slice(i, i + maxChunkSize));
      }
      return;
    }

    const separator = separators[separatorIndex];
    const parts = text.split(separator);

    if (parts.length === 1) {
      // Separator not found, try next
      split(text, separatorIndex + 1);
      return;
    }

    let currentChunk = "";

    for (const part of parts) {
      const potential = currentChunk ? currentChunk + separator + part : part;

      if (potential.length <= maxChunkSize) {
        currentChunk = potential;
      } else {
        if (currentChunk) chunks.push(currentChunk);

        if (part.length > maxChunkSize) {
          split(part, separatorIndex + 1);
        } else {
          currentChunk = part;
        }
      }
    }

    if (currentChunk) chunks.push(currentChunk);
  }

  split(text, 0);
  return chunks;
}
```

**Markdown-Aware Chunking (Preserves structure)**

```typescript
function chunkMarkdown(markdown: string, maxChunkSize: number = 1000): string[] {
  const lines = markdown.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";
  let currentHeader = "";

  for (const line of lines) {
    // Track headers for context
    if (line.match(/^#{1,6} /)) {
      currentHeader = line + "\n";
    }

    const potential = currentChunk + line + "\n";

    if (potential.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Start new chunk with header context
      currentChunk = currentHeader + line + "\n";
    } else {
      currentChunk = potential;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

**Code-Aware Chunking (Respects function boundaries)**

```typescript
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

function chunkCode(code: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      // Extract complete functions
      FunctionDeclaration(path) {
        const functionCode = code.slice(path.node.start!, path.node.end!);
        if (functionCode.length <= maxChunkSize) {
          chunks.push(functionCode);
        } else {
          // If function is too large, fall back to recursive chunking
          chunks.push(...recursiveChunk(functionCode, maxChunkSize));
        }
      },
      // Extract classes
      ClassDeclaration(path) {
        const classCode = code.slice(path.node.start!, path.node.end!);
        if (classCode.length <= maxChunkSize) {
          chunks.push(classCode);
        } else {
          chunks.push(...recursiveChunk(classCode, maxChunkSize));
        }
      },
    });
  } catch (error) {
    // Parsing failed, fall back to basic chunking
    return recursiveChunk(code, maxChunkSize);
  }

  return chunks;
}
```

**Best Practices:**

- Use token-aware chunking for LLM context limits
- Use semantic chunking for better retrieval quality
- Use code-aware chunking for code search
- Use markdown-aware chunking for documentation
- Always add overlap (10-20% of chunk size) to preserve context
- Store original document ID + chunk index in metadata
- Ideal chunk size: 512-1024 tokens (balances context vs precision)
- Test different chunk sizes - quality varies by domain

**Common Patterns:**

```typescript
// Complete chunking pipeline with metadata
interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  headers?: string[];
}

async function chunkAndEmbed(
  documentId: string,
  text: string,
  chunkSize: number = 512
): Promise<Array<{ embedding: number[]; metadata: ChunkMetadata }>> {
  const chunks = chunkByTokens(text, chunkSize, 50);
  const embeddings = await batchEmbeddings(chunks);

  return chunks.map((chunk, i) => ({
    embedding: embeddings[i],
    metadata: {
      documentId,
      chunkIndex: i,
      totalChunks: chunks.length,
      startChar: text.indexOf(chunk),
      endChar: text.indexOf(chunk) + chunk.length,
    },
  }));
}
```

**Gotchas:**

- Don't chunk too small (<256 tokens) - loses context
- Don't chunk too large (>1024 tokens) - reduces precision
- Always test retrieval quality with your specific data
- Markdown/code parsing can fail - always have a fallback
- Token counting is slow - cache results when possible

### 4. Similarity Search & Reranking

**Cosine Similarity (Manual)**

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Find top-k similar documents
function findSimilar(
  query: number[],
  documents: Array<{ id: string; embedding: number[] }>,
  topK: number = 10
) {
  const scores = documents.map(doc => ({
    id: doc.id,
    score: cosineSimilarity(query, doc.embedding),
  }));

  return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}
```

**Cohere Rerank (Boost quality by ~20%)**

```typescript
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

// Initial retrieval + reranking pipeline
async function searchWithRerank(query: string, topK: number = 10) {
  // Step 1: Vector search (retrieve 50-100 candidates)
  const candidates = await semanticSearch(query, undefined, 50);

  // Step 2: Rerank with Cohere (down to topK)
  const reranked = await cohere.rerank({
    model: "rerank-english-v3.0",
    query,
    documents: candidates.map(c => c.text),
    topN: topK,
    returnDocuments: true,
  });

  return reranked.results.map(r => ({
    text: r.document?.text,
    relevanceScore: r.relevanceScore, // 0-1, higher is better
    index: r.index,
  }));
}
```

**Hybrid Search (Vector + Keyword)**

```typescript
import FlexSearch from "flexsearch";

// Combine vector and BM25 scores
class HybridSearch {
  private index: FlexSearch.Index;
  private documents: Map<string, { text: string; embedding: number[] }>;

  constructor() {
    this.index = new FlexSearch.Index({
      tokenize: "forward",
      resolution: 9,
    });
    this.documents = new Map();
  }

  async addDocument(id: string, text: string) {
    const embedding = await getEmbedding(text);
    this.documents.set(id, { text, embedding });
    this.index.add(id, text);
  }

  async search(query: string, alpha: number = 0.7, topK: number = 10) {
    // Vector search
    const queryEmbedding = await getEmbedding(query);
    const vectorScores = Array.from(this.documents.entries()).map(
      ([id, doc]) => ({
        id,
        score: cosineSimilarity(queryEmbedding, doc.embedding),
      })
    );

    // Keyword search (BM25)
    const keywordResults = await this.index.search(query, { limit: 100 });
    const keywordScores = new Map(
      keywordResults.map((id, i) => [id, 1 - i / keywordResults.length])
    );

    // Combine scores (alpha = weight for vector search)
    const combined = vectorScores.map(({ id, score }) => ({
      id,
      score: alpha * score + (1 - alpha) * (keywordScores.get(id) || 0),
      text: this.documents.get(id)!.text,
    }));

    return combined.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
```

**Best Practices:**

- Always normalize vectors before computing cosine similarity
- Use reranking for critical applications (improves quality by 15-25%)
- Retrieve 3-5x more candidates than needed before reranking
- Use hybrid search for queries with specific keywords
- Tune alpha (0-1) for hybrid search based on your data
- Cache reranking results (expensive: $1/1k reranks for Cohere)

**Gotchas:**

- Reranking is slow (~100ms for 50 docs) - don't overuse
- Cohere Rerank has a 1000 document limit per request
- Hybrid search requires maintaining two indices (vector + keyword)
- BM25 results can be noisy - always filter by minimum score

### 5. Complete RAG Pipeline

**Basic RAG with Streaming**

```typescript
import { OpenAI } from "openai";
import { createStreamableValue } from "ai/rsc";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function ragQuery(query: string) {
  // 1. Retrieve relevant context
  const results = await semanticSearch(query, undefined, 5);
  const context = results.map(r => r.text).join("\n\n---\n\n");

  // 2. Generate with context
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer based on the provided context. If the context doesn't contain the answer, say so.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
    stream: true,
  });

  // 3. Stream response
  const streamValue = createStreamableValue("");

  (async () => {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      streamValue.update(content);
    }
    streamValue.done();
  })();

  return {
    output: streamValue.value,
    sources: results.map(r => ({ id: r.id, text: r.text })),
  };
}
```

**Advanced RAG with Reranking**

```typescript
export async function advancedRAG(query: string) {
  // 1. Vector search (retrieve 50 candidates)
  const candidates = await semanticSearch(query, undefined, 50);

  // 2. Rerank (down to 10)
  const reranked = await cohere.rerank({
    model: "rerank-english-v3.0",
    query,
    documents: candidates.map(c => c.text),
    topN: 10,
  });

  // 3. Filter by relevance threshold
  const relevant = reranked.results.filter(r => r.relevanceScore > 0.5);

  if (relevant.length === 0) {
    return {
      output: "I couldn't find relevant information to answer your question.",
      sources: [],
    };
  }

  // 4. Construct prompt with citations
  const context = relevant
    .map((r, i) => `[${i + 1}] ${candidates[r.index].text}`)
    .join("\n\n");

  // 5. Generate with citations
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Answer based on the provided sources. Cite sources using [1], [2], etc.",
      },
      {
        role: "user",
        content: `Sources:\n${context}\n\nQuestion: ${query}`,
      },
    ],
  });

  return {
    output: completion.choices[0].message.content,
    sources: relevant.map((r, i) => ({
      id: candidates[r.index].id,
      text: candidates[r.index].text,
      citation: i + 1,
      relevance: r.relevanceScore,
    })),
  };
}
```

**Multi-Query RAG (Improves recall)**

```typescript
async function multiQueryRAG(userQuery: string) {
  // 1. Generate multiple search queries
  const queryGeneration = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Generate 3 different search queries that would help answer the user's question.",
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
  });

  const queries = queryGeneration.choices[0].message
    .content!.split("\n")
    .filter(q => q.trim());

  // 2. Search with all queries in parallel
  const allResults = await Promise.all(
    queries.map(q => semanticSearch(q, undefined, 10))
  );

  // 3. Deduplicate and merge results
  const uniqueResults = Array.from(
    new Map(allResults.flat().map(r => [r.id, r])).values()
  );

  // 4. Continue with normal RAG...
  const context = uniqueResults.map(r => r.text).join("\n\n---\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Answer based on the provided context.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${userQuery}`,
      },
    ],
  });

  return {
    output: completion.choices[0].message.content,
    sources: uniqueResults,
    queriesUsed: queries,
  };
}
```

**Conversational RAG (With history)**

```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
}

async function conversationalRAG(query: string, history: Message[]) {
  // 1. Generate standalone query from conversation
  const standaloneQuery = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Convert the follow-up question into a standalone question based on the conversation history.",
      },
      {
        role: "user",
        content: `History:\n${history.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nFollow-up: ${query}`,
      },
    ],
  });

  const standalone = standaloneQuery.choices[0].message.content!;

  // 2. Retrieve with standalone query
  const results = await semanticSearch(standalone, undefined, 5);
  const context = results.map(r => r.text).join("\n\n---\n\n");

  // 3. Generate with history + context
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Answer based on the conversation history and provided context.",
      },
      ...history,
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
  });

  return {
    output: completion.choices[0].message.content,
    sources: results,
  };
}
```

**Best Practices:**

- Always filter by relevance score (>0.5 for Cohere Rerank)
- Include citations in generated responses
- Use multi-query RAG for complex questions
- Track source attribution for every fact
- Implement fallback responses when no relevant docs found
- Use conversational RAG for chatbots
- Cache retrieval results for repeated queries
- Monitor retrieval quality with metrics (MRR, NDCG)

**Gotchas:**

- RAG generation costs 10-20x more than simple embeddings
- Always validate retrieved context relevance before generation
- Don't exceed model context limits (8k for GPT-3.5, 128k for GPT-4)
- Reranking adds ~100ms latency - only use when needed
- Multi-query RAG triples search cost

### 6. Multi-Tenant Vector Isolation

**Namespace-Based Isolation (Pinecone)**

```typescript
// Strict tenant isolation
async function upsertForTenant(tenantId: string, documents: any[]) {
  const namespace = `tenant_${tenantId}`;
  const ns = index.namespace(namespace);

  const embeddings = await batchEmbeddings(documents.map(d => d.text));

  await ns.upsert(
    documents.map((doc, i) => ({
      id: doc.id,
      values: embeddings[i],
      metadata: doc.metadata,
    }))
  );
}

async function searchForTenant(tenantId: string, query: string) {
  const namespace = `tenant_${tenantId}`;
  const ns = index.namespace(namespace);

  const queryEmbedding = await getEmbedding(query);

  return await ns.query({
    vector: queryEmbedding,
    topK: 10,
    includeMetadata: true,
  });
}
```

**Metadata Filter-Based Isolation (Qdrant)**

```typescript
// More flexible, but requires careful filtering
async function upsertWithTenant(tenantId: string, documents: any[]) {
  const embeddings = await batchEmbeddings(documents.map(d => d.text));

  await qdrant.upsert("documents", {
    points: documents.map((doc, i) => ({
      id: doc.id,
      vector: embeddings[i],
      payload: {
        tenantId, // CRITICAL: always include
        ...doc.metadata,
      },
    })),
  });
}

async function searchWithTenantFilter(tenantId: string, query: string) {
  const queryEmbedding = await getEmbedding(query);

  return await qdrant.search("documents", {
    vector: queryEmbedding,
    limit: 10,
    filter: {
      must: [{ key: "tenantId", match: { value: tenantId } }],
    },
    with_payload: true,
  });
}
```

**Row-Level Security (RLS) Pattern**

```typescript
// For PostgreSQL with pgvector
import { sql } from "drizzle-orm";

async function searchWithRLS(userId: string, query: string) {
  const queryEmbedding = await getEmbedding(query);

  // RLS automatically filters by user's tenant
  const results = await db.execute(sql`
    SELECT id, content, metadata,
           1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM documents
    WHERE user_id = ${userId}
    ORDER BY similarity DESC
    LIMIT 10
  `);

  return results;
}
```

**Best Practices:**

- Use namespaces for hard tenant isolation (Pinecone)
- Use metadata filters for flexible isolation (Qdrant, Weaviate)
- ALWAYS validate tenant ID from authenticated user context
- Never trust client-provided tenant IDs
- Use RLS for PostgreSQL/Supabase (most secure)
- Monitor cross-tenant leakage with tests
- Add tenant ID to every metadata field as backup

**Gotchas:**

- Metadata filters are slower than namespaces
- Pinecone namespaces can't be deleted (only cleared)
- Qdrant filters are powerful but easy to misconfigure
- Always test tenant isolation with security audits

### 7. Cost Optimization

**Embedding Cost Calculator**

```typescript
// Pricing (as of 2024)
const PRICING = {
  "text-embedding-3-small": 0.00002 / 1000, // $0.02 per 1M tokens
  "text-embedding-3-large": 0.00013 / 1000, // $0.13 per 1M tokens
  "embed-english-v3.0": 0.0001 / 1000, // $0.10 per 1M tokens
  "voyage-large-2": 0.00012 / 1000, // $0.12 per 1M tokens
};

function estimateCost(texts: string[], model: keyof typeof PRICING): number {
  const totalTokens = texts.reduce(
    (sum, text) => sum + estimateTokens(text),
    0
  );
  const cost = totalTokens * PRICING[model];

  console.log(
    `Model: ${model}, Tokens: ${totalTokens}, Cost: $${cost.toFixed(4)}`
  );
  return cost;
}

// Example: 1M documents, avg 500 tokens each
const cost = estimateCost(
  Array(1_000_000).fill("x".repeat(2000)),
  "text-embedding-3-small"
);
// Output: $10 for 1M docs with small model
```

**Reduced Dimensionality (Save 50-75% storage)**

```typescript
// Full dimensionality: 1536 dims
const fullEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-large",
  input: "example text",
  dimensions: 3072, // Full size
});

// Reduced dimensionality: 1024 dims (same quality for most tasks)
const reducedEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-large",
  input: "example text",
  dimensions: 1024, // 66% reduction
});

// Pinecone cost: $70/mo for 100k vectors (1536 dims)
// With 1024 dims: ~$50/mo (30% savings)
```

**Caching Strategy**

```typescript
// Cache embeddings in Redis (7-day TTL)
async function getCachedEmbeddingOptimized(text: string): Promise<number[]> {
  // Normalize text to improve cache hit rate
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  const cacheKey = `emb:${createHash("sha256").update(normalized).digest("hex")}`;

  const cached = await redis.get<number[]>(cacheKey);
  if (cached) {
    console.log("Cache hit");
    return cached;
  }

  console.log("Cache miss - fetching embedding");
  const embedding = await getEmbedding(normalized);

  await redis.set(cacheKey, embedding, { ex: 7 * 24 * 60 * 60 });

  return embedding;
}
```

**Batch Processing for Cost Efficiency**

```typescript
// Process in large batches (up to 2048 inputs for OpenAI)
async function processBulkDocuments(documents: string[]) {
  const batchSize = 2048;
  const batches = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize));
  }

  const allEmbeddings = await Promise.all(
    batches.map(batch => batchEmbeddings(batch))
  );

  return allEmbeddings.flat();
}
```

**Best Practices:**

- Use `text-embedding-3-small` unless you need the absolute best quality
- Reduce dimensionality to 1024 for most applications (saves storage)
- Cache aggressively - embeddings don't change
- Batch API requests (2048 texts per request for OpenAI)
- Use cheaper models for dev/staging (embed-english-v2.0 is 70% cheaper)
- Monitor usage with analytics

**Gotchas:**

- Cohere charges per request, not per token
- Voyage AI rate limits are strict (300 RPM)
- Pinecone charges by vector count AND dimensions
- Always test quality before switching to cheaper models

## 💡 Real-World Examples

### Example 1: Code Search Engine

```typescript
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";
import glob from "fast-glob";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const index = pinecone.index("code-search");

// Index codebase
async function indexCodebase(repoPath: string) {
  const files = await glob("**/*.{ts,tsx,js,jsx}", { cwd: repoPath });

  for (const file of files) {
    const filePath = path.join(repoPath, file);
    const code = fs.readFileSync(filePath, "utf-8");

    // Chunk code by function
    const chunks = chunkCode(code, 1000);

    // Embed all chunks
    const embeddings = await batchEmbeddings(chunks);

    // Upsert to Pinecone
    await index.upsert(
      chunks.map((chunk, i) => ({
        id: `${file}:${i}`,
        values: embeddings[i],
        metadata: {
          file,
          chunk,
          language: path.extname(file).slice(1),
        },
      }))
    );

    console.log(`Indexed ${file}: ${chunks.length} chunks`);
  }
}

// Search codebase
async function searchCode(query: string) {
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const results = await index.query({
    vector: queryEmbedding.data[0].embedding,
    topK: 10,
    includeMetadata: true,
  });

  return results.matches.map(match => ({
    file: match.metadata?.file,
    code: match.metadata?.chunk,
    score: match.score,
  }));
}

// Usage
await indexCodebase("./my-repo");
const results = await searchCode("authentication middleware");
console.log(results);
```

### Example 2: Document QA System

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";
import { CohereClient } from "cohere-ai";
import { OpenAI } from "openai";
import * as pdf from "pdf-parse";

const qdrant = new QdrantClient({ url: "http://localhost:6333" });
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Ingest PDF documents
async function ingestPDF(pdfPath: string, userId: string) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);

  // Chunk document
  const chunks = chunkBySentences(data.text, 512, 50);

  // Embed chunks
  const embeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

  // Store in Qdrant with user isolation
  await qdrant.upsert("documents", {
    points: chunks.map((chunk, i) => ({
      id: `${pdfPath}:${i}`,
      vector: embeddings.data[i].embedding,
      payload: {
        userId,
        filename: path.basename(pdfPath),
        chunk,
        chunkIndex: i,
        totalChunks: chunks.length,
      },
    })),
  });

  console.log(`Ingested ${pdfPath}: ${chunks.length} chunks`);
}

// Answer questions
async function answerQuestion(userId: string, question: string) {
  // 1. Retrieve relevant chunks
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });

  const candidates = await qdrant.search("documents", {
    vector: queryEmbedding.data[0].embedding,
    limit: 50,
    filter: {
      must: [{ key: "userId", match: { value: userId } }],
    },
    with_payload: true,
  });

  // 2. Rerank with Cohere
  const reranked = await cohere.rerank({
    model: "rerank-english-v3.0",
    query: question,
    documents: candidates.map(c => c.payload?.chunk as string),
    topN: 5,
  });

  // 3. Generate answer with GPT-4
  const context = reranked.results
    .map(
      (r, i) =>
        `[${i + 1}] ${candidates[r.index].payload?.chunk}\nSource: ${candidates[r.index].payload?.filename}`
    )
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "Answer the question based on the provided context. Cite sources using [1], [2], etc. If the context doesn't contain the answer, say so.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return {
    answer: completion.choices[0].message.content,
    sources: reranked.results.map((r, i) => ({
      text: candidates[r.index].payload?.chunk,
      file: candidates[r.index].payload?.filename,
      citation: i + 1,
      relevance: r.relevanceScore,
    })),
  };
}

// Usage
await ingestPDF("./contract.pdf", "user123");
const result = await answerQuestion(
  "user123",
  "What is the termination clause?"
);
console.log(result.answer);
console.log("Sources:", result.sources);
```

### Example 3: Chatbot with Memory

```typescript
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const index = pinecone.index("chat-memory");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Store conversation in vector memory
async function storeConversation(userId: string, messages: ChatMessage[]) {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: conversationText,
  });

  await index.namespace(`user_${userId}`).upsert([
    {
      id: `${userId}:${Date.now()}`,
      values: embedding.data[0].embedding,
      metadata: {
        userId,
        messages: JSON.stringify(messages),
        timestamp: Date.now(),
      },
    },
  ]);
}

// Retrieve relevant past conversations
async function retrieveMemory(userId: string, query: string) {
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const results = await index.namespace(`user_${userId}`).query({
    vector: queryEmbedding.data[0].embedding,
    topK: 3,
    includeMetadata: true,
  });

  return results.matches.map(match => ({
    messages: JSON.parse(match.metadata?.messages as string) as ChatMessage[],
    relevance: match.score,
  }));
}

// Chat with memory
async function chat(userId: string, message: string, history: ChatMessage[]) {
  // Retrieve relevant past conversations
  const memory = await retrieveMemory(userId, message);

  const memoryContext =
    memory.length > 0
      ? `\n\nRelevant past conversations:\n${memory
          .map(m => m.messages.map(msg => `${msg.role}: ${msg.content}`).join("\n"))
          .join("\n\n---\n\n")}`
      : "";

  // Generate response with memory context
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. You have access to past conversations with the user.${memoryContext}`,
      },
      ...history,
      {
        role: "user",
        content: message,
      },
    ],
  });

  const assistantMessage = completion.choices[0].message.content!;

  // Store conversation for future retrieval
  await storeConversation(userId, [
    ...history.slice(-5), // Keep last 5 messages
    { role: "user", content: message, timestamp: Date.now() },
    { role: "assistant", content: assistantMessage, timestamp: Date.now() },
  ]);

  return assistantMessage;
}

// Usage
const response = await chat(
  "user123",
  "What was the book I mentioned last week?",
  []
);
console.log(response);
```

## 🔗 Related Skills

- `ai-integration` - Vercel AI SDK and streaming
- `openai-assistant-expert` - OpenAI Assistants API with file search
- `dspy-prompting` - Programmatic prompt optimization
- `vector-wizard` - MCP tools for vector databases

## 📖 Further Reading

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Learning Center](https://www.pinecone.io/learn/)
- [Cohere Rerank Documentation](https://docs.cohere.com/docs/rerank)
- [LangChain Text Splitters](https://python.langchain.com/docs/modules/data_connection/document_transformers/)
- [RAG Best Practices](https://www.rungalileo.io/blog/mastering-rag)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
