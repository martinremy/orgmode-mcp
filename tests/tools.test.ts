import { describe, it, expect } from '@jest/globals';
import { createExampleTool } from '../src/tools/example';

describe('Tool Implementations', () => {
  describe('createExampleTool', () => {
    it('should create a valid tool definition', () => {
      const tool = createExampleTool();

      expect(tool).toBeDefined();
      expect(tool.name).toBe('example-tool');
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    });

    it('should have correct input schema', () => {
      const tool = createExampleTool();

      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();

      const properties = tool.inputSchema.properties as any;
      expect(properties.message).toBeDefined();
      expect(properties.message.type).toBe('string');
    });

    it('should have a default message in schema', () => {
      const tool = createExampleTool();

      const properties = tool.inputSchema.properties as any;
      expect(properties.message.default).toBe('Hello from MCP server!');
    });
  });
});
