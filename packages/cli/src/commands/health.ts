/**
 * gICM CLI - Health Command
 * Check health status of CLI and API connectivity
 */

import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

interface HealthOptions {
  apiUrl: string;
  verbose?: boolean;
}

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

export async function healthCommand(options: HealthOptions) {
  console.log(chalk.bold('\n🏥 gICM CLI Health Check\n'));

  const checks: HealthCheck[] = [];

  // 1. Check CLI installation
  const cliCheck = ora('Checking CLI installation...').start();
  try {
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageExists = await fs.pathExists(packageJsonPath);

    if (packageExists) {
      const packageJson = await fs.readJson(packageJsonPath);
      cliCheck.succeed();
      checks.push({
        name: 'CLI Installation',
        status: 'ok',
        message: `v${packageJson.version} installed`,
        details: packageJson.name,
      });
    } else {
      cliCheck.warn();
      checks.push({
        name: 'CLI Installation',
        status: 'warning',
        message: 'Could not locate package.json',
      });
    }
  } catch (error) {
    cliCheck.fail();
    checks.push({
      name: 'CLI Installation',
      status: 'error',
      message: (error as Error).message,
    });
  }

  // 2. Check API connectivity
  const apiCheck = ora('Checking API connectivity...').start();
  try {
    const startTime = Date.now();
    const response = await axios.get(`${options.apiUrl}/health`, {
      timeout: 5000,
    });
    const latency = Date.now() - startTime;

    if (response.status === 200) {
      apiCheck.succeed();
      checks.push({
        name: 'API Connectivity',
        status: 'ok',
        message: `${options.apiUrl} reachable`,
        details: `${latency}ms latency`,
      });
    } else {
      apiCheck.warn();
      checks.push({
        name: 'API Connectivity',
        status: 'warning',
        message: `Unexpected status code: ${response.status}`,
      });
    }
  } catch (error) {
    apiCheck.fail();
    checks.push({
      name: 'API Connectivity',
      status: 'error',
      message: 'Cannot reach API server',
      details: (error as Error).message,
    });
  }

  // 3. Check registry availability
  const registryCheck = ora('Checking registry availability...').start();
  try {
    const response = await axios.get(`${options.apiUrl}/registry`, {
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      registryCheck.succeed();
      checks.push({
        name: 'Registry Availability',
        status: 'ok',
        message: `${response.data.length} items available`,
      });
    } else {
      registryCheck.warn();
      checks.push({
        name: 'Registry Availability',
        status: 'warning',
        message: 'Registry is empty or invalid',
      });
    }
  } catch (error) {
    registryCheck.fail();
    checks.push({
      name: 'Registry Availability',
      status: 'error',
      message: 'Cannot fetch registry',
      details: (error as Error).message,
    });
  }

  // 4. Check .claude directory
  const claudeCheck = ora('Checking .claude directory...').start();
  try {
    const claudeDir = path.join(process.cwd(), '.claude');
    const claudeDirExists = await fs.pathExists(claudeDir);

    if (claudeDirExists) {
      const agentsDir = path.join(claudeDir, 'agents');
      const skillsDir = path.join(claudeDir, 'skills');
      const commandsDir = path.join(claudeDir, 'commands');

      const agentsExist = await fs.pathExists(agentsDir);
      const skillsExist = await fs.pathExists(skillsDir);
      const commandsExist = await fs.pathExists(commandsDir);

      claudeCheck.succeed();
      checks.push({
        name: '.claude Directory',
        status: 'ok',
        message: 'Found at project root',
        details: `agents: ${agentsExist ? '✓' : '✗'}, skills: ${skillsExist ? '✓' : '✗'}, commands: ${commandsExist ? '✓' : '✗'}`,
      });
    } else {
      claudeCheck.warn();
      checks.push({
        name: '.claude Directory',
        status: 'warning',
        message: 'Not found in current directory',
        details: 'Run this command from a Claude Code project',
      });
    }
  } catch (error) {
    claudeCheck.fail();
    checks.push({
      name: '.claude Directory',
      status: 'error',
      message: (error as Error).message,
    });
  }

  // 5. Check Node.js version
  const nodeCheck = ora('Checking Node.js version...').start();
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

    if (majorVersion >= 18) {
      nodeCheck.succeed();
      checks.push({
        name: 'Node.js Version',
        status: 'ok',
        message: `${nodeVersion} (compatible)`,
      });
    } else {
      nodeCheck.warn();
      checks.push({
        name: 'Node.js Version',
        status: 'warning',
        message: `${nodeVersion} (recommend >=18.0.0)`,
      });
    }
  } catch (error) {
    nodeCheck.fail();
    checks.push({
      name: 'Node.js Version',
      status: 'error',
      message: (error as Error).message,
    });
  }

  // Display results summary
  console.log(chalk.bold('\n📋 Health Check Results:\n'));

  checks.forEach((check) => {
    const icon =
      check.status === 'ok' ? chalk.green('✓') : check.status === 'warning' ? chalk.yellow('⚠') : chalk.red('✗');

    console.log(`${icon} ${chalk.bold(check.name)}: ${check.message}`);

    if (options.verbose && check.details) {
      console.log(chalk.gray(`   ${check.details}`));
    }
  });

  // Overall status
  const errorCount = checks.filter((c) => c.status === 'error').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const okCount = checks.filter((c) => c.status === 'ok').length;

  console.log(
    chalk.bold('\n📊 Summary: ') +
      chalk.green(`${okCount} OK`) +
      chalk.gray(' | ') +
      chalk.yellow(`${warningCount} Warning`) +
      chalk.gray(' | ') +
      chalk.red(`${errorCount} Error`) +
      '\n'
  );

  if (errorCount > 0) {
    console.log(chalk.red('❌ Health check failed. Some critical issues detected.'));
    console.log(
      chalk.yellow('\nTroubleshooting:') +
        chalk.gray('\n  - Check your internet connection') +
        chalk.gray('\n  - Verify API URL is correct') +
        chalk.gray('\n  - Run from a Claude Code project directory\n')
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(chalk.yellow('⚠️  Health check passed with warnings.'));
  } else {
    console.log(chalk.green('✅ All health checks passed!'));
  }
}
