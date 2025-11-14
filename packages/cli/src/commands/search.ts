/**
 * gICM CLI - Search Command
 * Search for agents, skills, commands, MCPs, and settings in the marketplace
 */

import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import Table from 'cli-table3';

interface SearchOptions {
  apiUrl: string;
  kind?: 'agent' | 'skill' | 'command' | 'mcp' | 'setting';
  category?: string;
  tags?: string[];
  verbose?: boolean;
}

interface RegistryItem {
  id: string;
  kind: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  installs?: number;
  remixes?: number;
}

export async function searchCommand(query: string, options: SearchOptions) {
  const spinner = ora('Searching marketplace...').start();

  try {
    // Fetch registry from API
    const response = await axios.get(`${options.apiUrl}/registry`);
    const registry: RegistryItem[] = response.data;

    // Filter by kind if specified
    let filteredItems = registry;
    if (options.kind) {
      filteredItems = filteredItems.filter((item) => item.kind === options.kind);
    }

    // Filter by category if specified
    if (options.category) {
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === options.category!.toLowerCase()
      );
    }

    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
      filteredItems = filteredItems.filter((item) =>
        options.tags!.some((tag) =>
          item.tags.some((itemTag) => itemTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Search by query string (name, description, tags)
    const searchResults = filteredItems.filter((item) => {
      const lowerQuery = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        item.slug.toLowerCase().includes(lowerQuery)
      );
    });

    spinner.succeed(
      `Found ${chalk.green(searchResults.length)} result${searchResults.length !== 1 ? 's' : ''} for "${query}"`
    );

    if (searchResults.length === 0) {
      console.log(
        chalk.yellow('\nNo results found. Try:\n') +
          chalk.gray('  - Using different keywords\n') +
          chalk.gray('  - Removing filters (--kind, --category, --tags)\n') +
          chalk.gray('  - Running "gicm list" to see all available items')
      );
      return;
    }

    // Display results in a table
    const table = new Table({
      head: [
        chalk.cyan('Type'),
        chalk.cyan('Name'),
        chalk.cyan('Category'),
        chalk.cyan('Description'),
        chalk.cyan('Installs'),
      ],
      colWidths: [10, 25, 20, 40, 10],
      wordWrap: true,
    });

    searchResults.forEach((item) => {
      table.push([
        item.kind,
        item.name,
        item.category,
        item.description.substring(0, 100) + (item.description.length > 100 ? '...' : ''),
        item.installs?.toString() || '0',
      ]);
    });

    console.log('\n' + table.toString());

    // Show install command example
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      console.log(
        chalk.dim('\nTo install:\n') +
          chalk.white(`  gicm add ${firstResult.kind}/${firstResult.slug}\n`)
      );
    }

    // Show verbose info if requested
    if (options.verbose) {
      console.log(chalk.dim('\nSearch filters applied:'));
      if (options.kind) console.log(chalk.gray(`  Kind: ${options.kind}`));
      if (options.category) console.log(chalk.gray(`  Category: ${options.category}`));
      if (options.tags) console.log(chalk.gray(`  Tags: ${options.tags.join(', ')}`));
    }
  } catch (error) {
    spinner.fail('Search failed');
    throw new Error(`Failed to search marketplace: ${(error as Error).message}`);
  }
}
