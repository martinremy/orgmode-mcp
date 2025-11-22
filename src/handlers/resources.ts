import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

export function setupResourceHandlers(server: Server, orgFilePaths: string[]): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'local://example',
          name: 'Example Resource',
          description: 'An example resource provided by the MCP server',
          mimeType: 'text/plain',
        },
        // Add more resources here as you implement them
      ],
    };
  });

  // Handle resource read requests
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      switch (uri) {
        case 'local://example': {
          return {
            contents: [
              {
                uri,
                mimeType: 'text/plain',
                text: 'This is an example resource content from the MCP server.',
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unknown resource: ${uri}`
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Resource read failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}