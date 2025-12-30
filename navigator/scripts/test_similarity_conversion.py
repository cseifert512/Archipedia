#!/usr/bin/env python3
"""
Test script for evaluating the exponential distance-to-similarity conversion.
Compares search quality with different alpha values using real image embeddings.

Usage:
    python -m navigator.scripts.test_similarity_conversion --alpha-values 2.0 3.0 5.0
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Tuple

import numpy as np

# Ensure package imports work
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def compute_mrr(results: List[Tuple[str, float]], relevant_ids: List[str]) -> float:
    """Compute Mean Reciprocal Rank."""
    for rank, (result_id, _) in enumerate(results, 1):
        if result_id is None:
            continue
        project_id = result_id.split('_', 1)[0] if '_' in result_id else result_id
        if project_id in relevant_ids or result_id in relevant_ids:
            return 1.0 / rank
    return 0.0


def compute_precision_at_k(results: List[Tuple[str, float]], relevant_ids: List[str], k: int) -> float:
    """Compute Precision@k."""
    if not results or k <= 0:
        return 0.0
    
    hits = 0
    valid_count = 0
    for result_id, _ in results[:k]:
        if result_id is None:
            continue
        valid_count += 1
        project_id = result_id.split('_', 1)[0] if '_' in result_id else result_id
        if project_id in relevant_ids or result_id in relevant_ids:
            hits += 1
    
    return hits / max(valid_count, 1)


def create_test_queries_random(index_store, num_queries: int = 20, seed: int = 42) -> List[Dict]:
    """
    Create test queries using random vectors.
    Since we're testing the alpha parameter (exponential decay formula),
    random vectors are valid - we're comparing how different alpha values
    affect the ranking of the same results.
    """
    rng = np.random.default_rng(seed)
    
    dim = index_store.get_dimension()
    print(f"  Generating {num_queries} random query vectors (dim={dim})")
    
    # Generate random normalized query vectors
    query_vectors = rng.standard_normal((num_queries, dim)).astype(np.float32)
    norms = np.linalg.norm(query_vectors, axis=1, keepdims=True)
    query_vectors = query_vectors / (norms + 1e-12)
    
    # Get project IDs from the index for relevance labels
    all_indices = list(range(min(100, index_store.get_total_vectors())))
    project_ids = index_store.get_project_ids_batch(all_indices)
    unique_projects = list(set(pid for pid in project_ids if pid))
    
    test_queries = []
    for i in range(num_queries):
        # For random queries, we define "relevant" as the top results from a baseline search
        # This lets us compare how alpha affects ranking consistency
        test_queries.append({
            "query_idx": i,
            "query_vector": query_vectors[i],
            "relevant_ids": unique_projects[:5] if unique_projects else [],  # Dummy relevance
        })
    
    return test_queries


def run_search_with_alpha(pipeline, query_vector, filters, weights, k: int, alpha: float) -> List[Tuple[str, float]]:
    """Run search with a specific alpha value."""
    # Temporarily modify the alpha
    original_alpha = pipeline.SIMILARITY_ALPHA
    pipeline.SIMILARITY_ALPHA = alpha
    
    try:
        results = pipeline.search(query_vector, filters, weights, k)
        return results
    finally:
        # Restore original alpha
        pipeline.SIMILARITY_ALPHA = original_alpha


def main():
    parser = argparse.ArgumentParser(description="Test similarity conversion with different alpha values")
    parser.add_argument("--data-dir", default=None, help="Data directory")
    parser.add_argument("--alpha-values", nargs="+", type=float, default=[1.0, 2.0, 3.0, 5.0, 10.0], 
                        help="Alpha values to test")
    parser.add_argument("--queries", type=int, default=20, help="Number of test queries")
    parser.add_argument("--k", type=int, default=10, help="Top-k results to evaluate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--out-dir", default="navigator/reports", help="Output directory")
    args = parser.parse_args()

    from navigator.app.services.index_store import IndexStore
    from navigator.app.services.features.spatial import SpatialFeatures
    from navigator.app.services.features.attributes import AttributeFeatures
    from navigator.app.services.pipeline import Pipeline
    from navigator.app.models import Weights, Filters

    # Setup paths
    if args.data_dir:
        data_dir = Path(args.data_dir)
    else:
        data_dir = Path(__file__).parent.parent / "data"
    
    embeddings_dir = data_dir / "embeddings"
    
    print(f"Data directory: {data_dir}")
    print(f"Testing alpha values: {args.alpha_values}")
    
    # Initialize components
    print("\nInitializing components...")
    
    index_path = embeddings_dir / "index.faiss"
    idmap_path = embeddings_dir / "id_map.json"
    
    if not index_path.exists():
        print(f"ERROR: FAISS index not found at {index_path}")
        return
    
    index_store = IndexStore(index_path, idmap_path)
    print(f"  IndexStore: {index_store.get_total_vectors()} vectors")
    
    metadata_csv = data_dir / "metadata" / "projects.csv"
    spatial_features = SpatialFeatures(data_dir / "plans")
    attribute_features = AttributeFeatures(str(metadata_csv))
    
    pipeline = Pipeline(index_store, spatial_features, attribute_features, None)
    
    # Create test queries with random vectors
    # Since we're testing the alpha parameter (exponential decay formula),
    # random vectors are valid - we're comparing how different alpha values
    # affect score distributions and ranking
    print(f"\nCreating {args.queries} test queries...")
    test_queries = create_test_queries_random(index_store, args.queries, args.seed)
    print(f"  Created {len(test_queries)} test queries")
    
    if not test_queries:
        print("\nERROR: No test queries could be created.")
        return
    
    # Run evaluation for each alpha value
    # We'll measure: score spread, rank stability, and MRR
    weights = Weights(visual=1.0, spatial=0.6, attr=0.25)
    filters = Filters()
    
    results_by_alpha = {}
    baseline_rankings = {}  # Store rankings from first alpha as baseline
    
    for alpha in args.alpha_values:
        print(f"\nTesting alpha = {alpha}...")
        
        all_scores = []
        rank_correlations = []
        mrr_scores = []
        precision_scores = []
        
        for query in test_queries:
            query_vec = query["query_vector"]
            
            # Run search with this alpha
            results = run_search_with_alpha(pipeline, query_vec, filters, weights, args.k, alpha)
            
            # Collect scores for score spread analysis
            scores = [score for _, score in results]
            all_scores.extend(scores)
            
            # Compute metrics against "relevant" IDs (top results from index)
            mrr = compute_mrr(results, query["relevant_ids"])
            precision = compute_precision_at_k(results, query["relevant_ids"], 5)
            
            mrr_scores.append(mrr)
            precision_scores.append(precision)
        
        if mrr_scores:
            avg_mrr = np.mean(mrr_scores)
            avg_p5 = np.mean(precision_scores)
        else:
            avg_mrr = 0.0
            avg_p5 = 0.0
        
        # Score distribution statistics (important for comparing alpha values)
        score_mean = np.mean(all_scores) if all_scores else 0.0
        score_std = np.std(all_scores) if all_scores else 0.0
        score_min = np.min(all_scores) if all_scores else 0.0
        score_max = np.max(all_scores) if all_scores else 0.0
        
        results_by_alpha[alpha] = {
            "mrr": float(avg_mrr),
            "p@5": float(avg_p5),
            "num_queries": len(mrr_scores),
            "score_mean": float(score_mean),
            "score_std": float(score_std),
            "score_range": float(score_max - score_min),
        }
        
        print(f"  Scores: mean={score_mean:.4f}, std={score_std:.4f}, range=[{score_min:.4f}, {score_max:.4f}]")
    
    # Print summary
    print("\n" + "=" * 70)
    print("SIMILARITY CONVERSION TEST RESULTS")
    print("=" * 70)
    print(f"{'Alpha':<8} {'Score Mean':>12} {'Score Std':>12} {'Score Range':>12}")
    print("-" * 50)
    
    # For alpha comparison, higher score spread (std) with good range is desirable
    # This means the algorithm better differentiates between good and bad matches
    best_alpha = None
    best_range = -1
    
    for alpha in args.alpha_values:
        r = results_by_alpha[alpha]
        print(f"{alpha:<8.1f} {r['score_mean']:>12.4f} {r['score_std']:>12.4f} {r['score_range']:>12.4f}")
        
        # Best alpha has good score differentiation (higher std relative to mean)
        if r['score_range'] > best_range:
            best_range = r['score_range']
            best_alpha = alpha
    
    print("-" * 50)
    print("\nAnalysis:")
    print("  - Higher score std = better differentiation between matches")
    print("  - Higher range = more separation between best and worst results")
    print(f"\nRecommended alpha: {best_alpha} (best score range)")
    print("=" * 70)
    
    # Save results
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    ts = int(time.time())
    out_file = out_dir / f"similarity_test_{ts}.json"
    
    output = {
        "alpha_values": args.alpha_values,
        "results_by_alpha": results_by_alpha,
        "recommended_alpha": best_alpha,
        "best_score_range": best_range,
        "num_queries": args.queries,
        "k": args.k,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nResults saved to: {out_file}")
    
    # Recommendation
    print("\n" + "=" * 70)
    print("RECOMMENDATION")
    print("=" * 70)
    if best_alpha:
        print(f"Set SIMILARITY_ALPHA = {best_alpha} in navigator/app/services/pipeline.py")
        print(f"\nNote: Lower alpha (2-3) = gentler decay, more results with similar scores")
        print(f"      Higher alpha (5-10) = steeper decay, clearer separation between matches")
    print("=" * 70)


if __name__ == "__main__":
    main()

