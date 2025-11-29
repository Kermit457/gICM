"""OpenAI embeddings client."""

from typing import List
from openai import OpenAI


class OpenAIEmbeddings:
    """OpenAI text-embedding-3-small embeddings."""

    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536
    MAX_BATCH_SIZE = 100

    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        if not texts:
            return []

        # Process in batches
        all_embeddings = []
        for i in range(0, len(texts), self.MAX_BATCH_SIZE):
            batch = texts[i : i + self.MAX_BATCH_SIZE]

            response = self.client.embeddings.create(
                model=self.MODEL,
                input=batch,
            )

            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

        return all_embeddings

    async def embed_single(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        response = self.client.embeddings.create(
            model=self.MODEL,
            input=text,
        )
        return response.data[0].embedding
