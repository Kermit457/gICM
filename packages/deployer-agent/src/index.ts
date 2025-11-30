import { BaseAgent } from "@gicm/agent-core";
import type { AgentConfig, AgentContext, AgentResult } from "@gicm/agent-core";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const DeployTargetSchema = z.enum(["gicm_registry", "npm", "github"]);
export type DeployTarget = z.infer<typeof DeployTargetSchema>;

export const DeployRequestSchema = z.object({
  buildId: z.string(),
  name: z.string(),
  version: z.string(),
  targets: z.array(DeployTargetSchema),
  changelog: z.string().optional(),
});
export type DeployRequest = z.infer<typeof DeployRequestSchema>;

export const DeployResultSchema = z.object({
  deployId: z.string(),
  request: DeployRequestSchema,
  status: z.enum(["pending", "deploying", "completed", "failed"]),
  results: z.array(z.object({
    target: DeployTargetSchema,
    success: z.boolean(),
    url: z.string().optional(),
    error: z.string().optional(),
  })),
});
export type DeployResult = z.infer<typeof DeployResultSchema>;

export interface DeployerAgentConfig extends AgentConfig {
  registryApiUrl?: string;
  npmToken?: string;
  githubToken?: string;
  githubOwner?: string;
  packageDir?: string; // Directory containing package.json for npm publish
}

export class DeployerAgent extends BaseAgent {
  private registryApiUrl: string;
  private npmToken?: string;
  private githubToken?: string;
  private githubOwner: string;
  private packageDir?: string;

  constructor(config: DeployerAgentConfig) {
    super("deployer", config);
    this.registryApiUrl = config.registryApiUrl ?? "https://gicm.dev/api";
    this.npmToken = config.npmToken ?? process.env.NPM_TOKEN;
    this.githubToken = config.githubToken ?? process.env.GITHUB_TOKEN;
    this.githubOwner = config.githubOwner ?? "gicm-dev";
    this.packageDir = config.packageDir;
  }

  getSystemPrompt(): string {
    return `You are a deployment agent for gICM.
Your role is to publish built integrations to:
- gICM Registry (marketplace)
- npm (package manager)
- GitHub (releases)

Validate builds before deployment and handle rollbacks on failure.`;
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    const action = context.action ?? "deploy";

    switch (action) {
      case "deploy":
        return this.handleDeploy(context.params?.request as DeployRequest);
      case "status":
        return this.createResult(true, { registryApiUrl: this.registryApiUrl });
      default:
        return this.createResult(false, null, `Unknown action: ${action}`);
    }
  }

  async deploy(request: DeployRequest): Promise<DeployResult> {
    this.log(`Deploying ${request.name}@${request.version} to ${request.targets.join(", ")}`);

    const deployId = `deploy-${Date.now()}`;
    const results: DeployResult["results"] = [];

    for (const target of request.targets) {
      try {
        const url = await this.deployToTarget(target, request);
        results.push({ target, success: true, url });
        this.log(`✓ Deployed to ${target}: ${url}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Deploy failed";
        results.push({ target, success: false, error: msg });
        this.log(`✗ Failed to deploy to ${target}: ${msg}`);
      }
    }

    const allSuccess = results.every((r) => r.success);

    return {
      deployId,
      request,
      status: allSuccess ? "completed" : "failed",
      results,
    };
  }

  private async deployToTarget(
    target: DeployTarget,
    request: DeployRequest
  ): Promise<string> {
    switch (target) {
      case "gicm_registry":
        return this.deployToRegistry(request);
      case "npm":
        return this.deployToNpm(request);
      case "github":
        return this.deployToGitHub(request);
      default:
        throw new Error(`Unknown target: ${target}`);
    }
  }

  /**
   * Deploy to gICM Registry via API
   */
  private async deployToRegistry(request: DeployRequest): Promise<string> {
    const endpoint = `${this.registryApiUrl}/v1/packages`;

    const payload = {
      name: request.name,
      version: request.version,
      buildId: request.buildId,
      changelog: request.changelog,
      publishedAt: new Date().toISOString(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.githubToken && { Authorization: `Bearer ${this.githubToken}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registry publish failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    return result.url ?? `${this.registryApiUrl}/items/${request.name}`;
  }

  /**
   * Deploy to npm registry
   */
  private async deployToNpm(request: DeployRequest): Promise<string> {
    if (!this.npmToken) {
      throw new Error("NPM_TOKEN not configured");
    }

    const cwd = this.packageDir ?? process.cwd();

    // Set npm token for authentication
    const npmrcContent = `//registry.npmjs.org/:_authToken=${this.npmToken}`;
    const npmrcPath = `${cwd}/.npmrc`;

    // Write temporary .npmrc
    const fs = await import("fs/promises");
    const existingNpmrc = await fs.readFile(npmrcPath, "utf-8").catch(() => null);
    await fs.writeFile(npmrcPath, npmrcContent);

    try {
      // Run npm publish
      const { stdout, stderr } = await execAsync("npm publish --access public", {
        cwd,
        env: {
          ...process.env,
          NPM_TOKEN: this.npmToken,
        },
      });

      this.log(`npm publish output: ${stdout}`);
      if (stderr) this.log(`npm publish stderr: ${stderr}`);

      return `https://npmjs.com/package/@gicm/${request.name}`;
    } finally {
      // Restore original .npmrc or remove
      if (existingNpmrc) {
        await fs.writeFile(npmrcPath, existingNpmrc);
      } else {
        await fs.unlink(npmrcPath).catch(() => {});
      }
    }
  }

  /**
   * Create GitHub release
   */
  private async deployToGitHub(request: DeployRequest): Promise<string> {
    if (!this.githubToken) {
      throw new Error("GITHUB_TOKEN not configured");
    }

    const repo = request.name;
    const tag = `v${request.version}`;
    const endpoint = `https://api.github.com/repos/${this.githubOwner}/${repo}/releases`;

    // Check if release already exists
    const existingResponse = await fetch(
      `${endpoint}/tags/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      this.log(`Release ${tag} already exists`);
      return existing.html_url;
    }

    // Create new release
    const payload = {
      tag_name: tag,
      name: `${request.name} ${tag}`,
      body: request.changelog ?? `Release ${request.version}`,
      draft: false,
      prerelease: request.version.includes("-"),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub release failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    return result.html_url;
  }

  private async handleDeploy(request?: DeployRequest): Promise<AgentResult> {
    if (!request) {
      return this.createResult(false, null, "No deploy request provided");
    }

    try {
      const result = await this.deploy(request);
      const success = result.status === "completed";
      return this.createResult(
        success,
        result,
        success ? undefined : "Some deployments failed",
        success ? 1.0 : 0.5,
        `Deployed ${request.name}@${request.version}`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Deploy failed";
      return this.createResult(false, null, msg);
    }
  }
}
