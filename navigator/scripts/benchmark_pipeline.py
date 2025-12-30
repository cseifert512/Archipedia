#!/usr/bin/env python3
"""
Benchmark Pipeline class performance.
Tests batch operations improvement and measures search latency.

Usage:
    python -m navigator.scripts.benchmark_pipeline --queries 50 --k 50
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any

import numpy as np

# Ensure package imports work
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


def main():
    parser = argparse.ArgumentParser(description="Benchmark Pipeline class performance")
    parser.add_argument("--data-dir", default=None, help="Data directory (defaults to navigator/data)")
    parser.add_argument("--queries", type=int, default=50, help="Number of queries to run")
    parser.add_argument("--k", type=int, default=50, help="Top-k results per query")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--out-dir", default="navigator/reports", help="Output directory")
    args = parser.parse_args()

    # Setup imports
    from navigator.app.config import settings
    from navigator.app.services.index_store import IndexStore
    from navigator.app.services.features.spatial import SpatialFeatures
    from navigator.app.services.features.attributes import AttributeFeatures
    from navigator.app.services.features.patches import PatchFeatures
    from navigator.app.services.pipeline import Pipeline
    from navigator.app.models import Weights, Filters

    # Setup paths
    if args.data_dir:
        data_dir = Path(args.data_dir)
    else:
        data_dir = Path(__file__).parent.parent / "data"
    
    embeddings_dir = data_dir / "embeddings"
    
    print(f"Data directory: {data_dir}")
    print(f"Embeddings directory: {embeddings_dir}")
    
    # Initialize Pipeline components
    print("\nInitializing Pipeline components...")
    
    index_path = embeddings_dir / "index.faiss"
    idmap_path = embeddings_dir / "id_map.json"
    
    if not index_path.exists():
        print(f"ERROR: FAISS index not found at {index_path}")
        return
    
    index_store = IndexStore(index_path, idmap_path)
    print(f"  IndexStore: {index_store.get_total_vectors()} vectors, dim={index_store.get_dimension()}")
    
    metadata_csv = data_dir / "metadata" / "projects.csv"
    spatial_features = SpatialFeatures(data_dir / "plans")
    attribute_features = AttributeFeatures(str(metadata_csv))
    patch_features = None  # Skip patch features for benchmark
    
    pipeline = Pipeline(index_store, spatial_features, attribute_features, patch_features)
    print(f"  Pipeline initialized")
    
    # Generate random query vectors
    print(f"\nGenerating {args.queries} random query vectors...")
    rng = np.random.default_rng(args.seed)
    
    dim = index_store.get_dimension()
    query_vectors = rng.standard_normal((args.queries, dim)).astype(np.float32)
    
    # Normalize query vectors (L2 normalize)
    norms = np.linalg.norm(query_vectors, axis=1, keepdims=True)
    query_vectors = query_vectors / (norms + 1e-12)
    
    # Run benchmark
    print(f"\nRunning benchmark with k={args.k}...")
    
    weights = Weights(visual=1.0, spatial=0.6, attr=0.25)
    filters = Filters()
    
    latencies = []
    results_counts = []
    
    for i, query_vec in enumerate(query_vectors):
        t0 = time.perf_counter()
        results = pipeline.search(query_vec, filters, weights, k=args.k)
        t1 = time.perf_counter()
        
        latency_ms = (t1 - t0) * 1000
        latencies.append(latency_ms)
        results_counts.append(len(results))
        
        if (i + 1) % 10 == 0:
            print(f"  Completed {i + 1}/{args.queries} queries")
    
    # Compute statistics
    latencies = np.array(latencies)
    stats = {
        "num_queries": args.queries,
        "k": args.k,
        "latency_ms": {
            "mean": float(np.mean(latencies)),
            "median": float(np.median(latencies)),
            "p95": float(np.percentile(latencies, 95)),
            "p99": float(np.percentile(latencies, 99)),
            "min": float(np.min(latencies)),
            "max": float(np.max(latencies)),
            "std": float(np.std(latencies)),
        },
        "results_per_query": {
            "mean": float(np.mean(results_counts)),
            "min": int(np.min(results_counts)),
            "max": int(np.max(results_counts)),
        },
        "similarity_alpha": pipeline.SIMILARITY_ALPHA,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    # Print results
    print("\n" + "=" * 60)
    print("BENCHMARK RESULTS")
    print("=" * 60)
    print(f"Queries: {args.queries}")
    print(f"k: {args.k}")
    print(f"Similarity Alpha: {pipeline.SIMILARITY_ALPHA}")
    print()
    print("Latency (ms):")
    print(f"  Mean:   {stats['latency_ms']['mean']:.2f}")
    print(f"  Median: {stats['latency_ms']['median']:.2f}")
    print(f"  P95:    {stats['latency_ms']['p95']:.2f}")
    print(f"  P99:    {stats['latency_ms']['p99']:.2f}")
    print(f"  Min:    {stats['latency_ms']['min']:.2f}")
    print(f"  Max:    {stats['latency_ms']['max']:.2f}")
    print(f"  StdDev: {stats['latency_ms']['std']:.2f}")
    print()
    print(f"Results per query: {stats['results_per_query']['mean']:.1f} avg "
          f"(min={stats['results_per_query']['min']}, max={stats['results_per_query']['max']})")
    print("=" * 60)
    
    # Save results
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    ts = int(time.time())
    out_file = out_dir / f"pipeline_benchmark_{ts}.json"
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    
    print(f"\nResults saved to: {out_file}")


if __name__ == "__main__":
    main()


