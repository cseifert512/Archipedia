"""
OpenAI text embedding service for semantic search.
Uses text-embedding-3-small (1536 dims) for efficiency.
"""
import os
import json
import hashlib
import numpy as np
from typing import List, Optional, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Cache for embeddings to avoid redundant API calls
_embedding_cache: Dict[str, np.ndarray] = {}


def get_openai_api_key() -> Optional[str]:
    """Get OpenAI API key from environment."""
    return os.environ.get("OPENAI_API_KEY")


def _cache_key(text: str, model: str) -> str:
    """Generate a cache key for text+model combination."""
    return hashlib.md5(f"{model}:{text}".encode()).hexdigest()


def embed_text(
    text: str,
    model: str = "text-embedding-3-small",
    use_cache: bool = True
) -> Optional[np.ndarray]:
    """
    Embed a single text string using OpenAI API.
    
    Args:
        text: The text to embed
        model: OpenAI embedding model to use
        use_cache: Whether to use in-memory cache
        
    Returns:
        numpy array of shape (1536,) or None if API call fails
    """
    import requests
    
    api_key = get_openai_api_key()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, cannot embed text")
        return None
    
    # Check cache
    if use_cache:
        cache_key = _cache_key(text, model)
        if cache_key in _embedding_cache:
            return _embedding_cache[cache_key]
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": text,
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        embedding = np.array(data["data"][0]["embedding"], dtype="float32")
        
        # Cache the result
        if use_cache:
            _embedding_cache[cache_key] = embedding
            
        return embedding
        
    except Exception as e:
        logger.error(f"Failed to embed text: {e}")
        return None


def embed_texts_batch(
    texts: List[str],
    model: str = "text-embedding-3-small",
    batch_size: int = 100
) -> List[Optional[np.ndarray]]:
    """
    Embed multiple texts in batches for efficiency.
    
    Args:
        texts: List of texts to embed
        model: OpenAI embedding model to use
        batch_size: Number of texts per API call (max 2048)
        
    Returns:
        List of numpy arrays (or None for failed embeddings)
    """
    import requests
    
    api_key = get_openai_api_key()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, cannot embed texts")
        return [None] * len(texts)
    
    results: List[Optional[np.ndarray]] = [None] * len(texts)
    
    # Process in batches
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_indices = list(range(i, min(i + batch_size, len(texts))))
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "input": batch,
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            
            for item in data["data"]:
                idx = batch_indices[item["index"]]
                results[idx] = np.array(item["embedding"], dtype="float32")
                
        except Exception as e:
            logger.error(f"Failed to embed batch starting at {i}: {e}")
            # Leave these as None
            
    return results


class TextEmbeddingIndex:
    """
    Simple numpy-based text embedding index for semantic search.
    For ~500 items, numpy is faster than FAISS overhead.
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.embeddings_dir = self.data_dir / "embeddings" / "text"
        self.index_path = self.embeddings_dir / "text_index.npz"
        self.metadata_path = self.embeddings_dir / "text_metadata.json"
        
        self._embeddings: Optional[np.ndarray] = None  # (N, 1536)
        self._project_ids: List[str] = []
        self._texts: List[str] = []
        self._metadata: List[Dict[str, Any]] = []
        
        self._load()
    
    def _load(self):
        """Load precomputed embeddings from disk."""
        if not self.index_path.exists():
            logger.warning(f"Text index not found at {self.index_path}")
            return
            
        try:
            data = np.load(self.index_path, allow_pickle=True)
            self._embeddings = data["embeddings"].astype("float32")
            self._project_ids = data["project_ids"].tolist()
            
            if self.metadata_path.exists():
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self._texts = meta.get("texts", [])
                    self._metadata = meta.get("metadata", [])
                    
            logger.info(f"Loaded text index with {len(self._project_ids)} projects")
            
        except Exception as e:
            logger.error(f"Failed to load text index: {e}")
    
    def is_ready(self) -> bool:
        """Check if the index is loaded and ready for search."""
        return self._embeddings is not None and len(self._project_ids) > 0
    
    def search(
        self,
        query: str,
        top_k: int = 12,
        model: str = "text-embedding-3-small"
    ) -> List[Dict[str, Any]]:
        """
        Search for projects matching the query text.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
            model: Embedding model to use for query
            
        Returns:
            List of dicts with project_id, score, and metadata
        """
        if not self.is_ready():
            logger.warning("Text index not ready, returning empty results")
            return []
        
        # Embed the query
        query_embedding = embed_text(query, model=model)
        if query_embedding is None:
            return []
        
        # Normalize for cosine similarity
        query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-12)
        embeddings_norm = self._embeddings / (
            np.linalg.norm(self._embeddings, axis=1, keepdims=True) + 1e-12
        )
        
        # Compute cosine similarities
        similarities = embeddings_norm @ query_norm
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for rank, idx in enumerate(top_indices, start=1):
            result = {
                "rank": rank,
                "score": float(similarities[idx]),
                "project_id": self._project_ids[idx],
            }
            
            # Add metadata if available
            if idx < len(self._metadata):
                result.update(self._metadata[idx])
                
            results.append(result)
            
        return results
    
    def save(
        self,
        embeddings: np.ndarray,
        project_ids: List[str],
        texts: List[str],
        metadata: List[Dict[str, Any]]
    ):
        """Save embeddings and metadata to disk."""
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)
        
        np.savez(
            self.index_path,
            embeddings=embeddings,
            project_ids=np.array(project_ids)
        )
        
        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump({
                "texts": texts,
                "metadata": metadata
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Saved text index with {len(project_ids)} projects")


# Singleton instance
_text_index: Optional[TextEmbeddingIndex] = None


def get_text_index(data_dir: str = "data") -> TextEmbeddingIndex:
    """Get or create the singleton text embedding index."""
    global _text_index
    if _text_index is None:
        _text_index = TextEmbeddingIndex(data_dir)
    return _text_index

