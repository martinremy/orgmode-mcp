# Claude Desktop Integration

This guide explains how to integrate your MCP server with Claude Desktop.

## Configuration

Claude Desktop uses a configuration file to define MCP servers. The configuration file is located at:

**macOS/Linux:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%/Claude/claude_desktop_config.json
```

## Adding Your MCP Server

1. **Build your server first:**
   ```bash
   npm run build
   ```

2. **Edit the Claude Desktop configuration file:**
   ```bash
   # macOS/Linux
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Or create it if it doesn't exist
   mkdir -p ~/Library/Application\ Support/Claude
   touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Add your server configuration:**
   ```json
   {
     "mcpServers": {
       "mcp-server-local": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/Users/mremy/devhome/github/orgmode-mcp"
       }
     }
   }
   ```

   **Important:** Update the `cwd` path to match your actual project location.

4. **If you have other MCP servers, add this one to the existing configuration:**
   ```json
   {
     "mcpServers": {
       "existing-server": {
         "command": "python",
         "args": ["path/to/existing/server.py"]
       },
       "orgmode-mcp": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/Users/mremy/devhome/github/orgmode-mcp"
       }
     }
   }
   ```

## Verification

1. **Restart Claude Desktop** after making configuration changes.

2. **Check if your server is loaded:**
   - Open Claude Desktop
   - Look for any error messages during startup
   - Try using tools or accessing resources provided by your server

3. **Debug connection issues:**
   - Check the Claude Desktop console/logs for error messages
   - Verify your server builds and runs correctly:
     ```bash
     npm run build
     npm start
     ```
   - Test your server manually by sending MCP messages via stdio

## Example Configuration Files

### Basic Configuration
```json
{
  "mcpServers": {
    "mcp-server-local": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/Users/mremy/devhome/github/mcp-server-local"
    }
  }
}
```

### Configuration with Environment Variables
```json
{
  "mcpServers": {
    "mcp-server-local": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/Users/mremy/devhome/github/mcp-server-local",
      "env": {
        "DEBUG": "true",
        "MCP_SERVER_NAME": "my-local-server"
      }
    }
  }
}
```

### Development Configuration (using tsx)
For development, you can configure Claude Desktop to run your server directly from TypeScript:

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

## Troubleshooting

### Common Issues

1. **Server not starting:**
   - Verify the path in `cwd` is correct
   - Ensure the server builds successfully with `npm run build`
   - Check that Node.js is installed and accessible

2. **Tools not showing up:**
   - Verify your tools are properly exported in `src/handlers/tools.ts`
   - Check that the tool schemas are valid JSON Schema
   - Restart Claude Desktop after code changes

3. **Resources not accessible:**
   - Verify your resources are properly registered in `src/handlers/resources.ts`
   - Check that resource URIs follow the expected format
   - Ensure resource handlers don't throw unhandled errors

4. **Permission errors:**
   - Ensure Claude Desktop has permission to execute Node.js and access your project files
   - Check file permissions on your project directory

### Debugging Steps

1. **Test server manually:**
   ```bash
   cd /Users/mremy/devhome/github/mcp-server-local
   npm run build
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | npm start
   ```

2. **Check Claude Desktop logs:**
   - macOS: Look in Console.app for Claude-related messages
   - Enable debug logging in your server with environment variables

3. **Validate configuration:**
   - Use a JSON validator to ensure your `claude_desktop_config.json` is valid
   - Double-check all paths and commands

## Next Steps

Once your server is successfully integrated with Claude Desktop:

1. Test all your tools and resources
2. Monitor performance and error handling
3. Add more tools and resources as needed
4. Consider implementing logging for production use

See [development.md](./development.md) for information on extending your MCP server.