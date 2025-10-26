#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { HyperIndexTools } from "./tools/hyperindex.js";
import { HyperSyncTools } from "./tools/hypersync.js";
import { DocumentationTools } from "./tools/documentation.js";
import { ConfigTools } from "./tools/config.js";

const server = new Server(
  {
    name: "envio-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

const hyperIndexTools = new HyperIndexTools();
const hyperSyncTools = new HyperSyncTools();
const docTools = new DocumentationTools();
const configTools = new ConfigTools();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...hyperIndexTools.getToolDefinitions(),
      ...hyperSyncTools.getToolDefinitions(),
      ...docTools.getToolDefinitions(),
      ...configTools.getToolDefinitions(),
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name.startsWith("hyperindex_")) {
      return await hyperIndexTools.executeTool(name, args);
    } else if (name.startsWith("hypersync_")) {
      return await hyperSyncTools.executeTool(name, args);
    } else if (name.startsWith("docs_")) {
      return await docTools.executeTool(name, args);
    } else if (name.startsWith("config_")) {
      return await configTools.executeTool(name, args);
    }
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "docs://hyperindex/overview",
        name: "HyperIndex Complete Documentation",
        mimeType: "text/markdown",
      },
      {
        uri: "docs://hypersync/overview",
        name: "HyperSync Complete Documentation",
        mimeType: "text/markdown",
      },
      {
        uri: "docs://hyperrpc/overview",
        name: "HyperRPC Complete Documentation",
        mimeType: "text/markdown",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const content = await docTools.getResourceContent(request.params.uri);
  return {
    contents: [{ uri: request.params.uri, mimeType: "text/markdown", text: content }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Envio MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
