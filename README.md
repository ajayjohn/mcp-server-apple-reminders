# Apple Reminders MCP Server

An MCP server that provides access to Apple Reminders via the `remindctl` CLI.

## Features

- **List Reminders**: View tasks in Active, Delegated, or Backlog lists.
- **Create Reminders**: Add new tasks with due dates and notes.
- **Edit Reminders**: Modify existing tasks.
- **Complete/Delete**: Manage task lifecycle.
- **SSE Transport**: Runs as a standalone HTTP server with Server-Sent Events.
- **Auto-start**: Automatically starts at login via macOS Launch Agent.
- **Safe STDIO**: Redirects all logs to `stderr` when using stdio transport to prevent JSON-RPC corruption.
- **Process Management**: Writes PID to `server.pid` and cleans up on exit.

## Prerequisites

- macOS 14+ (Sonoma or later)
- Node.js (LTS recommended)
- `remindctl` (will be installed via Homebrew if missing)

## Installation

1. Clone or download this repository.
2. Run the install script:
   ```bash
   cd mcp-server-apple-reminders
   ./install.sh
   ```
   *Note: This will also set up a macOS Launch Agent to start the server automatically at login.*

## Usage

### Starting the Server

To start the server in the background:
```bash
./start.sh
```
This will write the process ID to `server.pid` and logs to `server.log` / `stderr.log`.

### Stopping the Server

To stop the background server:
```bash
./stop.sh
```

### Configuration

Copy `.env.example` to `.env` if you need to customize the port (default 6371).

## Client Configuration

To configure an MCP client (like Claude Desktop or an extension) to use this server via SSE:

**Server URL**: `http://localhost:6371/sse`

If your client requires listing the message endpoint separately:
**Message Endpoint**: `http://localhost:6371/messages`

**Connection Type**: SSE (Server-Sent Events)

### Example: Claude Desktop Config (`claude_desktop_config.json`)

Currently, Claude Desktop primarily supports stdio. To use this server with Claude Desktop, you should configure it to run the built source directly via `node`:

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-server-apple-reminders/dist/index.js",
        "--stdio"
      ]
    }
  }
}
```

If you are using a client that supports remote/HTTP MCP servers, use the SSE URL above.

## Tools

| Tool Name | Description |
|-----------|-------------|
| `reminders_list` | List reminders from Active, Delegated, or Backlog lists. |
| `reminders_create` | Create a new reminder. |
| `reminders_edit` | Edit an existing reminder (title, due date, notes). |
| `reminders_complete` | Mark a reminder as complete. |
| `reminders_delete` | Delete a reminder. |

## License

MIT
