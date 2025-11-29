"""Semantic search across indexed content."""

from typing import List, Dict, Any, Optional

from ..db.qdrant import QdrantDB
from ..embeddings.openai import OpenAIEmbeddings


class SemanticSearch:
    """Semantic search using vector similarity."""

    def __init__(self, db: QdrantDB, embeddings: OpenAIEmbeddings):
        self.db = db
        self.embeddings = embeddings

    async def search(
        self,
        query: str,
        collection: str = "gicm_components",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for similar content using semantic similarity."""
        # Generate query embedding
        query_embedding = await self.embeddings.embed_single(query)

        # Search in Qdrant
        results = await self.db.search(
            collection=collection,
            vector=query_embedding,
            limit=limit,
            filters=filters,
        )

        return results

    async def search_components(
        self,
        query: str,
        kind: Optional[str] = None,
        platform: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search gICM marketplace components."""
        filters = {}
        if kind:
            filters["kind"] = kind
        if platform:
            filters["platforms"] = platform

        return await self.search(
            query=query,
            collection="gicm_components",
            filters=filters if filters else None,
            limit=limit,
        )

    async def search_code(
        self,
        query: str,
        repo: Optional[str] = None,
        language: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search indexed code chunks."""
        filters = {}
        if repo:
            filters["repo"] = repo
        if language:
            filters["language"] = language

        return await self.search(
            query=query,
            collection="code_chunks",
            filters=filters if filters else None,
            limit=limit,
        )
