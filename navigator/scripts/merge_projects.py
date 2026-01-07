#!/usr/bin/env python3
"""
Merge imported projects with existing projects.csv

Usage:
    python scripts/merge_projects.py
    python scripts/merge_projects.py --dry-run
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description="Merge imported projects with existing projects.csv")
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes")
    parser.add_argument("--data-dir", default="data", help="Data directory")
    args = parser.parse_args()
    
    data_dir = Path(__file__).parent.parent / args.data_dir / "metadata"
    
    existing_csv = data_dir / "projects.csv"
    import_csv = data_dir / "projects_import.csv"
    backup_csv = data_dir / f"projects_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    print("=" * 60)
    print("MERGE PROJECTS")
    print("=" * 60)
    
    # Check files exist
    if not import_csv.exists():
        print(f"ERROR: Import file not found: {import_csv}")
        sys.exit(1)
    
    # Load imported projects
    imported = []
    with open(import_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        import_fields = reader.fieldnames
        for row in reader:
            imported.append(row)
    
    print(f"Imported projects: {len(imported)}")
    
    # Load existing projects (if any)
    existing = []
    existing_ids = set()
    existing_fields = []
    
    if existing_csv.exists():
        with open(existing_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_fields = reader.fieldnames
            for row in reader:
                existing.append(row)
                existing_ids.add(row.get('project_id', ''))
        print(f"Existing projects: {len(existing)}")
    else:
        print("No existing projects.csv found - will create new file")
    
    # Find duplicates
    duplicates = 0
    new_projects = []
    for proj in imported:
        pid = proj.get('project_id', '')
        if pid in existing_ids:
            duplicates += 1
        else:
            new_projects.append(proj)
    
    print(f"Duplicates (skipped): {duplicates}")
    print(f"New projects to add: {len(new_projects)}")
    
    if not new_projects:
        print("\nNo new projects to add.")
        return
    
    # Determine final fieldnames (union of both)
    all_fields = list(existing_fields) if existing_fields else []
    for field in import_fields:
        if field not in all_fields:
            all_fields.append(field)
    
    # Combine projects
    all_projects = existing + new_projects
    
    print(f"\nTotal projects after merge: {len(all_projects)}")
    
    if args.dry_run:
        print("\n[DRY RUN] No changes written.")
        return
    
    # Backup existing file
    if existing_csv.exists():
        import shutil
        shutil.copy2(existing_csv, backup_csv)
        print(f"Backup created: {backup_csv}")
    
    # Write merged CSV
    with open(existing_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=all_fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(all_projects)
    
    print(f"\n✓ Merged {len(new_projects)} new projects into {existing_csv}")
    print(f"✓ Total projects: {len(all_projects)}")


if __name__ == "__main__":
    main()

