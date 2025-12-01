/**
 * LIVE mode trading guards to prevent excessive losses
 */

export interface LiveModeConfig {
  maxPositionUsd: number;
  maxDailyLossUsd: number;
  maxDrawdownPercent: number;
  requireApproval: boolean;
  coolDownAfterLossMs: number;
  allowedTokens?: string[];
  blockedTokens: string[];
}

const DEFAULT_CONFIG: LiveModeConfig = {
  maxPositionUsd: 1000,
  maxDailyLossUsd: 100,
  maxDrawdownPercent: 10,
  requireApproval: true,
  coolDownAfterLossMs: 3600000, // 1 hour
  blockedTokens: [],
};

export interface TradeRequest {
  token: string;
  side: "buy" | "sell";
  amountUsd: number;
  source: string;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  warnings: string[];
}

export interface PendingApproval {
  id: string;
  request: TradeRequest;
  createdAt: number;
}

export class LiveModeGuard {
  private config: LiveModeConfig;
  private dailyPnL = 0;
  private lastLossTime = 0;
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  private dailyPnLResetTime: number;

  constructor(config?: Partial<LiveModeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dailyPnLResetTime = this.getNextMidnightUTC();
  }

  checkTrade(request: TradeRequest): GuardResult {
    const warnings: string[] = [];

    // Check daily reset
    if (Date.now() > this.dailyPnLResetTime) {
      this.dailyPnL = 0;
      this.dailyPnLResetTime = this.getNextMidnightUTC();
    }

    // Check cool-down period
    if (this.lastLossTime > 0) {
      const coolDownRemaining =
        this.lastLossTime + this.config.coolDownAfterLossMs - Date.now();
      if (coolDownRemaining > 0) {
        return {
          allowed: false,
          reason: `In cool-down period after loss. ${Math.ceil(coolDownRemaining / 60000)} minutes remaining.`,
          warnings,
        };
      }
    }

    // Check blocked tokens
    if (this.config.blockedTokens.includes(request.token)) {
      return {
        allowed: false,
        reason: `Token ${request.token} is blocked`,
        warnings,
      };
    }

    // Check allowed tokens (if specified)
    if (
      this.config.allowedTokens &&
      !this.config.allowedTokens.includes(request.token)
    ) {
      return {
        allowed: false,
        reason: `Token ${request.token} not in allowed list`,
        warnings,
      };
    }

    // Check position size
    if (request.amountUsd > this.config.maxPositionUsd) {
      return {
        allowed: false,
        reason: `Position $${request.amountUsd} exceeds max $${this.config.maxPositionUsd}`,
        warnings,
      };
    }

    // Check daily loss limit
    if (this.dailyPnL < -this.config.maxDailyLossUsd) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: $${Math.abs(this.dailyPnL).toFixed(2)}`,
        warnings,
      };
    }

    // Add warnings for risky trades
    if (request.amountUsd > this.config.maxPositionUsd * 0.5) {
      warnings.push(
        `Large position: ${((request.amountUsd / this.config.maxPositionUsd) * 100).toFixed(0)}% of max`
      );
    }

    if (this.dailyPnL < -this.config.maxDailyLossUsd * 0.5) {
      warnings.push(
        `Approaching daily loss limit: $${Math.abs(this.dailyPnL).toFixed(2)} of $${this.config.maxDailyLossUsd}`
      );
    }

    // Check if approval required
    if (this.config.requireApproval) {
      const approvalId = `${request.token}-${request.side}-${Date.now()}`;
      this.pendingApprovals.set(approvalId, {
        id: approvalId,
        request,
        createdAt: Date.now(),
      });

      return {
        allowed: false,
        requiresApproval: true,
        approvalId,
        reason: `Requires human approval (ID: ${approvalId})`,
        warnings,
      };
    }

    return { allowed: true, warnings };
  }

  approveTradeById(approvalId: string): TradeRequest | null {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      this.pendingApprovals.delete(approvalId);
      return approval.request;
    }
    return null;
  }

  rejectTradeById(approvalId: string): void {
    this.pendingApprovals.delete(approvalId);
  }

  recordTradeResult(pnl: number): void {
    this.dailyPnL += pnl;
    if (pnl < 0) {
      this.lastLossTime = Date.now();
    }
  }

  getStatus(): {
    dailyPnL: number;
    inCoolDown: boolean;
    coolDownRemainingMs: number;
    pendingApprovals: number;
    config: LiveModeConfig;
  } {
    const inCoolDown =
      this.lastLossTime > 0 &&
      Date.now() < this.lastLossTime + this.config.coolDownAfterLossMs;

    return {
      dailyPnL: this.dailyPnL,
      inCoolDown,
      coolDownRemainingMs: inCoolDown
        ? this.lastLossTime + this.config.coolDownAfterLossMs - Date.now()
        : 0,
      pendingApprovals: this.pendingApprovals.size,
      config: this.config,
    };
  }

  getPendingApprovals(): PendingApproval[] {
    return Array.from(this.pendingApprovals.values());
  }

  resetDailyPnL(): void {
    this.dailyPnL = 0;
    this.dailyPnLResetTime = this.getNextMidnightUTC();
  }

  clearCoolDown(): void {
    this.lastLossTime = 0;
  }

  private getNextMidnightUTC(): number {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );
    return tomorrow.getTime();
  }
}
