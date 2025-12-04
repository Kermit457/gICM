# Embeddings Expert

> **ID:** `embeddings-expert`
> **Tier:** 2
> **Token Cost:** 6500
> **MCP Connections:** qdrant, pinecone

## 🎯 What This Skill Does

You are an expert in vector embeddings, similarity search, and RAG (Retrieval Augmented Generation) patterns. You understand embedding models, vector databases, chunking strategies, reranking, and production-grade semantic search implementation.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** embedding, vector, similarity, semantic search, rag, retrieval, pinecone, qdrant, weaviate, chromadb
- **File Types:** N/A
- **Directories:** `embeddings/`, `vector/`, `rag/`

## 🚀 Core Capabilities

### 1. Embedding Model Selection & Implementation

**Popular Embedding Models (2024-2025):**

```typescript
interface EmbeddingModel {
  name: string
  dimensions: number
  maxTokens: number
  costPer1k: number
  provider: string
  bestFor: string[]
}

const EMBEDDING_MODELS: Record<string, EmbeddingModel> = {
  'openai-ada-002': {
    name: 'text-embedding-ada-002',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1k: 0.0001,
    provider: 'openai',
    bestFor: ['general', 'legacy'],
  },
  'openai-small': {
    name: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    costPer1k: 0.00002, // 5x cheaper than ada-002
    provider: 'openai',
    bestFor: ['cost-optimized', 'general', 'production'],
  },
  'openai-large': {
    name: 'text-embedding-3-large',
    dimensions: 3072,
    maxTokens: 8191,
    costPer1k: 0.00013,
    provider: 'openai',
    bestFor: ['high-quality', 'critical-applications'],
  },
  'cohere-english': {
    name: 'embed-english-v3.0',
    dimensions: 1024,
    maxTokens: 512,
    costPer1k: 0.0001,
    provider: 'cohere',
    bestFor: ['retrieval', 'semantic-search'],
  },
  'cohere-multilingual': {
    name: 'embed-multilingual-v3.0',
    dimensions: 1024,
    maxTokens: 512,
    costPer1k: 0.0001,
    provider: 'cohere',
    bestFor: ['multilingual', 'international'],
  },
  'bge-small': {
    name: 'BAAI/bge-small-en-v1.5',
    dimensions: 384,
    maxTokens: 512,
    costPer1k: 0,
    provider: 'huggingface',
    bestFor: ['self-hosted', 'fast-inference', 'cost-free'],
  },
  'bge-base': {
    name: 'BAAI/bge-base-en-v1.5',
    dimensions: 768,
    maxTokens: 512,
    costPer1k: 0,
    provider: 'huggingface',
    bestFor: ['self-hosted', 'balanced'],
  },
  'bge-large': {
    name: 'BAAI/bge-large-en-v1.5',
    dimensions: 1024,
    maxTokens: 512,
    costPer1k: 0,
    provider: 'huggingface',
    bestFor: ['self-hosted', 'high-quality'],
  },
  'e5-small': {
    name: 'intfloat/e5-small-v2',
    dimensions: 384,
    maxTokens: 512,
    costPer1k: 0,
    provider: 'huggingface',
    bestFor: ['self-hosted', 'edge-devices'],
  },
  'e5-base': {
    name: 'intfloat/e5-base-v2',
    dimensions: 768,
    maxTokens: 512,
    costPer1k: 0,
    provider: 'huggingface',
    bestFor: ['self-hosted', 'general'],
  },
}

// Smart model selection
function selectModel(useCase: string): string {
  switch (useCase) {
    case 'general-high-quality':
      return 'openai-large'
    case 'cost-optimized':
      return 'openai-small'
    case 'multilingual':
      return 'cohere-multilingual'
    case 'self-hosted-fast':
      return 'bge-small'
    case 'self-hosted-quality':
      return 'bge-large'
    case 'retrieval-optimized':
      return 'cohere-english'
    default:
      return 'openai-small'
  }
}
```

**Best Practices:**

