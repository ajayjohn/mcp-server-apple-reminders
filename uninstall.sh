
#!/bin/bash

echo "Stopping server if running..."
./stop.sh || true

echo "Removing macOS Launch Agent..."
PLIST_NAME="mcp-server-apple-reminders.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"

if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH"
    rm "$PLIST_PATH"
fi

echo "Cleaning up..."
rm -rf node_modules dist server.log stderr.log server.pid mcp-server-apple-reminders.plist

# Optional: ask to remove remindctl?
# For now, we'll just leave external tools as they might be used elsewhere.
echo "Project files cleaned. To remove remindctl, run: brew uninstall remindctl"
