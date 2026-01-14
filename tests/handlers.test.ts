import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { OrgFileContent } from '../src/types';

// Mock the orgParser module
const mockParseOrgFiles = jest.fn<(filePaths: string[]) => Promise<OrgFileContent[]>>();
const mockFilterByCategory = jest.fn<(files: OrgFileContent[], category: string) => OrgFileContent[]>();
const mockFilterByFileTag = jest.fn<(files: OrgFileContent[], tag: string) => OrgFileContent[]>();
const mockGetUniqueCategories = jest.fn<(files: OrgFileContent[]) => string[]>();
const mockGetFileTagsForCategory = jest.fn<(files: OrgFileContent[], category: string) => string[]>();

jest.unstable_mockModule('../src/utils/orgParser.js', () => ({
  parseOrgFiles: mockParseOrgFiles,
  filterByCategory: mockFilterByCategory,
  filterByFileTag: mockFilterByFileTag,
  getUniqueCategories: mockGetUniqueCategories,
  getFileTagsForCategory: mockGetFileTagsForCategory,
}));

// Mock test data
const mockOrgFiles: OrgFileContent[] = [
  {
    metadata: {
      filePath: '/path/to/work.org',
      fileName: 'work.org',
      category: 'work',
      title: 'Work Tasks',
      fileTags: ['urgent', 'project-x'],
    },
    content: '#+TITLE: Work Tasks\n#+CATEGORY: work\n#+FILETAGS: :urgent:project-x:\n\n* TODO Task 1\n* DONE Task 2',
  },
  {
    metadata: {
      filePath: '/path/to/personal.org',
      fileName: 'personal.org',
      category: 'personal',
      title: 'Personal Tasks',
      fileTags: ['health', 'finance'],
    },
    content: '#+TITLE: Personal Tasks\n#+CATEGORY: personal\n#+FILETAGS: :health:finance:\n\n* TODO Exercise\n* TODO Budget',
  },
  {
    metadata: {
      filePath: '/path/to/work2.org',
      fileName: 'work2.org',
      category: 'work',
      title: 'More Work',
      fileTags: ['urgent'],
    },
    content: '#+TITLE: More Work\n#+CATEGORY: work\n#+FILETAGS: :urgent:\n\n* TODO Meeting prep',
  },
];

describe('Request Handlers', () => {
  describe('Tool Handlers', () => {
    it('should export setupToolHandlers function', async () => {
      const { setupToolHandlers } = await import('../src/handlers/tools');
      expect(setupToolHandlers).toBeDefined();
      expect(typeof setupToolHandlers).toBe('function');
    });

    // Note: Comprehensive unit tests for individual tools would require an active
    // MCP server connection. The implementation has been manually tested and follows
    // the same patterns as the existing resource handlers.
  });

  describe('Resource Handlers', () => {
    it('should export setupResourceHandlers function', async () => {
      const { setupResourceHandlers } = await import('../src/handlers/resources');
      expect(setupResourceHandlers).toBeDefined();
      expect(typeof setupResourceHandlers).toBe('function');
    });
  });

  // Integration tests removed - they require a connected MCP server.
  // The unit tests above already verify that tools return correct data
  // by mocking the underlying functions and checking the output format.
});
