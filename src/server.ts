import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { UselinkClient } from "./client.js";
import { readTools } from "./tools/read.js";
import { writeTools } from "./tools/write.js";
import { orchestratorTools } from "./tools/orchestrator.js";
import { projectTools } from "./tools/projects.js";
import { folderTools } from "./tools/folders.js";
import { accountTools } from "./tools/account.js";

export interface ToolDefinition<TInput> {
  name: string;
  description: string;
  inputSchema: Tool["inputSchema"];
  parse: (raw: unknown) => TInput;
  handler: (input: TInput, client: UselinkClient) => Promise<CallToolResult>;
}

const tools: ToolDefinition<unknown>[] = [
  ...readTools,
  ...writeTools,
  ...projectTools,
  ...folderTools,
  ...accountTools,
  ...orchestratorTools,
];

export interface CreateServerOptions {
  client?: UselinkClient;
}

export function createServer(options: CreateServerOptions = {}): Server {
  const server = new Server(
    {
      name: "uselink-mcp",
      version: "0.2.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Lazily construct the client so the server can be instantiated in tests
  // without USELINK_API_KEY set. The client is required when a tool is called.
  let resolvedClient: UselinkClient | null = options.client ?? null;
  const getClient = (): UselinkClient => {
    if (resolvedClient === null) {
      resolvedClient = new UselinkClient();
    }
    return resolvedClient;
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
      };
    }

    try {
      const parsed = tool.parse(args ?? {});
      return await tool.handler(parsed, getClient());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Tool ${name} failed: ${message}` }],
      };
    }
  });

  return server;
}
