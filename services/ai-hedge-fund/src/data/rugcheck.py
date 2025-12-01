"""
RugCheck API Integration - Token Safety Scanner for Solana
FREE API - No authentication required
"""

import httpx
from typing import Any


class RugCheckClient:
    """
    RugCheck API client for token safety analysis
    FREE - No API key required
    """

    BASE_URL = "https://api.rugcheck.xyz/v1"

    def __init__(self):
        self.headers = {"Accept": "application/json"}

    async def get_token_report(self, mint: str) -> dict[str, Any]:
        """Get detailed safety report for a token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/tokens/{mint}/report",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return {}

                return response.json()
            except Exception:
                return {}

    async def get_token_summary(self, mint: str) -> dict[str, Any]:
        """Get quick safety summary for a token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/tokens/{mint}/report/summary",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return {}

                return response.json()
            except Exception:
                return {}

    async def get_trending_tokens(self) -> list[dict[str, Any]]:
        """Get trending tokens on RugCheck"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/stats/trending",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                return response.json()
            except Exception:
                return []

    async def get_new_tokens(self) -> list[dict[str, Any]]:
        """Get recently detected tokens"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/stats/new_tokens",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                return response.json()
            except Exception:
                return []

    async def get_verified_tokens(self) -> list[dict[str, Any]]:
        """Get verified safe tokens"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/stats/verified",
                    headers=self.headers,
                    timeout=30.0,
                )

                if response.status_code != 200:
                    return []

                return response.json()
            except Exception:
                return []

    async def is_token_safe(
        self, mint: str, min_score: int = 80
    ) -> dict[str, Any]:
        """
        Check if a token is safe
        Returns: {safe: bool, score: int, risks: list, rugged: bool}
        """
        summary = await self.get_token_summary(mint)
        if not summary:
            return {
                "safe": False,
                "score": 0,
                "risks": ["Unable to fetch data"],
                "rugged": False,
            }

        score = summary.get("score", 0)
        rugged = summary.get("rugged", False)

        return {
            "safe": score >= min_score and not rugged,
            "score": score,
            "risks": summary.get("risks", []),
            "rugged": rugged,
        }

    async def get_safety_label(self, mint: str) -> str:
        """Get human-readable safety label"""
        result = await self.is_token_safe(mint)
        score = result["score"]

        if result["rugged"]:
            return "RUGGED"
        if score >= 80:
            return "SAFE"
        if score >= 50:
            return "MODERATE RISK"
        if score >= 30:
            return "HIGH RISK"
        return "DANGER"
