# How to Grant Full Disk Access to Cron on macOS

## Step-by-Step Instructions

### Step 1: Open System Settings
1. Click the Apple menu (🍎) in the top-left corner
2. Select **System Settings** (or **System Preferences** on older macOS)
3. Or press `Command + Space` and type "System Settings"

### Step 2: Navigate to Privacy & Security
1. Click **Privacy & Security** in the sidebar
2. If you don't see it, scroll down in the sidebar
3. Click **Privacy** (it might be under Privacy & Security)

### Step 3: Select Full Disk Access
1. In the list on the left, scroll down and click **Full Disk Access**
2. You'll see a list of apps that have Full Disk Access (might be empty)
3. Click the lock icon (🔒) at the bottom-left if it's locked
4. Enter your password when prompted

### Step 4: Add Cron Executable
1. Click the **+** (plus) button below the list
2. A file browser window will open
3. **IMPORTANT:** Press `Command + Shift + G` (or go to Go > Go to Folder in menu bar)
4. In the "Go to Folder" dialog, type exactly:
   ```
   /usr/sbin
   ```
5. Click **Go** (or press Enter)
6. You should now see a folder with system executables
7. Scroll down and find the file named **cron** (no extension, just "cron")
8. Select **cron** and click **Open**

### Step 5: Verify Cron is Added
1. You should now see "cron" in the Full Disk Access list
2. Make sure the checkbox next to "cron" is **checked** (ticked)
3. If it's unchecked, check it now

### Step 6: Restart Cron Service
Open Terminal and run:
```bash
sudo launchctl stop com.apple.cron
sudo launchctl start com.apple.cron
```

Or simply **restart your Mac** (easiest and most reliable).

## Alternative Method: If You Still Can't Find Cron

If you can't see cron in `/usr/sbin`, try these alternatives:

### Option A: Use Terminal to Open the Folder
1. Open Terminal
2. Run this command:
   ```bash
   open /usr/sbin
   ```
3. This will open Finder to that folder
4. Drag the **cron** file from Finder into the Full Disk Access list

### Option B: Use Command Line to Add
1. Open Terminal
2. Run:
   ```bash
   sudo sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "INSERT INTO access VALUES('kTCCServiceSystemPolicyAllFiles','/usr/sbin/cron',1,2,1,1,NULL,NULL,NULL,'UNUSED',NULL,0,1541440109);"
   ```
   
   **Note:** This is a technical method. You may need to disable System Integrity Protection (SIP) first, which is **not recommended**.

### Option C: Check if Cron Exists
Run in Terminal:
```bash
ls -la /usr/sbin/cron
which cron
```

If cron doesn't exist at `/usr/sbin/cron`, your macOS might use launchd for cron jobs instead, and you may need to grant Full Disk Access to `launchd` instead.

## Troubleshooting

### If Full Disk Access list is empty or locked:
- Make sure you're an administrator on the Mac
- Click the lock icon and enter your password
- Try restarting System Settings

### If you can't see `/usr/sbin` folder:
- Make sure you're typing the path correctly: `/usr/sbin` (with the leading slash)
- Try: `Command + Shift + G` then type `/usr/sbin`
- The folder exists on all macOS systems

### If cron isn't in the list after adding:
- Make sure you selected the right file (it's just called "cron", no extension)
- Try adding it again
- Restart your Mac after adding it

### Verify cron was added:
After adding, check that cron is in the Full Disk Access list with a checkmark next to it.

## After Granting Access

1. **Restart your Mac** (most reliable)
   OR
2. Restart cron service:
   ```bash
   sudo launchctl stop com.apple.cron
   sudo launchctl start com.apple.cron
   ```

3. Test the cron job by running it manually:
   ```bash
   cd /Users/madisonford/Documents/ai-pm-research
   ./scripts/run-daily-research-data-collection.sh
   ```

4. Check tomorrow at 9 AM if the cron job ran:
   ```bash
   cat /tmp/daily-research-cron-$(date +%Y-%m-%d).log
   ```

## Still Having Issues?

If cron still doesn't work after granting Full Disk Access, consider:
1. Using launchd instead of cron (macOS preferred method)
2. Running the script from a GUI app instead of cron
3. Using a remote server or CI/CD for automation

See `PUPPETEER_CRON_SETUP.md` for alternative solutions.
