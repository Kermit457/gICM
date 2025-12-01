---
name: new-package
description: Create a new @gicm/* package
category: development
trigger: /sop new-package
---

# SOP: Create New @gicm/* Package

## Prerequisites
- [ ] Package name decided
- [ ] Purpose defined
- [ ] Dependencies identified

## Procedure

### Step 1: Create Directory
```bash
mkdir packages/<package-name>
cd packages/<package-name>
```

### Step 2: Initialize package.json
```bash
pnpm init
```

Edit package.json:
```json
{
  "name": "@gicm/<package-name>",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --clean",
    "dev": "tsup src/index.ts --format esm --dts --watch"
  }
}
```

### Step 3: Create Source
```bash
mkdir src
touch src/index.ts
```

### Step 4: Add Dependencies
```bash
pnpm add @gicm/agent-core eventemitter3 zod
pnpm add -D typescript tsup @types/node
```

### Step 5: Create tsconfig.json
Copy from existing package or use standard config.

### Step 6: Build & Verify
```bash
pnpm build
```

## Verification
- [ ] Package builds without errors
- [ ] Types are generated
- [ ] Can be imported by other packages
