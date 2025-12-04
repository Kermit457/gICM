import { program } from 'commander';
import Enquirer from 'enquirer';
import chalk from 'chalk';

const { Select } = Enquirer as any;
import { printBanner, printSuccessBanner, printErrorBanner, printInfo, VERSION } from './banner.js';
import { detectEnvironments, getEnvironmentChoices, isCodespaces } from './detect.js';
import { runInstallation, getInstallTypeChoices, checkInstallationStatus, type InstallType } from './install.js';
import { writeDevContainerFiles, getCodespacesBadge } from './codespaces.js';

async function main() {
  program
    .name('create-opus67')
    .description('Install OPUS 67 - AI superpowers for any coding environment')
    .version(VERSION);

  program
    .command('install', { isDefault: true })
    .description('Interactive installation wizard')
    .action(async () => {
      await runInteractiveInstall();
    });

  program
    .command('status')
    .description('Check OPUS 67 installation status')
    .action(() => {
      printBanner();
      const status = checkInstallationStatus();

      if (status.installed) {
        console.log(chalk.green('  ✓ OPUS 67 is installed'));
        console.log(chalk.gray(`    Version: ${status.version || 'unknown'}`));
        console.log(chalk.gray(`    Environment: ${status.environment}`));
        console.log(chalk.gray(`    Config: ${status.configPath}`));
      } else {
        console.log(chalk.yellow('  ⚠ OPUS 67 is not installed in this directory'));
        console.log(chalk.gray('    Run: npx create-opus67'));
      }
      console.log();
    });

  program
    .command('update')
    .description('Update OPUS 67 to latest version')
    .action(async () => {
      printBanner();
      const status = checkInstallationStatus();

      if (!status.installed) {
        printErrorBanner('OPUS 67 is not installed. Run: npx create-opus67');
        process.exit(1);
      }

      printInfo(`Current version: ${status.version || 'unknown'}`);
      printInfo(`Latest version: ${VERSION}`);

      if (status.version === VERSION) {
        console.log(chalk.green('\n  ✓ Already up to date!\n'));
        return;
      }

      // Re-run installation with detected environment
      const detection = detectEnvironments();
      const env = detection.environments.find(e => e.id === status.environment);

      if (!env) {
        printErrorBanner('Could not detect environment for update');
        process.exit(1);
      }

      // Prompt for install type
      const typePrompt = new Select({
        name: 'installType',
        message: 'Select installation type:',
        choices: getInstallTypeChoices().map(c => ({
          name: c.value,
          message: `${c.name} ${chalk.gray(c.hint)}`,
        })),
      });

      const installType = await typePrompt.run() as InstallType;
      await runInstallation(env, installType, VERSION);
      printSuccessBanner();
    });

  program
    .command('skills')
    .description('Browse available skills')
    .action(() => {
      printBanner();
      console.log(chalk.cyan('  Available Skill Categories:\n'));

      const categories = [
        { name: 'GRAB Skills', count: 15, desc: 'Visual-first development (react-grab, theme-grab, etc.)' },
        { name: 'Solana Skills', count: 12, desc: 'Blockchain development (token-swap, anchor-interact)' },
        { name: 'Research Skills', count: 10, desc: 'Information gathering (web-search, code-search)' },
        { name: 'Builder Skills', count: 18, desc: 'Code generation and scaffolding' },
        { name: 'DevOps Skills', count: 15, desc: 'CI/CD, deployment, infrastructure' },
        { name: 'Testing Skills', count: 10, desc: 'Test generation and quality assurance' },
        { name: 'Documentation Skills', count: 8, desc: 'API docs, READMEs, guides' },
        { name: 'Security Skills', count: 7, desc: 'Auditing, vulnerability scanning' },
      ];

      for (const cat of categories) {
        console.log(chalk.white(`  ${cat.name} (${cat.count})`));
        console.log(chalk.gray(`    ${cat.desc}\n`));
      }

      console.log(chalk.gray('  Total: 140 skills\n'));
      console.log(chalk.cyan('  For full skill list, visit: https://opus67.dev/skills\n'));
    });

  program
    .command('agents')
    .description('List available agents')
    .action(() => {
      printBanner();
      console.log(chalk.cyan('  Available Agent Categories:\n'));

      const categories = [
        { name: 'Vision Agents', count: 12, desc: 'Grabber, Cloner, Theme Extractor' },
        { name: 'Data Agents', count: 10, desc: 'Deep Researcher, Web Spider, Docs Expert' },
        { name: 'Browser Agents', count: 8, desc: 'Controller, Stagehand, Test Generator' },
        { name: 'Solana Agents', count: 16, desc: 'Jupiter Trader, Anchor Architect, DeFi Analyst' },
        { name: 'Infrastructure Agents', count: 14, desc: 'Repo Master, DB Commander, Container Chief' },
        { name: 'Builder Agents', count: 12, desc: 'Full Stack Builder, API Designer' },
        { name: 'DevOps Agents', count: 10, desc: 'CI/CD Automator, Error Hunter' },
      ];

      for (const cat of categories) {
        console.log(chalk.white(`  ${cat.name} (${cat.count})`));
        console.log(chalk.gray(`    ${cat.desc}\n`));
      }

      console.log(chalk.gray('  Total: 82 agents\n'));
      console.log(chalk.cyan('  For full agent list, visit: https://opus67.dev/agents\n'));
    });

  program
    .command('codespaces')
    .description('Generate GitHub Codespaces configuration')
    .option('-t, --type <type>', 'Installation type (full, solana, frontend, minimal)', 'full')
    .action(async (options) => {
      printBanner();
      console.log(chalk.cyan('  Generating GitHub Codespaces configuration...\n'));

      const installType = options.type as InstallType;

      // Validate install type
      if (!['full', 'solana', 'frontend', 'minimal'].includes(installType)) {
        printErrorBanner(`Invalid install type: ${installType}`);
        process.exit(1);
      }

      try {
        const { devcontainerPath, scriptPath } = writeDevContainerFiles(installType);

        console.log(chalk.green('  ✓ Created .devcontainer/devcontainer.json'));
        console.log(chalk.green('  ✓ Created .devcontainer/post-create.sh'));
        console.log();
        console.log(chalk.gray(`  Config path: ${devcontainerPath}`));
        console.log(chalk.gray(`  Script path: ${scriptPath}`));
        console.log();
        console.log(chalk.cyan('  Next steps:'));
        console.log(chalk.white('    1. Commit the .devcontainer folder to your repo'));
        console.log(chalk.white('    2. Push to GitHub'));
        console.log(chalk.white('    3. Open in Codespaces or click the badge below'));
        console.log();
        console.log(chalk.gray('  Add this badge to your README.md:'));
        console.log();
        console.log(chalk.white(`    ${getCodespacesBadge()}`));
        console.log();
      } catch (error) {
        printErrorBanner((error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('gitpod')
    .description('Generate Gitpod configuration')
    .option('-t, --type <type>', 'Installation type (full, solana, frontend, minimal)', 'full')
    .action(async (options) => {
      printBanner();
      console.log(chalk.cyan('  Generating Gitpod configuration...\n'));

      const installType = options.type as InstallType;

      // Validate install type
      if (!['full', 'solana', 'frontend', 'minimal'].includes(installType)) {
        printErrorBanner(`Invalid install type: ${installType}`);
        process.exit(1);
      }

      try {
        // Generate .gitpod.yml
        const gitpodConfig = generateGitpodConfig(installType);
        const fs = await import('fs');
        fs.writeFileSync('.gitpod.yml', gitpodConfig, 'utf-8');

        console.log(chalk.green('  ✓ Created .gitpod.yml'));
        console.log();
        console.log(chalk.cyan('  Next steps:'));
        console.log(chalk.white('    1. Commit .gitpod.yml to your repo'));
        console.log(chalk.white('    2. Push to GitHub/GitLab/Bitbucket'));
        console.log(chalk.white('    3. Open with Gitpod'));
        console.log();
        console.log(chalk.gray('  Add this badge to your README.md:'));
        console.log();
        console.log(chalk.white('    [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#<your-repo-url>)'));
        console.log();
      } catch (error) {
        printErrorBanner((error as Error).message);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

function generateGitpodConfig(installType: InstallType): string {
  const tasks = [
    {
      name: 'OPUS 67 Setup',
      init: `npx create-opus67@latest --type ${installType} --env gitpod --yes && npm install`,
    },
  ];

  if (installType === 'solana' || installType === 'full') {
    tasks.unshift({
      name: 'Solana Setup',
      init: 'sh -c "$(curl -sSfL https://release.solana.com/stable/install)"',
    });
  }

  const config = {
    image: installType === 'solana' || installType === 'full'
      ? 'gitpod/workspace-rust'
      : 'gitpod/workspace-node',
    tasks,
    vscode: {
      extensions: [
        'bradlc.vscode-tailwindcss',
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode',
        ...(installType === 'solana' || installType === 'full'
          ? ['rust-lang.rust-analyzer', 'serayuzgur.crates']
          : []),
      ],
    },
    ports: [
      { port: 3000, onOpen: 'open-preview' },
      { port: 5173, onOpen: 'open-preview' },
      { port: 8080, onOpen: 'ignore' },
    ],
  };

  // Convert to YAML manually (simple structure)
  let yaml = `# OPUS 67 Gitpod Configuration
# Generated by create-opus67

image: ${config.image}

tasks:
`;

  for (const task of tasks) {
    yaml += `  - name: ${task.name}
    init: ${task.init}
`;
  }

  yaml += `
vscode:
  extensions:
`;
  for (const ext of config.vscode.extensions) {
    yaml += `    - ${ext}
`;
  }

  yaml += `
ports:
`;
  for (const port of config.ports) {
    yaml += `  - port: ${port.port}
    onOpen: ${port.onOpen}
`;
  }

  return yaml;
}

async function runInteractiveInstall() {
  printBanner();

  // Check if already installed
  const status = checkInstallationStatus();
  if (status.installed) {
    console.log(chalk.yellow(`  ⚠ OPUS 67 v${status.version} is already installed`));
    console.log(chalk.gray(`    Environment: ${status.environment}`));
    console.log(chalk.gray(`    Config: ${status.configPath}\n`));

    const confirmPrompt = new Select({
      name: 'confirm',
      message: 'Would you like to reinstall?',
      choices: [
        { name: 'yes', message: 'Yes, reinstall' },
        { name: 'no', message: 'No, cancel' },
      ],
    });

    const confirm = await confirmPrompt.run();
    if (confirm === 'no') {
      console.log(chalk.gray('\n  Installation cancelled.\n'));
      return;
    }
    console.log();
  }

  // Detect environments
  const detection = detectEnvironments();
  const choices = getEnvironmentChoices(detection);

  // Select environment
  const envPrompt = new Select({
    name: 'environment',
    message: 'Select your environment:',
    choices: choices.map(c => ({
      name: c.value,
      message: c.hint ? `${c.name} ${chalk.gray(c.hint)}` : c.name,
    })),
    initial: detection.recommended?.id,
  });

  const envId = await envPrompt.run() as string;
  const selectedEnv = detection.environments.find(e => e.id === envId)!;

  // Select install type
  const typePrompt = new Select({
    name: 'installType',
    message: 'Select installation type:',
    choices: getInstallTypeChoices().map(c => ({
      name: c.value,
      message: `${c.name} ${chalk.gray(c.hint)}`,
    })),
  });

  const installType = await typePrompt.run() as InstallType;

  // Run installation
  try {
    await runInstallation(selectedEnv, installType, VERSION);
    printSuccessBanner();
  } catch (error) {
    printErrorBanner((error as Error).message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
