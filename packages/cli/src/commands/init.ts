/**
 * gicm init - Initialize a project for gICM
 *
 * Detects project type, creates .gicm/ directory, and generates config
 */

import chalk from 'chalk';
import ora from 'ora';
import { detectProject, getProjectTypeLabel } from '../lib/detector';
import { initializeConfig, isInitialized, loadConfig } from '../lib/config';

interface InitOptions {
  force?: boolean;
  verbose?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold('\n🚀 gICM Init\n'));

  // Check if already initialized
  if (!options.force && await isInitialized(cwd)) {
    const existingConfig = await loadConfig(cwd);
    console.log(chalk.yellow('⚠ Project already initialized.'));
    if (existingConfig) {
      console.log(chalk.gray(`  Project: ${existingConfig.project.name}`));
      console.log(chalk.gray(`  Type: ${existingConfig.project.type}`));
    }
    console.log(chalk.gray('\n  Use --force to reinitialize.\n'));
    return;
  }

  // Detect project
  const spinner = ora('Detecting project type...').start();
  const projectInfo = await detectProject(cwd);
  spinner.succeed(`Detected: ${chalk.cyan(getProjectTypeLabel(projectInfo))}`);

  if (options.verbose) {
    console.log(chalk.gray('\n  Project details:'));
    console.log(chalk.gray(`    Name: ${projectInfo.name}`));
    console.log(chalk.gray(`    Type: ${projectInfo.type}`));
    console.log(chalk.gray(`    Language: ${projectInfo.language}`));
    console.log(chalk.gray(`    Frameworks: ${projectInfo.frameworks.join(', ') || 'None'}`));
    console.log(chalk.gray(`    Package Manager: ${projectInfo.packageManager || 'Unknown'}`));
    console.log(chalk.gray(`    Git: ${projectInfo.hasGit ? 'Yes' : 'No'}`));
  }

  // Initialize .gicm directory and config
  const initSpinner = ora('Creating .gicm/ directory...').start();
  try {
    const config = await initializeConfig(projectInfo, cwd);
    initSpinner.succeed('Created .gicm/config.json');

    // Summary
    console.log(chalk.green('\n✓ Project initialized successfully!\n'));
    console.log(chalk.bold('Configuration:'));
    console.log(chalk.gray(`  Project: ${config.project.name}`));
    console.log(chalk.gray(`  Type: ${config.project.type} (${config.project.language})`));
    console.log(chalk.gray(`  Autonomy Level: ${config.autonomy.level} (bounded)`));
    console.log(chalk.gray(`  MCP Port: ${config.mcp.port}`));

    // Next steps
    console.log(chalk.bold('\n📋 Next steps:\n'));
    console.log(chalk.white('  1. Index your codebase:'));
    console.log(chalk.cyan('     gicm index\n'));
    console.log(chalk.white('  2. Set up Claude Code integration:'));
    console.log(chalk.cyan('     gicm setup-claude\n'));
    console.log(chalk.white('  3. Start using gICM capabilities:'));
    console.log(chalk.cyan('     gicm search "your task"'));
    console.log('');

  } catch (error) {
    initSpinner.fail('Failed to initialize');
    throw error;
  }
}
