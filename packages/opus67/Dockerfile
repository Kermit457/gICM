# OPUS 67 BRAIN Server
# Multi-stage Docker build for production deployment

# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy opus67 package
COPY packages/opus67/package.json ./packages/opus67/
COPY packages/opus67/tsup.config.ts ./packages/opus67/
COPY packages/opus67/tsconfig.json ./packages/opus67/
COPY packages/opus67/src ./packages/opus67/src
COPY packages/opus67/skills ./packages/opus67/skills
COPY packages/opus67/mcp ./packages/opus67/mcp
COPY packages/opus67/modes ./packages/opus67/modes
COPY packages/opus67/config ./packages/opus67/config

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build opus67
RUN pnpm --filter @gicm/opus67 build

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM node:20-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S opus67 && \
    adduser -S opus67 -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/opus67/dist ./dist
COPY --from=builder /app/packages/opus67/package.json ./
COPY --from=builder /app/packages/opus67/skills ./skills
COPY --from=builder /app/packages/opus67/mcp ./mcp
COPY --from=builder /app/packages/opus67/modes ./modes
COPY --from=builder /app/packages/opus67/config ./config

# Install production dependencies only
RUN npm install --production --omit=dev

# Switch to non-root user
USER opus67

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3100/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV PORT=3100
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info

# Start server
CMD ["node", "dist/brain/server.js"]
