#!/usr/bin/env python3
"""
Master Merge & Rebuild Pipeline
================================

This script consolidates all project data sources into a single unified dataset
and regenerates all embeddings and search indices.

Data Sources Merged:
1. navigator/data/metadata/projects.csv (primary)
2. navigator/data/metadata/projects_import.csv (if exists)
3. Arch-Circare-v2/navigator/data/metadata/projects.csv (legacy)
4. Individual project JSON files in metadata/

Output:
- data/metadata/projects_unified.csv (merged dataset)
- data/embeddings/text/ (regenerated text embeddings)
- data/embeddings/image/ (regenerated image embeddings)
- data/embeddings/index.faiss (rebuilt search index)

Usage:
    # Dry run - preview merge without writing
    python scripts/master_merge_rebuild.py --dry-run

    # Merge only (no embedding regeneration)
    python scripts/master_merge_rebuild.py --merge-only

    # Full rebuild (merge + embeddings + FAISS)
    python scripts/master_merge_rebuild.py --full

    # Just regenerate embeddings (skip merge)
    python scripts/master_merge_rebuild.py --embeddings-only
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import pandas as pd

# Setup paths
THIS_DIR = Path(__file__).resolve().parent
NAVIGATOR_DIR = THIS_DIR.parent
PROJECT_ROOT = NAVIGATOR_DIR.parent
DATA_DIR = NAVIGATOR_DIR / "data"
METADATA_DIR = DATA_DIR / "metadata"

# Data sources
PRIMARY_CSV = METADATA_DIR / "projects.csv"
IMPORT_CSV = METADATA_DIR / "projects_import.csv"
LEGACY_DIR = PROJECT_ROOT / "Arch-Circare-v2" / "navigator" / "data" / "metadata"
LEGACY_CSV = LEGACY_DIR / "projects.csv"
LEGACY_ENRICHED = LEGACY_DIR / "projects_enriched.json"

# Output paths
UNIFIED_CSV = METADATA_DIR / "projects_unified.csv"
BACKUP_DIR = METADATA_DIR / "backups"

# Image captions
CAPTIONS_FILE = METADATA_DIR / "image_captions.jsonl"


def load_csv_projects(csv_path: Path, source_name: str) -> List[Dict[str, Any]]:
    """Load projects from a CSV file."""
    if not csv_path.exists():
        print(f"  [SKIP] {source_name}: file not found")
        return []
    
    try:
        df = pd.read_csv(csv_path)
        projects = df.to_dict('records')
        print(f"  [OK] {source_name}: {len(projects)} projects")
        return projects
    except Exception as e:
        print(f"  [ERROR] {source_name}: {e}")
        return []


def load_json_projects(json_path: Path, source_name: str) -> List[Dict[str, Any]]:
    """Load projects from a JSON file."""
    if not json_path.exists():
        print(f"  [SKIP] {source_name}: file not found")
        return []
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            projects = json.load(f)
        print(f"  [OK] {source_name}: {len(projects)} projects")
        return projects
    except Exception as e:
        print(f"  [ERROR] {source_name}: {e}")
        return []


def load_jsonl_projects(jsonl_path: Path, source_name: str) -> List[Dict[str, Any]]:
    """Load projects from a JSONL file."""
    if not jsonl_path.exists():
        print(f"  [SKIP] {source_name}: file not found")
        return []
    
    try:
        projects = []
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    projects.append(json.loads(line))
        print(f"  [OK] {source_name}: {len(projects)} projects")
        return projects
    except Exception as e:
        print(f"  [ERROR] {source_name}: {e}")
        return []


def load_individual_jsons(metadata_dir: Path) -> List[Dict[str, Any]]:
    """Load individual project JSON files from metadata directory."""
    projects = []
    json_files = list(metadata_dir.glob("p_*.json"))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            
            # Convert camelCase keys to snake_case and normalize schema
            project = {}
            
            # project_id (handle both formats)
            project['project_id'] = (
                raw.get('project_id') or 
                raw.get('projectId') or 
                json_file.stem
            )
            
            # title (handle both formats, extract from projectTitle if needed)
            title = raw.get('title') or raw.get('projectTitle') or ''
            if title:
                # Clean up title: "Project Name / Architect" -> extract both
                if ' / ' in title:
                    parts = title.split(' / ')
                    project['title'] = parts[0].strip()
                    if len(parts) > 1 and not raw.get('architect'):
                        project['architect'] = parts[1].strip()
                else:
                    project['title'] = title
            
            # URL
            project['archdaily_url'] = raw.get('archdaily_url') or raw.get('projectUrl')
            
            # Image counts for reference
            ext_count = raw.get('exteriorCount', 0)
            int_count = raw.get('interiorCount', 0)
            project['image_count'] = ext_count + int_count
            
            # File structure - build image_ids list
            file_struct = raw.get('fileStructure', {})
            image_ids = []
            for img in file_struct.get('exteriors', []):
                image_ids.append(f"i_{img.replace('.jpg', '').replace('.png', '')}")
            for img in file_struct.get('interiors', []):
                image_ids.append(f"i_{img.replace('.jpg', '').replace('.png', '')}")
            if image_ids:
                project['image_ids'] = image_ids
            
            # Copy over any other standard fields that exist
            for key in ['country', 'city', 'typology', 'architect', 'description', 
                        'tags', 'lat', 'lon', 'year_completed', 'materials']:
                if key in raw and raw[key]:
                    project[key] = raw[key]
            
            projects.append(project)
        except Exception as e:
            print(f"    Warning: Could not load {json_file.name}: {e}")
    
    if projects:
        print(f"  [OK] Individual JSONs: {len(projects)} projects")
    return projects


def is_null_value(val) -> bool:
    """Check if a value is null/NaN, handling arrays and scalars."""
    if val is None:
        return True
    if isinstance(val, (list, tuple)):
        return len(val) == 0
    if isinstance(val, str):
        return val.strip() == '' or val.lower() in ('nan', 'none', 'null')
    try:
        # Handle numpy/pandas NaN
        import numpy as np
        if isinstance(val, (float, np.floating)) and np.isnan(val):
            return True
    except (ImportError, TypeError, ValueError):
        pass
    try:
        if pd.isna(val):
            return True
    except (TypeError, ValueError):
        # pd.isna fails on arrays - that means it's not null
        pass
    return False


def normalize_project(project: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Normalize a project record to a standard schema."""
    # Standard fields we want to preserve
    standard_fields = [
        'project_id', 'title', 'country', 'climate_bin', 'typology',
        'massing_type', 'wwr_band', 'image_ids', 'plan_ids', 'tags',
        'lat', 'lon', 'architect', 'city', 'description', 'materials',
        'year_completed', 'building_area_sqm', 'floors_above_ground',
        'archdaily_url', 'image_count', 'imported_at', 'source_folder',
        'design_narrative', 'key_features', 'location'
    ]
    
    normalized = {}
    for field in standard_fields:
        if field in project:
            val = project[field]
            # Handle NaN/None
            if is_null_value(val):
                normalized[field] = None
            else:
                normalized[field] = val
    
    # Add source tracking
    normalized['_source'] = source
    normalized['_merged_at'] = datetime.now().isoformat()
    
    return normalized


def merge_projects(
    projects_list: List[List[Dict[str, Any]]],
    sources: List[str]
) -> List[Dict[str, Any]]:
    """
    Merge multiple project lists, deduplicating by project_id.
    Later sources override earlier ones for same project_id.
    """
    merged = {}
    stats = {source: {'total': 0, 'new': 0, 'updated': 0} for source in sources}
    
    for projects, source in zip(projects_list, sources):
        stats[source]['total'] = len(projects)
        
        for project in projects:
            pid = project.get('project_id')
            if not pid:
                continue
            
            normalized = normalize_project(project, source)
            
            if pid in merged:
                # Merge fields - prefer non-null values from new source
                existing = merged[pid]
                for key, value in normalized.items():
                    if value is not None and (
                        key not in existing or 
                        existing[key] is None or
                        str(existing[key]).lower() in ('unknown', 'none', '')
                    ):
                        existing[key] = value
                stats[source]['updated'] += 1
            else:
                merged[pid] = normalized
                stats[source]['new'] += 1
    
    return list(merged.values()), stats


def collect_all_sources() -> tuple[List[List[Dict[str, Any]]], List[str]]:
    """Collect projects from all available sources."""
    print("\n" + "=" * 60)
    print("COLLECTING DATA SOURCES")
    print("=" * 60)
    
    all_projects = []
    sources = []
    
    # 1. Primary CSV
    primary = load_csv_projects(PRIMARY_CSV, "Primary projects.csv")
    if primary:
        all_projects.append(primary)
        sources.append("primary_csv")
    
    # 2. Import CSV (if exists)
    imported = load_csv_projects(IMPORT_CSV, "Import projects_import.csv")
    if imported:
        all_projects.append(imported)
        sources.append("import_csv")
    
    # 3. Legacy data
    legacy = load_csv_projects(LEGACY_CSV, "Legacy Arch-Circare-v2/projects.csv")
    if legacy:
        all_projects.append(legacy)
        sources.append("legacy_csv")
    
    # 4. Legacy enriched JSON
    legacy_enriched = load_json_projects(LEGACY_ENRICHED, "Legacy enriched JSON")
    if legacy_enriched:
        all_projects.append(legacy_enriched)
        sources.append("legacy_enriched")
    
    # 5. Individual project JSONs
    individual = load_individual_jsons(METADATA_DIR)
    if individual:
        all_projects.append(individual)
        sources.append("individual_jsons")
    
    return all_projects, sources


def backup_existing_files():
    """Create backups of existing data files."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    files_to_backup = [
        PRIMARY_CSV,
        METADATA_DIR / "projects_enriched.json",
        METADATA_DIR / "projects_enriched.csv",
    ]
    
    backed_up = []
    for file_path in files_to_backup:
        if file_path.exists():
            backup_path = BACKUP_DIR / f"{file_path.stem}_{timestamp}{file_path.suffix}"
            shutil.copy2(file_path, backup_path)
            backed_up.append(backup_path.name)
    
    if backed_up:
        print(f"\nBacked up to {BACKUP_DIR}:")
        for f in backed_up:
            print(f"  - {f}")


def write_unified_csv(projects: List[Dict[str, Any]], output_path: Path):
    """Write unified projects to CSV."""
    # Remove internal tracking fields
    clean_projects = []
    for p in projects:
        clean = {k: v for k, v in p.items() if not k.startswith('_')}
        clean_projects.append(clean)
    
    df = pd.DataFrame(clean_projects)
    
    # Reorder columns - most important first
    priority_cols = [
        'project_id', 'title', 'architect', 'country', 'city',
        'typology', 'climate_bin', 'year_completed', 'description',
        'image_ids', 'tags', 'lat', 'lon', 'archdaily_url'
    ]
    
    # Get all columns, prioritized first
    all_cols = list(df.columns)
    ordered_cols = [c for c in priority_cols if c in all_cols]
    ordered_cols += [c for c in all_cols if c not in priority_cols]
    
    df = df[ordered_cols]
    df.to_csv(output_path, index=False)
    print(f"\nWrote: {output_path}")
    print(f"  Total projects: {len(df)}")


def write_unified_json(projects: List[Dict[str, Any]], output_path: Path):
    """Write unified projects to JSON."""
    clean_projects = []
    for p in projects:
        clean = {k: v for k, v in p.items() if not k.startswith('_')}
        clean_projects.append(clean)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(clean_projects, f, ensure_ascii=False, indent=2)
    print(f"Wrote: {output_path}")


def run_embedding_pipeline(steps: List[str], force: bool = False):
    """Run the embedding generation pipeline."""
    import subprocess
    
    python = sys.executable
    
    for step in steps:
        print(f"\n{'='*60}")
        print(f"STEP: {step.upper()}")
        print(f"{'='*60}")
        
        if step == 'text':
            cmd = [python, str(THIS_DIR / "embed_text.py")]
            if force:
                cmd.append("--force")
        elif step == 'images':
            cmd = [python, str(THIS_DIR / "embed_images.py"), 
                   "--data_dir", str(DATA_DIR)]
        elif step == 'faiss':
            cmd = [python, str(THIS_DIR / "build_faiss.py"),
                   "--data_dir", str(DATA_DIR)]
        else:
            print(f"Unknown step: {step}")
            continue
        
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, cwd=str(NAVIGATOR_DIR))
        
        if result.returncode != 0:
            print(f"WARNING: {step} step returned non-zero exit code")


def print_summary(merged: List[Dict[str, Any]], stats: Dict):
    """Print merge statistics."""
    print("\n" + "=" * 60)
    print("MERGE SUMMARY")
    print("=" * 60)
    
    print("\nSource Statistics:")
    for source, s in stats.items():
        print(f"  {source}:")
        print(f"    Total: {s['total']}, New: {s['new']}, Updated: {s['updated']}")
    
    print(f"\nUnified Dataset:")
    print(f"  Total unique projects: {len(merged)}")
    
    # Count by country
    countries = {}
    for p in merged:
        country = p.get('country') or 'Unknown'
        countries[country] = countries.get(country, 0) + 1
    
    print(f"\n  Projects by country (top 10):")
    for country, count in sorted(countries.items(), key=lambda x: -x[1])[:10]:
        print(f"    {country}: {count}")
    
    # Count with images
    with_images = sum(1 for p in merged if p.get('image_ids'))
    print(f"\n  With images: {with_images}")
    print(f"  Without images: {len(merged) - with_images}")


def main():
    parser = argparse.ArgumentParser(
        description="Master merge and rebuild pipeline for Archipedia",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview what will be merged
  python scripts/master_merge_rebuild.py --dry-run

  # Merge datasets only
  python scripts/master_merge_rebuild.py --merge-only

  # Full rebuild (merge + all embeddings)
  python scripts/master_merge_rebuild.py --full

  # Regenerate embeddings without re-merging
  python scripts/master_merge_rebuild.py --embeddings-only

  # Just rebuild text embeddings
  python scripts/master_merge_rebuild.py --text-only
"""
    )
    
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview merge without writing files")
    parser.add_argument("--merge-only", action="store_true",
                        help="Only merge data, don't regenerate embeddings")
    parser.add_argument("--full", action="store_true",
                        help="Full rebuild: merge + text + images + FAISS")
    parser.add_argument("--embeddings-only", action="store_true",
                        help="Regenerate embeddings without merging")
    parser.add_argument("--text-only", action="store_true",
                        help="Only regenerate text embeddings")
    parser.add_argument("--faiss-only", action="store_true",
                        help="Only rebuild FAISS index")
    parser.add_argument("--no-backup", action="store_true",
                        help="Skip creating backups")
    parser.add_argument("--force", action="store_true",
                        help="Force regenerate embeddings even if they exist")
    parser.add_argument("--apply", action="store_true",
                        help="Apply unified CSV as new primary projects.csv")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("ARCHIPEDIA MASTER MERGE & REBUILD")
    print("=" * 60)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Data directory: {DATA_DIR}")
    
    start_time = time.time()
    
    # === STEP 1: Collect and Merge ===
    if not args.embeddings_only and not args.faiss_only and not args.text_only:
        # Collect all sources
        all_projects, sources = collect_all_sources()
        
        if not all_projects:
            print("\nERROR: No project data found!")
            return 1
        
        # Merge
        print("\n" + "=" * 60)
        print("MERGING DATASETS")
        print("=" * 60)
        
        merged, stats = merge_projects(all_projects, sources)
        
        # Print summary
        print_summary(merged, stats)
        
        if args.dry_run:
            print("\n[DRY RUN] No files written.")
            return 0
        
        # Backup existing files
        if not args.no_backup:
            backup_existing_files()
        
        # Write unified files
        print("\n" + "=" * 60)
        print("WRITING OUTPUT FILES")
        print("=" * 60)
        
        write_unified_csv(merged, UNIFIED_CSV)
        write_unified_json(merged, METADATA_DIR / "projects_unified.json")
        
        # Optionally apply as new primary
        if args.apply:
            print("\nApplying as new primary projects.csv...")
            shutil.copy2(UNIFIED_CSV, PRIMARY_CSV)
            print(f"  Copied {UNIFIED_CSV.name} -> {PRIMARY_CSV.name}")
    
    # === STEP 2: Regenerate Embeddings ===
    if args.merge_only:
        print("\n[MERGE ONLY] Skipping embedding regeneration.")
    elif args.full or args.embeddings_only or args.text_only or args.faiss_only:
        steps = []
        
        if args.full or args.embeddings_only:
            steps = ['text', 'images', 'faiss']
        elif args.text_only:
            steps = ['text']
        elif args.faiss_only:
            steps = ['faiss']
        
        if steps:
            print("\n" + "=" * 60)
            print("REGENERATING EMBEDDINGS")
            print("=" * 60)
            print(f"Steps: {' -> '.join(steps)}")
            
            run_embedding_pipeline(steps, force=args.force)
    
    # === Final Summary ===
    duration = time.time() - start_time
    print("\n" + "=" * 60)
    print("COMPLETE")
    print("=" * 60)
    print(f"Total time: {duration:.1f}s ({duration/60:.1f}m)")
    
    if not args.dry_run and not args.embeddings_only:
        print("\nNext steps:")
        print("  1. Review: projects_unified.csv")
        print("  2. Apply as primary: --apply flag or manually copy")
        print("  3. Regenerate embeddings: --full or --embeddings-only")
        print("  4. Restart the backend server")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

