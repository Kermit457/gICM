# gICM Context Engine

Semantic search engine for the gICM marketplace. Indexes 390+ components (agents, skills, MCPs, workflows) for instant discovery.

## Quick Start

### 1. Start Infrastructure

```bash
cd services/context-engine
docker compose up -d
```

This starts:
- **Qdrant** (vector database) on port 6333
- **Redis** (job queue) on port 6379

### 2. Install Python Dependencies

```bash
pip install -e .
```

### 3. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 4. Index gICM Registry

```bash
python scripts/index-gicm-registry.py
```

This indexes all 390+ marketplace items into Qdrant.

### 5. Start the API Server

```bash
uvicorn src.main:app --reload
```

Server runs on http://localhost:8000

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Search Components
```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "solana trading bot", "limit": 5}'
```

### Index a Git Repository
```bash
curl -X POST http://localhost:8000/index/repository \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/user/repo", "branch": "main"}'
```

### Get Statistics
```bash
curl http://localhost:8000/stats
```

## Collections

| Collection | Description |
|------------|-------------|
| `gicm_components` | 390+ marketplace items (agents, skills, MCPs, workflows) |
| `code_chunks` | AST-chunked code from indexed repositories |
| `documentation` | Indexed documentation pages |

## Architecture

```
services/context-engine/
├── docker-compose.yml      # Qdrant + Redis
├── pyproject.toml          # Python dependencies
├── src/
│   ├── main.py             # FastAPI application
│   ├── db/
│   │   └── qdrant.py       # Vector database client
│   ├── embeddings/
│   │   └── openai.py       # OpenAI text-embedding-3-small
│   ├── indexer/
│   │   ├── gicm_indexer.py # Registry indexer
│   │   ├── git_indexer.py  # Repository indexer
│   │   └── chunker.py      # AST-aware chunking
│   └── search/
│       └── semantic.py     # Semantic search
└── scripts/
    └── index-gicm-registry.py  # Pre-indexing script
```

## Integration with MCP Server

The context engine serves as the backend for the `@gicm/mcp-server` package, which exposes these capabilities to Claude Code, Cursor, and Windsurf.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Required |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` |
| `REDIS_URL` | Redis server URL | `redis://localhost:6379` |
| `GICM_API_URL` | gICM API URL | `https://gicm.dev` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
