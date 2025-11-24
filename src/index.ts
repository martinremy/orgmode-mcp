#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { validateAndLoadConfig } from './config.js';

async function main() {
  // Load and validate configuration
  // Support CONFIG_PATH environment variable for flexible deployment
  const configPath = process.env.CONFIG_PATH || './config.json';
  let orgFilePaths: string[];
  try {
    orgFilePaths = validateAndLoadConfig(configPath);
  } catch (error) {
    console.error('Failed to load configuration:', (error as Error).message);
    process.exit(1);
  }

  const server = createServer(orgFilePaths);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

// Run the server
main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});