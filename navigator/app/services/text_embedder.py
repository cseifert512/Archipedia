"""
OpenAI text embedding service for semantic search.
Uses text-embedding-3-small (1536 dims) for efficiency.
"""
import os
import json
import hashlib
import time
import numpy as np
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Cache for embeddings to avoid redundant API calls
_embedding_cache: Dict[str, np.ndarray] = {}

# TTL-based cache for search results
# Format: {cache_key: (results, timestamp)}
_search_cache: Dict[str, Tuple[List[Dict[str, Any]], float]] = {}
SEARCH_CACHE_TTL = 3600  # 1 hour
SEARCH_CACHE_MAX_SIZE = 500  # Max entries to prevent memory bloat


def _clean_search_cache():
    """Remove expired entries from search cache."""
    global _search_cache
    now = time.time()
    expired_keys = [
        k for k, (_, ts) in _search_cache.items() 
        if now - ts > SEARCH_CACHE_TTL
    ]
    for k in expired_keys:
        del _search_cache[k]
    
    # If still too large, remove oldest entries
    if len(_search_cache) > SEARCH_CACHE_MAX_SIZE:
        sorted_items = sorted(_search_cache.items(), key=lambda x: x[1][1])
        excess = len(_search_cache) - SEARCH_CACHE_MAX_SIZE
        for k, _ in sorted_items[:excess]:
            del _search_cache[k]


def _get_search_cache(cache_key: str) -> Optional[List[Dict[str, Any]]]:
    """Get cached search results if not expired."""
    if cache_key in _search_cache:
        results, timestamp = _search_cache[cache_key]
        if time.time() - timestamp < SEARCH_CACHE_TTL:
            logger.debug(f"Search cache hit for key {cache_key[:16]}...")
            return results
        else:
            # Expired, remove it
            del _search_cache[cache_key]
    return None


def _set_search_cache(cache_key: str, results: List[Dict[str, Any]]):
    """Store search results in cache."""
    global _search_cache
    _clean_search_cache()
    _search_cache[cache_key] = (results, time.time())
    logger.debug(f"Cached search results for key {cache_key[:16]}... ({len(results)} results)")


def get_openai_api_key() -> Optional[str]:
    """Get OpenAI API key from environment."""
    return os.environ.get("OPENAI_API_KEY")


def _cache_key(text: str, model: str) -> str:
    """Generate a cache key for text+model combination."""
    return hashlib.md5(f"{model}:{text}".encode()).hexdigest()


def embed_text(
    text: str,
    model: str = "text-embedding-3-small",
    use_cache: bool = True,
    max_retries: int = 3
) -> Optional[np.ndarray]:
    """
    Embed a single text string using OpenAI API.
    
    Args:
        text: The text to embed
        model: OpenAI embedding model to use
        use_cache: Whether to use in-memory cache
        max_retries: Number of retries for rate limiting (429 errors)
        
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
    
    for attempt in range(max_retries):
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
            
            # Handle rate limiting with exponential backoff
            if response.status_code == 429:
                wait_time = (2 ** attempt) + 0.5  # 1.5s, 2.5s, 4.5s
                logger.warning(f"Rate limited by OpenAI, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
                
            response.raise_for_status()
            data = response.json()
            embedding = np.array(data["data"][0]["embedding"], dtype="float32")
            
            # Cache the result
            if use_cache:
                _embedding_cache[cache_key] = embedding
                
            return embedding
            
        except Exception as e:
            if attempt < max_retries - 1 and "429" in str(e):
                wait_time = (2 ** attempt) + 0.5
                logger.warning(f"Rate limited, retrying in {wait_time}s")
                time.sleep(wait_time)
                continue
            logger.error(f"Failed to embed text: {e}")
            return None
    
    logger.error(f"Failed to embed text after {max_retries} retries")
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
    
    def _keyword_search(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        """
        Fallback keyword search for queries.
        Searches by substring matching in titles, typologies, climate, and full text.
        For multi-word queries, requires ALL words to be present (AND logic).
        
        Args:
            query: Search query (lowercased)
            top_k: Number of results to return
            
        Returns:
            List of matching results with scores
        """
        query_lower = query.lower().strip()
        query_words = [w for w in query_lower.split() if len(w) >= 2]  # Split into words, ignore very short ones
        matches = []
        
        for i, meta in enumerate(self._metadata):
            title = str(meta.get("title", "")).lower()
            typology = str(meta.get("typology", "")).lower()
            country = str(meta.get("country", "")).lower()
            climate = str(meta.get("climate_bin", "")).lower()
            massing = str(meta.get("massing_type", "")).lower()
            
            # Also get the full text from texts array if available
            full_text = ""
            if i < len(self._texts):
                full_text = str(self._texts[i]).lower()
            
            # Combine all searchable fields
            all_text = f"{title} {typology} {country} {climate} {massing} {full_text}"
            
            # For multi-word queries, check if ALL words are present
            if len(query_words) > 1:
                words_found = sum(1 for word in query_words if word in all_text)
                if words_found == 0:
                    continue
                    
                # Score based on how many words matched and where
                base_score = words_found / len(query_words)  # 0.5 to 1.0
                
                # Boost if all words found
                if words_found == len(query_words):
                    # Check for matches in higher-value fields
                    if all(word in title for word in query_words):
                        score = 0.90
                    elif all(word in typology for word in query_words):
                        score = 0.80
                    elif all(word in climate for word in query_words):
                        score = 0.75  # Climate match
                    elif any(word in typology for word in query_words) or any(word in climate for word in query_words):
                        score = 0.70
                    else:
                        score = 0.60  # All words found in full text
                else:
                    # Partial match - some words found
                    score = 0.40 * base_score
            else:
                # Single word query - use original logic
                score = 0.0
                if query_lower in title:
                    score = 0.85  # Title match is strongest
                elif query_lower in typology:
                    score = 0.75  # Typology match is strong
                elif query_lower in climate:
                    score = 0.72  # Climate match
                elif query_lower in country:
                    score = 0.65  # Country match
                elif query_lower in full_text:
                    score = 0.55  # General text match
                
            if score > 0:
                result = {
                    "idx": i,
                    "score": score,
                    "project_id": self._project_ids[i] if i < len(self._project_ids) else "",
                    "match_type": "keyword",
                }
                result.update(meta)
                matches.append(result)
        
        # Sort by score descending
        matches.sort(key=lambda x: -x["score"])
        return matches[:top_k]
    
    def _merge_results(
        self, 
        keyword_results: List[Dict[str, Any]], 
        semantic_results: List[Dict[str, Any]], 
        top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Merge keyword and semantic results, deduplicating by project_id.
        Keyword matches are boosted when they also appear in semantic results.
        
        Args:
            keyword_results: Results from keyword search
            semantic_results: Results from semantic search
            top_k: Number of results to return
            
        Returns:
            Merged and deduplicated results
        """
        seen_ids = set()
        merged = []
        
        # First, add keyword results (they get priority for short queries)
        for result in keyword_results:
            pid = result.get("project_id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                # Check if this also appears in semantic results for a boost
                semantic_match = next(
                    (r for r in semantic_results if r.get("project_id") == pid), 
                    None
                )
                if semantic_match:
                    # Boost score if both keyword and semantic match
                    result["score"] = min(1.0, result["score"] + 0.1)
                    result["match_type"] = "hybrid"
                merged.append(result)
        
        # Then add semantic results that weren't already included
        for result in semantic_results:
            pid = result.get("project_id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                merged.append(result)
        
        # Re-sort by score and assign ranks
        merged.sort(key=lambda x: -x.get("score", 0))
        for i, result in enumerate(merged[:top_k]):
            result["rank"] = i + 1
            
        return merged[:top_k]

    def search(
        self,
        query: str,
        top_k: int = 12,
        model: str = "text-embedding-3-small"
    ) -> List[Dict[str, Any]]:
        """
        Search for projects matching the query text.
        Uses hybrid search (keyword + semantic) for short queries to improve recall.
        Results are cached for 1 hour to reduce API calls.
        
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
        
        query_stripped = query.strip()
        query_lower = query_stripped.lower()
        
        # Check cache first
        cache_key = hashlib.md5(f"{query_lower}:{top_k}:{model}".encode()).hexdigest()
        cached = _get_search_cache(cache_key)
        if cached is not None:
            return cached
        
        # For short queries (< 5 chars or single word), use hybrid search
        is_short_query = len(query_stripped) < 5 or len(query_stripped.split()) < 2
        
        if is_short_query:
            # Get keyword results first (fast, no API call)
            keyword_results = self._keyword_search(query_lower, top_k * 2)
            
            # Also get semantic results (may help for conceptual matches)
            query_embedding = embed_text(query, model=model)
            if query_embedding is not None:
                semantic_results = self._semantic_search(query_embedding, top_k)
                results = self._merge_results(keyword_results, semantic_results, top_k)
            else:
                # Fall back to keyword-only if embedding fails
                for i, result in enumerate(keyword_results[:top_k]):
                    result["rank"] = i + 1
                results = keyword_results[:top_k]
            
            # Cache and return
            _set_search_cache(cache_key, results)
            return results
        
        # For longer queries, use semantic search only
        query_embedding = embed_text(query, model=model)
        if query_embedding is None:
            # Fallback to keyword search if embedding fails
            keyword_results = self._keyword_search(query_lower, top_k)
            for i, result in enumerate(keyword_results):
                result["rank"] = i + 1
            _set_search_cache(cache_key, keyword_results)
            return keyword_results
        
        results = self._semantic_search(query_embedding, top_k)
        _set_search_cache(cache_key, results)
        return results
    
    def _semantic_search(self, query_embedding: np.ndarray, top_k: int) -> List[Dict[str, Any]]:
        """
        Perform semantic search using precomputed embeddings.
        
        Args:
            query_embedding: Query vector from embedding model
            top_k: Number of results to return
            
        Returns:
            List of matching results with scores
        """
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
                "match_type": "semantic",
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

