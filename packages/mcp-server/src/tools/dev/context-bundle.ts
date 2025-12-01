/**
 * dev.get_context_bundle - Get relevant context for a task
 *
 * Combines semantic search with file context to provide
 * comprehensive code context for a given task description.
 */

import { searchCodebase } from "../search-codebase.js";
import { getFileContext } from "../get-file-context.js";

interface ContextChunk {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  relevance: number;
}

interface ContextBundle {
  task: string;
  chunks: ContextChunk[];
  relatedFiles: string[];
  suggestedApproach?: string;
  totalTokens: number;
}

export async function getContextBundle(
  task: string,
  repository?: string,
  maxChunks: number = 10,
  expandContext: boolean = true
): Promise<ContextBundle> {
  // Search for relevant code
  const searchResults = await searchCodebase(task, repository, undefined, maxChunks);

  const chunks: ContextChunk[] = [];
  const fileSet = new Set<string>();

  for (const result of searchResults.results) {
    let content = result.content;

    // Optionally expand context around the match
    if (expandContext && result.start_line > 1) {
      try {
        const expandedStart = Math.max(1, result.start_line - 5);
        const expandedEnd = result.end_line + 5;

        const expanded = await getFileContext(
          result.repo,
          result.file_path,
          expandedStart,
          expandedEnd
        );

        if (expanded.found) {
          content = expanded.content;
        }
      } catch {
        // Keep original content if expansion fails
      }
    }

    chunks.push({
      file: `${result.repo}/${result.file_path}`,
      startLine: result.start_line,
      endLine: result.end_line,
      content,
      relevance: result.score,
    });

    fileSet.add(`${result.repo}/${result.file_path}`);
  }

  // Estimate token count (rough approximation)
  const totalTokens = chunks.reduce(
    (sum, chunk) => sum + Math.ceil(chunk.content.length / 4),
    0
  );

  return {
    task,
    chunks,
    relatedFiles: Array.from(fileSet),
    totalTokens,
  };
}
