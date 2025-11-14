---
name: launch-monitoring
description: Continuous post-entry monitoring workflow. Tracks whale activity, rug risks, and sentiment shifts in real-time with automated alerts.
trigger: /launch-monitoring <token>
agents: [rug-detector, whale-tracker, sentiment-analyzer]
orchestration: parallel
estimated_time: continuous (until stopped)
---

# Launch Monitoring Workflow

Continuous real-time monitoring for positions you've entered. Runs 3 agents in parallel to watch for exit signals, whale dumps, rug pull attempts, and sentiment crashes. Sends instant alerts when thresholds are breached.

## Overview

After entering a position (based on `/icm-research` recommendation), this workflow provides 24/7 monitoring to protect your investment and maximize profits.

**Agents Running in Parallel:**
1. **rug-detector** - Watches liquidity, dev wallets, contract behavior
2. **whale-tracker** - Monitors whale exits and new whale entries
3. **sentiment-analyzer** - Tracks social sentiment shifts

**Alert Triggers:**
- 🔴 **CRITICAL:** Immediate exit required (rug detected, whale dump)
- 🟡 **WARNING:** Concerning development (investigate immediately)
- 🟢 **INFO:** Positive signal (whale accumulation, sentiment surge)

## When to Use

Start this workflow:
- ✅ Immediately after entering a position
- ✅ When holding any ICM token overnight
- ✅ During high-volatility periods
- ✅ When you can't actively monitor charts
- ✅ To automate exit triggers

**Duration:** Continuous until you manually stop or token sells

## Monitoring Loops

### Loop 1: Rug Pull Detection (Every 30 seconds)

**Agent:** `rug-detector`
**Check Frequency:** 30-second intervals
**Priority:** CRITICAL

**Monitored Metrics:**
```python
checks = {
    "liquidity_depth": {
        "current": get_liquidity(),
        "baseline": entry_liquidity,
        "threshold": -20%  # Alert if drops 20%
    },
    "dev_wallet_activity": {
        "sells_24h": count_dev_sells(),
        "threshold": 1%  # Alert if dev sells >1%
    },
    "lp_token_status": {
        "locked": check_lp_lock(),
        "threshold": "any_unlock_attempt"
    },
    "contract_behavior": {
        "mint_attempts": scan_mint(),
        "ownership_changes": check_ownership(),
        "threshold": "any_suspicious_tx"
    },
    "rug_score": {
        "current": calculate_rug_score(),
        "baseline": entry_rug_score,
        "threshold": +20  # Alert if increases 20 points
    }
}
```

**Alert Examples:**

```markdown
🔴 CRITICAL RUG ALERT: $TOKEN

Liquidity dropped 28% in last 5 minutes!
- Before: $127k
- Now: $91k
- Change: -$36k (-28%)

⚠️ IMMEDIATE ACTION REQUIRED
→ Recommend: EXIT NOW
→ Use: /exit-now <token> --percentage=100

Timestamp: [time]
```

```markdown
🔴 CRITICAL RUG ALERT: $TOKEN

Dev wallet just sold 3.2% of holdings!
- Amount: 13,400 tokens
- Value: ~$8,900
- This is dev's FIRST sell

⚠️ POSSIBLE RUG IN PROGRESS
→ Recommend: EXIT NOW
→ Rug Score increased: 25 → 68

Timestamp: [time]
```

**Automated Actions:**
- If rug score >80: Auto-trigger `/exit-now` (if enabled)
- If liquidity drops >50%: Auto-trigger `/exit-now` (if enabled)
- Send alerts to all configured channels (Discord, Telegram, Email)

---

### Loop 2: Whale Activity Monitoring (Every 60 seconds)

**Agent:** `whale-tracker`
**Check Frequency:** 60-second intervals
**Priority:** HIGH

**Monitored Metrics:**
```python
checks = {
    "whale_position_changes": {
        "tracked_whales": get_known_whales(),
        "check": "position_size_changes",
        "threshold": ±5%  # Alert on 5%+ change
    },
    "whale_exits": {
        "tier_1_whales": monitor_tier_1(),
        "tier_2_whales": monitor_tier_2(),
        "threshold": "any_partial_exit"
    },
    "new_whale_entries": {
        "scan": "new_wallets_top_20",
        "threshold": "tier_1_or_2_entry"
    },
    "whale_accumulation": {
        "net_flow": calculate_whale_net_buys(),
        "threshold": "+10% in 1h"  # Bullish signal
    }
}
```

**Alert Examples:**

```markdown
🔴 CRITICAL WHALE ALERT: $TOKEN

Tier 1 Whale "Sol Sniper" is EXITING!
- Whale Address: 7BnP...xQ2F
- Action: SOLD 45% of position
- Exit Price: $0.0187 (+345% from entry)
- Remaining: 55%

📊 YOUR POSITION:
- Entry: $0.0042 (same as whale)
- Current: $0.0187 (+345%)

⚠️ RECOMMENDED ACTION:
→ Take profits NOW (sell 40-50%)
→ Keep 50% runner with tight stop
→ If whale exits remaining, EXIT FULLY

Timestamp: [time]
```

```markdown
🟢 POSITIVE WHALE SIGNAL: $TOKEN

NEW Tier 1 Whale entered position!
- Whale: "DeFi Master" (91% win rate)
- Position: 4.2% of supply (#6 holder)
- Entry Price: $0.0052
- Tier: 1 (Elite)

📊 ANALYSIS:
- This is a BULLISH signal
- Whale has 91% win rate
- Average ROI: +420%

💡 SUGGESTION:
→ Consider adding to position if <$0.0055
→ Continue holding with confidence
→ Raise take-profit targets

Timestamp: [time]
```

**Automated Actions:**
- If 2+ Tier 1 whales exit >50%: Auto-trigger `/exit-now` (if enabled)
- If new Tier 1 whale enters: Send INFO alert
- Track all whale movements in position log

---

### Loop 3: Sentiment Monitoring (Every 2 minutes)

**Agent:** `sentiment-analyzer`
**Check Frequency:** 120-second intervals
**Priority:** MEDIUM

**Monitored Metrics:**
```python
checks = {
    "overall_sentiment": {
        "current": get_sentiment_score(),
        "baseline": entry_sentiment,
        "threshold_crash": -20,  # Alert if drops 20 points
        "threshold_moon": +25    # Alert if spikes 25 points
    },
    "twitter_activity": {
        "mentions_velocity": count_mentions(),
        "bot_percentage": detect_bots(),
        "influencer_shifts": track_influencers()
    },
    "telegram_health": {
        "messages_per_hour": count_messages(),
        "member_growth": track_members(),
        "panic_indicators": detect_panic()
    },
    "fud_detection": {
        "fud_volume": count_fud_messages(),
        "fud_validation": validate_claims(),
        "coordinated_fud": detect_coordination()
    },
    "pump_coordination": {
        "pump_score": calculate_pump_score(),
        "threshold": 70  # Alert if coordinated pump
    }
}
```

**Alert Examples:**

```markdown
🟡 WARNING SENTIMENT ALERT: $TOKEN

Sentiment crashed from 75 to 48!
- Change: -27 points in 10 minutes
- Current: 48/100 (Neutral)

📊 BREAKDOWN:
- Twitter: Increased FUD (35% negative)
- Telegram: Panic messages increasing
- Cause: Unverified rug rumors

🔍 FUD VALIDATION:
- Checked: Liquidity still intact
- Checked: Dev hasn't sold
- Assessment: LIKELY FALSE FUD

💡 RECOMMENDATION:
→ Monitor closely next 30 min
→ If sentiment recovers: HOLD
→ If drops below 40: CONSIDER EXIT

Timestamp: [time]
```

```markdown
🔴 CRITICAL SENTIMENT ALERT: $TOKEN

PANIC DETECTED - Mass exodus!
- Sentiment: 75 → 15 (PANIC)
- Telegram: "RUG!" messages spiking
- Twitter: Major FUD campaign

⚠️ INVESTIGATION:
- Dev wallet just moved tokens (CONFIRMED)
- Multiple whales exiting (CONFIRMED)
- This appears to be REAL

🚨 IMMEDIATE ACTION:
→ EXIT NOW before slippage worsens
→ Use: /exit-now <token> --urgency=high

Timestamp: [time]
```

```markdown
🟢 POSITIVE SENTIMENT: $TOKEN

Sentiment surging! 75 → 92 (MEGA BULLISH)
- Twitter mentions: +340% in 1 hour
- Major influencer: @CryptoBeast (250k followers)
  - Tweet: "This is the next 100x"
  - Engagement: 5.2k likes, 1.8k RTs

⚠️ WARNING:
- This is euphoria territory
- Often precedes tops
- Pump score increasing: 45 → 62

💡 RECOMMENDATION:
→ Take partial profits (30-50%)
→ Raise stop loss to breakeven
→ Watch for whale exits

Timestamp: [time]
```

**Automated Actions:**
- If sentiment <20 (panic): Send CRITICAL alert
- If sentiment >90 (euphoria): Send profit-taking reminder
- If pump score >70: Alert coordinated pump detected

---

## Combined Monitoring Dashboard

Real-time dashboard showing all metrics:

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      LAUNCH MONITORING: $TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Position Opened: 2h 15m ago
Entry Price: $0.0042
Current Price: $0.0187 (+345%)
Unrealized P&L: +$1,450

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SAFETY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rug Score:        25 → 32  🟡 (+7, watching)
Liquidity:        $127k → $145k  🟢 (+14%)
Dev Wallet:       No sells  🟢 (safe)
LP Lock:          Intact  🟢 (186 days left)

Last Update: 12 seconds ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          WHALE ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tracked Whales:   3 (2 Tier 1, 1 Tier 2)

Whale #1 "Sol Sniper":  HOLDING 🟢
- Position: 6.2% (unchanged)
- P&L: +345%

Whale #2 "DeFi Degen":  PARTIAL EXIT 🟡
- Position: 3.8% → 2.1% (sold 45%)
- Exit Price: $0.0165 (+312%)

Whale #3 "Quick Flip":  EXITED 🔴
- Position: 0% (sold 100%)
- Exit Price: $0.0142 (+255%)

Net Whale Flow: -1.7% (slight selling)

Last Update: 18 seconds ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SENTIMENT TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall: 75/100  🟢 (Bullish)

Twitter:          78  🟢 (+3 from baseline)
Telegram:         72  🟢 (stable)
Discord:          68  🟢 (stable)

Bot Activity:     18%  🟢 (normal)
FUD Level:        Low  🟢
Pump Score:       22   🟢 (organic)

Recent Events:
- 5m ago: Influencer mention (@CryptoWhale45k)
- 12m ago: Telegram AMA completed
- 28m ago: No significant events

Last Update: 45 seconds ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ALERT HISTORY (Last 1h)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12m ago] 🟡 Whale #2 partial exit (45%)
[28m ago] 🟢 New holder crossed 1,000
[45m ago] 🟢 Liquidity increased +$18k
[52m ago] 🔴 Whale #3 full exit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Take partial profits (30-40%)
   - Whale #2 took profits at $0.0165
   - You're at +345%, secure some gains

💡 Raise stop loss to $0.0125 (-33% from current)
   - Protects gains if sudden reversal

💡 Keep monitoring whale #1 "Sol Sniper"
   - If exits >50%, consider full exit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Alert Configuration

### Alert Levels

**🔴 CRITICAL (Immediate Action Required):**
- Rug score >70
- Liquidity drop >30% in 1h
- Dev sells >2%
- 2+ Tier 1 whales exit >50%
- Sentiment crashes to <20
- LP unlock detected

**🟡 WARNING (Investigate):**
- Rug score +20 points
- Liquidity drop 15-30%
- Dev sells 1-2%
- 1 Tier 1 whale exits >30%
- Sentiment drops >20 points
- Unusual contract activity

**🟢 INFO (Positive Signals):**
- New Tier 1 whale entry
- Liquidity increase >20%
- Sentiment surge >25 points
- Holder count milestones

### Alert Channels

Configure where alerts are sent:

```json
{
  "alertChannels": {
    "discord": {
      "enabled": true,
      "webhookUrl": "https://discord.com/api/webhooks/...",
      "levels": ["critical", "warning", "info"]
    },
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_BOT_TOKEN",
      "chatId": "YOUR_CHAT_ID",
      "levels": ["critical", "warning"]
    },
    "email": {
      "enabled": false,
      "to": "your@email.com",
      "levels": ["critical"]
    },
    "sms": {
      "enabled": false,
      "phone": "+1234567890",
      "levels": ["critical"]
    }
  }
}
```

## Automated Exit Triggers

Enable automated selling when critical thresholds breached:

```json
{
  "autoExit": {
    "enabled": true,
    "triggers": {
      "rugScore": {
        "threshold": 80,
        "action": "sell",
        "percentage": 100,
        "urgency": "high"
      },
      "liquidityDrop": {
        "threshold": -40,
        "action": "sell",
        "percentage": 100,
        "urgency": "high"
      },
      "whaleExit": {
        "condition": "2_tier1_exit_50percent",
        "action": "sell",
        "percentage": 75,
        "urgency": "medium"
      },
      "sentimentPanic": {
        "threshold": 15,
        "action": "sell",
        "percentage": 50,
        "urgency": "medium"
      }
    },
    "safetyChecks": {
      "maxSlippage": 10,
      "minLiquidity": 10000,
      "confirmBeforeExit": false
    }
  }
}
```

## Usage

### Start Monitoring
```bash
# Start monitoring a position
/launch-monitoring 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# With custom alert thresholds
/launch-monitoring <token> --rug-threshold=75 --alert-channels=discord,telegram

# Enable auto-exit
/launch-monitoring <token> --auto-exit=true
```

### Stop Monitoring
```bash
# Stop monitoring (when you've exited position)
/stop-monitoring <token>

# Stop all monitoring
/stop-monitoring --all
```

### View Status
```bash
# Check monitoring status
/monitoring-status

# View specific token
/monitoring-status <token>
```

## Best Practices

### DO:
- ✅ Start monitoring immediately after entry
- ✅ Configure at least 2 alert channels
- ✅ Set realistic auto-exit thresholds
- ✅ Review alerts promptly
- ✅ Adjust thresholds based on volatility
- ✅ Keep monitoring running 24/7
- ✅ Stop monitoring after full exit

### DON'T:
- ❌ Ignore CRITICAL alerts
- ❌ Disable alerts during sleep
- ❌ Set auto-exit too sensitive (false triggers)
- ❌ Run without any alert channels
- ❌ Forget to stop monitoring after exit
- ❌ Monitor too many tokens (max 5-10)

## Performance Metrics

Track monitoring effectiveness:

```markdown
Monitoring Performance (Last 30 days):
- Positions monitored: 47
- Critical alerts sent: 23
- True positives: 19 (83% accuracy)
- False positives: 4 (17%)
- Auto-exits triggered: 8
- Average exit slippage: 3.2%
- Rugs detected early: 6/7 (86%)
- User capital protected: ~$28,400
```

## Troubleshooting

**Issue:** Too many false alerts
- **Solution:** Increase thresholds, adjust sensitivity

**Issue:** Missed a critical event
- **Solution:** Lower check frequency, add redundant channels

**Issue:** Auto-exit triggered incorrectly
- **Solution:** Disable auto-exit, use manual alerts only

**Issue:** Dashboard not updating
- **Solution:** Check API keys, verify RPC endpoints

## Integration

After alerts are received:

1. **CRITICAL Alert** → Investigate immediately → Use `/exit-now` if confirmed
2. **WARNING Alert** → Review position → Adjust stop loss
3. **INFO Alert** → Note in position log → Consider adding to position

## Related Workflows
- `/full-icm-research` - Pre-entry analysis
- `/rug-protection` - Enhanced safety monitoring
- `/smart-entry-exit` - Optimal exit timing

---

**Built for protecting degen gains** 🛡️

*Sleep peacefully knowing you're being watched 24/7.*
