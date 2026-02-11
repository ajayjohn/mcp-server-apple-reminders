
#!/bin/bash

# Ensure script fails on error
set -e

echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js (LTS recommended) first."
    exit 1
fi

echo "Checking for remindctl..."
if ! command -v remindctl &> /dev/null; then
    echo "remindctl not found. Installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Please install Homebrew or install remindctl manually."
        exit 1
    fi
    brew install steipete/tap/remindctl
else
    echo "remindctl is already installed."
fi

echo "Installing project dependencies..."
npm install

echo "Building project..."
npm run build

echo "Setting up macOS Launch Agent for auto-start at login..."
PLIST_NAME="mcp-server-apple-reminders.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"
WORKING_DIR=$(pwd)
INDEX_JS="$WORKING_DIR/dist/index.js"
LOG_FILE="$WORKING_DIR/server.log"
STDERR_FILE="$WORKING_DIR/stderr.log"
NODE_PATH=$(which node)

sed -e "s|PATH_TO_INDEX_JS|$INDEX_JS|g" \
    -e "s|WORKING_DIR|$WORKING_DIR|g" \
    -e "s|PATH_TO_LOG|$LOG_FILE|g" \
    -e "s|PATH_TO_STDERR|$STDERR_FILE|g" \
    -e "s|NODE_EXECUTABLE|$NODE_PATH|g" \
    mcp-server-apple-reminders.plist.template > "$PLIST_NAME"

cp "$PLIST_NAME" "$PLIST_PATH"

echo "Loading Launch Agent..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "Installation complete! The server will now start automatically at login."
echo "You can manually start/stop it using ./start.sh and ./stop.sh, which also interact with the Launch Agent."
