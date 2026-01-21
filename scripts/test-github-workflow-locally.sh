#!/bin/bash
# Test the GitHub Actions workflow locally
# This simulates what the workflow does

set -e

echo "=========================================="
echo "Testing GitHub Actions Workflow Locally"
echo "=========================================="
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ERROR: ANTHROPIC_API_KEY not set"
    echo ""
    echo "Please set it first:"
    echo "  export ANTHROPIC_API_KEY='your-key-here'"
    exit 1
fi

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Get today's date in PT timezone
export TZ=America/Los_Angeles
TODAY=$(date +%Y-%m-%d)
YEAR=$(date +%Y)

echo "Generating update for ${TODAY}"
echo ""

# Install dependencies (skip if already installed)
echo "Installing dependencies..."
cd tooling
if [ ! -d "node_modules" ]; then
    npm ci
else
    echo "Dependencies already installed, skipping..."
fi
cd ..
echo ""

# Run the data collection script
echo "Running data collection..."
bash scripts/run-daily-research-data-collection.sh
echo ""

# Check if update file was created
UPDATE_FILE="updates/daily/${YEAR}/${TODAY}.md"
if [ ! -f "$UPDATE_FILE" ]; then
    echo "❌ ERROR: Update file not created at $UPDATE_FILE"
    exit 1
fi

echo "✅ Update file created successfully at $UPDATE_FILE"
echo ""

# Validate frontmatter is at the beginning
FIRST_LINE=$(head -n 1 "$UPDATE_FILE")
if [ "$FIRST_LINE" != "---" ]; then
    echo "❌ ERROR: File does not start with frontmatter delimiter '---'"
    echo "First line is: $FIRST_LINE"
    echo ""
    echo "First 10 lines of file:"
    head -n 10 "$UPDATE_FILE"
    exit 1
fi

echo "✅ Frontmatter validation passed"
echo ""

# Show preview
echo "=========================================="
echo "Update Preview (first 30 lines):"
echo "=========================================="
head -n 30 "$UPDATE_FILE"
echo ""
echo "=========================================="
echo "✅ Test Complete!"
echo "=========================================="
echo ""
echo "File created at: $UPDATE_FILE"
echo ""
echo "Next steps:"
echo "1. Review the file: cat $UPDATE_FILE"
echo "2. If it looks good, commit it:"
echo "   git add updates/daily/"
echo "   git commit -m 'Add daily research update for ${TODAY}'"
echo "   git push origin main"
echo ""
