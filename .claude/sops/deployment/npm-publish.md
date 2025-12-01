---
name: npm-publish
description: Publish package to npm
category: deployment
trigger: /sop npm-publish
---

# SOP: Publish to npm

## Prerequisites
- [ ] Logged into npm (`npm whoami`)
- [ ] Package builds successfully
- [ ] Version bumped
- [ ] Tests passing

## Procedure

### Step 1: Verify Login
```bash
npm whoami
# Should show: gicm or your username
```

### Step 2: Build Package
```bash
cd packages/<package-name>
pnpm build
```

### Step 3: Bump Version
```bash
npm version patch  # or minor/major
```

### Step 4: Publish
```bash
pnpm publish --access public --no-git-checks
```

### Step 5: Verify
```bash
npm view @gicm/<package-name>
```

## Verification
- [ ] Package visible on npmjs.com
- [ ] Version matches expected
- [ ] Can install in fresh project

## Rollback
If publish fails:
1. Fix issue
2. Bump version again
3. Re-publish
