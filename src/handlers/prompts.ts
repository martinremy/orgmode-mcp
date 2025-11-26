import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import {
  parseOrgFiles,
  getUniqueCategories,
} from '../utils/orgParser.js';

export function setupPromptHandlers(server: Server, orgFilePaths: string[]): void {
  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    const orgFiles = await parseOrgFiles(orgFilePaths);
    const categories = getUniqueCategories(orgFiles);

    return {
      prompts: [
        {
          name: 'review-due-items',
          title: 'Review Due Items',
          description: 'Review TODO items in a specific category, focusing on items due today or overdue',
          arguments: [
            {
              name: 'category',
              description: 'Org category to review (e.g., "work", "personal")',
              required: true,
            },
            {
              name: 'time_scope',
              description: 'Time focus: "today", "week", "overdue", or "all" (default: "today")',
              required: false,
            },
          ],
        },
        {
          name: 'summarize-category',
          title: 'Summarize Category',
          description: 'Get a comprehensive summary of all org files in a specific category',
          arguments: [
            {
              name: 'category',
              description: `Category to summarize. Available: ${categories.join(', ') || 'none'}`,
              required: true,
            },
          ],
        },
      ],
    };
  });

  // Handle prompt get requests
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const orgFiles = await parseOrgFiles(orgFilePaths);

      switch (name) {
        case 'review-due-items': {
          const category = args?.category as string;
          const timeScope = (args?.time_scope as string) || 'today';

          if (!category) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required argument: category'
            );
          }

          // Validate time_scope
          const validScopes = ['today', 'week', 'overdue', 'all'];
          if (!validScopes.includes(timeScope)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Invalid time_scope: ${timeScope}. Must be one of: ${validScopes.join(', ')}`
            );
          }

          const today = new Date().toISOString().split('T')[0];
          const scopeText =
            timeScope === 'today'
              ? 'due today or overdue'
              : timeScope === 'week'
              ? 'due this week'
              : timeScope === 'overdue'
              ? 'overdue'
              : 'all';

          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please review all TODO items in my "${category}" org files. Focus on items ${scopeText}.\n\nProvide:\n1. A prioritized list of what I should focus on\n2. Any items that may be at risk of becoming overdue\n3. Suggestions for rescheduling or breaking down large tasks\n4. Any blockers or dependencies I should be aware of\n\nHere are the org files for the "${category}" category:`,
                },
              },
              {
                role: 'user',
                content: {
                  type: 'resource',
                  resource: {
                    uri: `org://category/${category}`,
                    mimeType: 'text/plain',
                  },
                },
              },
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Today's date: ${today}\nTime scope: ${scopeText}`,
                },
              },
            ],
          };
        }

        case 'summarize-category': {
          const category = args?.category as string;

          if (!category) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Missing required argument: category'
            );
          }

          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please provide a comprehensive summary of all org files in the "${category}" category.\n\nInclude:\n1. Key themes and topics\n2. Important TODO items and their status\n3. Recent changes or updates\n4. Any patterns or insights you notice\n\nHere are the org files:`,
                },
              },
              {
                role: 'user',
                content: {
                  type: 'resource',
                  resource: {
                    uri: `org://category/${category}`,
                    mimeType: 'text/plain',
                  },
                },
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unknown prompt: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Prompt generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
