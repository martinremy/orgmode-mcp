# Development Guide

This guide covers how to extend and develop your MCP server with new tools, resources, and capabilities.

## Architecture Overview

The MCP server follows a modular architecture:

- **`src/index.ts`** - Main entry point, handles stdio transport
- **`src/server.ts`** - Server configuration and setup
- **`src/handlers/`** - Request handlers for different MCP capabilities
- **`src/tools/`** - Individual tool implementations
- **`src/resources/`** - Resource providers
- **`src/types/`** - TypeScript type definitions

## Adding New Tools

Tools are functions that can be called by MCP clients. Here's how to add a new tool:

### 1. Create Tool Definition

Create a new file in `src/tools/` (e.g., `src/tools/my-tool.ts`):

```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createMyTool(): Tool {
  return {
    name: 'my-tool',
    description: 'Description of what your tool does',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Input parameter description',
        },
        options: {
          type: 'object',
          properties: {
            option1: { type: 'boolean' },
            option2: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      required: ['input'],
      additionalProperties: false,
    },
  };
}
```

### 2. Implement Tool Handler

Add the tool handler in `src/handlers/tools.ts`:

```typescript
// Import your tool
import { createMyTool } from '../tools/my-tool.js';

// Add to the tools list in setupToolHandlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      createExampleTool(),
      createMyTool(), // Add your tool here
    ],
  };
});

// Add case in the CallToolRequestSchema handler
case 'my-tool': {
  const result = await handleMyTool(args || {});
  return {
    content: [
      {
        type: 'text',
        text: result,
      },
    ],
  };
}

// Implement the handler function
async function handleMyTool(args: Record<string, unknown>): Promise<string> {
  const schema = z.object({
    input: z.string(),
    options: z.object({
      option1: z.boolean().optional(),
      option2: z.string().optional(),
    }).optional(),
  });

  const parsed = schema.parse(args);
  
  // Your tool logic here
  return `Tool result: ${parsed.input}`;
}
```

### 3. Test Your Tool

Build and test your tool:

```bash
npm run build
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "my-tool", "arguments": {"input": "test"}}}' | npm start
```

## Adding New Resources

Resources provide read-only data to MCP clients. Here's how to add them:

### 1. Register Resource

Update `src/handlers/resources.ts`:

```typescript
// Add to the resources list
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'local://example',
        name: 'Example Resource',
        description: 'An example resource',
        mimeType: 'text/plain',
      },
      {
        uri: 'local://my-resource',
        name: 'My Resource',
        description: 'Description of my resource',
        mimeType: 'application/json',
      },
    ],
  };
});

// Add case in ReadResourceRequestSchema handler
case 'local://my-resource': {
  const data = await getMyResourceData();
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function getMyResourceData(): Promise<any> {
  // Your resource logic here
  return { message: 'Hello from my resource!' };
}
```

## Development Workflow

### 1. Setup Development Environment

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### 2. Testing Changes

For rapid development, use the development mode:

```bash
npm run dev
```

This runs the server with TypeScript compilation on-the-fly using `tsx`.

### 3. Manual Testing

Test individual components:

```bash
# Test tools listing
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npm run dev

# Test specific tool
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "example-tool", "arguments": {"message": "test"}}}' | npm run dev

# Test resources listing
echo '{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}' | npm run dev

# Test specific resource
echo '{"jsonrpc": "2.0", "id": 1, "method": "resources/read", "params": {"uri": "local://example"}}' | npm run dev
```

### 4. Integration Testing

Configure Claude Desktop to use your development server:

```json
{
  "mcpServers": {
    "mcp-server-local-dev": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/Users/mremy/devhome/github/mcp-server-local"
    }
  }
}
```

## Best Practices

### Error Handling

Always use proper error handling in your tools and resources:

```typescript
try {
  // Your tool logic
  return result;
} catch (error) {
  if (error instanceof McpError) {
    throw error;
  }
  
  throw new McpError(
    ErrorCode.InternalError,
    `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
  );
}
```

### Input Validation

Use Zod for robust input validation:

```typescript
import { z } from 'zod';

const schema = z.object({
  requiredField: z.string(),
  optionalField: z.number().optional(),
  enumField: z.enum(['option1', 'option2']).default('option1'),
});

const parsed = schema.parse(args);
```

### Async Operations

Handle async operations properly:

```typescript
async function handleAsyncTool(args: Record<string, unknown>): Promise<string> {
  const parsed = schema.parse(args);
  
  try {
    const result = await someAsyncOperation(parsed.input);
    return `Success: ${result}`;
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Async operation failed: ${error}`
    );
  }
}
```

### Logging

Add logging for debugging:

```typescript
console.error('[MCP Debug]', 'Tool called:', name, 'with args:', args);
```

## Advanced Features

### Environment Variables

Use environment variables for configuration:

```typescript
const config = {
  debug: process.env.DEBUG === 'true',
  apiKey: process.env.API_KEY,
};
```

### File System Operations

For file system tools, be careful with security:

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

async function readLocalFile(filePath: string): Promise<string> {
  // Validate and sanitize the path
  const safePath = path.resolve(process.cwd(), filePath);
  
  // Check if path is within allowed directory
  if (!safePath.startsWith(process.cwd())) {
    throw new McpError(ErrorCode.InvalidRequest, 'Path not allowed');
  }
  
  return await fs.readFile(safePath, 'utf-8');
}
```

### External API Integration

For tools that call external APIs:

```typescript
async function callExternalAPI(params: any): Promise<any> {
  const response = await fetch('https://api.example.com/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`,
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new McpError(
      ErrorCode.InternalError,
      `API call failed: ${response.statusText}`
    );
  }
  
  return await response.json();
}
```

## Testing

### Unit Testing

Add unit tests for your tools and resources:

```typescript
// tests/tools/my-tool.test.ts
import { describe, it, expect } from '@jest/globals';
import { handleMyTool } from '../../src/handlers/tools.js';

describe('MyTool', () => {
  it('should handle valid input', async () => {
    const result = await handleMyTool({ input: 'test' });
    expect(result).toContain('test');
  });
  
  it('should throw on invalid input', async () => {
    await expect(handleMyTool({})).rejects.toThrow();
  });
});
```

### Integration Testing

Test the full MCP protocol:

```typescript
import { createServer } from '../src/server.js';

describe('MCP Server Integration', () => {
  it('should list tools', async () => {
    const server = createServer();
    // Test MCP protocol messages
  });
});
```

## Deployment

### Building for Production

```bash
npm run clean
npm run build
```

### Configuration Management

Use environment-specific configurations:

```typescript
const config = {
  development: {
    debug: true,
    logLevel: 'verbose',
  },
  production: {
    debug: false,
    logLevel: 'error',
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env];
```

## Troubleshooting

### Common Development Issues

1. **TypeScript compilation errors**
   - Check your imports use `.js` extensions for relative imports
   - Verify all dependencies are installed
   - Ensure `tsconfig.json` is properly configured

2. **Runtime errors**
   - Check that all async functions are properly awaited
   - Verify error handling is in place
   - Use proper MCP error types

3. **MCP protocol issues**
   - Validate JSON schemas match MCP specifications
   - Ensure proper request/response format
   - Check that all required fields are present

4. **Claude Desktop integration**
   - Verify the server builds successfully
   - Check Claude Desktop configuration file syntax
   - Restart Claude Desktop after changes