#!/usr/bin/env python3
"""Index gICM components from local TypeScript registry."""

import asyncio
import os
import re
import sys
import json
import uuid
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()


def extract_components_from_ts(file_path: str) -> list:
    """Extract component data from TypeScript registry file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    components = []

    # Find all component blocks using regex
    # Match patterns like { id: "...", name: "...", description: "...", ... }
    pattern = r'\{\s*id:\s*["\']([^"\']+)["\'].*?name:\s*["\']([^"\']+)["\'].*?description:\s*["\']([^"\']+)["\'].*?category:\s*["\']([^"\']+)["\']'

    matches = re.findall(pattern, content, re.DOTALL)

    for match in matches:
        comp_id, name, description, category = match
        components.append({
            "id": comp_id,
            "name": name.replace('/', ''),
            "description": description,
            "category": category,
            "kind": "component",
            "tags": [],
        })

    # Also extract from JSON-like structure if available
    # Try to find array definitions
    array_pattern = r'export const \w+:\s*\w+\[\]\s*=\s*\[(.*?)\];'

    return components


def parse_ts_objects(content: str) -> list:
    """Parse TypeScript objects more robustly."""
    components = []

    # Find id, name, description patterns
    id_pattern = r'id:\s*["\']([^"\']+)["\']'
    name_pattern = r'name:\s*["\']([^"\']+)["\']'
    desc_pattern = r'description:\s*["\']([^"\']+)["\']'
    cat_pattern = r'category:\s*["\']([^"\']+)["\']'
    tags_pattern = r'tags:\s*\[(.*?)\]'

    # Split by object boundaries
    blocks = re.split(r'\},\s*\{', content)

    for block in blocks:
        id_match = re.search(id_pattern, block)
        name_match = re.search(name_pattern, block)
        desc_match = re.search(desc_pattern, block)
        cat_match = re.search(cat_pattern, block)

        if id_match and name_match and desc_match:
            # Extract tags
            tags = []
            tags_match = re.search(tags_pattern, block)
            if tags_match:
                tag_content = tags_match.group(1)
                tags = re.findall(r'["\']([^"\']+)["\']', tag_content)

            components.append({
                "id": id_match.group(1),
                "name": name_match.group(1).replace('/', ''),
                "description": desc_match.group(1),
                "category": cat_match.group(1) if cat_match else "UI",
                "kind": "component",
                "tags": tags,
            })

    return components


async def main():
    from src.db.qdrant import QdrantDB, init_collections
    from src.embeddings.gemini import GeminiEmbeddings

    # Check for API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set")
        sys.exit(1)

    # Initialize services
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")

    print(f"Connecting to Qdrant at {qdrant_url}...")
    db = QdrantDB(url=qdrant_url, api_key=qdrant_api_key)

    # Check Qdrant health
    if not await db.health():
        print("Error: Cannot connect to Qdrant")
        sys.exit(1)

    print("Qdrant connected!")

    # Initialize collections
    print("Initializing collections...")
    await init_collections(db)

    # Read TypeScript file - use absolute path
    ts_file = r"C:\Users\mirko\OneDrive\Desktop\gICM\src\lib\registry-design.ts"

    print(f"Reading registry from {ts_file}...")

    with open(ts_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse components
    components = parse_ts_objects(content)
    print(f"Found {len(components)} components")

    if not components:
        print("No components found. Check the file format.")
        sys.exit(1)

    # Initialize embeddings
    embeddings = GeminiEmbeddings(api_key=api_key)

    # Index components - small batches for cloud
    BATCH_SIZE = 10
    indexed = 0

    for i in range(0, len(components), BATCH_SIZE):
        batch = components[i:i + BATCH_SIZE]

        # Build search texts
        texts = []
        for comp in batch:
            text = f"{comp['name']}\n{comp['description']}\nCategory: {comp['category']}\nTags: {', '.join(comp['tags'])}"
            texts.append(text)

        # Generate embeddings
        print(f"Generating embeddings for batch {i//BATCH_SIZE + 1}...")
        vectors = await embeddings.embed(texts)

        # Prepare points - convert string IDs to UUIDs
        points = []
        for comp, vector in zip(batch, vectors):
            # Generate a deterministic UUID from the string ID
            id_hash = hashlib.md5(comp["id"].encode()).hexdigest()
            point_id = str(uuid.UUID(id_hash))
            points.append({
                "id": point_id,
                "vector": vector,
                "payload": comp,
            })

        # Upsert to Qdrant
        await db.upsert("gicm_components", points)
        indexed += len(batch)
        print(f"Indexed {indexed}/{len(components)} components")

    print("\n" + "=" * 50)
    print("INDEXING COMPLETE")
    print("=" * 50)
    print(f"Components indexed: {indexed}")
    print("\nTest with:")
    print('curl -X POST http://localhost:8000/search -H "Content-Type: application/json" -d \'{"query": "button animation"}\'')


if __name__ == "__main__":
    asyncio.run(main())
