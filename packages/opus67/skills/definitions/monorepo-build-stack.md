# Monorepo Build Stack

> **ID:** `monorepo-build-stack`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** github

## 🎯 What This Skill Does

Complete monorepo build orchestration using modern tooling for TypeScript workspaces. This skill provides comprehensive guidance for setting up, optimizing, and maintaining monorepos with Turborepo, pnpm workspaces, and automated publishing workflows.

**Core Technologies:**
- Turborepo for build orchestration and caching
- pnpm workspaces for package management
- tsup for TypeScript bundling
- Changesets for versioning and changelogs
- GitHub Actions for CI/CD
- TypeScript project references
- ESLint/Prettier shared configs
- Vitest for testing
- Wireit for advanced task pipelines

**What You'll Build:**
- High-performance monorepo with intelligent caching
- Shared configuration packages
- Automated versioning and publishing
- CI/CD pipelines with parallelization
- Local and remote caching strategies
- Internal package dependencies
- npm/GitHub package publishing
- Cross-package type checking
- Optimized Docker builds

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** monorepo, turborepo, pnpm, workspace, changesets, lerna, nx, rush
- **File Types:** turbo.json, pnpm-workspace.yaml, .changeset/config.json
- **Directories:** packages/, apps/, turbo.json

**Use this skill when:**
- Managing multiple related packages
- Building a design system or component library
- Creating a platform with multiple apps
- Need shared configuration across projects
- Building internal tooling packages
- Publishing multiple npm packages
- Optimizing CI/CD build times
- Sharing code between frontend and backend

**Don't use this skill for:**
- Single-package projects (use standard npm/yarn)
- Projects with completely independent codebases
- Polyrepo architectures (separate repos per project)
- Simple script collections (use npm scripts)

## 🚀 Core Capabilities

### 1. Turborepo Configuration & Caching

**Initial Setup:**
```bash
# Create monorepo
npx create-turbo@latest my-monorepo
cd my-monorepo

# Or add to existing repo
pnpm add -DW turbo
pnpm turbo init
```

**Root Structure:**
```
my-monorepo/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── turbo.json         # App-specific config (optional)
│   ├── docs/                   # Documentation site
│   └── api/                    # Backend API
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── package.json
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── config-eslint/          # Shared ESLint config
│   ├── config-typescript/      # Shared TS config
│   └── utils/                  # Shared utilities
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .npmrc
└── README.md
```

**Turborepo Configuration (`turbo.json`):**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "globalEnv": [
    "NODE_ENV",
    "CI",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_URL"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "build/**",
        "public/build/**"
      ]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "env": ["NODE_ENV"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  },
  "remoteCache": {
    "signature": true
  }
}
```

**Advanced Pipeline Configuration:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*"]
    },
    "build:prod": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV=production"]
    },
    "@repo/ui#build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "package.json", "tsup.config.ts"],
      "outputMode": "new-only"
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "test/**", "vitest.config.ts"]
    },
    "test:ci": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "env": ["CI=true"]
    },
    "lint": {
      "outputs": [],
      "outputMode": "new-only"
    },
    "lint:fix": {
      "cache": false
    },
    "format": {
      "outputs": [],
      "outputMode": "errors-only"
    },
    "format:fix": {
      "cache": false
    }
  },
  "globalDependencies": [
    ".env",
    "tsconfig.json",
    ".eslintrc.js",
    ".prettierrc"
  ],
  "globalEnv": [
    "NODE_ENV",
    "CI",
    "TURBO_TOKEN",
    "TURBO_TEAM"
  ]
}
```

**Remote Caching Setup (Vercel):**
```bash
# Link to Vercel remote cache
pnpm turbo login
pnpm turbo link

# Set in CI
export TURBO_TOKEN=your-token
export TURBO_TEAM=your-team
```

**Custom Remote Cache (Self-hosted):**
```json
{
  "remoteCache": {
    "enabled": true,
    "url": "https://your-cache-server.com"
  }
}
```

**Best Practices:**
- Use `^` prefix in `dependsOn` to reference dependency packages
- Specify `outputs` carefully to avoid cache invalidation
- Use `inputs` to define what affects cache keys
- Set `cache: false` for watch/dev tasks
- Use `persistent: true` for long-running tasks
- Define task-specific env vars to minimize cache misses
- Use `outputMode` to control task output verbosity
- Enable remote caching for team collaboration
- Use `globalDependencies` for files that affect all tasks

**Common Patterns:**

*Filtering Tasks:*
```bash
# Run build for specific package
turbo run build --filter=@repo/ui

# Run build for app and its dependencies
turbo run build --filter=web...

# Run build for changed packages since main
turbo run build --filter=[main]

# Run build for packages affected by current changes
turbo run build --filter=...[HEAD^]

# Run in specific workspace
turbo run dev --filter=./apps/web
```

*Parallel Execution:*
```bash
# Run with concurrency limit
turbo run build --concurrency=3

# Run with unlimited concurrency
turbo run build --concurrency=100

# Run sequentially
turbo run build --concurrency=1
```

*Cache Management:*
```bash
# Force rebuild without cache
turbo run build --force

# Skip cache entirely
turbo run build --no-cache

# Clear local cache
turbo prune

# Dry run to see what would be cached
turbo run build --dry-run
```

**Gotchas:**
- Cache keys include task inputs, dependencies, and environment variables
- Forgetting `^build` in dependsOn causes parallel builds (breaks dependencies)
- `.next/cache` should be excluded from outputs (internal Next.js cache)
- Environment variables must be declared in pipeline or they're ignored
- Remote cache requires authentication in CI
- `node_modules` changes don't invalidate cache by default
- Cached failures will be replayed (clear cache if needed)
- `--filter` patterns are git-aware and require clean working tree
- Outputs must be relative to package root
- Global dependencies affect all tasks (use sparingly)

### 2. pnpm Workspaces Configuration

**Workspace Setup (`pnpm-workspace.yaml`):**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
  - '!**/test/**'
  - '!**/dist/**'
```

**Root `package.json`:**
```json
{
  "name": "@repo/root",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build --filter=./packages/* && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@repo/config-eslint": "workspace:*",
    "@repo/config-typescript": "workspace:*",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**`.npmrc` Configuration:**
```ini
# Use pnpm for all installs
engine-strict=true

# Hoist patterns for better compatibility
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*

# Shamefully hoist when needed (avoid if possible)
# shamefully-hoist=true

# Strict peer dependencies
strict-peer-dependencies=false

# Use workspace protocol
link-workspace-packages=true
prefer-workspace-packages=true

# Auto install peers
auto-install-peers=true

# Registry configuration
registry=https://registry.npmjs.org/
# For private packages
# @your-scope:registry=https://npm.pkg.github.com

# Save exact versions
save-exact=true

# Lockfile settings
lockfile=true
```

**Package Configuration (`packages/ui/package.json`):**
```json
{
  "name": "@repo/ui",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.js",
      "types": "./dist/button.d.ts"
    }
  },
  "files": [
    "dist",
    "src",
    "README.md"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@repo/config-eslint": "workspace:*",
    "@repo/config-typescript": "workspace:*",
    "@types/react": "^18.2.45",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  },
  "peerDependencies": {
    "react": "^18.2.0"
  }
}
```

**Installing Dependencies:**
```bash
# Install all workspace dependencies
pnpm install

# Add dependency to specific package
pnpm add react --filter=@repo/ui

# Add dev dependency to root
pnpm add -DW eslint

# Add workspace dependency
pnpm add @repo/utils --filter=@repo/ui

# Update all dependencies
pnpm update -r

# Remove dependency
pnpm remove react --filter=@repo/ui

# Install for specific workspace
pnpm install --filter=@repo/ui
```

**Workspace Commands:**
```bash
# Run command in all workspaces
pnpm -r exec rm -rf node_modules

# Run command in filtered workspaces
pnpm --filter "./packages/*" build

# Run in parallel
pnpm -r --parallel dev

# Run with concurrency
pnpm -r --workspace-concurrency=2 build

# List all packages
pnpm list -r

# Check for outdated packages
pnpm outdated -r

# Recursive operations
pnpm -r update
```

**Best Practices:**
- Use `workspace:*` protocol for internal dependencies
- Set `private: true` in root package.json
- Define `packageManager` field for version locking
- Use `engines` to enforce Node.js version
- Hoist shared dev dependencies to root
- Keep package versions in sync with Changesets
- Use exact versions (`save-exact=true`)
- Define clear entry points in `exports` field
- Include `files` to control what's published
- Use pnpm's `catalog:` protocol for shared dep versions

**Common Patterns:**

*Catalog Dependencies (pnpm 8+):*
```json
{
  "pnpm": {
    "catalog": {
      "react": "^18.2.0",
      "typescript": "^5.3.3"
    }
  }
}
```

*Then in packages:*
```json
{
  "dependencies": {
    "react": "catalog:"
  }
}
```

*Overrides:*
```json
{
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.21",
      "@repo/ui>react": "^18.2.0"
    }
  }
}
```

*Shared Resolutions:*
```json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": ["react"],
      "allowedVersions": {
        "react": "18"
      }
    }
  }
}
```

**Gotchas:**
- `workspace:*` resolves to actual version in published packages
- Hoisting can cause phantom dependencies (use with caution)
- Peer dependencies must be satisfied in consuming packages
- `node_modules` structure differs from npm/yarn (symlinks)
- Some tools don't work with pnpm (use shamefully-hoist as last resort)
- Catalog requires pnpm 8+
- Workspace protocol only works within monorepo
- Publishing requires building first (no auto-build)
- Private packages should be marked `private: true`
- Lockfile conflicts are common in monorepos (coordinate merges)

### 3. tsup Bundling Configuration

**Basic Configuration (`packages/ui/tsup.config.ts`):**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom'],
});
```

**Advanced Multi-Entry Configuration:**
```typescript
import { defineConfig } from 'tsup';
import { glob } from 'glob';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // Export each component separately
    ...Object.fromEntries(
      glob.sync('src/components/*.tsx').map((file) => [
        file.replace('src/components/', '').replace('.tsx', ''),
        file,
      ])
    ),
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
```

**React Library Configuration:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
  onSuccess: 'tsc --emitDeclarationOnly --declaration',
});
```

**CLI Tool Configuration:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  target: 'node18',
  platform: 'node',
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

**Full-Featured Configuration:**
```typescript
import { defineConfig, Options } from 'tsup';

const commonConfig: Options = {
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  dts: true,
};

export default defineConfig([
  // Main library
  {
    ...commonConfig,
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    external: ['react', 'react-dom'],
    outDir: 'dist',
  },
  // CLI tool
  {
    ...commonConfig,
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    outDir: 'dist',
    platform: 'node',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  // Server-only code
  {
    ...commonConfig,
    entry: ['src/server/index.ts'],
    format: ['esm'],
    platform: 'node',
    outDir: 'dist/server',
    noExternal: ['server-only-dep'],
  },
]);
```

**CSS/Tailwind Support:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: true, // Inject CSS into JS
  // Or for separate CSS file:
  // esbuildOptions(options) {
  //   options.loader = {
  //     '.css': 'css',
  //   };
  // },
});
```

**Watch Mode for Development:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  watch: process.env.NODE_ENV === 'development',
  onSuccess: async () => {
    console.log('Build completed!');
  },
});
```

**Best Practices:**
- Mark framework/library dependencies as `external`
- Use `splitting: true` for code splitting in large libraries
- Enable `treeshake` to remove unused code
- Generate `.d.ts` files with `dts: true`
- Use `minify` only for production builds
- Set `target` to match your runtime environment
- Use `banner` for CLI tools or directive comments
- Enable sourcemaps for debugging
- Use multiple configs for different entry points
- Keep bundle size small (check with bundlephobia)

**Common Patterns:**

*Conditional Exports:*
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./server": {
      "import": "./dist/server/index.mjs",
      "types": "./dist/server/index.d.ts"
    },
    "./client": {
      "import": "./dist/client/index.mjs",
      "types": "./dist/client/index.d.ts"
    }
  }
}
```

*Monorepo Package References:*
```typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  // Don't bundle internal packages - let consumer bundle them
  noExternal: [],
  external: [
    'react',
    'react-dom',
    '@repo/utils', // Internal package
  ],
});
```

**Gotchas:**
- `dts: true` can be slow (consider using `tsc` separately)
- `splitting: true` requires `format: ['esm']`
- CSS imports need special handling
- `external` doesn't work with glob patterns
- Source maps increase bundle size
- Watch mode doesn't work well with Turborepo cache
- Banner is applied to all chunks when splitting
- Multiple entries can cause duplicate code without splitting
- Platform defaults to 'browser' (set 'node' for backend)
- `noExternal` bundles dependencies (use sparingly)

### 4. Changesets Versioning & Publishing

**Initial Setup:**
```bash
# Install Changesets
pnpm add -DW @changesets/cli

# Initialize
pnpm changeset init
```

**Configuration (`.changeset/config.json`):**
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@repo/eslint-config",
    "@repo/typescript-config"
  ]
}
```

**Advanced Configuration:**
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    {
      "repo": "your-org/your-repo"
    }
  ],
  "commit": false,
  "fixed": [
    ["@repo/ui", "@repo/icons"]
  ],
  "linked": [
    ["@repo/client", "@repo/server"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@repo/config-*"
  ],
  "privatePackages": {
    "version": true,
    "tag": false
  }
}
```

**Creating a Changeset:**
```bash
# Interactive changeset creation
pnpm changeset

# Output:
# ? Which packages would you like to include? @repo/ui, @repo/utils
# ? Which packages should have a major bump? None
# ? Which packages should have a minor bump? @repo/ui
# ? Which packages should have a patch bump? @repo/utils
# ? Please enter a summary for this change:
# Added new Button component with variants
```

**Changeset File (`.changeset/cool-lions-dance.md`):**
```markdown
---
'@repo/ui': minor
'@repo/utils': patch
---

Added new Button component with variants

- Added Button component with primary, secondary, and ghost variants
- Added utility function `cn()` for className merging
- Updated dependencies to latest versions
```

**Versioning Workflow:**
```bash
# 1. Create changesets during development
pnpm changeset

# 2. Version packages (consumes changesets)
pnpm changeset version

# This updates:
# - package.json versions
# - CHANGELOG.md files
# - Removes consumed changesets

# 3. Build packages
pnpm build

# 4. Publish to npm
pnpm changeset publish

# 5. Push tags and commit
git push --follow-tags
```

**GitHub Actions Workflow (`.github/workflows/release.yml`):**
```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Build packages
        run: pnpm build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version-packages
          commit: 'chore: version packages'
          title: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Package-Specific Scripts:**
```json
{
  "scripts": {
    "changeset": "changeset",
    "changeset:empty": "changeset --empty",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish",
    "release:snapshot": "changeset version --snapshot && changeset publish --tag snapshot"
  }
}
```

**Pre-Release Versions:**
```bash
# Enter pre-release mode
pnpm changeset pre enter alpha

# Create changeset
pnpm changeset

# Version as alpha
pnpm changeset version
# Results in: 1.0.0-alpha.0

# Publish
pnpm changeset publish --tag alpha

# Exit pre-release mode
pnpm changeset pre exit
```

**Snapshot Releases:**
```bash
# Create snapshot version (for testing)
pnpm changeset version --snapshot canary

# Publish snapshot
pnpm changeset publish --tag canary

# Results in: 1.0.0-canary-20240101120000
```

**Best Practices:**
- Create changesets for every user-facing change
- Use meaningful changeset summaries
- Group related changes in one changeset
- Use `fixed` for packages that should stay in sync
- Use `linked` for packages that should bump together
- Ignore config packages that don't need versioning
- Use GitHub Actions for automated releases
- Enable `updateInternalDependencies` for monorepo deps
- Use pre-release mode for beta/alpha releases
- Snapshot releases for testing without bumping versions

**Common Patterns:**

*Filtering Packages:*
```bash
# Version only specific packages
pnpm changeset version --ignore @repo/ui

# Publish specific packages
pnpm changeset publish --filter @repo/utils
```

*Custom Changelog:*
```json
{
  "changelog": [
    "@changesets/changelog-github",
    {
      "repo": "your-org/your-repo",
      "labels": {
        "breaking": "Breaking Changes",
        "enhancement": "Features",
        "bug": "Bug Fixes"
      }
    }
  ]
}
```

*Automatic Version Bumping:*
```json
{
  "updateInternalDependencies": "minor"
}
```

**Gotchas:**
- Changesets are consumed during version, not publish
- `fixed` groups must include all packages in array
- `linked` allows independent major versions
- Pre-release mode is persistent (must exit manually)
- Snapshots don't update CHANGELOG.md
- Publishing requires npm authentication
- Tags must be pushed separately (`git push --follow-tags`)
- Private packages aren't published by default
- Workspace dependencies use `workspace:*` protocol
- Changesets don't handle git operations automatically

### 5. CI/CD & Automation

**GitHub Actions - Main Workflow (`.github/workflows/ci.yml`):**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Setup Turborepo cache
        uses: actions/cache@v3
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Check bundle size
        run: pnpm bundlesize
```

**Affected Builds (`.github/workflows/affected.yml`):**
```yaml
name: Affected

on:
  pull_request:
    branches: [main]

jobs:
  affected:
    name: Build Affected
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build affected packages
        run: pnpm turbo run build --filter=[origin/main]

      - name: Test affected packages
        run: pnpm turbo run test --filter=[origin/main]
```

**Docker Build (`.github/workflows/docker.yml`):**
```yaml
name: Docker

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: |
            your-org/web:latest
            your-org/web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Optimized Dockerfile for Monorepos:**
```dockerfile
# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# Pruned stage - only files needed for the app
FROM base AS pruner
COPY . .
RUN pnpm turbo prune --scope=web --docker

# Build stage
FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "apps/web/server.js"]
```

**Best Practices:**
- Use Turborepo remote caching in CI
- Cache pnpm store and node_modules
- Run jobs in parallel where possible
- Use matrix builds for multi-platform testing
- Only build affected packages in PRs
- Use Docker layer caching
- Separate lint/test/build jobs for faster feedback
- Use `concurrency` to cancel outdated runs
- Publish artifacts for debugging
- Monitor build times and optimize

**Common Patterns:**

*Matrix Testing:*
```yaml
jobs:
  test:
    name: Test Node ${{ matrix.node }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: pnpm install
      - run: pnpm test
```

*Conditional Deployments:*
```yaml
jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: pnpm deploy:prod
```

**Gotchas:**
- GitHub Actions cache is limited to 10GB per repo
- Remote cache requires secrets (TURBO_TOKEN, TURBO_TEAM)
- Docker builds can be slow without proper caching
- `fetch-depth: 0` needed for affected builds
- Matrix builds count against concurrency limits
- Turborepo prune is essential for Docker optimization
- Lockfile changes invalidate all caches
- Artifacts expire after 90 days by default
- Actions marketplace actions may have rate limits
- Environment variables in CI must be explicitly set

## 💡 Real-World Examples

### Example 1: Design System Monorepo

```bash
my-design-system/
├── apps/
│   ├── docs/                      # Storybook documentation
│   └── playground/                # Development playground
├── packages/
│   ├── ui/                        # React components
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── input/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsup.config.ts
│   ├── icons/                     # Icon components
│   ├── themes/                    # Theme tokens
│   ├── utils/                     # Shared utilities
│   ├── config-eslint/             # Shared ESLint config
│   └── config-typescript/         # Shared TS config
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "storybook-static/**"]
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Example 2: Full-Stack Application Monorepo

```bash
my-app/
├── apps/
│   ├── web/                       # Next.js frontend
│   ├── mobile/                    # React Native app
│   ├── admin/                     # Admin dashboard
│   └── api/                       # Express backend
├── packages/
│   ├── ui/                        # Shared UI components
│   ├── database/                  # Prisma schema & client
│   ├── api-client/                # Type-safe API client
│   ├── validators/                # Zod schemas
│   ├── auth/                      # Auth utilities
│   └── config/                    # Shared configs
├── services/
│   ├── email/                     # Email service
│   └── payment/                   # Payment service
├── tools/
│   ├── scripts/                   # Utility scripts
│   └── generators/                # Code generators
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.yml
```

### Example 3: Multi-Tenant SaaS Monorepo

```bash
my-saas/
├── apps/
│   ├── app/                       # Main SaaS app
│   ├── marketing/                 # Marketing site
│   └── docs/                      # Documentation
├── packages/
│   ├── tenant-ui/                 # Tenant-specific UI
│   ├── admin-ui/                  # Admin UI
│   ├── database/                  # Multi-tenant schema
│   ├── auth/                      # Multi-tenant auth
│   ├── billing/                   # Stripe integration
│   └── analytics/                 # Analytics tracking
├── turbo.json
└── pnpm-workspace.yaml
```

**Shared Package Example (`packages/database/package.json`):**
```json
{
  "name": "@repo/database",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./client": {
      "require": "./dist/client.js",
      "types": "./dist/client.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1"
  },
  "devDependencies": {
    "prisma": "^5.7.1",
    "tsup": "^8.0.1"
  }
}
```

## 🔗 Related Skills

- **typescript-wizard** - Advanced TypeScript configuration
- **test-commander** - Testing strategies for monorepos
- **deploy-master** - Deployment patterns
- **docker-ninja** - Docker optimization
- **ci-cd-architect** - Advanced CI/CD patterns

## 📖 Further Reading

### Official Documentation
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [tsup Documentation](https://tsup.egoist.dev/)

### Best Practices
- [Monorepo Best Practices](https://monorepo.tools/)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [pnpm vs npm vs yarn](https://pnpm.io/benchmarks)

### Tools & Resources
- [Turborepo Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Changesets GitHub Action](https://github.com/changesets/action)
- [pnpm Catalog](https://pnpm.io/catalogs)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
