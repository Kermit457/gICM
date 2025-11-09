#!/bin/bash
# Check actual MCP packages that exist on npm

echo "Checking REAL MCP packages on npm..."
echo "===================================="
echo ""

PACKAGES=(
  "@modelcontextprotocol/server-brave-search"
  "@modelcontextprotocol/server-everything"
  "@modelcontextprotocol/server-fetch"
  "@modelcontextprotocol/server-filesystem"
  "@modelcontextprotocol/server-git"
  "@modelcontextprotocol/server-github"
  "@modelcontextprotocol/server-gitlab"
  "@modelcontextprotocol/server-google-maps"
  "@modelcontextprotocol/server-google-drive"
  "@modelcontextprotocol/server-memory"
  "@modelcontextprotocol/server-postgres"
  "@modelcontextprotocol/server-postgresql"
  "@modelcontextprotocol/server-puppeteer"
  "@modelcontextprotocol/server-redis"
  "@modelcontextprotocol/server-sequential-thinking"
  "@modelcontextprotocol/server-slack"
  "@modelcontextprotocol/server-sqlite"
  "@modelcontextprotocol/server-playwright"
  "@modelcontextprotocol/server-aws-kb-retrieval"
  "mcp-server-time"
  "mcp-server-git"
)

for pkg in "${PACKAGES[@]}"; do
  version=$(npm view "$pkg" version 2>/dev/null)
  if [ -n "$version" ]; then
    echo "✅ $pkg @ $version"
  else
    echo "❌ NOT FOUND: $pkg"
  fi
done
