# Archipedia Data Import Guide

This guide explains how to import new architecture project datasets into Archipedia.

## Expected Input Format

Your new dataset should be organized as follows:

```
new_dataset/
├── Project_Folder_1/
│   ├── images/           (or 'Images', 'photos')
│   │   ├── image1.jpg
│   │   ├── image2.jpg
│   │   └── animation.gif  (will be skipped)
│   └── metadata/         (or 'Metadata', 'meta')
│       └── info.json
├── Project_Folder_2/
│   ├── images/
│   └── metadata/
└── ...
```

### Metadata JSON Format

Each project's metadata JSON should contain:

```json
{
  "title": "Project Name / Architect Name",
  "architect": "Architect Firm Name",
  "location": "City, Country",
  "year": "2025",
  "description": "Project description text...",
  "tags": ["tag1", "tag2", "tag3"],
  "url": "https://www.archdaily.com/1234567/project-name",
  "imageCount": 20,
  "scrapedAt": "2026-01-04T04:53:50.829Z"
}
```

## Import Steps

### Step 1: Prepare Your Data

1. Place your new dataset folder somewhere accessible
2. Ensure the folder structure matches the expected format
3. GIF files will be automatically skipped during import

### Step 2: Run the Import Script

```powershell
# Navigate to the navigator directory
cd c:\Users\cseif_lf583q6\OneDrive\Desktop\Archipedia\navigator

# Dry run first to preview what will happen
python scripts/import_dataset.py --source "C:\path\to\new_dataset" --dry-run

# If everything looks good, run the actual import
python scripts/import_dataset.py --source "C:\path\to\new_dataset"

# To limit the number of projects (for testing)
python scripts/import_dataset.py --source "C:\path\to\new_dataset" --limit 10
```

**Options:**
- `--source, -s`: Path to your new dataset (required)
- `--output, -o`: Output directory (default: navigator/data)
- `--dry-run, -n`: Preview only, don't copy files
- `--limit N`: Process only first N projects
- `--append`: Append to existing projects.csv
- `--output-csv`: Custom output CSV filename

### Step 3: Process the Imported Data

After importing, you need to generate embeddings and build the search index:

```powershell
# Run all processing steps
python scripts/process_new_data.py --all

# Or run individual steps:
python scripts/process_new_data.py --embeddings  # Generate image embeddings
python scripts/process_new_data.py --faiss       # Build search index
python scripts/process_new_data.py --upload      # Upload to R2 CDN
```

**Processing Options:**
- `--all`: Run embeddings → patches → faiss → text-index → upload
- `--embeddings`: Generate DINOv2 image embeddings
- `--patches`: Generate patch-level embeddings (optional)
- `--faiss`: Build FAISS search index
- `--text-index`: Update text search index
- `--upload`: Upload images to Cloudflare R2
- `--enrich`: Enrich metadata using OpenAI
- `--dry-run`: Dry run for upload step

### Step 4: Merge with Main Projects CSV

The import creates `projects_import.csv`. Merge it with the main `projects.csv`:

```python
import pandas as pd

# Load both CSVs
existing = pd.read_csv('data/metadata/projects.csv')
imported = pd.read_csv('data/metadata/projects_import.csv')

# Combine
combined = pd.concat([existing, imported], ignore_index=True)

# Remove duplicates by project_id
combined = combined.drop_duplicates(subset=['project_id'], keep='last')

# Save
combined.to_csv('data/metadata/projects.csv', index=False)
```

Or simply copy the import CSV columns into the main CSV manually.

### Step 5: (Optional) Enrich Metadata with AI

To add rich descriptions, tags, and architectural analysis:

```powershell
# Set your OpenAI API key
$env:OPENAI_API_KEY = "your-api-key"

# Enrich projects (processes projects_import.csv)
python scripts/enrich_projects_ai.py --limit 10  # Start with 10
python scripts/enrich_projects_ai.py             # Process all
```

### Step 6: Upload to Production

```powershell
# Set R2 credentials
$env:R2_ACCOUNT_ID = "your-account-id"
$env:R2_ACCESS_KEY_ID = "your-access-key"
$env:R2_SECRET_ACCESS_KEY = "your-secret-key"
$env:R2_BUCKET_NAME = "archipedia-images"
$env:R2_PUBLIC_URL = "https://pub-xxx.r2.dev"

# Dry run first
python scripts/upload_r2.py --dry-run

# Upload all images
python scripts/upload_r2.py
```

## Output Structure

After import, files are organized as:

```
navigator/data/
├── images/
│   └── p_project_name_123456/
│       ├── p_project_name_123456_image_01.jpg
│       ├── p_project_name_123456_image_02.jpg
│       └── ...
├── embeddings/
│   ├── image/
│   │   └── i_p_project_name_123456_*.npy
│   ├── id_map.json
│   └── index.faiss
└── metadata/
    ├── projects.csv
    └── projects_import.csv
```

## Troubleshooting

### "No images directory found"
- Check your folder structure has `images/` or `photos/` subdirectory
- Or place images directly in the project folder

### "No valid images found"
- Ensure images are .jpg, .jpeg, or .png (GIFs are skipped)
- Check file permissions

### Import is slow
- Use `--limit 10` to test with a few projects first
- Image copying can be slow on network drives

### Embeddings fail with memory error
- Use `vit_small_patch14_dinov2` model (smaller):
  ```
  python scripts/embed_images.py --model vit_small_patch14_dinov2
  ```

### Upload fails
- Check R2 credentials are set correctly
- Verify bucket exists and is accessible
- Try `--dry-run` first to validate

## Requirements

```
torch>=2.0
timm>=0.9
faiss-cpu>=1.7
numpy>=1.24
Pillow>=10.0
boto3>=1.28  # For R2 upload
openai>=1.0  # For AI enrichment
```

Install with:
```
pip install torch timm faiss-cpu numpy pillow boto3 openai
```

