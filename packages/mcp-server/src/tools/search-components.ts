/**
 * Search gICM marketplace components
 */

import { getQdrantClient } from "../utils/qdrant.js";
import { getEmbedding } from "../utils/embeddings.js";

interface SearchResult {
  id: string;
  name: string;
  kind: string;
  description: string;
  category: string;
  tags: string[];
  install: string;
  score: number;
}

export async function searchComponents(
  query: string,
  kind?: string,
  platform?: string,
  limit: number = 5
): Promise<{ results: SearchResult[]; query: string; total: number }> {
  const qdrant = getQdrantClient();

  // Generate query embedding
  const queryVector = await getEmbedding(query);

  // Build filter
  const filter: Record<string, unknown> = {};
  if (kind) {
    filter.kind = kind;
  }
  if (platform) {
    filter.platforms = platform;
  }

  // Search in Qdrant
  const searchResult = await qdrant.search("gicm_components", {
    vector: queryVector,
    limit,
    filter: Object.keys(filter).length > 0 ? { must: buildFilterConditions(filter) } : undefined,
  });

  // Format results
  const results: SearchResult[] = searchResult.map((r) => ({
    id: r.payload?.id as string,
    name: r.payload?.name as string,
    kind: r.payload?.kind as string,
    description: r.payload?.description as string,
    category: r.payload?.category as string,
    tags: (r.payload?.tags as string[]) || [],
    install: r.payload?.install as string,
    score: r.score,
  }));

  return {
    results,
    query,
    total: results.length,
  };
}

function buildFilterConditions(filter: Record<string, unknown>) {
  const conditions: unknown[] = [];

  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value)) {
      conditions.push({
        key,
        match: { any: value },
      });
    } else {
      conditions.push({
        key,
        match: { value },
      });
    }
  }

  return conditions;
}
