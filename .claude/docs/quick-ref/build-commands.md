# Build Commands Quick Reference

## Full Build
```bash
pnpm install && pnpm -r build
```

## Single Package
```bash
pnpm --filter @gicm/<package> build
```

## Common Packages
```bash
pnpm --filter @gicm/agent-core build      # Core first
pnpm --filter @gicm/autonomy build        # Autonomy engine
pnpm --filter @gicm/integration-hub build # Integration Hub
pnpm --filter @gicm/cli build             # CLI tool
```

## Watch Mode
```bash
cd packages/<name> && pnpm dev
```

## Clean Build
```bash
rm -rf node_modules && pnpm install && pnpm -r build
```
