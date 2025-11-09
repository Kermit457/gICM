#!/usr/bin/env python3
"""
Fix registry.ts install commands for non-existent MCP packages
"""

import re
from pathlib import Path

REGISTRY_FILE = Path(r"C:\Users\mirko\OneDrive\Desktop\gICM\src\lib\registry.ts")

# Map of non-existent packages to their fixes
INSTALL_FIXES = {
    # Valid packages - keep as-is (npx -y is correct)
    "@modelcontextprotocol/server-filesystem": "npx -y @modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-github": "npx -y @modelcontextprotocol/server-github",
    "@modelcontextprotocol/server-gitlab": "npx -y @modelcontextprotocol/server-gitlab",
    "@modelcontextprotocol/server-postgres": "npx -y @modelcontextprotocol/server-postgres",
    "@modelcontextprotocol/server-brave-search": "npx -y @modelcontextprotocol/server-brave-search",
    "@modelcontextprotocol/server-puppeteer": "npx -y @modelcontextprotocol/server-puppeteer",
    "@modelcontextprotocol/server-slack": "npx -y @modelcontextprotocol/server-slack",
    "@modelcontextprotocol/server-memory": "npx -y @modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-redis": "npx -y @modelcontextprotocol/server-redis",
    "@modelcontextprotocol/server-sequential-thinking": "npx -y @modelcontextprotocol/server-sequential-thinking",
    "@modelcontextprotocol/server-everything": "npx -y @modelcontextprotocol/server-everything",
    "@modelcontextprotocol/server-aws-kb-retrieval": "npx -y @modelcontextprotocol/server-aws-kb-retrieval",
    "@modelcontextprotocol/server-google-maps": "npx -y @modelcontextprotocol/server-google-maps",

    # Invalid packages - mark as placeholder
    "@modelcontextprotocol/server-supabase": "# Package does not exist. Use: npm install @supabase/supabase-js",
    "@modelcontextprotocol/server-mongodb": "# Package does not exist. Use: npm install mongodb",
    "@modelcontextprotocol/server-elasticsearch": "# Package does not exist. Use: npm install @elastic/elasticsearch",
    "@modelcontextprotocol/server-sqlite": "# Package does not exist. Use @modelcontextprotocol/server-filesystem or npm install better-sqlite3",
    "@modelcontextprotocol/server-docker": "# Package does not exist. Use: npm install dockerode",
    "@modelcontextprotocol/server-kubernetes": "# Package does not exist. Use: npm install @kubernetes/client-node",
    "@modelcontextprotocol/server-git": "# Use @modelcontextprotocol/server-github instead: npx -y @modelcontextprotocol/server-github",
    "@modelcontextprotocol/server-playwright": "# Use @modelcontextprotocol/server-puppeteer instead: npx -y @modelcontextprotocol/server-puppeteer",
    "@modelcontextprotocol/server-vercel": "# Package does not exist. Use: npm install @vercel/client",
    "@modelcontextprotocol/server-netlify": "# Package does not exist. Use: npm install netlify",
    "@modelcontextprotocol/server-railway": "# Package does not exist. Use Railway API directly",
    "@modelcontextprotocol/server-discord": "# Package does not exist. Use: npm install discord.js",
    "@modelcontextprotocol/server-aws": "# Use @modelcontextprotocol/server-aws-kb-retrieval instead: npx -y @modelcontextprotocol/server-aws-kb-retrieval",
    "@modelcontextprotocol/server-gcp": "# Package does not exist. Use Google Cloud client libraries",
    "@modelcontextprotocol/server-azure": "# Package does not exist. Use Azure SDK",
    "@modelcontextprotocol/server-jira": "# Package does not exist. Use: npm install jira-client",
    "@modelcontextprotocol/server-figma": "# Use community package: npm install figma-mcp",
    "@modelcontextprotocol/server-prisma": "# Package does not exist. Use: npm install @prisma/client",
    "@modelcontextprotocol/server-planetscale": "# Package does not exist. Use: npm install @planetscale/database",
    "@modelcontextprotocol/server-pinecone": "# Package does not exist. Use: npm install @pinecone-database/pinecone",
    "@modelcontextprotocol/server-openai": "# Package does not exist. Use: npm install openai",
    "@modelcontextprotocol/server-anthropic": "# Package does not exist. Use: npm install @anthropic-ai/sdk",
    "@modelcontextprotocol/server-twilio": "# Package does not exist. Use: npm install twilio",
    "@modelcontextprotocol/server-sendgrid": "# Package does not exist. Use: npm install @sendgrid/mail",
    "@modelcontextprotocol/server-airtable": "# Package does not exist. Use: npm install airtable",
    "@modelcontextprotocol/server-temporal": "# Package does not exist. Use: npm install @temporalio/client",
    "@modelcontextprotocol/server-hasura": "# Package does not exist. Use GraphQL client",
    "@modelcontextprotocol/server-posthog": "# Package does not exist. Use: npm install posthog-node",
    "@modelcontextprotocol/server-mixpanel": "# Package does not exist. Use: npm install mixpanel",
    "@modelcontextprotocol/server-launchdarkly": "# Package does not exist. Use: npm install launchdarkly-node-server-sdk",
    "@modelcontextprotocol/server-n8n": "# Package does not exist. Use n8n API",
    "@modelcontextprotocol/server-retool": "# Package does not exist. Use Retool API",
    "@modelcontextprotocol/server-neon": "# Use @modelcontextprotocol/server-postgres instead (Neon is Postgres-compatible)",
    "@modelcontextprotocol/server-upstash": "# Use @modelcontextprotocol/server-redis or npm install @upstash/redis",
    "@modelcontextprotocol/server-alchemy": "# Alchemy is an API service. Use: npm install @alch/alchemy-sdk",
    "@modelcontextprotocol/server-infura": "# Infura is an API service. Use web3.js or ethers.js",
    "@modelcontextprotocol/server-quicknode": "# QuickNode is an API service. Use web3.js",
    "@modelcontextprotocol/server-thegraph": "# The Graph is an API. Use: npm install graphql-request",
    "@modelcontextprotocol/server-chainstack": "# Chainstack is an RPC provider. Use web3 libraries",
    "@modelcontextprotocol/server-tenderly": "# Tenderly API. Use custom HTTP client",
    "@modelcontextprotocol/server-web3-multichain": "# Package does not exist. Use ethers.js/web3.js",
    "@modelcontextprotocol/server-solana-agent-kit": "# Package does not exist. Use: npm install @solana/web3.js",
    "@modelcontextprotocol/server-aws-bedrock": "# Use @modelcontextprotocol/server-aws-kb-retrieval instead",
    "@modelcontextprotocol/server-cloudflare": "# Package does not exist. Use Cloudflare API",
    "@modelcontextprotocol/server-google-cloud-run": "# Package does not exist. Use: npm install @google-cloud/run",
    "@modelcontextprotocol/server-circleci": "# Package does not exist. Use CircleCI API",
    "@modelcontextprotocol/server-firecrawl": "# Use @modelcontextprotocol/server-puppeteer or Firecrawl API",
    "@modelcontextprotocol/server-perplexity": "# Package does not exist. Use Perplexity API",
    "@modelcontextprotocol/server-linear": "# Package does not exist. Use: npm install @linear/sdk",
    "@modelcontextprotocol/server-sentry": "# Package does not exist. Use: npm install @sentry/node",
    "@modelcontextprotocol/server-datadog": "# Package does not exist. Use: npm install dd-trace",
    "@modelcontextprotocol/server-openai-image": "# Package does not exist. Use: npm install openai",
    "@modelcontextprotocol/server-google-drive": "# Package does not exist yet. Use: npm install googleapis",
    "@modelcontextprotocol/server-notion": "# Package does not exist. Use: npm install @notionhq/client",
    "@modelcontextprotocol/server-stripe": "# Package does not exist. Use: npm install stripe",
    "@modelcontextprotocol/server-postgresql": "# Use @modelcontextprotocol/server-postgres instead",
    "@modelcontextprotocol/server-redis": "npx -y @modelcontextprotocol/server-redis",  # This one exists!
}

def fix_install_command(line: str) -> str:
    """Replace install commands with fixed versions"""

    # Pattern: install: "npm install -g @modelcontextprotocol/server-XXX"
    # or install: "npx -y @modelcontextprotocol/server-XXX"

    for package, replacement in INSTALL_FIXES.items():
        # Match both npm install -g and npx -y patterns
        patterns = [
            f'install: "npm install -g {package}"',
            f'install: "npx -y {package}"',
            f"install: 'npm install -g {package}'",
            f"install: 'npx -y {package}'",
        ]

        for pattern in patterns:
            if pattern in line:
                if replacement.startswith("#"):
                    # Comment out the line and add explanation
                    return line.replace(pattern, f'install: "{replacement}"')
                else:
                    # Replace with correct command
                    return line.replace(pattern, f'install: "{replacement}"')

    return line

def main():
    """Process registry.ts file"""

    print("Reading registry.ts...")
    content = REGISTRY_FILE.read_text(encoding='utf-8')

    lines = content.split('\n')
    fixed_lines = []
    changes = 0

    for line in lines:
        if 'install: "' in line or "install: '" in line:
            fixed_line = fix_install_command(line)
            if fixed_line != line:
                changes += 1
                print(f"Fixed: {line.strip()[:80]}...")
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)

    if changes > 0:
        # Backup original
        backup_path = REGISTRY_FILE.with_suffix('.ts.backup')
        REGISTRY_FILE.rename(backup_path)
        print(f"\nBackup created: {backup_path}")

        # Write fixed version
        REGISTRY_FILE.write_text('\n'.join(fixed_lines), encoding='utf-8')
        print(f"\nFixed {changes} install commands in registry.ts")
    else:
        print("\nNo changes needed")

if __name__ == '__main__':
    main()
