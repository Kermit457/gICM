# gICM Environment Variables Setup Guide

> **Comprehensive guide for setting up all environment variables for gICM marketplace**
> Last Updated: 2025-11-09

---

## 🎯 Quick Start

For local development, you only need the basics. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

**Minimum required** for local development: **NONE** - the app works without any env vars!

**Recommended** for full features:
- `NEXT_PUBLIC_SITE_URL` - For share links
- `ANALYTICS_PASSWORD` - To access `/analytics` dashboard

---

## 📋 Table of Contents

1. [Core Application](#core-application)
2. [Analytics & Tracking](#analytics--tracking)
3. [Database](#database)
4. [Email Service](#email-service)
5. [Blockchain RPC Endpoints](#blockchain-rpc-endpoints)
6. [MCP Integrations (66 Total)](#mcp-integrations-66-total)
   - [Blockchain MCPs](#blockchain-mcps)
   - [Cloud Platform MCPs](#cloud-platform-mcps)
   - [Database MCPs](#database-mcps)
   - [DevOps MCPs](#devops-mcps)
   - [AI/ML MCPs](#aiml-mcps)
   - [Monitoring MCPs](#monitoring-mcps)
   - [Communication MCPs](#communication-mcps)
   - [Security MCPs](#security-mcps)
   - [Other MCPs](#other-mcps)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Core Application

### Basic Configuration

```env
# Site URL (required for share links, og:image, etc.)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Node Environment
NODE_ENV=development

# Analytics Dashboard Password
ANALYTICS_PASSWORD=your-secure-password-here
```

**Notes:**
- `NEXT_PUBLIC_SITE_URL`: Use `http://localhost:3000` locally, `https://yourdomain.com` in production
- `ANALYTICS_PASSWORD`: Access `/analytics` page (default: not set, page is public)

---

## 📊 Analytics & Tracking

### Optional Analytics Services

```env
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Plausible Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Mixpanel (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
- Google Analytics: https://analytics.google.com/
- Plausible: https://plausible.io/
- PostHog: https://posthog.com/
- Mixpanel: https://mixpanel.com/

---

## 🗄️ Database

### Upstash Redis (for caching, session storage)

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Sign up at https://upstash.com/
2. Create a Redis database
3. Copy REST URL and Token from dashboard
4. Used for: Caching stack configs, rate limiting, session data

**Free Tier:** 10,000 commands/day

---

## 📧 Email Service

### Resend (Recommended)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**How to get:**
1. Sign up at https://resend.com/
2. Verify your domain
3. Create API key in dashboard
4. Used for: Waitlist confirmation emails

**Free Tier:** 3,000 emails/month

### Alternative: SendGrid

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**How to get:**
1. Sign up at https://sendgrid.com/
2. Create API key
3. Verify sender identity

**Free Tier:** 100 emails/day

---

## ⛓️ Blockchain RPC Endpoints

### Solana

```env
# Helius (Recommended - most reliable)
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_API_KEY
HELIUS_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# Alternative: QuickNode
SOLANA_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/xxxxxxxxx/

# Alternative: Alchemy
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Alternative: Public (not recommended for production)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**How to get:**
- Helius: https://helius.xyz/ (Free: 100k credits/month)
- QuickNode: https://quicknode.com/ (Free trial available)
- Alchemy: https://alchemy.com/ (Free: 300M compute units/month)

### Ethereum / EVM

```env
# Alchemy (Recommended)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ALCHEMY_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# Infura
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
INFURA_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# QuickNode
ETHEREUM_RPC_URL=https://your-endpoint.ethereum-mainnet.quiknode.pro/xxxxxxxxx/
```

**How to get:**
- Alchemy: https://alchemy.com/
- Infura: https://infura.io/
- QuickNode: https://quicknode.com/

### Network-Specific RPC URLs

```env
# Polygon
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Arbitrum
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optimism
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Base
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# BSC
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
```

---

## 🔌 MCP Integrations (66 Total)

> **Note:** These are only needed if you're using the corresponding MCP server. Most are optional for basic gICM functionality.

### Blockchain MCPs

#### Alchemy
```env
ALCHEMY_API_KEY=xxxxxxxxxxxxxxxxxxxxx
ALCHEMY_NETWORK=eth-mainnet  # or polygon, arbitrum, opt, base
```
Get from: https://alchemy.com/

#### Infura
```env
INFURA_API_KEY=xxxxxxxxxxxxxxxxxxxxx
INFURA_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://infura.io/

#### QuickNode
```env
QUICKNODE_ENDPOINT=https://your-endpoint.quiknode.pro/xxxxxxxxx/
QUICKNODE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://quicknode.com/

#### The Graph
```env
THEGRAPH_API_KEY=xxxxxxxxxxxxxxxxxxxxx
THEGRAPH_DEPLOY_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://thegraph.com/

#### Tenderly
```env
TENDERLY_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
TENDERLY_PROJECT_SLUG=your-project
TENDERLY_ACCOUNT_SLUG=your-account
```
Get from: https://tenderly.co/

#### Helius
```env
HELIUS_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://helius.xyz/

---

### Cloud Platform MCPs

#### AWS
```env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```
Get from: AWS IAM Console (https://console.aws.amazon.com/iam/)

#### Azure
```env
AZURE_TENANT_ID=xxxxxxxxxxxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
AZURE_SUBSCRIPTION_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: Azure Portal (https://portal.azure.com/)

#### GCP
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id
```
Get from: GCP Console (https://console.cloud.google.com/)

#### Cloudflare
```env
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_ZONE_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://dash.cloudflare.com/

#### Vercel
```env
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
VERCEL_TEAM_ID=team_xxxxxxxxxxxxx  # optional
```
Get from: https://vercel.com/account/tokens

#### Netlify
```env
NETLIFY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
NETLIFY_SITE_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://app.netlify.com/user/applications

#### Railway
```env
RAILWAY_TOKEN=xxxxxxxxxxxxxxxxxxxxx
RAILWAY_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://railway.app/account/tokens

---

### Database MCPs

#### Supabase
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxx  # server-side only
```
Get from: https://app.supabase.com/ → Project Settings → API

#### PostgreSQL
```env
POSTGRES_URL=postgresql://user:password@host:5432/database
# or individual components
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=xxxxxxxxxxxxxxxxxxxxx
POSTGRES_DATABASE=gicm
```

#### MongoDB
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
# or
MONGODB_URL=mongodb://localhost:27017/gicm
```
Get from: https://cloud.mongodb.com/

#### Neon
```env
NEON_DATABASE_URL=postgres://user:password@ep-xxx.us-east-2.aws.neon.tech/database
```
Get from: https://console.neon.tech/

#### PlanetScale
```env
PLANETSCALE_DATABASE_URL=mysql://user:password@aws.connect.psdb.cloud/database
PLANETSCALE_ORG=your-org
PLANETSCALE_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://app.planetscale.com/

#### Prisma
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```
Used with any database, see: https://www.prisma.io/

#### Redis
```env
REDIS_URL=redis://localhost:6379
# or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=xxxxxxxxxxxxxxxxxxxxx
```

#### Upstash (Redis)
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://console.upstash.com/

---

### DevOps MCPs

#### Docker
```env
DOCKER_HOST=unix:///var/run/docker.sock
# For remote Docker
DOCKER_HOST=tcp://remote-docker-host:2376
DOCKER_CERT_PATH=/path/to/certs
DOCKER_TLS_VERIFY=1
```

#### Kubernetes
```env
KUBECONFIG=/path/to/kubeconfig
# or for specific cluster
K8S_API_SERVER=https://kubernetes.default.svc
K8S_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

#### GitHub
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo
```
Get from: https://github.com/settings/tokens

#### GitLab
```env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxxx
GITLAB_URL=https://gitlab.com  # or self-hosted URL
GITLAB_PROJECT_ID=12345
```
Get from: https://gitlab.com/-/profile/personal_access_tokens

#### E2B (Code Execution)
```env
E2B_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://e2b.dev/

---

### AI/ML MCPs

#### Anthropic
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://console.anthropic.com/

#### OpenAI
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxxxxx  # optional
```
Get from: https://platform.openai.com/api-keys

#### Replicate
```env
REPLICATE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://replicate.com/account/api-tokens

#### Together AI
```env
TOGETHER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://api.together.xyz/settings/api-keys

#### Groq
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://console.groq.com/keys

#### Hugging Face
```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://huggingface.co/settings/tokens

---

### Monitoring MCPs

#### Datadog
```env
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxxx
DATADOG_APP_KEY=xxxxxxxxxxxxxxxxxxxxx
DATADOG_SITE=datadoghq.com  # or datadoghq.eu
```
Get from: https://app.datadoghq.com/organization-settings/api-keys

#### Grafana
```env
GRAFANA_URL=https://your-instance.grafana.net
GRAFANA_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: Your Grafana instance → Configuration → API Keys

#### Sentry
```env
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxx@sentry.io/1234567
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://sentry.io/settings/

#### PostHog
```env
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com
```
Get from: https://app.posthog.com/project/settings

#### Mixpanel
```env
MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
MIXPANEL_SECRET=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://mixpanel.com/settings/project

#### New Relic
```env
NEW_RELIC_LICENSE_KEY=xxxxxxxxxxxxxxxxxxxxx
NEW_RELIC_APP_NAME=gICM
```
Get from: https://one.newrelic.com/api-keys

---

### Communication MCPs

#### Slack
```env
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxx
SLACK_APP_TOKEN=xapp-xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://api.slack.com/apps

#### Discord
```env
DISCORD_BOT_TOKEN=xxxxxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://discord.com/developers/applications

#### Twilio
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```
Get from: https://console.twilio.com/

#### SendGrid
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://app.sendgrid.com/settings/api_keys

---

### Security MCPs

#### Infisical (Secrets Management)
```env
INFISICAL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
INFISICAL_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://app.infisical.com/

#### Snyk (Vulnerability Scanning)
```env
SNYK_TOKEN=xxxxxxxxxxxxxxxxxxxxx
SNYK_ORG_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://app.snyk.io/account

#### Logto (Authentication)
```env
LOGTO_ENDPOINT=https://your-app.logto.app
LOGTO_APP_ID=xxxxxxxxxxxxxxxxxxxxx
LOGTO_APP_SECRET=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://cloud.logto.io/

---

### Other MCPs

#### Stripe (Payments)
```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx  # or sk_live_
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx  # or pk_live_
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://dashboard.stripe.com/apikeys

#### Figma (Design)
```env
FIGMA_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://www.figma.com/developers/api

#### Jira
```env
JIRA_HOST=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://id.atlassian.com/manage-profile/security/api-tokens

#### Linear
```env
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxx
LINEAR_TEAM_ID=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://linear.app/settings/api

#### Temporal
```env
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
# For Temporal Cloud
TEMPORAL_CLOUD_NAMESPACE=your-namespace.account
TEMPORAL_CLOUD_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```
Get from: https://cloud.temporal.io/

#### N8N (Workflow Automation)
```env
N8N_API_KEY=xxxxxxxxxxxxxxxxxxxxx
N8N_BASE_URL=https://your-instance.n8n.cloud
```
Get from: Your N8N instance settings

---

## 🚀 Production Deployment

### Vercel

1. **Add environment variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add each variable with appropriate scope (Production, Preview, Development)

2. **Required for production:**
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
ANALYTICS_PASSWORD=your-secure-password
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

3. **Deploy:**
```bash
vercel --prod
```

### Netlify

1. **Add environment variables:**
   - Go to Site settings → Environment variables
   - Add variables

2. **Build settings:**
```
Build command: npm run build
Publish directory: .next
```

### Self-Hosted

1. **Create `.env.production.local`:**
```env
# Copy from .env.local and update URLs
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# ... other production values
```

2. **Build and start:**
```bash
npm run build
npm run start
```

---

## 🔧 Troubleshooting

### Common Issues

**Q: App won't start**
- Check that `.env.local` has no syntax errors
- Verify all URLs are properly formatted
- Restart dev server after adding new env vars

**Q: Analytics not working**
- Verify `NEXT_PUBLIC_SITE_URL` is set
- Check that analytics keys start with `NEXT_PUBLIC_`
- Public env vars must be prefixed with `NEXT_PUBLIC_`

**Q: MCP not connecting**
- Verify API key is correct
- Check that service is not rate-limited
- Review MCP-specific documentation

**Q: Email not sending**
- Verify email service credentials
- Check that sending domain is verified
- Review email service logs

**Q: RPC errors**
- Try alternative RPC provider
- Check API key limits
- Verify network is correct (mainnet vs testnet)

### Environment Variable Priority

1. `.env.local` (highest priority, gitignored)
2. `.env.production` or `.env.development`
3. `.env`

**Never commit:**
- `.env.local`
- `.env.production.local`
- `.env.development.local`

**Safe to commit:**
- `.env.example`
- `.env.local.example`

---

## 📝 .env.local Template

Copy this as your starting point:

```env
# ========================================
# gICM Environment Variables
# ========================================

# CORE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# ANALYTICS (optional)
ANALYTICS_PASSWORD=admin123
# NEXT_PUBLIC_GA_ID=
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_MIXPANEL_TOKEN=

# DATABASE (optional)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# EMAIL (optional)
# RESEND_API_KEY=
# RESEND_FROM_EMAIL=

# BLOCKCHAIN RPC (optional)
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# ETHEREUM_RPC_URL=
# HELIUS_API_KEY=
# ALCHEMY_API_KEY=
# INFURA_API_KEY=

# MCP INTEGRATIONS (add as needed)
# See full list above

```

---

## 🎓 Best Practices

1. **Use `.env.local` for local development** - This file is gitignored
2. **Never commit sensitive keys** - Use `.env.example` as template
3. **Rotate keys regularly** - Especially for production
4. **Use different keys for dev/prod** - Keep environments separate
5. **Verify provider free tiers** - Avoid unexpected costs
6. **Monitor API usage** - Set up billing alerts
7. **Use managed secrets in production** - Vercel/Netlify env vars, AWS Secrets Manager, etc.

---

**Questions?** Open an issue or check the docs.

**Built with ❤️ by ICM Motion**

Last updated: 2025-11-09
