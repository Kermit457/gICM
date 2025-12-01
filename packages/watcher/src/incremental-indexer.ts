/**
 * Incremental Indexer
 * Handles partial re-indexing of changed files
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import type { FileChange, IndexResult } from "./types.js";

export class IncrementalIndexer {
  private contextEngineUrl: string;

  constructor(contextEngineUrl: string) {
    this.contextEngineUrl = contextEngineUrl;
  }

  /**
   * Index a set of changed files
   */
  async indexChanges(changes: FileChange[]): Promise<IndexResult> {
    const startTime = Date.now();
    const filesToIndex: string[] = [];

    // Filter to files that exist and need indexing
    for (const change of changes) {
      if (change.type === "unlink") {
        // For deleted files, we'd need to remove from index
        // This would require a different API endpoint
        continue;
      }

      if (fs.existsSync(change.path)) {
        filesToIndex.push(change.path);
      }
    }

    if (filesToIndex.length === 0) {
      return {
        success: true,
        filesIndexed: 0,
        duration: Date.now() - startTime,
      };
    }

    try {
      // Read file contents and send to context engine
      const files = filesToIndex.map((filePath) => ({
        path: filePath,
        content: fs.readFileSync(filePath, "utf-8"),
        type: this.getFileType(filePath),
      }));

      const response = await axios.post(
        `${this.contextEngineUrl}/index/incremental`,
        { files },
        { timeout: 30000 }
      );

      return {
        success: response.data?.success ?? true,
        filesIndexed: filesToIndex.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // If context engine is not available, log but don't fail
      return {
        success: false,
        filesIndexed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get file type from extension
   */
  private getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".rs": "rust",
      ".go": "go",
      ".md": "markdown",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
    };
    return typeMap[ext] || "text";
  }

  /**
   * Check if context engine is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.contextEngineUrl}/health`, {
        timeout: 2000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
