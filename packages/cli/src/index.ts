#!/usr/bin/env node

/**
 * gICM CLI - Official command-line interface for the gICM marketplace
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { addCommand } from './commands/add';

const program = new Command();

program
  .name('gicm')
  .description('Official CLI for gICM marketplace - Install agents, skills, commands, MCPs, and settings')
  .version('1.0.0');

program
  .command('add <items...>')
  .description('Install one or more items from the marketplace')
  .option('--api-url <url>', 'Custom API URL (for testing)', 'https://gicm-marketplace.vercel.app/api')
  .option('-y, --yes', 'Skip confirmation prompt', false)
  .option('-v, --verbose', 'Show verbose output', false)
  .action(async (items: string[], options) => {
    try {
      await addCommand(items, {
        apiUrl: options.apiUrl,
        skipConfirm: options.yes,
        verbose: options.verbose,
      });
    } catch (error) {
      console.error(chalk.red(`\n✗ ${(error as Error).message}\n`));
      process.exit(1);
    }
  });

// Show help if no arguments
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments
program.parse(process.argv);
