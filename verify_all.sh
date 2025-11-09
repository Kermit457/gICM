#!/bin/bash
# Comprehensive check

FOUND=()
NOT_FOUND=()

check_pkg() {
  local pkg="$1"
  if npm view "$pkg" version >/dev/null 2>&1; then
    FOUND+=("$pkg")
    return 0
  else
    NOT_FOUND+=("$pkg")
    return 1
  fi
}

# Check the user's "known real" packages
echo "Verifying user's 'known real' packages..."
check_pkg "@modelcontextprotocol/server-aws-kb-retrieval"
check_pkg "@modelcontextprotocol/server-filesystem"
check_pkg "@modelcontextprotocol/server-github"
check_pkg "@modelcontextprotocol/server-postgres"
check_pkg "@modelcontextprotocol/server-sqlite"
check_pkg "@modelcontextprotocol/server-brave-search"
check_pkg "@modelcontextprotocol/server-puppeteer"
check_pkg "@modelcontextprotocol/server-google-drive"
check_pkg "@modelcontextprotocol/server-slack"
check_pkg "@modelcontextprotocol/server-fetch"
check_pkg "@modelcontextprotocol/server-memory"
check_pkg "@modelcontextprotocol/server-sequential-thinking"
check_pkg "@modelcontextprotocol/server-everything"
check_pkg "@modelcontextprotocol/server-playwright"

# Additional packages we found
check_pkg "@modelcontextprotocol/server-gitlab"
check_pkg "@modelcontextprotocol/server-google-maps"
check_pkg "@modelcontextprotocol/server-redis"

echo ""
echo "========================"
echo "ACTUALLY EXIST ON NPM:"
echo "========================"
for pkg in "${FOUND[@]}"; do
  echo "✅ $pkg"
done

echo ""
echo "========================"
echo "DO NOT EXIST ON NPM:"
echo "========================"
for pkg in "${NOT_FOUND[@]}"; do
  echo "❌ $pkg"
done
