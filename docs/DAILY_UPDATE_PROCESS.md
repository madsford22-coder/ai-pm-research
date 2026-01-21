# Daily Update Process - Guidelines & Troubleshooting

## What Went Wrong (Jan 20, 2026)

### Root Cause
When Cursor generated the Jan 20 daily update, it created the file with this incorrect structure:

```markdown
# Daily PM Research Update: 2026-01-20

---
title: "How Product Leaders Structure AI Tool Stacks"
date: 2026-01-20
tags:
  - daily-update
---
```

**Problem**: The H1 heading came **before** the frontmatter, not after. This broke the entire web application because:
1. `gray-matter` library expects frontmatter at the very beginning of the file
2. When frontmatter parsing failed, it returned invalid metadata
3. This caused Date objects to be returned as `undefined`, leading to "Invalid Date" displays
4. TypeScript type errors cascaded through the application
5. The site crashed on Netlify with SSR errors

### The Fix
We had to:
1. Update the parser to handle this edge case (H1 before frontmatter)
2. Add proper Date object handling throughout the codebase
3. Fix timezone issues by using UTC consistently
4. Update TypeScript types to handle `date?: string | Date`

**This took ~12 commits and several hours to fully resolve.**

## Correct Format for Daily Updates

### File Structure (CRITICAL)
```markdown
---
title: "Your Title Here"
date: 2026-01-20
tags:
  - daily-update
  - ai-pm-research
---

# Daily PM Research Update: 2026-01-20

## Summary

Your summary here...

## Items

### Item Title
**Source:** URL

**tl;dr:** Brief summary
```

### Key Rules

1. **Frontmatter MUST be first** - No content (not even comments or headings) before `---`
2. **Date format** - Use `YYYY-MM-DD` format (e.g., `2026-01-20`)
3. **Tags** - Always include `daily-update` tag
4. **File location** - Must be in `updates/daily/YYYY/YYYY-MM-DD.md`

### When Using Cursor/AI Tools

**ALWAYS** specify in your prompt:
```
Create a daily update file with frontmatter at the BEGINNING of the file.
The structure must be:
---
title: "..."
date: YYYY-MM-DD
---

# Title here
```

## Why the Cron Job Didn't Run

### Investigation Results

1. **Cron is scheduled**: `0 9 * * *` (9am daily)
2. **No log file for Jan 20**: `/tmp/daily-research-cron-2026-01-20.log` doesn't exist
3. **Possible reasons**:
   - Computer was asleep at 9am
   - Cron service not running
   - macOS killed the cron daemon
   - Full Disk Access permissions issue

### Current Cron Setup
```bash
0 9 * * * export ANTHROPIC_API_KEY='...' && export NOTIFICATION_EMAIL='...' && cd "/Users/madisonford/Documents/ai-pm-research" && "/Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh" > /tmp/daily-research-cron-$(date +\%Y-\%m-\%d).log 2>&1
```

### What the Script Does
1. Collects people activity data (14 days)
2. Collects company updates (14 days)
3. Synthesizes daily update using Claude API
4. Sends email notification

## Recommended Solutions

### Option 1: Netlify Scheduled Functions (RECOMMENDED)

**Pros:**
- Runs reliably in the cloud (no dependency on local machine)
- Integrated with Netlify deployment
- Can trigger builds automatically
- Built-in monitoring and logs

**Cons:**
- Requires moving synthesis logic to cloud function
- Uses Netlify build minutes

**Implementation:**
1. Create `netlify/functions/scheduled-daily-update.js`
2. Configure schedule in `netlify.toml`
3. Function calls Claude API to generate update
4. Commits to repo and triggers rebuild

### Option 2: GitHub Actions

**Pros:**
- Free for public repos
- Easy to debug with action logs
- Can commit directly to repo

**Cons:**
- Requires GitHub secrets management
- Uses GitHub Actions minutes

**Implementation:**
1. Create `.github/workflows/daily-update.yml`
2. Schedule with cron syntax
3. Run synthesis script
4. Commit and push

### Option 3: Fix Local Cron

**Pros:**
- No cloud dependencies
- Instant local testing

**Cons:**
- Unreliable (computer must be awake and on)
- macOS cron issues
- Hard to debug

**Fixes needed:**
1. Ensure cron service is running: `sudo launchctl load -w /System/Library/LaunchDaemons/com.vix.cron.plist`
2. Check Full Disk Access permissions for `cron`
3. Add logging to diagnose failures
4. Consider using `launchd` instead of cron on macOS

## Immediate Action Items

1. **Document in prompts**: Update `tooling/prompts/daily-research.md` to emphasize frontmatter-first requirement
2. **Validation script**: Create a script to validate daily update format before committing
3. **Choose scheduling solution**: Implement Netlify scheduled functions or GitHub Actions
4. **Add tests**: Create tests that verify frontmatter parsing works correctly

## File Format Validation Script (TODO)

Create `scripts/validate-daily-update.js`:
```javascript
// Check:
// 1. File starts with ---
// 2. Valid frontmatter
// 3. Required fields present
// 4. Date format correct
// Exit with error if invalid
```

## Prevention Checklist

Before committing a daily update:
- [ ] Frontmatter is at the very beginning (no content before `---`)
- [ ] Date is in YYYY-MM-DD format
- [ ] File is in correct location: `updates/daily/YYYY/YYYY-MM-DD.md`
- [ ] Tags include `daily-update`
- [ ] Run `npm run build` in web/ directory to verify no errors
- [ ] Check preview locally before pushing

## Monitoring & Alerts

Set up:
1. **Netlify build failure notifications** - Already enabled
2. **Email alerts when cron fails** - Already configured
3. **Daily check**: If no update by 10am, send alert
