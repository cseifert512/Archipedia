#!/usr/bin/env python3
"""
Basic metrics script for benchmarking search performance.
"""

import argparse
import json
import time
import numpy as np
from pathlib import Path
import sys

def load_gold_standard(gold_file: str) -> dict:
    """Load gold standard queries."""
    with open(gold_file, 'r') as f:
        return json.load(f)

def compute_precision_at_k(results: list, relevant_ids: list, k: int) -> float:
    """Compute precision at k."""
    if k == 0:
        return 0.0
    
    top_k_results = results[:k]
    relevant_found = sum(1 for result in top_k_results if result['image_id'] in relevant_ids)
    return relevant_found / k

def compute_ndcg_at_k(results: list, relevant_ids: list, k: int) -> float:
    """Compute nDCG at k (simplified)."""
    if k == 0:
        return 0.0
    
    # Simplified DCG calculation
    dcg = 0.0
    for i, result in enumerate(results[:k]):
        if result['image_id'] in relevant_ids:
            dcg += 1.0 / np.log2(i + 2)  # +2 because log2(1) = 0
    
    # Ideal DCG (all relevant items first)
    idcg = 0.0
    for i in range(min(len(relevant_ids), k)):
        idcg += 1.0 / np.log2(i + 2)
    
    return dcg / idcg if idcg > 0 else 0.0

def compute_map_at_k(results: list, relevant_ids: list, k: int) -> float:
    """
    Compute Mean Average Precision at k for a single query.
    results: list of dicts with key 'image_id'
    relevant_ids: list of relevant image_ids
    """
    if k == 0 or not relevant_ids:
        return 0.0
    hits = 0
    precisions = []
    for i, result in enumerate(results[:k], start=1):
        if result['image_id'] in relevant_ids:
            hits += 1
            precisions.append(hits / i)
    if not precisions:
        return 0.0
    # Average precision normalized by number of relevant items up to k
    denom = min(len(relevant_ids), k)
    return sum(precisions) / denom

def benchmark_search(run_query_fn, gold_standard: dict, k: int) -> dict:
    """Run benchmark on gold standard queries.
    run_query_fn(path_or_id) -> dict with fields: results (list of dict), timings (dict)
    """
    per_query = []
    for query in gold_standard['queries']:
        qid = query.get('query_id')
        qpath = query.get('path')
        qimage_id = query.get('image_id')
        relevant_ids = query.get('relevant_ids', [])

        t0 = time.time()
        out = run_query_fn(qpath or qimage_id)
        end_ms = (time.time() - t0) * 1000.0

        results = out.get('results', [])
        timings = out.get('timings', {})

        p5 = compute_precision_at_k(results, relevant_ids, min(5, k))
        ndcg10 = compute_ndcg_at_k(results, relevant_ids, min(10, k))
        map10 = compute_map_at_k(results, relevant_ids, min(10, k))

        per_query.append({
            "query_id": qid or (qimage_id or qpath),
            "p_at_5": p5,
            "ndcg_at_10": ndcg10,
            "map_at_10": map10,
            "embed_ms": timings.get("embed_ms"),
            "faiss_ms": timings.get("faiss_ms"),
            "fusion_ms": timings.get("fusion_ms"),
            "rerank_ms": timings.get("rerank_ms"),
            "total_ms": end_ms,
        })

    # Aggregate
    def _avg(key: str):
        vals = [row[key] for row in per_query if row.get(key) is not None]
        return float(np.mean(vals)) if vals else 0.0

    summary = {
        "queries": per_query,
        "summary": {
            "p_at_5": _avg("p_at_5"),
            "ndcg_at_10": _avg("ndcg_at_10"),
            "map_at_10": _avg("map_at_10"),
            "embed_ms": _avg("embed_ms"),
            "faiss_ms": _avg("faiss_ms"),
            "fusion_ms": _avg("fusion_ms"),
            "rerank_ms": _avg("rerank_ms"),
            "total_ms": _avg("total_ms"),
        }
    }
    return summary

def main():
    parser = argparse.ArgumentParser(description="Benchmark search performance")
    parser.add_argument("--gold", required=True, help="Path to gold standard JSON file")
    parser.add_argument("--k", type=int, default=10, help="Number of results to evaluate")
    
    args = parser.parse_args()
    
    # Load gold standard
    if not Path(args.gold).exists():
        print(f"Gold standard file not found: {args.gold}")
        sys.exit(1)
    
    gold_standard = load_gold_standard(args.gold)
    
    print(f"Benchmarking with k={args.k}, weights={args.weights}")
    print(f"Loaded {len(gold_standard.get('queries', []))} queries")
    
    # Note: This CLI main is a thin wrapper; actual benchmarking with pipeline is provided
    # by navigator/scripts/benchmark_search.py
    print("Use navigator/scripts/benchmark_search.py to run benchmarks against the live pipeline.")

if __name__ == "__main__":
    main()
