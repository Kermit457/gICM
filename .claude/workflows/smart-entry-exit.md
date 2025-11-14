---
name: smart-entry-exit
description: Complete lifecycle orchestration. Research → Timing → Entry → Monitoring → Optimal Exit with profit maximization.
trigger: /smart-trade <token>
agents: [icm-analyst, whale-tracker, rug-detector, sentiment-analyzer, dex-trader]
orchestration: sequential + parallel
estimated_time: full trading lifecycle (hours to days)
---

# Smart Entry-Exit Workflow

Complete automated trading lifecycle from research through optimal exit. Combines all ICM agents to maximize profits and minimize risks through intelligent timing, position sizing, and exit optimization.

## Overview

This is the "master workflow" that orchestrates everything:

**Lifecycle Stages:**
1. **Research** → Full ICM analysis
2. **Timing** → Optimal entry window detection
3. **Entry** → Automated execution with slippage protection
4. **Monitoring** → 24/7 position tracking
5. **Exit** → Profit-maximized exits (partial + full)

**What Makes It "Smart":**
- Waits for optimal entry timing (not FOMO)
- Sizes position based on confidence
- Takes partial profits systematically
- Raises stop loss as profit increases
- Exits intelligently (not emotionally)

## Stage 1: Comprehensive Research

**Agents:** All 4 ICM agents
**Duration:** 3-5 minutes
**Orchestration:** Sequential

Runs `/full-icm-research` workflow to get complete analysis.

**Output:**
```markdown
Research Complete:
- Combined Score: 76.6/100
- Recommendation: BUY with caution
- Position Size: 3-5%
- Confidence: MEDIUM
- Entry Price Target: $0.0038-0.0045

→ Proceeding to Stage 2: Entry Timing
```

**Decision Point:**
- If score <50: ABORT (don't enter)
- If score 50-65: Proceed with reduced size (1-2%)
- If score 65-80: Proceed with normal size (3-5%)
- If score >80: Proceed with increased size (5-10%)

---

## Stage 2: Entry Timing Optimization

**Agents:** `whale-tracker` + `sentiment-analyzer` + `icm-analyst`
**Duration:** Variable (2-4 hours typical)
**Goal:** Find optimal entry window, avoid bad timing

**Timing Factors:**

```python
timing_analysis = {
    "launch_phase": {
        "time_since_launch": get_launch_age(),
        "optimal_window": "2-4h post-launch",
        "avoid": ["first 30min snipe zone", "parabolic pump"],
        "current_phase": analyze_phase()
    },

    "price_action": {
        "trend": detect_trend(),
        "consolidation": check_consolidation(),
        "support_levels": find_support(),
        "resistance_levels": find_resistance(),
        "optimal": "consolidation after initial pump"
    },

    "whale_timing": {
        "whale_buys_24h": count_whale_buys(),
        "whale_sells_24h": count_whale_sells(),
        "net_flow": calculate_net_flow(),
        "optimal": "whales accumulating, not selling"
    },

    "sentiment_timing": {
        "current_sentiment": get_sentiment(),
        "sentiment_trend": analyze_trend(),
        "fomo_level": detect_fomo(),
        "optimal": "bullish but not euphoric (65-80)"
    },

    "volume_timing": {
        "current_volume": get_volume(),
        "volume_trend": analyze_volume(),
        "buy_pressure": calculate_pressure(),
        "optimal": "declining from peak (consolidation)"
    }
}
```

**Timing Windows:**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ENTRY TIMING ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Token: $TOKEN
Current Time: 2h 43m since launch
Current Price: $0.0052

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TIMING FACTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Launch Phase:    ✅ GOOD (past snipe zone)
Price Action:    🟡 WAIT (still pumping)
Whale Activity:  ✅ GOOD (whales holding)
Sentiment:       🟡 CAUTION (getting euphoric: 82)
Volume:          🟡 WAIT (still high, no consolidation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ WAIT for consolidation

Reasons:
- Price still pumping (+45% in 1h)
- Sentiment too euphoric (82/100)
- Volume hasn't cooled off yet
- Risk of buying local top

Optimal Entry Windows:
1. 🎯 BEST: Price retraces to $0.0042-0.0045
   - Probability: 65%
   - ETA: 1-3 hours

2. 🎯 GOOD: Consolidation at $0.0048-0.0052
   - Probability: 25%
   - ETA: 2-4 hours

3. 🎯 ACCEPTABLE: Breakout above $0.0055 with volume
   - Probability: 10%
   - ETA: 4-6 hours

⏰ Monitoring every 2 minutes
Will alert when entry window opens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Patience Mode:**

While waiting for optimal entry:
- Monitor price every 2 minutes
- Track whale activity every 5 minutes
- Check sentiment every 10 minutes
- Alert immediately when window opens

**Entry Window Detection:**

```python
def detect_entry_window(token):
    """
    Detects when optimal entry window has opened
    """
    # Check all timing factors
    launch_age_ok = token.launch_age > 120  # >2h
    price_consolidated = token.volatility_1h < 15%
    whale_accumulating = token.whale_net_flow > 0
    sentiment_healthy = 65 < token.sentiment < 80
    volume_cooled = token.volume_1h < token.volume_peak * 0.4

    # Entry window is open if all factors align
    if all([
        launch_age_ok,
        price_consolidated,
        whale_accumulating,
        sentiment_healthy,
        volume_cooled
    ]):
        return {
            "window_open": True,
            "confidence": calculate_confidence(),
            "price_range": (token.support, token.resistance),
            "urgency": "enter_within_15min"
        }

    return {"window_open": False}
```

**Entry Window Alert:**

```markdown
🎯 ENTRY WINDOW OPENED!

Token: $TOKEN
Current Price: $0.0043

All timing factors aligned:
✅ Launch age: 3h 12m (consolidated)
✅ Price action: Consolidating at support
✅ Whale activity: Net buying (+2.1%)
✅ Sentiment: 72/100 (bullish, not euphoric)
✅ Volume: Cooled to 35% of peak

Recommended Entry:
- Price Range: $0.0042-0.0045
- Position Size: 4% of portfolio
- Stop Loss: $0.0035 (-18%)
- Take Profit Targets: 2x, 3x, 5x

⏰ Window may close in 15-30 minutes
Proceeding to Stage 3: Entry Execution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 3: Automated Entry Execution

**Agent:** `dex-trader`
**Duration:** 10-30 seconds
**Goal:** Execute entry with minimal slippage

**Entry Execution:**

```python
def execute_smart_entry(token, config):
    """
    Optimized entry execution
    """
    # Calculate position size
    portfolio_value = get_portfolio_value()
    position_size = portfolio_value * config.position_percentage
    confidence_multiplier = config.confidence_score / 100

    # Apply confidence multiplier
    final_position = position_size * confidence_multiplier

    # Split large orders
    if final_position > token.liquidity * 0.05:
        # Split into 3 orders
        return execute_split_order(final_position, chunks=3)

    # Calculate optimal route
    route = find_best_route(
        token=token,
        amount=final_position,
        max_slippage=config.max_slippage
    )

    # Execute
    tx = execute_swap(
        route=route,
        slippage_tolerance=config.max_slippage,
        priority_fee=calculate_priority_fee()
    )

    return {
        "success": True,
        "tx_hash": tx.signature,
        "tokens_received": tx.tokens,
        "avg_price": tx.price,
        "slippage": tx.slippage
    }
```

**Entry Confirmation:**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ENTRY EXECUTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Token: $TOKEN
Timestamp: [time]

TRANSACTION DETAILS:
- TX Hash: 5Qw8...mN3X
- Status: ✅ CONFIRMED

POSITION DETAILS:
- Tokens Bought: 9,523 $TOKEN
- Entry Price: $0.0042
- Total Cost: $40.00 (4% of portfolio)
- Slippage: 1.2% (excellent)

RISK MANAGEMENT:
- Stop Loss: $0.0035 (-16.7%)
- Take Profit 1: $0.0084 (2x) - sell 30%
- Take Profit 2: $0.0126 (3x) - sell 40%
- Take Profit 3: $0.0210 (5x) - sell remaining

MONITORING STATUS:
✅ Rug protection enabled
✅ Whale tracking active
✅ Sentiment monitoring active
✅ Automated exits armed

→ Proceeding to Stage 4: Position Monitoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 4: Active Position Management

**Agents:** `rug-detector` + `whale-tracker` + `sentiment-analyzer`
**Duration:** Until exit
**Goal:** Protect profits, optimize exits

Runs `/launch-monitoring` and `/rug-protection` workflows continuously.

**Dynamic Stop Loss Management:**

```python
def manage_stop_loss(position):
    """
    Dynamically adjusts stop loss as profit increases
    """
    current_price = get_current_price()
    entry_price = position.entry_price
    roi = (current_price - entry_price) / entry_price

    if roi < 0:
        # In loss, keep original stop
        stop_loss = entry_price * 0.833  # -16.7%

    elif roi < 0.5:
        # 0-50% profit: -10% stop
        stop_loss = entry_price

    elif roi < 1.0:
        # 50-100% profit: breakeven stop
        stop_loss = entry_price * 1.1

    elif roi < 2.0:
        # 100-200% profit: 50% profit protected
        stop_loss = entry_price * 1.5

    else:
        # >200% profit: 100% profit protected
        stop_loss = entry_price * 2.0

    return stop_loss
```

**Profit-Taking Strategy:**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    PROFIT-TAKING TRIGGERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Position: 9,523 $TOKEN
Entry: $0.0042
Current: $0.0089 (+112%)

PARTIAL PROFIT ZONES:

🎯 Target 1: 2x ($0.0084) ✅ HIT
- Action: SELL 30% (2,857 tokens)
- Reason: Lock in initial investment
- Remaining: 6,666 tokens (70%)

🎯 Target 2: 3x ($0.0126) ⏳ PENDING
- Action: SELL 40% (3,809 tokens)
- Current: $0.0089 (still 41% away)
- Remaining: 2,857 tokens (30%)

🎯 Target 3: 5x ($0.0210) ⏳ PENDING
- Action: SELL 100% (remaining)
- Current: $0.0089 (still 136% away)

DYNAMIC STOPS:
- Original Stop: $0.0035 (-16.7%)
- Current Stop: $0.0063 (breakeven + 50%)
- Trailing Stop: -25% from peak ($0.0067)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Position Monitoring Dashboard:**

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ACTIVE POSITION: $TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Holding: 2h 15m
Entry: $0.0042 @ 9,523 tokens
Current: $0.0089 (+112%)

P&L:
- Invested: $40.00
- Current Value: $84.75
- Unrealized: +$44.75 (+112%)
- Realized (from TP1): $24.00
- Total Profit: +$68.75 (+172%)

Position: 6,666 tokens remaining (70%)

Safety Metrics:
- Rug Score: 32/100 ✅
- Whale Activity: 2 holding ✅
- Sentiment: 78/100 ✅
- Liquidity: $145k (+14%) ✅

Next Actions:
- TP2 at $0.0126 (41% away)
- Stop at $0.0063 (trail -25%)
- Monitoring 24/7 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Stage 5: Intelligent Exit Optimization

**Agent:** `dex-trader` + `whale-tracker`
**Goal:** Maximize exit value

**Exit Scenarios:**

### Scenario A: Target Hit (Profit-Taking)

```markdown
🎯 Take Profit Target Hit!

Target 2 reached: $0.0126 (3x)
Action: Selling 40% of position

EXECUTION:
- Selling: 3,809 tokens
- Expected proceeds: ~$48.00
- Keeping: 2,857 tokens (30%)

PERFORMANCE:
- Entry cost: $40.00
- Realized profit: $24.00 (TP1) + $48.00 (TP2) = $72.00
- ROI so far: +180%
- Remaining value: ~$36.00 (2,857 tokens)

→ Executing sell...
→ Confirmed! Exit price: $0.0127 (+1% above target)
```

### Scenario B: Whale Exit (Follow Smart Money)

```markdown
🚨 Whale Exit Signal!

Tier 1 whale "Sol Sniper" sold 60% of position
- Whale entry: $0.0038
- Whale exit: $0.0145 (+282%)
- You're at: $0.0142 (+238%)

RECOMMENDATION: Follow whale exit
- Sell 60% immediately (mimic whale)
- Keep 40% runner with tight stop

→ Executing: Sell 3,999 tokens (60%)
→ Keep: 2,666 tokens (40%) with $0.0120 stop
```

### Scenario C: Rug Signal (Emergency Exit)

```markdown
🔴 RUG SIGNAL DETECTED!

Trigger: Liquidity dropped 35% in 10 minutes
Current rug score: 68 → 82

EMERGENCY EXIT ACTIVATED
- Selling: 100% of position (6,666 tokens)
- Current price: $0.0082
- Urgency: HIGH (5 second countdown)

→ [5] Preparing transaction...
→ [3] Signing...
→ [1] Submitting...
→ ✅ EXIT COMPLETE

Final results:
- Exit price: $0.0079 (slippage due to rush)
- Proceeds: $52.67
- Total profit: +$36.67 (+92%)
- Avoided further loss: Coin now at $0.0023 (-71%)
```

### Scenario D: Sentiment Crash (Take Profits)

```markdown
⚠️ Sentiment Crashed!

Sentiment: 78 → 42 in 20 minutes
Cause: Major FUD + whale sells

RECOMMENDATION: Take profits now
- Market turning bearish
- Exit before cascade

→ Executing: Sell 100% (6,666 tokens)
→ Exit price: $0.0095 (+126%)
→ Total profit: +$50.44 (+126%)
```

**Exit Optimization:**

```python
def optimize_exit(position, reason):
    """
    Optimizes exit execution based on urgency
    """
    if reason == "emergency_rug":
        # Just sell, don't optimize
        return immediate_market_sell(position)

    elif reason == "whale_exit":
        # Try to frontrun other followers
        return market_sell_high_priority(position)

    elif reason == "take_profit":
        # Optimize for best price
        return limit_order_with_fallback(position)

    elif reason == "stop_loss":
        # Balance speed and slippage
        return market_sell_medium_priority(position)
```

---

## Complete Trade Summary

After exit, generate comprehensive summary:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      TRADE COMPLETE: $TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: 2d 7h 23m
Strategy: Smart Entry-Exit (automated)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ENTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Research Score: 76.6/100 (BUY with caution)
Entry Time: 3h 12m after launch (optimal window)
Entry Price: $0.0042
Tokens: 9,523
Cost: $40.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        EXITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Exit 1: Take Profit 1 (2x)
- Sold: 2,857 tokens (30%)
- Price: $0.0085 (+102%)
- Proceeds: $24.28

Exit 2: Take Profit 2 (3x)
- Sold: 3,809 tokens (40%)
- Price: $0.0127 (+202%)
- Proceeds: $48.38

Exit 3: Whale Exit Signal
- Sold: 2,857 tokens (30%)
- Price: $0.0145 (+245%)
- Proceeds: $41.43

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Invested:     $40.00
Total Returned:     $114.09
Net Profit:         +$74.09
ROI:                +185%

Average Exit:       $0.0120 (+186%)
Best Exit:          $0.0145 (+245%)
Worst Exit:         $0.0085 (+102%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      WHAT IF SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If held all to current price ($0.0082):
- Would have: $78.09
- Profit: +$38.09 (+95%)
- You did BETTER: +$36.00 more (+90% better)

If sold all at entry window:
- Would have: $40.00 (break-even)
- Avoided: Missing +185% gain

If held through peak ($0.0187):
- Peak would have been: $178.28
- But then crashed, you exited at: $114.09
- You captured: 64% of peak (good exit timing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        KEY DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Waited for consolidation (+3h patience)
✅ Entered at optimal window (+12% vs immediate)
✅ Took partial profits at 2x and 3x
✅ Followed whale exit signal
✅ Protected capital with dynamic stops
✅ Avoided final -43% crash

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         LESSONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What worked:
- Patience to wait for optimal entry
- Partial profit-taking strategy
- Following whale signals
- Automated monitoring

What could improve:
- Could have exited final 30% at $0.0187 peak
- Maybe too conservative on take-profit levels

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This trade will be used to improve future strategies.
```

## Configuration

```json
{
  "smartTrade": {
    "research": {
      "min_score": 50,
      "auto_proceed": true
    },
    "timing": {
      "patience_mode": true,
      "max_wait": "6h",
      "preferred_window": "2-4h_post_launch"
    },
    "entry": {
      "position_sizing": "dynamic",
      "max_slippage": 3,
      "split_large_orders": true
    },
    "management": {
      "dynamic_stops": true,
      "partial_profits": [2, 3, 5],
      "profit_percentages": [30, 40, 30],
      "trailing_stop": 25
    },
    "exit": {
      "follow_whales": true,
      "sentiment_override": true,
      "rug_protection": true
    }
  }
}
```

## Usage

```bash
# Full automated lifecycle
/smart-trade <token>

# With custom take-profit targets
/smart-trade <token> --targets=2,4,7 --splits=40,30,30

# Manual approval mode (confirm each stage)
/smart-trade <token> --manual-approve=true
```

## Best Practices

### DO:
- ✅ Let it find optimal entry (don't rush)
- ✅ Trust the partial profit strategy
- ✅ Follow whale exit signals
- ✅ Enable all monitoring
- ✅ Review trade summaries

### DON'T:
- ❌ Override the timing (FOMO)
- ❌ Hold past whale exits
- ❌ Disable rug protection
- ❌ Skip stops to "ride it out"
- ❌ Manually exit before targets (unless emergency)

---

**Built for maximum profit extraction** 💰

*Let the machines trade while you sleep.*
