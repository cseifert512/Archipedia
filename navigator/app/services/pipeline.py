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
    
    def normalize_weights(self, weights: Weights, strict: bool = False) -> Tuple[float, float, float]:
        """Normalize weights to sum to 1 with optional clamping.
        
        Args:
            weights: Input weights for visual, spatial, and attribute components
            strict: If True, uses tight [0.1, 0.7] clamp (legacy behavior).
                   If False, uses wider [0.0, 0.95] range for more flexibility.
        
        Returns:
            Tuple of (visual_weight, spatial_weight, attr_weight) normalized to sum to 1
        """
        total = max(1e-9, weights.visual + weights.spatial + weights.attr)
        v, s, a = weights.visual/total, weights.spatial/total, weights.attr/total
        
        # Clamp function - strict mode preserves legacy behavior
        if strict:
            # Legacy tight range - prevents any single dimension from dominating
            clamp = lambda x: min(max(x, 0.1), 0.7)
        else:
            # Wider range allows near-pure visual/spatial/attr searches
            # Min 0.0 allows disabling unused dimensions (e.g., no spatial features)
            # Max 0.95 prevents complete single-dimension search (keeps some diversity)
            clamp = lambda x: min(max(x, 0.0), 0.95)
        
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
    
    def _has_any_filters(self, filters: Filters) -> bool:
        """Check if any inclusion or exclusion filters are set."""
        if not filters:
            return False
        # Check inclusion filters
        if filters.typology or filters.climate_bin or filters.massing_type:
            return True
        # Check exclusion filters
        if filters.exclude_typology or filters.exclude_climate_bin or filters.exclude_massing_type or filters.exclude_project_ids:
            return True
        return False
    
    def _apply_filters(self, indices: List[int], distances: List[float], filters: Filters) -> Tuple[List[int], List[float]]:
        """Apply inclusion and exclusion attribute filters to candidates."""
        if not self._has_any_filters(filters):
            return indices, distances
        
        # Convert indices to project IDs using batch lookup
        project_ids_batch = self.index_store.get_project_ids_batch(indices)
        project_ids = [pid for pid in project_ids_batch if pid is not None]
        
        # Apply inclusion filters
        filter_dict = {}
        if filters.typology:
            filter_dict['typology'] = filters.typology
        if filters.climate_bin:
            filter_dict['climate_bin'] = filters.climate_bin
        if filters.massing_type:
            filter_dict['massing_type'] = filters.massing_type
        
        # Get project attributes for exclusion filtering
        project_attrs = {}
        for pid in project_ids:
            attrs = self.attribute_features._get_project_attributes(pid)
            if attrs:
                project_attrs[pid] = attrs
        
        # Start with all projects if no inclusion filters, else apply inclusion filters
        if filter_dict:
            filtered_project_ids = set(self.attribute_features.apply_filters(project_ids, filter_dict))
        else:
            filtered_project_ids = set(project_ids)
        
        # Apply exclusion filters
        if filters.exclude_typology:
            exclude_set = set(filters.exclude_typology)
            filtered_project_ids = {
                pid for pid in filtered_project_ids
                if project_attrs.get(pid, {}).get('typology') not in exclude_set
            }
        
        if filters.exclude_climate_bin:
            exclude_set = set(filters.exclude_climate_bin)
            filtered_project_ids = {
                pid for pid in filtered_project_ids
                if project_attrs.get(pid, {}).get('climate_bin') not in exclude_set
            }
        
        if filters.exclude_massing_type:
            exclude_set = set(filters.exclude_massing_type)
            filtered_project_ids = {
                pid for pid in filtered_project_ids
                if project_attrs.get(pid, {}).get('massing_type') not in exclude_set
            }
        
        if filters.exclude_project_ids:
            exclude_set = set(filters.exclude_project_ids)
            filtered_project_ids -= exclude_set
        
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
    
    def get_explanation(self, query_vector: np.ndarray, image_id: str, project_id: str,
                        score: float = 0.0, weights: Optional[Weights] = None) -> Dict:
        """Generate explanation for why an image is similar.
        
        Args:
            query_vector: The query embedding vector
            image_id: ID of the result image
            project_id: ID of the result project
            score: The fusion score for this result
            weights: The weights used for scoring (to determine primary match type)
        
        Returns:
            Dict with explanation including match_reason, attributes, patch_match, etc.
        """
        explanation = {}
        
        # Get patch match if available
        has_patch_match = False
        if self.patch_features:
            patch_match = self.patch_features.get_best_patch_match(query_vector, image_id)
            if patch_match:
                explanation['patch_match'] = patch_match
                has_patch_match = True
        
        # Get attribute matches
        project_attrs = self.attribute_features._get_project_attributes(project_id)
        matched_attrs = []
        if project_attrs:
            explanation['attributes'] = project_attrs
            # Build list of matched attribute names for display
            for key, value in project_attrs.items():
                if value and value not in ['unknown', 'Unknown', '']:
                    matched_attrs.append(f"{key}: {value}")
        
        # Generate human-readable match reason based on dominant factor
        match_reason = self._generate_match_reason(
            score=score,
            weights=weights,
            has_patch_match=has_patch_match,
            matched_attrs=matched_attrs,
            project_attrs=project_attrs
        )
        explanation['match_reason'] = match_reason
        explanation['matched_attrs'] = matched_attrs
        
        return explanation
    
    def _generate_match_reason(self, score: float, weights: Optional[Weights],
                               has_patch_match: bool, matched_attrs: List[str],
                               project_attrs: Optional[Dict]) -> str:
        """Generate a human-readable match reason based on scoring factors.
        
        Args:
            score: The fusion score
            weights: The weights used for scoring
            has_patch_match: Whether a patch match was found
            matched_attrs: List of matched attribute strings
            project_attrs: Raw project attributes dict
        
        Returns:
            Human-readable explanation string
        """
        # Determine dominant match type from weights
        if weights:
            w_v, w_s, w_a = self.normalize_weights(weights)
            max_weight = max(w_v, w_s, w_a)
            
            if w_v == max_weight:
                if has_patch_match:
                    return "Strong visual detail match"
                elif score >= 0.8:
                    return "Very similar visual style"
                elif score >= 0.6:
                    return "Similar visual appearance"
                else:
                    return "Visual similarity"
            elif w_s == max_weight:
                return "Similar spatial layout"
            elif w_a == max_weight:
                # Build reason from matched attributes
                if project_attrs:
                    typology = project_attrs.get('typology', '')
                    climate = project_attrs.get('climate_bin', '')
                    if typology:
                        return f"Same typology: {typology}"
                    elif climate:
                        return f"Same climate zone: {climate}"
                return "Matching attributes"
        
        # Default case: balanced or no weights
        if has_patch_match:
            return "Matching architectural details"
        elif matched_attrs:
            return "Matching attributes"
        elif score >= 0.8:
            return "Highly similar"
        elif score >= 0.6:
            return "Similar project"
        else:
            return "Related project"
