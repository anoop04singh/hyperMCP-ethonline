import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as yaml from "yaml";

const execAsync = promisify(exec);

export class HyperIndexTools {
  private async checkEnvioCLI(): Promise<{ installed: boolean; message: string }> {
    try {
      const { stdout } = await execAsync("envio --help");
      return { installed: true, message: "Envio CLI is installed" };
    } catch (error) {
      return {
        installed: false,
        message: "Envio CLI not found. Install with: npm install -g envio",
      };
    }
  }

  getToolDefinitions() {
    return [
      // Initialization Commands
      {
        name: "hyperindex_init_project",
        description: "Initialize a new HyperIndex project using envio init",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name" },
            language: { 
              type: "string", 
              enum: ["typescript", "javascript", "rescript"],
              description: "Handler language" 
            },
            directory: { type: "string", description: "Output directory" },
            api_token: { type: "string", description: "HyperSync API token" },
          },
          required: ["name", "language"],
        },
      },
      {
        name: "hyperindex_init_contract_import_explorer",
        description: "Import contract from block explorer (envio init contract-import explorer)",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name" },
            contract_address: { type: "string", description: "Contract address" },
            blockchain: { 
              type: "string", 
              description: "Network (e.g., ethereum-mainnet, base, arbitrum-one)" 
            },
            language: { type: "string", enum: ["typescript", "javascript", "rescript"] },
            directory: { type: "string", description: "Output directory" },
            single_contract: { type: "boolean", description: "Don't prompt for more contracts" },
            all_events: { type: "boolean", description: "Index all events without prompting" },
            api_token: { type: "string", description: "HyperSync API token" },
          },
          required: ["name", "contract_address", "blockchain", "language"],
        },
      },
      {
        name: "hyperindex_init_contract_import_local",
        description: "Import contract from local ABI file (envio init contract-import local)",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            abi_file: { type: "string", description: "Path to JSON ABI file" },
            contract_name: { type: "string", description: "Contract name" },
            contract_address: { type: "string", description: "Contract address" },
            blockchain: { type: "string", description: "Network name or chain ID" },
            start_block: { type: "number", description: "Starting block number" },
            rpc_url: { type: "string", description: "RPC URL for unsupported networks" },
            language: { type: "string", enum: ["typescript", "javascript", "rescript"] },
            directory: { type: "string" },
            api_token: { type: "string" },
          },
          required: ["name", "abi_file", "contract_name", "blockchain", "language"],
        },
      },
      {
        name: "hyperindex_init_template",
        description: "Initialize from template (envio init template)",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            template: { 
              type: "string", 
              enum: ["greeter", "erc20"],
              description: "Template to use" 
            },
            language: { type: "string", enum: ["typescript", "javascript", "rescript"] },
            directory: { type: "string" },
            api_token: { type: "string" },
          },
          required: ["name", "template", "language"],
        },
      },
      
      // Development Commands
      {
        name: "hyperindex_dev",
        description: "Run indexer in development mode with hot reloading (envio dev)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string", description: "Project directory" },
          },
        },
      },
      {
        name: "hyperindex_codegen",
        description: "Generate indexing code from config (envio codegen)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      {
        name: "hyperindex_start",
        description: "Start indexer without codegen (envio start)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
            restart: { type: "boolean", description: "Clear database and restart" },
            bench: { type: "boolean", description: "Save benchmark data" },
          },
        },
      },
      {
        name: "hyperindex_stop",
        description: "Stop local environment (envio stop)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      
      // Environment Management
      {
        name: "hyperindex_local_docker_up",
        description: "Start Docker containers (envio local docker up)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      {
        name: "hyperindex_local_docker_down",
        description: "Stop Docker containers (envio local docker down)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      {
        name: "hyperindex_local_db_migrate_setup",
        description: "Setup database schema (envio local db-migrate setup)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      
      // Analysis
      {
        name: "hyperindex_benchmark_summary",
        description: "View benchmark performance data (envio benchmark-summary)",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
          },
        },
      },
      
      // Helper Functions
      {
        name: "hyperindex_validate_config",
        description: "Validate config.yaml structure",
        inputSchema: {
          type: "object",
          properties: {
            config_path: { type: "string" },
            config_content: { type: "string" },
          },
        },
      },
      {
        name: "hyperindex_generate_handler",
        description: "Generate event handler template code",
        inputSchema: {
          type: "object",
          properties: {
            contract_name: { type: "string" },
            event_name: { type: "string" },
            entity: { type: "string" },
            language: { type: "string" },
          },
          required: ["contract_name", "event_name", "language"],
        },
      },
      {
        name: "hyperindex_check_installation",
        description: "Check Envio CLI installation status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  async executeTool(name: string, args: any) {
    switch (name) {
      case "hyperindex_init_project":
        return await this.initProject(args);
      case "hyperindex_init_contract_import_explorer":
        return await this.initContractImportExplorer(args);
      case "hyperindex_init_contract_import_local":
        return await this.initContractImportLocal(args);
      case "hyperindex_init_template":
        return await this.initTemplate(args);
      case "hyperindex_dev":
        return await this.dev(args);
      case "hyperindex_codegen":
        return await this.codegen(args);
      case "hyperindex_start":
        return await this.start(args);
      case "hyperindex_stop":
        return await this.stop(args);
      case "hyperindex_local_docker_up":
        return await this.localDockerUp(args);
      case "hyperindex_local_docker_down":
        return await this.localDockerDown(args);
      case "hyperindex_local_db_migrate_setup":
        return await this.localDbMigrateSetup(args);
      case "hyperindex_benchmark_summary":
        return await this.benchmarkSummary(args);
      case "hyperindex_validate_config":
        return await this.validateConfig(args);
      case "hyperindex_generate_handler":
        return await this.generateHandler(args);
      case "hyperindex_check_installation":
        return await this.checkInstallation();
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async checkInstallation() {
    const check = await this.checkEnvioCLI();
    return {
      content: [
        {
          type: "text",
          text: check.installed 
            ? `✅ Envio CLI is installed and ready!\n\nRun \`envio --help\` to see available commands.`
            : `❌ ${check.message}\n\n**Install now:**\n\`\`\`bash\nnpm install -g envio\n\`\`\``,
        },
      ],
    };
  }

  private async initProject(args: any) {
    const { name, language, directory, api_token } = args;
    
    let cmd = `envio init -n ${name} -l ${language}`;
    if (directory) cmd += ` -d ${directory}`;
    if (api_token) cmd += ` --api-token ${api_token}`;
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 120000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Project initialized!\n\n**Name:** ${name}\n**Language:** ${language}\n**Directory:** ${directory || name}\n\n**Next steps:**\n\`\`\`bash\ncd ${directory || name}\npnpm install\npnpm dev\n\`\`\`\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Init failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async initContractImportExplorer(args: any) {
    const { 
      name, contract_address, blockchain, language, directory, 
      single_contract, all_events, api_token 
    } = args;
    
    let cmd = `envio init contract-import explorer -n ${name} -c ${contract_address} -b ${blockchain} -l ${language}`;
    if (directory) cmd += ` -d ${directory}`;
    if (single_contract) cmd += ` --single-contract`;
    if (all_events) cmd += ` --all-events`;
    if (api_token) cmd += ` --api-token ${api_token}`;
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 120000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Contract imported from block explorer!\n\n**Contract:** ${contract_address}\n**Network:** ${blockchain}\n**Project:** ${name}\n\n**Next steps:**\n\`\`\`bash\ncd ${directory || name}\npnpm install\npnpm dev\n\`\`\`\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Import failed: ${error.message}\n\nMake sure the contract is verified on the block explorer.` }],
        isError: true,
      };
    }
  }

  private async initContractImportLocal(args: any) {
    const { 
      name, abi_file, contract_name, contract_address, blockchain, 
      start_block, rpc_url, language, directory, api_token 
    } = args;
    
    let cmd = `envio init contract-import local -n ${name} -a ${abi_file} --contract-name ${contract_name} -c ${contract_address} -b ${blockchain} -l ${language}`;
    if (start_block !== undefined) cmd += ` -s ${start_block}`;
    if (rpc_url) cmd += ` -r ${rpc_url}`;
    if (directory) cmd += ` -d ${directory}`;
    if (api_token) cmd += ` --api-token ${api_token}`;
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 120000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Contract imported from local ABI!\n\n**Contract:** ${contract_name}\n**ABI:** ${abi_file}\n**Network:** ${blockchain}\n\n**Next steps:**\n\`\`\`bash\ncd ${directory || name}\npnpm install\npnpm dev\n\`\`\`\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Import failed: ${error.message}\n\nCheck that the ABI file exists and is valid JSON.` }],
        isError: true,
      };
    }
  }

  private async initTemplate(args: any) {
    const { name, template, language, directory, api_token } = args;
    
    let cmd = `envio init template -n ${name} -t ${template} -l ${language}`;
    if (directory) cmd += ` -d ${directory}`;
    if (api_token) cmd += ` --api-token ${api_token}`;
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 120000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Template project created!\n\n**Template:** ${template}\n**Name:** ${name}\n\n**Next steps:**\n\`\`\`bash\ncd ${directory || name}\npnpm install\npnpm dev\n\`\`\`\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Template init failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async dev(args: any) {
    const { directory } = args;
    const dir = directory ? `-d ${directory}` : "";
    
    return {
      content: [
        {
          type: "text",
          text: `To start development mode, run:\n\n\`\`\`bash\n${directory ? `cd ${directory}\n` : ""}envio dev\n\`\`\`\n\nThis will:\n✅ Start the indexer with hot reloading\n✅ Auto-generate code on config changes\n✅ Start local GraphQL server\n\n**Stop with:** Ctrl+C`,
        },
      ],
    };
  }

  private async codegen(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio codegen` : "envio codegen";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 60000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Code generation complete!\n\n${stdout}\n\n**Generated files:**\n- Handler types\n- Entity types\n- GraphQL schema`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Codegen failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async start(args: any) {
    const { directory, restart, bench } = args;
    let cmd = "envio start";
    if (restart) cmd += " -r";
    if (bench) cmd += " -b";
    if (directory) cmd = `cd ${directory} && ${cmd}`;
    
    return {
      content: [
        {
          type: "text",
          text: `To start the indexer, run:\n\n\`\`\`bash\n${cmd}\n\`\`\`\n\n**Options:**\n${restart ? "✅ Will clear database and restart\n" : ""}${bench ? "✅ Will save benchmark data\n" : ""}`,
        },
      ],
    };
  }

  private async stop(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio stop` : "envio stop";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Environment stopped!\n\n${stdout}\n\nThis deleted the database and stopped all processes.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Stop failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async localDockerUp(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio local docker up` : "envio local docker up";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 60000 });
      return {
        content: [
          {
            type: "text",
            text: `✅ Docker containers started!\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Docker up failed: ${error.message}\n\nMake sure Docker Desktop is running.` }],
        isError: true,
      };
    }
  }

  private async localDockerDown(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio local docker down` : "envio local docker down";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      return {
        content: [{ type: "text", text: `✅ Docker containers stopped!\n\n${stdout}` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Docker down failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async localDbMigrateSetup(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio local db-migrate setup` : "envio local db-migrate setup";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 30000 });
      return {
        content: [{ type: "text", text: `✅ Database schema setup complete!\n\n${stdout}` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ DB setup failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async benchmarkSummary(args: any) {
    const { directory } = args;
    const cmd = directory ? `cd ${directory} && envio benchmark-summary` : "envio benchmark-summary";
    
    try {
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      return {
        content: [{ type: "text", text: `📊 Benchmark Summary:\n\n\`\`\`\n${stdout}\n\`\`\`` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ No benchmark data found. Run \`envio start --bench\` first.` }],
        isError: true,
      };
    }
  }

  private async validateConfig(args: any) {
    const { config_path, config_content } = args;
    
    try {
      let content: string;
      
      if (config_content) {
        content = config_content;
      } else if (config_path) {
        content = await fs.readFile(config_path, "utf-8");
      } else {
        return {
          content: [{ type: "text", text: "❌ Provide config_path or config_content" }],
          isError: true,
        };
      }
      
      const config = yaml.parse(content);
      const errors = [];
      
      if (!config.name) errors.push("Missing 'name' field");
      if (!config.networks) errors.push("Missing 'networks' array");
      if (!config.contracts) errors.push("Missing 'contracts' array");
      
      if (errors.length > 0) {
        return {
          content: [{ type: "text", text: `❌ Validation errors:\n${errors.map(e => `• ${e}`).join("\n")}` }],
          isError: true,
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Config is valid!\n\n**Name:** ${config.name}\n**Networks:** ${config.networks.length}\n**Contracts:** ${config.contracts.length}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ ${error.message}` }],
        isError: true,
      };
    }
  }

  private async generateHandler(args: any) {
    const { contract_name, event_name, entity, language } = args;
    
    const handler = `import { ${contract_name} } from "../generated/src/Handlers.gen";

${contract_name}.${event_name}.handler(async ({ event, context }) => {
  const id = \`\${event.transaction.hash}-\${event.logIndex}\`;
  
  let entity = await context.${entity || event_name}.get(id);
  
  if (!entity) {
    entity = {
      id,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    };
  }
  
  await context.${entity || event_name}.set(entity);
});`;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Handler template:\n\n\`\`\`${language}\n${handler}\n\`\`\``,
        },
      ],
    };
  }
}
