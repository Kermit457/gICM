/**
 * Diff Analyzer
 *
 * Parses git diffs and extracts meaningful information for LLM context
 */

import type { DiffSummary, FileChange, FileChangeType, CommitRiskAssessment, CommitRiskFactor } from "../core/types.js";
import { RISK_WEIGHTS, RISK_THRESHOLDS, CRITICAL_PATH_PATTERNS, BREAKING_CHANGE_INDICATORS } from "../core/constants.js";

export interface DiffParseOptions {
  includeContent?: boolean;
  maxContentLength?: number;
}

export class DiffAnalyzer {
  /**
   * Parse raw diff output into structured format
   */
  parseDiff(rawDiff: string, staged = true, options: DiffParseOptions = {}): DiffSummary {
    const files = this.parseFileChanges(rawDiff);
    const totalLinesAdded = files.reduce((sum, f) => sum + f.linesAdded, 0);
    const totalLinesRemoved = files.reduce((sum, f) => sum + f.linesRemoved, 0);

    let diffContent = rawDiff;
    if (options.maxContentLength && diffContent.length > options.maxContentLength) {
      diffContent = diffContent.substring(0, options.maxContentLength) + "\n... (truncated)";
    }

    return {
      files,
      totalLinesAdded,
      totalLinesRemoved,
      totalFilesChanged: files.length,
      diffContent: options.includeContent !== false ? diffContent : "",
      staged,
    };
  }

  /**
   * Parse diff output to extract file changes
   */
  parseFileChanges(rawDiff: string): FileChange[] {
    const files: FileChange[] = [];
    const lines = rawDiff.split("\n");

    let currentFile: Partial<FileChange> | null = null;
    let linesAdded = 0;
    let linesRemoved = 0;

    for (const line of lines) {
      // New file diff header
      if (line.startsWith("diff --git")) {
        // Save previous file
        if (currentFile?.path) {
          files.push({
            path: currentFile.path,
            type: currentFile.type ?? "modified",
            linesAdded,
            linesRemoved,
            binary: currentFile.binary ?? false,
            oldPath: currentFile.oldPath,
          });
        }

        // Parse file path from "diff --git a/path b/path"
        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (match) {
          currentFile = {
            path: match[2],
            type: "modified",
            binary: false,
          };
          if (match[1] !== match[2]) {
            currentFile.oldPath = match[1];
            currentFile.type = "renamed";
          }
        }
        linesAdded = 0;
        linesRemoved = 0;
        continue;
      }

      // Detect new file
      if (line.startsWith("new file mode")) {
        if (currentFile) currentFile.type = "added";
        continue;
      }

      // Detect deleted file
      if (line.startsWith("deleted file mode")) {
        if (currentFile) currentFile.type = "deleted";
        continue;
      }

      // Detect binary file
      if (line.includes("Binary files") || line.includes("GIT binary patch")) {
        if (currentFile) currentFile.binary = true;
        continue;
      }

      // Count added lines
      if (line.startsWith("+") && !line.startsWith("+++")) {
        linesAdded++;
        continue;
      }

      // Count removed lines
      if (line.startsWith("-") && !line.startsWith("---")) {
        linesRemoved++;
        continue;
      }
    }

    // Save last file
    if (currentFile?.path) {
      files.push({
        path: currentFile.path,
        type: currentFile.type ?? "modified",
        linesAdded,
        linesRemoved,
        binary: currentFile.binary ?? false,
        oldPath: currentFile.oldPath,
      });
    }

    return files;
  }

  /**
   * Assess risk factors for a diff
   */
  assessRisk(diff: DiffSummary, criticalPaths: string[] = []): CommitRiskAssessment {
    const factors: CommitRiskFactor[] = [];
    const touchedCriticalPaths: string[] = [];

    // Calculate lines changed score
    const totalLines = diff.totalLinesAdded + diff.totalLinesRemoved;
    const linesScore = this.calculateLinesScore(totalLines);
    factors.push({
      name: "lines_changed",
      score: linesScore,
      weight: RISK_WEIGHTS.linesChanged,
      reason: `${totalLines} lines changed (+${diff.totalLinesAdded}/-${diff.totalLinesRemoved})`,
    });

    // Calculate files changed score
    const filesScore = this.calculateFilesScore(diff.totalFilesChanged);
    factors.push({
      name: "files_changed",
      score: filesScore,
      weight: RISK_WEIGHTS.filesChanged,
      reason: `${diff.totalFilesChanged} files changed`,
    });

    // Check for critical paths
    const allCriticalPatterns = [
      ...CRITICAL_PATH_PATTERNS,
      ...criticalPaths.map((p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
    ];

    for (const file of diff.files) {
      for (const pattern of allCriticalPatterns) {
        if (pattern.test(file.path)) {
          touchedCriticalPaths.push(file.path);
          break;
        }
      }
    }

    const criticalPathsScore = touchedCriticalPaths.length > 0 ? 100 : 0;
    factors.push({
      name: "critical_paths",
      score: criticalPathsScore,
      weight: RISK_WEIGHTS.criticalPaths,
      reason:
        touchedCriticalPaths.length > 0
          ? `Touches critical paths: ${touchedCriticalPaths.slice(0, 3).join(", ")}${touchedCriticalPaths.length > 3 ? "..." : ""}`
          : "No critical paths affected",
    });

    // Check for breaking changes
    const isBreaking = this.detectBreakingChange(diff.diffContent);
    const breakingScore = isBreaking ? 100 : 0;
    factors.push({
      name: "breaking_change",
      score: breakingScore,
      weight: RISK_WEIGHTS.breakingChange,
      reason: isBreaking ? "Contains breaking change indicators" : "No breaking changes detected",
    });

    // Calculate total weighted score
    const totalScore = Math.min(
      100,
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    );

    // Determine recommendation
    let recommendation: "auto_execute" | "queue_approval" | "escalate" | "reject";
    if (totalScore <= RISK_THRESHOLDS.autoExecuteMax) {
      recommendation = "auto_execute";
    } else if (totalScore <= RISK_THRESHOLDS.queueApprovalMax) {
      recommendation = "queue_approval";
    } else if (totalScore <= RISK_THRESHOLDS.escalateMax) {
      recommendation = "escalate";
    } else {
      recommendation = "reject";
    }

    return {
      totalScore: Math.round(totalScore),
      factors,
      recommendation,
      criticalPaths: touchedCriticalPaths,
      isBreakingChange: isBreaking,
    };
  }

  /**
   * Create a summary for LLM context
   */
  createLLMContext(diff: DiffSummary, maxLength = 8000): string {
    const sections: string[] = [];

    // Summary section
    sections.push(`## Summary
- Files changed: ${diff.totalFilesChanged}
- Lines added: ${diff.totalLinesAdded}
- Lines removed: ${diff.totalLinesRemoved}
`);

    // File list
    const fileList = diff.files
      .map((f) => {
        const indicator =
          f.type === "added"
            ? "+"
            : f.type === "deleted"
              ? "-"
              : f.type === "renamed"
                ? "→"
                : "M";
        return `  ${indicator} ${f.path} (+${f.linesAdded}/-${f.linesRemoved})`;
      })
      .join("\n");
    sections.push(`## Files\n${fileList}`);

    // Diff content (truncated if needed)
    let diffContent = diff.diffContent;
    const headerLength = sections.join("\n\n").length;
    const availableLength = maxLength - headerLength - 100;

    if (diffContent.length > availableLength) {
      diffContent = diffContent.substring(0, availableLength) + "\n... (truncated)";
    }

    sections.push(`## Diff\n\`\`\`diff\n${diffContent}\n\`\`\``);

    return sections.join("\n\n");
  }

  /**
   * Calculate risk score based on lines changed
   */
  private calculateLinesScore(lines: number): number {
    if (lines <= RISK_THRESHOLDS.linesLow) return 0;
    if (lines <= RISK_THRESHOLDS.linesMedium) return 25;
    if (lines <= RISK_THRESHOLDS.linesHigh) return 50;
    if (lines <= RISK_THRESHOLDS.linesCritical) return 75;
    return 100;
  }

  /**
   * Calculate risk score based on files changed
   */
  private calculateFilesScore(files: number): number {
    if (files <= RISK_THRESHOLDS.filesLow) return 0;
    if (files <= RISK_THRESHOLDS.filesMedium) return 25;
    if (files <= RISK_THRESHOLDS.filesHigh) return 50;
    if (files <= RISK_THRESHOLDS.filesCritical) return 75;
    return 100;
  }

  /**
   * Detect breaking change indicators in diff
   */
  private detectBreakingChange(diffContent: string): boolean {
    for (const pattern of BREAKING_CHANGE_INDICATORS) {
      if (pattern.test(diffContent)) return true;
    }
    return false;
  }
}
