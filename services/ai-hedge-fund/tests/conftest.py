"""
Pytest fixtures and configuration for AI Hedge Fund tests
"""

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_llm():
    """Create a mock LLM for testing agents"""
    mock = MagicMock()
    mock.ainvoke = AsyncMock(return_value=MagicMock(
        content='{"action": "neutral", "confidence": 50, "reasoning": "Mock response"}'
    ))
    return mock


@pytest.fixture
def sample_market_data():
    """Sample market data for testing"""
    return {
        "price": 150.50,
        "market_cap": 50000000000,
        "volume_24h": 1500000000,
        "change_24h": 5.2,
        "change_7d": -2.1,
        "change_30d": 15.3,
        "volatility_30d": 45.0,
        "ath_change": -30.0,
        "dex_liquidity": 10000000,
        "spread": 0.1,
        "slippage_10k": 0.5,
    }


@pytest.fixture
def sample_portfolio_context():
    """Sample portfolio context for testing"""
    return {
        "portfolio": {
            "total_value": 10000,
            "current_allocation": {"SOL": 0.3, "USDC": 0.7},
            "max_position_pct": 10,
            "available_capital": 5000,
        },
        "aggregate_sentiment": "neutral",
        "avg_confidence": 55,
    }
