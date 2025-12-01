"""
Supabase Client Module

Provides singleton connection to Supabase for persistent data storage.
"""

import os
from functools import lru_cache
from pathlib import Path

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load from the service directory
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass  # dotenv not installed, rely on system environment

from supabase import create_client, Client


class SupabaseClientError(Exception):
    """Raised when Supabase client cannot be initialized."""
    pass


def _create_supabase_client() -> Client:
    """
    Create a Supabase client instance.

    Requires environment variables:
    - SUPABASE_URL: Supabase project URL
    - SUPABASE_ANON_KEY: Supabase anonymous key (or service role key)

    Returns:
        Client: Supabase client instance

    Raises:
        SupabaseClientError: If environment variables are missing
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url:
        raise SupabaseClientError(
            "SUPABASE_URL environment variable is required. "
            "Set it to your Supabase project URL (e.g., https://xxx.supabase.co)"
        )

    if not key:
        raise SupabaseClientError(
            "SUPABASE_ANON_KEY environment variable is required. "
            "Set it to your Supabase anon key or service role key."
        )

    return create_client(url, key)


# Singleton instance
_client: Client | None = None


def get_client() -> Client:
    """
    Get or create the Supabase client singleton.

    Returns:
        Client: Supabase client instance

    Raises:
        SupabaseClientError: If client cannot be created
    """
    global _client
    if _client is None:
        _client = _create_supabase_client()
    return _client


def reset_client() -> None:
    """
    Reset the client singleton.

    Useful for testing or re-initializing with new credentials.
    """
    global _client
    _client = None


@lru_cache(maxsize=1)
def is_supabase_configured() -> bool:
    """
    Check if Supabase environment variables are configured.

    Returns:
        bool: True if both SUPABASE_URL and SUPABASE_ANON_KEY are set
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    return bool(url and key)


__all__ = [
    "get_client",
    "reset_client",
    "is_supabase_configured",
    "SupabaseClientError",
]
