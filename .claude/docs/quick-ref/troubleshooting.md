# Troubleshooting Quick Reference

## Module Not Found
```bash
pnpm --filter @gicm/<dep> build
pnpm --filter @gicm/<your-pkg> build
```

## Type Errors
```bash
pnpm add -D @types/<package>
```

## Workspace Sync
```bash
pnpm install --force
```

## tsup Not Found
```bash
pnpm add -D tsup -w
```

## Build Order Issues
Build `agent-core` first, then dependent packages.

## Port Conflicts
```bash
lsof -i :PORT  # Find process
kill -9 PID    # Kill it
```
