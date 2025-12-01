/**
 * GitHub Trending Source
 *
 * Ingests trending repositories.
 */

import { BaseSource, RawItem } from "../base.js";
import type { SourceType } from "../../../types/index.js";

export class GitHubSource extends BaseSource {
  name = "github";
  type: SourceType = "github";
  interval = 60 * 60 * 1000; // Every hour

  private languages = ["python", "typescript", "rust", "go"];
  private topics = ["ai", "llm", "agent", "solana", "defi", "web3"];

  constructor() {
    super();
    this.rateLimit = { requests: 30, window: 60000 };
  }

  async fetch(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    // Fetch trending for each language
    for (const language of this.languages) {
      try {
        const repos = await this.fetchTrending(language);
        items.push(...repos);
      } catch (error) {
        this.logger.error(`Failed to fetch trending ${language}: ${error}`);
      }
    }

    // Fetch by topics
    for (const topic of this.topics) {
      try {
        const repos = await this.searchByTopic(topic);
        items.push(...repos);
      } catch (error) {
        this.logger.error(`Failed to search topic ${topic}: ${error}`);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    this.logger.info(`Fetched ${unique.length} repos from GitHub`);
    return unique;
  }

  private async fetchTrending(language: string): Promise<RawItem[]> {
    // GitHub doesn't have official trending API, use search with recent stars
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const url = `https://api.github.com/search/repositories?q=language:${language}+created:>${since}&sort=stars&order=desc&per_page=20`;

    const response = await this.rateLimitedFetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json() as {
      items: Array<{
        id: number;
        full_name: string;
        description: string | null;
        html_url: string;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
        topics: string[];
        created_at: string;
        updated_at: string;
        owner: { login: string };
      }>;
    };

    return data.items.map((repo) => ({
      id: this.generateId("github", repo.full_name),
      source: this.name,
      type: "code",
      content: `${repo.full_name}: ${repo.description || "No description"}`,
      metadata: {
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        owner: repo.owner.login,
      },
      timestamp: new Date(repo.updated_at || repo.created_at).getTime(),
    }));
  }

  private async searchByTopic(topic: string): Promise<RawItem[]> {
    const url = `https://api.github.com/search/repositories?q=topic:${topic}&sort=updated&order=desc&per_page=15`;

    const response = await this.rateLimitedFetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json() as {
      items: Array<{
        id: number;
        full_name: string;
        description: string | null;
        html_url: string;
        stargazers_count: number;
        forks_count: number;
        language: string | null;
        topics: string[];
        created_at: string;
        updated_at: string;
        owner: { login: string };
      }>;
    };

    return data.items.map((repo) => ({
      id: this.generateId("github", repo.full_name),
      source: this.name,
      type: "code",
      content: `${repo.full_name}: ${repo.description || "No description"}`,
      metadata: {
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        owner: repo.owner.login,
        searchTopic: topic,
      },
      timestamp: new Date(repo.updated_at || repo.created_at).getTime(),
    }));
  }
}
