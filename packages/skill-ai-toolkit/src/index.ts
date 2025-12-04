/**
 * @gicm/skill-ai-toolkit
 * AI/LLM integration utilities for OPUS 67
 *
 * @packageDocumentation
 */

export * from './rag.js';
export * from './embeddings.js';
export * from './streaming.js';
export * from './agents.js';

// Re-export types
export type {
  RAGConfig,
  RAGResult,
  Document,
  ChunkOptions,
} from './rag.js';

export type {
  EmbeddingProvider,
  EmbeddingResult,
  SimilarityResult,
} from './embeddings.js';

export type {
  StreamConfig,
  ChunkHandler,
  StreamResult,
} from './streaming.js';

export type {
  AgentConfig,
  AgentTool,
  AgentLoop,
  AgentResult,
} from './agents.js';
