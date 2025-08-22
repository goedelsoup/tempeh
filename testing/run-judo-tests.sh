#!/bin/bash

# Judo Test Runner for Tempeh CLI
# This script runs all the Judo end-to-end tests for the CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Running Judo Tests for Tempeh CLI${NC}"
echo "=================================="

# Check if Judo is installed
if ! command -v judo &> /dev/null; then
    echo -e "${RED}❌ Judo is not installed. Please install it first.${NC}"
    echo "Visit: https://github.com/judo-project/judo"
    exit 1
fi

# Check if CLI executable exists
CLI_PATH="$PROJECT_ROOT/cli/release/tempeh-simple"
if [ ! -f "$CLI_PATH" ]; then
    echo -e "${YELLOW}⚠️  CLI executable not found at $CLI_PATH${NC}"
    echo "Building CLI first..."
    cd "$PROJECT_ROOT"
    pnpm build
    cd "$SCRIPT_DIR"
fi

# Make CLI executable
chmod +x "$CLI_PATH"

# Create test directories
mkdir -p test-workspace
mkdir -p temp

# Set environment variables
export NODE_ENV=test
export TEMPEH_TEST_MODE=true
export TEMPEH_LOG_LEVEL=info

echo -e "${BLUE}📋 Running test scenarios...${NC}"

# Run all test scenarios
SCENARIOS=(
    "cli-help.judo.yaml"
    "cli-init.judo.yaml"
    "cli-plan-deploy.judo.yaml"
    "cli-workflow.judo.yaml"
    "cli-config.judo.yaml"
    "cli-state.judo.yaml"
    "cli-integration.judo.yaml"
)

FAILED_TESTS=()
PASSED_TESTS=()

for scenario in "${SCENARIOS[@]}"; do
    echo -e "${BLUE}🧪 Running: $scenario${NC}"
    
    if judo run "$scenario"; then
        echo -e "${GREEN}✅ Passed: $scenario${NC}"
        PASSED_TESTS+=("$scenario")
    else
        echo -e "${RED}❌ Failed: $scenario${NC}"
        FAILED_TESTS+=("$scenario")
    fi
    
    echo ""
done

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================="
echo -e "${GREEN}✅ Passed: ${#PASSED_TESTS[@]}${NC}"
echo -e "${RED}❌ Failed: ${#FAILED_TESTS[@]}${NC}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}  - $test${NC}"
    done
    exit 1
else
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
fi
