# Bugs Fixed & Solutions

## pnpm Workspace Build Order
**Date:** 2025-12-01
**Symptoms:** Module not found errors during build
**Root Cause:** Dependencies not built before dependents
**Solution:** Build agent-core first, then dependent packages
**Prevention:** Always `pnpm --filter @gicm/agent-core build` first

## TypeScript Generic on BaseAgent
**Date:** 2025-11
**Symptoms:** Type errors when extending BaseAgent
**Root Cause:** BaseAgent was incorrectly made generic
**Solution:** Remove type parameter from BaseAgent class
**Prevention:** Don't use generics on base classes unless required
