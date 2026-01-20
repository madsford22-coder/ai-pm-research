#!/bin/bash
# Test script for cron job - validates environment and runs quick checks

set -e

echo "=========================================="
echo "Cron Job Test"
echo "=========================================="
echo ""

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "✅ Project root: $PROJECT_ROOT"
echo ""

# Test 1: Check script exists and is executable
echo "Test 1: Script accessibility"
if [ -f "$SCRIPT_DIR/run-daily-research-data-collection.sh" ]; then
    echo "  ✅ Main script exists"
    if [ -x "$SCRIPT_DIR/run-daily-research-data-collection.sh" ]; then
        echo "  ✅ Main script is executable"
    else
        echo "  ❌ Main script is not executable"
        exit 1
    fi
else
    echo "  ❌ Main script not found"
    exit 1
fi
echo ""

# Test 2: Check required Node.js scripts exist
echo "Test 2: Required scripts"
REQUIRED_SCRIPTS=(
    "check-people-activity.js"
    "check-company-updates.js"
    "synthesize-daily-update.js"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        echo "  ✅ $script exists"
    else
        echo "  ❌ $script not found"
        exit 1
    fi
done
echo ""

# Test 3: Check Node.js is available
echo "Test 3: Node.js availability"
if command -v node &> /dev/null; then
    NODE_PATH=$(which node)
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js found at: $NODE_PATH"
    echo "  ✅ Node.js version: $NODE_VERSION"
else
    echo "  ❌ Node.js not found in PATH"
    exit 1
fi
echo ""

# Test 4: Check environment variables
echo "Test 4: Environment variables"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  ✅ ANTHROPIC_API_KEY is set"
else
    echo "  ⚠️  ANTHROPIC_API_KEY not set (synthesis will be skipped)"
fi

if [ -n "$NOTIFICATION_EMAIL" ]; then
    echo "  ✅ NOTIFICATION_EMAIL is set: $NOTIFICATION_EMAIL"
else
    echo "  ⚠️  NOTIFICATION_EMAIL not set (emails will be skipped)"
fi
echo ""

# Test 5: Check required context files
echo "Test 5: Context files"
CONTEXT_FILES=(
    "context/companies.md"
    "context/people.md"
    "context/prefs.md"
    "context/open-questions.md"
)

for file in "${CONTEXT_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ⚠️  $file not found (may cause issues)"
    fi
done
echo ""

# Test 6: Test Node.js scripts can be required (syntax check)
echo "Test 6: Script syntax validation"
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if node -c "$SCRIPT_DIR/$script" 2>/dev/null; then
        echo "  ✅ $script syntax is valid"
    else
        echo "  ❌ $script has syntax errors"
        exit 1
    fi
done
echo ""

# Test 7: Check write permissions for output directory
echo "Test 7: Output directory permissions"
OUTPUT_DIR="/tmp"
if [ -w "$OUTPUT_DIR" ]; then
    echo "  ✅ Can write to $OUTPUT_DIR"
else
    echo "  ❌ Cannot write to $OUTPUT_DIR"
    exit 1
fi
echo ""

# Test 8: Simulate cron environment (minimal PATH)
echo "Test 8: Cron environment simulation"
CRON_ENV="env -i HOME=$HOME PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin USER=$USER SHELL=/bin/bash"
if $CRON_ENV bash -c "cd $PROJECT_ROOT && which node > /dev/null 2>&1"; then
    echo "  ✅ Node.js accessible in cron-like environment"
    CRON_NODE_PATH=$($CRON_ENV bash -c "cd $PROJECT_ROOT && which node")
    echo "  ✅ Node.js path in cron env: $CRON_NODE_PATH"
else
    echo "  ❌ Node.js not accessible in cron-like environment"
    exit 1
fi
echo ""

# Summary
echo "=========================================="
echo "✅ All tests passed!"
echo "=========================================="
echo ""
echo "The cron job should work correctly."
echo ""
echo "To run the full script:"
echo "  ./scripts/run-daily-research-data-collection.sh"
echo ""
echo "To check cron logs after it runs:"
echo "  tail -f /tmp/daily-research-cron-\$(date +%Y-%m-%d).log"
echo ""
