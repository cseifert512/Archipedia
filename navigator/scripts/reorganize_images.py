#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reorganize images in data/images/ into per-project folders.

This script targets flattened dumps where filenames follow patterns like:
  p_<slug>_exteriors_p_<slug>_exterior_1.jpg
  p_<slug>_interiors_p_<slug>_interior_3.jpg
  p_<slug>_diagrams_p_<slug>_diagram_2.jpg
and moves them to:
  data/images/<project_id>/<original_filename>

It only processes files that are directly under data/images/ (flat). Files that
are already in subfolders are left untouched. Non-image files are ignored.

Usage:
  python navigator/scripts/reorganize_images.py --data_dir navigator/data --dry-run
  python navigator/scripts/reorganize_images.py --data_dir navigator/data
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
from pathlib import Path
from typing import Optional, Tuple


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"}

# Patterns to extract project_id from current scraped filenames.
# We try the more specific patterns first (plural → singular blocks).
PATTERNS = [
	# ..._exteriors_p_<pid>_exterior_#.jpg
	re.compile(r"_exteriors_p_(p_[a-z0-9_]+)_exterior_", re.IGNORECASE),
	# ..._interiors_p_<pid>_interior_#.jpg
	re.compile(r"_interiors_p_(p_[a-z0-9_]+)_interior_", re.IGNORECASE),
	# ..._diagrams_p_<pid>_diagram_#.jpg
	re.compile(r"_diagrams_p_(p_[a-z0-9_]+)_diagram_", re.IGNORECASE),
	# Simpler fallback: prefix before a known singular category
	re.compile(r"^(p_[a-z0-9_]+)_(exterior|interior|diagram|plan|section)_", re.IGNORECASE),
]


def infer_project_id(name: str) -> Optional[str]:
	"""Infer project_id from a filename (without path)."""
	for rx in PATTERNS:
		m = rx.search(name)
		if m:
			return m.group(1)
	# Final fallback: if it starts with p_, take up to the last underscore group that ends with digits
	# e.g., p_foo_bar_1031234_hero.jpg → p_foo_bar_1031234
	if name.lower().startswith("p_"):
		base = name.rsplit(".", 1)[0]
		parts = base.split("_")
		# find the last token that is all digits, then slice up to it
		last_idx = None
		for i, tok in enumerate(parts):
			if tok.isdigit():
				last_idx = i
		if last_idx is not None and last_idx >= 1:
			return "_".join(parts[: last_idx + 1])
		# otherwise just take the first two tokens as a weak guess
		if len(parts) >= 2:
			return "_".join(parts[:2])
	return None


def reorganize(images_root: Path, dry_run: bool = True) -> Tuple[int, int, int]:
	"""
	Move flat images into per-project folders.
	Returns: (moved_count, skipped_count, error_count)
	"""
	moved = skipped = errors = 0
	for child in images_root.iterdir():
		# Only process files directly under images_root
		if child.is_dir():
			# leave existing folders alone
			continue
		if child.suffix not in IMAGE_EXTS:
			# ignore non-image files
			continue
		project_id = infer_project_id(child.name)
		if not project_id:
			print(f"[warn] Could not infer project_id from '{child.name}', skipping.")
			skipped += 1
			continue
		target_dir = images_root / project_id
		target_dir.mkdir(parents=True, exist_ok=True)
		target_path = target_dir / child.name
		if target_path.exists():
			print(f"[skip] Target already exists: {target_path.name}")
			skipped += 1
			continue
		print(f"[move] {child.name}  ->  {project_id}/{child.name}")
		if not dry_run:
			try:
				shutil.move(str(child), str(target_path))
				moved += 1
			except Exception as e:
				print(f"[error] Failed to move {child.name}: {e}")
				errors += 1
		else:
			moved += 1
	return moved, skipped, errors


def main() -> int:
	ap = argparse.ArgumentParser(description="Reorganize flat images into per-project folders")
	ap.add_argument("--data_dir", default="navigator/data", help="Path to data directory containing /images")
	ap.add_argument("--dry-run", action="store_true", help="Preview moves without changing files")
	args = ap.parse_args()

	images_root = Path(args.data_dir) / "images"
	if not images_root.exists():
		print(f"Images directory not found: {images_root}")
		return 1

	moved, skipped, errors = reorganize(images_root, dry_run=args.dry_run)
	mode = "DRY-RUN" if args.dry_run else "APPLY"
	print(f"[{mode}] moved={moved} skipped={skipped} errors={errors}")
	return 0 if errors == 0 else 2


if __name__ == "__main__":
	raise SystemExit(main())







