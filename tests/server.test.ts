import { describe, it, expect, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createServer } from '../src/server';

describe('MCP Server', () => {
  let server: Server;
  const mockOrgFiles = ['/tmp/test.org'];

  beforeEach(() => {
    server = createServer(mockOrgFiles);
  });

  it('should create a server instance', () => {
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(Server);
  });

  it('should have an error handler defined', () => {
    expect(server.onerror).toBeDefined();
    expect(typeof server.onerror).toBe('function');
  });

  it('should have close method', () => {
    expect(server.close).toBeDefined();
    expect(typeof server.close).toBe('function');
  });
});
