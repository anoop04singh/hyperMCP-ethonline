/**
 * Validation Utilities
 * Validators for config, schema, and handler code
 */

import * as yaml from "yaml";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  static validate(configContent: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const config = yaml.parse(configContent);

      if (!config.name) {
        result.errors.push("Missing required field: name");
        result.valid = false;
      }

      if (!config.networks || !Array.isArray(config.networks)) {
        result.errors.push("Missing or invalid 'networks' array");
        result.valid = false;
      } else {
        config.networks.forEach((net: any, idx: number) => {
          if (!net.id) {
            result.errors.push(`Network ${idx}: Missing 'id' field`);
            result.valid = false;
          }
          if (net.startblock === undefined && net.start_block === undefined) {
            result.errors.push(`Network ${idx}: Missing 'startblock'`);
            result.valid = false;
          }
        });
      }

      if (config.unorderedmultichainmode === undefined && config.networks?.length > 1) {
        result.warnings.push(
          "Multi-chain setup: Consider setting unorderedmultichainmode to true for better performance"
        );
      }
    } catch (error: any) {
      result.errors.push(`YAML parsing error: ${error.message}`);
      result.valid = false;
    }

    return result;
  }

  static validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static validateEventSignature(signature: string): boolean {
    return /^[A-Za-z][A-Za-z0-9]*\([^)]*\)$/.test(signature);
  }
}

export class SchemaValidator {
  static validate(schemaContent: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const typeMatches = schemaContent.matchAll(/type\s+(\w+)\s*{([^}]+)}/g);
    
    for (const match of typeMatches) {
      const typeName = match[1];
      const fields = match[2];

      if (!fields.includes("id:")) {
        result.errors.push(`Type '${typeName}' missing required 'id: ID!' field`);
        result.valid = false;
      }

      const reservedWords = ["interface", "implements", "type", "enum"];
      if (reservedWords.includes(typeName.toLowerCase())) {
        result.errors.push(`Type name '${typeName}' is a reserved word`);
        result.valid = false;
      }
    }

    return result;
  }
}

export class HandlerValidator {
  static validate(handlerCode: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (handlerCode.includes(".handler(") && !handlerCode.includes("async")) {
      result.warnings.push("Handler should be async for database operations");
    }

    if (!handlerCode.includes("context.")) {
      result.warnings.push("Handler doesn't use context for entity operations");
    }

    return result;
  }
}
