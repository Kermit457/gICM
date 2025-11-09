#!/bin/bash

################################################################################
# Settings System Audit Script
# Verifies that all settings in the registry have corresponding documentation
# files and that they follow the required format.
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_FILE="src/lib/settings-registry.ts"
SETTINGS_DIR=".claude/settings"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Counters
TOTAL_SETTINGS=0
EXISTING_FILES=0
MISSING_FILES=0
FORMAT_ISSUES=0
SUCCESS=true

echo "=================================="
echo "Settings System Audit"
echo "=================================="
echo ""

# Check if registry file exists
if [ ! -f "$PROJECT_ROOT/$REGISTRY_FILE" ]; then
    echo -e "${RED}ERROR: Registry file not found at $REGISTRY_FILE${NC}"
    exit 1
fi

echo "Registry file: $REGISTRY_FILE"
echo "Settings directory: $SETTINGS_DIR"
echo ""

# Extract all file paths from registry
echo "Extracting settings from registry..."
REGISTRY_FILES=$(grep -o 'files: \[".claude/settings/[^"]*"' "$PROJECT_ROOT/$REGISTRY_FILE" | cut -d'"' -f2 || true)
TOTAL_SETTINGS=$(echo "$REGISTRY_FILES" | grep -c "\.claude/settings" || true)

echo "Found $TOTAL_SETTINGS settings in registry"
echo ""

# Check each file
echo "Verifying files..."
echo ""

MISSING=()
INVALID=()

for file in $REGISTRY_FILES; do
    FULL_PATH="$PROJECT_ROOT/$file"

    if [ -f "$FULL_PATH" ]; then
        ((EXISTING_FILES++))

        # Check format
        if ! head -1 "$FULL_PATH" | grep -q "^#"; then
            INVALID+=("$file: missing title")
            ((FORMAT_ISSUES++))
        fi

        if ! grep -q "^## Configuration\|^## Overview\|^## Description" "$FULL_PATH"; then
            INVALID+=("$file: missing configuration/overview")
            ((FORMAT_ISSUES++))
        fi
    else
        ((MISSING_FILES++))
        MISSING+=("$file")
        SUCCESS=false
    fi
done

echo "Results:"
echo "  Existing files: $EXISTING_FILES/$TOTAL_SETTINGS"
echo "  Missing files: $MISSING_FILES/$TOTAL_SETTINGS"
echo "  Format issues: $FORMAT_ISSUES"
echo ""

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}Missing files:${NC}"
    for file in "${MISSING[@]}"; do
        echo "  - $file"
    done
    echo ""
fi

if [ ${#INVALID[@]} -gt 0 ]; then
    echo -e "${YELLOW}Format issues:${NC}"
    for issue in "${INVALID[@]}"; do
        echo "  - $issue"
    done
    echo ""
fi

# Final status
echo "=================================="
if [ "$SUCCESS" = true ] && [ $FORMAT_ISSUES -eq 0 ]; then
    echo -e "${GREEN}Status: HEALTHY${NC}"
    echo "All settings are properly documented and formatted."
    exit 0
else
    if [ $MISSING_FILES -gt 0 ]; then
        echo -e "${RED}Status: ISSUES FOUND${NC}"
        echo "Missing documentation files detected."
        exit 1
    fi

    if [ $FORMAT_ISSUES -gt 0 ]; then
        echo -e "${YELLOW}Status: FORMAT WARNINGS${NC}"
        echo "Some files have format issues that should be reviewed."
        exit 1
    fi
fi
