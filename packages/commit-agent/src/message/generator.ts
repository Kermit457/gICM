/**
 * Message Generator
 *
 * AI-powered commit message generation using LLM
 */

import type { LLMClient } from "@gicm/agent-core";
import { createLLMClient } from "@gicm/agent-core";
import type { DiffSummary, GeneratedMessage, CommitMessage, ConventionalType, CommitAgentConfig } from "../core/types.js";
import { COMMIT_FOOTER_TEMPLATE, COMMIT_TYPE_DESCRIPTIONS } from "../core/constants.js";
import { COMMIT_MESSAGE_SYSTEM_PROMPT, COMMIT_MESSAGE_USER_PROMPT, PR_BODY_SYSTEM_PROMPT, PR_BODY_USER_PROMPT } from "./prompts.js";
import { DiffAnalyzer } from "../git/diff-analyzer.js";

export interface GeneratorConfig {
  llmProvider?: "openai" | "anthropic" | "gemini";
  llmModel?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  includeCoAuthor?: boolean;
  coAuthorName?: string;
  coAuthorEmail?: string;
}

export class MessageGenerator {
  private llmClient: LLMClient | null = null;
  private diffAnalyzer: DiffAnalyzer;
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig = {}) {
    this.config = {
      llmProvider: "anthropic",
      temperature: 0.3,
      maxTokens: 2048,
      includeCoAuthor: true,
      coAuthorName: "Claude",
      coAuthorEmail: "noreply@anthropic.com",
      ...config,
    };

    this.diffAnalyzer = new DiffAnalyzer();

    // Initialize LLM client if API key provided
    if (this.config.apiKey) {
      this.llmClient = createLLMClient({
        provider: this.config.llmProvider!,
        model: this.config.llmModel,
        apiKey: this.config.apiKey,
        temperature: this.config.temperature!,
        maxTokens: this.config.maxTokens!,
      });
    }
  }

  /**
   * Generate a commit message from diff
   */
  async generate(diff: DiffSummary): Promise<GeneratedMessage> {
    // If no LLM client, use fallback heuristics
    if (!this.llmClient) {
      return this.generateFallback(diff);
    }

    try {
      const context = this.diffAnalyzer.createLLMContext(diff);
      const prompt = COMMIT_MESSAGE_USER_PROMPT(context);

      const response = await this.llmClient.chat([
        { role: "system", content: COMMIT_MESSAGE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ]);

      const parsed = this.parseJSON<{
        type: ConventionalType;
        scope: string | null;
        subject: string;
        body: string | null;
        breaking: boolean;
        reasoning: string;
      }>(response.content);

      if (!parsed) {
        return this.generateFallback(diff);
      }

      const message: CommitMessage = {
        type: parsed.type,
        scope: parsed.scope ?? undefined,
        subject: parsed.subject,
        body: parsed.body ?? undefined,
        breaking: parsed.breaking ?? false,
        coAuthors: this.config.includeCoAuthor
          ? [`${this.config.coAuthorName} <${this.config.coAuthorEmail}>`]
          : [],
      };

      return {
        message,
        fullText: this.formatMessage(message),
        confidence: 0.9,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error("LLM generation failed, using fallback:", error);
      return this.generateFallback(diff);
    }
  }

  /**
   * Generate PR body from commits and diff
   */
  async generatePRBody(
    commits: string[],
    diff: DiffSummary
  ): Promise<{ title: string; body: string; labels: string[] }> {
    const diffSummary = `${diff.totalFilesChanged} files, +${diff.totalLinesAdded}/-${diff.totalLinesRemoved} lines`;

    if (!this.llmClient) {
      // Fallback PR body
      return {
        title: commits[0] || "Update",
        body: this.generateFallbackPRBody(commits, diff),
        labels: [],
      };
    }

    try {
      const prompt = PR_BODY_USER_PROMPT(commits, diffSummary);

      const response = await this.llmClient.chat([
        { role: "system", content: PR_BODY_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ]);

      const parsed = this.parseJSON<{
        title: string;
        body: string;
        labels: string[];
      }>(response.content);

      if (!parsed) {
        return {
          title: commits[0] || "Update",
          body: this.generateFallbackPRBody(commits, diff),
          labels: [],
        };
      }

      return parsed;
    } catch (error) {
      console.error("PR body generation failed:", error);
      return {
        title: commits[0] || "Update",
        body: this.generateFallbackPRBody(commits, diff),
        labels: [],
      };
    }
  }

  /**
   * Format a CommitMessage to full text
   */
  formatMessage(message: CommitMessage): string {
    const parts: string[] = [];

    // Header: type(scope)!: subject
    let header = message.type;
    if (message.scope) header += `(${message.scope})`;
    if (message.breaking) header += "!";
    header += `: ${message.subject}`;
    parts.push(header);

    // Body
    if (message.body) {
      parts.push(""); // Empty line
      parts.push(message.body);
    }

    // Footer with co-authors
    parts.push(""); // Empty line
    parts.push(COMMIT_FOOTER_TEMPLATE);

    return parts.join("\n");
  }

  /**
   * Validate a commit message
   */
  validateMessage(message: CommitMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.type) {
      errors.push("Missing commit type");
    }

    if (!message.subject) {
      errors.push("Missing commit subject");
    } else {
      if (message.subject.length > 72) {
        errors.push(`Subject too long (${message.subject.length}/72 chars)`);
      }
      if (message.subject.endsWith(".")) {
        errors.push("Subject should not end with a period");
      }
      if (!/^[a-z]/.test(message.subject)) {
        errors.push("Subject should start with lowercase");
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate fallback commit message without LLM
   */
  private generateFallback(diff: DiffSummary): GeneratedMessage {
    // Determine type based on files
    let type: ConventionalType = "chore";
    let scope: string | undefined;

    const paths = diff.files.map((f) => f.path);

    // Detect type from file patterns
    if (paths.some((p) => p.includes("test") || p.includes("spec"))) {
      type = "test";
    } else if (paths.some((p) => p.endsWith(".md") || p.includes("docs/"))) {
      type = "docs";
    } else if (paths.some((p) => p.includes(".github/") || p.includes("ci"))) {
      type = "ci";
    } else if (paths.some((p) => p.includes("package.json") || p.includes("deps"))) {
      type = "build";
    } else if (diff.files.some((f) => f.type === "added")) {
      type = "feat";
    } else {
      type = "chore";
    }

    // Detect scope from common path prefix
    const commonPrefix = this.findCommonPrefix(paths);
    if (commonPrefix) {
      scope = commonPrefix.split("/")[0];
      if (scope === "src" || scope === "packages") {
        scope = commonPrefix.split("/")[1] || undefined;
      }
    }

    // Generate subject
    const action =
      diff.files[0]?.type === "added"
        ? "add"
        : diff.files[0]?.type === "deleted"
          ? "remove"
          : "update";
    const target =
      diff.files.length === 1
        ? diff.files[0].path.split("/").pop()
        : `${diff.files.length} files`;
    const subject = `${action} ${target}`;

    const message: CommitMessage = {
      type,
      scope,
      subject: subject.substring(0, 72),
      breaking: false,
      coAuthors: this.config.includeCoAuthor
        ? [`${this.config.coAuthorName} <${this.config.coAuthorEmail}>`]
        : [],
    };

    return {
      message,
      fullText: this.formatMessage(message),
      confidence: 0.5,
      reasoning: "Generated using file pattern heuristics (no LLM available)",
    };
  }

  /**
   * Generate fallback PR body
   */
  private generateFallbackPRBody(commits: string[], diff: DiffSummary): string {
    return `## Summary
This PR includes ${commits.length} commit(s) affecting ${diff.totalFilesChanged} files.

## Changes
${diff.files.map((f) => `- ${f.type}: \`${f.path}\` (+${f.linesAdded}/-${f.linesRemoved})`).join("\n")}

## Commits
${commits.map((c) => `- ${c}`).join("\n")}

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
`;
  }

  /**
   * Find common path prefix
   */
  private findCommonPrefix(paths: string[]): string {
    if (paths.length === 0) return "";
    if (paths.length === 1) return paths[0].substring(0, paths[0].lastIndexOf("/"));

    const sorted = paths.slice().sort();
    const first = sorted[0].split("/");
    const last = sorted[sorted.length - 1].split("/");

    const common: string[] = [];
    for (let i = 0; i < Math.min(first.length, last.length); i++) {
      if (first[i] === last[i]) {
        common.push(first[i]);
      } else {
        break;
      }
    }

    return common.join("/");
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJSON<T>(text: string): T | null {
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try direct parse
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }

      return null;
    } catch {
      return null;
    }
  }
}
