"""
Database Repository Layer

Provides clean interfaces for database operations using Supabase.
Falls back to in-memory storage if Supabase is not configured.
"""

from datetime import datetime, date
from typing import Any

from .supabase_client import get_client, is_supabase_configured


class PositionRepository:
    """Repository for trading positions."""

    def __init__(self):
        self.table = "positions"
        self._fallback: list[dict] = []

    @property
    def _use_supabase(self) -> bool:
        return is_supabase_configured()

    def create(self, data: dict) -> dict:
        """Create a new position."""
        if not self._use_supabase:
            # Fallback to in-memory
            position = {
                "id": f"local-{len(self._fallback)}",
                **data,
                "status": "open",
                "pnl": 0,
                "pnl_percent": 0,
                "opened_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
            }
            self._fallback.append(position)
            return position

        client = get_client()
        result = client.table(self.table).insert(data).execute()
        return result.data[0] if result.data else {}

    def get_open(self) -> list[dict]:
        """Get all open positions."""
        if not self._use_supabase:
            return [p for p in self._fallback if p.get("status") == "open"]

        client = get_client()
        result = client.table(self.table).select("*").eq("status", "open").execute()
        return result.data or []

    def get_all(self) -> list[dict]:
        """Get all positions (open and closed)."""
        if not self._use_supabase:
            return self._fallback.copy()

        client = get_client()
        result = client.table(self.table).select("*").order("opened_at", desc=True).execute()
        return result.data or []

    def close(self, token: str, chain: str, pnl: float) -> dict | None:
        """Close a position by token and chain."""
        if not self._use_supabase:
            for pos in self._fallback:
                if pos["token"].lower() == token.lower() and pos["chain"] == chain and pos["status"] == "open":
                    pos["status"] = "closed"
                    pos["pnl"] = pnl
                    pos["closed_at"] = datetime.now().isoformat()
                    return pos
            return None

        client = get_client()
        result = client.table(self.table).update({
            "status": "closed",
            "pnl": pnl,
            "closed_at": datetime.now().isoformat()
        }).eq("token", token).eq("chain", chain).eq("status", "open").execute()
        return result.data[0] if result.data else None

    def update_price(self, token: str, chain: str, current_price: float, pnl: float, pnl_percent: float) -> dict | None:
        """Update current price and PnL for a position."""
        if not self._use_supabase:
            for pos in self._fallback:
                if pos["token"].lower() == token.lower() and pos["chain"] == chain and pos["status"] == "open":
                    pos["current_price"] = current_price
                    pos["pnl"] = pnl
                    pos["pnl_percent"] = pnl_percent
                    return pos
            return None

        client = get_client()
        result = client.table(self.table).update({
            "current_price": current_price,
            "pnl": pnl,
            "pnl_percent": pnl_percent,
        }).eq("token", token).eq("chain", chain).eq("status", "open").execute()
        return result.data[0] if result.data else None


class TradeRepository:
    """Repository for trade records."""

    def __init__(self):
        self.table = "trades"
        self._fallback: list[dict] = []

    @property
    def _use_supabase(self) -> bool:
        return is_supabase_configured()

    def create(self, data: dict) -> dict:
        """Record a trade."""
        if not self._use_supabase:
            trade = {
                "id": f"local-{len(self._fallback)}",
                **data,
                "executed_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
            }
            self._fallback.append(trade)
            return trade

        client = get_client()
        result = client.table(self.table).insert(data).execute()
        return result.data[0] if result.data else {}

    def get_today(self) -> list[dict]:
        """Get all trades from today."""
        today = date.today().isoformat()

        if not self._use_supabase:
            return [t for t in self._fallback if t.get("executed_at", "").startswith(today)]

        client = get_client()
        result = client.table(self.table).select("*").gte("executed_at", f"{today}T00:00:00").order("executed_at", desc=True).execute()
        return result.data or []

    def get_recent(self, limit: int = 50) -> list[dict]:
        """Get recent trades."""
        if not self._use_supabase:
            return self._fallback[-limit:][::-1]

        client = get_client()
        result = client.table(self.table).select("*").order("executed_at", desc=True).limit(limit).execute()
        return result.data or []


class SignalRepository:
    """Repository for hunter signals."""

    def __init__(self):
        self.table = "signals"
        self._fallback: list[dict] = []

    @property
    def _use_supabase(self) -> bool:
        return is_supabase_configured()

    def create(self, signal: dict) -> dict:
        """Store a signal."""
        if not self._use_supabase:
            signal_data = {
                **signal,
                "status": signal.get("status", "queued"),
                "received_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
            }
            self._fallback.append(signal_data)
            return signal_data

        client = get_client()
        result = client.table(self.table).insert(signal).execute()
        return result.data[0] if result.data else {}

    def get_queue(self, limit: int = 50) -> list[dict]:
        """Get queued signals."""
        if not self._use_supabase:
            queued = [s for s in self._fallback if s.get("status") == "queued"]
            return queued[-limit:][::-1]

        client = get_client()
        result = client.table(self.table).select("*").eq("status", "queued").order("received_at", desc=True).limit(limit).execute()
        return result.data or []

    def get_by_id(self, signal_id: str) -> dict | None:
        """Get a signal by ID."""
        if not self._use_supabase:
            for s in self._fallback:
                if s.get("id") == signal_id:
                    return s
            return None

        client = get_client()
        result = client.table(self.table).select("*").eq("id", signal_id).execute()
        return result.data[0] if result.data else None

    def update_status(self, signal_id: str, status: str, analysis: dict | None = None) -> dict | None:
        """Update signal status and optionally add analysis results."""
        if not self._use_supabase:
            for s in self._fallback:
                if s.get("id") == signal_id:
                    s["status"] = status
                    if analysis:
                        s["analysis"] = analysis
                        s["analyzed_at"] = datetime.now().isoformat()
                    return s
            return None

        client = get_client()
        data: dict[str, Any] = {"status": status}
        if analysis:
            data["analysis"] = analysis
            data["analyzed_at"] = datetime.now().isoformat()
        result = client.table(self.table).update(data).eq("id", signal_id).execute()
        return result.data[0] if result.data else None

    def clear_queue(self) -> int:
        """Clear all queued signals. Returns count of cleared signals."""
        if not self._use_supabase:
            count = len([s for s in self._fallback if s.get("status") == "queued"])
            self._fallback = [s for s in self._fallback if s.get("status") != "queued"]
            return count

        client = get_client()
        # First count
        count_result = client.table(self.table).select("id", count="exact").eq("status", "queued").execute()
        count = count_result.count or 0
        # Then delete
        client.table(self.table).delete().eq("status", "queued").execute()
        return count


class DiscoveryRepository:
    """Repository for hunter discoveries (for deduplication)."""

    def __init__(self):
        self.table = "discoveries"
        self._fallback: list[dict] = []

    @property
    def _use_supabase(self) -> bool:
        return is_supabase_configured()

    def create(self, discovery: dict) -> dict:
        """Store a discovery."""
        if not self._use_supabase:
            discovery_data = {
                "id": f"local-{len(self._fallback)}",
                **discovery,
                "discovered_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
            }
            self._fallback.append(discovery_data)
            return discovery_data

        client = get_client()
        result = client.table(self.table).upsert(discovery, on_conflict="fingerprint").execute()
        return result.data[0] if result.data else {}

    def exists_by_fingerprint(self, fingerprint: str) -> bool:
        """Check if a discovery with this fingerprint already exists."""
        if not self._use_supabase:
            return any(d.get("fingerprint") == fingerprint for d in self._fallback)

        client = get_client()
        result = client.table(self.table).select("id").eq("fingerprint", fingerprint).limit(1).execute()
        return bool(result.data)

    def get_recent(self, limit: int = 100) -> list[dict]:
        """Get recent discoveries."""
        if not self._use_supabase:
            return self._fallback[-limit:][::-1]

        client = get_client()
        result = client.table(self.table).select("*").order("discovered_at", desc=True).limit(limit).execute()
        return result.data or []


class DailyStatsRepository:
    """Repository for daily statistics."""

    def __init__(self):
        self.table = "daily_stats"
        self._fallback: dict[str, dict] = {}

    @property
    def _use_supabase(self) -> bool:
        return is_supabase_configured()

    def get_or_create_today(self) -> dict:
        """Get or create today's stats record."""
        today = date.today().isoformat()

        if not self._use_supabase:
            if today not in self._fallback:
                self._fallback[today] = {
                    "id": f"local-{today}",
                    "date": today,
                    "pnl": 0,
                    "trades_count": 0,
                    "signals_received": 0,
                    "signals_queued": 0,
                    "signals_rejected": 0,
                    "created_at": datetime.now().isoformat(),
                }
            return self._fallback[today]

        client = get_client()
        # Try to get today's stats
        result = client.table(self.table).select("*").eq("date", today).execute()
        if result.data:
            return result.data[0]
        # Create if not exists
        new_stats = {"date": today}
        insert_result = client.table(self.table).insert(new_stats).execute()
        return insert_result.data[0] if insert_result.data else new_stats

    def increment_pnl(self, amount: float) -> dict:
        """Add to today's PnL."""
        stats = self.get_or_create_today()
        new_pnl = float(stats.get("pnl", 0)) + amount

        if not self._use_supabase:
            stats["pnl"] = new_pnl
            return stats

        client = get_client()
        result = client.table(self.table).update({"pnl": new_pnl}).eq("id", stats["id"]).execute()
        return result.data[0] if result.data else stats

    def increment_trades(self) -> dict:
        """Increment today's trade count."""
        stats = self.get_or_create_today()
        new_count = int(stats.get("trades_count", 0)) + 1

        if not self._use_supabase:
            stats["trades_count"] = new_count
            return stats

        client = get_client()
        result = client.table(self.table).update({"trades_count": new_count}).eq("id", stats["id"]).execute()
        return result.data[0] if result.data else stats

    def increment_signals(self, received: int = 0, queued: int = 0, rejected: int = 0) -> dict:
        """Increment signal counters."""
        stats = self.get_or_create_today()

        if not self._use_supabase:
            stats["signals_received"] = int(stats.get("signals_received", 0)) + received
            stats["signals_queued"] = int(stats.get("signals_queued", 0)) + queued
            stats["signals_rejected"] = int(stats.get("signals_rejected", 0)) + rejected
            return stats

        client = get_client()
        updates = {}
        if received:
            updates["signals_received"] = int(stats.get("signals_received", 0)) + received
        if queued:
            updates["signals_queued"] = int(stats.get("signals_queued", 0)) + queued
        if rejected:
            updates["signals_rejected"] = int(stats.get("signals_rejected", 0)) + rejected

        if updates:
            result = client.table(self.table).update(updates).eq("id", stats["id"]).execute()
            return result.data[0] if result.data else stats
        return stats

    def get_total_pnl(self) -> float:
        """Get total PnL across all days."""
        if not self._use_supabase:
            return sum(float(s.get("pnl", 0)) for s in self._fallback.values())

        client = get_client()
        result = client.table(self.table).select("pnl").execute()
        return sum(float(row.get("pnl", 0)) for row in (result.data or []))


# Singleton instances
_position_repo: PositionRepository | None = None
_trade_repo: TradeRepository | None = None
_signal_repo: SignalRepository | None = None
_discovery_repo: DiscoveryRepository | None = None
_stats_repo: DailyStatsRepository | None = None


def get_position_repo() -> PositionRepository:
    """Get position repository singleton."""
    global _position_repo
    if _position_repo is None:
        _position_repo = PositionRepository()
    return _position_repo


def get_trade_repo() -> TradeRepository:
    """Get trade repository singleton."""
    global _trade_repo
    if _trade_repo is None:
        _trade_repo = TradeRepository()
    return _trade_repo


def get_signal_repo() -> SignalRepository:
    """Get signal repository singleton."""
    global _signal_repo
    if _signal_repo is None:
        _signal_repo = SignalRepository()
    return _signal_repo


def get_discovery_repo() -> DiscoveryRepository:
    """Get discovery repository singleton."""
    global _discovery_repo
    if _discovery_repo is None:
        _discovery_repo = DiscoveryRepository()
    return _discovery_repo


def get_stats_repo() -> DailyStatsRepository:
    """Get daily stats repository singleton."""
    global _stats_repo
    if _stats_repo is None:
        _stats_repo = DailyStatsRepository()
    return _stats_repo


__all__ = [
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
