import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { setupToolHandlers } from './handlers/tools.js';
import { setupResourceHandlers } from './handlers/resources.js';

export function createServer(orgFilePaths: string[]): Server {
  const server = new Server(
    {
      name: 'orgmode-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Set up handlers
  setupToolHandlers(server, orgFilePaths);
  setupResourceHandlers(server, orgFilePaths);

  // Error handling
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  process.on('SIGINT', async () => {
    await server.close();
  });

  return server;
}