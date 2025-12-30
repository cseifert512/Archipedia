from typing import List, Tuple, Dict, Optional
import numpy as np
import logging
from .index_store import IndexStore
from .features.spatial import SpatialFeatures
from .features.attributes import AttributeFeatures
from .features.patches import PatchFeatures
from ..models import Weights, Filters

logger = logging.getLogger(__name__)

class Pipeline:
    """Search pipeline with fusion scoring and patch reranking."""
    
    # Exponential decay alpha for distance-to-similarity conversion
    # Higher values = steeper decay, penalizing distant matches more
    # Recommended range: 2.0 - 5.0
    # Tested with test_similarity_conversion.py: alpha=2.0 gives best score differentiation
    SIMILARITY_ALPHA = 2.0
    
    def __init__(self, index_store: IndexStore, spatial_features: SpatialFeatures, 
                 attribute_features: AttributeFeatures, patch_features: PatchFeatures):
        self.index_store = index_store
        self.spatial_features = spatial_features
        self.attribute_features = attribute_features
        self.patch_features = patch_features
    
    def normalize_weights(self, weights: Weights) -> Tuple[float, float, float]:
        """Normalize weights to sum to 1 and clamp to [0.1, 0.7]."""
        total = max(1e-9, weights.visual + weights.spatial + weights.attr)
        v, s, a = weights.visual/total, weights.spatial/total, weights.attr/total
        
        # Clamp function
        clamp = lambda x: min(max(x, 0.1), 0.7)
        return clamp(v), clamp(s), clamp(a)
    
    def _normalize_distances(self, distances: List[float]) -> List[float]:
        """Apply min-max normalization to a list of distances.
        
        Normalizes distances to [0, 1] range so that different distance metrics
        (visual, spatial, attribute) are on comparable scales before fusion.
        
        Args:
            distances: List of raw distance values
            
        Returns:
            List of normalized distances in [0, 1] range
        """
        if not distances:
            return distances
        
        arr = np.array(distances, dtype=np.float32)
        d_min = arr.min()
        d_max = arr.max()
        
        # Avoid division by zero when all distances are the same
        if d_max - d_min < 1e-12:
            return [0.0] * len(distances)
        
        normalized = (arr - d_min) / (d_max - d_min)
        return normalized.tolist()
    
    def _apply_filters(self, indices: List[int], distances: List[float], filters: Filters) -> Tuple[List[int], List[float]]:
        """Apply attribute filters to candidates."""
        if not filters or (not filters.typology and not filters.climate_bin and not filters.massing_type):
            return indices, distances
        
        # Convert indices to project IDs using batch lookup
        project_ids_batch = self.index_store.get_project_ids_batch(indices)
        project_ids = [pid for pid in project_ids_batch if pid is not None]
        
        # Apply filters
        filter_dict = {}
        if filters.typology:
            filter_dict['typology'] = filters.typology
        if filters.climate_bin:
            filter_dict['climate_bin'] = filters.climate_bin
        if filters.massing_type:
            filter_dict['massing_type'] = filters.massing_type
        
        filtered_project_ids = set(self.attribute_features.apply_filters(project_ids, filter_dict))
        
        # Filter indices and distances using the already-fetched batch
        filtered_indices = []
        filtered_distances = []
        
        for idx, distance, project_id in zip(indices, distances, project_ids_batch):
            if project_id in filtered_project_ids:
                filtered_indices.append(idx)
                filtered_distances.append(distance)
        
        return filtered_indices, filtered_distances
    
    def search(self, query_vector: np.ndarray, filters: Filters, weights: Weights, k: int = 50) -> List[Tuple[str, float]]:
        """
        Perform search with fusion scoring and patch reranking.
        
        Args:
            query_vector: Query image embedding
            filters: Attribute filters
            weights: Scoring weights
            k: Number of results
            
        Returns:
            List of (image_id, score) tuples
        """
        # Step 1: Candidate retrieval (visual)
        indices, visual_distances = self.index_store.search(query_vector, k)
        
        if not indices:
            return []
        
        # Step 2: Apply filters
        indices, visual_distances = self._apply_filters(indices, visual_distances, filters)
        
        if not indices:
            return []
        
        # Step 3: Get project IDs for candidates using batch lookup
        project_ids = [pid or "unknown" for pid in self.index_store.get_project_ids_batch(indices)]
        
        # Step 4: Compute attribute distances
        attr_distances = self.attribute_features.distances(project_ids)
        
        # Step 5: Compute spatial distances
        spatial_distances = self.spatial_features.distances(project_ids)
        
        # Step 6: Normalize weights
        w_visual, w_spatial, w_attr = self.normalize_weights(weights)
        
        # Step 6.5: Normalize distances (min-max) so different metrics are on comparable scales
        # This prevents metrics with larger ranges (e.g., visual: 0-2+) from dominating
        # metrics with smaller ranges (e.g., attr: 0-1)
        visual_distances_norm = self._normalize_distances(visual_distances)
        spatial_distances_norm = self._normalize_distances(spatial_distances)
        attr_distances_norm = self._normalize_distances(attr_distances)
        
        # Step 7: Fusion scoring with exponential decay distance-to-similarity conversion
        # Using exp(-alpha * distance) for better score normalization:
        # - Produces higher similarity for close matches
        # - Penalizes distant matches more appropriately  
        # - Maps [0, inf) → (0, 1] naturally
        alpha = self.SIMILARITY_ALPHA
        fused_scores = []
        for i, (v_dist, s_dist, a_dist) in enumerate(zip(visual_distances_norm, spatial_distances_norm, attr_distances_norm)):
            # Convert normalized distances to similarities using exponential decay
            v_sim = np.exp(-alpha * v_dist)
            s_sim = np.exp(-alpha * s_dist)
            a_sim = np.exp(-alpha * a_dist)
            
            # Weighted fusion
            fused_score = w_visual * v_sim + w_spatial * s_sim + w_attr * a_sim
            fused_scores.append(fused_score)
        
        # Step 8: Patch rerank on top-k'
        topk_prime = min(k, 50)
        candidate_ids = self.index_store.get_image_ids_batch(indices[:topk_prime])
        candidate_scores = fused_scores[:topk_prime]
        
        if candidate_ids and self.patch_features:
            reranked_ids, reranked_scores = self.patch_features.rerank(
                query_vector, candidate_ids, candidate_scores
            )
        else:
            reranked_ids = candidate_ids
            reranked_scores = candidate_scores
        
        # Step 9: Combine reranked top-k' with remaining candidates
        remaining_indices = indices[topk_prime:]
        remaining_scores = fused_scores[topk_prime:]
        remaining_ids = self.index_store.get_image_ids_batch(remaining_indices)
        
        final_ids = reranked_ids + remaining_ids
        final_scores = reranked_scores + remaining_scores
        
        # Return top-k results
        results = list(zip(final_ids, final_scores))
        results.sort(key=lambda x: x[1], reverse=True)  # Sort by score descending
        
        return results[:k]
    
    def get_explanation(self, query_vector: np.ndarray, image_id: str, project_id: str) -> Dict:
        """Generate explanation for why an image is similar."""
        explanation = {}
        
        # Get patch match if available
        if self.patch_features:
            patch_match = self.patch_features.get_best_patch_match(query_vector, image_id)
            if patch_match:
                explanation['patch_match'] = patch_match
        
        # Get attribute matches
        project_attrs = self.attribute_features._get_project_attributes(project_id)
        if project_attrs:
            explanation['attributes'] = project_attrs
        
        return explanation
