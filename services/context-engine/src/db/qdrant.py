"""Qdrant vector database client."""

from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient, models


class QdrantDB:
    """Qdrant database wrapper."""

    def __init__(self, url: str = "http://localhost:6333", api_key: str = None):
        self.client = QdrantClient(url=url, api_key=api_key, timeout=120)
        self.url = url

    async def health(self) -> bool:
        """Check if Qdrant is healthy."""
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

    async def list_collections(self) -> List[str]:
        """List all collections."""
        collections = self.client.get_collections()
        return [c.name for c in collections.collections]

    async def collection_info(self, name: str) -> Dict[str, Any]:
        """Get collection info."""
        try:
            info = self.client.get_collection(name)
            return {
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
            }
        except Exception:
            return {"vectors_count": 0, "points_count": 0}

    async def create_collection(
        self,
        name: str,
        vector_size: int = 1536,
        distance: str = "Cosine",
    ):
        """Create a collection if it doesn't exist."""
        collections = await self.list_collections()
        if name not in collections:
            self.client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE if distance == "Cosine" else models.Distance.DOT,
                ),
            )
            print(f"Created collection: {name}")

    async def upsert(
        self,
        collection: str,
        points: List[Dict[str, Any]],
    ):
        """Upsert points into a collection."""
        qdrant_points = [
            models.PointStruct(
                id=p["id"],
                vector=p["vector"],
                payload=p["payload"],
            )
            for p in points
        ]

        self.client.upsert(
            collection_name=collection,
            points=qdrant_points,
        )

    async def search(
        self,
        collection: str,
        vector: List[float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        query_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                if isinstance(value, list):
                    conditions.append(
                        models.FieldCondition(
                            key=key,
                            match=models.MatchAny(any=value),
                        )
                    )
                else:
                    conditions.append(
                        models.FieldCondition(
                            key=key,
                            match=models.MatchValue(value=value),
                        )
                    )
            if conditions:
                query_filter = models.Filter(must=conditions)

        results = self.client.query_points(
            collection_name=collection,
            query=vector,
            limit=limit,
            query_filter=query_filter,
        )

        return [
            {
                "id": str(r.id),
                "score": r.score,
                "payload": r.payload,
            }
            for r in results.points
        ]

    async def delete_collection(self, name: str):
        """Delete a collection."""
        try:
            self.client.delete_collection(name)
        except Exception:
            pass


async def init_collections(db: QdrantDB):
    """Initialize required collections."""
    # gICM marketplace components (390+ items)
    await db.create_collection(
        name="gicm_components",
        vector_size=768,  # Gemini text-embedding-004
    )

    # Code chunks from indexed repositories
    await db.create_collection(
        name="code_chunks",
        vector_size=768,
    )

    # Documentation pages
    await db.create_collection(
        name="documentation",
        vector_size=768,
    )

    print("Qdrant collections initialized")
