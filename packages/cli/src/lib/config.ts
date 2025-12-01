/**
 * gICM configuration file handler
 * Manages .gicm/config.json and project settings
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import type { ProjectInfo } from './detector';

export interface GICMConfig {
  version: string;
  project: {
    name: string;
    type: string;
    language: string;
    frameworks: string[];
  };
  indexing: {
    enabled: boolean;
    lastIndexed?: string;
    fileCount?: number;
    chunkCount?: number;
    excludePatterns: string[];
    includePatterns: string[];
  };
  mcp: {
    enabled: boolean;
    port: number;
    contextEngineUrl: string;
  };
  autonomy: {
    level: 1 | 2 | 3 | 4;
    maxAutoExpense: number;
    requireApproval: string[];
  };
  capabilities: {
    registryUrl: string;
    installed: string[];
    favorites: string[];
  };
}

const DEFAULT_CONFIG: GICMConfig = {
  version: '1.0.0',
  project: {
    name: '',
    type: 'unknown',
    language: 'unknown',
    frameworks: [],
  },
  indexing: {
    enabled: true,
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      '*.lock',
      '*.log',
      '.env*',
      'coverage/**',
      '__pycache__/**',
      '.venv/**',
      'target/**',
    ],
    includePatterns: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.py',
      '**/*.rs',
      '**/*.go',
      '**/*.md',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
    ],
  },
  mcp: {
    enabled: true,
    port: 3100,
    contextEngineUrl: 'http://localhost:8000',
  },
  autonomy: {
    level: 2,
    maxAutoExpense: 50,
    requireApproval: ['deploy', 'delete', 'transfer'],
  },
  capabilities: {
    registryUrl: 'https://gicm-marketplace.vercel.app/api',
    installed: [],
    favorites: [],
  },
};

/**
 * Get the .gicm directory path
 */
export function getGICMDir(basePath: string = process.cwd()): string {
  return path.join(basePath, '.gicm');
}

/**
 * Get the config file path
 */
export function getConfigPath(basePath: string = process.cwd()): string {
  return path.join(getGICMDir(basePath), 'config.json');
}

/**
 * Check if .gicm directory exists
 */
export async function isInitialized(basePath: string = process.cwd()): Promise<boolean> {
  return fs.pathExists(getConfigPath(basePath));
}

/**
 * Initialize .gicm directory with config file
 */
export async function initializeConfig(
  projectInfo: ProjectInfo,
  basePath: string = process.cwd()
): Promise<GICMConfig> {
  const gicmDir = getGICMDir(basePath);
  const configPath = getConfigPath(basePath);

  // Create .gicm directory structure
  await fs.ensureDir(gicmDir);
  await fs.ensureDir(path.join(gicmDir, 'cache'));
  await fs.ensureDir(path.join(gicmDir, 'logs'));

  // Create config with project info
  const config: GICMConfig = {
    ...DEFAULT_CONFIG,
    project: {
      name: projectInfo.name,
      type: projectInfo.type,
      language: projectInfo.language,
      frameworks: projectInfo.frameworks,
    },
  };

  // Add language-specific exclude patterns
  if (projectInfo.language === 'python') {
    config.indexing.excludePatterns.push('.venv/**', '*.pyc', '__pycache__/**');
  } else if (projectInfo.language === 'rust') {
    config.indexing.excludePatterns.push('target/**', 'Cargo.lock');
  } else if (projectInfo.language === 'go') {
    config.indexing.excludePatterns.push('vendor/**');
  }

  // Write config file
  await fs.writeJson(configPath, config, { spaces: 2 });

  // Create .gitignore for .gicm directory
  const gitignorePath = path.join(gicmDir, '.gitignore');
  await fs.writeFile(
    gitignorePath,
    `# gICM local files
cache/
logs/
*.local.json
`,
    'utf-8'
  );

  return config;
}

/**
 * Load existing config
 */
export async function loadConfig(basePath: string = process.cwd()): Promise<GICMConfig | null> {
  const configPath = getConfigPath(basePath);

  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    return await fs.readJson(configPath);
  } catch {
    return null;
  }
}

/**
 * Update config with partial values
 */
export async function updateConfig(
  updates: Partial<GICMConfig>,
  basePath: string = process.cwd()
): Promise<GICMConfig> {
  const configPath = getConfigPath(basePath);
  const existingConfig = await loadConfig(basePath);

  if (!existingConfig) {
    throw new Error('Project not initialized. Run `gicm init` first.');
  }

  // Deep merge updates
  const newConfig: GICMConfig = {
    ...existingConfig,
    ...updates,
    project: { ...existingConfig.project, ...updates.project },
    indexing: { ...existingConfig.indexing, ...updates.indexing },
    mcp: { ...existingConfig.mcp, ...updates.mcp },
    autonomy: { ...existingConfig.autonomy, ...updates.autonomy },
    capabilities: { ...existingConfig.capabilities, ...updates.capabilities },
  };

  await fs.writeJson(configPath, newConfig, { spaces: 2 });
  return newConfig;
}

/**
 * Update indexing stats after indexing completes
 */
export async function updateIndexingStats(
  stats: { fileCount: number; chunkCount: number },
  basePath: string = process.cwd()
): Promise<void> {
  await updateConfig(
    {
      indexing: {
        lastIndexed: new Date().toISOString(),
        fileCount: stats.fileCount,
        chunkCount: stats.chunkCount,
      } as GICMConfig['indexing'],
    },
    basePath
  );
}

/**
 * Add installed capability to config
 */
export async function addInstalledCapability(
  capabilityId: string,
  basePath: string = process.cwd()
): Promise<void> {
  const config = await loadConfig(basePath);
  if (!config) {
    throw new Error('Project not initialized. Run `gicm init` first.');
  }

  if (!config.capabilities.installed.includes(capabilityId)) {
    config.capabilities.installed.push(capabilityId);
    await updateConfig({ capabilities: config.capabilities }, basePath);
  }
}
