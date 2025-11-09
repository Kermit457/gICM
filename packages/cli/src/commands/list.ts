import chalk from 'chalk';
import { getInstalledItems } from '../utils/files.js';

interface ListOptions {
  kind?: string;
}

export async function listCommand(options: ListOptions) {
  const installed = await getInstalledItems();

  if (installed.length === 0) {
    console.log(chalk.yellow('No items installed'));
    console.log();
    console.log('Install items with:', chalk.cyan('gicm add <item>'));
    return;
  }

  let filtered = installed;
  if (options.kind) {
    filtered = installed.filter(item => item.kind === options.kind);
  }

  if (filtered.length === 0) {
    console.log(chalk.yellow(`No ${options.kind}s installed`));
    return;
  }

  console.log(chalk.bold(`Installed items (${filtered.length}):`));
  console.log();

  // Group by kind
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.kind]) acc[item.kind] = [];
    acc[item.kind].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(grouped).forEach(([kind, items]) => {
    const itemsList = items as any[];
    console.log(chalk.cyan.bold(`${kind.toUpperCase()}S (${itemsList.length}):`));
    itemsList.forEach((item: any) => {
      const installedDate = new Date(item.installedAt).toLocaleDateString();
      console.log(`  • ${chalk.white(item.name)} ${chalk.gray(`(${item.slug})`)}`);
      console.log(`    ${chalk.gray(`Installed: ${installedDate}`)}`);
    });
    console.log();
  });

  console.log(chalk.gray(`Total: ${filtered.length} items`));
}
