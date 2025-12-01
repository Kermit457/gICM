/**
 * Commit Commands for gICM CLI
 *
 * AI-powered git commit workflow
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';

// Lazy load commit-agent to avoid dependency issues during build
async function getCommitAgent() {
  const { CommitAgent } = await import('@gicm/commit-agent');
  return CommitAgent;
}

export interface CommitCommandOptions {
  all?: boolean;
  message?: string;
  push?: boolean;
  pr?: boolean;
  dryRun?: boolean;
  amend?: boolean;
  verbose?: boolean;
}

export async function commitStatusCommand(options: { verbose?: boolean } = {}): Promise<void> {
  const spinner = ora('Getting git status...').start();

  try {
    const CommitAgent = await getCommitAgent();
    const agent = new CommitAgent({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      verbose: options.verbose,
    });

    const status = await agent.getStatus();
    spinner.stop();

    console.log(chalk.bold(`\nBranch: ${chalk.cyan(status.branch)}`));

    if (status.isClean) {
      console.log(chalk.green('✓ Working tree clean'));
      return;
    }

    // Show risk assessment
    const risk = await agent.assessRisk();

    if (status.staged.length > 0) {
      console.log(chalk.bold.green(`\nStaged (${status.staged.length}):`));
      status.staged.forEach((f) => {
        const color = f.type === 'added' ? chalk.green : f.type === 'deleted' ? chalk.red : chalk.yellow;
        console.log(`  ${color(f.type.charAt(0).toUpperCase())} ${f.path}`);
      });
    }

    if (status.unstaged.length > 0) {
      console.log(chalk.bold.yellow(`\nUnstaged (${status.unstaged.length}):`));
      status.unstaged.forEach((f) => {
        const color = f.type === 'added' ? chalk.green : f.type === 'deleted' ? chalk.red : chalk.yellow;
        console.log(`  ${color(f.type.charAt(0).toUpperCase())} ${f.path}`);
      });
    }

    if (status.untracked.length > 0) {
      console.log(chalk.bold.gray(`\nUntracked (${status.untracked.length}):`));
      status.untracked.slice(0, 10).forEach((f) => {
        console.log(`  ${chalk.gray('?')} ${f}`);
      });
      if (status.untracked.length > 10) {
        console.log(chalk.gray(`  ... and ${status.untracked.length - 10} more`));
      }
    }

    // Risk assessment
    const riskColor = risk.totalScore <= 40 ? chalk.green : risk.totalScore <= 60 ? chalk.yellow : chalk.red;
    console.log(chalk.bold(`\nRisk Assessment:`));
    console.log(`  Score: ${riskColor(risk.totalScore + '/100')}`);
    console.log(`  Recommendation: ${chalk.cyan(risk.recommendation)}`);

    if (risk.criticalPaths.length > 0) {
      console.log(chalk.yellow(`  ⚠ Touches critical paths: ${risk.criticalPaths.slice(0, 3).join(', ')}`));
    }
    if (risk.isBreakingChange) {
      console.log(chalk.red(`  ⚠ Breaking change detected`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to get status'));
    throw error;
  }
}

export async function commitGenerateCommand(options: { staged?: boolean; verbose?: boolean } = {}): Promise<void> {
  const spinner = ora('Analyzing changes...').start();

  try {
    const CommitAgent = await getCommitAgent();
    const agent = new CommitAgent({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      verbose: options.verbose,
    });

    const message = await agent.generateMessage(options.staged ?? true);
    spinner.succeed('Message generated');

    console.log(chalk.bold(`\nConfidence: ${chalk.cyan(Math.round(message.confidence * 100) + '%')}`));
    console.log(chalk.bold('\nSuggested message:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(message.fullText);
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`\nReasoning: ${message.reasoning}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate message'));
    throw error;
  }
}

export async function commitCreateCommand(options: CommitCommandOptions = {}): Promise<void> {
  const spinner = ora('Creating commit...').start();

  try {
    const CommitAgent = await getCommitAgent();
    const agent = new CommitAgent({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      verbose: options.verbose,
    });

    const result = await agent.commit({
      all: options.all,
      message: options.message,
      push: options.push,
      createPr: options.pr,
      dryRun: options.dryRun,
      amend: options.amend,
    });

    if (!result.success) {
      spinner.fail(chalk.red('Commit failed'));
      console.error(chalk.red(`\nError: ${result.error}`));

      if (result.approvalRequired) {
        console.log(chalk.yellow(`\nRisk score: ${result.riskScore}/100`));
        console.log(chalk.yellow('This commit exceeds auto-execute threshold and requires approval.'));
        console.log(chalk.gray('Use --force to override (not recommended)'));
      }
      process.exit(1);
    }

    if (options.dryRun) {
      spinner.info(chalk.cyan('[DRY RUN] Would create commit:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(result.message?.fullText);
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`\nRisk score: ${result.riskScore}/100`));
      return;
    }

    spinner.succeed(chalk.green(`Commit created: ${chalk.bold(result.commitHash?.substring(0, 7))}`));

    if (result.message) {
      console.log(chalk.gray(`\nMessage: ${result.message.message.type}${result.message.message.scope ? `(${result.message.message.scope})` : ''}: ${result.message.message.subject}`));
    }

    if (result.pushed) {
      console.log(chalk.green('✓ Pushed to remote'));
    }

    if (result.prUrl) {
      console.log(chalk.green(`✓ PR created: ${chalk.cyan(result.prUrl)}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Commit failed'));
    throw error;
  }
}

export async function commitPushCommand(options: { force?: boolean; verbose?: boolean } = {}): Promise<void> {
  const spinner = ora('Pushing to remote...').start();

  try {
    const CommitAgent = await getCommitAgent();
    const agent = new CommitAgent({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      verbose: options.verbose,
    });

    const result = await agent.push({
      force: options.force,
      setUpstream: true,
    });

    if (!result.success) {
      spinner.fail(chalk.red('Push failed'));
      console.error(chalk.red(`\nError: ${result.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green(`Pushed to ${chalk.cyan(result.remote + '/' + result.branch)}`));
  } catch (error) {
    spinner.fail(chalk.red('Push failed'));
    throw error;
  }
}

export async function commitPRCommand(options: { title?: string; body?: string; base?: string; draft?: boolean; verbose?: boolean } = {}): Promise<void> {
  const spinner = ora('Creating pull request...').start();

  try {
    const CommitAgent = await getCommitAgent();
    const agent = new CommitAgent({
      apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
      verbose: options.verbose,
    });

    const result = await agent.createPR({
      title: options.title,
      body: options.body,
      base: options.base,
      draft: options.draft,
    });

    if (!result.success) {
      spinner.fail(chalk.red('PR creation failed'));
      console.error(chalk.red(`\nError: ${result.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Pull request created'));
    if (result.url) {
      console.log(chalk.cyan(`\n${result.url}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('PR creation failed'));
    throw error;
  }
}

/**
 * Register commit commands with the CLI program
 */
export function registerCommitCommands(program: Command): void {
  const commitCmd = program
    .command('commit')
    .description('AI-powered git commit workflow');

  commitCmd
    .command('status')
    .alias('s')
    .description('Show git status with risk assessment')
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (options) => {
      try {
        await commitStatusCommand(options);
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });

  commitCmd
    .command('generate')
    .alias('gen')
    .description('Generate commit message from staged changes')
    .option('--unstaged', 'Include unstaged changes', false)
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (options) => {
      try {
        await commitGenerateCommand({
          staged: !options.unstaged,
          verbose: options.verbose,
        });
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });

  commitCmd
    .command('create')
    .alias('c')
    .description('Create commit with AI-generated message')
    .option('-a, --all', 'Stage all changes', false)
    .option('-m, --message <msg>', 'Override AI-generated message')
    .option('-p, --push', 'Push after commit', false)
    .option('--pr', 'Create PR after push', false)
    .option('--dry-run', 'Preview without committing', false)
    .option('--amend', 'Amend previous commit', false)
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (options) => {
      try {
        await commitCreateCommand(options);
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });

  commitCmd
    .command('push')
    .description('Push to remote')
    .option('-f, --force', 'Force push (dangerous)', false)
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (options) => {
      try {
        await commitPushCommand(options);
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });

  commitCmd
    .command('pr')
    .description('Create pull request')
    .option('-t, --title <title>', 'PR title')
    .option('-b, --body <body>', 'PR body')
    .option('--base <branch>', 'Base branch', 'main')
    .option('-d, --draft', 'Create as draft', false)
    .option('-v, --verbose', 'Show verbose output', false)
    .action(async (options) => {
      try {
        await commitPRCommand(options);
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });

  // Quick alias for common workflow
  program
    .command('c')
    .description('Quick commit (alias for "commit create")')
    .option('-a, --all', 'Stage all changes', false)
    .option('-m, --message <msg>', 'Override AI-generated message')
    .option('-p, --push', 'Push after commit', false)
    .option('--pr', 'Create PR after push', false)
    .action(async (options) => {
      try {
        await commitCreateCommand(options);
      } catch (error) {
        console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
        process.exit(1);
      }
    });
}
