
#!/bin/bash

# Ensure script fails on error
set -e

# Variable for PID file
PID_FILE="server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Server is already running with PID $PID."
        exit 1
    else
        echo "Found stale PID file. Removing..."
        rm "$PID_FILE"
    fi
fi

echo "Starting server..."
PLIST_PATH="$HOME/Library/LaunchAgents/mcp-server-apple-reminders.plist"

if [ -f "$PLIST_PATH" ]; then
    echo "Starting via launchctl..."
    launchctl load "$PLIST_PATH" 2>/dev/null || true
    launchctl start mcp-server-apple-reminders
else
    echo "Starting manually..."
    nohup npm start > server.log 2> stderr.log &
    echo $! > "$PID_FILE"
fi
echo "Server started."
