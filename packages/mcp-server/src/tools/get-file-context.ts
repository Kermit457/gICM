/**
 * Get specific lines from an indexed file
 */

import { getQdrantClient } from "../utils/qdrant.js";

interface FileContext {
  repo: string;
  file_path: string;
  start_line: number;
  end_line: number;
  content: string;
  found: boolean;
}

export async function getFileContext(
  repository: string,
  filePath: string,
  startLine: number,
  endLine: number
): Promise<FileContext> {
  const qdrant = getQdrantClient();

  // Validate line range
  const maxLines = 200;
  if (endLine - startLine > maxLines) {
    endLine = startLine + maxLines;
  }

  // Search for chunks that overlap with the requested range
  const searchResult = await qdrant.scroll("code_chunks", {
    filter: {
      must: [
        { key: "repo", match: { value: repository } },
        { key: "file_path", match: { value: filePath } },
      ],
    },
    limit: 100,
  });

  if (!searchResult.points || searchResult.points.length === 0) {
    return {
      repo: repository,
      file_path: filePath,
      start_line: startLine,
      end_line: endLine,
      content: "",
      found: false,
    };
  }

  // Find chunks that overlap with the requested range
  const overlappingChunks = searchResult.points.filter((p) => {
    const chunkStart = p.payload?.start_line as number;
    const chunkEnd = p.payload?.end_line as number;
    return chunkStart <= endLine && chunkEnd >= startLine;
  });

  if (overlappingChunks.length === 0) {
    return {
      repo: repository,
      file_path: filePath,
      start_line: startLine,
      end_line: endLine,
      content: "",
      found: false,
    };
  }

  // Sort by start line and combine
  overlappingChunks.sort(
    (a, b) => (a.payload?.start_line as number) - (b.payload?.start_line as number)
  );

  // Extract the requested lines from combined content
  const allLines: string[] = [];
  const seenLines = new Set<number>();

  for (const chunk of overlappingChunks) {
    const content = chunk.payload?.content as string;
    const chunkStart = chunk.payload?.start_line as number;
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const lineNum = chunkStart + idx;
      if (lineNum >= startLine && lineNum <= endLine && !seenLines.has(lineNum)) {
        seenLines.add(lineNum);
        allLines.push(`${lineNum}: ${line}`);
      }
    });
  }

  return {
    repo: repository,
    file_path: filePath,
    start_line: startLine,
    end_line: endLine,
    content: allLines.join("\n"),
    found: true,
  };
}
