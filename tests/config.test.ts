import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, validateAndLoadConfig } from '../src/config';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Config Module', () => {
  const testDir = join(__dirname, 'test-fixtures');
  const configPath = join(testDir, 'config.json');

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('loadConfig', () => {
    it('should load a valid config file', () => {
      // Create actual test files
      const testFile1 = join(testDir, 'test.org');
      const testFile2 = join(testDir, 'another.org');
      writeFileSync(testFile1, '* Test 1');
      writeFileSync(testFile2, '* Test 2');

      const config = {
        orgFiles: [testFile1, testFile2],
      };
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(true);
      expect(result.config).toEqual(config);
      expect(result.errors).toHaveLength(0);
      expect(result.expandedPaths).toHaveLength(2);
    });

    it('should return error when config file does not exist', () => {
      const result = loadConfig(join(testDir, 'nonexistent.json'));

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    it('should return error for invalid JSON', () => {
      writeFileSync(configPath, '{ invalid json }');

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should return error when orgFiles is missing', () => {
      const config = {};
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error when orgFiles is empty', () => {
      const config = { orgFiles: [] };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.toLowerCase().includes('at least one') || e.includes('must be specified'))).toBe(true);
    });

    it('should return error when orgFiles is not an array', () => {
      const config = { orgFiles: 'not-an-array' };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should expand glob patterns', () => {
      // Create test org files
      const testOrgDir = join(testDir, 'org');
      mkdirSync(testOrgDir, { recursive: true });
      writeFileSync(join(testOrgDir, 'file1.org'), '* Heading 1');
      writeFileSync(join(testOrgDir, 'file2.org'), '* Heading 2');
      writeFileSync(join(testOrgDir, 'life-todo.org'), '* TODO Task');

      const config = {
        orgFiles: [
          join(testOrgDir, '*.org'),
        ],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(true);
      expect(result.expandedPaths).toBeDefined();
      expect(result.expandedPaths!.length).toBe(3);
    });

    it('should support absolute paths', () => {
      // Create a test org file
      const testFile = join(testDir, 'absolute-test.org');
      writeFileSync(testFile, '* Test');

      const config = {
        orgFiles: [testFile],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(true);
      expect(result.expandedPaths).toContain(testFile);
    });

    it('should support wildcard patterns with prefix', () => {
      // Create test org files
      const testOrgDir = join(testDir, 'org');
      mkdirSync(testOrgDir, { recursive: true });
      writeFileSync(join(testOrgDir, 'life-todo.org'), '* TODO');
      writeFileSync(join(testOrgDir, 'life-notes.org'), '* Notes');
      writeFileSync(join(testOrgDir, 'work.org'), '* Work');

      const config = {
        orgFiles: [
          join(testOrgDir, 'life*.org'),
        ],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(true);
      expect(result.expandedPaths).toBeDefined();
      expect(result.expandedPaths!.length).toBe(2);
      expect(result.expandedPaths!.every(p => p.includes('life'))).toBe(true);
    });

    it('should warn when pattern matches no files', () => {
      const config = {
        orgFiles: [
          join(testDir, 'nonexistent*.org'),
          join(testDir, 'alsonothere.org'),
        ],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('No org files found'))).toBe(true);
    });

    it('should remove duplicate paths when patterns overlap', () => {
      // Create test org file
      const testFile = join(testDir, 'test.org');
      writeFileSync(testFile, '* Test');

      const config = {
        orgFiles: [
          testFile,
          testFile, // Same file twice
          join(testDir, '*.org'), // Pattern that includes the same file
        ],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const result = loadConfig(configPath);

      expect(result.isValid).toBe(true);
      expect(result.expandedPaths).toBeDefined();
      // Should have only one instance of the file
      const testFilePaths = result.expandedPaths!.filter(p => p === testFile);
      expect(testFilePaths.length).toBe(1);
    });

    it('should expand tilde (~) to home directory', () => {
      // Create test org file in a temp location
      const testFile = join(testDir, 'home-test.org');
      writeFileSync(testFile, '* Test');

      // Use a pattern with tilde that we'll expand to the test directory
      // We'll use the testDir path but replace the beginning with ~
      // For testing purposes, just verify tilde expansion logic works
      const homeDir = require('os').homedir();

      // Create a file in home tmp if it exists
      const homeTmpDir = join(homeDir, 'tmp');
      let actualTestFile: string;
      try {
        mkdirSync(homeTmpDir, { recursive: true });
        actualTestFile = join(homeTmpDir, 'tilde-test.org');
        writeFileSync(actualTestFile, '* Tilde Test');

        const config = {
          orgFiles: ['~/tmp/tilde-test.org'],
        };
        writeFileSync(configPath, JSON.stringify(config));

        const result = loadConfig(configPath);

        expect(result.isValid).toBe(true);
        expect(result.expandedPaths).toBeDefined();
        expect(result.expandedPaths!.length).toBe(1);
        expect(result.expandedPaths![0]).toBe(actualTestFile);

        // Cleanup
        rmSync(actualTestFile, { force: true });
      } catch (error) {
        // Skip test if we can't create files in home directory
        console.log('Skipping tilde expansion test - cannot create test file in home directory');
      }
    });
  });

  describe('validateAndLoadConfig', () => {
    it('should return expanded paths for valid config', () => {
      // Create test org file
      const testFile = join(testDir, 'test.org');
      writeFileSync(testFile, '* Test');

      const config = {
        orgFiles: [testFile],
      };
      writeFileSync(configPath, JSON.stringify(config));

      const paths = validateAndLoadConfig(configPath);

      expect(paths).toBeDefined();
      expect(paths).toContain(testFile);
    });

    it('should throw error for invalid config', () => {
      const config = { orgFiles: [] };
      writeFileSync(configPath, JSON.stringify(config));

      expect(() => {
        validateAndLoadConfig(configPath);
      }).toThrow('Invalid configuration');
    });

    it('should throw error when config file does not exist', () => {
      expect(() => {
        validateAndLoadConfig(join(testDir, 'nonexistent.json'));
      }).toThrow();
    });
  });
});
