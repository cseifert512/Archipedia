import argparse
import os
from pathlib import Path
from typing import List, Tuple

import numpy as np
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
	overlay_heatmap,
	draw_label_bar,
)
from model_utils import load_model_and_transform, embed_image, compute_saliency_map, generate_sexy_saliency_overlay


def find_candidates(images_root: Path, mode: str, meta_glob: str | None) -> List[Path]:
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


def select_query(candidates: List[Path], query: str | None, random_pick: bool = False) -> Path:
	import random
	if query:
		qp = Path(query)
		if qp.exists():
			return qp
		# allow lookup by suffix match
		for p in candidates:
			if str(p).endswith(query):
				return p
		raise FileNotFoundError(f"Query image not found: {query}")
	if not candidates:
		raise RuntimeError("No candidate images found for the selected mode.")
	return random.choice(candidates) if random_pick else candidates[0]


def _extract_project_slug(p: Path) -> str:
	for part in p.parts[::-1]:
		if part.startswith("p_"):
			return part
	return ""


def find_nearest_neighbor(query_path: Path, candidates: List[Path], neighbor_index: int = 1, max_sim: float = 0.995) -> Tuple[Path, float]:
	model, tfm, device = load_model_and_transform()
	q_im = pil_from_path(query_path)
	q_vec = embed_image(q_im, model, tfm, device)
	# compute similarities to all non-self candidates
	sims: list[tuple[float, Path]] = []
	for p in candidates:
		# skip exact same path
		if p.resolve() == query_path.resolve():
			continue
		vec = embed_image(pil_from_path(p), model, tfm, device)
		sim = float(np.dot(q_vec, vec))  # cosine (vectors L2-normed)
		sims.append((sim, p))
	if not sims:
		raise RuntimeError("Failed to find nearest neighbor (not enough candidates).")
	# sort descending by similarity
	sims.sort(key=lambda x: x[0], reverse=True)
	# neighbor_index is 1-based among non-self neighbors; enforce different project and filename prefix
	qslug = _extract_project_slug(query_path)
	qpref = query_path.stem[:10].lower()
	def acceptable(sim: float, path: Path) -> bool:
		if sim >= max_sim:
			return False
		pslug = _extract_project_slug(path)
		if qslug and pslug and qslug == pslug:
			return False
		if path.stem[:10].lower() == qpref:
			return False
		return True
	# Try preferred neighbor index first
	idx = max(1, neighbor_index) - 1
	if idx < len(sims):
		s, p = sims[idx]
		if acceptable(s, p):
			return p, s
	# Try subsequent neighbors, then wrap
	for s, p in sims[idx+1:] + sims[:idx]:
		if acceptable(s, p):
			return p, s
	# Fallback: least similar acceptable
	for s, p in reversed(sims):
		if acceptable(s, p):
			return p, s
	return sims[-1][1], sims[-1][0]


def build_figure(query_path: Path, match_path: Path, out_path: Path, max_side: int = 640, alpha: float = 0.6, power: float = 1.8) -> None:
	model, tfm, device = load_model_and_transform()

	q_im = pil_from_path(query_path)
	m_im = pil_from_path(match_path)

	# Prepare display images
	q_disp = resize_with_max_side(q_im, max_side)
	m_disp = resize_with_max_side(m_im, max_side)

	# Build sexier overlays and blend
	q_col = generate_sexy_saliency_overlay(q_disp, model, tfm, device, alpha=alpha, power=power)
	m_col = generate_sexy_saliency_overlay(m_disp, model, tfm, device, alpha=alpha, power=power)
	def blend(base: Image.Image, overlay: Image.Image, a: float) -> Image.Image:
		b = np.array(base).astype("float32")
		o = np.array(overlay).astype("float32")
		out = a * o + (1.0 - a) * b
		return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))
	q_overlay = blend(q_disp, q_col, a=0.6)
	m_overlay = blend(m_disp, m_col, a=0.6)

	# Stack into a 2x2 composite: top row images, bottom row overlays
	w1, h1 = q_disp.size
	w2, h2 = m_disp.size
	W = max(w1, w2)
	H = max(h1, h2)

	def center_on_canvas(im: Image.Image, W: int, H: int) -> Image.Image:
		canvas = Image.new("RGB", (W, H), color=(255, 255, 255))
		x = (W - im.width) // 2
		y = (H - im.height) // 2
		canvas.paste(im, (x, y))
		return canvas

	top_left = center_on_canvas(q_disp, W, H)
	top_right = center_on_canvas(m_disp, W, H)
	bot_left = center_on_canvas(q_overlay, W, H)
	bot_right = center_on_canvas(m_overlay, W, H)

	row_pad = 16
	col_pad = 16
	canvas = Image.new("RGB", (2 * W + col_pad, 2 * H + row_pad), color=(255, 255, 255))
	canvas.paste(top_left, (0, 0))
	canvas.paste(top_right, (W + col_pad, 0))
	canvas.paste(bot_left, (0, H + row_pad))
	canvas.paste(bot_right, (W + col_pad, H + row_pad))

	out_path.parent.mkdir(parents=True, exist_ok=True)
	canvas.save(out_path)
	print(f"[ok] Wrote {out_path}")


def main():
	ap = argparse.ArgumentParser(description="Figure 2/3/4: Select Image → Closest Visual Pair (+ saliency)")
	ap.add_argument("--data-dir", type=str, default=str(DEFAULT_DATA_DIR), help="Path to data directory (expects images under data/images)")
	ap.add_argument("--images-root", type=str, default=None, help="Optional explicit images root (overrides data-dir/images)")
	ap.add_argument("--mode", type=str, choices=["exterior", "interior", "plan"], required=True, help="Which subset to search within")
	ap.add_argument("--query", type=str, default=None, help="Optional query image path (absolute or relative suffix match). If omitted, first candidate is used.")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory (default: scripts/CAADRIA/OUTPUTS)")
	ap.add_argument("--filename", type=str, default=None, help="Optional output filename override")
	ap.add_argument("--ext-meta-glob", type=str, default=None, help="Optional glob for external per-project metadata JSONs (with exteriors/interiors lists).")
	ap.add_argument("--random", action="store_true", help="If set and query not provided, pick a random candidate as query.")
	ap.add_argument("--neighbor-index", type=int, default=1, help="1-based index among non-self neighbors (1 = first match after the query)")
	args = ap.parse_args()

	if args.images_root:
		images_root = Path(args.images_root)
	else:
		data_dir = Path(args.data_dir)
		images_root = data_dir / "images"
	if not images_root.exists():
		raise FileNotFoundError(f"Images directory not found: {images_root}")

	out_dir = ensure_output_dir(args.output_dir)
	default_name = f"figure_{'2' if args.mode=='exterior' else ('3' if args.mode=='interior' else '4')}_{args.mode}.png"
	out_path = out_dir / (args.filename or default_name)

	candidates = find_candidates(images_root, args.mode, args.ext_meta_glob)
	if not candidates:
		raise SystemExit(f"No candidates found for mode={args.mode}.")
	qpath = select_query(candidates, args.query, random_pick=args.random)
	match_path, sim = find_nearest_neighbor(qpath, candidates, neighbor_index=args.neighbor_index)
	print(f"[info] cosine similarity={sim:.4f}  match={match_path}")
	build_figure(qpath, match_path, out_path)


if __name__ == "__main__":
	main()


