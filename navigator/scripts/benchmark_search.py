#!/usr/bin/env python3
"""
Benchmark search performance with optional auto-generated gold standard.
Produces IR metrics (P@5, nDCG@10, mAP@10) and telemetry (embed/faiss/fusion/rerank).
"""
import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np

# Ensure package imports work when run as module
from navigator.tools.metrics import benchmark_search

# We will import app components lazily after aliasing 'app' to 'navigator.app'
from PIL import Image


def load_idmap_and_projects(store):
    return store._idmap, store._projects


def auto_generate_gold(store, num_queries: int, seed: int = 42) -> Dict[str, Any]:
    """
    Generate a simple gold standard:
      - Sample image_ids as queries
      - Relevant IDs: share typology OR climate_bin OR massing_type
    """
    rng = np.random.default_rng(seed)
    idmap, projects = load_idmap_and_projects(store)
    image_ids: List[str] = []
    faiss_ids = list(idmap.keys())
    if not faiss_ids:
        raise RuntimeError("ID map is empty; ensure embeddings and id_map.json exist.")
    # Collect all image_ids
    for idx in faiss_ids:
        meta = idmap[str(idx)]
        image_ids.append(meta.get("image_id"))
    image_ids = [i for i in image_ids if i]
    if not image_ids:
        raise RuntimeError("No image_ids found in id_map.")
    # Sample queries
    if num_queries > len(image_ids):
        num_queries = len(image_ids)
    sampled = rng.choice(image_ids, size=num_queries, replace=False).tolist()

    queries = []
    # Build reverse maps from project metadata
    if projects is None or projects.empty:
        # Fallback: consider same project_id as relevant
        for q in sampled:
            q_meta = None
            for meta in idmap.values():
                if meta.get("image_id") == q:
                    q_meta = meta
                    break
            pid = q_meta.get("project_id") if q_meta else None
            relevant = [m.get("image_id") for m in idmap.values() if m.get("project_id") == pid and m.get("image_id") != q]
            queries.append({"image_id": q, "relevant_ids": relevant})
        return {"queries": queries}

    # Projects df has rows keyed by project_id
    for q in sampled:
        # Find project_id and metadata row
        row = None
        pid = None
        for meta in idmap.values():
            if meta.get("image_id") == q:
                pid = meta.get("project_id")
                break
        if pid is not None and not projects.empty:
            hit = projects[projects["project_id"] == pid]
            if not hit.empty:
                row = hit.iloc[0].to_dict()
        # Collect relevant candidates
        relevant: List[str] = []
        typ = row.get("typology") if row else None
        clim = row.get("climate_bin") if row else None
        mass = row.get("massing_type") if row else None
        # Iterate idmap to find matches
        for meta in idmap.values():
            img = meta.get("image_id")
            if img == q:
                continue
            mpid = meta.get("project_id")
            # Get project row for candidate
            crow = None
            if mpid is not None and not projects.empty:
                h = projects[projects["project_id"] == mpid]
                if not h.empty:
                    crow = h.iloc[0].to_dict()
            if crow:
                if (typ and crow.get("typology") == typ) or (clim and crow.get("climate_bin") == clim) or (mass and crow.get("massing_type") == mass):
                    relevant.append(img)
        queries.append({"image_id": q, "relevant_ids": relevant})

    return {"queries": queries}


def build_run_query_fn(
    store,
    weights,
    top_k: int,
    rerank: bool,
    re_topk: int,
    patches: int,
    mode: Optional[str] = None,
):
    """
    Returns a function that accepts either a file path or an image_id and returns
    dict(results=list, timings=dict).
    """
    def _run(query: Union[str, Path]) -> Dict[str, Any]:
        # Determine query type
        embed_ms = 0
        if isinstance(query, Path) or (isinstance(query, str) and os.path.exists(str(query)) and not str(query).startswith("i_")):
            pil = Image.open(str(query))
            # Lazy import after alias
            from navigator.app.main import downsample_pil, embed_pil
            try:
                pil = downsample_pil(pil)
            except Exception:
                pass
            t_embed = time.time()
            qvec = embed_pil(pil)
            embed_ms = int((time.time() - t_embed) * 1000)
        else:
            # Treat as image_id; use stored embedding for speed
            qvec = store.vector_for_image(str(query))
            embed_ms = 0

        # FAISS shortlist
        search_k = max(top_k, re_topk) if rerank else top_k
        t_faiss = time.time()
        D, I = store.search(qvec, search_k)
        faiss_ms = int((time.time() - t_faiss) * 1000)
        hydrated = store.results_payload(D, I)

        # Spatial features disabled in benchmark by default
        query_spatial_features = None
        if mode == "plan" or mode == "true":
            # Optional: could compute from PIL on file path queries
            query_spatial_features = None

        # Fusion
        t_fuse = time.time()
        from navigator.app.main import fuse_and_sort, Filters
        fused_results, _debug = fuse_and_sort(hydrated, D, weights, Filters(), strict=False,
                                              query_spatial_features=query_spatial_features, store=store)
        fusion_ms = int((time.time() - t_fuse) * 1000)

        final_results = fused_results[:top_k]
        rerank_ms = 0
        if rerank:
            try:
                if isinstance(query, (str, Path)) and os.path.exists(str(query)):
                    pil_for_patches = Image.open(str(query))
                else:
                    # If we don't have a file path, skip patch rerank gracefully
                    pil_for_patches = None
                if pil_for_patches is not None:
                    t_rr = time.time()
                    from navigator.app.patches import compute_query_patches, rerank_by_patches
                    Q = compute_query_patches(pil_for_patches, grid=4)
                    reranked_results, _dbg = rerank_by_patches(
                        final_results, Q, re_topk, top_k, patches, settings.data_dir
                    )
                    rerank_ms = int((time.time() - t_rr) * 1000)
                    final_results = reranked_results
            except Exception:
                # Ignore patch errors in benchmark
                pass

        return {
            "results": final_results,
            "timings": {
                "embed_ms": embed_ms,
                "faiss_ms": faiss_ms,
                "fusion_ms": fusion_ms,
                "rerank_ms": rerank_ms,
            }
        }
    return _run


def write_csv(summary: Dict[str, Any], out_csv: Path):
    import csv
    fields = ["query_id", "p_at_5", "ndcg_at_10", "map_at_10", "embed_ms", "faiss_ms", "fusion_ms", "rerank_ms", "total_ms"]
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in summary["queries"]:
            w.writerow({k: row.get(k) for k in fields})


def main():
    parser = argparse.ArgumentParser(description="Run benchmark against Navigator search pipeline")
    parser.add_argument("--data-dir", default=None, help="Data directory (defaults to app settings)")
    parser.add_argument("--gold", default=None, help="Gold standard JSON path")
    parser.add_argument("--auto-gold", type=int, default=0, help="Auto-generate N queries for gold if no gold provided")
    parser.add_argument("--k", type=int, default=10, help="Evaluate up to top-k results")
    parser.add_argument("--weights", nargs=3, type=float, default=[1.0, 0.6, 0.25], help="visual spatial attr")
    parser.add_argument("--rerank", action="store_true", help="Enable patch rerank")
    parser.add_argument("--re-topk", type=int, default=50, help="Patch rerank shortlist")
    parser.add_argument("--patches", type=int, default=16, help="Number of patches used for rerank")
    parser.add_argument("--out-dir", default="navigator/reports", help="Output directory for reports")
    args = parser.parse_args()

    # Alias 'app' package name to 'navigator.app' to satisfy absolute imports in server modules
    import sys as _sys
    import importlib as _importlib
    nav_app = _importlib.import_module("navigator.app")
    _sys.modules.setdefault("app", nav_app)
    # Submodules we will need
    for sub in ("session", "faiss_service", "config", "patches"):
        _sys.modules.setdefault(f"app.{sub}", _importlib.import_module(f"navigator.app.{sub}"))

    from navigator.app.config import settings
    from navigator.app.faiss_service import FaissStore
    from navigator.app.main import get_store, Weights

    if args.data_dir:
        os.environ["DATA_DIR"] = args.data_dir
        settings.data_dir = args.data_dir  # type: ignore
        # Also update module-level DATA_DIR used by get_store()
        import navigator.app.main as app_main
        app_main.DATA_DIR = settings.data_dir  # type: ignore

    store = get_store()

    # Prepare weights
    w = Weights(visual=float(args.weights[0]), spatial=float(args.weights[1]), attr=float(args.weights[2]))

    # Prepare gold standard
    if args.gold:
        with open(args.gold, "r", encoding="utf-8") as f:
            gold = json.load(f)
    else:
        gold = auto_generate_gold(store, num_queries=max(args.auto_gold, 20) if args.auto_gold else 50)

    # Build runner
    run_query = build_run_query_fn(
        store=store,
        weights=w,
        top_k=args.k,
        rerank=args.rerank,
        re_topk=args.re_topk,
        patches=args.patches,
        mode=None,
    )

    # Run benchmark
    summary = benchmark_search(run_query, gold, k=args.k)

    # Write outputs
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = int(time.time())
    out_json = out_dir / f"benchmark_{ts}.json"
    out_csv = out_dir / f"benchmark_{ts}.csv"
    with out_json.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    write_csv(summary, out_csv)

    # Print summary
    s = summary["summary"]
    print(f"Queries: {len(summary['queries'])}")
    print(f"P@5: {s['p_at_5']:.3f}  nDCG@10: {s['ndcg_at_10']:.3f}  mAP@10: {s['map_at_10']:.3f}")
    print(f"Latency (ms) avg — embed: {s['embed_ms']:.1f}, faiss: {s['faiss_ms']:.1f}, fusion: {s['fusion_ms']:.1f}, rerank: {s['rerank_ms']:.1f}, total: {s['total_ms']:.1f}")
    print(f"Wrote: {out_json} and {out_csv}")


if __name__ == "__main__":
    main()


