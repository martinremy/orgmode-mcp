# Org Mode MCP Server

An MCP (Model Context Protocol) server for working with Org Mode files and workflows. This server enables Claude Desktop and other MCP-compatible clients to interact with your Org Mode files, parse their structure, and perform various operations on them.

## Features

- ✨ TypeScript-based MCP server implementation
- 🔧 Extensible tool and resource system
- 📡 Standard stdio transport for MCP communication
- 🎯 Ready for integration with Claude Desktop
- 🛠️ Development-friendly with hot reloading

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

## Project Structure

```
src/
├── index.ts          # Main entry point
├── server.ts         # Server setup and configuration  
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
- `npm test` - Run tests (placeholder)

## Integration with Claude Desktop

See [docs/claude-integration.md](./docs/claude-integration.md) for detailed instructions on how to configure Claude Desktop to use this MCP server.

## Development

See [docs/development.md](./docs/development.md) for guidelines on extending the server with new tools and resources.

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

## License

ISC