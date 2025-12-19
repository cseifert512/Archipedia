#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Consolidate duplicate projects (exteriors/interiors/diagrams) into single entries.

This script:
1. Reads projects.csv
2. Groups projects by base name (removing _exteriors, _interiors, _diagrams suffixes)
3. Merges image_ids from all variants into one consolidated project
4. Outputs consolidated_projects.csv

Run BEFORE embed_text.py to avoid duplicate search results.

Usage:
    python navigator/scripts/consolidate_projects.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Set

import pandas as pd

THIS_DIR = Path(__file__).resolve().parent
DATA_DIR = THIS_DIR.parent / "data"
METADATA_DIR = DATA_DIR / "metadata"

INPUT_CSV = METADATA_DIR / "projects.csv"
OUTPUT_CSV = METADATA_DIR / "consolidated_projects.csv"

# Suffixes to strip when grouping
CATEGORY_SUFFIXES = [
    "_exteriors_",
    "_interiors_",
    "_diagrams_",
    "_exteriors",
    "_interiors",
    "_diagrams",
    " Exteriors ",
    " Interiors ",
    " Diagrams ",
    " Exteriors",
    " Interiors",
    " Diagrams",
]


def extract_base_project_id(project_id: str) -> str:
    """
    Extract the base project identifier by removing category suffixes.
    
    Example:
        p_codec_training_centre_kuakata_community_1034720_exteriors_... 
        -> p_codec_training_centre_kuakata_community_1034720
    """
    pid = project_id
    
    # Find the pattern: base_name_NUMBER_category_...
    # We want to keep: base_name_NUMBER
    
    # Look for _exteriors_, _interiors_, _diagrams_ and truncate there
    for suffix in ["_exteriors_", "_interiors_", "_diagrams_"]:
        if suffix in pid.lower():
            idx = pid.lower().find(suffix)
            pid = pid[:idx]
            break
    
    return pid


def extract_base_title(title: str) -> str:
    """
    Clean up title by removing category suffixes and duplicate text.
    
    Example:
        "Codec Training Centre Kuakata Community Exteriors P Codec Training..."
        -> "Codec Training Centre Kuakata"
    """
    t = title
    
    # Remove category words
    for suffix in [" Exteriors", " Interiors", " Diagrams"]:
        t = t.replace(suffix, "")
    
    # Remove " P " and everything after (often duplicate project name)
    if " P " in t:
        t = t.split(" P ")[0]
    
    # Remove trailing numbers (like project IDs)
    t = re.sub(r'\s+\d{6,}$', '', t)
    
    # Clean up whitespace
    t = ' '.join(t.split())
    
    return t.strip()


def parse_list_field(raw: Any) -> List[str]:
    """Parse a CSV list field that might be JSON-encoded."""
    if pd.isna(raw) or not str(raw).strip():
        return []
    
    s = str(raw).strip()
    
    # Try JSON parsing
    if s.startswith("["):
        try:
            val = json.loads(s.replace("'", '"'))
            return [str(x) for x in val if str(x).strip()]
        except:
            pass
    
    # Pipe-delimited
    if "|" in s:
        return [x.strip() for x in s.split("|") if x.strip()]
    
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Consolidate duplicate projects")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()
    
    if not INPUT_CSV.exists():
        print(f"ERROR: {INPUT_CSV} not found")
        return 1
    
    df = pd.read_csv(INPUT_CSV)
    print(f"Loaded {len(df)} project entries from {INPUT_CSV}")
    
    # Group by base project
    groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    
    for _, row in df.iterrows():
        project_id = str(row.get("project_id", ""))
        base_id = extract_base_project_id(project_id)
        groups[base_id].append(row.to_dict())
    
    print(f"Found {len(groups)} unique base projects")
    
    # Consolidate each group
    consolidated = []
    
    for base_id, variants in groups.items():
        # Take first variant as base, merge others
        base = variants[0].copy()
        
        # Collect all image_ids from all variants
        all_image_ids: List[str] = []
        all_plan_ids: List[str] = []
        categories: Set[str] = set()
        
        for v in variants:
            pid = str(v.get("project_id", ""))
            
            # Detect category
            if "_exteriors" in pid.lower():
                categories.add("exteriors")
            elif "_interiors" in pid.lower():
                categories.add("interiors")
            elif "_diagrams" in pid.lower():
                categories.add("diagrams")
            
            # Merge image_ids
            img_ids = parse_list_field(v.get("image_ids"))
            all_image_ids.extend(img_ids)
            
            # Merge plan_ids
            plan_ids = parse_list_field(v.get("plan_ids"))
            all_plan_ids.extend(plan_ids)
        
        # Build consolidated entry
        entry = {
            "project_id": base_id,
            "title": extract_base_title(str(base.get("title", ""))),
            "country": base.get("country"),
            "climate_bin": base.get("climate_bin"),
            "typology": base.get("typology"),
            "massing_type": base.get("massing_type"),
            "wwr_band": base.get("wwr_band"),
            "image_ids": json.dumps(all_image_ids),
            "plan_ids": json.dumps(all_plan_ids),
            "tags": base.get("tags", "[]"),
            "lat": base.get("lat"),
            "lon": base.get("lon"),
            "categories": ",".join(sorted(categories)),
            "variant_count": len(variants),
        }
        
        consolidated.append(entry)
    
    # Sort by title
    consolidated.sort(key=lambda x: x.get("title", ""))
    
    print(f"\nConsolidated to {len(consolidated)} unique projects")
    print(f"Reduction: {len(df)} -> {len(consolidated)} ({len(df) - len(consolidated)} duplicates removed)")
    
    # Show some examples
    print("\nSample consolidated projects:")
    for entry in consolidated[:5]:
        img_count = len(json.loads(entry["image_ids"]))
        print(f"  - {entry['title'][:50]}... ({img_count} images, {entry['categories']})")
    
    if args.dry_run:
        print("\n[DRY RUN] No files written")
        return 0
    
    # Write output
    out_df = pd.DataFrame(consolidated)
    out_df.to_csv(OUTPUT_CSV, index=False)
    print(f"\nWrote: {OUTPUT_CSV}")
    
    # Also update the original if requested
    print("\nNext steps:")
    print(f"  1. Review {OUTPUT_CSV}")
    print(f"  2. If good, replace projects.csv:")
    print(f"     copy {OUTPUT_CSV} {INPUT_CSV}")
    print(f"  3. Re-run embed_text.py:")
    print(f"     python scripts/embed_text.py --force")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

