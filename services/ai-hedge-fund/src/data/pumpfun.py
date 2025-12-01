"""
Pump.fun API Integration - Memecoin Launch Tracker for Solana
FREE API - No authentication required
"""

import httpx
from typing import Any


class PumpFunClient:
    """
    Pump.fun API client for memecoin launches
    FREE - No API key required
    """

    BASE_URL = "https://frontend-api.pump.fun"

    def __init__(self):
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "gICM-HedgeFund/1.0",
        }

    async def get_new_coins(
        self,
        limit: int = 50,
        include_nsfw: bool = False,
    ) -> list[dict[str, Any]]:
        """Get latest coins from Pump.fun"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/coins",
                    params={
                        "offset": 0,
                        "limit": limit,
                        "sort": "created_timestamp",
                        "order": "DESC",
                        "includeNsfw": str(include_nsfw).lower(),
                    },
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                return response.json()
            except Exception:
                return []

    async def get_coin_details(self, mint: str) -> dict[str, Any] | None:
        """Get details for a specific coin"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/coins/{mint}",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_king_of_the_hill(self) -> dict[str, Any] | None:
        """Get current king of the hill"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/coins/king-of-the-hill",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                return response.json()
            except Exception:
                return None

    async def get_graduated_coins(self, limit: int = 20) -> list[dict[str, Any]]:
        """Get coins that have graduated to Raydium"""
        coins = await self.get_new_coins(limit=200)
        return [c for c in coins if c.get("complete", False)][:limit]

    def calculate_bonding_curve_progress(self, coin: dict[str, Any]) -> float:
        """Calculate bonding curve progress percentage"""
        if coin.get("complete", False):
            return 100.0

        # Pump.fun bonding curve completes at ~85 SOL
        target_sol = 85
        virtual_sol = coin.get("virtual_sol_reserves", 0) / 1e9
        return min(100.0, (virtual_sol / target_sol) * 100)

    def estimate_market_cap(
        self, coin: dict[str, Any], sol_price: float = 200.0
    ) -> float:
        """Estimate market cap from virtual reserves"""
        if usd_mcap := coin.get("usd_market_cap"):
            return usd_mcap
        if mcap := coin.get("market_cap"):
            return mcap

        virtual_sol = coin.get("virtual_sol_reserves", 0) / 1e9
        return virtual_sol * sol_price * 2  # Rough estimate

    async def get_coin_with_analysis(
        self, mint: str, sol_price: float = 200.0
    ) -> dict[str, Any] | None:
        """Get coin details with calculated metrics"""
        coin = await self.get_coin_details(mint)
        if not coin:
            return None

        return {
            **coin,
            "bonding_curve_progress": self.calculate_bonding_curve_progress(coin),
            "estimated_market_cap": self.estimate_market_cap(coin, sol_price),
            "is_graduated": coin.get("complete", False),
            "has_raydium_pool": bool(coin.get("raydium_pool")),
            "has_socials": bool(coin.get("twitter") or coin.get("telegram")),
        }

    async def filter_safe_launches(
        self, min_progress: float = 10.0, max_coins: int = 10
    ) -> list[dict[str, Any]]:
        """
        Filter for potentially safer launches:
        - Has some bonding curve progress (not brand new)
        - Not NSFW
        - Has social links (twitter/telegram)
        """
        coins = await self.get_new_coins(limit=100)
        safe_launches = []

        for coin in coins:
            if coin.get("nsfw", False):
                continue

            progress = self.calculate_bonding_curve_progress(coin)
            if progress < min_progress:
                continue

            has_socials = bool(coin.get("twitter") or coin.get("telegram"))
            if not has_socials:
                continue

            safe_launches.append({
                **coin,
                "bonding_curve_progress": progress,
                "estimated_market_cap": self.estimate_market_cap(coin),
            })

            if len(safe_launches) >= max_coins:
                break

        return safe_launches
