import HypersyncClient, { LogField, TransactionField, BlockField } from "@envio-dev/hypersync-client";

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
        description: "Build a HyperSync query with field selection",
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
    
    const query = {
      fromBlock: from_block || 0,
      toBlock: to_block,
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
        ],
      },
    };
    
    try {
      const res = await client.sendReq(query);
      const logs = res.data?.logs || [];
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Query successful!\n\nLogs found: ${logs.length}\nNext block: ${res.nextBlock}\n\nFirst few logs:\n${JSON.stringify(logs.slice(0, 3), null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Query failed: ${error.message}` }],
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
    
    const query = {
      fromBlock: from_block || 0,
      toBlock: to_block,
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
    
    try {
      const res = await client.sendReq(query);
      const txs = res.data?.transactions || [];
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Found ${txs.length} transactions\n\n${JSON.stringify(txs.slice(0, 3), null, 2)}`,
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
    }
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Query built:\n\n\`\`\`json\n${JSON.stringify(query, null, 2)}\n\`\`\``,
        },
      ],
    };
  }

  private async getNetworkEndpoint(args: any) {
    const { network_name, chain_id } = args;
    
    const networks: any = {
      ethereum: "https://eth.hypersync.xyz",
      arbitrum: "https://arbitrum.hypersync.xyz",
      base: "https://base.hypersync.xyz",
      polygon: "https://polygon.hypersync.xyz",
      optimism: "https://optimism.hypersync.xyz",
      bsc: "https://bsc.hypersync.xyz",
    };
    
    const endpoint = networks[network_name?.toLowerCase()] || `https://${chain_id}.hypersync.xyz`;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ HyperSync endpoint:\n\n${endpoint}\n\nUsage:\n\`\`\`typescript\nconst client = HypersyncClient.new({\n  url: "${endpoint}",\n  bearerToken: "your-api-token"\n});\n\`\`\``,
        },
      ],
    };
  }

  private getEndpoint(network: string): string {
    const map: any = {
      ethereum: "https://eth.hypersync.xyz",
      arbitrum: "https://arbitrum.hypersync.xyz",
      base: "https://base.hypersync.xyz",
      polygon: "https://polygon.hypersync.xyz",
      optimism: "https://optimism.hypersync.xyz",
    };
    return map[network.toLowerCase()] || "https://eth.hypersync.xyz";
  }
}
