import { 
  HypersyncClient,
  LogField, 
  TransactionField, 
  BlockField
} from "@envio-dev/hypersync-client";

export class HyperSyncTools {
  getToolDefinitions() {
    return [
      {
        name: "hypersync_query_logs",
        description: "Query blockchain event logs with HyperSync across 70+ networks",
        inputSchema: {
          type: "object",
          properties: {
            network: { type: "string", description: "Network name" },
            from_block: { type: "number", description: "Starting block (default: 0)" },
            to_block: { type: "number", description: "Ending block (optional)" },
            addresses: { 
              type: "array", 
              items: { type: "string" },
              description: "Contract addresses to filter"
            },
            topics: { 
              type: "array",
              description: "Topic filters - array of arrays [[topic0], [topic1], ...]"
            },
            max_num_logs: { 
              type: "number",
              description: "Maximum logs to return (default: 5000)"
            },
          },
          required: ["network"],
        },
      },
      {
        name: "hypersync_query_transactions",
        description: "Query transactions with HyperSync",
        inputSchema: {
          type: "object",
          properties: {
            network: { type: "string" },
            from_block: { type: "number" },
            to_block: { type: "number" },
            from_address: { type: "string" },
            to_address: { type: "string" },
            max_num_transactions: { type: "number" },
          },
          required: ["network"],
        },
      },
      {
        name: "hypersync_build_query",
        description: "Build a HyperSync query structure with documentation",
        inputSchema: {
          type: "object",
          properties: {
            query_type: { type: "string", enum: ["logs", "transactions", "blocks"] },
            from_block: { type: "number" },
            to_block: { type: "number" },
            filters: { type: "object" },
            field_selection: { type: "object" },
          },
          required: ["query_type"],
        },
      },
      {
        name: "hypersync_get_network_endpoint",
        description: "Get HyperSync endpoint URL for a network",
        inputSchema: {
          type: "object",
          properties: {
            network_name: { type: "string" },
          },
          required: ["network_name"],
        },
      },
    ];
  }

  async executeTool(name: string, args: any) {
    switch (name) {
      case "hypersync_query_logs":
        return await this.queryLogs(args);
      case "hypersync_query_transactions":
        return await this.queryTransactions(args);
      case "hypersync_build_query":
        return await this.buildQuery(args);
      case "hypersync_get_network_endpoint":
        return await this.getNetworkEndpoint(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async queryLogs(args: any) {
    const { network, from_block, to_block, addresses, topics, max_num_logs } = args;
    
    const endpoint = this.getEndpoint(network);
    
    const client = HypersyncClient.new({
      url: endpoint,
    });
    
    // Build query per documentation
    const query: any = {
      fromBlock: from_block || 0,
      fieldSelection: {
        log: [
          LogField.Address,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
          LogField.Data,
          LogField.BlockNumber,
          LogField.TransactionIndex,
          LogField.LogIndex,
          LogField.TransactionHash,
        ],
        block: [
          BlockField.Number,
          BlockField.Timestamp,
          BlockField.Hash,
        ],
      },
    };
    
    // Add optional parameters
    if (to_block) {
      query.toBlock = to_block;
    }
    
    if (max_num_logs) {
      query.maxNumLogs = max_num_logs;
    }
    
    // Add log filters - topics should be array of arrays per docs
    if (addresses || topics) {
      query.logs = [{
        ...(addresses && { address: addresses }),
        ...(topics && { topics: Array.isArray(topics[0]) ? topics : [topics] }),
      }];
    }
    
    try {
      const stream = await client.stream(query, {});
      const res = await stream.recv();
      
      // Check for null explicitly
      if (!res) {
        return {
          content: [{
            type: "text",
            text: "❌ No data received from stream",
          }],
          isError: true,
        };
      }
      
      const logs = res.data?.logs || [];
      const blocks = res.data?.blocks || [];
      
      let output = `✅ Query successful!\n\n`;
      output += `**Network:** ${network}\n`;
      output += `**Endpoint:** ${endpoint}\n`;
      output += `**Logs found:** ${logs.length}\n`;
      output += `**Blocks processed:** ${blocks.length}\n`;
      output += `**Next block:** ${res.nextBlock}\n`;
      
      if (res.archiveHeight) {
        output += `**Archive height:** ${res.archiveHeight}\n`;
      }
      
      if (logs.length > 0) {
        output += `\n**Sample logs (first 3):**\n\`\`\`json\n${JSON.stringify(logs.slice(0, 3), null, 2)}\n\`\`\`\n`;
      }
      
      output += `\n**Pagination:** To continue querying, use \`from_block: ${res.nextBlock}\``;
      
      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
      
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `❌ Query failed: ${error.message}\n\n**Troubleshooting:**\n- Endpoint: ${endpoint}\n- Check address format (0x...)\n- Reduce block range if timeout\n- Verify network is supported\n- Topics format: [[topic0], [topic1], ...]`,
        }],
        isError: true,
      };
    }
  }

  private async queryTransactions(args: any) {
    const { network, from_block, to_block, from_address, to_address, max_num_transactions } = args;
    
    const endpoint = this.getEndpoint(network);
    
    const client = HypersyncClient.new({
      url: endpoint,
    });
    
    const query: any = {
      fromBlock: from_block || 0,
      fieldSelection: {
        transaction: [
          TransactionField.Hash,
          TransactionField.From,
          TransactionField.To,
          TransactionField.Value,
          TransactionField.Gas,
          TransactionField.GasPrice,
          TransactionField.BlockNumber,
          TransactionField.TransactionIndex,
        ],
        block: [
          BlockField.Number,
          BlockField.Timestamp,
        ],
      },
    };
    
    if (to_block) {
      query.toBlock = to_block;
    }
    
    if (max_num_transactions) {
      query.maxNumTransactions = max_num_transactions;
    }
    
    // Build transaction filters with OR relationship
    const txFilters = [];
    if (from_address) {
      txFilters.push({ from: [from_address] });
    }
    if (to_address) {
      txFilters.push({ to: [to_address] });
    }
    
    if (txFilters.length > 0) {
      query.transactions = txFilters;
    }
    
    try {
      const stream = await client.stream(query, {});
      const res = await stream.recv();
      
      if (!res) {
        return {
          content: [{
            type: "text",
            text: "❌ No data received",
          }],
          isError: true,
        };
      }
      
      const txs = res.data?.transactions || [];
      
      return {
        content: [{
          type: "text",
          text: `✅ Found ${txs.length} transactions\n\n**Network:** ${network}\n**Next block:** ${res.nextBlock}\n\n**Sample (first 3):**\n\`\`\`json\n${JSON.stringify(txs.slice(0, 3), null, 2)}\n\`\`\``,
        }],
      };
      
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `❌ Error: ${error.message}`,
        }],
        isError: true,
      };
    }
  }

  private async buildQuery(args: any) {
    const { query_type, from_block, to_block, filters, field_selection } = args;
    
    const query: any = {
      fromBlock: from_block || filters?.from_block || 0,
    };
    
    if (to_block || filters?.to_block) {
      query.toBlock = to_block || filters.to_block;
    }
    
    // Build field selection
    query.fieldSelection = {};
    
    switch (query_type) {
      case "logs":
        query.fieldSelection.log = field_selection?.log || [
          LogField.Address,
          LogField.Data,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
        ];
        
        if (filters?.addresses || filters?.topics) {
          query.logs = [{
            ...(filters.addresses && { address: filters.addresses }),
            ...(filters.topics && { topics: Array.isArray(filters.topics[0]) ? filters.topics : [filters.topics] }),
          }];
        }
        break;
        
      case "transactions":
        query.fieldSelection.transaction = field_selection?.transaction || [
          TransactionField.Hash,
          TransactionField.From,
          TransactionField.To,
          TransactionField.Value,
        ];
        
        const txFilters = [];
        if (filters?.from) txFilters.push({ from: [filters.from] });
        if (filters?.to) txFilters.push({ to: [filters.to] });
        if (txFilters.length > 0) {
          query.transactions = txFilters;
        }
        break;
        
      case "blocks":
        query.fieldSelection.block = field_selection?.block || [
          BlockField.Number,
          BlockField.Timestamp,
          BlockField.Hash,
        ];
        query.includeAllBlocks = true;
        break;
    }
    
    const usageExample = `// HyperSync Query
import { HypersyncClient } from "@envio-dev/hypersync-client";

const client = HypersyncClient.new({
  url: "https://eth.hypersync.xyz"
});

const query = ${JSON.stringify(query, null, 2)};

// Stream data
const stream = await client.stream(query, {});

while (true) {
  const res = await stream.recv();
  if (!res) break;
  
  console.log("Logs:", res.data?.logs?.length || 0);
  console.log("Next block:", res.nextBlock);
  
  // Update for next iteration
  query.fromBlock = res.nextBlock;
}`;
    
    return {
      content: [{
        type: "text",
        text: `✅ Query built:\n\n\`\`\`json\n${JSON.stringify(query, null, 2)}\n\`\`\`\n\n**Usage:**\n\`\`\`typescript\n${usageExample}\n\`\`\`\n\n**Key Points:**\n- Automatic pagination with \`nextBlock\`\n- Efficient field selection reduces data transfer\n- \`includeAllBlocks\` for block queries\n- Topics format: \`[[topic0], [topic1], ...]\``,
      }],
    };
  }

  private async getNetworkEndpoint(args: any) {
    const { network_name } = args;
    
    const networks: Record<string, { url: string; name: string; chainId: number }> = {
      ethereum: { url: "https://eth.hypersync.xyz", name: "Ethereum Mainnet", chainId: 1 },
      arbitrum: { url: "https://arbitrum.hypersync.xyz", name: "Arbitrum One", chainId: 42161 },
      base: { url: "https://base.hypersync.xyz", name: "Base", chainId: 8453 },
      optimism: { url: "https://optimism.hypersync.xyz", name: "Optimism", chainId: 10 },
      polygon: { url: "https://polygon.hypersync.xyz", name: "Polygon", chainId: 137 },
      bsc: { url: "https://bsc.hypersync.xyz", name: "BSC", chainId: 56 },
      avalanche: { url: "https://avalanche.hypersync.xyz", name: "Avalanche", chainId: 43114 },
      gnosis: { url: "https://gnosis.hypersync.xyz", name: "Gnosis Chain", chainId: 100 },
      linea: { url: "https://linea.hypersync.xyz", name: "Linea", chainId: 59144 },
      scroll: { url: "https://scroll.hypersync.xyz", name: "Scroll", chainId: 534352 },
    };
    
    const network = networks[network_name?.toLowerCase()];
    
    if (!network) {
      const allNetworks = Object.entries(networks)
        .map(([key, val]) => `- **${key}**: ${val.name} (${val.chainId})`)
        .join("\n");
      
      return {
        content: [{
          type: "text",
          text: `❌ Network "${network_name}" not found.\n\n**Supported networks:**\n${allNetworks}\n\n**More:** https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks`,
        }],
        isError: true,
      };
    }
    
    return {
      content: [{
        type: "text",
        text: `✅ **${network.name}** (Chain ID: ${network.chainId})\n\n**URL:** ${network.url}\n\n**Usage:**\n\`\`\`typescript\nimport { HypersyncClient } from "@envio-dev/hypersync-client";\n\nconst client = HypersyncClient.new({\n  url: "${network.url}",\n});\n\`\`\`\n\n**Docs:** https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks`,
      }],
    };
  }

  private getEndpoint(network: string): string {
    const map: Record<string, string> = {
      ethereum: "https://eth.hypersync.xyz",
      arbitrum: "https://arbitrum.hypersync.xyz",
      base: "https://base.hypersync.xyz",
      polygon: "https://polygon.hypersync.xyz",
      optimism: "https://optimism.hypersync.xyz",
      bsc: "https://bsc.hypersync.xyz",
      avalanche: "https://avalanche.hypersync.xyz",
      gnosis: "https://gnosis.hypersync.xyz",
      linea: "https://linea.hypersync.xyz",
      scroll: "https://scroll.hypersync.xyz",
    };
    return map[network.toLowerCase()] || "https://eth.hypersync.xyz";
  }
}
