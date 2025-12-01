/**
 * Search Tools command - Search for PTC-compatible tools
 *
 * Usage: gicm search-tools "research crypto tokens"
 * Example: gicm search-tools "solana memecoin analysis" --limit 10
 */

import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { GICMAPIClient } from "../lib/api";
import type { CLIOptions } from "../lib/types";

export interface SearchToolsOptions extends CLIOptions {
  limit?: number;
  kind?: string;
  minQuality?: number;
  json?: boolean;
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ToolSearchResult {
  tool: ToolDefinition;
  metadata: {
    id: string;
    kind: string;
    category: string;
    tags: string[];
    install: string;
    platforms: string[];
    qualityScore: number;
    installs: number;
  };
  score: number;
}

interface SearchToolsResponse {
  tools: ToolDefinition[];
  results: ToolSearchResult[];
  meta: {
    query: string;
    totalMatches: number;
    searchTime: number;
    platform?: string;
    kind?: string;
  };
}

/**
 * Search tools command handler
 */
export async function searchToolsCommand(
  query: string,
  options: SearchToolsOptions = {}
): Promise<void> {
  const apiClient = new GICMAPIClient(options.apiUrl);
  const limit = options.limit || 10;
  const platform = options.platform || "claude";

  const spinner = ora({
    text: `Searching for tools: "${query}"...`,
    color: "cyan",
  }).start();

  try {
    // Call tool search API
    const response = await apiClient.searchTools(query, {
      limit,
      platform,
      kind: options.kind,
      minQuality: options.minQuality,
    });

    spinner.succeed(
      chalk.green(`Found ${response.meta.totalMatches} tools`) +
        chalk.gray(` (${response.meta.searchTime}ms)`)
    );

    // JSON output mode
    if (options.json) {
      console.log(JSON.stringify(response, null, 2));
      return;
    }

    if (response.results.length === 0) {
      console.log(chalk.yellow("\nNo tools found matching your query."));
      console.log(chalk.gray("Try a different search term or broaden your criteria."));
      return;
    }

    // Display results in table
    console.log(chalk.cyan(`\nTool Search Results for "${query}":\n`));

    const table = new Table({
      head: [
        chalk.white("Tool"),
        chalk.white("Kind"),
        chalk.white("Category"),
        chalk.white("Score"),
        chalk.white("Quality"),
        chalk.white("Install"),
      ],
      colWidths: [25, 10, 18, 8, 9, 35],
      wordWrap: true,
    });

    for (const result of response.results) {
      const { tool, metadata, score } = result;

      // Quality badge
      const qualityBadge =
        metadata.qualityScore >= 90
          ? chalk.green(`${metadata.qualityScore}%`)
          : metadata.qualityScore >= 70
          ? chalk.yellow(`${metadata.qualityScore}%`)
          : chalk.gray(`${metadata.qualityScore}%`);

      // Score badge
      const scoreBadge = score >= 50 ? chalk.green(score.toFixed(0)) : chalk.white(score.toFixed(0));

      table.push([
        chalk.bold(tool.name.replace(/_/g, "-")),
        metadata.kind,
        metadata.category.slice(0, 16),
        scoreBadge,
        qualityBadge,
        `gicm add ${metadata.kind}/${metadata.id.slice(0, 20)}`,
      ]);
    }

    console.log(table.toString());

    // Show detailed view of top result
    if (response.results.length > 0) {
      const top = response.results[0];
      console.log(chalk.cyan(`\n${chalk.bold("Top Match:")} ${top.tool.name.replace(/_/g, "-")}`));
      console.log(chalk.white(`  ${top.tool.description.slice(0, 200)}${top.tool.description.length > 200 ? "..." : ""}`));
      console.log(chalk.gray(`  Tags: ${top.metadata.tags.slice(0, 5).join(", ")}`));
      console.log(chalk.gray(`  Platforms: ${top.metadata.platforms.join(", ")}`));
      console.log(chalk.gray(`  Installs: ${top.metadata.installs}`));
      console.log("");
    }

    // Help text
    console.log(chalk.gray("Install a tool with:"));
    console.log(chalk.white(`  gicm add <kind>/<slug>\n`));

    // PTC usage hint
    console.log(chalk.cyan("PTC Pipeline Usage:"));
    console.log(chalk.gray("  These tools can be orchestrated via PTC pipelines."));
    console.log(chalk.gray("  Install the PTC stack: gicm install-stack ptc-tool-search-stack\n"));

  } catch (error) {
    spinner.fail(chalk.red("Tool search failed"));
    console.error(chalk.red(`\n${(error as Error).message}\n`));
    process.exit(1);
  }
}
