import argparse
import json
import os
from pathlib import Path
from typing import Dict, List

from PIL import Image

from common import (
	DEFAULT_DATA_DIR,
	ensure_output_dir,
	list_image_files,
	categorize_image_by_filename,
	categorize_with_metadata,
	load_external_metadata,
	pil_from_path,
	resize_with_max_side,
	make_grid,
	draw_label_bar,
	path_labels_for_catalog,
)


def load_datasets_config(path: str | None) -> Dict[str, List[str]]:
	"""
	Load mapping of dataset label -> list of project_id.
	If not provided, return a single dataset 'All' with no filtering.
	"""
	if not path:
		return {"All": []}
	p = Path(path)
	with open(p, "r", encoding="utf-8") as f:
		data = json.load(f)
	# Expecting: {"A": ["p_x", ...], "B": [...], "C": [...]}
	return {str(k): list(v) for k, v in data.items()}


def filter_by_projects(paths: List[Path], project_ids: List[str]) -> List[Path]:
	if not project_ids:
		return paths
	pid_set = set(project_ids)
	return [p for p in paths if p.parent.name in pid_set]


def build_catalog(images_root: Path, project_ids: List[str], mode: str, cell_side: int, cols: int, max_images: int, meta_glob: str | None) -> Image.Image:
	paths = list_image_files(images_root)
	paths = filter_by_projects(paths, project_ids)
	meta_index = load_external_metadata(meta_glob) if meta_glob else {}
	if mode == "exterior":
		paths = [p for p in paths if (categorize_with_metadata(p, meta_index) if meta_index else categorize_image_by_filename(p)) == "exterior"]
	elif mode == "interior":
		paths = [p for p in paths if (categorize_with_metadata(p, meta_index) if meta_index else categorize_image_by_filename(p)) == "interior"]
	else:
		paths = []
	if not paths:
		return Image.new("RGB", (cols * cell_side, cell_side), color=(255, 255, 255))
	paths = paths[:max_images]
	ims = []
	labels = path_labels_for_catalog(paths)
	for p, label in zip(paths, labels):
		im = resize_with_max_side(pil_from_path(p), cell_side)
		# letterbox to square cell
		canvas = Image.new("RGB", (cell_side, cell_side), color=(255, 255, 255))
		x = (cell_side - im.width) // 2
		y = (cell_side - im.height) // 2
		canvas.paste(im, (x, y))
		canvas = draw_label_bar(canvas, label, bar_height=24)
		ims.append(canvas)
	grid = make_grid(ims, cols=cols, pad=8)
	return grid


def main():
	ap = argparse.ArgumentParser(description="Figure 1: Catalogs for Dataset A/B/C (exterior + interior). Plans skipped per instruction.")
	ap.add_argument("--data-dir", type=str, default=str(DEFAULT_DATA_DIR), help="Path to data directory (expects images under data/images)")
	ap.add_argument("--datasets-config", type=str, default=None, help="JSON mapping label->list(project_id). Example: {\"A\": [\"p_foo\"], \"B\":[], \"C\":[]}")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory (default: scripts/CAADRIA/OUTPUTS)")
	ap.add_argument("--cols", type=int, default=6, help="Grid columns")
	ap.add_argument("--cell", type=int, default=256, help="Cell max side in pixels")
	ap.add_argument("--max-images", type=int, default=36, help="Max images per catalog")
	ap.add_argument("--ext-meta-glob", type=str, default=None, help="Optional glob for external per-project metadata JSONs (with exteriors/interiors lists).")
	args = ap.parse_args()

	data_dir = Path(args.data_dir)
	images_root = data_dir / "images"
	if not images_root.exists():
		raise FileNotFoundError(f"Images directory not found: {images_root}")

	out_dir = ensure_output_dir(args.output_dir)
	ds_map = load_datasets_config(args.datasets_config)

	for label, proj_ids in ds_map.items():
		for mode in ("exterior", "interior"):
			img = build_catalog(images_root, proj_ids, mode, cell_side=args.cell, cols=args.cols, max_images=args.max_images, meta_glob=args.ext_meta_glob)
			fname = f"figure_1_{label.lower()}_{mode}.png"
			out_path = out_dir / fname
			out_path.parent.mkdir(parents=True, exist_ok=True)
			img.save(out_path)
			print(f"[ok] Wrote {out_path}")


if __name__ == "__main__":
	main()


