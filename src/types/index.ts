// Custom types for the MCP server

export interface ServerConfig {
  name: string;
  version: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

export interface ToolExecutionContext {
  args: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ResourceContext {
  uri: string;
  params?: Record<string, unknown>;
}

// Org-mode file metadata
export interface OrgFileMetadata {
  filePath: string;
  fileName: string;
  category?: string;
  fileTags: string[];
  title?: string;
}

export interface OrgFileContent {
  metadata: OrgFileMetadata;
  content: string;
}

// Add more custom types as needed
export type ToolHandler = (context: ToolExecutionContext) => Promise<string>;
export type ResourceProvider = (context: ResourceContext) => Promise<string>;
