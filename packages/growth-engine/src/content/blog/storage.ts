/**
 * Blog Storage
 *
 * File-based storage for generated blog posts.
 */

import fs from "fs/promises";
import path from "path";
import type { BlogPost } from "../../core/types.js";
import { Logger } from "../../utils/logger.js";

export interface BlogStorageConfig {
  outputDir: string;
  format: "json" | "mdx" | "both";
}

const DEFAULT_CONFIG: BlogStorageConfig = {
  outputDir: process.env.BLOG_OUTPUT_DIR || "./content/blog",
  format: "both",
};

export class BlogStorage {
  private logger: Logger;
  private config: BlogStorageConfig;

  constructor(config: Partial<BlogStorageConfig> = {}) {
    this.logger = new Logger("BlogStorage");
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Ensure output directory exists
   */
  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  /**
   * Save a blog post
   */
  async save(post: BlogPost): Promise<{ jsonPath?: string; mdxPath?: string }> {
    await this.ensureDir();

    const result: { jsonPath?: string; mdxPath?: string } = {};

    // Save JSON
    if (this.config.format === "json" || this.config.format === "both") {
      const jsonPath = path.join(this.config.outputDir, `${post.slug}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(post, null, 2));
      result.jsonPath = jsonPath;
      this.logger.info(`Saved JSON: ${jsonPath}`);
    }

    // Save MDX
    if (this.config.format === "mdx" || this.config.format === "both") {
      const mdxPath = path.join(this.config.outputDir, `${post.slug}.mdx`);
      const mdxContent = this.toMDX(post);
      await fs.writeFile(mdxPath, mdxContent);
      result.mdxPath = mdxPath;
      this.logger.info(`Saved MDX: ${mdxPath}`);
    }

    return result;
  }

  /**
   * Convert blog post to MDX format
   */
  private toMDX(post: BlogPost): string {
    const frontmatter = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author: post.author,
      category: post.category,
      tags: post.tags,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      createdAt: new Date(post.createdAt).toISOString(),
      readingTime: post.readingTime,
      wordCount: post.wordCount,
      seo: post.seo,
    };

    return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return `${key}: ${JSON.stringify(value)}`;
  })
  .filter(Boolean)
  .join("\n")}
---

${post.content}
`;
  }

  /**
   * Load a blog post by slug
   */
  async load(slug: string): Promise<BlogPost | null> {
    try {
      const jsonPath = path.join(this.config.outputDir, `${slug}.json`);
      const content = await fs.readFile(jsonPath, "utf-8");
      return JSON.parse(content) as BlogPost;
    } catch {
      return null;
    }
  }

  /**
   * List all saved blog posts
   */
  async list(): Promise<BlogPost[]> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.config.outputDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      const posts: BlogPost[] = [];
      for (const file of jsonFiles) {
        const slug = file.replace(".json", "");
        const post = await this.load(slug);
        if (post) posts.push(post);
      }

      return posts.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  /**
   * Delete a blog post
   */
  async delete(slug: string): Promise<void> {
    const jsonPath = path.join(this.config.outputDir, `${slug}.json`);
    const mdxPath = path.join(this.config.outputDir, `${slug}.mdx`);

    try {
      await fs.unlink(jsonPath);
    } catch {}
    try {
      await fs.unlink(mdxPath);
    } catch {}

    this.logger.info(`Deleted blog post: ${slug}`);
  }

  /**
   * Get storage stats
   */
  async getStats(): Promise<{
    totalPosts: number;
    totalWords: number;
    categories: Record<string, number>;
  }> {
    const posts = await this.list();

    const stats = {
      totalPosts: posts.length,
      totalWords: 0,
      categories: {} as Record<string, number>,
    };

    for (const post of posts) {
      stats.totalWords += post.wordCount || 0;
      stats.categories[post.category] = (stats.categories[post.category] || 0) + 1;
    }

    return stats;
  }
}
