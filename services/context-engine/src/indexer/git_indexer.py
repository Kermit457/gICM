"""Git Repository Indexer - indexes code from Git repositories."""

import asyncio
import hashlib
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..db.qdrant import QdrantDB
from ..embeddings.openai import OpenAIEmbeddings
from .chunker import ASTChunker, CodeChunk


class GitIndexer:
    """Index Git repositories into vector store."""

    COLLECTION = "code_chunks"
    BATCH_SIZE = 100

    DEFAULT_EXCLUDE = [
        "node_modules",
        ".git",
        "dist",
        "build",
        "__pycache__",
        ".next",
        "target",
        "vendor",
        ".venv",
        "venv",
        ".cache",
        "coverage",
    ]

    CODE_EXTENSIONS = {
        ".py",
        ".js",
        ".ts",
        ".tsx",
        ".jsx",
        ".rs",
        ".go",
        ".sol",
        ".move",
        ".vue",
        ".svelte",
    }

    def __init__(self, db: QdrantDB, embeddings: OpenAIEmbeddings):
        self.db = db
        self.embeddings = embeddings
        self.chunker = ASTChunker()

    async def index_repository(
        self,
        url: str,
        branch: str = "main",
        exclude_patterns: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Clone and index a Git repository."""
        exclude = exclude_patterns or self.DEFAULT_EXCLUDE
        repo_name = url.split("/")[-1].replace(".git", "")

        print(f"Indexing repository: {repo_name} ({branch})")

        with tempfile.TemporaryDirectory() as tmpdir:
            repo_path = Path(tmpdir) / "repo"

            # Clone repository
            await self._clone_repo(url, branch, repo_path)

            # Find code files
            files = self._find_code_files(repo_path, exclude)
            print(f"Found {len(files)} code files")

            # Chunk all files
            all_chunks: List[CodeChunk] = []
            for file_path in files:
                try:
                    content = file_path.read_text(errors="ignore")
                    relative_path = str(file_path.relative_to(repo_path))
                    chunks = self.chunker.chunk_file(relative_path, content)
                    all_chunks.extend(chunks)
                except Exception as e:
                    print(f"Error chunking {file_path}: {e}")

            print(f"Created {len(all_chunks)} chunks")

            # Generate embeddings and store
            await self._embed_and_store(all_chunks, repo_name)

            return {
                "status": "success",
                "repository": repo_name,
                "files_indexed": len(files),
                "chunks_created": len(all_chunks),
            }

    async def _clone_repo(self, url: str, branch: str, path: Path):
        """Shallow clone a repository."""
        cmd = [
            "git",
            "clone",
            "--depth",
            "1",
            "--branch",
            branch,
            url,
            str(path),
        ]

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        await process.wait()

        if process.returncode != 0:
            raise Exception(f"Failed to clone {url}")

    def _find_code_files(self, repo_path: Path, exclude: List[str]) -> List[Path]:
        """Find all code files in repository."""
        files = []

        for file_path in repo_path.rglob("*"):
            if file_path.is_file():
                # Check exclusions
                path_str = str(file_path)
                if any(ex in path_str for ex in exclude):
                    continue

                # Check extension
                if file_path.suffix in self.CODE_EXTENSIONS:
                    files.append(file_path)

        return files

    async def _embed_and_store(self, chunks: List[CodeChunk], repo_name: str):
        """Generate embeddings and store in Qdrant."""
        for i in range(0, len(chunks), self.BATCH_SIZE):
            batch = chunks[i : i + self.BATCH_SIZE]

            # Build search text for each chunk
            texts = [
                f"{chunk.file_path}\n{chunk.node_type}\n{chunk.content}"
                for chunk in batch
            ]

            # Generate embeddings
            embeddings = await self.embeddings.embed(texts)

            # Prepare points
            points = []
            for chunk, embedding in zip(batch, embeddings):
                point = {
                    "id": chunk.sha256[:16],
                    "vector": embedding,
                    "payload": {
                        "repo": repo_name,
                        "file_path": chunk.file_path,
                        "language": chunk.language,
                        "start_line": chunk.start_line,
                        "end_line": chunk.end_line,
                        "node_type": chunk.node_type,
                        "content": chunk.content,
                    },
                }
                points.append(point)

            # Upsert to Qdrant
            await self.db.upsert(self.COLLECTION, points)
            print(f"Indexed chunks {i + 1}-{i + len(batch)}/{len(chunks)}")
