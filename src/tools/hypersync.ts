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
        description: "Query blockchain event logs with HyperSync",
        inputSchema: {
          type: "object",
          properties: {
            network: { type: "string" },
            from_block: { type: "number" },
            to_block: { type: "number" },
            addresses: { type: "array", items: { type: "string" } },
            topics: { type: "array" },
            api_token: { type: "string" },
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
            api_token: { type: "string" },
          },
          required: ["network"],
        },
      },
      {
        name: "hypersync_build_query",
        description: "Build a HyperSync query structure",
        inputSchema: {
          type: "object",
          properties: {
            query_type: { type: "string", enum: ["logs", "transactions", "blocks"] },
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
            chain_id: { type: "number" },
          },
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
    const { network, from_block, to_block, addresses, topics, api_token } = args;
    
    const endpoint = this.getEndpoint(network);
    
    const client = HypersyncClient.new({
      url: endpoint,
      bearerToken: api_token,
    });
    
    const query: any = {
      fromBlock: from_block || 0,
      logs: [
        {
          address: addresses,
          topics: topics,
        },
      ],
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
        ],
      },
    };
    
    if (to_block) {
      query.toBlock = to_block;
    }
    
    try {
      // Use stream() method as per documentation
      const stream = await client.stream(query, {});
      const res = await stream.recv();
      
      const logs = res?.data?.logs || [];
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Query successful!\n\n**Results:**\n- Logs found: ${logs.length}\n- Next block: ${res?.nextBlock}\n\n**Sample logs:**\n\`\`\`json\n${JSON.stringify(logs.slice(0, 3), null, 2)}\n\`\`\`\n\n**Note:** Use stream.recv() in a loop for continuous processing.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          { 
            type: "text", 
            text: `❌ Query failed: ${error.message}\n\n**Troubleshooting:**\n- Verify endpoint: ${endpoint}\n- Check API token\n- Validate address format (0x...)\n- Ensure block range is reasonable`
          }
        ],
        isError: true,
      };
    }
  }

  private async queryTransactions(args: any) {
    const { network, from_block, to_block, from_address, to_address, api_token } = args;
    
    const endpoint = this.getEndpoint(network);
    
    const client = HypersyncClient.new({
      url: endpoint,
      bearerToken: api_token,
    });
    
    const transactions: any[] = [];
    
    if (from_address) {
      transactions.push({ from: [from_address] });
    }
    
    if (to_address) {
      transactions.push({ to: [to_address] });
    }
    
    const query: any = {
      fromBlock: from_block || 0,
      transactions,
      fieldSelection: {
        transaction: [
          TransactionField.Hash,
          TransactionField.From,
          TransactionField.To,
          TransactionField.Value,
          TransactionField.BlockNumber,
        ],
      },
    };
    
    if (to_block) {
      query.toBlock = to_block;
    }
    
    try {
      const stream = await client.stream(query, {});
      const res = await stream.recv();
      const txs = res?.data?.transactions || [];
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Found ${txs.length} transactions\n\n**Next block:** ${res?.nextBlock}\n\n**Sample transactions:**\n\`\`\`json\n${JSON.stringify(txs.slice(0, 3), null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async buildQuery(args: any) {
    const { query_type, filters, field_selection } = args;
    
    let query: any = {
      fromBlock: filters?.from_block || 0,
    };
    
    if (filters?.to_block) {
      query.toBlock = filters.to_block;
    }
    
    switch (query_type) {
      case "logs":
        query.logs = [
          {
            address: filters?.addresses,
            topics: filters?.topics,
          },
        ];
        query.fieldSelection = {
          log: field_selection?.log || [
            LogField.Address,
            LogField.Data,
            LogField.Topic0,
          ],
        };
        break;
        
      case "transactions":
        query.transactions = [];
        if (filters?.from) query.transactions.push({ from: [filters.from] });
        if (filters?.to) query.transactions.push({ to: [filters.to] });
        query.fieldSelection = {
          transaction: field_selection?.transaction || [
            TransactionField.Hash,
            TransactionField.From,
            TransactionField.To,
          ],
        };
        break;
        
      case "blocks":
        query.fieldSelection = {
          block: field_selection?.block || [
            BlockField.Number,
            BlockField.Timestamp,
          ],
        };
        break;
    }
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Query built:\n\n\`\`\`json\n${JSON.stringify(query, null, 2)}\n\`\`\`\n\n**Join Modes (optional):**\n- **Default:** Returns logs → transactions → blocks\n- **JoinAll:** Returns comprehensive related data\n- **JoinNothing:** Only exact matches\n\n**Usage:**\n\`\`\`typescript\nimport { HypersyncClient } from "@envio-dev/hypersync-client";\n\nconst client = HypersyncClient.new({ url: "http://eth.hypersync.xyz" });\nconst stream = await client.stream(query, {});\nconst res = await stream.recv();\n\`\`\``,
        },
      ],
    };
  }

  private async getNetworkEndpoint(args: any) {
    const { network_name, chain_id } = args;
    
    const networks: Record<string, string> = {
      ethereum: "http://eth.hypersync.xyz",
      arbitrum: "http://arbitrum.hypersync.xyz",
      base: "http://base.hypersync.xyz",
      polygon: "http://polygon.hypersync.xyz",
      optimism: "http://optimism.hypersync.xyz",
      bsc: "http://bsc.hypersync.xyz",
    };
    
    const endpoint = networks[network_name?.toLowerCase()] || 
                    (chain_id ? `http://${chain_id}.hypersync.xyz` : "http://eth.hypersync.xyz");
    
    return {
      content: [
        {
          type: "text",
          text: `✅ HyperSync endpoint: **${endpoint}**\n\n**Usage:**\n\`\`\`typescript\nimport { HypersyncClient } from "@envio-dev/hypersync-client";\n\nconst client = HypersyncClient.new({\n  url: "${endpoint}",\n  bearerToken: process.env.HYPERSYNC_API_TOKEN\n});\n\`\`\`\n\n**Supported Networks:** 70+ EVM chains\n**Get API Token:** https://envio.dev/app/api-tokens`,
        },
      ],
    };
  }

  private getEndpoint(network: string): string {
    const map: Record<string, string> = {
      ethereum: "http://eth.hypersync.xyz",
      arbitrum: "http://arbitrum.hypersync.xyz",
      base: "http://base.hypersync.xyz",
      polygon: "http://polygon.hypersync.xyz",
      optimism: "http://optimism.hypersync.xyz",
    };
    return map[network.toLowerCase()] || "http://eth.hypersync.xyz";
  }
}
