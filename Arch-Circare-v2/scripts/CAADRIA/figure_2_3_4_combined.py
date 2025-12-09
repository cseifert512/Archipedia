import argparse
import random
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np
from PIL import Image

from common import (
	ensure_output_dir,
	list_image_files,
	categorize_image_by_filename,
	categorize_with_metadata,
	load_external_metadata,
	pil_from_path,
	resize_with_max_side,
)
from model_utils import load_model_and_transform, embed_image, compute_saliency_map, generate_sexy_saliency_overlay, generate_vivid_saliency_blend


def find_candidates(images_root: Path, mode: str, meta_glob: Optional[str]) -> List[Path]:
	paths = list_image_files(images_root)
	meta_index = load_external_metadata(meta_glob) if meta_glob else {}
	cands = []
	for p in paths:
		cat = categorize_with_metadata(p, meta_index) if meta_index else categorize_image_by_filename(p)
		if mode == "exterior" and cat == "exterior":
			cands.append(p)
		elif mode == "interior" and cat == "interior":
			cands.append(p)
		elif mode == "plan" and cat == "plan":
			cands.append(p)
	return cands


def compute_neighbors(query_path: Path, candidates: List[Path], model, tfm, device) -> List[Tuple[float, Path]]:
	q_im = pil_from_path(query_path)
	q_vec = embed_image(q_im, model, tfm, device)
	sims: list[tuple[float, Path]] = []
	for p in candidates:
		if p.resolve() == query_path.resolve():
			continue
		vec = embed_image(pil_from_path(p), model, tfm, device)
		sim = float(np.dot(q_vec, vec))
		sims.append((sim, p))
	sims.sort(key=lambda x: x[0], reverse=True)  # descending similarity
	return sims


def sexy_heatmap_overlay(pil_image: Image.Image, model, tfm, device, alpha: float = 0.6, power: float = 2.2) -> Image.Image:
	"""
	Compute saliency, amplify (power > 1), and overlay with strong alpha.
	"""
	# Use the vivid screen-blend version
	return generate_vivid_saliency_blend(pil_image, model, tfm, device, alpha=alpha, power=power, halo_sigma=3.5)


def _slug(p: Path) -> str:
	for part in p.parts[::-1]:
		if part.startswith("p_"):
			return part
	return ""


def pick_query_and_match(cands: List[Path], model, tfm, device, prefer_indices=(2, 3), max_sim: float = 0.995) -> Tuple[Path, Path, float]:
	"""
	Randomly pick a query and then choose the 2nd or 3rd nearest neighbor (non-self).
	Reject matches that are too similar (sim >= max_sim); try next.
	"""
	if not cands:
		raise RuntimeError("No candidates to pick from.")
	query = random.choice(cands)
	sims = compute_neighbors(query, cands, model, tfm, device)
	if not sims:
		raise RuntimeError("No neighbors found for selected query.")
	qslug = _slug(query)
	qpref = query.stem[:10].lower()
	def acceptable(sim: float, p: Path) -> bool:
		if sim >= max_sim:
			return False
		if _slug(p) == qslug:
			return False
		if p.stem[:10].lower() == qpref:
			return False
		return True
	# prefer_indices are 1-based among non-self neighbors
	for pi in prefer_indices:
		idx = max(1, pi) - 1
		if idx < len(sims):
			sim, path = sims[idx]
			if acceptable(sim, path) and path.resolve() != query.resolve():
				return query, path, sim
	# fallback: first acceptable
	for sim, path in sims:
		if acceptable(sim, path) and path.resolve() != query.resolve():
			return query, path, sim
	# last resort: return top neighbor
	return query, sims[0][1], sims[0][0]


def pack_grid(images: List[Image.Image], cols: int, pad: int = 16) -> Image.Image:
	if not images:
		return Image.new("RGB", (800, 600), color=(255, 255, 255))
	w = max(im.width for im in images)
	h = max(im.height for im in images)
	# resize to the same size
	images = [im.resize((w, h), Image.BICUBIC) for im in images]
	rows = (len(images) + cols - 1) // cols
	W = cols * w + (cols - 1) * pad
	H = rows * h + (rows - 1) * pad
	canvas = Image.new("RGB", (W, H), color=(255, 255, 255))
	for i, im in enumerate(images):
		r = i // cols
		c = i % cols
		x = c * (w + pad)
		y = r * (h + pad)
		canvas.paste(im, (x, y))
	return canvas


def main():
	ap = argparse.ArgumentParser(description="Figures 2/3/4 combined: ext/int/plan top row; second/third neighbor bottom row; saliency overlay; no labels.")
	ap.add_argument("--images-root", type=str, required=True, help="Explicit images root directory")
	ap.add_argument("--ext-meta-glob", type=str, default=None, help="Optional glob for external per-project metadata JSONs (with exteriors/interiors/diagrams)")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory")
	ap.add_argument("--filename", type=str, default="figure_2_3_4_combined.png", help="Output filename")
	ap.add_argument("--cell", type=int, default=900, help="Max side per cell (pixels)")
	ap.add_argument("--alpha", type=float, default=0.6, help="Heatmap overlay alpha (0-1)")
	ap.add_argument("--power", type=float, default=2.2, help="Saliency amplification power (>1 increases contrast)")
	ap.add_argument("--max-sim", type=float, default=0.995, help="Reject neighbors with cosine similarity >= this threshold")
	ap.add_argument("--prefer", type=str, default="2,3", help="Comma list of neighbor ranks to prefer (non-self), e.g., '2,3'")
	args = ap.parse_args()

	images_root = Path(args.images_root)
	out_dir = ensure_output_dir(args.output_dir)
	out_path = out_dir / args.filename

	model, tfm, device = load_model_and_transform()

	modes = ["exterior", "interior", "plan"]
	top_images: list[Image.Image] = []
	bottom_images: list[Image.Image] = []

	prefer_indices = []
	for tok in args.prefer.split(","):
		tok = tok.strip()
		if tok.isdigit():
			prefer_indices.append(int(tok))
	if not prefer_indices:
		prefer_indices = [2, 3]

	for mode in modes:
		cands = find_candidates(images_root, mode, args.ext_meta_glob)
		if not cands:
			# create a blank placeholder if none found
			top_images.append(Image.new("RGB", (args.cell, args.cell), color=(245, 245, 245)))
			bottom_images.append(Image.new("RGB", (args.cell, args.cell), color=(245, 245, 245)))
			continue
		qpath, mpath, sim = pick_query_and_match(cands, model, tfm, device, prefer_indices=prefer_indices, max_sim=args.max_sim)
		# prepare display images with saliency overlays; no labels
		q_im = pil_from_path(qpath)
		m_im = pil_from_path(mpath)
		q_im = resize_with_max_side(q_im, args.cell)
		m_im = resize_with_max_side(m_im, args.cell)
		# Top: clean query (no overlay) to match provided aesthetic
		q_ov = q_im
		# Bottom: neighbor with sexy overlay
		m_ov = sexy_heatmap_overlay(m_im, model, tfm, device, alpha=args.alpha, power=args.power)
		# paste
		top_images.append(q_ov)
		bottom_images.append(m_ov)

	# Build grid 3 columns x 2 rows (top row: queries; bottom row: matches)
	row_top = pack_grid(top_images, cols=3, pad=24)
	row_bottom = pack_grid(bottom_images, cols=3, pad=24)
	W = max(row_top.width, row_bottom.width)
	canvas = Image.new("RGB", (W, row_top.height + 24 + row_bottom.height), color=(255, 255, 255))
	canvas.paste(row_top, (0, 0))
	canvas.paste(row_bottom, (0, row_top.height + 24))
	canvas.save(out_path, format="PNG", optimize=True)
	print(f"[ok] Wrote {out_path}")


if __name__ == "__main__":
	main()
