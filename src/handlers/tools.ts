import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import tool implementations
import { createExampleTool } from '../tools/example.js';

export function setupToolHandlers(server: Server, orgFilePaths: string[]): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        createExampleTool(),
        // Add more tools here as you implement them
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'example-tool': {
          // Handle example tool call
          const result = await handleExampleTool(args || {});
          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

// Example tool implementation
async function handleExampleTool(args: Record<string, unknown>): Promise<string> {
  // Validate arguments using Zod
  const schema = z.object({
    message: z.string().optional().default('Hello from MCP server!'),
  });

  const parsed = schema.parse(args);
  return `Example tool executed: ${parsed.message}`;
}