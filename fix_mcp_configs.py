#!/usr/bin/env python3
"""
Fix MCP configuration files by adding comments for non-existent packages
"""

import json
import os
from pathlib import Path

MCP_DIR = Path(r"C:\Users\mirko\OneDrive\Desktop\gICM\.claude\mcp")

# Packages that EXIST on npm (verified)
REAL_PACKAGES = {
    "@modelcontextprotocol/server-aws-kb-retrieval",
    "@modelcontextprotocol/server-brave-search",
    "@modelcontextprotocol/server-everything",
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-github",
    "@modelcontextprotocol/server-gitlab",
    "@modelcontextprotocol/server-google-maps",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-postgres",
    "@modelcontextprotocol/server-puppeteer",
    "@modelcontextprotocol/server-redis",
    "@modelcontextprotocol/server-sequential-thinking",
    "@modelcontextprotocol/server-slack",
}

# Fix recommendations for non-existent packages
FIX_MAP = {
    # Web3/Blockchain - API services, not MCP packages
    "@modelcontextprotocol/server-alchemy": {
        "status": "API_SERVICE",
        "comment": "⚠️ Alchemy is an RPC provider API service, not an MCP package.",
        "note": "Use Alchemy SDK or REST API for blockchain RPC access (Ethereum, Polygon, etc.)",
        "alternative": "Custom implementation using @alch/alchemy-sdk or HTTP client"
    },
    "@modelcontextprotocol/server-infura": {
        "status": "API_SERVICE",
        "comment": "⚠️ Infura is an RPC provider API service, not an MCP package.",
        "note": "Use Infura endpoints directly via Web3.js or ethers.js",
        "alternative": "Custom implementation with web3.js/ethers.js"
    },
    "@modelcontextprotocol/server-quicknode": {
        "status": "API_SERVICE",
        "comment": "⚠️ QuickNode is an RPC provider, not an MCP package.",
        "note": "Use QuickNode RPC endpoints with web3 libraries",
        "alternative": "Custom implementation with web3.js"
    },
    "@modelcontextprotocol/server-thegraph": {
        "status": "API_SERVICE",
        "comment": "⚠️ The Graph is a GraphQL query protocol, not an MCP package.",
        "note": "Use GraphQL client to query subgraphs",
        "alternative": "Custom implementation with graphql-request"
    },
    "@modelcontextprotocol/server-chainstack": {
        "status": "API_SERVICE",
        "comment": "⚠️ Chainstack is an infrastructure provider, not an MCP package.",
        "note": "Use Chainstack RPC endpoints",
        "alternative": "Custom HTTP integration"
    },
    "@modelcontextprotocol/server-tenderly": {
        "status": "API_SERVICE",
        "comment": "⚠️ Tenderly is a debugging/monitoring platform, not an MCP package.",
        "note": "Use Tenderly REST API for transaction simulation and monitoring",
        "alternative": "Custom implementation with Tenderly API"
    },
    "@modelcontextprotocol/server-web3-multichain": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ Package does not exist on npm.",
        "note": "Implement custom multi-chain integration",
        "alternative": "Build using ethers.js/web3.js with multiple providers"
    },
    "@modelcontextprotocol/server-solana-agent-kit": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ Package does not exist on npm.",
        "note": "Use Solana Web3.js SDK directly",
        "alternative": "@solana/web3.js with custom integration"
    },

    # Databases
    "@modelcontextprotocol/server-mongodb": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official MongoDB MCP server exists.",
        "note": "Use MongoDB driver directly or consider @modelcontextprotocol/server-postgres for SQL needs",
        "alternative": "mongodb npm package with custom integration"
    },
    "@modelcontextprotocol/server-planetscale": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official PlanetScale MCP server exists.",
        "note": "PlanetScale is MySQL-compatible - use MySQL client",
        "alternative": "@planetscale/database with custom integration"
    },
    "@modelcontextprotocol/server-postgresql": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Use @modelcontextprotocol/server-postgres instead (v0.6.2 exists).",
        "note": "The 'postgres' package covers PostgreSQL",
        "alternative": "@modelcontextprotocol/server-postgres"
    },
    "@modelcontextprotocol/server-sqlite": {
        "status": "PLACEHOLDER",
        "comment": "⚠️ Package does not exist on npm yet.",
        "note": "Use @modelcontextprotocol/server-filesystem for SQLite file access, or implement with better-sqlite3",
        "alternative": "@modelcontextprotocol/server-filesystem or better-sqlite3"
    },

    # Development Services
    "@modelcontextprotocol/server-supabase": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Supabase MCP server exists.",
        "note": "Use @modelcontextprotocol/server-postgres for database, or Supabase SDK for full features",
        "alternative": "@supabase/supabase-js with custom integration"
    },
    "@modelcontextprotocol/server-prisma": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ Prisma is an ORM, not an MCP server.",
        "note": "Use database MCP servers directly or Prisma Client in your code",
        "alternative": "@prisma/client with custom integration"
    },
    "@modelcontextprotocol/server-docker": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Docker MCP server exists.",
        "note": "Use Docker SDK or CLI",
        "alternative": "dockerode npm package"
    },
    "@modelcontextprotocol/server-kubernetes": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Kubernetes MCP server exists.",
        "note": "Use kubectl or Kubernetes client libraries",
        "alternative": "@kubernetes/client-node"
    },

    # Cloud Providers
    "@modelcontextprotocol/server-aws": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Generic AWS server doesn't exist. Use AWS-specific servers.",
        "note": "For AWS Bedrock Knowledge Base, use @modelcontextprotocol/server-aws-kb-retrieval",
        "alternative": "@modelcontextprotocol/server-aws-kb-retrieval"
    },
    "@modelcontextprotocol/server-aws-bedrock": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Use @modelcontextprotocol/server-aws-kb-retrieval instead.",
        "note": "The aws-kb-retrieval package covers Bedrock Knowledge Base",
        "alternative": "@modelcontextprotocol/server-aws-kb-retrieval"
    },
    "@modelcontextprotocol/server-gcp": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official GCP MCP server exists.",
        "note": "Use Google Cloud client libraries",
        "alternative": "@google-cloud/* packages"
    },
    "@modelcontextprotocol/server-azure": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Azure MCP server exists.",
        "note": "Use Azure SDK",
        "alternative": "@azure/* packages"
    },
    "@modelcontextprotocol/server-cloudflare": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Cloudflare MCP server exists.",
        "note": "Use Cloudflare API",
        "alternative": "Custom implementation with Cloudflare API"
    },
    "@modelcontextprotocol/server-vercel": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Vercel MCP server exists.",
        "note": "Use Vercel API",
        "alternative": "@vercel/client"
    },
    "@modelcontextprotocol/server-netlify": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Netlify MCP server exists.",
        "note": "Use Netlify API",
        "alternative": "netlify npm package"
    },
    "@modelcontextprotocol/server-railway": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Railway MCP server exists.",
        "note": "Use Railway API",
        "alternative": "Custom Railway API integration"
    },
    "@modelcontextprotocol/server-google-cloud-run": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Google Cloud Run MCP server exists.",
        "note": "Use Google Cloud SDK",
        "alternative": "@google-cloud/run"
    },

    # Productivity Tools
    "@modelcontextprotocol/server-notion": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Notion MCP server exists.",
        "note": "Use Notion API SDK",
        "alternative": "@notionhq/client"
    },
    "@modelcontextprotocol/server-linear": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Linear MCP server exists.",
        "note": "Use Linear SDK or GraphQL API",
        "alternative": "@linear/sdk"
    },
    "@modelcontextprotocol/server-jira": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Jira MCP server exists.",
        "note": "Use Atlassian REST API",
        "alternative": "jira-client npm package"
    },
    "@modelcontextprotocol/server-figma": {
        "status": "USE_COMMUNITY",
        "comment": "⚠️ No official MCP server, but community package exists.",
        "note": "Use figma-mcp (v0.1.4) community package or Figma API",
        "alternative": "figma-mcp (community) or figma-api npm package"
    },
    "@modelcontextprotocol/server-airtable": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Airtable MCP server exists.",
        "note": "Use Airtable API",
        "alternative": "airtable npm package"
    },

    # Communication
    "@modelcontextprotocol/server-discord": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Discord MCP server exists.",
        "note": "Use Discord.js for bot integration",
        "alternative": "discord.js"
    },
    "@modelcontextprotocol/server-twilio": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official Twilio MCP server exists.",
        "note": "Use Twilio SDK",
        "alternative": "twilio npm package"
    },
    "@modelcontextprotocol/server-sendgrid": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ No official SendGrid MCP server exists.",
        "note": "Use SendGrid API",
        "alternative": "@sendgrid/mail"
    },

    # AI/LLM Services
    "@modelcontextprotocol/server-openai": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ No MCP server needed - use OpenAI SDK directly.",
        "note": "OpenAI API should be used directly in your application",
        "alternative": "openai npm package"
    },
    "@modelcontextprotocol/server-openai-image": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ No MCP server needed - use OpenAI SDK for DALL-E.",
        "note": "Use OpenAI SDK directly for image generation",
        "alternative": "openai npm package"
    },
    "@modelcontextprotocol/server-anthropic": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ No MCP server needed - use Anthropic SDK directly.",
        "note": "Use @anthropic-ai/sdk for Claude API access",
        "alternative": "@anthropic-ai/sdk"
    },
    "@modelcontextprotocol/server-groq": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Groq SDK directly.",
        "note": "Groq API integration via SDK",
        "alternative": "groq-sdk npm package"
    },
    "@modelcontextprotocol/server-together-ai": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Together AI SDK directly.",
        "note": "Together AI API integration",
        "alternative": "Custom HTTP client for Together AI API"
    },
    "@modelcontextprotocol/server-replicate": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Replicate SDK directly.",
        "note": "Replicate API for ML models",
        "alternative": "replicate npm package"
    },
    "@modelcontextprotocol/server-huggingface": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Hugging Face Hub API directly.",
        "note": "Hugging Face inference and models",
        "alternative": "@huggingface/inference"
    },
    "@modelcontextprotocol/server-perplexity": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Perplexity API directly.",
        "note": "Perplexity search API",
        "alternative": "Custom HTTP client for Perplexity API"
    },

    # Monitoring/Analytics
    "@modelcontextprotocol/server-sentry": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Sentry SDK directly.",
        "note": "Sentry error tracking",
        "alternative": "@sentry/node"
    },
    "@modelcontextprotocol/server-datadog": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Datadog API/SDK directly.",
        "note": "Datadog monitoring",
        "alternative": "dd-trace or Datadog API"
    },
    "@modelcontextprotocol/server-posthog": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use PostHog SDK directly.",
        "note": "PostHog analytics",
        "alternative": "posthog-node"
    },
    "@modelcontextprotocol/server-mixpanel": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Mixpanel SDK directly.",
        "note": "Mixpanel analytics",
        "alternative": "mixpanel npm package"
    },
    "@modelcontextprotocol/server-grafana": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Grafana API directly.",
        "note": "Grafana dashboards and metrics",
        "alternative": "Custom HTTP client for Grafana API"
    },

    # Payment
    "@modelcontextprotocol/server-stripe": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Stripe SDK directly.",
        "note": "Stripe payment processing",
        "alternative": "stripe npm package"
    },

    # Vector/Search
    "@modelcontextprotocol/server-pinecone": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Pinecone SDK directly.",
        "note": "Pinecone vector database",
        "alternative": "@pinecone-database/pinecone"
    },
    "@modelcontextprotocol/server-elasticsearch": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Elasticsearch client directly.",
        "note": "Elasticsearch search",
        "alternative": "@elastic/elasticsearch"
    },
    "@modelcontextprotocol/server-vectara": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Vectara API directly.",
        "note": "Vectara search platform",
        "alternative": "Custom HTTP client for Vectara API"
    },

    # Other Services
    "@modelcontextprotocol/server-context7": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ Custom implementation required.",
        "note": "Context7 integration",
        "alternative": "Custom integration"
    },
    "@modelcontextprotocol/server-e2b": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use E2B SDK directly.",
        "note": "E2B code execution sandbox",
        "alternative": "@e2b/sdk"
    },
    "@modelcontextprotocol/server-hasura": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use GraphQL client for Hasura.",
        "note": "Hasura GraphQL engine",
        "alternative": "graphql-request or apollo-client"
    },
    "@modelcontextprotocol/server-temporal": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Temporal SDK directly.",
        "note": "Temporal workflow engine",
        "alternative": "@temporalio/client"
    },
    "@modelcontextprotocol/server-n8n": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use n8n API directly.",
        "note": "n8n workflow automation",
        "alternative": "Custom HTTP client for n8n API"
    },
    "@modelcontextprotocol/server-retool": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Retool API directly.",
        "note": "Retool internal tools",
        "alternative": "Custom HTTP client for Retool API"
    },
    "@modelcontextprotocol/server-launchdarkly": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use LaunchDarkly SDK directly.",
        "note": "LaunchDarkly feature flags",
        "alternative": "launchdarkly-node-server-sdk"
    },
    "@modelcontextprotocol/server-langsmith": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use LangSmith SDK directly.",
        "note": "LangSmith LLM observability",
        "alternative": "langsmith npm package"
    },
    "@modelcontextprotocol/server-langfuse": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Langfuse SDK directly.",
        "note": "Langfuse LLM engineering platform",
        "alternative": "langfuse npm package"
    },
    "@modelcontextprotocol/server-logto": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Logto SDK directly.",
        "note": "Logto authentication",
        "alternative": "@logto/node"
    },
    "@modelcontextprotocol/server-infisical": {
        "status": "SDK_DIRECT",
        "comment": "⚠️ Use Infisical SDK directly.",
        "note": "Infisical secrets management",
        "alternative": "@infisical/sdk"
    },
    "@modelcontextprotocol/server-snyk": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Snyk API directly.",
        "note": "Snyk security scanning",
        "alternative": "snyk npm package or API"
    },
    "@modelcontextprotocol/server-bytebase": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Bytebase API directly.",
        "note": "Bytebase database DevOps",
        "alternative": "Custom HTTP client for Bytebase API"
    },
    "@modelcontextprotocol/server-metabase": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Metabase API directly.",
        "note": "Metabase BI tool",
        "alternative": "Custom HTTP client for Metabase API"
    },
    "@modelcontextprotocol/server-upstash": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Use @modelcontextprotocol/server-redis or Upstash SDK.",
        "note": "Upstash is Redis-compatible",
        "alternative": "@modelcontextprotocol/server-redis or @upstash/redis"
    },
    "@modelcontextprotocol/server-warp": {
        "status": "CUSTOM_REQUIRED",
        "comment": "⚠️ Warp terminal - custom implementation needed.",
        "note": "Terminal automation",
        "alternative": "Custom implementation"
    },
    "@modelcontextprotocol/server-circleci": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use CircleCI API directly.",
        "note": "CircleCI CI/CD",
        "alternative": "Custom HTTP client for CircleCI API"
    },
    "@modelcontextprotocol/server-google-drive": {
        "status": "PLACEHOLDER",
        "comment": "⚠️ Package does not exist on npm yet.",
        "note": "Use Google Drive API via googleapis",
        "alternative": "googleapis npm package (drive v3 API)"
    },
    "@modelcontextprotocol/server-git": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Use @modelcontextprotocol/server-github instead.",
        "note": "The GitHub server covers Git operations",
        "alternative": "@modelcontextprotocol/server-github"
    },
    "@modelcontextprotocol/server-playwright": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Use @modelcontextprotocol/server-puppeteer instead.",
        "note": "Puppeteer server provides similar browser automation (v2025.5.12)",
        "alternative": "@modelcontextprotocol/server-puppeteer"
    },
    "@modelcontextprotocol/server-fetch": {
        "status": "PLACEHOLDER",
        "comment": "⚠️ Package does not exist on npm yet (reference server only).",
        "note": "Use node-fetch or built-in fetch API",
        "alternative": "node-fetch or native fetch"
    },
    "@modelcontextprotocol/server-firecrawl": {
        "status": "API_SERVICE",
        "comment": "⚠️ Use Firecrawl API or puppeteer server.",
        "note": "Web scraping service",
        "alternative": "@modelcontextprotocol/server-puppeteer or firecrawl-api"
    },
    "@modelcontextprotocol/server-neon": {
        "status": "USE_ALTERNATIVE",
        "comment": "⚠️ Neon is Postgres-compatible. Use postgres server.",
        "note": "Neon serverless Postgres",
        "alternative": "@modelcontextprotocol/server-postgres"
    },
}


def fix_config(config_file: Path):
    """Add warning comments to configs with non-existent packages"""

    with open(config_file, 'r', encoding='utf-8') as f:
        config = json.load(f)

    # Extract package name from args
    if 'mcpServers' in config:
        for server_name, server_config in config['mcpServers'].items():
            if 'args' in server_config and isinstance(server_config['args'], list):
                # Find @modelcontextprotocol package in args
                package_name = None
                for arg in server_config['args']:
                    if isinstance(arg, str) and arg.startswith('@modelcontextprotocol/server-'):
                        package_name = arg
                        break

                if package_name:
                    if package_name in REAL_PACKAGES:
                        # Package exists - add confirmation comment
                        if '_comment' not in config:
                            config['_comment'] = f"✅ {package_name} exists on npm"
                            config['_status'] = "VALID_PACKAGE"
                    elif package_name in FIX_MAP:
                        # Package doesn't exist - add fix info
                        fix_info = FIX_MAP[package_name]
                        config['_comment'] = fix_info['comment']
                        config['_note'] = fix_info['note']
                        config['_alternative'] = fix_info['alternative']
                        config['_status'] = fix_info['status']

    # Write back with pretty formatting
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write('\n')

    return config


def main():
    """Process all MCP config files"""

    valid = []
    invalid = []
    custom_needed = []

    for config_file in sorted(MCP_DIR.glob('*.json')):
        if config_file.name.endswith('-README.md'):
            continue

        try:
            config = fix_config(config_file)

            status = config.get('_status', 'UNKNOWN')

            if status == 'VALID_PACKAGE':
                valid.append(config_file.name)
            elif status in ['CUSTOM_REQUIRED', 'SDK_DIRECT', 'API_SERVICE', 'USE_COMMUNITY']:
                custom_needed.append((config_file.name, status, config.get('_alternative', 'N/A')))
            else:
                invalid.append((config_file.name, status, config.get('_alternative', 'N/A')))

            print(f"✓ Fixed {config_file.name}")

        except Exception as e:
            print(f"✗ Error processing {config_file.name}: {e}")

    print("\n" + "="*80)
    print("AUDIT SUMMARY")
    print("="*80)
    print(f"\n✅ Valid packages ({len(valid)}):")
    for name in valid:
        print(f"   - {name}")

    print(f"\n🔄 Invalid/Alternative packages ({len(invalid)}):")
    for name, status, alt in invalid:
        print(f"   - {name} [{status}] → {alt}")

    print(f"\n⚠️  Custom implementation needed ({len(custom_needed)}):")
    for name, status, alt in custom_needed:
        print(f"   - {name} [{status}] → {alt}")


if __name__ == '__main__':
    main()
