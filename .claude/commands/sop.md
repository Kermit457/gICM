# Command: /sop

> Execute a Standard Operating Procedure

## Description
The `/sop` command runs predefined SOPs (Standard Operating Procedures) with step-by-step guidance. SOPs ensure consistent execution of common tasks.

## Usage
```bash
/sop [procedure-name]
```

## Arguments
- `procedure-name` (required) - Name of the SOP to execute

## Available SOPs

### Development
- `new-package` - Create new @gicm/* package
- `feature-branch` - Feature branch workflow
- `release-process` - Version bump and publish

### Debugging
- `build-failure` - Fix build failures
- `type-errors` - Resolve TypeScript errors

### Deployment
- `npm-publish` - Publish to npm
- `vercel-deploy` - Deploy to Vercel

### Emergency
- `rollback` - Rollback procedures
- `hotfix` - Hotfix workflow

## Examples
```bash
/sop new-package          # Create new package
/sop build-failure        # Fix build failures
/sop npm-publish          # Publish to npm
/sop rollback             # Emergency rollback
```

## How It Works
1. Reads the SOP file from `.claude/sops/`
2. Displays prerequisites checklist
3. Guides through each step
4. Verifies completion
5. Records execution in memory

## Related
- See `.claude/sops/README.md` for full SOP index
- Use `/memory` to log decisions from SOPs
