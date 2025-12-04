/**
 * RAG (Retrieval-Augmented Generation) utilities
 * Build document ingestion and retrieval pipelines
 */

import { z } from 'zod';

// Schemas
export const DocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
});

export const ChunkOptionsSchema = z.object({
  chunkSize: z.number().default(1000),
  chunkOverlap: z.number().default(200),
  separator: z.string().default('\n\n'),
});

export const RAGConfigSchema = z.object({
  topK: z.number().default(5),
  minScore: z.number().default(0.7),
  rerank: z.boolean().default(false),
  hybridSearch: z.boolean().default(false),
});

// Types
export type Document = z.infer<typeof DocumentSchema>;
export type ChunkOptions = z.infer<typeof ChunkOptionsSchema>;
export type RAGConfig = z.infer<typeof RAGConfigSchema>;

export interface RAGResult {
  documents: Document[];
  scores: number[];
  query: string;
  totalFound: number;
}

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkText(
  text: string,
  options: Partial<ChunkOptions> = {}
): string[] {
  const { chunkSize, chunkOverlap, separator } = ChunkOptionsSchema.parse(options);

  const chunks: string[] = [];
  const sections = text.split(separator);

  let currentChunk = '';

  for (const section of sections) {
    if (currentChunk.length + section.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      currentChunk = currentChunk.slice(overlapStart) + separator + section;
    } else {
      currentChunk += (currentChunk ? separator : '') + section;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Create documents from text chunks with metadata
 */
export function createDocuments(
  chunks: string[],
  baseMetadata: Record<string, unknown> = {}
): Document[] {
  return chunks.map((content, index) => ({
    id: `chunk-${index}-${Date.now()}`,
    content,
    metadata: {
      ...baseMetadata,
      chunkIndex: index,
      charCount: content.length,
    },
  }));
}

/**
 * Simple keyword-based retrieval (fallback when no vector store)
 */
export function keywordSearch(
  query: string,
  documents: Document[],
  config: Partial<RAGConfig> = {}
): RAGResult {
  const { topK } = RAGConfigSchema.parse(config);
  const queryTerms = query.toLowerCase().split(/\s+/);

  const scored = documents.map(doc => {
    const content = doc.content.toLowerCase();
    const matches = queryTerms.filter(term => content.includes(term)).length;
    const score = matches / queryTerms.length;
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topDocs = scored.slice(0, topK);

  return {
    documents: topDocs.map(d => d.doc),
    scores: topDocs.map(d => d.score),
    query,
    totalFound: scored.filter(d => d.score > 0).length,
  };
}

/**
 * Format retrieved documents for prompt context
 */
export function formatContextForPrompt(result: RAGResult): string {
  if (result.documents.length === 0) {
    return 'No relevant documents found.';
  }

  let context = '<retrieved_context>\n';

  result.documents.forEach((doc, i) => {
    context += `\n### Document ${i + 1} (relevance: ${(result.scores[i] * 100).toFixed(1)}%)\n`;
    context += doc.content + '\n';
  });

  context += '\n</retrieved_context>';
  return context;
}

/**
 * Create a simple RAG pipeline
 */
export function createRAGPipeline(config: Partial<RAGConfig> = {}) {
  const ragConfig = RAGConfigSchema.parse(config);
  const documents: Document[] = [];

  return {
    /**
     * Add documents to the pipeline
     */
    addDocuments(docs: Document[]) {
      documents.push(...docs);
    },

    /**
     * Ingest text by chunking and adding
     */
    ingestText(text: string, metadata: Record<string, unknown> = {}) {
      const chunks = chunkText(text);
      const docs = createDocuments(chunks, metadata);
      this.addDocuments(docs);
      return docs.length;
    },

    /**
     * Query the pipeline
     */
    query(queryText: string): RAGResult {
      return keywordSearch(queryText, documents, ragConfig);
    },

    /**
     * Get formatted context for a query
     */
    getContext(queryText: string): string {
      const result = this.query(queryText);
      return formatContextForPrompt(result);
    },

    /**
     * Get document count
     */
    get documentCount() {
      return documents.length;
    },

    /**
     * Clear all documents
     */
    clear() {
      documents.length = 0;
    },
  };
}
