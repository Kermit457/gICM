---
name: build-failure
description: Fix build failures
category: debugging
trigger: /sop build-failure
---

# SOP: Fix Build Failures

## Prerequisites
- [ ] Build error message captured
- [ ] Package name identified

## Procedure

### Step 1: Identify Error Type
- Type error → See type-errors SOP
- Module not found → Step 2
- tsup error → Step 3

### Step 2: Module Not Found
```bash
# Rebuild dependency first
pnpm --filter @gicm/<dependency> build

# Then rebuild failing package
pnpm --filter @gicm/<package> build
```

### Step 3: tsup Issues
```bash
# Install tsup
pnpm add -D tsup

# Check tsup.config.ts exists
```

### Step 4: Clean Rebuild
```bash
rm -rf dist node_modules/.cache
pnpm build
```

### Step 5: Full Reset (Nuclear Option)
```bash
rm -rf node_modules
pnpm install
pnpm -r build
```

## Verification
- [ ] Build completes without errors
- [ ] dist/ folder created with .js and .d.ts files
