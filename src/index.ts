
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { RemindersService } from "./services/reminders.js";
import * as fs from 'fs';
import * as path from 'path';

// Redirect console.log to console.error to avoid polluting stdout
console.log = console.error;

const app = express();
app.use(cors());

const remindersService = new RemindersService();

const server = new Server(
  {
    name: "reminders-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
const listRemindersSchema = z.object({
  listName: z.enum(["Active", "Delegated", "Backlog"]).describe("The name of the list to retrieve reminders from")
});

const createReminderSchema = z.object({
  title: z.string().describe("The title of the reminder"),
  list: z.enum(["Active", "Delegated", "Backlog"]).describe("The list to add the reminder to"),
  due: z.string().optional().describe("Due date (YYYY-MM-DD or natural language like 'tomorrow')"),
  notes: z.string().optional().describe("Notes for the reminder")
});

const editReminderSchema = z.object({
  id: z.string().describe("The ID of the reminder to edit"),
  title: z.string().optional().describe("New title"),
  due: z.string().optional().describe("New due date"),
  notes: z.string().optional().describe("New notes")
});

const completeReminderSchema = z.object({
  id: z.string().describe("The ID of the reminder to complete")
});

const deleteReminderSchema = z.object({
  id: z.string().describe("The ID of the reminder to delete")
});

// Register Tool Listing Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "reminders_list",
        description: "List reminders from a specific list (Active, Delegated, Backlog)",
        inputSchema: zodToJsonSchema(listRemindersSchema)
      },
      {
        name: "reminders_create",
        description: "Create a new reminder",
        inputSchema: zodToJsonSchema(createReminderSchema)
      },
      {
        name: "reminders_edit",
        description: "Edit an existing reminder",
        inputSchema: zodToJsonSchema(editReminderSchema)
      },
      {
        name: "reminders_complete",
        description: "Mark a reminder as complete",
        inputSchema: zodToJsonSchema(completeReminderSchema)
      },
      {
        name: "reminders_delete",
        description: "Delete a reminder",
        inputSchema: zodToJsonSchema(deleteReminderSchema)
      }
    ]
  };
});

// Register Tool Call Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "reminders_list") {
      const { listName } = listRemindersSchema.parse(args);
      const reminders = await remindersService.listReminders(listName);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(reminders, null, 2)
          }
        ]
      };
    }

    if (name === "reminders_create") {
      const { title, list, due, notes } = createReminderSchema.parse(args);
      const output = await remindersService.createReminder(title, list, due, notes);
      return {
        content: [
          {
            type: "text",
            text: `Reminder created: ${output}`
          }
        ]
      };
    }

    if (name === "reminders_edit") {
      const { id, title, due, notes } = editReminderSchema.parse(args);
      const output = await remindersService.editReminder(id, title, due, notes);
      return {
        content: [
          {
            type: "text",
            text: `Reminder updated: ${output}`
          }
        ]
      };
    }

    if (name === "reminders_complete") {
      const { id } = completeReminderSchema.parse(args);
      const output = await remindersService.completeReminder(id);
      return {
        content: [
          {
            type: "text",
            text: `Reminder completed: ${output}`
          }
        ]
      };
    }

    if (name === "reminders_delete") {
      const { id } = deleteReminderSchema.parse(args);
      const output = await remindersService.deleteReminder(id);
      return {
        content: [
          {
            type: "text",
            text: `Reminder deleted: ${output}`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${JSON.stringify(error.errors)}`);
    }
    throw error;
  }
});

// Transport Handling

const args = process.argv.slice(2);
const isStdio = args.includes('--stdio');

if (isStdio) {
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.error("Reminders MCP Server running in STDIO mode");
} else {
  let transport: SSEServerTransport;

  app.get("/sse", async (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No active transport");
    }
  });

  const PORT = process.env.PORT || 6371;

  const httpServer = app.listen(PORT, () => {
    console.error(`Server is running on port ${PORT}`);
    
    // Write PID file
    try {
      const pidFile = path.join(process.cwd(), 'server.pid');
      fs.writeFileSync(pidFile, process.pid.toString());
    } catch (error) {
      console.error('Failed to write PID file:', error);
    }
  });

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use.`);
      console.error('If you are seeing this log via a client, ensure you are using the "--stdio" flag in your configuration to avoid port conflicts with the background service.');
      process.exit(1);
    } else {
      throw err;
    }
  });
}

// Cleanup on exit
const cleanup = () => {
    if (!isStdio) {
        try {
            const pidFile = path.join(process.cwd(), 'server.pid');
            if (fs.existsSync(pidFile)) {
                fs.unlinkSync(pidFile);
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
