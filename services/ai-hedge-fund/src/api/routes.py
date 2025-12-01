"""
FastAPI Routes for AI Hedge Fund
"""

import os
import re
from typing import Literal, Any
from datetime import datetime
from pydantic import BaseModel, Field, constr, field_validator

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Security

# ============================================================================
# VALIDATION CONSTANTS
# ============================================================================

# Valid chains for trading
VALID_CHAINS = {"solana", "ethereum", "base", "arbitrum", "polygon", "bsc"}

# Regex for token validation (alphanumeric + common address chars)
TOKEN_PATTERN = r"^[a-zA-Z0-9_\-]{1,100}$"
ADDRESS_PATTERN = r"^[a-zA-Z0-9]{32,64}$"

# Max lengths for user input
MAX_TOKEN_LENGTH = 100
MAX_CONTEXT_VALUE_LENGTH = 1000
from fastapi.security import APIKeyHeader
from fastapi.responses import StreamingResponse

from ..workflow import create_trading_graph, analyze_token
from ..data import get_market_data
from ..data.repository import (
    get_position_repo,
    get_trade_repo,
    get_signal_repo,
    get_stats_repo,
)
from ..config import get_settings

router = APIRouter(prefix="/api/v1", tags=["trading"])

# ============================================================================
# API KEY AUTHENTICATION
# ============================================================================

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Verify API key for protected endpoints."""
    expected_key = os.getenv("GICM_API_KEY")
    if not expected_key:
        # If no key configured, allow access (dev mode)
        return "dev-mode"
    if api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key"
        )
    return api_key

# ============================================================================
# DATABASE REPOSITORIES (Supabase with in-memory fallback)
# ============================================================================

# Repositories are lazy-initialized singletons
# If Supabase is not configured, they fall back to in-memory storage
_started_at = datetime.now().isoformat()


# Request/Response Models

class AnalyzeRequest(BaseModel):
    """Request to analyze a token"""
    token: constr(min_length=1, max_length=MAX_TOKEN_LENGTH, pattern=TOKEN_PATTERN) = Field(
        ..., description="Token symbol or address"
    )
    chain: Literal["solana", "ethereum", "base", "arbitrum", "polygon", "bsc"] = Field(
        default="solana", description="Blockchain"
    )
    mode: Literal["full", "fast", "degen"] = Field(
        default="full",
        description="Analysis mode: full (all agents), fast (quick), degen (memecoin focus)"
    )
    provider: Literal["anthropic", "openai"] = Field(
        default="anthropic",
        description="LLM provider"
    )
    context: dict[str, Any] | None = Field(
        default=None,
        description="Additional context for agents"
    )

    @field_validator("context")
    @classmethod
    def validate_context(cls, v: dict | None) -> dict | None:
        """Validate context dict to prevent oversized/malicious input"""
        if v is None:
            return v
        if len(v) > 20:  # Max 20 keys
            raise ValueError("Context has too many keys (max 20)")
        for key, value in v.items():
            if len(str(key)) > 50:
                raise ValueError(f"Context key too long: {key[:20]}...")
            if len(str(value)) > MAX_CONTEXT_VALUE_LENGTH:
                raise ValueError(f"Context value for '{key}' too long (max {MAX_CONTEXT_VALUE_LENGTH})")
        return v


class QuickSignalRequest(BaseModel):
    """Request for quick signal"""
    token: constr(min_length=1, max_length=MAX_TOKEN_LENGTH, pattern=TOKEN_PATTERN)
    chain: Literal["solana", "ethereum", "base", "arbitrum", "polygon", "bsc"] = "solana"


class AgentSignalResponse(BaseModel):
    """Agent signal in response"""
    agent: str
    action: str
    confidence: float
    reasoning: str
    key_metrics: list[str] = []
    risks: list[str] = []


class AnalyzeResponse(BaseModel):
    """Full analysis response"""
    token: str
    chain: str
    market_data: dict[str, Any]
    agent_signals: list[AgentSignalResponse]
    risk_assessment: AgentSignalResponse | None
    final_decision: dict[str, Any]
    summary: str


class QuickSignalResponse(BaseModel):
    """Quick signal response"""
    token: str
    price: float | None
    change_24h: float | None
    sentiment: str
    confidence: float
    signals: list[AgentSignalResponse]
    quick_take: str


class MarketDataResponse(BaseModel):
    """Market data response"""
    token: str
    chain: str
    data: dict[str, Any]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    agents_available: int


# Routes

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        agents_available=12,  # 5 personas + 5 crypto + 2 management
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest, _api_key: str = Depends(verify_api_key)):
    """
    Run full multi-agent analysis on a token.

    This runs all configured agents in parallel and synthesizes
    their signals into a final trading decision.

    Requires X-API-Key header.
    """
    try:
        graph = create_trading_graph(
            provider=request.provider,
            mode=request.mode,
            show_reasoning=False,
        )

        result = await graph.analyze(
            token=request.token,
            chain=request.chain,
            context=request.context,
        )

        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        return AnalyzeResponse(
            token=result["token"],
            chain=result["chain"],
            market_data=result["market_data"],
            agent_signals=[
                AgentSignalResponse(**signal)
                for signal in result["agent_signals"]
            ],
            risk_assessment=AgentSignalResponse(**result["risk_assessment"])
            if result.get("risk_assessment") else None,
            final_decision=result["final_decision"],
            summary=result["summary"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-signal", response_model=QuickSignalResponse)
async def quick_signal(request: QuickSignalRequest):
    """
    Get a quick trading signal with minimal analysis.

    Uses 3 key agents for fast screening.
    Good for quick checks before deeper analysis.
    """
    try:
        graph = create_trading_graph(mode="fast", show_reasoning=False)
        result = await graph.quick_signal(
            token=request.token,
            chain=request.chain,
        )

        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        return QuickSignalResponse(
            token=result["token"],
            price=result.get("price"),
            change_24h=result.get("change_24h"),
            sentiment=result["sentiment"],
            confidence=result["confidence"],
            signals=[
                AgentSignalResponse(**signal)
                for signal in result["signals"]
            ],
            quick_take=result["quick_take"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-data/{token}", response_model=MarketDataResponse)
async def get_token_market_data(token: str, chain: str = "solana"):
    """
    Get raw market data for a token.

    Fetches from CoinGecko, DexScreener, and Jupiter (for Solana).
    """
    try:
        data = await get_market_data(token, chain)

        if not data.get("price"):
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for {token}"
            )

        return MarketDataResponse(
            token=token,
            chain=chain,
            data=data,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents")
async def list_agents():
    """List all available agents and their configurations"""
    from ..agents import (
        BUFFETT_CONFIG, BURRY_CONFIG, MUNGER_CONFIG,
        WOOD_CONFIG, ACKMAN_CONFIG, DEGEN_CONFIG,
        SOLANA_CONFIG, WHALE_CONFIG, PUMP_TRADER_CONFIG,
        ONCHAIN_CONFIG, RISK_MANAGER_CONFIG, PORTFOLIO_MANAGER_CONFIG,
    )

    configs = [
        BUFFETT_CONFIG, BURRY_CONFIG, MUNGER_CONFIG,
        WOOD_CONFIG, ACKMAN_CONFIG, DEGEN_CONFIG,
        SOLANA_CONFIG, WHALE_CONFIG, PUMP_TRADER_CONFIG,
        ONCHAIN_CONFIG, RISK_MANAGER_CONFIG, PORTFOLIO_MANAGER_CONFIG,
    ]

    return {
        "agents": [
            {
                "name": c.name,
                "description": c.description,
                "risk_tolerance": c.risk_tolerance,
                "time_horizon": c.time_horizon,
                "focus_areas": c.focus_areas,
            }
            for c in configs
        ]
    }


@router.post("/analyze/batch")
async def analyze_batch(tokens: list[str], chain: str = "solana"):
    """
    Analyze multiple tokens in parallel.

    Uses quick_signal for efficiency on multiple tokens.
    """
    try:
        graph = create_trading_graph(mode="fast", show_reasoning=False)

        results = []
        for token in tokens[:10]:  # Limit to 10 tokens
            try:
                result = await graph.quick_signal(token, chain)
                results.append(result)
            except Exception as e:
                results.append({"token": token, "error": str(e)})

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BRAIN INTEGRATION ENDPOINTS
# ============================================================================

class StatusResponse(BaseModel):
    """Trading system status for brain integration"""
    mode: str
    positions: int
    pnlToday: float
    totalPnl: float
    tradesToday: int
    startedAt: str
    limits: dict[str, Any]


class PositionResponse(BaseModel):
    """Position data"""
    token: str
    chain: str
    size: float
    entryPrice: float
    currentPrice: float | None
    pnl: float
    pnlPercent: float
    openedAt: str


class TreasuryResponse(BaseModel):
    """Treasury status"""
    totalUsd: float
    runway: str
    allocations: dict[str, float]
    expenses: list[dict[str, Any]]


class SetModeRequest(BaseModel):
    """Request to change trading mode"""
    mode: Literal["paper", "micro", "live"]
    approval_code: str | None = None


@router.get("/status", response_model=StatusResponse)
async def get_status():
    """
    Get current trading system status.

    Used by gICM Brain for monitoring and decision making.
    """
    settings = get_settings()
    position_repo = get_position_repo()
    trade_repo = get_trade_repo()
    stats_repo = get_stats_repo()

    positions = position_repo.get_open()
    trades_today = trade_repo.get_today()
    daily_stats = stats_repo.get_or_create_today()
    total_pnl = stats_repo.get_total_pnl()

    return StatusResponse(
        mode=settings.trading_mode,
        positions=len(positions),
        pnlToday=float(daily_stats.get("pnl", 0)),
        totalPnl=total_pnl,
        tradesToday=len(trades_today),
        startedAt=_started_at,
        limits={
            "maxPositionSize": settings.max_position_size_usd,
            "dailyLossLimit": settings.daily_loss_limit_usd,
            "requireApproval": settings.require_approval,
        }
    )


@router.get("/positions", response_model=list[PositionResponse])
async def get_positions():
    """
    Get current open positions.

    Returns all active trading positions with P&L.
    """
    position_repo = get_position_repo()
    positions = position_repo.get_open()

    return [
        PositionResponse(
            token=pos.get("token", ""),
            chain=pos.get("chain", "solana"),
            size=float(pos.get("size", 0)),
            entryPrice=float(pos.get("entry_price", 0)),
            currentPrice=float(pos.get("current_price", 0)) if pos.get("current_price") else None,
            pnl=float(pos.get("pnl", 0)),
            pnlPercent=float(pos.get("pnl_percent", 0)),
            openedAt=pos.get("opened_at", datetime.now().isoformat()),
        )
        for pos in positions
    ]


@router.post("/positions")
async def add_position(
    token: str,
    chain: str = "solana",
    size: float = 100.0,
    entry_price: float = 0.0,
    _api_key: str = Depends(verify_api_key),
):
    """
    Add a new position (paper trading).

    In paper mode, this simulates opening a position.
    Requires X-API-Key header.
    """
    settings = get_settings()

    if settings.trading_mode == "live" and not settings.enable_live_trading:
        raise HTTPException(
            status_code=403,
            detail="Live trading is disabled"
        )

    if size > settings.max_position_size_usd:
        raise HTTPException(
            status_code=400,
            detail=f"Position size ${size} exceeds limit ${settings.max_position_size_usd}"
        )

    position_repo = get_position_repo()
    trade_repo = get_trade_repo()
    stats_repo = get_stats_repo()

    # Create position in database
    position = position_repo.create({
        "token": token,
        "chain": chain,
        "size": size,
        "entry_price": entry_price,
        "current_price": entry_price,
    })

    # Record trade
    trade_repo.create({
        "position_id": position.get("id"),
        "type": "open",
        "token": token,
        "chain": chain,
        "size": size,
        "price": entry_price,
    })

    # Update daily stats
    stats_repo.increment_trades()

    return {"success": True, "position": position}


@router.delete("/positions/{token}")
async def close_position(token: str, chain: str = "solana", _api_key: str = Depends(verify_api_key)):
    """
    Close a position (paper trading).
    Requires X-API-Key header.
    """
    position_repo = get_position_repo()
    trade_repo = get_trade_repo()
    stats_repo = get_stats_repo()

    # Get the position first to capture PnL
    positions = position_repo.get_open()
    target_pos = None
    for pos in positions:
        if pos.get("token", "").lower() == token.lower() and pos.get("chain") == chain:
            target_pos = pos
            break

    if not target_pos:
        raise HTTPException(status_code=404, detail=f"Position not found: {token}")

    pnl = float(target_pos.get("pnl", 0))

    # Close the position
    closed = position_repo.close(token, chain, pnl)

    # Record trade
    trade_repo.create({
        "position_id": target_pos.get("id"),
        "type": "close",
        "token": token,
        "chain": chain,
        "size": float(target_pos.get("size", 0)),
        "price": float(target_pos.get("current_price", 0)),
        "pnl": pnl,
    })

    # Update daily stats
    stats_repo.increment_pnl(pnl)
    stats_repo.increment_trades()

    return {"success": True, "closed": closed}


@router.get("/treasury", response_model=TreasuryResponse)
async def get_treasury():
    """
    Get treasury status.

    Returns current treasury balances, allocations, and runway.
    Note: In paper mode, this returns mock data.
    """
    # Mock treasury data (would connect to actual wallet in production)
    return TreasuryResponse(
        totalUsd=0.0,
        runway="N/A - Connect wallet for real data",
        allocations={
            "trading": 0.40,
            "operations": 0.30,
            "growth": 0.20,
            "reserve": 0.10,
        },
        expenses=[
            {"name": "Claude API", "amount": 200, "frequency": "monthly"},
            {"name": "Helius RPC", "amount": 50, "frequency": "monthly"},
            {"name": "Vercel", "amount": 20, "frequency": "monthly"},
        ]
    )


@router.get("/mode")
async def get_mode():
    """Get current trading mode"""
    settings = get_settings()
    return {
        "mode": settings.trading_mode,
        "requireApproval": settings.require_approval,
        "liveTradingEnabled": settings.enable_live_trading,
    }


@router.post("/mode")
async def set_mode(request: SetModeRequest, _api_key: str = Depends(verify_api_key)):
    """
    Change trading mode.

    Note: This only changes the in-memory setting.
    For persistent changes, update the TRADING_MODE environment variable.
    Requires X-API-Key header.
    """
    settings = get_settings()

    # Require approval code for micro/live
    if request.mode in ["micro", "live"] and not request.approval_code:
        raise HTTPException(
            status_code=400,
            detail="Approval code required for micro/live mode"
        )

    # In a real implementation, this would validate the approval code
    # and persist the change

    return {
        "success": True,
        "previousMode": settings.trading_mode,
        "newMode": request.mode,
        "message": f"Mode change to '{request.mode}' requested. Update TRADING_MODE env var to persist."
    }


@router.get("/trades/today")
async def get_trades_today():
    """Get all trades executed today"""
    trade_repo = get_trade_repo()
    stats_repo = get_stats_repo()

    trades = trade_repo.get_today()
    daily_stats = stats_repo.get_or_create_today()

    return {
        "count": len(trades),
        "trades": trades,
        "pnl": float(daily_stats.get("pnl", 0)),
    }


# ============================================================================
# HUNTER SIGNAL INTEGRATION
# ============================================================================

class HunterSignal(BaseModel):
    """Signal from hunter agent"""
    id: constr(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_\-]+$")
    type: constr(min_length=1, max_length=50)
    source: constr(min_length=1, max_length=100)
    token: constr(min_length=1, max_length=MAX_TOKEN_LENGTH, pattern=TOKEN_PATTERN) | None = None
    chain: Literal["solana", "ethereum", "base", "arbitrum", "polygon", "bsc"] | None = None
    action: Literal["buy", "sell", "hold", "watch"]
    confidence: float = Field(..., ge=0, le=100)  # 0-100
    urgency: Literal["immediate", "today", "week", "monitor"]
    title: constr(min_length=1, max_length=200)
    description: constr(min_length=1, max_length=2000)
    reasoning: constr(min_length=1, max_length=2000)
    risk: Literal["low", "medium", "high", "extreme"]
    riskFactors: list[constr(max_length=200)] = Field(default_factory=list, max_length=20)
    tags: list[constr(max_length=50)] = Field(default_factory=list, max_length=20)
    metrics: dict[str, Any] = Field(default_factory=dict)

    @field_validator("metrics")
    @classmethod
    def validate_metrics(cls, v: dict) -> dict:
        """Validate metrics dict size"""
        if len(v) > 50:
            raise ValueError("Metrics has too many keys (max 50)")
        return v


class SignalBatchRequest(BaseModel):
    """Batch of signals from hunter"""
    signals: list[HunterSignal] = Field(..., max_length=100)  # Max 100 signals per batch


class SignalProcessResult(BaseModel):
    """Result of signal processing"""
    signalId: str
    status: str  # queued, analyzing, executed, rejected
    analysis: dict[str, Any] | None = None
    reason: str | None = None


class SignalBatchResponse(BaseModel):
    """Response for signal batch"""
    received: int
    processed: int
    queued: int
    rejected: int
    results: list[SignalProcessResult]


@router.post("/signals", response_model=SignalBatchResponse)
async def receive_signals(
    request: SignalBatchRequest,
    background_tasks: BackgroundTasks,
    _api_key: str = Depends(verify_api_key),
):
    """
    Receive trading signals from the hunter agent.

    High-confidence signals are queued for analysis.
    Signals can trigger automatic analysis via the trading graph.
    Requires X-API-Key header.
    """
    signal_repo = get_signal_repo()
    stats_repo = get_stats_repo()

    results: list[SignalProcessResult] = []
    queued = 0
    rejected = 0

    for signal in request.signals:
        result = SignalProcessResult(
            signalId=signal.id,
            status="rejected",
            reason=None
        )

        # Filter by confidence and action
        if signal.confidence < 50:
            result.reason = "Confidence too low"
            rejected += 1
        elif signal.action not in ["buy", "watch"]:
            result.reason = "Not an actionable signal"
            rejected += 1
        elif signal.risk == "extreme":
            result.reason = "Risk too high"
            rejected += 1
        else:
            # Store signal in database
            signal_data = signal.model_dump()
            signal_data["status"] = "queued"
            signal_repo.create(signal_data)
            result.status = "queued"
            queued += 1

            # For high-confidence signals with tokens, trigger background analysis
            if signal.confidence >= 70 and signal.token:
                background_tasks.add_task(
                    analyze_signal_token,
                    signal.token,
                    signal.chain or "solana",
                    signal.id
                )
                result.status = "analyzing"

        results.append(result)

    # Update daily stats
    stats_repo.increment_signals(
        received=len(request.signals),
        queued=queued,
        rejected=rejected
    )

    return SignalBatchResponse(
        received=len(request.signals),
        processed=len(results),
        queued=queued,
        rejected=rejected,
        results=results
    )


async def analyze_signal_token(token: str, chain: str, signal_id: str):
    """Background task to analyze a token from a signal"""
    signal_repo = get_signal_repo()

    try:
        graph = create_trading_graph(mode="fast", show_reasoning=False)
        result = await graph.quick_signal(token, chain)

        # Update signal in database with analysis result
        signal_repo.update_status(signal_id, "analyzed", analysis=result)

        print(f"[SIGNALS] Analyzed {token}: {result.get('sentiment', 'unknown')}")
    except Exception as e:
        # Mark as failed
        signal_repo.update_status(signal_id, "failed", analysis={"error": str(e)})
        print(f"[SIGNALS] Analysis failed for {token}: {e}")


@router.get("/signals/queue")
async def get_signal_queue():
    """Get current signal queue"""
    signal_repo = get_signal_repo()
    signals = signal_repo.get_queue(limit=50)

    return {
        "count": len(signals),
        "signals": [{"signal": s, "status": s.get("status", "queued")} for s in signals],
    }


@router.get("/signals/{signal_id}")
async def get_signal_status(signal_id: str):
    """Get status of a specific signal"""
    signal_repo = get_signal_repo()
    signal = signal_repo.get_by_id(signal_id)

    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal not found: {signal_id}")

    return {
        "signal": signal,
        "status": signal.get("status", "unknown"),
    }


@router.delete("/signals/queue")
async def clear_signal_queue(_api_key: str = Depends(verify_api_key)):
    """Clear the signal queue. Requires X-API-Key header."""
    signal_repo = get_signal_repo()
    count = signal_repo.clear_queue()
    return {"cleared": count}
