/**
 * gICM CLI - List Command
 * List all available items in the marketplace
 */

import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import Table from 'cli-table3';

interface ListOptions {
  apiUrl: string;
  kind?: 'agent' | 'skill' | 'command' | 'mcp' | 'setting';
  category?: string;
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

export async function listCommand(options: ListOptions) {
  const spinner = ora('Fetching marketplace catalog...').start();

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

    spinner.succeed(
      `Found ${chalk.green(filteredItems.length)} item${filteredItems.length !== 1 ? 's' : ''}`
    );

    // Group by kind
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.kind]) acc[item.kind] = [];
      acc[item.kind].push(item);
      return acc;
    }, {} as Record<string, RegistryItem[]>);

    // Display summary
    console.log(chalk.bold('\n📦 gICM Marketplace Catalog\n'));

    Object.entries(grouped).forEach(([kind, items]) => {
      const kindLabel =
        kind === 'agent'
          ? 'Agents'
          : kind === 'skill'
          ? 'Skills'
          : kind === 'command'
          ? 'Commands'
          : kind === 'mcp'
          ? 'MCPs'
          : 'Settings';

      console.log(chalk.cyan.bold(`\n${kindLabel} (${items.length}):`));

      if (options.verbose) {
        // Detailed table view
        const table = new Table({
          head: [chalk.cyan('Name'), chalk.cyan('Category'), chalk.cyan('Installs')],
          colWidths: [30, 25, 10],
        });

        items.forEach((item) => {
          table.push([item.name, item.category, item.installs?.toString() || '0']);
        });

        console.log(table.toString());
      } else {
        // Compact list view
        items.forEach((item, index) => {
          const prefix = index === items.length - 1 ? '└─' : '├─';
          console.log(
            `  ${chalk.gray(prefix)} ${chalk.white(item.name)} ${chalk.dim(`(${item.category})`)}`
          );
        });
      }
    });

    // Show usage examples
    console.log(chalk.dim('\n\nUsage examples:'));
    console.log(chalk.gray('  gicm add agent/icm-analyst'));
    console.log(chalk.gray('  gicm search "whale tracker"'));
    console.log(chalk.gray('  gicm list --kind=agent --verbose\n'));

    // Show stats summary
    const stats = {
      totalAgents: grouped['agent']?.length || 0,
      totalSkills: grouped['skill']?.length || 0,
      totalCommands: grouped['command']?.length || 0,
      totalMCPs: grouped['mcp']?.length || 0,
      totalSettings: grouped['setting']?.length || 0,
    };

    const totalItems =
      stats.totalAgents +
      stats.totalSkills +
      stats.totalCommands +
      stats.totalMCPs +
      stats.totalSettings;

    console.log(
      chalk.bold(`\n📊 Total: ${totalItems} items`) +
        chalk.dim(
          ` (${stats.totalAgents} agents, ${stats.totalSkills} skills, ${stats.totalCommands} commands, ${stats.totalMCPs} MCPs, ${stats.totalSettings} settings)\n`
        )
    );
  } catch (error) {
    spinner.fail('Failed to fetch catalog');
    throw new Error(`Failed to fetch marketplace catalog: ${(error as Error).message}`);
  }
}
