# Docker & Containers Expert

> **ID:** `docker-containers`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** github

## 🎯 What This Skill Does

- Write optimized Dockerfiles
- Docker Compose configurations
- Multi-stage builds
- Container networking
- CI/CD integration

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** docker, container, dockerfile, compose, kubernetes
- **File Types:** Dockerfile, .yml
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Write optimized Dockerfiles

Create production-ready Dockerfiles that are secure, efficient, and leverage caching effectively. Focus on minimizing image size, reducing attack surface, and optimizing build times.

**Best Practices:**
- Use specific base image versions (never `:latest`)
- Order layers from least to most frequently changing
- Use `.dockerignore` to exclude unnecessary files
- Run as non-root user for security
- Use multi-stage builds to reduce final image size
- Combine RUN commands to reduce layers
- Clean up package manager cache in the same layer
- Pin package versions for reproducibility

**Common Patterns:**
```dockerfile
# Multi-stage Node.js build with security best practices
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production image
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

**Gotchas:**
- Don't use `ADD` when `COPY` will do (ADD has implicit tar extraction)
- Avoid storing secrets in build args (they're visible in image history)
- Don't run `apt-get update` and `apt-get install` in separate layers
- Be careful with file permissions when switching users
- Alpine images may have different libc (use musl-compatible binaries)


### 2. Docker Compose configurations

Orchestrate multi-container applications with proper networking, volumes, and environment management for local development and testing.

**Best Practices:**
- Use named volumes instead of bind mounts for databases
- Define custom networks for service isolation
- Use `.env` files for environment variables
- Set resource limits to prevent resource exhaustion
- Use healthchecks for dependent services
- Pin service versions
- Use `depends_on` with conditions for startup ordering
- Keep secrets out of docker-compose.yml (use .env)

**Common Patterns:**
```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    volumes:
      - .:/app
      - /app/node_modules  # Prevent host node_modules override
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - cache-data:/data
    networks:
      - app-network
    restart: unless-stopped

volumes:
  db-data:
  cache-data:

networks:
  app-network:
    driver: bridge
```

**Gotchas:**
- `depends_on` doesn't wait for services to be "ready" without conditions
- Bind mounts on Windows can have performance issues
- Environment variables in docker-compose.yml override Dockerfile ENV
- Network isolation: services on different networks can't communicate
- Volume paths are relative to docker-compose.yml location


### 3. Multi-stage builds

Dramatically reduce image size and improve security by separating build dependencies from runtime dependencies.

**Best Practices:**
- Use descriptive stage names (builder, deps, runtime)
- Only copy necessary artifacts to final stage
- Use slim/alpine base images for final stage
- Leverage build cache with strategic layer ordering
- Consider distroless images for maximum security
- Copy files with proper ownership in final stage
- Keep build tools out of production image

**Common Patterns:**
```dockerfile
# TypeScript monorepo multi-stage build
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy runtime files only
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

**Advanced Pattern - Distroless:**
```dockerfile
# Use distroless for minimal attack surface
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["dist/index.js"]
```

**Gotchas:**
- Each stage has its own filesystem (use COPY --from)
- Final stage must have runtime dependencies
- Build args don't persist between stages
- Distroless images don't have shell (debugging is harder)
- Be careful with file permissions when copying between stages


### 4. Container networking

Configure container networks for service discovery, isolation, and communication between containers and the host.

**Best Practices:**
- Use custom bridge networks for better isolation
- Use service names for DNS-based discovery
- Expose only necessary ports
- Use internal networks for backend services
- Implement network policies for security
- Use host network sparingly (security risk)
- Document all port mappings

**Common Patterns:**
```yaml
# Docker Compose with network segmentation
version: '3.9'

services:
  frontend:
    image: frontend:latest
    networks:
      - public-network
      - app-network
    ports:
      - "80:80"

  api:
    image: api:latest
    networks:
      - app-network
      - backend-network
    environment:
      - DB_HOST=database
      - CACHE_HOST=redis
    # No external ports - internal only

  database:
    image: postgres:16
    networks:
      - backend-network  # Isolated from public
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:7
    networks:
      - backend-network

networks:
  public-network:
    driver: bridge
  app-network:
    driver: bridge
    internal: false
  backend-network:
    driver: bridge
    internal: true  # No external access

volumes:
  db-data:
```

**Docker CLI networking:**
```bash
# Create custom network
docker network create --driver bridge my-network

# Connect container to network
docker network connect my-network my-container

# Inspect network
docker network inspect my-network

# Run container with custom network
docker run --network my-network --name api api:latest
```

**Gotchas:**
- Default bridge network doesn't support DNS resolution (use custom networks)
- Containers on different networks can't communicate
- Port conflicts when multiple containers bind to same host port
- Host network mode doesn't work on Docker Desktop (Mac/Windows)
- Internal networks block ALL external traffic (including internet)


### 5. CI/CD integration

Integrate Docker builds into continuous integration and deployment pipelines with caching, security scanning, and multi-platform builds.

**Best Practices:**
- Use BuildKit for improved caching and performance
- Implement layer caching in CI
- Scan images for vulnerabilities
- Use multi-platform builds for broader compatibility
- Tag images with git commit SHA
- Push to registry only on successful builds
- Use secrets management for credentials
- Implement health checks before deployment

**Common Patterns:**

**GitHub Actions:**
```yaml
name: Docker Build & Push

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

**Docker Compose for Testing:**
```yaml
# docker-compose.test.yml
version: '3.9'

services:
  test:
    build:
      context: .
      target: builder
    command: pnpm test
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@db:5432/test
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5
```

**Gotchas:**
- BuildKit cache can grow large (clean periodically)
- Multi-platform builds are slower (use conditionally)
- Secrets in build logs are dangerous (use BuildKit secrets)
- Registry rate limits can break CI (authenticate properly)
- Image scanning can find false positives (review findings)


## 💡 Real-World Examples

### Example 1: Next.js Production Dockerfile
```dockerfile
# Optimized Next.js production build
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### Example 2: Microservices Stack with Traefik
```yaml
version: '3.9'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - web

  auth-service:
    build: ./services/auth
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth.rule=Host(`api.localhost`) && PathPrefix(`/auth`)"
      - "traefik.http.services.auth.loadbalancer.server.port=3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/auth
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - web
      - backend

  user-service:
    build: ./services/user
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.user.rule=Host(`api.localhost`) && PathPrefix(`/users`)"
      - "traefik.http.services.user.loadbalancer.server.port=3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/users
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - web
      - backend

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: main
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  cache:
    image: redis:7-alpine
    volumes:
      - cache-data:/data
    networks:
      - backend

volumes:
  db-data:
  cache-data:

networks:
  web:
  backend:
    internal: true
```

## 🔗 Related Skills

- **monorepo-expert** - Managing multi-package Docker builds
- **devops-engineer** - CI/CD pipeline integration
- **auth-security** - Container security hardening
- **testing-playwright** - E2E testing in containers

## 📖 Further Reading

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose documentation](https://docs.docker.com/compose/)
- [BuildKit documentation](https://docs.docker.com/build/buildkit/)
- [Container security best practices](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Distroless containers](https://github.com/GoogleContainerTools/distroless)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Generated by skill-generator.ts - Content to be filled by specialized agents*
