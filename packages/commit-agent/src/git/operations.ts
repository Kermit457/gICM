/**
 * Git Operations
 *
 * Executes git commands safely with structured output
 */

import { exec } from "child_process";
import { promisify } from "util";
import type { GitStatus, FileChange, FileChangeType } from "../core/types.js";

const execAsync = promisify(exec);

export interface GitExecOptions {
  cwd?: string;
  timeout?: number;
}

export class GitOperations {
  private cwd: string;
  private timeout: number;

  constructor(options: GitExecOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * Execute a git command
   */
  async exec(args: string[]): Promise<string> {
    const command = `git ${args.join(" ")}`;
    try {
      const { stdout } = await execAsync(command, {
        cwd: this.cwd,
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
      });
      return stdout.trim();
    } catch (error) {
      const err = error as { stderr?: string; message: string };
      throw new Error(err.stderr || err.message);
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    return this.exec(["rev-parse", "--abbrev-ref", "HEAD"]);
  }

  /**
   * Check if working directory is clean
   */
  async isClean(): Promise<boolean> {
    const output = await this.exec(["status", "--porcelain"]);
    return output.length === 0;
  }

  /**
   * Get comprehensive git status
   */
  async getStatus(): Promise<GitStatus> {
    const [branch, porcelain, remote] = await Promise.all([
      this.getCurrentBranch(),
      this.exec(["status", "--porcelain=v2", "--branch"]),
      this.exec(["remote"]).catch(() => ""),
    ]);

    const lines = porcelain.split("\n").filter(Boolean);
    const staged: FileChange[] = [];
    const unstaged: FileChange[] = [];
    const untracked: string[] = [];
    let ahead = 0;
    let behind = 0;

    for (const line of lines) {
      // Branch info
      if (line.startsWith("# branch.ab")) {
        const match = line.match(/\+(\d+) -(\d+)/);
        if (match) {
          ahead = parseInt(match[1], 10);
          behind = parseInt(match[2], 10);
        }
        continue;
      }

      // Skip other branch lines
      if (line.startsWith("#")) continue;

      // Untracked files
      if (line.startsWith("?")) {
        untracked.push(line.substring(2));
        continue;
      }

      // Changed files (format: XY path)
      if (line.startsWith("1") || line.startsWith("2")) {
        const parts = line.split("\t");
        const statusPart = parts[0].split(" ");
        const xy = statusPart[1] || "";
        const path = parts[parts.length - 1];

        const indexStatus = xy[0];
        const workStatus = xy[1];

        // Staged changes
        if (indexStatus !== "." && indexStatus !== "?") {
          staged.push({
            path,
            type: this.parseStatusChar(indexStatus),
            linesAdded: 0,
            linesRemoved: 0,
            binary: false,
          });
        }

        // Unstaged changes
        if (workStatus !== "." && workStatus !== "?") {
          unstaged.push({
            path,
            type: this.parseStatusChar(workStatus),
            linesAdded: 0,
            linesRemoved: 0,
            binary: false,
          });
        }
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
      hasRemote: remote.length > 0,
    };
  }

  /**
   * Get staged files
   */
  async getStagedFiles(): Promise<string[]> {
    const output = await this.exec(["diff", "--cached", "--name-only"]);
    return output ? output.split("\n").filter(Boolean) : [];
  }

  /**
   * Get diff (staged or all)
   */
  async getDiff(staged = true): Promise<string> {
    const args = ["diff"];
    if (staged) args.push("--cached");
    args.push("--no-color");
    return this.exec(args);
  }

  /**
   * Get diff with statistics
   */
  async getDiffStat(staged = true): Promise<string> {
    const args = ["diff", "--stat"];
    if (staged) args.push("--cached");
    return this.exec(args);
  }

  /**
   * Stage files
   */
  async stage(files: string[]): Promise<void> {
    if (files.length === 0) return;
    await this.exec(["add", "--", ...files]);
  }

  /**
   * Stage all changes
   */
  async stageAll(): Promise<void> {
    await this.exec(["add", "-A"]);
  }

  /**
   * Unstage files
   */
  async unstage(files: string[]): Promise<void> {
    if (files.length === 0) return;
    await this.exec(["reset", "HEAD", "--", ...files]);
  }

  /**
   * Create a commit
   */
  async commit(message: string, options: { amend?: boolean } = {}): Promise<string> {
    const args = ["commit", "-m", message];
    if (options.amend) args.push("--amend");

    await this.exec(args);
    return this.getLastCommitHash();
  }

  /**
   * Get the last commit hash
   */
  async getLastCommitHash(): Promise<string> {
    return this.exec(["rev-parse", "HEAD"]);
  }

  /**
   * Get recent commit messages for style reference
   */
  async getRecentCommits(count = 5): Promise<string[]> {
    const output = await this.exec([
      "log",
      `--format=%s`,
      `-${count}`,
    ]);
    return output ? output.split("\n").filter(Boolean) : [];
  }

  /**
   * Push to remote
   */
  async push(options: {
    remote?: string;
    branch?: string;
    force?: boolean;
    setUpstream?: boolean;
  } = {}): Promise<{ remote: string; branch: string }> {
    const remote = options.remote ?? "origin";
    const branch = options.branch ?? await this.getCurrentBranch();

    const args = ["push"];
    if (options.force) args.push("--force");
    if (options.setUpstream) args.push("-u");
    args.push(remote, branch);

    await this.exec(args);
    return { remote, branch };
  }

  /**
   * Check if remote branch exists
   */
  async remoteBranchExists(remote: string, branch: string): Promise<boolean> {
    try {
      await this.exec(["ls-remote", "--exit-code", remote, `refs/heads/${branch}`]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get remote URL
   */
  async getRemoteUrl(remote = "origin"): Promise<string> {
    return this.exec(["remote", "get-url", remote]);
  }

  /**
   * Parse status character to FileChangeType
   */
  private parseStatusChar(char: string): FileChangeType {
    switch (char.toUpperCase()) {
      case "A":
        return "added";
      case "M":
        return "modified";
      case "D":
        return "deleted";
      case "R":
        return "renamed";
      case "C":
        return "copied";
      default:
        return "modified";
    }
  }
}
