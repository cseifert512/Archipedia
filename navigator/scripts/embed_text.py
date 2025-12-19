#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate text embeddings for all projects using OpenAI API.

This script:
1. Reads projects.csv (or projects_enriched.json if available)
2. Creates searchable text from title, typology, country, tags
3. Embeds each project's text using OpenAI text-embedding-3-small
4. Saves embeddings to navigator/data/embeddings/text/

Usage:
    python navigator/scripts/embed_text.py [--limit N] [--force]

Environment:
    OPENAI_API_KEY must be set
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

# Add parent directory to path for imports
THIS_DIR = Path(__file__).resolve().parent
NAVIGATOR_DIR = THIS_DIR.parent
sys.path.insert(0, str(NAVIGATOR_DIR))

from app.services.text_embedder import embed_texts_batch

DATA_DIR = NAVIGATOR_DIR / "data"
METADATA_DIR = DATA_DIR / "metadata"
EMBEDDINGS_DIR = DATA_DIR / "embeddings" / "text"

CSV_PATH = METADATA_DIR / "projects.csv"
ENRICHED_JSON = METADATA_DIR / "projects_enriched.json"

INDEX_PATH = EMBEDDINGS_DIR / "text_index.npz"
METADATA_PATH = EMBEDDINGS_DIR / "text_metadata.json"


def load_projects() -> List[Dict[str, Any]]:
    """Load projects from enriched JSON or CSV."""
    projects = []
    
    # Prefer enriched JSON if available
    if ENRICHED_JSON.exists():
        print(f"Loading from {ENRICHED_JSON}")
        with open(ENRICHED_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    
    # Fall back to CSV
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"No project data found at {CSV_PATH} or {ENRICHED_JSON}")
    
    print(f"Loading from {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)
    
    for _, row in df.iterrows():
        project = {
            "project_id": str(row.get("project_id", "")),
            "title": str(row.get("title", "")),
            "country": str(row.get("country", "")) if pd.notna(row.get("country")) else None,
            "typology": str(row.get("typology", "")) if pd.notna(row.get("typology")) else None,
            "climate_bin": str(row.get("climate_bin", "")) if pd.notna(row.get("climate_bin")) else None,
            "massing_type": str(row.get("massing_type", "")) if pd.notna(row.get("massing_type")) else None,
            "lat": float(row.get("lat", 0)) if pd.notna(row.get("lat")) else None,
            "lon": float(row.get("lon", 0)) if pd.notna(row.get("lon")) else None,
        }
        
        # Parse image_ids if present
        image_ids_raw = row.get("image_ids", "")
        if pd.notna(image_ids_raw) and str(image_ids_raw).strip():
            try:
                image_ids = json.loads(str(image_ids_raw).replace("'", '"'))
                project["image_ids"] = image_ids
            except:
                project["image_ids"] = []
        else:
            project["image_ids"] = []
            
        # Parse tags if present
        tags_raw = row.get("tags", "")
        if pd.notna(tags_raw) and str(tags_raw).strip():
            try:
                tags = json.loads(str(tags_raw).replace("'", '"'))
                project["tags"] = tags
            except:
                project["tags"] = []
        else:
            project["tags"] = []
            
        projects.append(project)
    
    return projects


def build_searchable_text(project: Dict[str, Any]) -> str:
    """
    Build searchable text from project metadata.
    Combines title, typology, country, tags, and narrative.
    """
    parts = []
    
    # Title is most important - clean it up
    title = project.get("title", "")
    if title:
        # Clean up auto-generated titles (remove IDs, underscores)
        clean_title = title.replace("_", " ")
        # Remove numeric suffixes like "1034548"
        import re
        clean_title = re.sub(r'\s+\d{6,}\s*', ' ', clean_title)
        clean_title = re.sub(r'\s+P\s+[A-Za-z].*$', '', clean_title, flags=re.IGNORECASE)
        clean_title = ' '.join(clean_title.split())  # Normalize whitespace
        parts.append(clean_title)
    
    # Typology
    typology = project.get("typology") or project.get("project_type")
    if typology and typology.lower() not in ("unknown", "none", ""):
        parts.append(f"Type: {typology}")
    
    # Country/location
    country = project.get("country")
    if country and country.lower() not in ("unknown", "none", ""):
        parts.append(f"Location: {country}")
        
    location = project.get("location")
    if location:
        parts.append(location)
    
    # Climate
    climate = project.get("climate_bin") or project.get("climate_zone")
    if climate and climate.lower() not in ("unknown", "none", ""):
        parts.append(f"Climate: {climate}")
    
    # Massing type
    massing = project.get("massing_type")
    if massing and massing.lower() not in ("unknown", "none", ""):
        parts.append(f"Massing: {massing}")
    
    # Tags
    tags = project.get("tags", [])
    if tags:
        parts.append("Tags: " + ", ".join(tags[:10]))
    
    # Key features
    features = project.get("key_features", [])
    if features:
        parts.append("Features: " + ", ".join(features[:5]))
    
    # Design narrative (from enrichment)
    narrative = project.get("design_narrative")
    if narrative:
        parts.append(narrative)
    
    # Architect
    architect = project.get("architect")
    if architect:
        parts.append(f"Architect: {architect}")
    
    return " | ".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate text embeddings for projects")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of projects")
    parser.add_argument("--force", action="store_true", help="Overwrite existing embeddings")
    parser.add_argument("--batch-size", type=int, default=50, help="Batch size for API calls")
    args = parser.parse_args()
    
    # Check for API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY environment variable is not set")
        print("Set it with: $env:OPENAI_API_KEY = 'sk-...'")
        return 1
    
    # Check if already exists
    if INDEX_PATH.exists() and not args.force:
        print(f"Text index already exists at {INDEX_PATH}")
        print("Use --force to regenerate")
        return 0
    
    # Load projects
    projects = load_projects()
    if args.limit:
        projects = projects[:args.limit]
    
    print(f"Processing {len(projects)} projects...")
    
    # Build searchable texts
    texts = []
    project_ids = []
    metadata = []
    
    for p in projects:
        text = build_searchable_text(p)
        if not text.strip():
            print(f"  Skipping {p.get('project_id')} - no searchable text")
            continue
            
        texts.append(text)
        project_ids.append(p["project_id"])
        
        # Store metadata for hydration
        meta = {
            "title": p.get("title"),
            "country": p.get("country"),
            "typology": p.get("typology") or p.get("project_type"),
            "climate_bin": p.get("climate_bin") or p.get("climate_zone"),
            "massing_type": p.get("massing_type"),
            "lat": p.get("lat"),
            "lon": p.get("lon"),
        }
        
        # Get first image as thumbnail
        image_ids = p.get("image_ids", [])
        if image_ids:
            first_image_id = image_ids[0] if isinstance(image_ids, list) else None
            if first_image_id:
                # Construct thumb URL based on project structure
                meta["thumb_url"] = f"/images/{p['project_id']}/{first_image_id.split('_')[-1]}.jpg"
        
        metadata.append(meta)
    
    print(f"Embedding {len(texts)} projects...")
    
    # Embed in batches
    all_embeddings = []
    for i in range(0, len(texts), args.batch_size):
        batch = texts[i:i + args.batch_size]
        print(f"  Batch {i // args.batch_size + 1}/{(len(texts) + args.batch_size - 1) // args.batch_size}")
        
        embeddings = embed_texts_batch(batch, batch_size=args.batch_size)
        all_embeddings.extend(embeddings)
        
        # Small delay to avoid rate limits
        time.sleep(0.1)
    
    # Filter out failed embeddings
    valid_indices = [i for i, e in enumerate(all_embeddings) if e is not None]
    
    if not valid_indices:
        print("ERROR: No embeddings were generated. Check your API key.")
        return 1
    
    print(f"Successfully embedded {len(valid_indices)}/{len(texts)} projects")
    
    # Stack valid embeddings
    embeddings_array = np.stack([all_embeddings[i] for i in valid_indices])
    valid_project_ids = [project_ids[i] for i in valid_indices]
    valid_texts = [texts[i] for i in valid_indices]
    valid_metadata = [metadata[i] for i in valid_indices]
    
    # Save to disk
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    
    np.savez(
        INDEX_PATH,
        embeddings=embeddings_array,
        project_ids=np.array(valid_project_ids)
    )
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "texts": valid_texts,
            "metadata": valid_metadata
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved:")
    print(f"  - {INDEX_PATH}")
    print(f"  - {METADATA_PATH}")
    print(f"\nEmbedding dimensions: {embeddings_array.shape}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

