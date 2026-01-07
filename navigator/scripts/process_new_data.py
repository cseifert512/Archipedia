#!/usr/bin/env python3
"""
Complete Data Processing Pipeline

This script runs the full processing pipeline after importing new data:
1. Generate image embeddings (DINOv2)
2. Generate patch embeddings (optional)
3. Build FAISS search index
4. Update text search index
5. Upload images to Cloudflare R2

Usage:
    python scripts/process_new_data.py --all
    python scripts/process_new_data.py --embeddings --faiss
    python scripts/process_new_data.py --upload
"""

import os
import sys
import argparse
import subprocess
import time
from pathlib import Path


# Script locations
SCRIPTS_DIR = Path(__file__).parent
DATA_DIR = SCRIPTS_DIR.parent / "data"


def run_command(cmd: list, description: str, cwd: Path = None) -> bool:
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"STEP: {description}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(
            cmd,
            cwd=str(cwd or SCRIPTS_DIR.parent),
            check=False,
            capture_output=False
        )
        if result.returncode == 0:
            print(f"\n✓ {description} completed successfully")
            return True
        else:
            print(f"\n✗ {description} failed with code {result.returncode}")
            return False
    except Exception as e:
        print(f"\n✗ {description} failed: {e}")
        return False


def step_embeddings(data_dir: Path, model: str = "vit_base_patch14_dinov2"):
    """Generate image embeddings using DINOv2."""
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "embed_images.py"),
        "--data_dir", str(data_dir),
        "--model", model
    ]
    return run_command(cmd, "Generate Image Embeddings")


def step_patches(data_dir: Path):
    """Generate patch embeddings."""
    script = SCRIPTS_DIR / "embed_patches.py"
    if not script.exists():
        print(f"Patch embedding script not found: {script}")
        return True  # Optional step
    
    cmd = [
        sys.executable,
        str(script),
        "--data_dir", str(data_dir)
    ]
    return run_command(cmd, "Generate Patch Embeddings (Optional)")


def step_faiss(data_dir: Path):
    """Build FAISS search index."""
    cmd = [
        sys.executable,
        str(SCRIPTS_DIR / "build_faiss.py"),
        "--data_dir", str(data_dir)
    ]
    return run_command(cmd, "Build FAISS Index")


def step_text_index(data_dir: Path):
    """Update text search index."""
    script = SCRIPTS_DIR / "update_text_index.py"
    if not script.exists():
        script = SCRIPTS_DIR / "prepare_search_index.py"
    
    if not script.exists():
        print("Text index script not found, skipping...")
        return True
    
    cmd = [
        sys.executable,
        str(script),
        "--data_dir", str(data_dir)
    ]
    return run_command(cmd, "Update Text Search Index")


def step_upload(data_dir: Path, dry_run: bool = False):
    """Upload images to Cloudflare R2."""
    script = SCRIPTS_DIR / "upload_r2.py"
    if not script.exists():
        print(f"Upload script not found: {script}")
        return False
    
    cmd = [
        sys.executable,
        str(script)
    ]
    if dry_run:
        cmd.append("--dry-run")
    
    return run_command(cmd, "Upload Images to R2 CDN")


def step_enrich(data_dir: Path, limit: int = None, no_vision: bool = False):
    """Enrich project metadata with AI."""
    script = SCRIPTS_DIR / "enrich_projects_ai.py"
    if not script.exists():
        print(f"Enrichment script not found: {script}")
        return False
    
    cmd = [
        sys.executable,
        str(script),
        "--data-dir", str(data_dir)
    ]
    if limit:
        cmd.extend(["--limit", str(limit)])
    if no_vision:
        cmd.append("--no-vision")
    
    return run_command(cmd, "Enrich Metadata with AI")


def check_prerequisites():
    """Check if required packages are installed."""
    print("Checking prerequisites...")
    
    required = {
        'torch': 'PyTorch',
        'timm': 'timm (for DINOv2)',
        'faiss': 'faiss-cpu',
        'numpy': 'NumPy',
        'PIL': 'Pillow',
    }
    
    missing = []
    for module, name in required.items():
        try:
            __import__(module)
        except ImportError:
            missing.append(name)
    
    if missing:
        print(f"\nWARNING: Missing packages: {', '.join(missing)}")
        print("Install with: pip install torch timm faiss-cpu numpy pillow")
        return False
    
    print("✓ All required packages installed")
    return True


def main():
    parser = argparse.ArgumentParser(description="Run data processing pipeline")
    parser.add_argument("--data-dir", default=str(DATA_DIR),
                        help="Path to data directory")
    parser.add_argument("--all", action="store_true",
                        help="Run all steps (embeddings, patches, faiss, text, upload)")
    parser.add_argument("--embeddings", action="store_true",
                        help="Generate image embeddings")
    parser.add_argument("--patches", action="store_true",
                        help="Generate patch embeddings")
    parser.add_argument("--faiss", action="store_true",
                        help="Build FAISS index")
    parser.add_argument("--text-index", action="store_true",
                        help="Update text search index")
    parser.add_argument("--upload", action="store_true",
                        help="Upload to R2 CDN")
    parser.add_argument("--enrich", action="store_true",
                        help="Enrich metadata with AI")
    parser.add_argument("--enrich-limit", type=int, default=None,
                        help="Limit number of projects to enrich")
    parser.add_argument("--model", default="vit_base_patch14_dinov2",
                        help="DINOv2 model variant")
    parser.add_argument("--dry-run", action="store_true",
                        help="Dry run for upload step")
    parser.add_argument("--skip-check", action="store_true",
                        help="Skip prerequisite check")
    
    args = parser.parse_args()
    
    data_dir = Path(args.data_dir).resolve()
    
    print("=" * 60)
    print("ARCHIPEDIA DATA PROCESSING PIPELINE")
    print("=" * 60)
    print(f"Data directory: {data_dir}")
    print()
    
    # Check prerequisites
    if not args.skip_check:
        if not check_prerequisites():
            print("\nContinuing anyway...")
    
    # Determine which steps to run
    steps = []
    if args.all:
        steps = ['embeddings', 'patches', 'faiss', 'text_index', 'upload']
    else:
        if args.embeddings:
            steps.append('embeddings')
        if args.patches:
            steps.append('patches')
        if args.faiss:
            steps.append('faiss')
        if args.text_index:
            steps.append('text_index')
        if args.upload:
            steps.append('upload')
        if args.enrich:
            steps.append('enrich')
    
    if not steps:
        print("No steps selected. Use --all or specific step flags.")
        print("\nAvailable steps:")
        print("  --embeddings   Generate image embeddings (required)")
        print("  --patches      Generate patch embeddings (optional)")
        print("  --faiss        Build FAISS search index (required)")
        print("  --text-index   Update text search index (optional)")
        print("  --upload       Upload images to R2 CDN (for production)")
        print("  --enrich       Enrich metadata with AI (optional)")
        print("\nOr use --all to run: embeddings -> patches -> faiss -> text -> upload")
        return
    
    print(f"\nSteps to run: {' -> '.join(steps)}")
    
    # Run steps
    start_time = time.time()
    results = {}
    
    for step in steps:
        step_start = time.time()
        
        if step == 'embeddings':
            success = step_embeddings(data_dir, args.model)
        elif step == 'patches':
            success = step_patches(data_dir)
        elif step == 'faiss':
            success = step_faiss(data_dir)
        elif step == 'text_index':
            success = step_text_index(data_dir)
        elif step == 'upload':
            success = step_upload(data_dir, args.dry_run)
        elif step == 'enrich':
            success = step_enrich(data_dir, args.enrich_limit)
        else:
            print(f"Unknown step: {step}")
            success = False
        
        step_duration = time.time() - step_start
        results[step] = {'success': success, 'duration': step_duration}
        
        if not success:
            print(f"\n⚠ Step '{step}' failed. Continuing with remaining steps...")
    
    # Summary
    total_duration = time.time() - start_time
    
    print("\n" + "=" * 60)
    print("PIPELINE SUMMARY")
    print("=" * 60)
    
    for step, result in results.items():
        status = "✓" if result['success'] else "✗"
        print(f"  {status} {step}: {result['duration']:.1f}s")
    
    print(f"\nTotal time: {total_duration:.1f}s ({total_duration/60:.1f}m)")
    
    failed = [s for s, r in results.items() if not r['success']]
    if failed:
        print(f"\n⚠ Failed steps: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\n✓ All steps completed successfully!")


if __name__ == "__main__":
    main()

