/**
 * gicm index - Index codebase for semantic search
 *
 * Connects to context-engine to vectorize the codebase
 */

import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import * as path from 'path';
import { loadConfig, updateIndexingStats, isInitialized } from '../lib/config';

interface IndexOptions {
  contextEngineUrl?: string;
  verbose?: boolean;
  full?: boolean;
}

interface IndexResponse {
  success: boolean;
  message: string;
  stats?: {
    files_indexed: number;
    chunks_created: number;
    time_seconds: number;
  };
  error?: string;
}

export async function indexCommand(options: IndexOptions = {}): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold('\n📚 gICM Index\n'));

  // Check if initialized
  if (!await isInitialized(cwd)) {
    console.log(chalk.red('✗ Project not initialized.'));
    console.log(chalk.gray('  Run `gicm init` first.\n'));
    process.exit(1);
  }

  // Load config
  const config = await loadConfig(cwd);
  if (!config) {
    console.log(chalk.red('✗ Could not load config.'));
    process.exit(1);
  }

  const contextEngineUrl = options.contextEngineUrl || config.mcp.contextEngineUrl;

  // Check if context engine is running
  const checkSpinner = ora('Checking context engine...').start();
  try {
    await axios.get(`${contextEngineUrl}/health`, { timeout: 5000 });
    checkSpinner.succeed('Context engine is running');
  } catch {
    checkSpinner.fail('Context engine not reachable');
    console.log(chalk.yellow('\n  The context engine is not running at:'));
    console.log(chalk.gray(`  ${contextEngineUrl}\n`));
    console.log(chalk.white('  To start it, run:'));
    console.log(chalk.cyan('  cd services/context-engine && python -m uvicorn src.main:app --port 8000\n'));
    console.log(chalk.gray('  Or update the URL in .gicm/config.json\n'));
    process.exit(1);
  }

  // Start indexing
  const indexSpinner = ora('Indexing codebase...').start();

  try {
    const response = await axios.post<IndexResponse>(
      `${contextEngineUrl}/index/repository`,
      {
        path: cwd,
        project_name: config.project.name,
        exclude_patterns: config.indexing.excludePatterns,
        include_patterns: config.indexing.includePatterns,
        full_reindex: options.full,
      },
      { timeout: 300000 } // 5 minutes
    );

    if (response.data.success && response.data.stats) {
      const stats = response.data.stats;
      indexSpinner.succeed(
        `Indexed ${chalk.cyan(stats.files_indexed)} files → ${chalk.cyan(stats.chunks_created)} chunks`
      );

      // Update config with indexing stats
      await updateIndexingStats(
        {
          fileCount: stats.files_indexed,
          chunkCount: stats.chunks_created,
        },
        cwd
      );

      if (options.verbose) {
        console.log(chalk.gray(`\n  Time: ${stats.time_seconds.toFixed(2)}s`));
        console.log(chalk.gray(`  Chunks per file: ${(stats.chunks_created / stats.files_indexed).toFixed(1)}`));
      }

      console.log(chalk.green('\n✓ Codebase indexed successfully!\n'));
      console.log(chalk.bold('You can now:'));
      console.log(chalk.white('  • Search your code semantically'));
      console.log(chalk.white('  • Get context-aware AI assistance'));
      console.log(chalk.white('  • Use MCP tools in Claude Code\n'));

    } else {
      indexSpinner.fail('Indexing failed');
      console.log(chalk.red(`\n  Error: ${response.data.error || 'Unknown error'}\n`));
      process.exit(1);
    }

  } catch (error) {
    indexSpinner.fail('Indexing failed');

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.log(chalk.yellow('\n  Indexing timed out. For large codebases, try:'));
        console.log(chalk.gray('  • Adding more exclude patterns to .gicm/config.json'));
        console.log(chalk.gray('  • Running the context engine with more resources\n'));
      } else {
        console.log(chalk.red(`\n  ${error.message}\n`));
      }
    } else {
      throw error;
    }
    process.exit(1);
  }
}
