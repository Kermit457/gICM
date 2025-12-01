/**
 * Constants for Commit Agent
 *
 * Risk weights, thresholds, and conventional commit mappings
 */

// ============================================================================
// RISK WEIGHTS
// ============================================================================

export const RISK_WEIGHTS = {
  linesChanged: 0.3, // 30% weight
  filesChanged: 0.2, // 20% weight
  criticalPaths: 0.25, // 25% weight
  breakingChange: 0.2, // 20% weight
  forcePush: 0.05, // 5% weight (always escalate if present)
} as const;

// ============================================================================
// RISK THRESHOLDS
// ============================================================================

export const RISK_THRESHOLDS = {
  // Lines changed
  linesLow: 50, // <50 lines = safe
  linesMedium: 150, // 50-150 = low risk
  linesHigh: 300, // 150-300 = medium risk
  linesCritical: 500, // >500 = high risk

  // Files changed
  filesLow: 3, // <3 files = safe
  filesMedium: 7, // 3-7 = low risk
  filesHigh: 15, // 7-15 = medium risk
  filesCritical: 25, // >25 = high risk

  // Decision score thresholds
  autoExecuteMax: 40, // 0-40 = auto execute
  queueApprovalMax: 60, // 41-60 = queue approval
  escalateMax: 80, // 61-80 = escalate
  // >80 = reject (or escalate with urgency)
} as const;

// ============================================================================
// CONVENTIONAL COMMIT TYPE DESCRIPTIONS
// ============================================================================

export const COMMIT_TYPE_DESCRIPTIONS: Record<string, string> = {
  feat: "A new feature for the user",
  fix: "A bug fix",
  docs: "Documentation only changes",
  style: "Changes that do not affect the meaning of the code (formatting, semicolons)",
  refactor: "A code change that neither fixes a bug nor adds a feature",
  perf: "A code change that improves performance",
  test: "Adding missing tests or correcting existing tests",
  build: "Changes that affect the build system or external dependencies",
  ci: "Changes to CI configuration files and scripts",
  chore: "Other changes that don't modify src or test files",
  revert: "Reverts a previous commit",
} as const;

// ============================================================================
// FILE PATTERNS FOR RISK DETECTION
// ============================================================================

export const CRITICAL_PATH_PATTERNS = [
  // Core infrastructure
  /^src\/core\//,
  /^packages\/agent-core\//,
  /^packages\/autonomy\//,

  // Configuration
  /\.env/,
  /^\.github\/workflows\//,
  /package\.json$/,
  /pnpm-workspace\.yaml$/,
  /tsconfig\.json$/,

  // Security-sensitive
  /secret/i,
  /credential/i,
  /password/i,
  /api[_-]?key/i,
  /private[_-]?key/i,

  // Database
  /migration/i,
  /schema\.(sql|prisma|ts)$/,
] as const;

export const BREAKING_CHANGE_INDICATORS = [
  /^feat!/,
  /^fix!/,
  /BREAKING CHANGE:/i,
  /\bremove\b.*\bapi\b/i,
  /\bdelete\b.*\bendpoint\b/i,
  /\bdeprecate\b/i,
] as const;

// ============================================================================
// DEFAULT MESSAGES
// ============================================================================

export const DEFAULT_CO_AUTHOR = "Claude <noreply@anthropic.com>";

export const COMMIT_FOOTER_TEMPLATE = `
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: ${DEFAULT_CO_AUTHOR}
`.trim();
