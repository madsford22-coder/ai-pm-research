#!/bin/bash
# Backfill Missing Daily Updates
#
# Regenerates dates that have "No Meaningful PM-Relevant Updates Today" stubs
# by re-running the orchestrator against a fresh data collection.
#
# Usage:
#   bash scripts/backfill-missing-updates.sh
#   bash scripts/backfill-missing-updates.sh --dry-run   (list dates only, no generation)
#
# How it works:
#   1. Runs data collection once with --days 20 to capture all available content
#   2. Copies that data file to each missing date's /tmp slot
#   3. Runs orchestrate-daily-update.js for each date oldest-first
#      (deduplication naturally spreads content across dates)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

DRY_RUN=false
[[ "$1" == "--dry-run" ]] && DRY_RUN=true

# ── Check API key ─────────────────────────────────────────────────────────────
if [ -z "$ANTHROPIC_API_KEY" ]; then
  if [ -f "${PROJECT_ROOT}/.env" ]; then
    set -a && source "${PROJECT_ROOT}/.env" && set +a
  fi
fi

if [ -z "$ANTHROPIC_API_KEY" ] && [ "$DRY_RUN" = false ]; then
  echo "❌ ANTHROPIC_API_KEY not set. Export it or add to .env"
  exit 1
fi

# ── Find dates to backfill ────────────────────────────────────────────────────
echo "=========================================="
echo "Backfill Missing Daily Updates"
echo "=========================================="
echo ""

DATES_TO_FIX=()

# Check all .md files for "No Meaningful" title
for f in "${PROJECT_ROOT}/updates/daily/2026/"*.md; do
  [ -f "$f" ] || continue
  if grep -q 'title: "No Meaningful PM-Relevant Updates Today"' "$f"; then
    date=$(basename "$f" .md)
    DATES_TO_FIX+=("$date")
  fi
done

# Sort oldest first
IFS=$'\n' DATES_TO_FIX=($(sort <<<"${DATES_TO_FIX[*]}")); unset IFS

if [ ${#DATES_TO_FIX[@]} -eq 0 ]; then
  echo "✅ No stub dates found — nothing to backfill."
  exit 0
fi

echo "Found ${#DATES_TO_FIX[@]} dates to regenerate:"
for d in "${DATES_TO_FIX[@]}"; do
  echo "  - $d"
done
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "Dry run — exiting without generating."
  exit 0
fi

# ── Collect data once with a wide window ─────────────────────────────────────
TODAY=$(date +%Y-%m-%d)
SHARED_DATA="/tmp/daily-research-backfill-${TODAY}.txt"

echo "📡 Collecting data (last 20 days)..."
echo ""

# Disable Chrome crashpad
export CHROME_CRASHPAD_HANDLER_PATH=""
export GOOGLE_CHROME_CRASHPAD_HANDLER_PATH=""

{
  echo "# Backfill Research Data Collection"
  echo "# Collected: $(date)"
  echo "# Used for: ${DATES_TO_FIX[*]}"
  echo ""
  echo "## People Activity (Last 20 Days)"
  echo "=========================================="
  echo ""
  node "${SCRIPT_DIR}/check-people-activity.js" --days 20 --format markdown 2>&1 || echo "ERROR: people activity collection failed"
  echo ""
  echo ""
  echo "## Company Updates (Last 20 Days)"
  echo "=========================================="
  echo ""
  node "${SCRIPT_DIR}/check-company-updates.js" --days 20 --format markdown 2>&1 || echo "ERROR: company updates collection failed"
} > "$SHARED_DATA"

echo ""
echo "✅ Data collected: ${SHARED_DATA}"
echo "   $(wc -l < "$SHARED_DATA") lines"
echo ""

# ── Regenerate each date ──────────────────────────────────────────────────────
SUCCESS=()
FAILED=()

for target_date in "${DATES_TO_FIX[@]}"; do
  echo "------------------------------------------"
  echo "🗓  Regenerating ${target_date}..."
  echo "------------------------------------------"

  # Point the orchestrator at our shared data file for this date
  DATA_FILE="/tmp/daily-research-${target_date}.txt"
  cp "$SHARED_DATA" "$DATA_FILE"

  if node "${SCRIPT_DIR}/orchestrate-daily-update.js" --date "$target_date"; then
    SUCCESS+=("$target_date")
    echo "✅ ${target_date} done"
  else
    FAILED+=("$target_date")
    echo "❌ ${target_date} failed"
  fi

  echo ""
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo "=========================================="
echo "Backfill Complete"
echo "=========================================="
echo ""
echo "✅ Succeeded (${#SUCCESS[@]}): ${SUCCESS[*]:-none}"
echo "❌ Failed    (${#FAILED[@]}): ${FAILED[*]:-none}"
echo ""

if [ ${#SUCCESS[@]} -gt 0 ]; then
  echo "To commit all regenerated files:"
  echo "  git add updates/daily/2026/ updates/monthly/"
  echo "  git commit -m \"Backfill daily updates for ${DATES_TO_FIX[*]}\""
  echo "  git push"
fi
