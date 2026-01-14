import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  parseOrgFiles,
  filterByCategory,
  filterByFileTag,
  getUniqueCategories,
  getFileTagsForCategory,
} from '../utils/orgParser.js';

// Zod schemas for parameter validation
const GetOrgFileSchema = z.object({
  filename: z.string().describe('The filename to retrieve (e.g., "work.org")'),
});

const GetCategorySchema = z.object({
  category: z.string().describe('The category name (e.g., "work", "personal")'),
});

const GetCategoryWithTagSchema = z.object({
  category: z.string().describe('The category name'),
  filetag: z.string().describe('The filetag to filter by'),
});

export function setupToolHandlers(server: Server, orgFilePaths: string[]): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Discovery Tools
        {
          name: 'list_org_files',
          description: 'Get metadata for all available org files including filename, path, category, title, and filetags',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_categories',
          description: 'Get all available categories with file counts and associated filetags',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        // Content Retrieval Tools
        {
          name: 'get_all_org_files',
          description: 'Get all org files combined into a single document',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_org_file',
          description: 'Get the content of a specific org file by filename',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'The filename to retrieve (e.g., "work.org")',
              },
            },
            required: ['filename'],
          },
        },
        {
          name: 'get_category',
          description: 'Get all org files in a specific category',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The category name (e.g., "work", "personal")',
              },
            },
            required: ['category'],
          },
        },
        {
          name: 'get_category_with_tag',
          description: 'Get org files in a specific category filtered by filetag',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The category name',
              },
              filetag: {
                type: 'string',
                description: 'The filetag to filter by',
              },
            },
            required: ['category', 'filetag'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_org_files': {
          const orgFiles = await parseOrgFiles(orgFilePaths);
          const metadata = orgFiles.map(file => ({
            fileName: file.metadata.fileName,
            filePath: file.metadata.filePath,
            category: file.metadata.category,
            title: file.metadata.title,
            fileTags: file.metadata.fileTags,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(metadata, null, 2),
              },
            ],
          };
        }

        case 'list_categories': {
          const orgFiles = await parseOrgFiles(orgFilePaths);
          const categories = getUniqueCategories(orgFiles);

          const categoryData = categories.map(category => {
            const categoryFiles = filterByCategory(orgFiles, category);
            const fileTags = getFileTagsForCategory(orgFiles, category);

            return {
              category,
              fileCount: categoryFiles.length,
              fileTags,
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(categoryData, null, 2),
              },
            ],
          };
        }

        case 'get_all_org_files': {
          const orgFiles = await parseOrgFiles(orgFilePaths);

          if (orgFiles.length === 0) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No org files available'
            );
          }

          const combinedContent = orgFiles
            .map(file => {
              return `# File: ${file.metadata.fileName}\n# Path: ${file.metadata.filePath}\n\n${file.content}\n`;
            })
            .join('\n---\n\n');

          return {
            content: [
              {
                type: 'text',
                text: combinedContent,
              },
            ],
          };
        }

        case 'get_org_file': {
          const validated = GetOrgFileSchema.safeParse(args);

          if (!validated.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Missing required parameter: filename`
            );
          }

          const { filename } = validated.data;
          const orgFiles = await parseOrgFiles(orgFilePaths);
          const file = orgFiles.find(f => f.metadata.fileName === filename);

          if (!file) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `File not found: ${filename}`
            );
          }

          return {
            content: [
              {
                type: 'text',
                text: file.content,
              },
            ],
          };
        }

        case 'get_category': {
          const validated = GetCategorySchema.safeParse(args);

          if (!validated.success) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Missing required parameter: category`
            );
          }

          const { category } = validated.data;
          const orgFiles = await parseOrgFiles(orgFilePaths);
          const categories = getUniqueCategories(orgFiles);

          if (!categories.includes(category)) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Category not found: ${category}. Available categories: ${categories.join(', ')}`
            );
          }

          const filteredFiles = filterByCategory(orgFiles, category);

          if (filteredFiles.length === 0) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `No files found for category: ${category}`
            );
          }

          const combinedContent = filteredFiles
            .map(file => {
              return `# File: ${file.metadata.fileName}\n# Path: ${file.metadata.filePath}\n\n${file.content}\n`;
            })
            .join('\n---\n\n');

          return {
            content: [
              {
                type: 'text',
                text: combinedContent,
              },
            ],
          };
        }

        case 'get_category_with_tag': {
          const validated = GetCategoryWithTagSchema.safeParse(args);

          if (!validated.success) {
            const missingFields = [];
            if (!args || typeof args !== 'object') {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Missing required parameters: category, filetag'
              );
            }
            if (!('category' in args)) missingFields.push('category');
            if (!('filetag' in args)) missingFields.push('filetag');

            throw new McpError(
              ErrorCode.InvalidParams,
              `Missing required parameter${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`
            );
          }

          const { category, filetag } = validated.data;
          const orgFiles = await parseOrgFiles(orgFilePaths);
          const categories = getUniqueCategories(orgFiles);

          if (!categories.includes(category)) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Category not found: ${category}. Available categories: ${categories.join(', ')}`
            );
          }

          const categoryFiles = filterByCategory(orgFiles, category);
          const availableTags = getFileTagsForCategory(orgFiles, category);

          if (!availableTags.includes(filetag)) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `No files found for category '${category}' with filetag '${filetag}'. Available filetags for this category: ${availableTags.join(', ')}`
            );
          }

          const filteredFiles = filterByFileTag(categoryFiles, filetag);

          if (filteredFiles.length === 0) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `No files found for category '${category}' with filetag '${filetag}'`
            );
          }

          const combinedContent = filteredFiles
            .map(file => {
              return `# File: ${file.metadata.fileName}\n# Path: ${file.metadata.filePath}\n\n${file.content}\n`;
            })
            .join('\n---\n\n');

          return {
            content: [
              {
                type: 'text',
                text: combinedContent,
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
