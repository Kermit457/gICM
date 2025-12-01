"""
Data module - Market data fetching from free tier APIs + premium sources
"""

from .market_data import (
    MarketDataFetcher,
    get_market_data,
    get_multiple_market_data,
)
from .birdeye import BirdeyeClient
from .helius import HeliusClient
from .coinmarketcap import CoinMarketCapClient
from .rugcheck import RugCheckClient
from .pumpfun import PumpFunClient
from .vybe import VybeClient
from .supabase_client import (
    get_client as get_supabase_client,
    is_supabase_configured,
    SupabaseClientError,
)
from .repository import (
    PositionRepository,
    TradeRepository,
    SignalRepository,
    DiscoveryRepository,
    DailyStatsRepository,
    get_position_repo,
    get_trade_repo,
    get_signal_repo,
    get_discovery_repo,
    get_stats_repo,
)

__all__ = [
    # Market data
    "MarketDataFetcher",
    "get_market_data",
    "get_multiple_market_data",
    "BirdeyeClient",
    "HeliusClient",
    "CoinMarketCapClient",
    # Solana-Specific (FREE)
    "RugCheckClient",
    "PumpFunClient",
    "VybeClient",
    # Supabase
    "get_supabase_client",
    "is_supabase_configured",
    "SupabaseClientError",
    # Repositories
    "PositionRepository",
    "TradeRepository",
    "SignalRepository",
    "DiscoveryRepository",
    "DailyStatsRepository",
    "get_position_repo",
    "get_trade_repo",
    "get_signal_repo",
    "get_discovery_repo",
    "get_stats_repo",
]
