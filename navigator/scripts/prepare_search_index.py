#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive search index preparation script.

This script does everything needed to build a high-quality text search index:
1. Consolidates duplicate projects (exteriors/interiors/diagrams → single entry)
2. Enriches metadata using OpenAI (typology, country, architect, description)
3. Generates text embeddings for semantic search

Usage:
    python navigator/scripts/prepare_search_index.py

Environment:
    OPENAI_API_KEY must be set

Output:
    - data/metadata/enriched_projects.csv (enriched metadata)
    - data/embeddings/text/text_index.npz (embeddings)
    - data/embeddings/text/text_metadata.json (searchable text + metadata)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import numpy as np
import pandas as pd
import requests

THIS_DIR = Path(__file__).resolve().parent
NAVIGATOR_DIR = THIS_DIR.parent
sys.path.insert(0, str(NAVIGATOR_DIR))

DATA_DIR = NAVIGATOR_DIR / "data"
METADATA_DIR = DATA_DIR / "metadata"
EMBEDDINGS_DIR = DATA_DIR / "embeddings" / "text"

INPUT_CSV = METADATA_DIR / "projects.csv"
ENRICHED_CSV = METADATA_DIR / "enriched_projects.csv"
INDEX_PATH = EMBEDDINGS_DIR / "text_index.npz"
METADATA_PATH = EMBEDDINGS_DIR / "text_metadata.json"


# =============================================================================
# Step 1: Consolidation
# =============================================================================

def extract_base_project_id(project_id: str) -> str:
    """Extract base project ID by removing category suffixes."""
    pid = project_id
    for suffix in ["_exteriors_", "_interiors_", "_diagrams_"]:
        if suffix in pid.lower():
            idx = pid.lower().find(suffix)
            pid = pid[:idx]
            break
    return pid


def extract_base_title(title: str) -> str:
    """Clean up title by removing category suffixes and duplicates."""
    t = title
    for suffix in [" Exteriors", " Interiors", " Diagrams"]:
        t = t.replace(suffix, "")
    if " P " in t:
        t = t.split(" P ")[0]
    t = re.sub(r'\s+\d{6,}$', '', t)
    return ' '.join(t.split()).strip()


def parse_list_field(raw: Any) -> List[str]:
    """Parse a CSV list field."""
    if pd.isna(raw) or not str(raw).strip():
        return []
    s = str(raw).strip()
    if s.startswith("["):
        try:
            return [str(x) for x in json.loads(s.replace("'", '"')) if str(x).strip()]
        except:
            pass
    if "|" in s:
        return [x.strip() for x in s.split("|") if x.strip()]
    return []


def consolidate_projects(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Consolidate duplicate project entries."""
    groups: Dict[str, List[Dict]] = defaultdict(list)
    
    for _, row in df.iterrows():
        project_id = str(row.get("project_id", ""))
        base_id = extract_base_project_id(project_id)
        groups[base_id].append(row.to_dict())
    
    consolidated = []
    for base_id, variants in groups.items():
        base = variants[0].copy()
        
        all_image_ids = []
        categories = set()
        
        for v in variants:
            pid = str(v.get("project_id", ""))
            if "_exteriors" in pid.lower():
                categories.add("exteriors")
            elif "_interiors" in pid.lower():
                categories.add("interiors")
            elif "_diagrams" in pid.lower():
                categories.add("diagrams")
            
            all_image_ids.extend(parse_list_field(v.get("image_ids")))
        
        entry = {
            "project_id": base_id,
            "title": extract_base_title(str(base.get("title", ""))),
            "country": base.get("country") if str(base.get("country", "")).lower() != "unknown" else None,
            "climate_bin": base.get("climate_bin") if str(base.get("climate_bin", "")).lower() != "unknown" else None,
            "typology": base.get("typology") if str(base.get("typology", "")).lower() != "unknown" else None,
            "massing_type": base.get("massing_type") if str(base.get("massing_type", "")).lower() != "unknown" else None,
            "image_ids": all_image_ids,
            "lat": base.get("lat") if pd.notna(base.get("lat")) and float(base.get("lat", 0)) != 0 else None,
            "lon": base.get("lon") if pd.notna(base.get("lon")) and float(base.get("lon", 0)) != 0 else None,
            "categories": list(categories),
        }
        consolidated.append(entry)
    
    return consolidated


# =============================================================================
# Step 2: LLM Enrichment
# =============================================================================

ENRICHMENT_PROMPT = """You are an architecture expert. Given a project title, infer the following metadata. 
Be conservative - only provide values you're confident about based on the title.
If unsure, use null.

Project title: "{title}"
Coordinates: lat={lat}, lon={lon}

Respond with JSON only:
{{
    "typology": "string - building type like: library, school, museum, church, housing, office, cultural center, community center, kindergarten, university, etc. or null",
    "country": "string - country name or null",
    "city": "string - city name if identifiable or null", 
    "architect": "string - architect/firm name if in title or null",
    "climate": "string - one of: tropical, arid, temperate, continental, polar, or null",
    "description": "string - 1-2 sentence description of what this building likely is, based on the title",
    "keywords": ["array", "of", "relevant", "search", "keywords"]
}}"""


def enrich_with_llm(project: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Use OpenAI to enrich project metadata."""
    title = project.get("title", "")
    lat = project.get("lat")
    lon = project.get("lon")
    
    prompt = ENRICHMENT_PROMPT.format(title=title, lat=lat, lon=lon)
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an architecture metadata expert. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 500,
            },
            timeout=30,
        )
        response.raise_for_status()
        
        content = response.json()["choices"][0]["message"]["content"]
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        enriched = json.loads(content.strip())
        return enriched
        
    except Exception as e:
        print(f"    LLM enrichment failed: {e}")
        return {}


def enrich_projects(projects: List[Dict], api_key: str, batch_delay: float = 0.2) -> List[Dict]:
    """Enrich all projects with LLM-inferred metadata."""
    enriched = []
    
    for i, project in enumerate(projects, 1):
        print(f"  [{i}/{len(projects)}] {project['title'][:50]}...")
        
        llm_data = enrich_with_llm(project, api_key)
        
        # Merge LLM data with existing (LLM fills gaps, doesn't overwrite)
        project["typology"] = project.get("typology") or llm_data.get("typology")
        project["country"] = project.get("country") or llm_data.get("country")
        project["city"] = llm_data.get("city")
        project["architect"] = llm_data.get("architect")
        project["climate_bin"] = project.get("climate_bin") or llm_data.get("climate")
        project["description"] = llm_data.get("description")
        project["keywords"] = llm_data.get("keywords", [])
        
        enriched.append(project)
        time.sleep(batch_delay)  # Rate limiting
    
    return enriched


# =============================================================================
# Step 3: Text Embedding
# =============================================================================

def build_searchable_text(project: Dict[str, Any]) -> str:
    """Build rich searchable text from enriched project data."""
    parts = []
    
    # Title
    title = project.get("title", "")
    if title:
        parts.append(title)
    
    # Typology
    typology = project.get("typology")
    if typology:
        parts.append(f"Type: {typology}")
    
    # Location
    city = project.get("city")
    country = project.get("country")
    location_parts = [x for x in [city, country] if x]
    if location_parts:
        parts.append(f"Location: {', '.join(location_parts)}")
    
    # Architect
    architect = project.get("architect")
    if architect:
        parts.append(f"Architect: {architect}")
    
    # Climate
    climate = project.get("climate_bin")
    if climate:
        parts.append(f"Climate: {climate}")
    
    # Description
    description = project.get("description")
    if description:
        parts.append(description)
    
    # Keywords
    keywords = project.get("keywords", [])
    if keywords:
        parts.append("Keywords: " + ", ".join(keywords[:10]))
    
    # Categories (exteriors, interiors, diagrams)
    categories = project.get("categories", [])
    if categories:
        parts.append(f"Images: {', '.join(categories)}")
    
    return " | ".join(parts)


def embed_texts_batch(texts: List[str], api_key: str, batch_size: int = 50) -> List[Optional[np.ndarray]]:
    """Embed texts using OpenAI API."""
    results: List[Optional[np.ndarray]] = [None] * len(texts)
    
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
                    "model": "text-embedding-3-small",
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
            print(f"    Embedding batch {i} failed: {e}")
    
    return results


def generate_embeddings(projects: List[Dict], api_key: str) -> tuple:
    """Generate embeddings for all projects."""
    texts = []
    project_ids = []
    metadata = []
    
    for p in projects:
        text = build_searchable_text(p)
        if not text.strip():
            continue
        
        texts.append(text)
        project_ids.append(p["project_id"])
        
        # Build thumbnail URL from first image
        thumb_url = None
        image_ids = p.get("image_ids", [])
        if image_ids:
            # Try to construct a valid path
            first_img = image_ids[0]
            # The image path structure: /images/{project_id}_category/{image_file}
            # We need to find the actual folder
            thumb_url = f"/images/{p['project_id']}_exteriors_{p['project_id']}/{first_img.split('_')[-1]}.jpg"
        
        meta = {
            "title": p.get("title"),
            "country": p.get("country"),
            "city": p.get("city"),
            "typology": p.get("typology"),
            "architect": p.get("architect"),
            "climate_bin": p.get("climate_bin"),
            "description": p.get("description"),
            "keywords": p.get("keywords", []),
            "lat": p.get("lat"),
            "lon": p.get("lon"),
            "image_count": len(image_ids),
            "thumb_url": thumb_url,
        }
        metadata.append(meta)
    
    print(f"\nEmbedding {len(texts)} projects...")
    embeddings = embed_texts_batch(texts, api_key)
    
    # Filter successful embeddings
    valid = [(i, e) for i, e in enumerate(embeddings) if e is not None]
    
    return (
        np.stack([e for _, e in valid]),
        [project_ids[i] for i, _ in valid],
        [texts[i] for i, _ in valid],
        [metadata[i] for i, _ in valid],
    )


# =============================================================================
# Main
# =============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare search index with LLM enrichment")
    parser.add_argument("--skip-enrichment", action="store_true", help="Skip LLM enrichment step")
    parser.add_argument("--limit", type=int, help="Limit number of projects to process")
    args = parser.parse_args()
    
    # Check API key
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set")
        print("Set with: $env:OPENAI_API_KEY = 'sk-...'")
        return 1
    
    # Load and consolidate
    print("=" * 60)
    print("Step 1: Loading and consolidating projects")
    print("=" * 60)
    
    df = pd.read_csv(INPUT_CSV)
    print(f"Loaded {len(df)} entries from {INPUT_CSV}")
    
    projects = consolidate_projects(df)
    print(f"Consolidated to {len(projects)} unique projects")
    
    if args.limit:
        projects = projects[:args.limit]
        print(f"Limited to {len(projects)} projects")
    
    # Enrich with LLM
    if not args.skip_enrichment:
        print("\n" + "=" * 60)
        print("Step 2: Enriching with LLM")
        print("=" * 60)
        
        projects = enrich_projects(projects, api_key)
        
        # Save enriched data
        METADATA_DIR.mkdir(parents=True, exist_ok=True)
        
        # Flatten for CSV
        csv_rows = []
        for p in projects:
            row = p.copy()
            row["image_ids"] = json.dumps(row.get("image_ids", []))
            row["categories"] = ",".join(row.get("categories", []))
            row["keywords"] = ",".join(row.get("keywords", []))
            csv_rows.append(row)
        
        pd.DataFrame(csv_rows).to_csv(ENRICHED_CSV, index=False)
        print(f"\nSaved enriched data to {ENRICHED_CSV}")
    
    # Generate embeddings
    print("\n" + "=" * 60)
    print("Step 3: Generating text embeddings")
    print("=" * 60)
    
    embeddings, project_ids, texts, metadata = generate_embeddings(projects, api_key)
    
    # Save
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    
    np.savez(INDEX_PATH, embeddings=embeddings, project_ids=np.array(project_ids))
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump({"texts": texts, "metadata": metadata}, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved:")
    print(f"  - {INDEX_PATH}")
    print(f"  - {METADATA_PATH}")
    print(f"\nEmbedding shape: {embeddings.shape}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    typology_counts = defaultdict(int)
    country_counts = defaultdict(int)
    for p in projects:
        if p.get("typology"):
            typology_counts[p["typology"]] += 1
        if p.get("country"):
            country_counts[p["country"]] += 1
    
    print(f"\nTop typologies:")
    for t, c in sorted(typology_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {t}: {c}")
    
    print(f"\nTop countries:")
    for t, c in sorted(country_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {t}: {c}")
    
    print("\n✓ Search index ready!")
    print("  Text search will now work with enriched metadata.")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

