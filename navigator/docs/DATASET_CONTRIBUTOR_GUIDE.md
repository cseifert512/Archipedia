# Archipedia Dataset Contributor Guide

Welcome! This guide will walk you through adding new architecture projects to the Archipedia database.

---

## Table of Contents

1. [What You Need From The Admin](#what-you-need-from-the-admin)
2. [Data Format Requirements](#data-format-requirements)
3. [Setting Up Your Environment](#setting-up-your-environment)
4. [Data Reformatting Scripts](#data-reformatting-scripts)
5. [Import Pipeline](#import-pipeline)
6. [Post-Import Processing](#post-import-processing)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## What You Need From The Admin

Before you begin, request the following from the project administrator:

### Required Access
- [ ] **Repository Access**: Clone/pull access to the Archipedia repository
- [ ] **OpenAI API Key**: For AI-powered metadata enrichment (optional but recommended)
- [ ] **Cloudflare R2 Credentials** (for production uploads):
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_URL`

### Questions to Ask
1. What branch should I work on? (e.g., `main`, `data-import`, `search-v2`)
2. Should I push directly or create a PR?
3. Are there any specific typology categories I should use?
4. What's the preferred image resolution/size?

---

## Data Format Requirements

### Expected Folder Structure

Your raw dataset should be organized like this:

```
your_dataset/
├── Project_Folder_1/
│   ├── images/              # or 'project_images', 'Images', 'photos'
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   └── ...
│   └── metadata/            # or 'project_metadata', 'Metadata', 'meta'
│       └── info.json        # or any .json file
├── Project_Folder_2/
│   ├── images/
│   └── metadata/
└── ...
```

**Alternative**: If you don't have subdirectories, images can be placed directly in each project folder (the script will detect them).

### Metadata JSON Format

Each project should have a JSON file with metadata. Here's the expected format:

```json
{
  "title": "Project Name / Architect Name",
  "architect": "Architect Firm Name",
  "location": "City, Country",
  "year": "2024",
  "description": "A detailed description of the project...",
  "tags": ["residential", "sustainable", "concrete"],
  "url": "https://www.archdaily.com/1234567/project-name",
  "imageCount": 15
}
```

**Field Descriptions:**

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Project name, often formatted as "Project / Architect" |
| `architect` | Yes | Name of the architecture firm or individual |
| `location` | Yes | Format: "City, Country" (country is extracted from last part) |
| `year` | No | Year of completion |
| `description` | No | Project description (can be enriched by AI later) |
| `tags` | No | Array of relevant tags/categories |
| `url` | No | Source URL (ArchDaily ID is extracted if present) |

### Image Requirements

| Aspect | Requirement |
|--------|-------------|
| **Formats** | `.jpg`, `.jpeg`, `.png`, `.webp` |
| **Not Supported** | `.gif` (automatically skipped) |
| **Recommended Size** | 1200-2400px on longest edge |
| **Quality** | High quality architectural photography preferred |
| **Types** | Exteriors, interiors, diagrams, plans all accepted |

---

## Setting Up Your Environment

### 1. Clone/Pull the Repository

```powershell
cd C:\Users\YourUsername\Desktop
git clone <repository-url> Archipedia
# OR if you already have it:
cd Archipedia
git pull origin main
```

### 2. Set Up Python Environment

```powershell
cd Archipedia\navigator

# Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Additional dependencies for processing
pip install torch timm faiss-cpu numpy pillow boto3 openai
```

### 3. Set Environment Variables (for later steps)

```powershell
# For AI enrichment (optional)
$env:OPENAI_API_KEY = "your-openai-api-key"

# For R2 upload (ask admin for these)
$env:R2_ACCOUNT_ID = "your-account-id"
$env:R2_ACCESS_KEY_ID = "your-access-key"
$env:R2_SECRET_ACCESS_KEY = "your-secret-key"
$env:R2_BUCKET_NAME = "archipedia-images"
$env:R2_PUBLIC_URL = "https://pub-xxx.r2.dev"
```

---

## Data Reformatting Scripts

If your data isn't in the expected format, you'll need to create conversion scripts.

### Where to Put Your Scripts

Place custom data reformatting scripts in:

```
Archipedia/
├── navigator/
│   └── scripts/
│       └── custom/              # CREATE THIS FOLDER
│           └── reformat_my_data.py
```

### Example Conversion Script

Here's a template for converting your data to the expected format:

```python
#!/usr/bin/env python3
"""
Custom data reformatting script for [YOUR DATA SOURCE]

Place this file in: navigator/scripts/custom/reformat_my_data.py

Usage:
    python scripts/custom/reformat_my_data.py --source "C:\path\to\raw_data" --output "C:\path\to\formatted_output"
"""

import os
import json
import shutil
import argparse
from pathlib import Path


def reformat_project(source_folder: Path, output_folder: Path):
    """
    Reformat a single project folder to Archipedia's expected format.
    
    CUSTOMIZE THIS FUNCTION for your specific data format.
    """
    project_name = source_folder.name
    
    # Create output structure
    output_project = output_folder / project_name
    images_dir = output_project / "images"
    metadata_dir = output_project / "metadata"
    
    images_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    
    # ========================================
    # CUSTOMIZE: Extract your metadata
    # ========================================
    # Example: If your data has a different JSON structure
    raw_metadata_file = source_folder / "data.json"  # CHANGE THIS
    
    if raw_metadata_file.exists():
        with open(raw_metadata_file, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
        
        # Transform to Archipedia format
        metadata = {
            "title": raw_data.get("name", project_name),  # CHANGE FIELD NAMES
            "architect": raw_data.get("firm", "Unknown"),
            "location": f"{raw_data.get('city', 'Unknown')}, {raw_data.get('country', 'Unknown')}",
            "year": str(raw_data.get("completion_year", "")),
            "description": raw_data.get("desc", ""),
            "tags": raw_data.get("categories", []),
            "url": raw_data.get("source_url", "")
        }
    else:
        # Default metadata if none exists
        metadata = {
            "title": project_name.replace("_", " ").title(),
            "architect": "Unknown",
            "location": "Unknown",
            "year": "",
            "description": "",
            "tags": [],
            "url": ""
        }
    
    # Save formatted metadata
    with open(metadata_dir / "info.json", 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    # ========================================
    # CUSTOMIZE: Copy your images
    # ========================================
    # Example: If images are in a different location
    source_images_dir = source_folder / "photos"  # CHANGE THIS
    
    if not source_images_dir.exists():
        source_images_dir = source_folder  # Fallback to root
    
    image_count = 0
    for img_file in source_images_dir.iterdir():
        if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
            dest_name = f"image_{image_count + 1:03d}{img_file.suffix.lower()}"
            shutil.copy2(img_file, images_dir / dest_name)
            image_count += 1
    
    print(f"  Reformatted: {project_name} ({image_count} images)")
    return image_count > 0


def main():
    parser = argparse.ArgumentParser(description="Reformat data for Archipedia import")
    parser.add_argument("--source", "-s", required=True, help="Source data directory")
    parser.add_argument("--output", "-o", required=True, help="Output directory")
    parser.add_argument("--limit", type=int, help="Limit number of projects")
    
    args = parser.parse_args()
    
    source_dir = Path(args.source)
    output_dir = Path(args.output)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Reformatting data from: {source_dir}")
    print(f"Output to: {output_dir}")
    
    count = 0
    for project_folder in sorted(source_dir.iterdir()):
        if project_folder.is_dir() and not project_folder.name.startswith('.'):
            if reformat_project(project_folder, output_dir):
                count += 1
            
            if args.limit and count >= args.limit:
                break
    
    print(f"\nReformatted {count} projects")
    print(f"\nNext step: Run the import script:")
    print(f'  python scripts/import_dataset.py --source "{output_dir}" --dry-run')


if __name__ == "__main__":
    main()
```

---

## Import Pipeline

### Step 1: Dry Run (Preview)

Always test with a dry run first:

```powershell
cd C:\Users\YourUsername\Desktop\Archipedia\navigator

# Preview what will happen
python scripts/import_dataset.py --source "C:\path\to\your_dataset" --dry-run

# Test with a few projects first
python scripts/import_dataset.py --source "C:\path\to\your_dataset" --limit 10 --dry-run
```

### Step 2: Run the Import

```powershell
# Import all projects
python scripts/import_dataset.py --source "C:\path\to\your_dataset"

# Or limit to test batch
python scripts/import_dataset.py --source "C:\path\to\your_dataset" --limit 100
```

**What This Does:**
- Copies images to `navigator/data/images/<project_id>/`
- Creates `navigator/data/metadata/projects_import.csv`
- Creates `navigator/data/metadata/projects_import.jsonl`
- Generates unique project IDs
- Skips GIF files automatically

### Step 3: Review Import Results

Check the generated files:

```powershell
# View import CSV
type .\data\metadata\projects_import.csv | Select-Object -First 10

# Count imported projects
(Get-Content .\data\metadata\projects_import.csv | Measure-Object).Count - 1
```

---

## Post-Import Processing

After importing, you need to generate embeddings and update search indexes.

### Step 4: Generate Image Embeddings

```powershell
# This can take a while for large datasets
python scripts/embed_images.py --data_dir data

# For memory-constrained systems, use smaller model:
python scripts/embed_images.py --data_dir data --model vit_small_patch14_dinov2
```

### Step 5: Build FAISS Search Index

```powershell
python scripts/build_faiss.py --data_dir data
```

### Step 6: Update Text Search Index

```powershell
python scripts/embed_text.py
```

### Step 7: Generate Image Captions (Recommended)

Image captions enable **text-based search** to find specific images by their visual content (e.g., searching "glass facade with trees" will find images containing those elements).

```powershell
# Requires OpenAI API key
$env:OPENAI_API_KEY = "your-key"

# Test with a small batch first
python scripts/caption_images.py --limit 50

# Process all images (can take hours for large datasets)
python scripts/caption_images.py

# Resume if interrupted
python scripts/caption_images.py --resume
```

**Cost Estimate**: ~$0.01-0.02 per image with GPT-4o-mini
- 1,000 images ≈ $10-20
- 10,000 images ≈ $100-200

**Output**: Creates/appends to `data/metadata/image_captions.jsonl`

After captioning, re-run the text index to include captions:
```powershell
python scripts/embed_text.py
```

### Step 8: (Optional) AI Metadata Enrichment

Enriches project metadata with AI-generated descriptions, typology, and tags:

```powershell
# Set API key (same as captioning)
$env:OPENAI_API_KEY = "your-key"

# Test with a few projects first
python scripts/enrich_projects_ai.py --limit 10

# Process all imported projects
python scripts/enrich_projects_ai.py
```

This adds:
- Rich architectural descriptions
- Typology classification
- Climate zone
- Extracted tags and keywords

### Step 9: Merge with Main Database

Merge `projects_import.csv` into `projects.csv`:

```python
# Quick Python script to merge
import pandas as pd

existing = pd.read_csv('data/metadata/projects.csv')
imported = pd.read_csv('data/metadata/projects_import.csv')

# Combine and remove duplicates
combined = pd.concat([existing, imported], ignore_index=True)
combined = combined.drop_duplicates(subset=['project_id'], keep='last')

# Save
combined.to_csv('data/metadata/projects.csv', index=False)
print(f"Total projects: {len(combined)}")
```

### Step 10: Upload Images to CDN (Production)

```powershell
# Set R2 credentials (get from admin)
$env:R2_ACCOUNT_ID = "..."
$env:R2_ACCESS_KEY_ID = "..."
$env:R2_SECRET_ACCESS_KEY = "..."
$env:R2_BUCKET_NAME = "archipedia-images"

# Dry run first
python scripts/upload_r2.py --dry-run

# Upload
python scripts/upload_r2.py
```

---

## Verification

### Check Everything Worked

```powershell
# 1. Verify image embeddings exist
Get-ChildItem .\data\embeddings\image\ -Filter "*.npy" | Measure-Object

# 2. Verify FAISS index
Test-Path .\data\embeddings\index.faiss

# 3. Run the test API
python test_api.py

# 4. Start the server and test search
python -m uvicorn app.main:app --reload
# Then open: http://localhost:8000/docs
```

### Test Search with Your New Projects

```powershell
# Using curl or browser:
# http://localhost:8000/search?q=YOUR_PROJECT_NAME&k=5
```

---

## Troubleshooting

### "No images directory found"

Your folder structure doesn't match. Check that each project has:
- `images/` OR `project_images/` OR `photos/` subfolder
- OR images directly in the project folder

### "Memory Error" during embeddings

Use a smaller model:
```powershell
python scripts/embed_images.py --model vit_small_patch14_dinov2
```

Or process in batches by using `--limit` on the import.

### Import is very slow

- Network drives are slower - copy data locally first
- Use `--limit 50` to test first
- Large images slow things down - consider resizing

### Duplicate project_id warning

A project with that ID already exists. The script will skip duplicates. If you need to re-import:
1. Delete the existing project folder from `data/images/`
2. Remove the row from `projects.csv`
3. Re-run import

### R2 upload fails

- Verify credentials are set correctly
- Check bucket exists
- Try `--dry-run` first
- Ask admin to verify your access

---

## Quick Reference: Complete Pipeline

```powershell
# 1. Setup
cd Archipedia\navigator
.\venv\Scripts\Activate  # if using venv

# 2. Reformat (if needed)
python scripts/custom/reformat_my_data.py --source "C:\raw_data" --output "C:\formatted_data"

# 3. Import
python scripts/import_dataset.py --source "C:\formatted_data" --dry-run
python scripts/import_dataset.py --source "C:\formatted_data"

# 4. Generate embeddings & indexes
python scripts/embed_images.py --data_dir data
python scripts/build_faiss.py --data_dir data
python scripts/embed_text.py

# 5. Generate image captions (recommended, requires OpenAI API)
$env:OPENAI_API_KEY = "your-key"
python scripts/caption_images.py --limit 100  # test first
python scripts/caption_images.py              # all images
python scripts/embed_text.py                  # re-run to include captions

# 6. (Optional) Enrich project metadata
python scripts/enrich_projects_ai.py

# 7. Merge (use Python script above or manual merge)

# 8. Test
python test_api.py

# 9. Upload (production)
python scripts/upload_r2.py --dry-run
python scripts/upload_r2.py
```

---

## Questions?

Contact the project administrator for:
- API keys and credentials
- Access issues
- Questions about data formatting
- Help with troubleshooting

---

*Last updated: January 2026*

