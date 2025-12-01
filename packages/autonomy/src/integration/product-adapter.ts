/**
 * Product Engine Adapter
 *
 * Integrates ProductEngine with autonomy system for:
 * - Agent building
 * - Code commits
 * - Deployments
 */

import { EngineAdapter, type EngineAdapterConfig } from "./engine-adapter.js";
import type { Action, ActionCategory } from "../core/types.js";

export interface BuildParams {
  opportunityId: string;
  name: string;
  type: "agent" | "component" | "service";
  templateType?: string;
}

export interface CommitParams {
  message: string;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
}

export interface DeployParams {
  target: "staging" | "production";
  package: string;
  version: string;
}

export class ProductEngineAdapter extends EngineAdapter {
  constructor() {
    super({
      engineName: "product-engine",
      engineType: "product",
      defaultCategory: "build",
    });
  }

  /**
   * Create agent build action
   */
  createBuildAction(params: BuildParams): Action {
    return this.createAction({
      type: `build_${params.type}`,
      description: `Build ${params.type}: ${params.name}`,
      payload: {
        opportunityId: params.opportunityId,
        name: params.name,
        type: params.type,
        templateType: params.templateType,
      },
      reversible: true, // Builds can be reverted
      urgency: "normal",
    });
  }

  /**
   * Create code commit action
   */
  createCommitAction(params: CommitParams): Action {
    const totalLines = params.linesAdded + params.linesRemoved;
    return this.createAction({
      type: "code_commit",
      description: `Commit: ${params.message}`,
      payload: {
        message: params.message,
        files: params.files,
        linesAdded: params.linesAdded,
        linesRemoved: params.linesRemoved,
        paths: params.files,
      },
      linesChanged: totalLines,
      filesChanged: params.files.length,
      reversible: true, // Commits can be reverted
      urgency: "normal",
    });
  }

  /**
   * Create staging deployment action
   */
  createStagingDeployAction(params: Omit<DeployParams, "target">): Action {
    return this.createAction({
      type: "deploy_staging",
      description: `Deploy ${params.package}@${params.version} to staging`,
      payload: {
        target: "staging",
        package: params.package,
        version: params.version,
      },
      reversible: true, // Can rollback staging
      urgency: "normal",
    });
  }

  /**
   * Create production deployment action
   */
  createProductionDeployAction(params: Omit<DeployParams, "target">): Action {
    return this.createAction({
      type: "deploy_production",
      description: `Deploy ${params.package}@${params.version} to PRODUCTION`,
      payload: {
        target: "production",
        package: params.package,
        version: params.version,
      },
      reversible: true, // Can rollback, but risky
      urgency: "high",
    });
  }

  /**
   * Create quality gate action
   */
  createQualityGateAction(params: {
    package: string;
    testScore: number;
    reviewScore: number;
  }): Action {
    return this.createAction({
      type: "quality_gate",
      description: `Quality gate check for ${params.package}`,
      payload: {
        package: params.package,
        testScore: params.testScore,
        reviewScore: params.reviewScore,
        passed: params.testScore >= 80 && params.reviewScore >= 70,
      },
      reversible: true,
      urgency: "low",
    });
  }

  protected getCategoryForType(actionType: string): ActionCategory {
    if (actionType.includes("deploy")) return "deployment";
    if (actionType.includes("commit")) return "build";
    return "build";
  }
}
