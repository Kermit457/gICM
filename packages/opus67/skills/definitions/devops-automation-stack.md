# DevOps Automation Stack

> **ID:** `devops-automation-stack`
> **Tier:** 2
> **Token Cost:** 9000
> **MCP Connections:** github

## 🎯 What This Skill Does

Build production-ready DevOps pipelines with GitHub Actions, Docker, Kubernetes, Terraform, and ArgoCD. This is the complete 2025 stack for modern infrastructure as code and continuous deployment.

**Core Components:**
- GitHub Actions CI/CD workflows
- Docker multi-stage builds and optimization
- Kubernetes deployments and scaling
- Terraform infrastructure as code
- ArgoCD GitOps deployment
- Monitoring and observability (Prometheus, Grafana)
- Secret management (Vault, AWS Secrets Manager)

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** cicd, github actions, docker, kubernetes, terraform, deploy, gitops
- **File Types:** .yml (GitHub Actions), Dockerfile, .tf (Terraform), .yaml (K8s)
- **Directories:** .github/workflows/, docker/, k8s/, terraform/, infra/

## 🚀 Core Capabilities

### 1. GitHub Actions Workflows

**Philosophy:**
GitHub Actions is the modern CI/CD standard for code hosted on GitHub. It provides deep integration, powerful matrix builds, and a rich ecosystem of actions.

**Project Structure:**

```
.github/
├── workflows/
│   ├── ci.yml              # Continuous integration
│   ├── cd.yml              # Continuous deployment
│   ├── release.yml         # Release automation
│   ├── security.yml        # Security scanning
│   └── pr-checks.yml       # Pull request checks
├── actions/
│   └── custom-action/      # Reusable custom actions
│       ├── action.yml
│       └── index.js
└── CODEOWNERS              # Code ownership
```

**Architecture:**

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint and format check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: Type check
        run: npm run type-check

  # Job 2: Run tests
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['18.x', '20.x']
        os: [ubuntu-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  # Job 3: Build Docker image
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
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
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Job 4: Security scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

# .github/workflows/cd.yml
name: CD Pipeline

on:
  push:
    branches: [main]
    tags:
      - 'v*'

env:
  KUBE_NAMESPACE: production
  DEPLOYMENT_NAME: my-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Install kubectl
        uses: azure/setup-kubectl@v3

      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --region us-east-1 \
            --name production-cluster

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/${{ env.DEPLOYMENT_NAME }} \
            app=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -n ${{ env.KUBE_NAMESPACE }}

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/${{ env.DEPLOYMENT_NAME }} \
            -n ${{ env.KUBE_NAMESPACE }} \
            --timeout=5m

      - name: Verify deployment
        run: |
          kubectl get pods -n ${{ env.KUBE_NAMESPACE }}
          kubectl get services -n ${{ env.KUBE_NAMESPACE }}

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'Deployment to production: ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4.1.0
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false

      - name: Build artifacts
        run: npm run build

      - name: Upload Release Assets
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/app.zip
          asset_name: app-${{ github.ref_name }}.zip
          asset_content_type: application/zip
```

**Reusable Workflows:**

```yaml
# .github/workflows/reusable-deploy.yml
name: Reusable Deploy Workflow

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      namespace:
        required: true
        type: string
    secrets:
      aws_access_key_id:
        required: true
      aws_secret_access_key:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to ${{ inputs.environment }}
        run: |
          echo "Deploying to ${{ inputs.environment }}"
          # Deployment logic here

# Use reusable workflow
# .github/workflows/deploy-staging.yml
name: Deploy Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      namespace: staging
    secrets:
      aws_access_key_id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
      aws_secret_access_key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
```

**Best Practices:**
- Use matrix builds for multi-platform testing
- Cache dependencies for faster builds
- Separate CI and CD workflows
- Use environments for deployment approvals
- Implement security scanning in CI
- Use secrets for sensitive data
- Add status badges to README
- Set up branch protection rules
- Use workflow concurrency controls
- Implement proper error handling

**Common Patterns:**

```yaml
# Conditional execution
- name: Deploy to production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: npm run deploy

# Retry on failure
- name: Flaky test
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm run test:e2e

# Composite action
# .github/actions/setup/action.yml
name: 'Setup Project'
description: 'Setup Node.js and install dependencies'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    - run: npm ci
      shell: bash

# Use composite action
- uses: ./.github/actions/setup
```

**Gotchas:**
- Workflow runs count against billing minutes
- Secrets can't be logged or exposed
- Cache entries expire after 7 days
- Matrix builds multiply job runs
- GitHub-hosted runners have resource limits
- Workflow files must be in default branch to trigger

### 2. Docker Multi-Stage Builds

**Philosophy:**
Multi-stage Docker builds optimize image size and security by separating build dependencies from runtime dependencies. Essential for production deployments.

**Architecture:**

```dockerfile
# Dockerfile (Node.js example)
# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]

# Dockerfile (Go example)
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]

# Dockerfile (Python example)
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

**Best Practices:**
- Use specific image tags (not :latest)
- Implement multi-stage builds for smaller images
- Run containers as non-root user
- Use .dockerignore to exclude unnecessary files
- Add health checks to all services
- Use build cache effectively (COPY package.json before source)
- Scan images for vulnerabilities (Trivy, Snyk)
- Use minimal base images (alpine, distroless)
- Set resource limits in production
- Use docker-compose for local development

**Common Patterns:**

```dockerfile
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
coverage
.next
dist
build

# Build argument pattern
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Layer caching optimization
COPY package*.json ./
RUN npm ci
COPY . .

# Security scanning in CI
docker build -t myapp:latest .
trivy image myapp:latest
```

**Gotchas:**
- Each RUN creates a layer (combine commands)
- Order matters for cache efficiency
- Alpine images may have musl libc issues
- Build args are not secure for secrets
- Volumes persist data between container restarts

### 3. Kubernetes Deployments

**Philosophy:**
Kubernetes provides container orchestration at scale. In 2025, it's the standard for production deployments with features like auto-scaling, self-healing, and rolling updates.

**Architecture:**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: myapp
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      containers:
      - name: app
        image: ghcr.io/myorg/myapp:v1.0.0
        imagePullPolicy: IfNotPresent

        ports:
        - name: http
          containerPort: 3000
          protocol: TCP

        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: myapp-config
              key: redis-url

        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: logs
          mountPath: /app/logs

      volumes:
      - name: config
        configMap:
          name: myapp-config
      - name: logs
        emptyDir: {}

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - myapp
              topologyKey: kubernetes.io/hostname

# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: myapp

# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - myapp.com
    - www.myapp.com
    secretName: myapp-tls
  rules:
  - host: myapp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80

# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max

# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: production
data:
  redis-url: "redis://redis:6379"
  log-level: "info"
  feature-flags: |
    {
      "newFeature": true,
      "betaFeature": false
    }

# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
  namespace: production
type: Opaque
stringData:
  database-url: "postgresql://user:pass@postgres:5432/mydb"
  api-key: "super-secret-key"
```

**Best Practices:**
- Use namespaces for environment separation
- Set resource requests and limits
- Implement health checks (liveness + readiness)
- Use ConfigMaps for configuration
- Use Secrets for sensitive data
- Enable horizontal pod autoscaling
- Use pod disruption budgets for high availability
- Implement pod anti-affinity for resilience
- Use rolling updates for zero-downtime deployments
- Tag images with specific versions (not :latest)

**Common Patterns:**

```bash
# Apply all manifests
kubectl apply -f k8s/

# Update deployment image
kubectl set image deployment/myapp app=ghcr.io/myorg/myapp:v1.0.1 -n production

# Scale deployment
kubectl scale deployment/myapp --replicas=5 -n production

# Check rollout status
kubectl rollout status deployment/myapp -n production

# Rollback deployment
kubectl rollout undo deployment/myapp -n production

# Get logs
kubectl logs -f deployment/myapp -n production

# Execute command in pod
kubectl exec -it deploy/myapp -n production -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/myapp 3000:80 -n production
```

**Gotchas:**
- Missing resource limits can cause node instability
- Liveness probes can create restart loops if misconfigured
- ConfigMap/Secret changes don't auto-reload pods
- Service selectors must match pod labels
- Ingress requires ingress controller installed
- PVC (Persistent Volume Claims) are not deleted with pod

### 4. Terraform Infrastructure as Code

**Philosophy:**
Terraform enables version-controlled, reproducible infrastructure. It's cloud-agnostic and supports hundreds of providers.

**Project Structure:**

```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── versions.tf          # Provider versions
├── terraform.tfvars     # Variable values (gitignored)
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/
│   └── rds/
└── environments/
    ├── dev/
    ├── staging/
    └── prod/
```

**Architecture:**

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "myapp-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnets      = var.public_subnets
  private_subnets     = var.private_subnets
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = "1.28"

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "general"
      }
    }

    spot = {
      desired_size = 2
      min_size     = 0
      max_size     = 5

      instance_types = ["t3.large", "t3a.large"]
      capacity_type  = "SPOT"

      labels = {
        role = "spot"
      }

      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NoSchedule"
      }]
    }
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# Elasticache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  snapshot_retention_limit = 5
  snapshot_window         = "03:00-04:00"

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "assets" {
  bucket = "${var.project_name}-${var.environment}-assets"

  tags = {
    Name = "${var.project_name}-${var.environment}-assets"
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.assets.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.assets.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# terraform/variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# terraform/outputs.tf
output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = false
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  sensitive   = true
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}
```

**Best Practices:**
- Use remote state backend (S3 + DynamoDB)
- Enable state locking
- Use modules for reusable components
- Separate environments with workspaces or directories
- Use variables for all configurable values
- Tag all resources consistently
- Enable encryption at rest
- Use data sources to reference existing resources
- Run `terraform plan` before `apply`
- Use `terraform fmt` and `terraform validate`

**Common Commands:**

```bash
# Initialize Terraform
terraform init

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy resources
terraform destroy

# Show current state
terraform show

# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0

# Refresh state
terraform refresh

# Output values
terraform output
```

**Gotchas:**
- State files contain sensitive data (secure them)
- Changing resource names causes resource recreation
- Some resources can't be imported
- Circular dependencies cause errors
- Provider version changes can break configuration

### 5. ArgoCD GitOps

**Philosophy:**
ArgoCD implements GitOps for Kubernetes, where Git is the single source of truth for declarative infrastructure and applications.

**Architecture:**

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production

  source:
    repoURL: https://github.com/myorg/myapp
    targetRevision: main
    path: k8s/overlays/production

    kustomize:
      images:
        - ghcr.io/myorg/myapp:v1.0.0

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false

    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true

    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  revisionHistoryLimit: 10

# argocd/appproject.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production applications

  sourceRepos:
    - https://github.com/myorg/*

  destinations:
    - namespace: production
      server: https://kubernetes.default.svc

  clusterResourceWhitelist:
    - group: '*'
      kind: '*'

  namespaceResourceWhitelist:
    - group: '*'
      kind: '*'

  roles:
    - name: admin
      description: Admin privileges
      policies:
        - p, proj:production:admin, applications, *, production/*, allow
      groups:
        - platform-team

    - name: readonly
      description: Read-only access
      policies:
        - p, proj:production:readonly, applications, get, production/*, allow
      groups:
        - developers
```

**Kustomize Structure:**

```
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patches/
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
            ├── replicas.yaml
            └── resources.yaml
```

```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - ingress.yaml

commonLabels:
  app: myapp

# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namespace: production

images:
  - name: ghcr.io/myorg/myapp
    newTag: v1.0.0

replicas:
  - name: myapp
    count: 3

patches:
  - path: patches/replicas.yaml
  - path: patches/resources.yaml

configMapGenerator:
  - name: myapp-config
    literals:
      - LOG_LEVEL=info
      - ENVIRONMENT=production

secretGenerator:
  - name: myapp-secrets
    envs:
      - secrets.env
```

**Best Practices:**
- Use declarative manifests in Git
- Implement branch-based environments
- Enable automated sync with self-heal
- Use Kustomize or Helm for templating
- Implement RBAC with AppProjects
- Use webhooks for faster sync
- Enable Slack/email notifications
- Use health checks and sync waves
- Implement progressive delivery with Argo Rollouts
- Monitor sync status and drift

**Common Commands:**

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Port forward to UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Login CLI
argocd login localhost:8080 --insecure

# Create application
argocd app create myapp --repo https://github.com/myorg/myapp --path k8s --dest-server https://kubernetes.default.svc --dest-namespace production

# Sync application
argocd app sync myapp

# Check status
argocd app get myapp

# List applications
argocd app list

# Delete application
argocd app delete myapp
```

**Gotchas:**
- Initial admin password is auto-generated
- Sync can fail if manifests are invalid
- Automated sync can hide configuration errors
- Prune can delete resources unexpectedly
- Large repos can slow sync times

## 💡 Real-World Examples

### Example 1: Complete CI/CD Pipeline

End-to-end pipeline from code to production.

```yaml
# .github/workflows/complete-pipeline.yml
name: Complete Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build

  build-image:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-image
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Update ArgoCD application
        run: |
          # Update image tag in Kustomize
          cd k8s/overlays/staging
          kustomize edit set image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Update staging to ${{ github.sha }}"
          git push

  deploy-production:
    needs: build-image
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://myapp.com
    steps:
      - uses: actions/checkout@v4
      - name: Update ArgoCD application
        run: |
          cd k8s/overlays/production
          kustomize edit set image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Deploy to production: ${{ github.sha }}"
          git push
```

### Example 2: Infrastructure Provisioning

Complete infrastructure setup with Terraform and GitHub Actions.

```hcl
# terraform/environments/production/main.tf
module "infrastructure" {
  source = "../../"

  environment  = "production"
  project_name = "myapp"

  aws_region = "us-east-1"

  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  db_instance_class = "db.t3.medium"
  redis_node_type   = "cache.t3.medium"
}
```

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
  pull_request:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: terraform/environments/production

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Terraform Init
        run: terraform init

      - name: Terraform Format
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        id: plan
        if: github.event_name == 'pull_request'
        run: terraform plan -no-color
        continue-on-error: true

      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const output = `#### Terraform Plan
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve
```

## 🔗 Related Skills

- **docker-optimization** - Advanced Docker patterns
- **kubernetes-advanced** - Service mesh, Istio
- **monitoring-stack** - Prometheus, Grafana
- **security-hardening** - Container security

## 📖 Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [The Twelve-Factor App](https://12factor.net/)
- [GitOps Principles](https://opengitops.dev/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
