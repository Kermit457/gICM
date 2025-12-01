/**
 * Project type detection for gICM CLI
 * Detects framework, language, and project configuration
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export type ProjectType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'node'
  | 'typescript'
  | 'python'
  | 'rust'
  | 'go'
  | 'unknown';

export interface ProjectInfo {
  type: ProjectType;
  name: string;
  version?: string;
  language: 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'unknown';
  frameworks: string[];
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
  hasGit: boolean;
  rootPath: string;
  entryPoints: string[];
}

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Detect project type and configuration from directory
 */
export async function detectProject(dir: string = process.cwd()): Promise<ProjectInfo> {
  const info: ProjectInfo = {
    type: 'unknown',
    name: path.basename(dir),
    language: 'unknown',
    frameworks: [],
    hasGit: false,
    rootPath: dir,
    entryPoints: [],
  };

  // Check for git
  info.hasGit = await fs.pathExists(path.join(dir, '.git'));

  // Check for package.json (Node.js ecosystem)
  const packageJsonPath = path.join(dir, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson: PackageJson = await fs.readJson(packageJsonPath);
    info.name = packageJson.name || info.name;
    info.version = packageJson.version;

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Detect framework
    if (deps['next']) {
      info.type = 'nextjs';
      info.frameworks.push(`Next.js ${deps['next'].replace('^', '')}`);
    } else if (deps['react']) {
      info.type = 'react';
      info.frameworks.push(`React ${deps['react'].replace('^', '')}`);
    } else if (deps['vue']) {
      info.type = 'vue';
      info.frameworks.push(`Vue ${deps['vue'].replace('^', '')}`);
    } else if (deps['@angular/core']) {
      info.type = 'angular';
      info.frameworks.push(`Angular ${deps['@angular/core'].replace('^', '')}`);
    } else if (deps['svelte']) {
      info.type = 'svelte';
      info.frameworks.push(`Svelte ${deps['svelte'].replace('^', '')}`);
    } else {
      info.type = 'node';
    }

    // Detect language
    if (deps['typescript'] || await fs.pathExists(path.join(dir, 'tsconfig.json'))) {
      info.language = 'typescript';
    } else {
      info.language = 'javascript';
    }

    // Detect package manager
    if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml'))) {
      info.packageManager = 'pnpm';
    } else if (await fs.pathExists(path.join(dir, 'yarn.lock'))) {
      info.packageManager = 'yarn';
    } else if (await fs.pathExists(path.join(dir, 'bun.lockb'))) {
      info.packageManager = 'bun';
    } else if (await fs.pathExists(path.join(dir, 'package-lock.json'))) {
      info.packageManager = 'npm';
    }

    // Common entry points for JS/TS
    const jsEntries = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js', 'index.ts', 'index.js'];
    for (const entry of jsEntries) {
      if (await fs.pathExists(path.join(dir, entry))) {
        info.entryPoints.push(entry);
      }
    }

    return info;
  }

  // Check for Python project
  const pyProjectPath = path.join(dir, 'pyproject.toml');
  const requirementsPath = path.join(dir, 'requirements.txt');
  if (await fs.pathExists(pyProjectPath) || await fs.pathExists(requirementsPath)) {
    info.type = 'python';
    info.language = 'python';

    // Check for frameworks
    if (await fs.pathExists(requirementsPath)) {
      const requirements = await fs.readFile(requirementsPath, 'utf-8');
      if (requirements.includes('fastapi')) info.frameworks.push('FastAPI');
      if (requirements.includes('django')) info.frameworks.push('Django');
      if (requirements.includes('flask')) info.frameworks.push('Flask');
    }

    // Python entry points
    const pyEntries = ['src/main.py', 'main.py', 'app.py', 'src/app.py'];
    for (const entry of pyEntries) {
      if (await fs.pathExists(path.join(dir, entry))) {
        info.entryPoints.push(entry);
      }
    }

    return info;
  }

  // Check for Rust project
  const cargoPath = path.join(dir, 'Cargo.toml');
  if (await fs.pathExists(cargoPath)) {
    info.type = 'rust';
    info.language = 'rust';

    const cargoContent = await fs.readFile(cargoPath, 'utf-8');
    const nameMatch = cargoContent.match(/name\s*=\s*"([^"]+)"/);
    if (nameMatch) info.name = nameMatch[1];

    info.entryPoints.push('src/main.rs', 'src/lib.rs');
    return info;
  }

  // Check for Go project
  const goModPath = path.join(dir, 'go.mod');
  if (await fs.pathExists(goModPath)) {
    info.type = 'go';
    info.language = 'go';

    const goModContent = await fs.readFile(goModPath, 'utf-8');
    const moduleMatch = goModContent.match(/module\s+(\S+)/);
    if (moduleMatch) info.name = moduleMatch[1];

    info.entryPoints.push('main.go', 'cmd/main.go');
    return info;
  }

  return info;
}

/**
 * Get human-readable project type string
 */
export function getProjectTypeLabel(info: ProjectInfo): string {
  const parts: string[] = [];

  if (info.frameworks.length > 0) {
    parts.push(info.frameworks.join(' + '));
  } else {
    const typeLabels: Record<ProjectType, string> = {
      nextjs: 'Next.js',
      react: 'React',
      vue: 'Vue.js',
      angular: 'Angular',
      svelte: 'Svelte',
      node: 'Node.js',
      typescript: 'TypeScript',
      python: 'Python',
      rust: 'Rust',
      go: 'Go',
      unknown: 'Unknown',
    };
    parts.push(typeLabels[info.type]);
  }

  if (info.language === 'typescript' && info.type !== 'typescript') {
    parts.push('+ TypeScript');
  }

  return parts.join(' ');
}
