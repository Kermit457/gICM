/**
 * gicm status - Show project and service status
 *
 * Displays indexing stats, service health, and configuration
 */

import chalk from 'chalk';
import axios from 'axios';
import { loadConfig, isInitialized, getGICMDir } from '../lib/config';
import * as fs from 'fs-extra';
import * as path from 'path';

interface StatusOptions {
  verbose?: boolean;
  json?: boolean;
}

interface ServiceHealth {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'unknown';
  latency?: number;
  version?: string;
}

interface ProjectStatus {
  initialized: boolean;
  config?: {
    project: { name: string; type: string; language: string };
    indexing: { enabled: boolean; lastIndexed?: string; fileCount?: number; chunkCount?: number };
    mcp: { port: number; contextEngineUrl: string };
    autonomy: { level: number };
  };
  services: ServiceHealth[];
  capabilities: { installed: number; favorites: number };
}

export async function statusCommand(options: StatusOptions = {}): Promise<void> {
  const cwd = process.cwd();

  if (!options.json) {
    console.log(chalk.bold('\n📊 gICM Status\n'));
  }

  const status: ProjectStatus = {
    initialized: await isInitialized(cwd),
    services: [],
    capabilities: { installed: 0, favorites: 0 },
  };

  // Load config if initialized
  if (status.initialized) {
    const config = await loadConfig(cwd);
    if (config) {
      status.config = {
        project: config.project,
        indexing: config.indexing,
        mcp: config.mcp,
        autonomy: config.autonomy,
      };
      status.capabilities = {
        installed: config.capabilities.installed.length,
        favorites: config.capabilities.favorites.length,
      };
    }
  }

  // Check services health
  status.services = await checkServicesHealth(status.config?.mcp.contextEngineUrl);

  // Output
  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  // Project Info
  console.log(chalk.bold('Project:'));
  if (status.initialized && status.config) {
    console.log(chalk.green(`  ✓ Initialized`));
    console.log(chalk.gray(`    Name: ${status.config.project.name}`));
    console.log(chalk.gray(`    Type: ${status.config.project.type} (${status.config.project.language})`));
  } else {
    console.log(chalk.yellow(`  ○ Not initialized`));
    console.log(chalk.gray(`    Run 'gicm init' to initialize`));
  }

  // Indexing
  console.log(chalk.bold('\nIndexing:'));
  if (status.config?.indexing) {
    const idx = status.config.indexing;
    if (idx.lastIndexed) {
      const lastIndexed = new Date(idx.lastIndexed);
      const ago = getTimeAgo(lastIndexed);
      console.log(chalk.green(`  ✓ Indexed ${ago}`));
      console.log(chalk.gray(`    Files: ${idx.fileCount || 'unknown'}`));
      console.log(chalk.gray(`    Chunks: ${idx.chunkCount || 'unknown'}`));
    } else {
      console.log(chalk.yellow(`  ○ Not indexed yet`));
      console.log(chalk.gray(`    Run 'gicm index' to index codebase`));
    }
  } else {
    console.log(chalk.gray(`  - Not available`));
  }

  // Services
  console.log(chalk.bold('\nServices:'));
  for (const service of status.services) {
    const icon = service.status === 'online' ? '✓' : service.status === 'offline' ? '✗' : '○';
    const color = service.status === 'online' ? chalk.green : service.status === 'offline' ? chalk.red : chalk.yellow;
    const latency = service.latency ? ` (${service.latency}ms)` : '';
    console.log(color(`  ${icon} ${service.name}: ${service.status}${latency}`));
    if (options.verbose && service.url) {
      console.log(chalk.gray(`    URL: ${service.url}`));
    }
  }

  // Autonomy
  console.log(chalk.bold('\nAutonomy:'));
  if (status.config?.autonomy) {
    const level = status.config.autonomy.level;
    const labels: Record<number, string> = {
      1: 'Manual - requires approval for all actions',
      2: 'Bounded - auto-executes safe actions',
      3: 'Supervised - auto-executes most actions',
      4: 'Autonomous - full auto-execution',
    };
    console.log(chalk.cyan(`  Level ${level}: ${labels[level] || 'Unknown'}`));
  } else {
    console.log(chalk.gray(`  - Not configured`));
  }

  // Capabilities
  console.log(chalk.bold('\nCapabilities:'));
  console.log(chalk.gray(`  Installed: ${status.capabilities.installed}`));
  console.log(chalk.gray(`  Favorites: ${status.capabilities.favorites}`));

  // Quick Actions
  const onlineServices = status.services.filter(s => s.status === 'online').length;
  const totalServices = status.services.length;

  console.log(chalk.bold('\nQuick Actions:'));
  if (!status.initialized) {
    console.log(chalk.cyan(`  gicm init         # Initialize project`));
  } else if (!status.config?.indexing.lastIndexed) {
    console.log(chalk.cyan(`  gicm index        # Index codebase`));
  } else if (onlineServices < totalServices) {
    console.log(chalk.cyan(`  gicm dev          # Start all services`));
  } else {
    console.log(chalk.green(`  ✓ All systems ready!`));
    console.log(chalk.cyan(`  gicm search <q>   # Search marketplace`));
  }

  console.log('');
}

async function checkServicesHealth(contextEngineUrl?: string): Promise<ServiceHealth[]> {
  const services: ServiceHealth[] = [];

  // Context Engine
  const contextUrl = contextEngineUrl || 'http://localhost:8000';
  services.push(await checkServiceHealth('Context Engine', `${contextUrl}/health`));

  // Integration Hub
  services.push(await checkServiceHealth('Integration Hub', 'http://localhost:3001/health'));

  // Qdrant
  services.push(await checkServiceHealth('Qdrant', 'http://localhost:6333/collections'));

  return services;
}

async function checkServiceHealth(name: string, url: string): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    await axios.get(url, { timeout: 3000 });
    return {
      name,
      url,
      status: 'online',
      latency: Date.now() - start,
    };
  } catch {
    return {
      name,
      url,
      status: 'offline',
    };
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
