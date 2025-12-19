#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload images to Cloudflare R2 and update id_map.json with public URLs.

Prerequisites:
1. Create R2 bucket in Cloudflare dashboard
2. Enable public access or create access tokens
3. Set environment variables:
   - R2_ACCOUNT_ID
   - R2_ACCESS_KEY_ID  
   - R2_SECRET_ACCESS_KEY
   - R2_BUCKET_NAME
   - R2_PUBLIC_URL (e.g., https://pub-xxx.r2.dev)

Usage:
    python navigator/scripts/upload_r2.py [--dry-run] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import boto3
    from botocore.config import Config
except ImportError:
    print("ERROR: boto3 is required. Install with: pip install boto3")
    sys.exit(1)

THIS_DIR = Path(__file__).resolve().parent
NAVIGATOR_DIR = THIS_DIR.parent
DATA_DIR = NAVIGATOR_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
IDMAP_PATH = EMBEDDINGS_DIR / "id_map.json"
IDMAP_BACKUP_PATH = EMBEDDINGS_DIR / "id_map.backup.json"


def get_r2_client():
    """Create boto3 S3 client configured for Cloudflare R2."""
    account_id = os.environ.get("R2_ACCOUNT_ID")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    
    if not all([account_id, access_key, secret_key]):
        raise ValueError(
            "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
        )
    
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "adaptive"}
        ),
    )


def find_all_images() -> List[Path]:
    """Find all image files in the images directory."""
    if not IMAGES_DIR.exists():
        return []
    
    extensions = {".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"}
    images = []
    
    for path in IMAGES_DIR.rglob("*"):
        if path.is_file() and path.suffix in extensions:
            images.append(path)
    
    return sorted(images)


def get_content_type(path: Path) -> str:
    """Get MIME type for image file."""
    suffix = path.suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(suffix, "application/octet-stream")


def upload_image(
    client,
    bucket: str,
    local_path: Path,
    s3_key: str,
    dry_run: bool = False
) -> bool:
    """Upload a single image to R2."""
    if dry_run:
        print(f"  [DRY RUN] Would upload: {local_path} -> s3://{bucket}/{s3_key}")
        return True
    
    try:
        client.upload_file(
            str(local_path),
            bucket,
            s3_key,
            ExtraArgs={
                "ContentType": get_content_type(local_path),
                "CacheControl": "public, max-age=31536000",  # 1 year cache
            }
        )
        return True
    except Exception as e:
        print(f"  ERROR uploading {local_path}: {e}")
        return False


def update_id_map(public_url: str, uploaded_keys: Dict[str, str], dry_run: bool = False):
    """Update id_map.json with R2 public URLs."""
    if not IDMAP_PATH.exists():
        print(f"WARNING: {IDMAP_PATH} not found, skipping id_map update")
        return
    
    # Backup original
    if not dry_run:
        with open(IDMAP_PATH, "r", encoding="utf-8") as f:
            original = f.read()
        with open(IDMAP_BACKUP_PATH, "w", encoding="utf-8") as f:
            f.write(original)
        print(f"Backed up id_map.json to {IDMAP_BACKUP_PATH}")
    
    # Load and update
    with open(IDMAP_PATH, "r", encoding="utf-8") as f:
        id_map = json.load(f)
    
    updates = 0
    for idx, meta in id_map.items():
        old_thumb = meta.get("thumb")
        if not old_thumb:
            continue
        
        # Convert /images/... path to R2 key
        if old_thumb.startswith("/images/"):
            relative_path = old_thumb[8:]  # Remove "/images/"
            s3_key = relative_path
            
            # Check if this was uploaded
            if s3_key in uploaded_keys:
                new_url = f"{public_url.rstrip('/')}/{s3_key}"
                meta["thumb"] = new_url
                updates += 1
    
    if dry_run:
        print(f"[DRY RUN] Would update {updates} thumbnail URLs in id_map.json")
    else:
        with open(IDMAP_PATH, "w", encoding="utf-8") as f:
            json.dump(id_map, f, ensure_ascii=False, indent=2)
        print(f"Updated {updates} thumbnail URLs in id_map.json")


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload images to Cloudflare R2")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually upload")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of images")
    parser.add_argument("--workers", type=int, default=10, help="Parallel upload workers")
    args = parser.parse_args()
    
    # Check environment
    bucket = os.environ.get("R2_BUCKET_NAME", "archipedia-images")
    public_url = os.environ.get("R2_PUBLIC_URL")
    
    if not public_url:
        print("WARNING: R2_PUBLIC_URL not set. id_map.json won't be updated with URLs.")
    
    # Find all images
    images = find_all_images()
    if args.limit:
        images = images[:args.limit]
    
    print(f"Found {len(images)} images to upload")
    
    if not images:
        print("No images found in", IMAGES_DIR)
        return 0
    
    # Create client
    try:
        client = get_r2_client()
    except ValueError as e:
        print(f"ERROR: {e}")
        return 1
    
    # Upload images
    uploaded_keys: Dict[str, str] = {}
    failed = 0
    
    def upload_one(img_path: Path) -> tuple[Path, str, bool]:
        # Create S3 key from relative path
        relative = img_path.relative_to(IMAGES_DIR)
        s3_key = str(relative).replace("\\", "/")
        
        success = upload_image(client, bucket, img_path, s3_key, args.dry_run)
        return img_path, s3_key, success
    
    print(f"\nUploading to bucket: {bucket}")
    print(f"Using {args.workers} parallel workers\n")
    
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(upload_one, img): img for img in images}
        
        for i, future in enumerate(as_completed(futures), 1):
            img_path, s3_key, success = future.result()
            
            if success:
                uploaded_keys[s3_key] = str(img_path)
                if i % 50 == 0 or i == len(images):
                    print(f"  Uploaded {i}/{len(images)}")
            else:
                failed += 1
    
    print(f"\nUpload complete: {len(uploaded_keys)} succeeded, {failed} failed")
    
    # Update id_map.json
    if public_url and uploaded_keys:
        update_id_map(public_url, uploaded_keys, args.dry_run)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

