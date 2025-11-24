import { describe, it, expect } from '@jest/globals';
import {
  extractMetadata,
  filterByCategory,
  filterByFileTag,
  getUniqueCategories,
  getUniqueFileTags,
  getFileTagsForCategory,
} from '../src/utils/orgParser';
import { OrgFileContent } from '../src/types';

describe('orgParser', () => {
  describe('extractMetadata', () => {
    it('should extract category from org file', () => {
      const content = `#+TITLE: Test File
#+CATEGORY: work

* Headline 1`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.category).toBe('work');
      expect(metadata.fileName).toBe('test.org');
      expect(metadata.filePath).toBe('/path/to/test.org');
    });

    it('should extract title from org file', () => {
      const content = `#+TITLE: My Work Projects
#+CATEGORY: work

* Headline 1`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.title).toBe('My Work Projects');
    });

    it('should extract filetags from org file', () => {
      const content = `#+TITLE: Test File
#+CATEGORY: work
#+FILETAGS: :urgent:client:

* Headline 1`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.fileTags).toEqual(['urgent', 'client']);
    });

    it('should handle multiple filetags with different spacing', () => {
      const content = `#+FILETAGS: :tag1:tag2:tag3:`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.fileTags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle case-insensitive headers', () => {
      const content = `#+title: Test File
#+category: work
#+filetags: :urgent:

* Headline 1`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.title).toBe('Test File');
      expect(metadata.category).toBe('work');
      expect(metadata.fileTags).toEqual(['urgent']);
    });

    it('should stop parsing at first headline', () => {
      const content = `#+CATEGORY: work

* Headline 1
#+CATEGORY: life

* Headline 2`;

      const metadata = extractMetadata('/path/to/test.org', content);

      // Should only get the first category before headlines
      expect(metadata.category).toBe('work');
    });

    it('should handle files with no metadata', () => {
      const content = `* Headline 1
* Headline 2`;

      const metadata = extractMetadata('/path/to/test.org', content);

      expect(metadata.category).toBeUndefined();
      expect(metadata.title).toBeUndefined();
      expect(metadata.fileTags).toEqual([]);
    });
  });

  describe('filterByCategory', () => {
    const mockFiles: OrgFileContent[] = [
      {
        metadata: {
          filePath: '/path/work.org',
          fileName: 'work.org',
          category: 'work',
          fileTags: [],
        },
        content: '* Work stuff',
      },
      {
        metadata: {
          filePath: '/path/life.org',
          fileName: 'life.org',
          category: 'life',
          fileTags: [],
        },
        content: '* Life stuff',
      },
      {
        metadata: {
          filePath: '/path/work2.org',
          fileName: 'work2.org',
          category: 'work',
          fileTags: [],
        },
        content: '* More work',
      },
    ];

    it('should filter files by category', () => {
      const workFiles = filterByCategory(mockFiles, 'work');

      expect(workFiles).toHaveLength(2);
      expect(workFiles[0]?.metadata.fileName).toBe('work.org');
      expect(workFiles[1]?.metadata.fileName).toBe('work2.org');
    });

    it('should return empty array for non-existent category', () => {
      const files = filterByCategory(mockFiles, 'nonexistent');

      expect(files).toHaveLength(0);
    });
  });

  describe('filterByFileTag', () => {
    const mockFiles: OrgFileContent[] = [
      {
        metadata: {
          filePath: '/path/work.org',
          fileName: 'work.org',
          category: 'work',
          fileTags: ['urgent', 'client'],
        },
        content: '* Work stuff',
      },
      {
        metadata: {
          filePath: '/path/life.org',
          fileName: 'life.org',
          category: 'life',
          fileTags: ['personal'],
        },
        content: '* Life stuff',
      },
      {
        metadata: {
          filePath: '/path/work2.org',
          fileName: 'work2.org',
          category: 'work',
          fileTags: ['urgent'],
        },
        content: '* More work',
      },
    ];

    it('should filter files by filetag', () => {
      const urgentFiles = filterByFileTag(mockFiles, 'urgent');

      expect(urgentFiles).toHaveLength(2);
      expect(urgentFiles[0]?.metadata.fileName).toBe('work.org');
      expect(urgentFiles[1]?.metadata.fileName).toBe('work2.org');
    });

    it('should return empty array for non-existent filetag', () => {
      const files = filterByFileTag(mockFiles, 'nonexistent');

      expect(files).toHaveLength(0);
    });
  });

  describe('getUniqueCategories', () => {
    it('should return unique categories sorted', () => {
      const mockFiles: OrgFileContent[] = [
        {
          metadata: {
            filePath: '/path/work.org',
            fileName: 'work.org',
            category: 'work',
            fileTags: [],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/life.org',
            fileName: 'life.org',
            category: 'life',
            fileTags: [],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/work2.org',
            fileName: 'work2.org',
            category: 'work',
            fileTags: [],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/learning.org',
            fileName: 'learning.org',
            category: 'learning',
            fileTags: [],
          },
          content: '',
        },
      ];

      const categories = getUniqueCategories(mockFiles);

      expect(categories).toEqual(['learning', 'life', 'work']);
    });

    it('should handle files without categories', () => {
      const mockFiles: OrgFileContent[] = [
        {
          metadata: {
            filePath: '/path/work.org',
            fileName: 'work.org',
            category: 'work',
            fileTags: [],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/uncategorized.org',
            fileName: 'uncategorized.org',
            fileTags: [],
          },
          content: '',
        },
      ];

      const categories = getUniqueCategories(mockFiles);

      expect(categories).toEqual(['work']);
    });
  });

  describe('getUniqueFileTags', () => {
    it('should return unique filetags sorted', () => {
      const mockFiles: OrgFileContent[] = [
        {
          metadata: {
            filePath: '/path/work.org',
            fileName: 'work.org',
            category: 'work',
            fileTags: ['urgent', 'client'],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/life.org',
            fileName: 'life.org',
            category: 'life',
            fileTags: ['personal', 'urgent'],
          },
          content: '',
        },
      ];

      const tags = getUniqueFileTags(mockFiles);

      expect(tags).toEqual(['client', 'personal', 'urgent']);
    });
  });

  describe('getFileTagsForCategory', () => {
    it('should return filetags only for specified category', () => {
      const mockFiles: OrgFileContent[] = [
        {
          metadata: {
            filePath: '/path/work.org',
            fileName: 'work.org',
            category: 'work',
            fileTags: ['urgent', 'client'],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/life.org',
            fileName: 'life.org',
            category: 'life',
            fileTags: ['personal'],
          },
          content: '',
        },
        {
          metadata: {
            filePath: '/path/work2.org',
            fileName: 'work2.org',
            category: 'work',
            fileTags: ['urgent', 'internal'],
          },
          content: '',
        },
      ];

      const workTags = getFileTagsForCategory(mockFiles, 'work');

      expect(workTags).toEqual(['client', 'internal', 'urgent']);
    });
  });
});
