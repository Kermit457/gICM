/**
 * OPUS 67 - Context Indexer
 * Indexes project files and maintains vector embeddings for retrieval
 */

import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, extname, relative } from "path";
import { createHash } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

export interface ContextConfig {
  indexPaths: string[];
  excludePatterns: string[];
  maxTokens: number;
  vectorDbPath: string;
}

export interface IndexedFile {
  path: string;
  relativePath: string;
  content: string;
  hash: string;
  tokens: number;
  lastModified: Date;
  extension: string;
}

export interface RetrievedContext {
  files: Array<{ path: string; content: string; relevance: number }>;
  memories: Array<{ key: string; value: string }>;
  history: Array<{ role: string; content: string }>;
  tokens: number;
}

export interface ContextStats {
  totalFiles: number;
  totalTokens: number;
  lastIndexed: Date | null;
  indexPath: string;
}

// =============================================================================
// CONTEXT INDEXER
// =============================================================================

export class ContextIndexer {
  private config: ContextConfig;
  private indexedFiles: Map<string, IndexedFile> = new Map();
  private memories: Map<string, string> = new Map();
  private history: Array<{ role: string; content: string }> = [];
  private lastIndexed: Date | null = null;

  // File extensions to index
  private indexableExtensions = [
    ".ts", ".tsx", ".js", ".jsx",
    ".rs", ".toml",
    ".py",
    ".json", ".yaml", ".yml",
    ".md", ".txt",
    ".sql",
    ".sh", ".bash",
    ".css", ".scss",
    ".html",
    ".env.example",
  ];

  constructor(config: ContextConfig) {
    this.config = config;
  }

  /**
   * Index all files in the project
   */
  async index(projectRoot: string): Promise<void> {
    console.log(`[ContextIndexer] Indexing: ${projectRoot}`);
    
    // Ensure vector DB directory exists
    if (!existsSync(this.config.vectorDbPath)) {
      mkdirSync(this.config.vectorDbPath, { recursive: true });
    }

    const startTime = Date.now();
    let filesIndexed = 0;
    let tokensIndexed = 0;

    // Walk the file tree
    const files = this.walkDirectory(projectRoot);

    for (const filePath of files) {
      try {
        const indexed = await this.indexFile(filePath, projectRoot);
        if (indexed) {
          this.indexedFiles.set(indexed.relativePath, indexed);
          filesIndexed++;
          tokensIndexed += indexed.tokens;
        }
      } catch (error) {
        console.warn(`[ContextIndexer] Failed to index: ${filePath}`, error);
      }
    }

    this.lastIndexed = new Date();
    const elapsed = Date.now() - startTime;
    
    console.log(`[ContextIndexer] Indexed ${filesIndexed} files (${tokensIndexed} tokens) in ${elapsed}ms`);

    // Save index to disk
    await this.saveIndex();
  }

  /**
   * Walk directory recursively
   */
  private walkDirectory(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);

        // Check exclusions
        if (this.shouldExclude(entry, fullPath)) {
          continue;
        }

        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.walkDirectory(fullPath));
        } else if (stat.isFile() && this.shouldIndex(entry)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory not readable, skip
    }

    return files;
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(name: string, fullPath: string): boolean {
    // Always exclude these
    const alwaysExclude = [
      "node_modules",
      ".git",
      "dist",
      ".next",
      "target",
      "__pycache__",
      ".cache",
      "coverage",
      ".turbo",
      ".vercel",
    ];

    if (alwaysExclude.includes(name)) {
      return true;
    }

    // Check config exclusions
    for (const pattern of this.config.excludePatterns) {
      if (fullPath.includes(pattern) || name.includes(pattern)) {
        return true;
      }
    }

    // Skip hidden files/directories
    if (name.startsWith(".") && name !== ".env.example") {
      return true;
    }

    return false;
  }

  /**
   * Check if file should be indexed
   */
  private shouldIndex(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.indexableExtensions.includes(ext);
  }

  /**
   * Index a single file
   */
  private async indexFile(filePath: string, projectRoot: string): Promise<IndexedFile | null> {
    const stat = statSync(filePath);
    
    // Skip files larger than 100KB
    if (stat.size > 100 * 1024) {
      return null;
    }

    const content = readFileSync(filePath, "utf-8");
    const relativePath = relative(projectRoot, filePath);
    const hash = createHash("md5").update(content).digest("hex");
    const tokens = this.estimateTokens(content);

    return {
      path: filePath,
      relativePath,
      content,
      hash,
      tokens,
      lastModified: stat.mtime,
      extension: extname(filePath),
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieve(query: string, maxTokens?: number): Promise<RetrievedContext> {
    const budget = maxTokens || this.config.maxTokens;
    const results: RetrievedContext = {
      files: [],
      memories: [],
      history: [],
      tokens: 0,
    };

    // Simple keyword-based retrieval (would use embeddings in production)
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const scored: Array<{ file: IndexedFile; score: number }> = [];

    for (const [_, file] of this.indexedFiles) {
      let score = 0;
      const lowerContent = file.content.toLowerCase();
      const lowerPath = file.relativePath.toLowerCase();

      // Score based on query word matches
      for (const word of queryWords) {
        // Path matches are worth more
        if (lowerPath.includes(word)) {
          score += 10;
        }
        // Content matches
        const matches = (lowerContent.match(new RegExp(word, "g")) || []).length;
        score += Math.min(matches, 5); // Cap at 5 matches per word
      }

      // Boost certain file types
      if ([".ts", ".tsx", ".rs"].includes(file.extension)) {
        score *= 1.5;
      }

      if (score > 0) {
        scored.push({ file, score });
      }
    }

    // Sort by score and take top results within token budget
    scored.sort((a, b) => b.score - a.score);

    for (const { file, score } of scored) {
      if (results.tokens + file.tokens > budget) {
        break;
      }

      results.files.push({
        path: file.relativePath,
        content: file.content,
        relevance: score,
      });
      results.tokens += file.tokens;
    }

    // Add relevant memories
    for (const [key, value] of this.memories) {
      const lowerKey = key.toLowerCase();
      if (queryWords.some((w) => lowerKey.includes(w))) {
        results.memories.push({ key, value });
      }
    }

    // Add recent history (last 10 messages)
    results.history = this.history.slice(-10);

    return results;
  }

  /**
   * Add a memory
   */
  remember(key: string, value: string): void {
    this.memories.set(key, value);
  }

  /**
   * Recall a memory
   */
  recall(key: string): string | undefined {
    return this.memories.get(key);
  }

  /**
   * Add to conversation history
   */
  addToHistory(role: "user" | "assistant", content: string): void {
    this.history.push({ role, content });
    
    // Keep last 50 messages
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    const indexPath = join(this.config.vectorDbPath, "index.json");
    
    const data = {
      version: "1.0.0",
      indexed: this.lastIndexed?.toISOString(),
      files: Array.from(this.indexedFiles.entries()).map(([path, file]) => ({
        path,
        hash: file.hash,
        tokens: file.tokens,
        lastModified: file.lastModified.toISOString(),
      })),
      totalTokens: this.getStats().totalTokens,
    };

    writeFileSync(indexPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get indexer stats
   */
  getStats(): ContextStats {
    let totalTokens = 0;
    for (const file of this.indexedFiles.values()) {
      totalTokens += file.tokens;
    }

    return {
      totalFiles: this.indexedFiles.size,
      totalTokens,
      lastIndexed: this.lastIndexed,
      indexPath: this.config.vectorDbPath,
    };
  }

  /**
   * Format context for prompt injection
   */
  formatForPrompt(context: RetrievedContext): string {
    const sections: string[] = [];

    if (context.files.length > 0) {
      sections.push("## Relevant Files\n");
      
      for (const file of context.files) {
        sections.push(`### ${file.path}`);
        sections.push("```" + this.getLanguage(file.path));
        sections.push(file.content);
        sections.push("```\n");
      }
    }

    if (context.memories.length > 0) {
      sections.push("## Memories\n");
      for (const mem of context.memories) {
        sections.push(`- **${mem.key}**: ${mem.value}`);
      }
      sections.push("");
    }

    if (context.history.length > 0) {
      sections.push("## Recent History\n");
      for (const msg of context.history) {
        sections.push(`**${msg.role}**: ${msg.content.slice(0, 100)}...`);
      }
    }

    return sections.join("\n");
  }

  /**
   * Get language identifier for code blocks
   */
  private getLanguage(path: string): string {
    const ext = extname(path).toLowerCase();
    const langMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "tsx",
      ".js": "javascript",
      ".jsx": "jsx",
      ".rs": "rust",
      ".py": "python",
      ".sql": "sql",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".md": "markdown",
      ".sh": "bash",
      ".css": "css",
      ".scss": "scss",
      ".html": "html",
    };
    return langMap[ext] || "";
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.indexedFiles.clear();
    this.memories.clear();
    this.history = [];
    this.lastIndexed = null;
  }
}

export default ContextIndexer;
