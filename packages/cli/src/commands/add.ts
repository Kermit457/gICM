import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { fetchRegistry, fetchItem, fetchItemFiles, resolveDependencies } from '../utils/registry.js';
import { ensureClaudeDir, writeFile, getInstalledItems, saveInstalledItems, getInstallPath } from '../utils/files.js';
import type { RegistryItem } from '../utils/types.js';

interface AddOptions {
  yes?: boolean;
  noDeps?: boolean;
}

export async function addCommand(itemRef: string, options: AddOptions) {
  const spinner = ora();

  try {
    // Parse item reference (e.g., "agent/hardhat-deployment-specialist")
    const slug = itemRef.includes('/') ? itemRef.split('/')[1] : itemRef;

    spinner.start('Fetching item from registry...');
    const item = await fetchItem(slug);
    spinner.succeed(`Found: ${chalk.cyan(item.name)}`);

    console.log(chalk.gray(item.description));
    console.log();

    // Check dependencies
    let itemsToInstall: RegistryItem[] = [item];

    if (!options.noDeps && item.dependencies.length > 0) {
      spinner.start('Resolving dependencies...');
      const registry = await fetchRegistry();
      itemsToInstall = resolveDependencies(item, registry);
      spinner.succeed(`Resolved ${itemsToInstall.length} items (including dependencies)`);

      if (itemsToInstall.length > 1) {
        console.log(chalk.yellow('Dependencies:'));
        itemsToInstall.slice(1).forEach(dep => {
          console.log(`  • ${dep.name} ${chalk.gray(`(${dep.slug})`)}`);
        });
        console.log();
      }
    }

    // Confirm installation
    if (!options.yes) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: `Install ${itemsToInstall.length} item(s)?`,
        initial: true
      });

      if (!response.confirm) {
        console.log(chalk.yellow('Installation cancelled'));
        return;
      }
    }

    // Install items
    const claudeDir = await ensureClaudeDir();
    const installed = await getInstalledItems();

    for (const itemToInstall of itemsToInstall) {
      spinner.start(`Installing ${itemToInstall.name}...`);

      // Fetch files
      const files = await fetchItemFiles(itemToInstall.slug);

      // Write files
      const writtenFiles: string[] = [];
      for (const file of files) {
        const targetPath = getInstallPath(itemToInstall.kind, file.path, claudeDir);
        await writeFile(targetPath, file.content);
        writtenFiles.push(targetPath);
      }

      // Update installed items
      const installedItem = {
        id: itemToInstall.id,
        slug: itemToInstall.slug,
        kind: itemToInstall.kind,
        name: itemToInstall.name,
        installedAt: new Date().toISOString(),
        files: writtenFiles
      };

      // Remove old version if exists
      const existingIndex = installed.findIndex(i => i.id === itemToInstall.id);
      if (existingIndex >= 0) {
        installed[existingIndex] = installedItem;
      } else {
        installed.push(installedItem);
      }

      spinner.succeed(`Installed ${chalk.green(itemToInstall.name)}`);
    }

    // Save config
    await saveInstalledItems(installed);

    console.log();
    console.log(chalk.green('✓ Installation complete!'));
    console.log();
    console.log(chalk.bold('Next steps:'));
    console.log(`  • Files installed to: ${chalk.cyan(claudeDir)}`);

    if (item.envKeys && item.envKeys.length > 0) {
      console.log(`  • Configure environment variables: ${chalk.yellow(item.envKeys.join(', '))}`);
    }

    if (item.setup) {
      console.log(`  • Setup: ${chalk.gray(item.setup)}`);
    }

    console.log(`  • View documentation: ${chalk.blue(`https://gicm.dev/items/${item.slug}`)}`);

  } catch (error) {
    spinner.fail('Installation failed');
    throw error;
  }
}
