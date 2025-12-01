/**
 * Built-in Workflow Templates
 */

export { auditDeployTemplate } from "./audit-deploy.js";
export { researchDecideTemplate } from "./research-decide.js";
export { scanAnalyzeTradeTemplate } from "./scan-analyze-trade.js";

import { auditDeployTemplate } from "./audit-deploy.js";
import { researchDecideTemplate } from "./research-decide.js";
import { scanAnalyzeTradeTemplate } from "./scan-analyze-trade.js";
import type { CreateWorkflowInput } from "../types.js";

export const templates: Record<string, CreateWorkflowInput> = {
  "audit-deploy": auditDeployTemplate,
  "research-decide-trade": researchDecideTemplate,
  "scan-all-chains": scanAnalyzeTradeTemplate,
};

export function getTemplate(name: string): CreateWorkflowInput | undefined {
  return templates[name];
}

export function listTemplates(): { name: string; description: string }[] {
  return Object.entries(templates).map(([name, template]) => ({
    name,
    description: template.description || "",
  }));
}
