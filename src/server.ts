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
import { setupPromptHandlers } from './handlers/prompts.js';

export function createServer(orgFilePaths: string[]): Server {
  const server = new Server(
    {
      name: 'orgmode-mcp',
      version: '1.0.0',
      description: 'Provides access to Org Mode files for task management, note-taking, and structured data. Use this server to read, search, and analyze org-mode tasks, schedules, and hierarchical outlines.',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Set up handlers
  setupToolHandlers(server, orgFilePaths);
  setupResourceHandlers(server, orgFilePaths);
  setupPromptHandlers(server, orgFilePaths);

  // Error handling
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  process.on('SIGINT', async () => {
    await server.close();
  });

  return server;
}