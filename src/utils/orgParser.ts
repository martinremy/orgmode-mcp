import { readFile } from 'fs/promises';
import { basename } from 'path';
import { OrgFileMetadata, OrgFileContent } from '../types/index.js';

/**
 * Parse org-mode file headers to extract metadata
 */
export async function parseOrgFile(filePath: string): Promise<OrgFileContent> {
  const content = await readFile(filePath, 'utf-8');
  const metadata = extractMetadata(filePath, content);

  return {
    metadata,
    content,
  };
}

/**
 * Extract metadata from org-mode file content
 */
export function extractMetadata(filePath: string, content: string): OrgFileMetadata {
  const fileName = basename(filePath);
  let category: string | undefined;
  let title: string | undefined;
  const fileTags: string[] = [];

  // Parse each line looking for headers
  const lines = content.split('\n');

  for (const line of lines) {
    // Stop parsing after we hit the first headline
    if (line.match(/^\*+\s/)) {
      break;
    }

    // Parse #+CATEGORY: header
    const categoryMatch = line.match(/^#\+CATEGORY:\s*(.+)$/i);
    if (categoryMatch && categoryMatch[1]) {
      category = categoryMatch[1].trim();
      continue;
    }

    // Parse #+TITLE: header
    const titleMatch = line.match(/^#\+TITLE:\s*(.+)$/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      continue;
    }

    // Parse #+FILETAGS: header
    // Format: #+FILETAGS: :tag1:tag2:tag3:
    const fileTagsMatch = line.match(/^#\+FILETAGS:\s*(.+)$/i);
    if (fileTagsMatch && fileTagsMatch[1]) {
      const tagsString = fileTagsMatch[1].trim();
      // Extract tags between colons
      const tags = tagsString.split(':').filter(tag => tag.trim() !== '');
      fileTags.push(...tags);
      continue;
    }
  }

  return {
    filePath,
    fileName,
    category,
    title,
    fileTags,
  };
}

/**
 * Parse multiple org files and return their metadata and content
 */
export async function parseOrgFiles(filePaths: string[]): Promise<OrgFileContent[]> {
  const promises = filePaths.map(path => parseOrgFile(path));
  return Promise.all(promises);
}

/**
 * Filter org files by category
 */
export function filterByCategory(
  files: OrgFileContent[],
  category: string
): OrgFileContent[] {
  return files.filter(file => file.metadata.category === category);
}

/**
 * Filter org files by filetag
 */
export function filterByFileTag(
  files: OrgFileContent[],
  fileTag: string
): OrgFileContent[] {
  return files.filter(file => file.metadata.fileTags.includes(fileTag));
}

/**
 * Get all unique categories from a list of org files
 */
export function getUniqueCategories(files: OrgFileContent[]): string[] {
  const categories = files
    .map(file => file.metadata.category)
    .filter((cat): cat is string => cat !== undefined);
  return [...new Set(categories)].sort();
}

/**
 * Get all unique filetags from a list of org files
 */
export function getUniqueFileTags(files: OrgFileContent[]): string[] {
  const allTags = files.flatMap(file => file.metadata.fileTags);
  return [...new Set(allTags)].sort();
}

/**
 * Get unique filetags for files in a specific category
 */
export function getFileTagsForCategory(
  files: OrgFileContent[],
  category: string
): string[] {
  const categoryFiles = filterByCategory(files, category);
  return getUniqueFileTags(categoryFiles);
}
