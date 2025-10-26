import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as yaml from "yaml";

const execAsync = promisify(exec);

export class HyperIndexTools {
  getToolDefinitions() {
    return [
      {
        name: "hyperindex_init_project",
        description: "Initialize a new HyperIndex project",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            language: { type: "string", enum: ["typescript", "javascript", "rescript"] },
            directory: { type: "string" },
          },
          required: ["name", "language"],
        },
      },
      {
        name: "hyperindex_import_contract",
        description: "Import contract from block explorer",
        inputSchema: {
          type: "object",
          properties: {
            address: { type: "string" },
            blockchain: { type: "string" },
            all_events: { type: "boolean" },
          },
          required: ["address", "blockchain"],
        },
      },
      {
        name: "hyperindex_validate_config",
        description: "Validate config.yaml for errors",
        inputSchema: {
          type: "object",
          properties: {
            config_path: { type: "string" },
          },
          required: ["config_path"],
        },
      },
      {
        name: "hyperindex_generate_schema",
        description: "Generate GraphQL schema from entity definitions",
        inputSchema: {
          type: "object",
          properties: {
            entities: { type: "array" },
            output_path: { type: "string" },
          },
          required: ["entities"],
        },
      },
      {
        name: "hyperindex_generate_handler",
        description: "Generate event handler template",
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
        name: "hyperindex_setup_dynamic_contracts",
        description: "Setup dynamic contract registration for factory patterns",
        inputSchema: {
          type: "object",
          properties: {
            factory_address: { type: "string" },
            event_name: { type: "string" },
            contract_template: { type: "string" },
          },
          required: ["factory_address", "event_name"],
        },
      },
      {
        name: "hyperindex_configure_multichain",
        description: "Configure multi-chain indexing",
        inputSchema: {
          type: "object",
          properties: {
            networks: { type: "array" },
            unordered_mode: { type: "boolean" },
          },
          required: ["networks"],
        },
      },
      {
        name: "hyperindex_run_codegen",
        description: "Run envio codegen",
        inputSchema: {
          type: "object",
          properties: {
            project_path: { type: "string" },
          },
          required: ["project_path"],
        },
      },
    ];
  }

  async executeTool(name: string, args: any) {
    switch (name) {
      case "hyperindex_init_project":
        return await this.initProject(args);
      case "hyperindex_import_contract":
        return await this.importContract(args);
      case "hyperindex_validate_config":
        return await this.validateConfig(args);
      case "hyperindex_generate_schema":
        return await this.generateSchema(args);
      case "hyperindex_generate_handler":
        return await this.generateHandler(args);
      case "hyperindex_setup_dynamic_contracts":
        return await this.setupDynamicContracts(args);
      case "hyperindex_configure_multichain":
        return await this.configureMultichain(args);
      case "hyperindex_run_codegen":
        return await this.runCodegen(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async initProject(args: any) {
    const { name, language, directory } = args;
    const dir = directory || `./${name}`;
    
    const cmd = `npx envio init --name ${name} --language ${language} --directory ${dir}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      return {
        content: [
          {
            type: "text",
            text: `✅ Project initialized successfully!\n\nOutput:\n${stdout}\n\nNext steps:\n1. cd ${dir}\n2. Configure contracts in config.yaml\n3. Run: pnpm dev`,
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

  private async importContract(args: any) {
    const { address, blockchain, all_events } = args;
    
    const eventsFlag = all_events ? "--all-events" : "";
    const cmd = `npx envio init contract-import explorer -c ${address} -b ${blockchain} ${eventsFlag}`;
    
    try {
      const { stdout } = await execAsync(cmd);
      return {
        content: [
          {
            type: "text",
            text: `✅ Contract imported: ${address}\n\nBlockchain: ${blockchain}\n\n${stdout}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `❌ Import failed: ${error.message}` }],
        isError: true,
      };
    }
  }

  private async validateConfig(args: any) {
    const { config_path } = args;
    
    try {
      const content = await fs.readFile(config_path, "utf-8");
      const config = yaml.parse(content);
      
      // Validation checks
      const errors = [];
      
      if (!config.name) errors.push("Missing 'name' field");
      if (!config.networks || config.networks.length === 0) {
        errors.push("No networks configured");
      }
      if (!config.contracts || config.contracts.length === 0) {
        errors.push("No contracts configured");
      }
      
      // Check network configs
      if (config.networks) {
        config.networks.forEach((net: any, idx: number) => {
          if (!net.id) errors.push(`Network ${idx}: Missing 'id'`);
          if (net.startblock === undefined) errors.push(`Network ${idx}: Missing 'startblock'`);
          if (!net.contracts) errors.push(`Network ${idx}: No contracts defined`);
        });
      }
      
      if (errors.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Config validation failed:\n\n${errors.join("\n")}`,
            },
          ],
          isError: true,
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Config is valid!\n\nNetworks: ${config.networks.length}\nContracts: ${config.contracts?.length || 0}`,
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

  private async generateSchema(args: any) {
    const { entities, output_path } = args;
    
    let schema = "";
    
    entities.forEach((entity: any) => {
      schema += `type ${entity.name} {\n`;
      schema += `  id: ID!\n`;
      
      entity.fields?.forEach((field: any) => {
        const required = field.required ? "!" : "";
        schema += `  ${field.name}: ${field.type}${required}\n`;
      });
      
      schema += `}\n\n`;
    });
    
    const path = output_path || "./schema.graphql";
    
    try {
      await fs.writeFile(path, schema);
      return {
        content: [
          {
            type: "text",
            text: `✅ Schema generated at ${path}\n\n${schema}`,
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

  private async generateHandler(args: any) {
    const { contract_name, event_name, entity, language } = args;
    
    const templates: any = {
      typescript: `import { ${contract_name } from "../generated/src/Handlers.gen";

${contract_name}.${event_name}.handler(async ({ event, context }) => {
  // Load or create entity
  let entity = await context.${entity}.get(event.params.id.toString());
  
  if (!entity) {
    entity = {
      id: event.params.id.toString(),
      // Add fields here
    };
  }
  
  // Update entity with event data
  // entity.field = event.params.value;
  
  // Save entity
  await context.${entity}.set(entity);
});`,
      javascript: `import { ${contract_name } } from "../generated/src/Handlers.gen";

${contract_name}.${event_name}.handler(async ({ event, context }) => {
  let entity = await context.${entity}.get(event.params.id.toString());
  
  if (!entity) {
    entity = {
      id: event.params.id.toString(),
    };
  }
  
  await context.${entity}.set(entity);
});`,
    };
    
    const handler = templates[language] || templates.typescript;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Handler template for ${contract_name}.${event_name}:\n\n\`\`\`${language}\n${handler}\n\`\`\``,
        },
      ],
    };
  }

  private async setupDynamicContracts(args: any) {
    const { factory_address, event_name, contract_template } = args;
    
    const template = `// Dynamic Contract Registration Handler
// Add this to your event handler file

${contract_template || "ContractTemplate"}.${event_name}.handler(async ({ event, context }) => {
  // Extract new contract address from event
  const newContractAddress = event.params.contractAddress;
  
  // Register the new contract dynamically
  context.contractRegistration.add${contract_template || "Contract"}(newContractAddress);
  
  console.log(\`Registered new contract: \${newContractAddress}\`);
});

// Config.yaml setup:
/*
contracts:
  - name: ${contract_template || "Factory"}
    address: "${factory_address}"
    handler: "./src/EventHandlers.ts"
    events:
      - event: "${event_name}(address contractAddress)"
  
  - name: ${contract_template || "ChildContract"}
    handler: "./src/EventHandlers.ts"
    # No address - will be registered dynamically
    events:
      - event: "Transfer(address indexed from, address indexed to, uint256 value)"
*/`;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Dynamic contract registration setup:\n\n\`\`\`typescript\n${template}\n\`\`\``,
        },
      ],
    };
  }

  private async configureMultichain(args: any) {
    const { networks, unordered_mode } = args;
    
    const config = {
      name: "multi-chain-indexer",
      unorderedmultichainmode: unordered_mode || true,
      networks: networks.map((net: any) => ({
        id: net.id,
        start_block: net.start_block || 0,
        contracts: net.contracts || [],
      })),
    };
    
    const yamlContent = yaml.stringify(config);
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Multi-chain configuration:\n\n\`\`\`yaml\n${yamlContent}\n\`\`\`\n\n${
            unordered_mode
              ? "✅ Unordered mode: Better performance, events processed as they arrive"
              : "⚠️ Ordered mode: Strict ordering across chains, slower sync"
          }`,
        },
      ],
    };
  }

  private async runCodegen(args: any) {
    const { project_path } = args;
    
    try {
      const { stdout, stderr } = await execAsync(`cd ${project_path} && npx envio codegen`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Codegen completed!\n\n${stdout}\n\nGenerated files in: ${project_path}/generated/`,
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
}
