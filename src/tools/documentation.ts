import * as fs from "fs/promises";
import * as path from "path";

export class DocumentationTools {
  private docs: Map<string, string> = new Map();

  constructor() {
    this.loadDocs();
  }

  getToolDefinitions() {
    return [
      {
        name: "docs_search",
        description: "Search Envio documentation",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            doc_type: { 
              type: "string", 
              enum: ["hyperindex", "hypersync", "hyperrpc", "all"] 
            },
          },
          required: ["query"],
        },
      },
      {
        name: "docs_get_config_reference",
        description: "Get config.yaml parameter documentation",
        inputSchema: {
          type: "object",
          properties: {
            parameter: { type: "string" },
          },
          required: ["parameter"],
        },
      },
      {
        name: "docs_get_examples",
        description: "Get code examples for specific use cases",
        inputSchema: {
          type: "object",
          properties: {
            use_case: { type: "string" },
          },
          required: ["use_case"],
        },
      },
      {
        name: "docs_troubleshoot_error",
        description: "Get troubleshooting help for errors",
        inputSchema: {
          type: "object",
          properties: {
            error_message: { type: "string" },
          },
          required: ["error_message"],
        },
      },
    ];
  }

  async executeTool(name: string, args: any) {
    switch (name) {
      case "docs_search":
        return await this.searchDocs(args);
      case "docs_get_config_reference":
        return await this.getConfigReference(args);
      case "docs_get_examples":
        return await this.getExamples(args);
      case "docs_troubleshoot_error":
        return await this.troubleshootError(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async loadDocs() {
    // This would load embedded documentation
    // For now, returning structured references
  }

  async getResourceContent(uri: string): Promise<string> {
    // Return documentation content based on URI
    const docs: any = {
      "docs://hyperindex/overview": "HyperIndex documentation content...",
      "docs://hypersync/overview": "HyperSync documentation content...",
      "docs://hyperrpc/overview": "HyperRPC documentation content...",
    };
    return docs[uri] || "Documentation not found";
  }

  private async searchDocs(args: any) {
    const { query, doc_type } = args;
    
    // Semantic search implementation would go here
    const results = `Search results for "${query}" in ${doc_type || "all"} docs...`;
    
    return {
      content: [
        {
          type: "text",
          text: `🔍 Documentation search results:\n\n${results}`,
        },
      ],
    };
  }

  private async getConfigReference(args: any) {
    const { parameter } = args;
    
    const params: any = {
      networks: "Array of network configurations with id, start_block, and contracts",
      unorderedmultichainmode: "Boolean - enables unordered multichain mode for better performance",
      contracts: "Array of contract definitions with name, handler, events, and addresses",
      startblock: "Number - block to start indexing from",
    };
    
    const info = params[parameter] || "Parameter not found";
    
    return {
      content: [
        {
          type: "text",
          text: `📖 Config parameter: ${parameter}\n\n${info}`,
        },
      ],
    };
  }

  private async getExamples(args: any) {
    const { use_case } = args;
    
    const examples: any = {
      "erc20-transfers": `// ERC20 Transfer Event Handler Example
Transfer.handler(async ({ event, context }) => {
  const transfer = {
    id: \`\${event.transaction.hash}-\${event.logIndex}\`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
    timestamp: event.block.timestamp,
  };
  
  await context.Transfer.set(transfer);
});`,
      "factory-pattern": `// Factory Pattern with Dynamic Registration
Factory.ContractCreated.handler(async ({ event, context }) => {
  const newContract = event.params.contractAddress;
  
  // Register the new contract
  context.contractRegistration.addChildContract(newContract);
  
  // Store factory info
  await context.FactoryContract.set({
    id: newContract,
    creator: event.params.creator,
    timestamp: event.block.timestamp,
  });
});`,
    };
    
    const example = examples[use_case] || "Example not found";
    
    return {
      content: [
        {
          type: "text",
          text: `💡 Example: ${use_case}\n\n\`\`\`typescript\n${example}\n\`\`\``,
        },
      ],
    };
  }

  private async troubleshootError(args: any) {
    const { error_message } = args;
    
    let solution = "Unable to identify error. Please check Envio docs or Discord.";
    
    if (error_message.includes("ENVIO_")) {
      solution = "Environment variable missing. Ensure all ENVIO_* variables are set in .env file.";
    } else if (error_message.includes("codegen")) {
      solution = "Run 'npx envio codegen' to regenerate types after config changes.";
    } else if (error_message.includes("network")) {
      solution = "Check network ID and start_block in config.yaml. Verify network is supported.";
    }
    
    return {
      content: [
        {
          type: "text",
          text: `🔧 Troubleshooting:\n\nError: ${error_message}\n\nSolution: ${solution}`,
        },
      ],
    };
  }
}
