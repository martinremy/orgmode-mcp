# Org Mode MCP Server

An MCP (Model Context Protocol) server for working with Org Mode files and workflows. This server enables Claude Desktop and other MCP-compatible clients to interact with your Org Mode files, parse their structure, and perform various operations on them.

## Features

- ✨ TypeScript-based MCP server implementation
- 🔧 Extensible tool and resource system
- 📡 Standard stdio transport for MCP communication
- 🎯 Ready for integration with Claude Desktop
- 🛠️ Development-friendly with hot reloading
- 📁 Configurable org-mode file paths with wildcard support

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Configure your org-mode files:
   ```bash
   cp config-example.json config.json
   ```

   Then edit `config.json` to specify the paths to your org-mode files:
   ```json
   {
     "orgFiles": [
       "/path/to/your/org/files/*.org",
       "/path/to/specific-file.org",
       "~/Documents/notes/**/*.org"
     ]
   }
   ```

   The `orgFiles` array supports:
   - Absolute file paths: `/Users/username/notes/work.org`
   - Wildcard patterns: `/Users/username/notes/*.org`
   - Recursive patterns: `/Users/username/notes/**/*.org`
   - Prefix matching: `/Users/username/notes/life*.org`
   - Tilde expansion: `~/Documents/notes/*.org`

   See the [Configuration](#configuration) section for more details.

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### Testing the Server

You can test the server manually by running it and sending MCP messages via stdio:

```bash
npm run dev
```

Then send a JSON-RPC message like:
```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
```

## Configuration

The server requires a `config.json` file in the project root directory to specify which org-mode files to process.

**Setup**: Copy `config-example.json` to `config.json` and update the paths to point to your org-mode files:
```bash
cp config-example.json config.json
```

### Configuration File Format

```json
{
  "orgFiles": [
    "/absolute/path/to/file.org",
    "/path/to/directory/*.org",
    "/path/with/wildcard/life*.org",
    "~/Documents/notes/*.org"
  ]
}
```

### Supported Path Patterns

- **Absolute paths**: `/Users/username/notes/work.org`
- **Wildcard patterns**:
  - `*.org` - All .org files in a directory
  - `**/*.org` - All .org files recursively
  - `life*.org` - Files starting with "life"
- **Multiple patterns**: List multiple paths and patterns in the array

### Validation

When the server starts, it will:
- Validate the configuration file structure
- Expand all glob patterns to find matching files
- Report errors if:
  - The config file is missing or invalid JSON
  - The `orgFiles` array is empty or missing
  - No files match the specified patterns
- Display warnings if:
  - Individual patterns match no files
  - Pattern expansion encounters errors

### Example Configurations

**Simple configuration:**
```json
{
  "orgFiles": ["/Users/martin/notes/work.org"]
}
```

**Multiple files with wildcards:**
```json
{
  "orgFiles": [
    "/Users/martin/Dropbox/orgmode/work.org",
    "/Users/martin/Dropbox/orgmode/life*.org",
    "/tmp/scratch.org"
  ]
}
```

**Recursive pattern:**
```json
{
  "orgFiles": ["/Users/martin/Documents/**/*.org"]
}
```

## Project Structure

```
src/
├── index.ts          # Main entry point
├── server.ts         # Server setup and configuration
├── config.ts         # Configuration loader and validator
├── handlers/         # Request handlers
│   ├── tools.ts      # Tool request handlers
│   └── resources.ts  # Resource request handlers
├── tools/            # Tool implementations
│   └── example.ts    # Example tool
├── resources/        # Resource providers
└── types/            # TypeScript type definitions
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled server
- `npm run dev` - Run with TypeScript and hot reloading
- `npm run clean` - Clean build artifacts
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Integration with Claude Desktop

See [docs/claude-integration.md](./docs/claude-integration.md) for detailed instructions on how to configure Claude Desktop to use this MCP server.

## Development

See [docs/development.md](./docs/development.md) for guidelines on extending the server with new tools and resources.

### Testing

The project includes comprehensive tests for all modules:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are located in the `tests/` directory and cover:
- Configuration loading and validation (tests/config.test.ts)
- Server initialization (tests/server.test.ts)
- Request handlers (tests/handlers.test.ts)
- Tool implementations (tests/tools.test.ts)

## License

ISC