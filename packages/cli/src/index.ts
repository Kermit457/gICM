import { Command } from 'commander';
import chalk from 'chalk';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { removeCommand } from './commands/remove.js';
import { createSettingsCommand } from './commands/settings.js';

const program = new Command();

program
  .name('gicm')
  .description('Install agents, skills, commands, and MCPs from gICM marketplace')
  .version('0.1.0');

// Add command - Install an item
program
  .command('add <item>')
  .description('Install an agent, skill, command, or MCP')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--no-deps', 'Skip dependency installation')
  .action(addCommand);

// List command - Show installed items
program
  .command('list')
  .description('List all installed items')
  .option('-k, --kind <kind>', 'Filter by kind (agent, skill, command, mcp)')
  .action(listCommand);

// Search command - Search marketplace
program
  .command('search <query>')
  .description('Search the gICM marketplace')
  .option('-k, --kind <kind>', 'Filter by kind (agent, skill, command, mcp)')
  .option('-t, --tag <tag>', 'Filter by tag')
  .action(searchCommand);

// Remove command - Uninstall an item
program
  .command('remove <item>')
  .description('Remove an installed item')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(removeCommand);

// Settings command - Manage Claude Code settings
program.addCommand(createSettingsCommand());

export async function run() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
