#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// Start the MCP server
const server = spawn('npm', ['start'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let messageId = 1;

// Function to send JSON-RPC request
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params,
  };

  server.stdin.write(JSON.stringify(request) + '\n');
}

// Read responses
const rl = createInterface({
  input: server.stdout,
  crlfDelay: Infinity,
});

let responsesReceived = 0;
const expectedResponses = 3; // Initialize, list resources, read resource

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('\n📥 Response:', JSON.stringify(response, null, 2));
    responsesReceived++;

    if (responsesReceived === expectedResponses) {
      console.log('\n✅ All tests completed successfully!');
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Ignore non-JSON lines (like startup messages)
  }
});

// Give server time to start
setTimeout(() => {
  console.log('🚀 Sending initialize request...');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  });

  setTimeout(() => {
    console.log('\n📋 Requesting list of resources...');
    sendRequest('resources/list');

    setTimeout(() => {
      console.log('\n📖 Reading org://category/work resource...');
      sendRequest('resources/read', {
        uri: 'org://category/work',
      });
    }, 1000);
  }, 1000);
}, 2000);

// Handle timeout
setTimeout(() => {
  console.error('❌ Test timed out');
  server.kill();
  process.exit(1);
}, 10000);
