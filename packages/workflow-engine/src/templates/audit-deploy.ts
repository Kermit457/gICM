/**
 * Audit-then-Deploy Workflow Template
 * audit-agent → decision-agent → deployer-agent
 */

import type { CreateWorkflowInput } from "../types.js";

export const auditDeployTemplate: CreateWorkflowInput = {
  name: "audit-deploy",
  description: "Audit smart contract, get approval decision, then deploy if approved",
  steps: [
    {
      id: "audit",
      agent: "audit-agent",
      input: {
        contractPath: "${variables.contractPath}",
        severity: "${variables.severity || 'high'}",
      },
      onError: "fail",
      timeout: 120000, // 2 min for audit
    },
    {
      id: "decide",
      agent: "decision-agent",
      input: {
        context: "Contract audit results",
        auditResult: "${results.audit}",
        threshold: "${variables.approvalThreshold || 80}",
      },
      dependsOn: ["audit"],
      onError: "fail",
    },
    {
      id: "deploy",
      agent: "deployer-agent",
      input: {
        contractPath: "${variables.contractPath}",
        network: "${variables.network || 'devnet'}",
        auditReport: "${results.audit}",
        decisionReport: "${results.decide}",
      },
      dependsOn: ["decide"],
      condition: "results.decide.approved === true",
      onError: "fail",
    },
  ],
  variables: {
    contractPath: "",
    network: "devnet",
    severity: "high",
    approvalThreshold: 80,
  },
};
