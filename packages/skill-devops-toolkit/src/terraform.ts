/**
 * Terraform utilities
 * Helpers for generating Terraform configurations
 */

import { z } from "zod";

// Terraform block types
export interface TerraformBlock {
  required_providers?: Record<string, {
    source: string;
    version: string;
  }>;
  backend?: {
    type: string;
    config: Record<string, string>;
  };
}

export interface ProviderBlock {
  type: string;
  config: Record<string, unknown>;
  alias?: string;
}

export interface VariableBlock {
  name: string;
  type?: string;
  description?: string;
  default?: unknown;
  sensitive?: boolean;
  validation?: {
    condition: string;
    error_message: string;
  };
}

export interface OutputBlock {
  name: string;
  value: string;
  description?: string;
  sensitive?: boolean;
}

export interface ResourceBlock {
  type: string;
  name: string;
  config: Record<string, unknown>;
  depends_on?: string[];
  count?: number | string;
  for_each?: string;
  lifecycle?: {
    create_before_destroy?: boolean;
    prevent_destroy?: boolean;
    ignore_changes?: string[];
  };
}

export interface DataBlock {
  type: string;
  name: string;
  config: Record<string, unknown>;
}

// HCL generation helpers
function formatValue(value: unknown, indent: number = 0): string {
  const spaces = "  ".repeat(indent);

  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    // Check if it's a reference (starts with var., local., data., etc.)
    if (
      value.startsWith("var.") ||
      value.startsWith("local.") ||
      value.startsWith("data.") ||
      value.startsWith("aws_") ||
      value.startsWith("google_") ||
      value.startsWith("azurerm_") ||
      value.includes("${")
    ) {
      return value;
    }
    return `"${value}"`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => formatValue(v, indent + 1)).join(",\n" + spaces + "  ");
    return `[\n${spaces}  ${items}\n${spaces}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    const items = entries
      .map(([k, v]) => `${spaces}  ${k} = ${formatValue(v, indent + 1)}`)
      .join("\n");
    return `{\n${items}\n${spaces}}`;
  }

  return String(value);
}

// Generate terraform block
export function generateTerraformBlock(config: TerraformBlock): string {
  let output = "terraform {\n";

  if (config.required_providers) {
    output += "  required_providers {\n";
    for (const [name, provider] of Object.entries(config.required_providers)) {
      output += `    ${name} = {\n`;
      output += `      source  = "${provider.source}"\n`;
      output += `      version = "${provider.version}"\n`;
      output += "    }\n";
    }
    output += "  }\n";
  }

  if (config.backend) {
    output += `\n  backend "${config.backend.type}" {\n`;
    for (const [key, value] of Object.entries(config.backend.config)) {
      output += `    ${key} = "${value}"\n`;
    }
    output += "  }\n";
  }

  output += "}\n";
  return output;
}

// Generate provider block
export function generateProviderBlock(provider: ProviderBlock): string {
  let output = `provider "${provider.type}" {\n`;
  if (provider.alias) {
    output += `  alias = "${provider.alias}"\n`;
  }
  for (const [key, value] of Object.entries(provider.config)) {
    output += `  ${key} = ${formatValue(value, 1)}\n`;
  }
  output += "}\n";
  return output;
}

// Generate variable block
export function generateVariableBlock(variable: VariableBlock): string {
  let output = `variable "${variable.name}" {\n`;
  if (variable.description) {
    output += `  description = "${variable.description}"\n`;
  }
  if (variable.type) {
    output += `  type        = ${variable.type}\n`;
  }
  if (variable.default !== undefined) {
    output += `  default     = ${formatValue(variable.default, 1)}\n`;
  }
  if (variable.sensitive) {
    output += "  sensitive   = true\n";
  }
  if (variable.validation) {
    output += "\n  validation {\n";
    output += `    condition     = ${variable.validation.condition}\n`;
    output += `    error_message = "${variable.validation.error_message}"\n`;
    output += "  }\n";
  }
  output += "}\n";
  return output;
}

// Generate resource block
export function generateResourceBlock(resource: ResourceBlock): string {
  let output = `resource "${resource.type}" "${resource.name}" {\n`;

  for (const [key, value] of Object.entries(resource.config)) {
    output += `  ${key} = ${formatValue(value, 1)}\n`;
  }

  if (resource.depends_on && resource.depends_on.length > 0) {
    output += `\n  depends_on = [${resource.depends_on.join(", ")}]\n`;
  }

  if (resource.lifecycle) {
    output += "\n  lifecycle {\n";
    if (resource.lifecycle.create_before_destroy) {
      output += "    create_before_destroy = true\n";
    }
    if (resource.lifecycle.prevent_destroy) {
      output += "    prevent_destroy = true\n";
    }
    if (resource.lifecycle.ignore_changes) {
      output += `    ignore_changes = [${resource.lifecycle.ignore_changes.join(", ")}]\n`;
    }
    output += "  }\n";
  }

  output += "}\n";
  return output;
}

// Generate data block
export function generateDataBlock(data: DataBlock): string {
  let output = `data "${data.type}" "${data.name}" {\n`;
  for (const [key, value] of Object.entries(data.config)) {
    output += `  ${key} = ${formatValue(value, 1)}\n`;
  }
  output += "}\n";
  return output;
}

// Generate output block
export function generateOutputBlock(output: OutputBlock): string {
  let result = `output "${output.name}" {\n`;
  result += `  value = ${output.value}\n`;
  if (output.description) {
    result += `  description = "${output.description}"\n`;
  }
  if (output.sensitive) {
    result += "  sensitive = true\n";
  }
  result += "}\n";
  return result;
}

// Pre-built module patterns
export const TerraformModules = {
  awsS3Bucket: (name: string, options?: { versioning?: boolean; publicAccess?: boolean }): ResourceBlock => ({
    type: "aws_s3_bucket",
    name,
    config: {
      bucket: `var.${name}_bucket_name`,
      tags: {
        Name: `var.${name}_bucket_name`,
        Environment: "var.environment",
      },
    },
  }),

  awsLambda: (name: string): ResourceBlock => ({
    type: "aws_lambda_function",
    name,
    config: {
      function_name: `var.${name}_function_name`,
      role: `aws_iam_role.${name}_role.arn`,
      handler: "index.handler",
      runtime: "nodejs20.x",
      filename: `data.archive_file.${name}.output_path`,
      source_code_hash: `data.archive_file.${name}.output_base64sha256`,
    },
  }),

  awsRds: (name: string): ResourceBlock => ({
    type: "aws_db_instance",
    name,
    config: {
      identifier: `var.${name}_identifier`,
      engine: "postgres",
      engine_version: "15",
      instance_class: "db.t3.micro",
      allocated_storage: 20,
      db_name: `var.${name}_db_name`,
      username: `var.${name}_username`,
      password: `var.${name}_password`,
      skip_final_snapshot: true,
    },
    lifecycle: {
      prevent_destroy: true,
    },
  }),
};
