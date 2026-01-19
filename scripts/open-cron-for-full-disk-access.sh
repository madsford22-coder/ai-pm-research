#!/bin/bash
# Helper script to open /usr/sbin folder for Full Disk Access setup

echo "=========================================="
echo "Opening /usr/sbin folder for Full Disk Access"
echo "=========================================="
echo ""
echo "This will open the /usr/sbin folder in Finder."
echo "Then follow these steps:"
echo ""
echo "1. Find the file named 'cron' (no extension)"
echo "2. Open System Settings > Privacy & Security > Privacy > Full Disk Access"
echo "3. Click the '+' button"
echo "4. Drag the 'cron' file from the Finder window into the Full Disk Access list"
echo "5. Make sure the checkbox next to 'cron' is checked"
echo "6. Restart your Mac"
echo ""
echo "Opening /usr/sbin folder..."
echo ""

# Open the /usr/sbin folder in Finder
open /usr/sbin

# Wait a moment
sleep 2

echo "✅ Opened /usr/sbin folder in Finder"
echo ""
echo "Next steps:"
echo "1. In the Finder window, find the file named 'cron'"
echo "2. Open System Settings > Privacy & Security > Privacy > Full Disk Access"
echo "3. Click the '+' button in Full Disk Access"
echo "4. Drag 'cron' from Finder into the Full Disk Access list"
echo "5. Ensure it's checked"
echo "6. Restart your Mac"
echo ""
echo "Or you can manually navigate:"
echo "  - Press Command+Shift+G in System Settings"
echo "  - Type: /usr/sbin"
echo "  - Select 'cron'"
echo ""
