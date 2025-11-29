/**
 * Search indexed code repositories
 */

import { getQdrantClient } from "../utils/qdrant.js";
import { getEmbedding } from "../utils/embeddings.js";

interface CodeSearchResult {
  repo: string;
  file_path: string;
  language: string;
  start_line: number;
  end_line: number;
  content: string;
  score: number;
}

export async function searchCodebase(
  query: string,
  repository?: string,
  language?: string,
  limit: number = 10
): Promise<{ results: CodeSearchResult[]; query: string; total: number }> {
  const qdrant = getQdrantClient();

  // Generate query embedding
  const queryVector = await getEmbedding(query);

  // Build filter
  const filter: Record<string, unknown> = {};
  if (repository) {
    filter.repo = repository;
  }
  if (language) {
    filter.language = language;
  }

  // Search in Qdrant
  const searchResult = await qdrant.search("code_chunks", {
    vector: queryVector,
    limit,
    filter: Object.keys(filter).length > 0 ? { must: buildFilterConditions(filter) } : undefined,
  });

  // Format results
  const results: CodeSearchResult[] = searchResult.map((r) => ({
    repo: r.payload?.repo as string,
    file_path: r.payload?.file_path as string,
    language: r.payload?.language as string,
    start_line: r.payload?.start_line as number,
    end_line: r.payload?.end_line as number,
    content: r.payload?.content as string,
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
    conditions.push({
      key,
      match: { value },
    });
  }

  return conditions;
}
