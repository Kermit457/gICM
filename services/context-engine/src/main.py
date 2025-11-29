"""FastAPI application for gICM Context Engine."""

import os
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .db.qdrant import QdrantDB, init_collections
from .indexer.gicm_indexer import GICMIndexer
from .indexer.git_indexer import GitIndexer
from .search.semantic import SemanticSearch
from .embeddings.gemini import GeminiEmbeddings

load_dotenv()

# Global instances
db: Optional[QdrantDB] = None
embeddings: Optional[GeminiEmbeddings] = None
gicm_indexer: Optional[GICMIndexer] = None
git_indexer: Optional[GitIndexer] = None
semantic_search: Optional[SemanticSearch] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    global db, embeddings, gicm_indexer, git_indexer, semantic_search

    # Initialize Qdrant
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    db = QdrantDB(url=qdrant_url, api_key=qdrant_api_key)
    await init_collections(db)

    # Initialize embeddings
    embeddings = GeminiEmbeddings(api_key=os.getenv("GEMINI_API_KEY"))

    # Initialize indexers
    gicm_indexer = GICMIndexer(db=db, embeddings=embeddings)
    git_indexer = GitIndexer(db=db, embeddings=embeddings)

    # Initialize search
    semantic_search = SemanticSearch(db=db, embeddings=embeddings)

    print("gICM Context Engine started")
    yield
    print("gICM Context Engine shutting down")


app = FastAPI(
    title="gICM Context Engine",
    description="Semantic search for gICM marketplace components and code",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---

class IndexGICMRequest(BaseModel):
    """Request to index gICM registry."""
    api_url: str = "https://gicm.dev/api/registry"
    force_reindex: bool = False


class IndexRepoRequest(BaseModel):
    """Request to index a Git repository."""
    url: str
    branch: str = "main"
    exclude_patterns: Optional[List[str]] = None


class SearchRequest(BaseModel):
    """Semantic search request."""
    query: str
    collection: str = "gicm_components"
    kind: Optional[str] = None
    platform: Optional[str] = None
    limit: int = 10


class SearchResult(BaseModel):
    """Search result item."""
    id: str
    score: float
    payload: dict


class SearchResponse(BaseModel):
    """Search response."""
    results: List[SearchResult]
    query: str
    total: int


# --- Endpoints ---

@app.get("/health")
async def health():
    """Health check endpoint."""
    qdrant_healthy = await db.health() if db else False
    return {
        "status": "ok" if qdrant_healthy else "degraded",
        "qdrant": qdrant_healthy,
        "version": "1.0.0",
    }


@app.post("/index/gicm")
async def index_gicm(req: IndexGICMRequest, background_tasks: BackgroundTasks):
    """Index gICM marketplace registry."""
    if not gicm_indexer:
        raise HTTPException(status_code=503, detail="Indexer not initialized")

    background_tasks.add_task(
        gicm_indexer.index_registry,
        api_url=req.api_url,
        force_reindex=req.force_reindex,
    )

    return {"status": "indexing", "message": "gICM registry indexing started"}


@app.post("/index/repository")
async def index_repository(req: IndexRepoRequest, background_tasks: BackgroundTasks):
    """Index a Git repository."""
    if not git_indexer:
        raise HTTPException(status_code=503, detail="Indexer not initialized")

    background_tasks.add_task(
        git_indexer.index_repository,
        url=req.url,
        branch=req.branch,
        exclude_patterns=req.exclude_patterns,
    )

    return {"status": "indexing", "repository": req.url}


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    """Semantic search across indexed content."""
    if not semantic_search:
        raise HTTPException(status_code=503, detail="Search not initialized")

    filters = {}
    if req.kind:
        filters["kind"] = req.kind
    if req.platform:
        filters["platforms"] = req.platform

    results = await semantic_search.search(
        query=req.query,
        collection=req.collection,
        filters=filters if filters else None,
        limit=req.limit,
    )

    return SearchResponse(
        results=[
            SearchResult(id=r["id"], score=r["score"], payload=r["payload"])
            for r in results
        ],
        query=req.query,
        total=len(results),
    )


@app.get("/stats")
async def stats():
    """Get indexing statistics."""
    if not db:
        raise HTTPException(status_code=503, detail="Database not initialized")

    collections = await db.list_collections()
    stats = {}

    for name in collections:
        info = await db.collection_info(name)
        stats[name] = {
            "vectors_count": info.get("vectors_count", 0),
            "points_count": info.get("points_count", 0),
        }

    return {"collections": stats}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
    )
