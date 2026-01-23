#!/usr/bin/env python3
"""
Data Reformatting Template Script

Customize this script to convert your data format to Archipedia's expected format.

Usage:
    python scripts/custom/reformat_template.py --source "C:\path\to\raw_data" --output "C:\path\to\formatted_output"
    python scripts/custom/reformat_template.py --source "C:\path\to\raw_data" --output "C:\path\to\formatted_output" --limit 10
"""

import os
import json
import shutil
import argparse
from pathlib import Path
from typing import Optional, Dict, List


def extract_metadata_from_source(source_folder: Path) -> Dict:
    """
    Extract metadata from your source data format.
    
    CUSTOMIZE THIS FUNCTION for your specific data structure.
    
    Returns a dictionary with Archipedia metadata format.
    """
    project_name = source_folder.name
    
    # ================================================
    # EXAMPLE 1: If you have a JSON file with different field names
    # ================================================
    # raw_file = source_folder / "project_data.json"
    # if raw_file.exists():
    #     with open(raw_file, 'r', encoding='utf-8') as f:
    #         raw = json.load(f)
    #     return {
    #         "title": raw.get("project_name", project_name),
    #         "architect": raw.get("designer", "Unknown"),
    #         "location": f"{raw.get('city', '')}, {raw.get('country', '')}",
    #         "year": str(raw.get("year_built", "")),
    #         "description": raw.get("about", ""),
    #         "tags": raw.get("categories", []),
    #         "url": raw.get("link", "")
    #     }
    
    # ================================================
    # EXAMPLE 2: If metadata is in filename or folder name
    # ================================================
    # parts = project_name.split("_")
    # return {
    #     "title": parts[0] if parts else project_name,
    #     "architect": parts[1] if len(parts) > 1 else "Unknown",
    #     "location": parts[2] if len(parts) > 2 else "Unknown",
    #     ...
    # }
    
    # ================================================
    # EXAMPLE 3: If you have a CSV or text file
    # ================================================
    # txt_file = source_folder / "info.txt"
    # if txt_file.exists():
    #     with open(txt_file, 'r', encoding='utf-8') as f:
    #         lines = f.readlines()
    #     return {
    #         "title": lines[0].strip() if lines else project_name,
    #         "architect": lines[1].strip() if len(lines) > 1 else "Unknown",
    #         ...
    #     }
    
    # ================================================
    # DEFAULT: Minimal metadata from folder name
    # ================================================
    return {
        "title": project_name.replace("_", " ").replace("-", " ").title(),
        "architect": "Unknown",
        "location": "Unknown",
        "year": "",
        "description": "",
        "tags": [],
        "url": ""
    }


def find_images_in_source(source_folder: Path) -> List[Path]:
    """
    Find all image files in your source data.
    
    CUSTOMIZE THIS FUNCTION if your images are in non-standard locations.
    
    Returns a list of image file paths.
    """
    valid_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    images = []
    
    # ================================================
    # CUSTOMIZE: Where are your images located?
    # ================================================
    
    # Option 1: Images in a specific subfolder
    image_folders = ['images', 'photos', 'Pictures', 'imgs', 'gallery']
    for folder_name in image_folders:
        img_folder = source_folder / folder_name
        if img_folder.exists():
            for f in img_folder.iterdir():
                if f.is_file() and f.suffix.lower() in valid_extensions:
                    images.append(f)
            if images:
                break
    
    # Option 2: Images directly in project folder
    if not images:
        for f in source_folder.iterdir():
            if f.is_file() and f.suffix.lower() in valid_extensions:
                images.append(f)
    
    # Option 3: Recursively search all subfolders
    # if not images:
    #     for f in source_folder.rglob("*"):
    #         if f.is_file() and f.suffix.lower() in valid_extensions:
    #             images.append(f)
    
    return sorted(images)


def reformat_project(source_folder: Path, output_folder: Path) -> bool:
    """
    Reformat a single project to Archipedia's expected format.
    
    Returns True if successful, False otherwise.
    """
    project_name = source_folder.name
    
    # Skip hidden/system folders
    if project_name.startswith('.') or project_name.startswith('__'):
        return False
    
    print(f"  Processing: {project_name}")
    
    # Create output structure
    output_project = output_folder / project_name
    images_dir = output_project / "images"
    metadata_dir = output_project / "metadata"
    
    # Extract metadata
    metadata = extract_metadata_from_source(source_folder)
    
    # Find images
    source_images = find_images_in_source(source_folder)
    
    if not source_images:
        print(f"    WARNING: No images found, skipping")
        return False
    
    # Create directories
    images_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy and rename images
    for i, img_path in enumerate(source_images, 1):
        ext = img_path.suffix.lower()
        if ext == '.jpeg':
            ext = '.jpg'
        new_name = f"image_{i:03d}{ext}"
        shutil.copy2(img_path, images_dir / new_name)
    
    # Update metadata with image count
    metadata['imageCount'] = len(source_images)
    
    # Save metadata
    with open(metadata_dir / "info.json", 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"    OK: {len(source_images)} images, metadata saved")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Reformat data for Archipedia import",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/custom/reformat_template.py --source "C:\\data\\raw" --output "C:\\data\\formatted"
    python scripts/custom/reformat_template.py -s ./raw_projects -o ./formatted --limit 10
        """
    )
    parser.add_argument("--source", "-s", required=True, 
                        help="Source data directory")
    parser.add_argument("--output", "-o", required=True, 
                        help="Output directory for formatted data")
    parser.add_argument("--limit", type=int, default=None,
                        help="Limit number of projects to process")
    parser.add_argument("--dry-run", "-n", action="store_true",
                        help="Preview only, don't create files")
    
    args = parser.parse_args()
    
    source_dir = Path(args.source).resolve()
    output_dir = Path(args.output).resolve()
    
    if not source_dir.exists():
        print(f"ERROR: Source directory does not exist: {source_dir}")
        return 1
    
    print("=" * 60)
    print("DATA REFORMATTING")
    print("=" * 60)
    print(f"Source:  {source_dir}")
    print(f"Output:  {output_dir}")
    print(f"Limit:   {args.limit or 'None'}")
    print(f"Dry Run: {args.dry_run}")
    print("=" * 60)
    
    if not args.dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
    
    # Process each project folder
    success_count = 0
    skip_count = 0
    
    project_folders = sorted([
        f for f in source_dir.iterdir() 
        if f.is_dir() and not f.name.startswith('.')
    ])
    
    if args.limit:
        project_folders = project_folders[:args.limit]
    
    print(f"\nFound {len(project_folders)} folders to process\n")
    
    for folder in project_folders:
        if args.dry_run:
            print(f"  [DRY RUN] Would process: {folder.name}")
            success_count += 1
        else:
            if reformat_project(folder, output_dir):
                success_count += 1
            else:
                skip_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Processed: {success_count}")
    print(f"Skipped:   {skip_count}")
    
    if not args.dry_run and success_count > 0:
        print(f"\nFormatted data saved to: {output_dir}")
        print("\nNext step: Run the import script:")
        print(f'  python scripts/import_dataset.py --source "{output_dir}" --dry-run')
        print(f'  python scripts/import_dataset.py --source "{output_dir}"')
    
    return 0


if __name__ == "__main__":
    exit(main())

