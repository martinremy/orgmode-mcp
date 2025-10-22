import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createExampleTool(): Tool {
  return {
    name: 'example-tool',
    description: 'An example tool that demonstrates MCP server functionality',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'A message to process',
          default: 'Hello from MCP server!',
        },
      },
      additionalProperties: false,
    },
  };
}