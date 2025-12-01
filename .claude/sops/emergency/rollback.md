---
name: rollback
description: Rollback procedures for emergency situations
category: emergency
trigger: /sop rollback
---

# SOP: Emergency Rollback

## Prerequisites
- [ ] Identify what needs rollback (code, deploy, package)
- [ ] Have access to git/npm/vercel

## Code Rollback

### Step 1: Identify Last Good Commit
```bash
git log --oneline -10
```

### Step 2: Reset (Soft - Keep Changes)
```bash
git reset --soft HEAD~1
```

### Step 3: Reset (Hard - Discard Changes)
```bash
git reset --hard HEAD~1
```

### Step 4: Force Push (If Needed)
```bash
git push --force-with-lease
```

## Vercel Rollback

### Via CLI
```bash
npx vercel rollback
```

### Via Dashboard
1. Go to Vercel dashboard
2. Select project
3. Go to Deployments
4. Click "..." on previous deployment
5. Select "Promote to Production"

## NPM Rollback

### Deprecate Bad Version
```bash
npm deprecate @gicm/<pkg>@<version> "Use version X instead"
```

### Unpublish (Within 72 hours)
```bash
npm unpublish @gicm/<pkg>@<version>
```

## Verification
- [ ] System back to working state
- [ ] Users notified if public-facing
- [ ] Incident logged in memory/learnings
