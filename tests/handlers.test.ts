import { describe, it, expect } from '@jest/globals';

describe('Request Handlers', () => {
  describe('Tool Handlers', () => {
    it('should export setupToolHandlers function', async () => {
      const { setupToolHandlers } = await import('../src/handlers/tools');
      expect(setupToolHandlers).toBeDefined();
      expect(typeof setupToolHandlers).toBe('function');
    });
  });

  describe('Resource Handlers', () => {
    it('should export setupResourceHandlers function', async () => {
      const { setupResourceHandlers } = await import('../src/handlers/resources');
      expect(setupResourceHandlers).toBeDefined();
      expect(typeof setupResourceHandlers).toBe('function');
    });
  });
});
