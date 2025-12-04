import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { InstallType } from './install.js';

export interface DevContainerConfig {
  name: string;
  image: string;
  features: Record<string, unknown>;
  postCreateCommand: string;
  customizations: {
    vscode?: {
      extensions: string[];
      settings: Record<string, unknown>;
    };
    codespaces?: {
      openFiles: string[];
    };
  };
  forwardPorts: number[];
  remoteUser: string;
}

export function isCodespaces(): boolean {
  return process.env.CODESPACES === 'true' || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN !== undefined;
}

export function generateDevContainerConfig(installType: InstallType): DevContainerConfig {
  const baseConfig: DevContainerConfig = {
    name: `OPUS 67 - ${installType.charAt(0).toUpperCase() + installType.slice(1)} Dev Environment`,
    image: 'mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm',
    features: {
      'ghcr.io/devcontainers/features/github-cli:1': {},
      'ghcr.io/devcontainers/features/common-utils:2': {
        installZsh: true,
        configureZshAsDefaultShell: true,
      },
    },
    postCreateCommand: `npx create-opus67@latest --type ${installType} --env codespaces --yes && npm install`,
    customizations: {
      vscode: {
        extensions: [
          'bradlc.vscode-tailwindcss',
          'dbaeumer.vscode-eslint',
          'esbenp.prettier-vscode',
          'prisma.prisma',
          'ms-azuretools.vscode-docker',
        ],
        settings: {
          'editor.formatOnSave': true,
          'editor.defaultFormatter': 'esbenp.prettier-vscode',
          'typescript.preferences.importModuleSpecifier': 'relative',
        },
      },
      codespaces: {
        openFiles: ['CLAUDE.md'],
      },
    },
    forwardPorts: [3000, 5173, 8080],
    remoteUser: 'node',
  };

  // Add install-type-specific features
  if (installType === 'solana' || installType === 'full') {
    baseConfig.features['ghcr.io/devcontainers/features/rust:1'] = {
      version: 'stable',
      profile: 'default',
    };
    baseConfig.postCreateCommand = `sh -c "curl -sSfL https://release.solana.com/stable/install | sh && export PATH=\\"/home/node/.local/share/solana/install/active_release/bin:\\$PATH\\" && ${baseConfig.postCreateCommand}"`;
    baseConfig.customizations.vscode!.extensions.push(
      'rust-lang.rust-analyzer',
      'serayuzgur.crates',
      'tamasfe.even-better-toml'
    );
  }

  if (installType === 'frontend' || installType === 'full') {
    baseConfig.customizations.vscode!.extensions.push(
      'styled-components.vscode-styled-components',
      'formulahendry.auto-rename-tag',
      'steoates.autoimport'
    );
  }

  return baseConfig;
}

export function generatePostCreateScript(installType: InstallType): string {
  const lines = [
    '#!/bin/bash',
    'set -e',
    '',
    '# OPUS 67 Codespaces Setup Script',
    `echo "Setting up OPUS 67 (${installType} installation)..."`,
    '',
  ];

  if (installType === 'solana' || installType === 'full') {
    lines.push(
      '# Install Solana CLI',
      'if ! command -v solana &> /dev/null; then',
      '  echo "Installing Solana CLI..."',
      '  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"',
      '  export PATH="/home/node/.local/share/solana/install/active_release/bin:$PATH"',
      'fi',
      '',
      '# Install Anchor',
      'if ! command -v anchor &> /dev/null; then',
      '  echo "Installing Anchor..."',
      '  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force',
      '  avm install latest',
      '  avm use latest',
      'fi',
      ''
    );
  }

  lines.push(
    '# Install OPUS 67',
    `npx create-opus67@latest --type ${installType} --env codespaces --yes`,
    '',
    '# Install project dependencies',
    'if [ -f "package.json" ]; then',
    '  npm install',
    'fi',
    '',
    'echo "OPUS 67 setup complete!"',
    'echo "You now have access to 140 skills, 82 MCPs, 30 modes, and 84 agents."',
    ''
  );

  return lines.join('\n');
}

export function writeDevContainerFiles(installType: InstallType): {
  devcontainerPath: string;
  scriptPath: string;
} {
  const devcontainerDir = join(process.cwd(), '.devcontainer');

  // Create directory if it doesn't exist
  if (!existsSync(devcontainerDir)) {
    mkdirSync(devcontainerDir, { recursive: true });
  }

  // Write devcontainer.json
  const config = generateDevContainerConfig(installType);
  const devcontainerPath = join(devcontainerDir, 'devcontainer.json');
  writeFileSync(devcontainerPath, JSON.stringify(config, null, 2), 'utf-8');

  // Write post-create script
  const script = generatePostCreateScript(installType);
  const scriptPath = join(devcontainerDir, 'post-create.sh');
  writeFileSync(scriptPath, script, 'utf-8');

  return { devcontainerPath, scriptPath };
}

// GitHub Codespaces badge markdown
export function getCodespacesBadge(repoUrl?: string): string {
  if (!repoUrl) {
    return '[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new)';
  }

  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  if (!match) {
    return '[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new)';
  }

  const repo = match[1].replace(/\.git$/, '');
  return `[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/${repo})`;
}
