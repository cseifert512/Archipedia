#!/usr/bin/env python3
"""
Update Text Search Index with Enriched Project Data

Reads the enriched project data and updates text_metadata.json
with comprehensive searchable text for each project.

Usage:
    python scripts/update_text_index.py
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def build_searchable_text(project: Dict) -> str:
    """Build comprehensive searchable text from enriched project data."""
    parts = []
    
    # Title and architect (high weight)
    if project.get("title_clean"):
        parts.append(project["title_clean"])
    if project.get("architect"):
        parts.append(f"Architect: {project['architect']}")
    if project.get("architect_full") and project["architect_full"] != project.get("architect"):
        parts.append(project["architect_full"])
    
    # Location
    location_parts = []
    if project.get("city"):
        location_parts.append(project["city"])
    if project.get("region"):
        location_parts.append(project["region"])
    if project.get("country"):
        location_parts.append(project["country"])
    if location_parts:
        parts.append(f"Location: {', '.join(location_parts)}")
    if project.get("continent"):
        parts.append(project["continent"])
    
    # Building type
    if project.get("typology"):
        parts.append(f"Type: {project['typology']}")
    if project.get("typology_secondary"):
        parts.append(f"Secondary type: {project['typology_secondary']}")
    if project.get("building_use"):
        parts.append(f"Use: {project['building_use']}")
    if project.get("program"):
        parts.append(project["program"])
    
    # Design characteristics
    if project.get("massing_type"):
        parts.append(f"Massing: {project['massing_type']}")
    if project.get("circulation_type"):
        parts.append(f"Circulation: {project['circulation_type']}")
    if project.get("spatial_organization"):
        parts.append(project["spatial_organization"])
    if project.get("structural_system"):
        parts.append(f"Structure: {project['structural_system']}")
    
    # Materials
    materials = []
    if project.get("facade_material_primary"):
        materials.append(project["facade_material_primary"])
    if project.get("facade_material_secondary"):
        materials.append(project["facade_material_secondary"])
    if project.get("interior_materials"):
        materials.extend(project["interior_materials"])
    if materials:
        parts.append(f"Materials: {', '.join(set(materials))}")
    
    # Climate
    if project.get("climate_bin"):
        parts.append(f"Climate: {project['climate_bin']}")
    if project.get("climate_zone_koppen"):
        parts.append(f"Köppen: {project['climate_zone_koppen']}")
    
    # Context
    if project.get("urban_context"):
        parts.append(f"Context: {project['urban_context']}")
    if project.get("site_conditions"):
        parts.append(project["site_conditions"])
    if project.get("landscape_integration"):
        parts.append(project["landscape_integration"])
    
    # Sustainability
    if project.get("sustainability_features"):
        parts.append(f"Sustainability: {', '.join(project['sustainability_features'])}")
    if project.get("passive_strategies"):
        parts.append(f"Passive strategies: {', '.join(project['passive_strategies'])}")
    if project.get("certifications"):
        parts.append(f"Certifications: {', '.join(project['certifications'])}")
    
    # Description
    if project.get("description_short"):
        parts.append(project["description_short"])
    if project.get("description_long"):
        parts.append(project["description_long"])
    if project.get("design_concept"):
        parts.append(f"Concept: {project['design_concept']}")
    
    # Notable features
    if project.get("notable_features"):
        parts.append(f"Features: {', '.join(project['notable_features'])}")
    
    # Visual characteristics
    if project.get("exterior_characteristics"):
        parts.append(f"Exterior: {', '.join(project['exterior_characteristics'][:5])}")
    if project.get("interior_characteristics"):
        parts.append(f"Interior: {', '.join(project['interior_characteristics'][:5])}")
    
    # Year
    if project.get("year_completed"):
        parts.append(f"Completed: {project['year_completed']}")
    
    # Tags (very important for search)
    if project.get("tags"):
        parts.append(f"Keywords: {', '.join(project['tags'])}")
    
    # Image types
    image_ids = project.get("image_ids", [])
    image_types = set()
    for img_id in image_ids:
        if 'exterior' in img_id.lower():
            image_types.add('exteriors')
        if 'interior' in img_id.lower():
            image_types.add('interiors')
        if 'diagram' in img_id.lower():
            image_types.add('diagrams')
    if image_types:
        parts.append(f"Images: {', '.join(image_types)}")
    
    return " | ".join(parts)


def load_enriched_projects(enriched_file: Path) -> List[Dict]:
    """Load enriched projects from JSONL file."""
    projects = []
    if not enriched_file.exists():
        print(f"Enriched file not found: {enriched_file}")
        return projects
    
    with open(enriched_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                try:
                    projects.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    
    print(f"Loaded {len(projects)} enriched projects")
    return projects


def load_existing_text_metadata(text_meta_file: Path) -> Dict:
    """Load existing text metadata."""
    if not text_meta_file.exists():
        return {"texts": [], "project_ids": [], "metadata": []}
    
    with open(text_meta_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Handle both old format (just texts) and new format
    if isinstance(data, dict) and "texts" in data:
        return data
    elif isinstance(data, list):
        return {"texts": data, "project_ids": [], "metadata": []}
    else:
        return {"texts": [], "project_ids": [], "metadata": []}


def main():
    data_dir = Path(__file__).parent.parent / "data"
    
    # Load enriched projects
    enriched_file = data_dir / "metadata" / "projects_enriched.jsonl"
    enriched_projects = load_enriched_projects(enriched_file)
    
    if not enriched_projects:
        print("No enriched projects found. Run enrich_projects_ai.py first.")
        return
    
    # Build new text entries
    new_texts = []
    new_project_ids = []
    new_metadata = []
    
    for project in enriched_projects:
        project_id = project.get("project_id", "")
        if not project_id:
            continue
        
        # Build searchable text
        searchable_text = build_searchable_text(project)
        
        new_texts.append(searchable_text)
        new_project_ids.append(project_id)
        
        # Store metadata for hydration
        new_metadata.append({
            "project_id": project_id,
            "title": project.get("title_clean") or project.get("title", ""),
            "architect": project.get("architect", ""),
            "country": project.get("country", ""),
            "city": project.get("city", ""),
            "typology": project.get("typology", ""),
            "climate_bin": project.get("climate_bin", ""),
            "massing_type": project.get("massing_type", ""),
            "wwr_band": project.get("wwr_band", ""),
            "year_completed": project.get("year_completed", 0),
            "tags": project.get("tags", []),
            "description_short": project.get("description_short", ""),
            "thumb_url": f"https://pub-96a82c12e12a4f05b29760410a5e8f45.r2.dev/thumbs/{project.get('image_ids', [''])[0]}.jpg" if project.get("image_ids") else None,
            "latitude": project.get("latitude", 0),
            "longitude": project.get("longitude", 0),
        })
    
    print(f"Generated {len(new_texts)} searchable text entries")
    
    # Save updated text metadata
    output_file = data_dir / "embeddings" / "text" / "text_metadata_enriched.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "texts": new_texts,
            "project_ids": new_project_ids,
            "metadata": new_metadata
        }, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Saved to: {output_file}")
    
    # Show sample
    print("\nSample searchable text (first entry):")
    print("-" * 60)
    print(new_texts[0][:500] + "..." if len(new_texts[0]) > 500 else new_texts[0])
    
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("1. Run embed_text.py to generate embeddings for the new texts")
    print("2. Rebuild the FAISS index with build_faiss.py")
    print("=" * 60)


if __name__ == "__main__":
    main()

