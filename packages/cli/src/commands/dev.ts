/**
 * gicm dev - Start all gICM services for local development
 *
 * Spawns context-engine, MCP server, and optionally opens dashboard
 */

import chalk from 'chalk';
import ora from 'ora';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { loadConfig, isInitialized } from '../lib/config';

interface DevOptions {
  dashboard?: boolean;
  contextEngineOnly?: boolean;
  mcpOnly?: boolean;
  verbose?: boolean;
  autonomous?: boolean;
  all?: boolean;
  live?: boolean;
}

interface ServiceStatus {
  name: string;
  status: 'starting' | 'running' | 'failed' | 'stopped';
  port?: number;
  pid?: number;
  error?: string;
}

const services: Map<string, ChildProcess> = new Map();
const serviceStatus: Map<string, ServiceStatus> = new Map();

export async function devCommand(options: DevOptions = {}): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.bold('\n⚡ gICM Dev Server\n'));

  // Check if initialized
  if (!await isInitialized(cwd)) {
    console.log(chalk.red('✗ Project not initialized.'));
    console.log(chalk.gray('  Run `gicm init` first.\n'));
    process.exit(1);
  }

  // Load config
  const config = await loadConfig(cwd);
  if (!config) {
    console.log(chalk.red('✗ Could not load config.'));
    process.exit(1);
  }

  // Setup graceful shutdown
  setupShutdownHandlers();

  const servicesToStart: Array<{
    name: string;
    start: () => Promise<void>;
    healthCheck: () => Promise<boolean>;
    port?: number;
  }> = [];

  // Context Engine (Python)
  if (!options.mcpOnly) {
    servicesToStart.push({
      name: 'Context Engine',
      port: 8000,
      start: () => startContextEngine(cwd, options.verbose),
      healthCheck: () => checkHealth('http://localhost:8000/health'),
    });
  }

  // MCP Server
  if (!options.contextEngineOnly) {
    servicesToStart.push({
      name: 'MCP Server',
      port: config.mcp.port,
      start: () => startMCPServer(cwd, config.mcp.port, options.verbose),
      healthCheck: () => Promise.resolve(true), // MCP uses stdio, no HTTP health
    });
  }

  // Dashboard (optional or with --all)
  if (options.dashboard || options.all) {
    servicesToStart.push({
      name: 'Dashboard',
      port: 3200,
      start: () => startDashboard(cwd, options.verbose),
      healthCheck: () => checkHealth('http://localhost:3200'),
    });
  }

  // Autonomous Engines (with --autonomous or --all)
  if (options.autonomous || options.all) {
    // Integration Hub
    const hubCliPath = path.join(cwd, 'packages', 'integration-hub', 'dist', 'cli.js');
    if (fs.existsSync(hubCliPath)) {
      servicesToStart.push({
        name: 'Integration Hub',
        port: 3001,
        start: () => startIntegrationHub(cwd, options.verbose),
        healthCheck: () => checkHealth('http://localhost:3001/health'),
      });
    } else if (options.verbose) {
      console.log(chalk.yellow('  ⊘ Skipping Integration Hub (not built)'));
    }

    // Money Engine
    const moneyCliPath = path.join(cwd, 'services', 'gicm-money-engine', 'dist', 'cli.js');
    if (fs.existsSync(moneyCliPath)) {
      servicesToStart.push({
        name: 'Money Engine',
        port: 3002,
        start: () => startMoneyEngine(cwd, options.verbose, options.live),
        healthCheck: () => Promise.resolve(true),
      });
    } else if (options.verbose) {
      console.log(chalk.yellow('  ⊘ Skipping Money Engine (not built)'));
    }

    // Growth Engine
    const growthCliPath = path.join(cwd, 'packages', 'growth-engine', 'dist', 'cli.js');
    if (fs.existsSync(growthCliPath)) {
      servicesToStart.push({
        name: 'Growth Engine',
        port: 3003,
        start: () => startGrowthEngine(cwd, options.verbose),
        healthCheck: () => Promise.resolve(true),
      });
    } else if (options.verbose) {
      console.log(chalk.yellow('  ⊘ Skipping Growth Engine (not built)'));
    }

    // Product Engine
    const productCliPath = path.join(cwd, 'packages', 'product-engine', 'dist', 'cli.js');
    if (fs.existsSync(productCliPath)) {
      servicesToStart.push({
        name: 'Product Engine',
        port: 3004,
        start: () => startProductEngine(cwd, options.verbose),
        healthCheck: () => Promise.resolve(true),
      });
    } else if (options.verbose) {
      console.log(chalk.yellow('  ⊘ Skipping Product Engine (not built)'));
    }

    // Orchestrator (Brain)
    const orchestratorCliPath = path.join(cwd, 'packages', 'orchestrator', 'dist', 'brain', 'cli.js');
    if (fs.existsSync(orchestratorCliPath)) {
      servicesToStart.push({
        name: 'Orchestrator',
        port: 0, // No HTTP port, connects to Hub
        start: () => startOrchestrator(cwd, options.verbose, options.live),
        healthCheck: () => Promise.resolve(true), // Heartbeat handled by Hub
      });
    } else if (options.verbose) {
      console.log(chalk.yellow('  ⊘ Skipping Orchestrator (not built)'));
    }


  }

  // Start services
  console.log(chalk.gray(`Starting ${servicesToStart.length} service(s)...\n`));

  for (const service of servicesToStart) {
    const spinner = ora(`Starting ${service.name}...`).start();
    serviceStatus.set(service.name, { name: service.name, status: 'starting', port: service.port });

    try {
      await service.start();

      // Wait for health check (with retries)
      let healthy = false;
      for (let i = 0; i < 10; i++) {
        await sleep(1000);
        healthy = await service.healthCheck();
        if (healthy) break;
      }

      if (healthy || service.name === 'MCP Server') {
        spinner.succeed(`${service.name} running on port ${service.port}`);
        serviceStatus.set(service.name, {
          name: service.name,
          status: 'running',
          port: service.port,
          pid: services.get(service.name)?.pid
        });
      } else {
        spinner.warn(`${service.name} started but health check failed`);
        serviceStatus.set(service.name, { name: service.name, status: 'running', port: service.port });
      }
    } catch (error) {
      spinner.fail(`${service.name} failed to start`);
      serviceStatus.set(service.name, {
        name: service.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (options.verbose) {
        console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : error}`));
      }
    }
  }

  // Summary
  console.log(chalk.bold('\n📊 Services Status:\n'));

  for (const [name, status] of serviceStatus) {
    const icon = status.status === 'running' ? '✓' : status.status === 'failed' ? '✗' : '○';
    const color = status.status === 'running' ? chalk.green : status.status === 'failed' ? chalk.red : chalk.yellow;
    console.log(color(`  ${icon} ${name}: ${status.status}${status.port ? ` (port ${status.port})` : ''}`));
  }

  const runningCount = Array.from(serviceStatus.values()).filter(s => s.status === 'running').length;

  if (runningCount > 0) {
    console.log(chalk.green(`\n✓ ${runningCount} service(s) running\n`));
    console.log(chalk.bold('Available endpoints:'));

    if (serviceStatus.get('Context Engine')?.status === 'running') {
      console.log(chalk.gray('  Context Engine: http://localhost:8000'));
      console.log(chalk.gray('    - POST /index/repository - Index codebase'));
      console.log(chalk.gray('    - POST /search - Semantic search'));
    }

    if (serviceStatus.get('Dashboard')?.status === 'running') {
      console.log(chalk.gray('  Dashboard: http://localhost:3200'));
    }

    if (serviceStatus.get('Integration Hub')?.status === 'running') {
      console.log(chalk.gray('  Integration Hub: http://localhost:3001'));
      console.log(chalk.gray('    - GET /health - Health check'));
      console.log(chalk.gray('    - GET /api/engines - Engine status'));
    }

    if (serviceStatus.get('Money Engine')?.status === 'running') {
      console.log(chalk.gray('  Money Engine: Running (micro mode)'));
      console.log(chalk.gray('    - Treasury management & DCA trading'));
    }

    if (serviceStatus.get('Growth Engine')?.status === 'running') {
      console.log(chalk.gray('  Growth Engine: Running'));
      console.log(chalk.gray('    - Content generation & social automation'));
    }

    if (serviceStatus.get('Product Engine')?.status === 'running') {
      console.log(chalk.gray('  Product Engine: Running'));
      console.log(chalk.gray('    - Discovery & autonomous building'));
    }

    if (serviceStatus.get('Orchestrator')?.status === 'running') {
      console.log(chalk.gray('  Orchestrator: Running'));
      console.log(chalk.gray('    - "The Brain" - Coordinating all engines'));
    }



    console.log(chalk.bold('\nPress Ctrl+C to stop all services\n'));

    // Keep process alive
    await new Promise(() => { });
  } else {
    console.log(chalk.red('\n✗ No services running. Check errors above.\n'));
    process.exit(1);
  }
}

async function startContextEngine(cwd: string, verbose?: boolean): Promise<void> {
  const contextEnginePath = path.join(cwd, 'services', 'context-engine');

  const proc = spawn('python', ['-m', 'uvicorn', 'src.main:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: contextEnginePath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Context Engine', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Context Engine error: ${err.message}`));
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      serviceStatus.set('Context Engine', { name: 'Context Engine', status: 'failed', error: `Exit code ${code}` });
    }
  });
}

async function startMCPServer(cwd: string, port: number, verbose?: boolean): Promise<void> {
  const mcpServerPath = path.join(cwd, 'packages', 'mcp-server');

  const proc = spawn('node', ['dist/index.js'], {
    cwd: mcpServerPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
    env: {
      ...process.env,
      GICM_PROJECT_PATH: cwd,
      GICM_MCP_PORT: String(port),
    },
  });

  services.set('MCP Server', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`MCP Server error: ${err.message}`));
  });
}

async function startDashboard(cwd: string, verbose?: boolean): Promise<void> {
  const dashboardPath = path.join(cwd, 'apps', 'dashboard');

  const proc = spawn('pnpm', ['dev'], {
    cwd: dashboardPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Dashboard', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Dashboard error: ${err.message}`));
  });
}

async function startIntegrationHub(cwd: string, verbose?: boolean): Promise<void> {
  const hubPath = path.join(cwd, 'packages', 'integration-hub');

  const proc = spawn('node', ['dist/cli.js', 'start'], {
    cwd: hubPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Integration Hub', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Integration Hub error: ${err.message}`));
  });
}

async function startMoneyEngine(cwd: string, verbose?: boolean, live?: boolean): Promise<void> {
  const moneyPath = path.join(cwd, 'services', 'gicm-money-engine');

  const args = ['dist/cli.js', 'start', '--mode', live ? 'live' : 'micro'];

  const proc = spawn('node', args, {
    cwd: moneyPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Money Engine', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Money Engine error: ${err.message}`));
  });
}

async function startGrowthEngine(cwd: string, verbose?: boolean): Promise<void> {
  const growthPath = path.join(cwd, 'packages', 'growth-engine');

  const proc = spawn('node', ['dist/cli.js', 'start'], {
    cwd: growthPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Growth Engine', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Growth Engine error: ${err.message}`));
  });
}

async function startProductEngine(cwd: string, verbose?: boolean): Promise<void> {
  const productPath = path.join(cwd, 'packages', 'product-engine');

  const proc = spawn('node', ['dist/cli.js', 'start'], {
    cwd: productPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
  });

  services.set('Product Engine', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Product Engine error: ${err.message}`));
  });
}

async function startOrchestrator(cwd: string, verbose?: boolean, live?: boolean): Promise<void> {
  const orchestratorPath = path.join(cwd, 'packages', 'orchestrator');

  const args = ['dist/brain/cli.js', 'start'];
  if (live) {
    args.push('--live');
  }

  const proc = spawn('node', args, {
    cwd: orchestratorPath,
    stdio: verbose ? 'inherit' : 'pipe',
    shell: true,
    env: {
      ...process.env,
      HUB_URL: 'http://localhost:3001',
    },
  });

  services.set('Orchestrator', proc);

  proc.on('error', (err) => {
    console.error(chalk.red(`Orchestrator error: ${err.message}`));
  });
}



async function checkHealth(url: string): Promise<boolean> {
  try {
    await axios.get(url, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setupShutdownHandlers(): void {
  const shutdown = () => {
    console.log(chalk.yellow('\n\nShutting down services...'));

    for (const [name, proc] of services) {
      if (proc && !proc.killed) {
        console.log(chalk.gray(`  Stopping ${name}...`));
        proc.kill('SIGTERM');
      }
    }

    setTimeout(() => {
      // Force kill if still running
      for (const [name, proc] of services) {
        if (proc && !proc.killed) {
          proc.kill('SIGKILL');
        }
      }
      console.log(chalk.green('✓ All services stopped\n'));
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
