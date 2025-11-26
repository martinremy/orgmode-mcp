import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import {
  parseOrgFiles,
  filterByCategory,
  filterByFileTag,
  getUniqueCategories,
  getFileTagsForCategory,
} from '../utils/orgParser.js';

export function setupResourceHandlers(server: Server, orgFilePaths: string[]): void {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const orgFiles = await parseOrgFiles(orgFilePaths);
    const categories = getUniqueCategories(orgFiles);
    const resources = [];

    // Add org://all resource
    resources.push({
      uri: 'org://all',
      name: 'All Org Files',
      description: 'All org-mode files combined',
      mimeType: 'text/plain',
    });

    // Add individual file resources
    for (const file of orgFiles) {
      resources.push({
        uri: `org://file/${file.metadata.fileName}`,
        name: file.metadata.title || file.metadata.fileName,
        description: `Org file: ${file.metadata.fileName}`,
        mimeType: 'text/plain',
      });
    }

    // Add category resources
    for (const category of categories) {
      const categoryFiles = filterByCategory(orgFiles, category);
      const fileTags = getFileTagsForCategory(orgFiles, category);

      resources.push({
        uri: `org://category/${category}`,
        name: `Category: ${category}`,
        description: `All files in category '${category}' (${categoryFiles.length} file${categoryFiles.length !== 1 ? 's' : ''})`,
        mimeType: 'text/plain',
      });

      // Add category + filetag resources
      for (const fileTag of fileTags) {
        const taggedFiles = filterByFileTag(categoryFiles, fileTag);
        resources.push({
          uri: `org://category/${category}/filetag/${fileTag}`,
          name: `Category: ${category}, Tag: ${fileTag}`,
          description: `Files in category '${category}' with filetag '${fileTag}' (${taggedFiles.length} file${taggedFiles.length !== 1 ? 's' : ''})`,
          mimeType: 'text/plain',
        });
      }
    }

    return { resources };
  });

  // Handle resource read requests
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      const orgFiles = await parseOrgFiles(orgFilePaths);

      // Handle org://all
      if (uri === 'org://all') {
        const combinedContent = orgFiles
          .map(file => {
            return `# File: ${file.metadata.fileName}\n# Path: ${file.metadata.filePath}\n\n${file.content}\n`;
          })
          .join('\n---\n\n');

        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: combinedContent,
            },
          ],
        };
      }

      // Handle org://file/{filename}
      const fileMatch = uri.match(/^org:\/\/file\/(.+)$/);
      if (fileMatch) {
        const fileName = fileMatch[1];
        const file = orgFiles.find(f => f.metadata.fileName === fileName);

        if (!file) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `File not found: ${fileName}`
          );
        }

        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: file.content,
            },
          ],
        };
      }

      // Handle org://category/{category}/filetag/{tag}
      const categoryFileTagMatch = uri.match(/^org:\/\/category\/([^/]+)\/filetag\/(.+)$/);
      if (categoryFileTagMatch) {
        const category = categoryFileTagMatch[1];
        const fileTag = categoryFileTagMatch[2];
        if (!category || !fileTag) {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid category or filetag in URI');
        }
        const categoryFiles = filterByCategory(orgFiles, category);
        const filteredFiles = filterByFileTag(categoryFiles, fileTag);

        if (filteredFiles.length === 0) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `No files found for category '${category}' with filetag '${fileTag}'`
          );
        }

        const combinedContent = filteredFiles
          .map(file => {
            return `# File: ${file.metadata.fileName}\n# Path: ${file.metadata.filePath}\n\n${file.content}\n`;
          })
          .join('\n---\n\n');

        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: combinedContent,
            },
          ],
        };
      }

      // Handle org://category/{category}
      const categoryMatch = uri.match(/^org:\/\/category\/(.+)$/);
      if (categoryMatch) {
        const category = categoryMatch[1];
        if (!category) {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid category in URI');
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
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: combinedContent,
            },
          ],
        };
      }

      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource URI format: ${uri}`
      );
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
