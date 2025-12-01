/**
 * Opportunity Evaluator
 *
 * Scores and prioritizes opportunities using SCAMPER method.
 */

import type { Opportunity } from "../core/types.js";
import { generateJSON } from "../utils/llm.js";
import { Logger } from "../utils/logger.js";

// SCAMPER brainstorming framework for opportunity evaluation
const SCAMPER_EVALUATION = `
Apply SCAMPER analysis to identify improvement opportunities:
- **S**ubstitute: What existing solution could this replace?
- **C**ombine: What could this be merged with for more value?
- **A**dapt: What patterns from other domains apply?
- **M**odify: How could the scope be adjusted for better fit?
- **P**ut to use: What other use cases exist?
- **E**liminate: What complexity can be removed?
- **R**everse: What counterintuitive approach might work?
`;

export class OpportunityEvaluator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Evaluator");
  }

  /**
   * Evaluate an opportunity
   */
  async evaluate(opportunity: Opportunity): Promise<Opportunity> {
    this.logger.info(`Evaluating: ${opportunity.title}`);

    try {
      // Use LLM to analyze and score
      const analysis = await generateJSON<{
        scores: {
          userDemand: number;
          competitiveValue: number;
          technicalFit: number;
          effort: number;
          impact: number;
        };
        analysis: {
          whatItDoes: string;
          whyItMatters: string;
          howToBuild: string;
          risks: string[];
          dependencies: string[];
          estimatedEffort: string;
        };
        scamper: {
          substitute: string;
          combine: string;
          adapt: string;
          modify: string;
          putToUse: string;
          eliminate: string;
          reverse: string;
        };
        priority: "critical" | "high" | "medium" | "low";
      }>({
        prompt: `Evaluate this product opportunity for gICM (an AI-powered development platform):

Title: ${opportunity.title}
Description: ${opportunity.description}
Source: ${opportunity.source}
Type: ${opportunity.type}

gICM Context:
- AI agents for trading, research, content generation
- React component library with 100+ components
- Solana/Web3 focus
- Competes with Cursor, Replit, v0, Bolt

${SCAMPER_EVALUATION}

Score each 0-100:
- userDemand: How many users want this?
- competitiveValue: Does this differentiate us from competitors?
- technicalFit: How well does it fit our TypeScript/React/Solana stack?
- effort: How easy to build? (100 = very easy, 0 = very hard)
- impact: How much does it improve gICM?

Return JSON:
{
  "scores": { userDemand, competitiveValue, technicalFit, effort, impact },
  "analysis": {
    "whatItDoes": "<1 sentence>",
    "whyItMatters": "<1 sentence>",
    "howToBuild": "<1-2 sentences>",
    "risks": ["<risk1>", "<risk2>"],
    "dependencies": ["<dep1>"],
    "estimatedEffort": "<e.g., '1 week', '2-3 days'>"
  },
  "scamper": {
    "substitute": "<what it replaces>",
    "combine": "<what to merge with>",
    "adapt": "<patterns to borrow>",
    "modify": "<scope adjustments>",
    "putToUse": "<other use cases>",
    "eliminate": "<complexity to remove>",
    "reverse": "<counterintuitive approach>"
  },
  "priority": "<critical|high|medium|low>"
}`,
      });

      // Calculate overall score
      const { userDemand, competitiveValue, technicalFit, effort, impact } = analysis.scores;
      const overall = Math.round(
        userDemand * 0.25 +
        competitiveValue * 0.2 +
        technicalFit * 0.15 +
        effort * 0.15 +
        impact * 0.25
      );

      opportunity.scores = {
        ...analysis.scores,
        overall,
      };

      opportunity.analysis = {
        ...analysis.analysis,
        scamper: analysis.scamper,
      };
      opportunity.priority = analysis.priority;
      opportunity.status = "evaluated";
      opportunity.evaluatedAt = Date.now();

      this.logger.info(`Evaluated: ${opportunity.title} - Score: ${overall}, Priority: ${analysis.priority}`);

      return opportunity;
    } catch (error) {
      this.logger.error(`Evaluation failed: ${error}`);

      // Default scores on failure
      opportunity.scores = {
        userDemand: 50,
        competitiveValue: 50,
        technicalFit: 50,
        effort: 50,
        impact: 50,
        overall: 50,
      };

      opportunity.analysis = {
        whatItDoes: opportunity.description,
        whyItMatters: "Needs manual evaluation",
        howToBuild: "Needs manual planning",
        risks: ["Automated evaluation failed"],
        dependencies: [],
        estimatedEffort: "Unknown",
      };

      opportunity.priority = "medium";
      opportunity.status = "evaluated";
      opportunity.evaluatedAt = Date.now();

      return opportunity;
    }
  }

  /**
   * Re-evaluate all opportunities
   */
  async reEvaluateAll(opportunities: Opportunity[]): Promise<Opportunity[]> {
    const results: Opportunity[] = [];

    for (const opp of opportunities) {
      const evaluated = await this.evaluate(opp);
      results.push(evaluated);
    }

    return results;
  }
}
