// src/index.ts
import { BaseAgent } from "@gicm/agent-core";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var DeployTargetSchema = z.enum(["gicm_registry", "npm", "github"]);
var DeployRequestSchema = z.object({
  buildId: z.string(),
  name: z.string(),
  version: z.string(),
  targets: z.array(DeployTargetSchema),
  changelog: z.string().optional()
});
var DeployResultSchema = z.object({
  deployId: z.string(),
  request: DeployRequestSchema,
  status: z.enum(["pending", "deploying", "completed", "failed"]),
  results: z.array(z.object({
    target: DeployTargetSchema,
    success: z.boolean(),
    url: z.string().optional(),
    error: z.string().optional()
  }))
});
var DeployerAgent = class extends BaseAgent {
  registryApiUrl;
  npmToken;
  githubToken;
  githubOwner;
  packageDir;
  constructor(config) {
    super("deployer", config);
    this.registryApiUrl = config.registryApiUrl ?? "https://gicm.dev/api";
    this.npmToken = config.npmToken ?? process.env.NPM_TOKEN;
    this.githubToken = config.githubToken ?? process.env.GITHUB_TOKEN;
    this.githubOwner = config.githubOwner ?? "gicm-dev";
    this.packageDir = config.packageDir;
  }
  getSystemPrompt() {
    return `You are a deployment agent for gICM.
Your role is to publish built integrations to:
- gICM Registry (marketplace)
- npm (package manager)
- GitHub (releases)

Validate builds before deployment and handle rollbacks on failure.`;
  }
  async analyze(context) {
    const action = context.action ?? "deploy";
    switch (action) {
      case "deploy":
        return this.handleDeploy(context.params?.request);
      case "status":
        return this.createResult(true, { registryApiUrl: this.registryApiUrl });
      default:
        return this.createResult(false, null, `Unknown action: ${action}`);
    }
  }
  async deploy(request) {
    this.log(`Deploying ${request.name}@${request.version} to ${request.targets.join(", ")}`);
    const deployId = `deploy-${Date.now()}`;
    const results = [];
    for (const target of request.targets) {
      try {
        const url = await this.deployToTarget(target, request);
        results.push({ target, success: true, url });
        this.log(`\u2713 Deployed to ${target}: ${url}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Deploy failed";
        results.push({ target, success: false, error: msg });
        this.log(`\u2717 Failed to deploy to ${target}: ${msg}`);
      }
    }
    const allSuccess = results.every((r) => r.success);
    return {
      deployId,
      request,
      status: allSuccess ? "completed" : "failed",
      results
    };
  }
  async deployToTarget(target, request) {
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
  async deployToRegistry(request) {
    const endpoint = `${this.registryApiUrl}/v1/packages`;
    const payload = {
      name: request.name,
      version: request.version,
      buildId: request.buildId,
      changelog: request.changelog,
      publishedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.githubToken && { Authorization: `Bearer ${this.githubToken}` }
      },
      body: JSON.stringify(payload)
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
  async deployToNpm(request) {
    if (!this.npmToken) {
      throw new Error("NPM_TOKEN not configured");
    }
    const cwd = this.packageDir ?? process.cwd();
    const npmrcContent = `//registry.npmjs.org/:_authToken=${this.npmToken}`;
    const npmrcPath = `${cwd}/.npmrc`;
    const fs = await import("fs/promises");
    const existingNpmrc = await fs.readFile(npmrcPath, "utf-8").catch(() => null);
    await fs.writeFile(npmrcPath, npmrcContent);
    try {
      const { stdout, stderr } = await execAsync("npm publish --access public", {
        cwd,
        env: {
          ...process.env,
          NPM_TOKEN: this.npmToken
        }
      });
      this.log(`npm publish output: ${stdout}`);
      if (stderr) this.log(`npm publish stderr: ${stderr}`);
      return `https://npmjs.com/package/@gicm/${request.name}`;
    } finally {
      if (existingNpmrc) {
        await fs.writeFile(npmrcPath, existingNpmrc);
      } else {
        await fs.unlink(npmrcPath).catch(() => {
        });
      }
    }
  }
  /**
   * Create GitHub release
   */
  async deployToGitHub(request) {
    if (!this.githubToken) {
      throw new Error("GITHUB_TOKEN not configured");
    }
    const repo = request.name;
    const tag = `v${request.version}`;
    const endpoint = `https://api.github.com/repos/${this.githubOwner}/${repo}/releases`;
    const existingResponse = await fetch(
      `${endpoint}/tags/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      this.log(`Release ${tag} already exists`);
      return existing.html_url;
    }
    const payload = {
      tag_name: tag,
      name: `${request.name} ${tag}`,
      body: request.changelog ?? `Release ${request.version}`,
      draft: false,
      prerelease: request.version.includes("-")
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub release failed: ${response.status} ${error}`);
    }
    const result = await response.json();
    return result.html_url;
  }
  async handleDeploy(request) {
    if (!request) {
      return this.createResult(false, null, "No deploy request provided");
    }
    try {
      const result = await this.deploy(request);
      const success = result.status === "completed";
      return this.createResult(
        success,
        result,
        success ? void 0 : "Some deployments failed",
        success ? 1 : 0.5,
        `Deployed ${request.name}@${request.version}`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Deploy failed";
      return this.createResult(false, null, msg);
    }
  }
};
export {
  DeployRequestSchema,
  DeployResultSchema,
  DeployTargetSchema,
  DeployerAgent
};
