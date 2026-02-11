
#!/bin/bash

PID_FILE="server.pid"
PLIST_PATH="$HOME/Library/LaunchAgents/mcp-server-apple-reminders.plist"

if [ -f "$PLIST_PATH" ]; then
    echo "Stopping via launchctl..."
    launchctl stop mcp-server-apple-reminders
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    echo "Server stopped."
fi

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Stopping server with PID $PID..."
        kill "$PID"
        rm "$PID_FILE"
        echo "Server stopped."
    else
        echo "Process $PID not found. Removing stale PID file."
        rm "$PID_FILE"
    fi
else
    echo "No PID file found. Is the server running?"
fi
