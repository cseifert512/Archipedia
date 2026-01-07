#!/usr/bin/env python3
"""
Import New Architecture Dataset Script

This script imports a new image dataset with the following structure:
    <project_folder>/
        images/
            *.jpg, *.jpeg, *.png (and *.gif to remove)
        metadata/
            metadata.json (or similar)

Outputs:
    - Copies images to navigator/data/images/<project_id>/
    - Creates/appends to navigator/data/metadata/projects.csv
    - Removes GIF files
    - Generates unique project_ids from folder names

Usage:
    python scripts/import_dataset.py --source /path/to/new_dataset --dry-run
    python scripts/import_dataset.py --source /path/to/new_dataset
"""

import os
import sys
import json
import csv
import re
import shutil
import argparse
import unicodedata
import io
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def slugify(text: str, max_length: int = 50) -> str:
    """
    Convert text to URL-safe slug.
    - Lowercase
    - Replace spaces/special chars with underscores
    - Remove non-alphanumeric chars
    - Truncate to max_length
    """
    if not text:
        return "unknown"
    
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Lowercase and replace spaces
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '_', text)
    text = re.sub(r'_+', '_', text)
    text = text.strip('_')
    
    # Truncate
    if len(text) > max_length:
        text = text[:max_length].rstrip('_')
    
    return text or "unknown"


def extract_archdaily_id(url: str) -> str:
    """Extract numeric ID from ArchDaily URL."""
    if not url:
        return ""
    
    # Pattern: https://www.archdaily.com/1036976/...
    match = re.search(r'archdaily\.com/(\d+)', url)
    if match:
        return match.group(1)
    return ""


def generate_project_id(metadata: Dict, folder_name: str) -> str:
    """Generate a unique project_id from metadata."""
    # Try to get title first
    title = metadata.get('title', '')
    architect = metadata.get('architect', '')
    archdaily_id = extract_archdaily_id(metadata.get('url', ''))
    
    if title:
        # Parse title - often formatted as "Project Name / Architect Name"
        title_parts = title.split('/')
        project_name = slugify(title_parts[0].strip())
    else:
        project_name = slugify(folder_name)
    
    # Add architect if not in title
    if architect and slugify(architect) not in project_name:
        architect_slug = slugify(architect)[:20]
        project_name = f"{project_name}_{architect_slug}"
    
    # Add ArchDaily ID if available
    if archdaily_id:
        project_id = f"p_{project_name}_{archdaily_id}"
    else:
        # Generate a hash-based suffix for uniqueness
        import hashlib
        hash_suffix = hashlib.md5(folder_name.encode()).hexdigest()[:6]
        project_id = f"p_{project_name}_{hash_suffix}"
    
    return project_id


def parse_location(location: str) -> Tuple[str, str]:
    """Parse location string into (city, country)."""
    if not location:
        return ("unknown", "unknown")
    
    parts = [p.strip() for p in location.split(',')]
    if len(parts) >= 2:
        # Last part is typically country
        country = parts[-1]
        city = parts[-2] if len(parts) > 1 else "unknown"
        return (city, country)
    else:
        return ("unknown", location)


def clean_tags(tags: List[str]) -> str:
    """Clean and format tags list for CSV."""
    if not tags:
        return ""
    
    # Filter out generic ArchDaily navigation tags
    skip_tags = {
        'City Guides', 'Sustainability', 'Materials', 'Technology',
        'What is Good Architecture?', 'Top 100', 'Next Practices',
        'Pritzker Prize', 'Content', 'Projects', 'Built Projects',
        'Selected Projects', 'Residential Architecture', 'Houses',
        'Aga Khan Award for Architecture', 'Mies Crown Hall Americas Prize',
        'EUmies Awards', 'Obel Foundation', 'Holcim Awards',
        'German Design Council', 'Expo 2025 Osaka', 'Milan Design Week 2025',
        'Venice Architecture Biennale 2025', 'UIA World Congress of Architects 2026',
        'SustainabilityTechnologyMaterialsMetaverse', 'Metaverse'
    }
    
    cleaned = []
    for tag in tags:
        tag = tag.strip()
        if tag and tag not in skip_tags:
            cleaned.append(tag)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tags = []
    for tag in cleaned:
        if tag.lower() not in seen:
            seen.add(tag.lower())
            unique_tags.append(tag)
    
    return '|'.join(unique_tags)


def find_metadata_file(metadata_dir: Path) -> Optional[Path]:
    """Find the metadata JSON file in the metadata directory."""
    if not metadata_dir.exists():
        return None
    
    # Look for common metadata file names
    for pattern in ['*.json', 'metadata.json', 'info.json', 'project.json']:
        files = list(metadata_dir.glob(pattern))
        if files:
            return files[0]
    
    return None


def load_metadata(metadata_path: Path) -> Dict:
    """Load and parse metadata JSON file."""
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  Warning: Failed to load metadata from {metadata_path}: {e}")
        return {}


def get_image_files(images_dir: Path) -> List[Path]:
    """Get all valid image files (exclude GIFs)."""
    if not images_dir.exists():
        return []
    
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    gif_count = 0
    
    images = []
    for f in images_dir.iterdir():
        if f.is_file():
            ext = f.suffix.lower()
            if ext == '.gif':
                gif_count += 1
                continue  # Skip GIFs
            if ext in valid_extensions:
                images.append(f)
    
    if gif_count > 0:
        print(f"  Skipped {gif_count} GIF file(s)")
    
    return sorted(images)


def copy_image(src: Path, dst: Path, dry_run: bool = False) -> bool:
    """Copy an image file to destination."""
    if dry_run:
        return True
    
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        return True
    except Exception as e:
        print(f"  Error copying {src}: {e}")
        return False


def process_project_folder(
    project_folder: Path,
    output_images_dir: Path,
    dry_run: bool = False
) -> Optional[Dict]:
    """
    Process a single project folder.
    
    Returns project metadata dict or None if failed.
    """
    folder_name = project_folder.name
    
    # Find subdirectories - check common naming patterns
    images_dir = None
    metadata_dir = None
    
    # First, check for exact matches
    for subdir_name in ['project_images', 'images', 'Images', 'photos', 'Photos']:
        candidate = project_folder / subdir_name
        if candidate.exists() and candidate.is_dir():
            images_dir = candidate
            break
    
    for subdir_name in ['project_metadata', 'metadata', 'Metadata', 'meta', 'data']:
        candidate = project_folder / subdir_name
        if candidate.exists() and candidate.is_dir():
            metadata_dir = candidate
            break
    
    # Fallback: scan for matching patterns
    if images_dir is None or metadata_dir is None:
        for subdir in project_folder.iterdir():
            if subdir.is_dir():
                subdir_lower = subdir.name.lower()
                if images_dir is None and ('image' in subdir_lower or subdir_lower == 'photos'):
                    images_dir = subdir
                elif metadata_dir is None and ('meta' in subdir_lower or subdir_lower == 'data'):
                    metadata_dir = subdir
    
    # If no subdirs, check if images are directly in folder
    if images_dir is None:
        # Check for images directly in project folder
        direct_images = list(project_folder.glob('*.jpg')) + list(project_folder.glob('*.jpeg')) + list(project_folder.glob('*.png'))
        if direct_images:
            images_dir = project_folder
    
    if images_dir is None:
        print(f"  No images directory found in {folder_name}")
        return None
    
    # Load metadata
    metadata = {}
    if metadata_dir:
        metadata_file = find_metadata_file(metadata_dir)
        if metadata_file:
            metadata = load_metadata(metadata_file)
        else:
            # Try loading all JSON files and merge
            for json_file in metadata_dir.glob('*.json'):
                metadata.update(load_metadata(json_file))
    
    # Generate project ID
    project_id = generate_project_id(metadata, folder_name)
    
    # Get image files
    image_files = get_image_files(images_dir)
    if not image_files:
        print(f"  No valid images found in {folder_name}")
        return None
    
    print(f"  Found {len(image_files)} images")
    
    # Copy images
    image_ids = []
    project_output_dir = output_images_dir / project_id
    
    for i, img_path in enumerate(image_files, 1):
        # Create new filename: image_1.jpg, image_2.jpg, etc.
        ext = img_path.suffix.lower()
        if ext == '.jpeg':
            ext = '.jpg'
        new_name = f"{project_id}_image_{i:02d}{ext}"
        dst_path = project_output_dir / new_name
        
        if copy_image(img_path, dst_path, dry_run):
            # Image ID format matches existing convention
            image_id = f"i_{project_id}_{project_id}_image_{i:02d}"
            image_ids.append(image_id)
    
    # Parse location
    city, country = parse_location(metadata.get('location', ''))
    
    # Build project record
    project_record = {
        'project_id': project_id,
        'title': metadata.get('title', folder_name.replace('_', ' ').title()),
        'country': country,
        'city': city,
        'architect': metadata.get('architect', 'Unknown'),
        'year_completed': metadata.get('year', ''),
        'description': metadata.get('description', ''),
        'tags': clean_tags(metadata.get('tags', [])),
        'archdaily_url': metadata.get('url', ''),
        'image_ids': str(image_ids),
        'image_count': len(image_ids),
        'imported_at': datetime.now().isoformat(),
        'source_folder': folder_name,
        # Placeholders for enrichment
        'climate_bin': 'unknown',
        'typology': 'unknown',
        'massing_type': 'unknown',
        'wwr_band': 'unknown',
        'plan_ids': '[]',
        'lat': 0.0,
        'lon': 0.0,
        'materials': '',
        'building_area_sqm': 0.0,
        'floors_above_ground': 0,
    }
    
    return project_record


def scan_source_directory(source_dir: Path) -> List[Path]:
    """Scan source directory for project folders."""
    project_folders = []
    
    for item in source_dir.iterdir():
        if item.is_dir():
            # Skip __MACOSX and hidden folders
            if item.name.startswith('__') or item.name.startswith('.'):
                continue
            
            # Check if it looks like a project folder
            has_images = any(
                (item / subdir).exists() 
                for subdir in ['project_images', 'images', 'Images', 'photos', 'Photos']
            ) or list(item.glob('*.jpg')) or list(item.glob('*.png'))
            
            if has_images:
                project_folders.append(item)
    
    return sorted(project_folders)


def load_existing_projects(csv_path: Path) -> Dict[str, Dict]:
    """Load existing projects from CSV to avoid duplicates."""
    existing = {}
    if csv_path.exists():
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    pid = row.get('project_id', '')
                    if pid:
                        existing[pid] = row
        except Exception as e:
            print(f"Warning: Failed to load existing projects: {e}")
    return existing


def save_projects_csv(csv_path: Path, projects: List[Dict], append: bool = False):
    """Save projects to CSV file."""
    if not projects:
        return
    
    # Define CSV columns (matching existing format)
    fieldnames = [
        'project_id', 'title', 'country', 'climate_bin', 'typology',
        'massing_type', 'wwr_band', 'image_ids', 'plan_ids', 'tags',
        'lat', 'lon', 'architect', 'city', 'description', 'materials',
        'year_completed', 'building_area_sqm', 'floors_above_ground',
        'archdaily_url', 'image_count', 'imported_at', 'source_folder'
    ]
    
    mode = 'a' if append and csv_path.exists() else 'w'
    write_header = mode == 'w' or not csv_path.exists()
    
    with open(csv_path, mode, newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        if write_header:
            writer.writeheader()
        writer.writerows(projects)


def main():
    parser = argparse.ArgumentParser(description="Import new architecture dataset")
    parser.add_argument("--source", "-s", required=True, 
                        help="Path to source dataset directory")
    parser.add_argument("--output", "-o", default=None,
                        help="Output data directory (default: navigator/data)")
    parser.add_argument("--dry-run", "-n", action="store_true",
                        help="Don't actually copy files, just show what would happen")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of projects to process")
    parser.add_argument("--append", action="store_true",
                        help="Append to existing projects.csv instead of creating new file")
    parser.add_argument("--output-csv", default="projects_import.csv",
                        help="Output CSV filename (default: projects_import.csv)")
    
    args = parser.parse_args()
    
    # Resolve paths
    source_dir = Path(args.source).resolve()
    if not source_dir.exists():
        print(f"ERROR: Source directory does not exist: {source_dir}")
        sys.exit(1)
    
    if args.output:
        output_dir = Path(args.output).resolve()
    else:
        output_dir = Path(__file__).parent.parent / "data"
    
    output_images_dir = output_dir / "images"
    output_metadata_dir = output_dir / "metadata"
    output_csv = output_metadata_dir / args.output_csv
    
    print("=" * 60)
    print("ARCHIPEDIA DATASET IMPORT")
    print("=" * 60)
    print(f"Source:      {source_dir}")
    print(f"Output:      {output_dir}")
    print(f"CSV Output:  {output_csv}")
    print(f"Dry Run:     {args.dry_run}")
    print("=" * 60)
    
    # Scan for project folders
    print("\nScanning source directory...")
    project_folders = scan_source_directory(source_dir)
    print(f"Found {len(project_folders)} project folders")
    
    if args.limit:
        project_folders = project_folders[:args.limit]
        print(f"Limited to first {args.limit} projects")
    
    if not project_folders:
        print("No project folders found. Expected structure:")
        print("  source_dir/")
        print("    project_1/")
        print("      images/")
        print("      metadata/")
        print("    project_2/")
        print("      ...")
        sys.exit(1)
    
    # Load existing projects
    existing_projects = {}
    if args.append:
        existing_csv = output_metadata_dir / "projects.csv"
        existing_projects = load_existing_projects(existing_csv)
        print(f"Loaded {len(existing_projects)} existing projects")
    
    # Create output directories
    if not args.dry_run:
        output_images_dir.mkdir(parents=True, exist_ok=True)
        output_metadata_dir.mkdir(parents=True, exist_ok=True)
    
    # Process projects
    print("\nProcessing projects...")
    imported_projects = []
    skipped = 0
    failed = 0
    
    for i, folder in enumerate(project_folders, 1):
        print(f"\n[{i}/{len(project_folders)}] Processing: {folder.name}")
        
        try:
            project_data = process_project_folder(
                folder, 
                output_images_dir,
                dry_run=args.dry_run
            )
            
            if project_data:
                project_id = project_data['project_id']
                
                # Check for duplicates
                if project_id in existing_projects:
                    print(f"  Skipped: duplicate project_id {project_id}")
                    skipped += 1
                    continue
                
                imported_projects.append(project_data)
                print(f"  OK: {project_data['title'][:50]}...")
                print(f"      ID: {project_id}")
                print(f"      Images: {project_data['image_count']}")
            else:
                failed += 1
                
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1
    
    # Save results
    print("\n" + "=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)
    print(f"Total scanned:    {len(project_folders)}")
    print(f"Successfully imported: {len(imported_projects)}")
    print(f"Skipped (duplicates):  {skipped}")
    print(f"Failed:           {failed}")
    
    if imported_projects and not args.dry_run:
        save_projects_csv(output_csv, imported_projects, append=args.append)
        print(f"\nSaved {len(imported_projects)} projects to: {output_csv}")
        
        # Also save as JSONL for enrichment
        jsonl_path = output_csv.with_suffix('.jsonl')
        with open(jsonl_path, 'w', encoding='utf-8') as f:
            for p in imported_projects:
                f.write(json.dumps(p, ensure_ascii=False) + '\n')
        print(f"Also saved as JSONL: {jsonl_path}")
    elif args.dry_run:
        print("\n[DRY RUN] No files were actually copied or created.")
        print("Run without --dry-run to perform the actual import.")
    
    # Print next steps
    print("\n" + "=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("""
After importing, run the following scripts in order:

1. Generate image embeddings:
   python scripts/embed_images.py --data_dir data

2. Build FAISS search index:
   python scripts/build_faiss.py --data_dir data

3. (Optional) Enrich metadata with AI:
   python scripts/enrich_projects_ai.py --limit 10

4. Upload images to R2 CDN:
   python scripts/upload_r2.py

5. Merge import CSV with main projects.csv:
   (Use a spreadsheet or Python to merge projects_import.csv into projects.csv)
""")


if __name__ == "__main__":
    main()

