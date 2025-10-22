#!/bin/bash

# Script to generate mcp.json from mcp.json.example
# Replaces {{PROJECT_ROOT}} with the actual project directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_FILE="$PROJECT_ROOT/mcp.json.example"
OUTPUT_FILE="$PROJECT_ROOT/mcp.json"

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Error: Template file not found at $TEMPLATE_FILE"
  exit 1
fi

echo "Generating mcp.json from template..."
echo "Project root: $PROJECT_ROOT"

# Replace {{PROJECT_ROOT}} with actual path
sed "s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "✓ Generated $OUTPUT_FILE"
echo ""
echo "You can now use this configuration file with your MCP client."
echo "For Claude Desktop, copy the contents to:"
echo "  ~/Library/Application Support/Claude/claude_desktop_config.json"
