"""Google Gemini embeddings client."""

from typing import List
import google.generativeai as genai


class GeminiEmbeddings:
    """Google text-embedding-004 embeddings."""

    MODEL = "models/text-embedding-004"
    DIMENSIONS = 768
    MAX_BATCH_SIZE = 100

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        if not texts:
            return []

        all_embeddings = []
        for i in range(0, len(texts), self.MAX_BATCH_SIZE):
            batch = texts[i : i + self.MAX_BATCH_SIZE]

            for text in batch:
                result = genai.embed_content(
                    model=self.MODEL,
                    content=text,
                    task_type="retrieval_document",
                )
                all_embeddings.append(result["embedding"])

        return all_embeddings

    async def embed_single(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        result = genai.embed_content(
            model=self.MODEL,
            content=text,
            task_type="retrieval_query",
        )
        return result["embedding"]
