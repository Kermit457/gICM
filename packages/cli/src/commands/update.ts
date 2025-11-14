/**
 * gICM CLI - Update Command
 * Update CLI to latest version and refresh registry cache
 */

import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

interface UpdateOptions {
  registry?: boolean;
  cli?: boolean;
  verbose?: boolean;
}

export async function updateCommand(options: UpdateOptions) {
  console.log(chalk.bold('\n🔄 gICM Update\n'));

  const updateCli = options.cli || (!options.registry && !options.cli);
  const updateRegistry = options.registry || (!options.registry && !options.cli);

  // 1. Update CLI package
  if (updateCli) {
    const cliSpinner = ora('Checking for CLI updates...').start();

    try {
      // Get current version
      const packageJsonPath = path.join(__dirname, '../../../package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      const currentVersion = packageJson.version;

      cliSpinner.text = `Current version: ${currentVersion}`;

      // Check npm for latest version
      try {
        const npmView = execSync('npm view @gicm/cli version', {
          encoding: 'utf-8',
          stdio: 'pipe',
        }).trim();

        const latestVersion = npmView;

        if (latestVersion === currentVersion) {
          cliSpinner.succeed(`CLI is up to date (v${currentVersion})`);
        } else {
          cliSpinner.info(
            `Update available: v${currentVersion} → v${latestVersion}`
          );

          const updateSpinner = ora('Updating CLI package...').start();
          try {
            // Update package globally
            execSync('npm install -g @gicm/cli@latest', {
              stdio: options.verbose ? 'inherit' : 'pipe',
            });

            updateSpinner.succeed(
              `Updated CLI to v${latestVersion}`
            );
          } catch (updateError) {
            updateSpinner.fail('Failed to update CLI');
            console.log(
              chalk.yellow('\n💡 Try updating manually:\n') +
                chalk.white('   npm install -g @gicm/cli@latest\n')
            );
          }
        }
      } catch (npmError) {
        cliSpinner.warn('Could not check npm registry');
        console.log(
          chalk.dim('   Run manually: npm view @gicm/cli version')
        );
      }
    } catch (error) {
      cliSpinner.fail('CLI update check failed');
      console.log(chalk.red(`   ${(error as Error).message}`));
    }
  }

  // 2. Update registry cache
  if (updateRegistry) {
    const registrySpinner = ora('Refreshing registry cache...').start();

    try {
      const cacheDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.gicm', 'cache');
      await fs.ensureDir(cacheDir);

      const registryCachePath = path.join(cacheDir, 'registry.json');
      const metaCachePath = path.join(cacheDir, 'registry-meta.json');

      // Fetch latest registry
      const response = await axios.get('https://gicm-marketplace.vercel.app/api/registry', {
        timeout: 10000,
      });

      // Save registry to cache
      await fs.writeJson(registryCachePath, response.data, { spaces: 2 });

      // Save metadata
      const meta = {
        updatedAt: new Date().toISOString(),
        itemCount: response.data.length,
        version: '1.0.0',
      };
      await fs.writeJson(metaCachePath, meta, { spaces: 2 });

      registrySpinner.succeed(
        `Registry cache updated (${response.data.length} items)`
      );

      if (options.verbose) {
        console.log(chalk.dim(`   Cache location: ${registryCachePath}`));
        console.log(chalk.dim(`   Last updated: ${meta.updatedAt}`));
      }
    } catch (error) {
      registrySpinner.fail('Failed to update registry cache');
      console.log(chalk.red(`   ${(error as Error).message}`));
    }
  }

  // 3. Check for breaking changes or important notices
  const noticesSpinner = ora('Checking for important notices...').start();
  try {
    const response = await axios.get('https://gicm-marketplace.vercel.app/api/notices', {
      timeout: 5000,
    });

    if (response.data && response.data.length > 0) {
      noticesSpinner.succeed('Found important notices');

      console.log(chalk.bold('\n📢 Important Notices:\n'));

      response.data.forEach((notice: any, index: number) => {
        const icon =
          notice.severity === 'critical'
            ? chalk.red('❗')
            : notice.severity === 'warning'
            ? chalk.yellow('⚠️')
            : chalk.blue('ℹ️');

        console.log(
          `${icon} ${chalk.bold(notice.title)} ${chalk.dim(`(${notice.date})`)}`
        );
        console.log(chalk.gray(`   ${notice.message}\n`));
      });
    } else {
      noticesSpinner.succeed('No new notices');
    }
  } catch (error) {
    // Notices endpoint might not exist yet, fail silently
    noticesSpinner.info('No notices available');
  }

  // Success summary
  console.log(chalk.green('\n✅ Update complete!\n'));

  if (options.verbose) {
    console.log(chalk.dim('💡 Tips:'));
    console.log(chalk.gray('   - Run "gicm health" to verify your setup'));
    console.log(chalk.gray('   - Run "gicm list" to see all available items'));
    console.log(chalk.gray('   - Visit https://gicm-marketplace.vercel.app for docs\n'));
  }
}
