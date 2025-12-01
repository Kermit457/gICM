/**
 * Git Manager
 *
 * Manages Git repository connections and pipeline synchronization
 */

import { EventEmitter } from "eventemitter3";
import {
  type GitProvider,
  type RepoConfig,
  type CreateRepoConfig,
  type SyncRecord,
  type SyncStatus,
  type GitWebhookEvent,
  type PipelineYAML,
  type PipelineChange,
  type GitManagerConfig,
  type GitEvents,
  GitManagerConfigSchema,
  RepoConfigSchema,
} from "./types.js";
import {
  parsePipelineYAML,
  stringifyPipelineYAML,
  validatePipelineYAML,
  generatePipelineDiff,
  yamlToInternal,
  internalToYAML,
  type InternalPipeline,
} from "./yaml-parser.js";

// =============================================================================
// GITHUB CLIENT
// =============================================================================

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
}

class GitHubClient {
  private token: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getFile(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFile | null> {
    try {
      const query = ref ? `?ref=${ref}` : "";
      return await this.request<GitHubFile>(
        "GET",
        `/repos/${owner}/${repo}/contents/${path}${query}`
      );
    } catch {
      return null;
    }
  }

  async listFiles(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFile[]> {
    try {
      const query = ref ? `?ref=${ref}` : "";
      const result = await this.request<GitHubFile | GitHubFile[]>(
        "GET",
        `/repos/${owner}/${repo}/contents/${path}${query}`
      );
      return Array.isArray(result) ? result : [result];
    } catch {
      return [];
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<{ sha: string; commit: GitHubCommit }> {
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString("base64"),
    };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;

    const result = await this.request<{
      content: { sha: string };
      commit: GitHubCommit;
    }>("PUT", `/repos/${owner}/${repo}/contents/${path}`, body);

    return {
      sha: result.content.sha,
      commit: result.commit,
    };
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<void> {
    const body: Record<string, unknown> = { message, sha };
    if (branch) body.branch = branch;

    await this.request("DELETE", `/repos/${owner}/${repo}/contents/${path}`, body);
  }

  async getLatestCommit(
    owner: string,
    repo: string,
    branch: string
  ): Promise<GitHubCommit> {
    const result = await this.request<{ sha: string; commit: GitHubCommit }>(
      "GET",
      `/repos/${owner}/${repo}/commits/${branch}`
    );
    return { ...result.commit, sha: result.sha };
  }

  async createWebhook(
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
    events: string[] = ["push", "pull_request"]
  ): Promise<{ id: number }> {
    return this.request("POST", `/repos/${owner}/${repo}/hooks`, {
      name: "web",
      active: true,
      events,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
      },
    });
  }

  async deleteWebhook(
    owner: string,
    repo: string,
    hookId: number
  ): Promise<void> {
    await this.request("DELETE", `/repos/${owner}/${repo}/hooks/${hookId}`);
  }
}

// =============================================================================
// GIT MANAGER
// =============================================================================

export class GitManager extends EventEmitter<GitEvents> {
  private config: GitManagerConfig;
  private repos: Map<string, RepoConfig> = new Map();
  private clients: Map<string, GitHubClient> = new Map();
  private syncRecords: Map<string, SyncRecord[]> = new Map();
  private fileShas: Map<string, string> = new Map(); // path -> sha

  constructor(config: Partial<GitManagerConfig> = {}) {
    super();
    this.config = GitManagerConfigSchema.parse(config);
  }

  // ===========================================================================
  // REPOSITORY MANAGEMENT
  // ===========================================================================

  /**
   * Connect a Git repository
   */
  async connectRepo(config: CreateRepoConfig): Promise<RepoConfig> {
    const repo: RepoConfig = {
      ...config,
      id: generateId("repo"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate connection
    if (repo.accessToken) {
      const client = this.getClient(repo);
      await client.getLatestCommit(repo.owner, repo.repo, repo.branch);
    }

    this.repos.set(repo.id, repo);
    this.emit("repo:connected", repo);

    // Initial sync
    if (repo.syncEnabled) {
      await this.pullPipelines(repo.id);
    }

    return repo;
  }

  /**
   * Disconnect a repository
   */
  async disconnectRepo(repoId: string): Promise<void> {
    const repo = this.repos.get(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    this.repos.delete(repoId);
    this.clients.delete(repoId);
    this.emit("repo:disconnected", repoId);
  }

  /**
   * Get repository by ID
   */
  getRepo(repoId: string): RepoConfig | undefined {
    return this.repos.get(repoId);
  }

  /**
   * List all connected repositories
   */
  listRepos(): RepoConfig[] {
    return Array.from(this.repos.values());
  }

  // ===========================================================================
  // SYNC OPERATIONS
  // ===========================================================================

  /**
   * Pull pipelines from repository
   */
  async pullPipelines(repoId: string): Promise<PipelineChange[]> {
    const repo = this.repos.get(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    this.emit("sync:started", repoId, "pull");

    try {
      const client = this.getClient(repo);
      const files = await client.listFiles(repo.owner, repo.repo, repo.path, repo.branch);
      const changes: PipelineChange[] = [];

      for (const file of files) {
        if (file.type === "file" && (file.name.endsWith(".yaml") || file.name.endsWith(".yml"))) {
          const fileData = await client.getFile(
            repo.owner,
            repo.repo,
            file.path,
            repo.branch
          );

          if (fileData?.content) {
            const content = Buffer.from(fileData.content, "base64").toString("utf-8");
            const parseResult = parsePipelineYAML(content);

            if (parseResult.success && parseResult.pipeline) {
              // Store SHA for future updates
              this.fileShas.set(file.path, fileData.sha);

              changes.push({
                pipelineName: parseResult.pipeline.name,
                filePath: file.path,
                changeType: "create", // TODO: Compare with existing
                newYaml: parseResult.pipeline,
              });

              this.emit("pipeline:imported", parseResult.pipeline.name, file.path);
            }
          }
        }
      }

      // Record sync
      const record: SyncRecord = {
        id: generateId("sync"),
        repoConfigId: repoId,
        pipelineId: "multiple",
        filePath: repo.path,
        commitSha: "latest",
        status: "synced",
        direction: "pull",
        message: `Pulled ${changes.length} pipelines`,
        createdAt: new Date().toISOString(),
      };

      this.addSyncRecord(repoId, record);
      this.emit("sync:completed", record);

      return changes;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("sync:failed", repoId, err);
      throw err;
    }
  }

  /**
   * Push a pipeline to repository
   */
  async pushPipeline(
    repoId: string,
    pipeline: InternalPipeline,
    commitMessage?: string
  ): Promise<SyncRecord> {
    const repo = this.repos.get(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    this.emit("sync:started", repoId, "push");

    try {
      const client = this.getClient(repo);
      const yaml = internalToYAML(pipeline);

      // Validate before push
      const validation = validatePipelineYAML(yaml);
      if (!validation.valid) {
        throw new Error(`Invalid pipeline: ${validation.errors.map((e) => e.message).join(", ")}`);
      }

      const content = stringifyPipelineYAML(yaml);
      const fileName = `${pipeline.id}.yaml`;
      const filePath = `${repo.path}/${fileName}`;
      const existingSha = this.fileShas.get(filePath);

      const result = await client.createOrUpdateFile(
        repo.owner,
        repo.repo,
        filePath,
        content,
        commitMessage || `Update pipeline: ${pipeline.name}`,
        existingSha,
        repo.branch
      );

      // Update SHA
      this.fileShas.set(filePath, result.sha);

      const record: SyncRecord = {
        id: generateId("sync"),
        repoConfigId: repoId,
        pipelineId: pipeline.id,
        filePath,
        commitSha: result.commit.sha,
        status: "synced",
        direction: "push",
        message: `Pushed pipeline: ${pipeline.name}`,
        createdAt: new Date().toISOString(),
      };

      this.addSyncRecord(repoId, record);
      this.emit("sync:completed", record);
      this.emit("pipeline:exported", pipeline.id, filePath);

      return record;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("sync:failed", repoId, err);
      throw err;
    }
  }

  /**
   * Delete a pipeline from repository
   */
  async deletePipeline(repoId: string, pipelineId: string): Promise<void> {
    const repo = this.repos.get(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    const client = this.getClient(repo);
    const fileName = `${pipelineId}.yaml`;
    const filePath = `${repo.path}/${fileName}`;
    const sha = this.fileShas.get(filePath);

    if (!sha) {
      throw new Error(`Pipeline file not found: ${filePath}`);
    }

    await client.deleteFile(
      repo.owner,
      repo.repo,
      filePath,
      sha,
      `Delete pipeline: ${pipelineId}`,
      repo.branch
    );

    this.fileShas.delete(filePath);
  }

  // ===========================================================================
  // WEBHOOK HANDLING
  // ===========================================================================

  /**
   * Handle incoming webhook from Git provider
   */
  async handleWebhook(
    provider: GitProvider,
    payload: unknown,
    signature?: string
  ): Promise<void> {
    // Parse webhook event
    const event = this.parseWebhookPayload(provider, payload);
    this.emit("webhook:received", event);

    // Find matching repository
    const repo = Array.from(this.repos.values()).find(
      (r) =>
        r.provider === provider &&
        r.owner === event.repo.owner &&
        r.repo === event.repo.name
    );

    if (!repo || !repo.autoSync) return;

    // Handle different event types
    if (event.event === "push" && event.ref === `refs/heads/${repo.branch}`) {
      // Auto-sync on push to tracked branch
      await this.pullPipelines(repo.id);
    }
  }

  /**
   * Parse webhook payload into normalized format
   */
  private parseWebhookPayload(
    provider: GitProvider,
    payload: unknown
  ): GitWebhookEvent {
    const p = payload as Record<string, unknown>;

    if (provider === "github") {
      const repo = p.repository as Record<string, unknown>;
      const sender = p.sender as Record<string, unknown>;
      const headCommit = p.head_commit as Record<string, unknown> | undefined;

      return {
        id: generateId("webhook"),
        provider,
        event: (p["X-GitHub-Event"] as string) || "push",
        action: p.action as string | undefined,
        repo: {
          owner: (repo.owner as Record<string, unknown>)?.login as string || "",
          name: repo.name as string || "",
        },
        ref: p.ref as string | undefined,
        commit: headCommit
          ? {
              sha: headCommit.id as string,
              message: headCommit.message as string,
              author: (headCommit.author as Record<string, unknown>)?.name as string || "",
            }
          : undefined,
        sender: {
          login: sender?.login as string || "",
          avatarUrl: sender?.avatar_url as string | undefined,
        },
        receivedAt: new Date().toISOString(),
      };
    }

    // Add GitLab, Bitbucket parsing here
    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Setup webhook for a repository
   */
  async setupWebhook(
    repoId: string,
    webhookUrl: string
  ): Promise<{ webhookId: number; secret: string }> {
    const repo = this.repos.get(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    const client = this.getClient(repo);
    const secret = generateSecret();

    const result = await client.createWebhook(
      repo.owner,
      repo.repo,
      webhookUrl,
      secret
    );

    // Update repo config with secret
    repo.webhookSecret = secret;
    this.repos.set(repoId, repo);

    return { webhookId: result.id, secret };
  }

  // ===========================================================================
  // SYNC HISTORY
  // ===========================================================================

  /**
   * Get sync history for a repository
   */
  getSyncHistory(repoId: string): SyncRecord[] {
    return this.syncRecords.get(repoId) || [];
  }

  /**
   * Get latest sync record
   */
  getLatestSync(repoId: string): SyncRecord | undefined {
    const records = this.syncRecords.get(repoId);
    return records?.[records.length - 1];
  }

  private addSyncRecord(repoId: string, record: SyncRecord): void {
    const records = this.syncRecords.get(repoId) || [];
    records.push(record);
    // Keep last 100 records
    if (records.length > 100) records.shift();
    this.syncRecords.set(repoId, records);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getClient(repo: RepoConfig): GitHubClient {
    if (!repo.accessToken) {
      throw new Error("No access token configured for repository");
    }

    let client = this.clients.get(repo.id);
    if (!client) {
      client = new GitHubClient(repo.accessToken);
      this.clients.set(repo.id, client);
    }
    return client;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: GitManager | null = null;

export function getGitManager(config?: Partial<GitManagerConfig>): GitManager {
  if (!instance) {
    instance = new GitManager(config);
  }
  return instance;
}

export function createGitManager(config?: Partial<GitManagerConfig>): GitManager {
  return new GitManager(config);
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default GitManager;
