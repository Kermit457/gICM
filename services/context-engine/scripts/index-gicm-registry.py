#!/usr/bin/env python3
"""
Pre-index gICM Registry Script

Run this script to index all 390+ gICM marketplace items into Qdrant.

Usage:
    python scripts/index-gicm-registry.py

Requirements:
    - Qdrant running on localhost:6333
    - OPENAI_API_KEY environment variable set
"""

import asyncio
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()


async def main():
    from src.db.qdrant import QdrantDB, init_collections
    from src.embeddings.openai import OpenAIEmbeddings
    from src.indexer.gicm_indexer import GICMIndexer

    # Check for API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)

    # Initialize services
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    gicm_api = os.getenv("GICM_API_URL", "https://gicm.dev")

    print(f"Connecting to Qdrant at {qdrant_url}...")
    db = QdrantDB(url=qdrant_url)

    # Check Qdrant health
    if not await db.health():
        print("Error: Cannot connect to Qdrant. Is it running?")
        print("Start it with: docker compose up -d")
        sys.exit(1)

    # Initialize collections
    print("Initializing collections...")
    await init_collections(db)

    # Initialize embeddings and indexer
    embeddings = OpenAIEmbeddings(api_key=api_key)
    indexer = GICMIndexer(db=db, embeddings=embeddings)

    # Index the registry
    print(f"\nIndexing gICM registry from {gicm_api}...")
    result = await indexer.index_registry(api_url=f"{gicm_api}/api/registry")

    print("\n" + "=" * 50)
    print("INDEXING COMPLETE")
    print("=" * 50)
    print(f"Items indexed: {result['items_indexed']}")
    print(f"Collection: {result['collection']}")
    print("\nYou can now use semantic search!")
    print("Example: curl -X POST http://localhost:8000/search -d '{\"query\": \"solana trading\", \"limit\": 5}'")


if __name__ == "__main__":
    asyncio.run(main())
