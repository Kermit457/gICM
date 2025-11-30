/**
 * Vector Store Interface
 *
 * Abstracts vector storage implementations.
 */

import { LocalVectorStore } from "./local.js";
import { PineconeVectorStore, type PineconeConfig } from "./pinecone.js";
import { QdrantVectorStore, type QdrantConfig } from "./qdrant.js";
import type { KnowledgeItem, SearchResult } from "../../types/index.js";
import type { EmbeddingGenerator } from "../../process/embeddings.js";

export interface VectorStore {
  init(): Promise<void>;
  add(item: KnowledgeItem): Promise<void>;
  addBatch(items: KnowledgeItem[]): Promise<void>;
  get(id: string): KnowledgeItem | undefined;
  delete(id: string): boolean;
  search(queryEmbedding: number[], limit?: number, minScore?: number): Promise<SearchResult[]>;
  searchText(query: string, embedder: EmbeddingGenerator, limit?: number): Promise<SearchResult[]>;
  filter(predicate: (item: KnowledgeItem) => boolean): KnowledgeItem[];
  getAll(): KnowledgeItem[];
  count(): number;
  save(): Promise<void>;
  clear(): void;
  shutdown(): Promise<void>;
}

export type VectorStoreType = "local" | "pinecone" | "qdrant";

/**
 * Create vector store instance
 */
export function createVectorStore(
  type: VectorStoreType = "local",
  config?: Record<string, unknown>
): VectorStore {
  switch (type) {
    case "local":
      return new LocalVectorStore(config?.dataDir as string);

    case "pinecone":
      if (!config || !("apiKey" in config) || !("indexName" in config)) {
        throw new Error("Pinecone requires apiKey and indexName in config");
      }
      return new PineconeVectorStore(config as unknown as PineconeConfig);

    case "qdrant":
      if (!config || !("url" in config) || !("collectionName" in config)) {
        throw new Error("Qdrant requires url and collectionName in config");
      }
      return new QdrantVectorStore(config as unknown as QdrantConfig);

    default:
      return new LocalVectorStore();
  }
}

export { LocalVectorStore, PineconeVectorStore, QdrantVectorStore, type PineconeConfig, type QdrantConfig };
