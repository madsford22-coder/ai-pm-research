# Cron Setup Instructions

## Quick Setup

Since crontab requires user permissions, you need to run the setup script manually:

```bash
cd /Users/madisonford/Documents/ai-pm-research
./scripts/setup-cron.sh
```

This will:
- ✅ Install a cron job that runs daily at 9 AM
- ✅ Save research data to `/tmp/daily-research-YYYY-MM-DD.txt`
- ✅ Save logs to `/tmp/daily-research-cron-YYYY-MM-DD.log`

## Manual Setup (Alternative)

If you prefer to set it up manually:

```bash
# Edit your crontab
crontab -e

# Add this line (runs daily at 9 AM):
0 9 * * * cd /Users/madisonford/Documents/ai-pm-research && ./scripts/run-daily-research-data-collection.sh > /tmp/daily-research-cron-$(date +\%Y-\%m-\%d).log 2>&1
```

**Important**: Make sure to escape the `%` signs as `\%` in cron!

## Verify Setup

After setup, verify the cron job is installed:

```bash
# View your crontab
crontab -l

# Check cron service is running (macOS)
sudo launchctl list | grep cron
```

## Test It Works

To test the cron job will work, you can:

1. **Run the script manually** (already tested ✅):
   ```bash
   ./scripts/run-daily-research-data-collection.sh
   ```

2. **Simulate cron environment**:
   ```bash
   # Set minimal environment like cron
   env -i HOME=$HOME PATH=/usr/bin:/bin:/usr/local/bin USER=$USER bash -c 'cd /Users/madisonford/Documents/ai-pm-research && ./scripts/run-daily-research-data-collection.sh'
   ```

## Change Schedule

To change when it runs, edit your crontab:

```bash
crontab -e
```

Cron format: `minute hour day month weekday`

Examples:
- `0 9 * * *` - 9:00 AM every day
- `0 8 * * 1-5` - 8:00 AM weekdays only
- `30 7 * * *` - 7:30 AM every day

## Troubleshooting

### Cron job not running

1. **Check cron logs**:
   ```bash
   # macOS
   grep CRON /var/log/system.log
   
   # Or check the log file
   cat /tmp/daily-research-cron-$(date +%Y-%m-%d).log
   ```

2. **Check file permissions**:
   ```bash
   ls -l scripts/run-daily-research-data-collection.sh
   # Should show -rwxr-xr-x (executable)
   ```

3. **Check PATH in cron**:
   Cron uses minimal PATH. The script should work, but if node isn't found:
   - Add full path to node in the script
   - Or add PATH to crontab: `PATH=/usr/local/bin:/usr/bin:/bin`

### Script fails in cron but works manually

Common causes:
- Different environment (PATH, HOME, etc.)
- Permissions issues
- Node not found in cron PATH

**Fix**: Update the script to use full paths or set environment variables in crontab.

## Remove Cron Job

To remove the automation:

```bash
crontab -e
# Delete the line with "run-daily-research-data-collection.sh"
```

Or use the setup script (it will prompt to replace existing):
```bash
./scripts/setup-cron.sh
```
