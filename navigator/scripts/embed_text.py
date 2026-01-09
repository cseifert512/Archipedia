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
UNIFIED_JSON = METADATA_DIR / "projects_unified.json"
ENRICHED_JSON = METADATA_DIR / "projects_enriched.json"

INDEX_PATH = EMBEDDINGS_DIR / "text_index.npz"
METADATA_PATH = EMBEDDINGS_DIR / "text_metadata.json"


def load_projects() -> List[Dict[str, Any]]:
    """
    Load projects from available sources.
    Priority order:
    1. projects_unified.json (full merged dataset)
    2. projects.csv (primary CSV)
    3. projects_enriched.json (legacy enriched, smaller set)
    """
    projects = []
    
    # Priority 1: Unified JSON (full merged dataset - 669+ projects)
    if UNIFIED_JSON.exists():
        print(f"Loading from {UNIFIED_JSON} (unified dataset)")
        with open(UNIFIED_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    
    # Priority 2: Main CSV (should also have full dataset)
    if CSV_PATH.exists():
        print(f"Loading from {CSV_PATH}")
        return load_from_csv(CSV_PATH)
    
    # Priority 3: Enriched JSON (smaller set, ~158 projects)
    if ENRICHED_JSON.exists():
        print(f"Loading from {ENRICHED_JSON} (enriched subset)")
        with open(ENRICHED_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    
    raise FileNotFoundError(f"No project data found in {METADATA_DIR}")


def load_from_csv(csv_path: Path) -> List[Dict[str, Any]]:
    """Load projects from a CSV file with proper field parsing."""
    df = pd.read_csv(csv_path)
    projects = []
    
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
            "architect": str(row.get("architect", "")) if pd.notna(row.get("architect")) else None,
            "city": str(row.get("city", "")) if pd.notna(row.get("city")) else None,
            "description": str(row.get("description", "")) if pd.notna(row.get("description")) else None,
            "materials": str(row.get("materials", "")) if pd.notna(row.get("materials")) else None,
            "year_completed": str(row.get("year_completed", "")) if pd.notna(row.get("year_completed")) else None,
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
                # Handle both JSON arrays and pipe-delimited strings
                tags_str = str(tags_raw)
                if tags_str.startswith("["):
                    tags = json.loads(tags_str.replace("'", '"'))
                elif "|" in tags_str:
                    tags = [t.strip() for t in tags_str.split("|") if t.strip()]
                else:
                    tags = [t.strip() for t in tags_str.split(",") if t.strip()]
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
    Combines title, architect, typology, country, tags, description, and narrative.
    """
    import re
    parts = []
    
    # Title is most important - clean it up
    title = project.get("title", "")
    if title:
        # Clean up auto-generated titles (remove IDs, underscores)
        clean_title = title.replace("_", " ")
        # Remove numeric suffixes like "1034548"
        clean_title = re.sub(r'\s+\d{6,}\s*', ' ', clean_title)
        clean_title = re.sub(r'\s+P\s+[A-Za-z].*$', '', clean_title, flags=re.IGNORECASE)
        clean_title = ' '.join(clean_title.split())  # Normalize whitespace
        parts.append(clean_title)
    
    # Architect (important for search)
    architect = project.get("architect")
    if architect and architect.lower() not in ("unknown", "none", ""):
        parts.append(f"Architect: {architect}")
    
    # Typology
    typology = project.get("typology") or project.get("project_type")
    if typology and typology.lower() not in ("unknown", "none", ""):
        parts.append(f"Type: {typology}")
    
    # Country/location
    country = project.get("country")
    if country and country.lower() not in ("unknown", "none", ""):
        parts.append(f"Location: {country}")
    
    city = project.get("city")
    if city and city.lower() not in ("unknown", "none", ""):
        parts.append(f"City: {city}")
        
    location = project.get("location")
    if location:
        parts.append(location)
    
    # Year completed
    year = project.get("year_completed")
    if year and str(year).lower() not in ("unknown", "none", "", "0"):
        parts.append(f"Year: {year}")
    
    # Climate
    climate = project.get("climate_bin") or project.get("climate_zone")
    if climate and climate.lower() not in ("unknown", "none", ""):
        parts.append(f"Climate: {climate}")
    
    # Massing type
    massing = project.get("massing_type")
    if massing and massing.lower() not in ("unknown", "none", ""):
        parts.append(f"Massing: {massing}")
    
    # Materials
    materials = project.get("materials")
    if materials and materials.lower() not in ("unknown", "none", ""):
        parts.append(f"Materials: {materials}")
    
    # Tags (important for semantic search)
    tags = project.get("tags", [])
    if tags:
        if isinstance(tags, list):
            parts.append("Tags: " + ", ".join(str(t) for t in tags[:15]))
        elif isinstance(tags, str):
            parts.append(f"Tags: {tags}")
    
    # Key features
    features = project.get("key_features", [])
    if features:
        parts.append("Features: " + ", ".join(features[:5]))
    
    # Description (from ArchDaily - very valuable for search!)
    description = project.get("description")
    if description and len(str(description)) > 20:
        # Truncate very long descriptions to ~500 chars
        desc_text = str(description)[:500]
        parts.append(f"Description: {desc_text}")
    
    # Design narrative (from AI enrichment)
    narrative = project.get("design_narrative")
    if narrative:
        parts.append(narrative)
    
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
            "architect": p.get("architect"),
            "country": p.get("country"),
            "city": p.get("city"),
            "typology": p.get("typology") or p.get("project_type"),
            "climate_bin": p.get("climate_bin") or p.get("climate_zone"),
            "massing_type": p.get("massing_type"),
            "year_completed": p.get("year_completed"),
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

