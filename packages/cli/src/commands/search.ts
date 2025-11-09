import chalk from 'chalk';
import ora from 'ora';
import { searchItems } from '../utils/registry.js';

interface SearchOptions {
  kind?: string;
  tag?: string;
}

export async function searchCommand(query: string, options: SearchOptions) {
  const spinner = ora('Searching marketplace...').start();

  try {
    const results = await searchItems(query, {
      kind: options.kind,
      tag: options.tag
    });

    spinner.stop();

    if (results.length === 0) {
      console.log(chalk.yellow('No results found'));
      return;
    }

    console.log(chalk.bold(`Found ${results.length} result(s):`));
    console.log();

    // Group by kind
    const grouped = results.reduce((acc, item) => {
      if (!acc[item.kind]) acc[item.kind] = [];
      acc[item.kind].push(item);
      return acc;
    }, {} as Record<string, typeof results>);

    Object.entries(grouped).forEach(([kind, items]) => {
      console.log(chalk.cyan.bold(`${kind.toUpperCase()}S (${items.length}):`));
      items.forEach(item => {
        console.log(`  • ${chalk.white(item.name)} ${chalk.gray(`(${item.slug})`)}`);
        console.log(`    ${chalk.gray(item.description)}`);

        if (item.tags.length > 0) {
          console.log(`    ${chalk.blue(item.tags.slice(0, 3).join(', '))}`);
        }

        console.log(`    ${chalk.dim(`Install: gicm add ${item.kind}/${item.slug}`)}`);
        console.log();
      });
    });

  } catch (error) {
    spinner.fail('Search failed');
    throw error;
  }
}
