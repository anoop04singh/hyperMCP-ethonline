/**
 * Code Generation Templates
 */

export interface HandlerTemplateOptions {
  contractName: string;
  eventName: string;
  entity: string;
  language: "typescript" | "javascript" | "rescript";
}

export class TemplateGenerator {
  static generateHandler(options: HandlerTemplateOptions): string {
    const { contractName, eventName, entity, language } = options;

    if (language === "typescript" || language === "javascript") {
      return `import { ${contractName} } from "../generated/src/Handlers.gen";

${contractName}.${eventName}.handler(async ({ event, context }) => {
  const entityId = \`\${event.transaction.hash}-\${event.logIndex}\`;
  
  let entity = await context.${entity}.get(entityId);
  
  if (!entity) {
    entity = {
      id: entityId,
      blockNumber: event.block.number,
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    };
  }
  
  await context.${entity}.set(entity);
  context.log.info(\`Processed ${eventName}: \${entityId}\`);
});`;
    }

    return `// ReScript handler template for ${contractName}.${eventName}`;
  }

  static generateSchema(options: {
    entityName: string;
    fields: Array<{ name: string; type: string; indexed?: boolean }>;
  }): string {
    const { entityName, fields } = options;

    let schema = `type ${entityName} {\n  id: ID!\n`;
    fields.forEach((field) => {
      const indexed = field.indexed ? " @index" : "";
      schema += `  ${field.name}: ${field.type}!${indexed}\n`;
    });
    schema += `}\n`;
    return schema;
  }

  static generateConfig(options: {
    name: string;
    networks: Array<{ id: number; startBlock: number }>;
  }): string {
    let config = `name: ${options.name}\nnetworks:\n`;
    options.networks.forEach((net) => {
      config += `  - id: ${net.id}\n    start_block: ${net.startBlock}\n`;
    });
    return config;
  }
}

export const COMMON_EVENT_SIGNATURES = {
  erc20: {
    Transfer: "Transfer(address indexed from, address indexed to, uint256 value)",
    Approval: "Approval(address indexed owner, address indexed spender, uint256 value)",
  },
  erc721: {
    Transfer: "Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  },
  uniswapV3: {
    Swap: "Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  },
};
