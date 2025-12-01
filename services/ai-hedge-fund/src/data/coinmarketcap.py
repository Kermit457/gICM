"""
CoinMarketCap API Integration
Market data, historical OHLCV, and global metrics

Free tier: 10,000 calls/month, 30 calls/min
API Key required
"""

import httpx
from typing import Any
from datetime import datetime, timedelta


class CoinMarketCapClient:
    """
    CoinMarketCap API client for market data
    Free tier: 10,000 calls/month, 30 calls/min
    """

    BASE_URL = "https://pro-api.coinmarketcap.com/v1"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key
        self.headers = {
            "Accept": "application/json",
        }
        if api_key:
            self.headers["X-CMC_PRO_API_KEY"] = api_key

    async def get_listings(
        self,
        limit: int = 100,
        sort: str = "market_cap",
        sort_dir: str = "desc",
    ) -> list[dict[str, Any]]:
        """Get top cryptocurrencies by market cap"""
        if not self.api_key:
            return []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/cryptocurrency/listings/latest",
                    params={
                        "limit": limit,
                        "sort": sort,
                        "sort_dir": sort_dir,
                        "convert": "USD",
                    },
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return []

                return data.get("data", [])
            except Exception:
                return []

    async def get_quotes(
        self,
        symbols: list[str] | None = None,
        ids: list[int] | None = None,
    ) -> dict[str, dict[str, Any]]:
        """Get current quotes for specific cryptocurrencies"""
        if not self.api_key:
            return {}

        if not symbols and not ids:
            return {}

        params: dict[str, Any] = {"convert": "USD"}
        if symbols:
            params["symbol"] = ",".join(symbols)
        elif ids:
            params["id"] = ",".join(str(i) for i in ids)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/cryptocurrency/quotes/latest",
                    params=params,
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return {}

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return {}

                return data.get("data", {})
            except Exception:
                return {}

    async def get_price(self, symbol: str) -> dict[str, Any] | None:
        """Get current price for a single cryptocurrency"""
        quotes = await self.get_quotes(symbols=[symbol])
        return quotes.get(symbol)

    async def get_prices(
        self, symbols: list[str]
    ) -> dict[str, dict[str, float | None]]:
        """
        Get current prices for multiple cryptocurrencies
        Returns dict mapping symbol to {price, change_24h, market_cap}
        """
        result: dict[str, dict[str, float | None]] = {}
        quotes = await self.get_quotes(symbols=symbols)

        for symbol, coin_data in quotes.items():
            quote = coin_data.get("quote", {}).get("USD", {})
            result[symbol] = {
                "price": quote.get("price"),
                "change_24h": quote.get("percent_change_24h"),
                "market_cap": quote.get("market_cap"),
                "volume_24h": quote.get("volume_24h"),
            }

        return result

    async def get_historical_ohlcv(
        self,
        symbol: str,
        days: int = 30,
        interval: str = "daily",
    ) -> list[dict[str, Any]]:
        """
        Get historical OHLCV data for a cryptocurrency
        Note: Historical endpoints may require paid tier
        """
        if not self.api_key:
            return []

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/cryptocurrency/ohlcv/historical",
                    params={
                        "symbol": symbol,
                        "time_start": start_date.isoformat(),
                        "time_end": end_date.isoformat(),
                        "interval": interval,
                        "convert": "USD",
                    },
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return []

                quotes = data.get("data", {}).get("quotes", [])
                return [
                    {
                        "timestamp": q.get("time_open"),
                        "open": q.get("quote", {}).get("USD", {}).get("open"),
                        "high": q.get("quote", {}).get("USD", {}).get("high"),
                        "low": q.get("quote", {}).get("USD", {}).get("low"),
                        "close": q.get("quote", {}).get("USD", {}).get("close"),
                        "volume": q.get("quote", {}).get("USD", {}).get("volume"),
                        "market_cap": q.get("quote", {}).get("USD", {}).get("market_cap"),
                    }
                    for q in quotes
                ]
            except Exception:
                return []

    async def get_global_metrics(self) -> dict[str, Any]:
        """Get global cryptocurrency market metrics"""
        if not self.api_key:
            return {}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/global-metrics/quotes/latest",
                    params={"convert": "USD"},
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return {}

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return {}

                raw = data.get("data", {})
                quote = raw.get("quote", {}).get("USD", {})

                return {
                    "total_market_cap": quote.get("total_market_cap"),
                    "total_volume_24h": quote.get("total_volume_24h"),
                    "market_cap_change_24h": quote.get(
                        "total_market_cap_yesterday_percentage_change"
                    ),
                    "btc_dominance": raw.get("btc_dominance"),
                    "eth_dominance": raw.get("eth_dominance"),
                    "defi_market_cap": raw.get("defi_market_cap"),
                    "defi_change_24h": raw.get("defi_24h_percentage_change"),
                    "stablecoin_market_cap": raw.get("stablecoin_market_cap"),
                    "active_cryptocurrencies": raw.get("active_cryptocurrencies"),
                    "active_exchanges": raw.get("active_exchanges"),
                    "last_updated": raw.get("last_updated"),
                }
            except Exception:
                return {}

    async def get_top_gainers_losers(
        self,
        limit: int = 10,
        time_period: str = "24h",
    ) -> dict[str, list[dict[str, Any]]]:
        """Get top gainers and losers"""
        if not self.api_key:
            return {"gainers": [], "losers": []}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/cryptocurrency/trending/gainers-losers",
                    params={
                        "limit": limit,
                        "time_period": time_period,
                        "convert": "USD",
                    },
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    # Fallback: calculate from listings
                    return await self._calculate_gainers_losers(limit)

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return await self._calculate_gainers_losers(limit)

                return data.get("data", {"gainers": [], "losers": []})
            except Exception:
                return await self._calculate_gainers_losers(limit)

    async def _calculate_gainers_losers(
        self, limit: int = 10
    ) -> dict[str, list[dict[str, Any]]]:
        """Calculate gainers/losers from listings if trending endpoint unavailable"""
        listings = await self.get_listings(limit=200)
        if not listings:
            return {"gainers": [], "losers": []}

        # Sort by 24h change
        sorted_coins = sorted(
            listings,
            key=lambda x: x.get("quote", {}).get("USD", {}).get("percent_change_24h", 0),
            reverse=True,
        )

        return {
            "gainers": sorted_coins[:limit],
            "losers": sorted_coins[-limit:][::-1],
        }

    async def search_coins(
        self, query: str, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Search for cryptocurrencies by name or symbol"""
        if not self.api_key:
            return []

        # CMC doesn't have a direct search endpoint in free tier
        # Workaround: get listings and filter
        listings = await self.get_listings(limit=500)
        query_lower = query.lower()

        matches = [
            coin
            for coin in listings
            if query_lower in coin.get("name", "").lower()
            or query_lower in coin.get("symbol", "").lower()
        ]

        return matches[:limit]

    async def get_coin_info(self, symbol: str) -> dict[str, Any] | None:
        """Get detailed info for a cryptocurrency"""
        if not self.api_key:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/cryptocurrency/info",
                    params={"symbol": symbol},
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return None

                data = response.json()
                if data.get("status", {}).get("error_code", 0) != 0:
                    return None

                return data.get("data", {}).get(symbol)
            except Exception:
                return None
