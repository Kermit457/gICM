"""
Vybe Network API Integration - Enterprise Solana Data Platform
FREE TIER: 4 req/min, 12,000 credits/month
Auth: API Key required (sign up with wallet at vybenetwork.xyz)
"""

import httpx
from typing import Any
import os


class VybeClient:
    """
    Vybe Network API client for Solana data
    FREE TIER - API key required (wallet sign-up)
    """

    BASE_URL = "https://api.vybenetwork.xyz"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("VYBE_API_KEY")
        if not self.api_key:
            print("[VybeClient] Warning: No API key provided. Set VYBE_API_KEY env var.")

    def _get_headers(self) -> dict[str, str]:
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    async def get_wallet_pnl(self, address: str) -> dict[str, Any] | None:
        """Get wallet PnL and trading stats"""
        if not self.api_key:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/account/wallet-pnl",
                    params={"address": address},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_token_balances(self, address: str) -> list[dict[str, Any]]:
        """Get token balances for a wallet"""
        if not self.api_key:
            return []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/account/token-balances",
                    params={"address": address},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                return data.get("balances", data) if isinstance(data, dict) else data
            except Exception:
                return []

    async def get_token_holders(self, mint: str) -> list[dict[str, Any]]:
        """Get top holders for a token"""
        if not self.api_key:
            return []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/tokens/top-holders",
                    params={"mint": mint},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                return data.get("holders", data) if isinstance(data, dict) else data
            except Exception:
                return []

    async def get_token_details(self, mint: str) -> dict[str, Any] | None:
        """Get token details"""
        if not self.api_key:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/tokens/token-details",
                    params={"mint": mint},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_token_trades(
        self, mint: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        """Get recent trades for a token"""
        if not self.api_key:
            return []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/tokens/token-trades",
                    params={"mint": mint, "limit": limit},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                return data.get("trades", data) if isinstance(data, dict) else data
            except Exception:
                return []

    async def get_program_tvl(self, program_id: str) -> dict[str, Any] | None:
        """Get TVL for a Solana program"""
        if not self.api_key:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/programs/program-tvl",
                    params={"program_id": program_id},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_pyth_price(self, symbol: str) -> dict[str, Any] | None:
        """Get Pyth Oracle price"""
        if not self.api_key:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/prices/pyth-price",
                    params={"symbol": symbol},
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_markets(self) -> list[dict[str, Any]]:
        """Get market data"""
        if not self.api_key:
            return []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/prices/markets",
                    headers=self._get_headers(),
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                return data.get("markets", data) if isinstance(data, dict) else data
            except Exception:
                return []

    async def is_wallet_profitable(self, address: str) -> dict[str, Any]:
        """Check if wallet is profitable"""
        pnl = await self.get_wallet_pnl(address)
        if not pnl:
            return {
                "profitable": False,
                "total_pnl": 0,
                "win_rate": 0,
                "trades": 0,
            }

        return {
            "profitable": pnl.get("total_pnl", 0) > 0,
            "total_pnl": pnl.get("total_pnl", 0),
            "win_rate": pnl.get("win_rate", 0),
            "trades": pnl.get("total_trades", 0),
        }

    async def get_concentration_risk(self, mint: str) -> dict[str, Any]:
        """
        Get concentration risk for a token
        Returns: {top_holder_percent, top_10_percent, whale_count, risk}
        """
        holders = await self.get_token_holders(mint)
        if not holders:
            return {
                "top_holder_percent": 0,
                "top_10_percent": 0,
                "whale_count": 0,
                "risk": "high",
            }

        top_holder_percent = holders[0].get("percentage", 0) if holders else 0
        top_10_percent = sum(h.get("percentage", 0) for h in holders[:10])
        whale_count = sum(1 for h in holders if h.get("percentage", 0) > 5)

        risk = "low"
        if top_holder_percent > 50 or top_10_percent > 80:
            risk = "high"
        elif top_holder_percent > 20 or top_10_percent > 60:
            risk = "medium"

        return {
            "top_holder_percent": top_holder_percent,
            "top_10_percent": top_10_percent,
            "whale_count": whale_count,
            "risk": risk,
        }

    async def analyze_token(self, mint: str) -> dict[str, Any] | None:
        """Get comprehensive token analysis"""
        details = await self.get_token_details(mint)
        if not details:
            return None

        concentration = await self.get_concentration_risk(mint)

        return {
            **details,
            "concentration_risk": concentration,
            "is_risky": concentration["risk"] == "high",
        }
