/**
 * arXiv Data Source
 *
 * Ingests latest AI/ML research papers.
 */

import { BaseSource, RawItem } from "../base.js";
import { XMLParser } from "fast-xml-parser";
import type { SourceType } from "../../../types/index.js";

export class ArxivSource extends BaseSource {
  name = "arxiv";
  type: SourceType = "paper";
  interval = 6 * 60 * 60 * 1000; // Every 6 hours

  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  private categories = [
    "cs.AI",  // Artificial Intelligence
    "cs.LG",  // Machine Learning
    "cs.CL",  // Computation and Language
    "cs.CV",  // Computer Vision
    "cs.NE",  // Neural and Evolutionary Computing
  ];

  constructor() {
    super();
    this.rateLimit = { requests: 10, window: 60000 };
  }

  async fetch(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    for (const category of this.categories) {
      try {
        const papers = await this.fetchCategory(category);
        items.push(...papers);
      } catch (error) {
        this.logger.error(`Failed to fetch ${category}: ${error}`);
      }
    }

    this.logger.info(`Fetched ${items.length} papers from arXiv`);
    return items;
  }

  private async fetchCategory(category: string): Promise<RawItem[]> {
    const url = `http://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=lastUpdatedDate&sortOrder=descending&max_results=20`;

    const response = await this.rateLimitedFetch(url);
    if (!response.ok) {
      throw new Error(`arXiv API returned ${response.status}`);
    }

    const xml = await response.text();
    const data = this.parser.parse(xml);

    const entries = data.feed?.entry || [];
    const items: RawItem[] = [];

    const entryArray = Array.isArray(entries) ? entries : [entries];

    for (const entry of entryArray) {
      if (!entry?.id) continue;

      const arxivId = entry.id.split("/abs/")[1] || entry.id;

      items.push({
        id: this.generateId("arxiv", arxivId),
        source: this.name,
        type: "paper",
        content: `${entry.title || "Untitled"}\n\n${entry.summary || ""}`,
        metadata: {
          title: entry.title?.replace(/\s+/g, " ").trim(),
          authors: this.parseAuthors(entry.author),
          categories: this.parseCategories(entry.category),
          pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxivUrl: `https://arxiv.org/abs/${arxivId}`,
          arxivId,
        },
        timestamp: new Date(entry.updated || entry.published || Date.now()).getTime(),
      });
    }

    return items;
  }

  private parseAuthors(authors: unknown): string[] {
    if (Array.isArray(authors)) {
      return authors.map((a) => (typeof a === "object" && a && "name" in a ? String(a.name) : "")).filter(Boolean);
    }
    if (typeof authors === "object" && authors && "name" in authors) {
      return [String(authors.name)];
    }
    return [];
  }

  private parseCategories(categories: unknown): string[] {
    if (Array.isArray(categories)) {
      return categories.map((c) => (typeof c === "object" && c && "@_term" in c ? String(c["@_term"]) : "")).filter(Boolean);
    }
    if (typeof categories === "object" && categories && "@_term" in categories) {
      return [String(categories["@_term"])];
    }
    return [];
  }
}
