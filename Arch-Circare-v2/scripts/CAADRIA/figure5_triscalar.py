import argparse
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from common import (
	DEFAULT_DATA_DIR,
	ensure_output_dir,
	pil_from_path,
	resize_with_max_side,
)
from model_utils import load_model_and_transform, embed_image


def load_idmap_and_vectors(data_dir: Path) -> Tuple[np.ndarray, List[Dict]]:
	"""
	Load embeddings and id_map from data_dir/embeddings.
	Returns: (X [N,D], items: List[{'image_id','project_id','thumb'}])
	"""
	emb_dir = data_dir / "embeddings" / "image"
	idmap_path = data_dir / "embeddings" / "id_map.json"
	if not idmap_path.exists():
		raise FileNotFoundError(f"id_map.json not found at {idmap_path}")
	idmap = json.load(open(idmap_path, "r", encoding="utf-8"))
	# idmap keys are string indices
	items = [idmap[k] for k in sorted(idmap.keys(), key=lambda z: int(z))]
	vecs = []
	for it in items:
		npyp = emb_dir / f"{it['image_id']}.npy"
		if npyp.exists():
			vecs.append(np.load(npyp).astype("float32"))
		else:
			vecs.append(None)
	# filter out missing
	X = []
	I = []
	for it, v in zip(items, vecs):
		if v is not None:
			X.append(v)
			I.append(it)
	if not X:
		raise RuntimeError("No embeddings found in embeddings/image/*.npy")
	X = np.stack(X, axis=0)
	# Ensure L2-normalized
	n = np.linalg.norm(X, axis=1, keepdims=True) + 1e-12
	X = X / n
	return X, I


def load_metadata(data_dir: Path) -> Dict[str, Dict]:
	"""
	Load projects.csv as project_id -> row dict.
	Expected columns: project_id, typology, climate_bin, tags
	"""
	import csv
	meta: Dict[str, Dict] = {}
	csv_path = data_dir / "metadata" / "projects.csv"
	if not csv_path.exists():
		return meta
	with open(csv_path, newline="", encoding="utf-8") as f:
		r = csv.DictReader(f)
		for row in r:
			meta[row["project_id"]] = row
	return meta


def parse_tags(raw: str) -> List[str]:
	if not raw or raw.strip() in {"", "[]"}:
		return []
	try:
		# rows might look like "['courtyard','mixed_use']"
		s = raw.strip()
		s = s.strip("[]")
		if not s:
			return []
		parts = [p.strip().strip("'\"") for p in s.split(",") if p.strip()]
		return [p for p in parts if p]
	except Exception:
		return []


def semantic_distance(pid_a: str, pid_b: str, meta: Dict[str, Dict]) -> float:
	ra = meta.get(pid_a, {})
	rb = meta.get(pid_b, {})
	ta = (ra.get("typology") or "").strip().lower()
	tb = (rb.get("typology") or "").strip().lower()
	d_typ = 0.0 if ta and tb and ta == tb else 1.0
	tags_a = set(parse_tags(ra.get("tags", "")))
	tags_b = set(parse_tags(rb.get("tags", "")))
	j = 0.0
	if tags_a or tags_b:
		inter = len(tags_a & tags_b)
		union = len(tags_a | tags_b)
		j = 1.0 - (inter / union) if union > 0 else 1.0
	# combine: weight typology a bit higher
	return 0.6 * d_typ + 0.4 * j


def context_distance(pid_a: str, pid_b: str, meta: Dict[str, Dict]) -> float:
	ra = meta.get(pid_a, {})
	rb = meta.get(pid_b, {})
	ca = (ra.get("climate_bin") or "").strip().lower()
	cb = (rb.get("climate_bin") or "").strip().lower()
	return 0.0 if ca and cb and ca == cb else 1.0


def fused_ranking(q_vec: np.ndarray, X: np.ndarray, items: List[Dict], meta: Dict[str, Dict], weights: Tuple[float, float, float], exclude_idx: int, topk: int = 12) -> List[Tuple[int, float]]:
	"""
	Return list of (index, fused_score) sorted ascending (lower is better).
	weights = (w_visual, w_sem, w_ctx)
	"""
	# visual distances
	sim = X @ q_vec  # cosine
	dv = 1.0 - sim
	# normalize dv 0..1
	if dv.size > 1:
		dv = (dv - dv.min()) / (dv.max() - dv.min() + 1e-12)
	else:
		dv = np.zeros_like(dv)
	# semantic/context per candidate
	da = np.zeros_like(dv)
	ds = np.zeros_like(dv)
	q_pid = items[exclude_idx]["project_id"]
	for i, it in enumerate(items):
		da[i] = semantic_distance(q_pid, it["project_id"], meta)
		ds[i] = context_distance(q_pid, it["project_id"], meta)
	# fuse
	wv, wa, ws = weights
	score = wv * dv + wa * da + ws * ds
	order = np.argsort(score)
	out = []
	for idx in order:
		if idx == exclude_idx:
			continue
		out.append((idx, float(score[idx])))
		if len(out) >= topk:
			break
	return out


def draw_header(canvas: Image.Image, text: str, x: int, y: int, width: int):
	draw = ImageDraw.Draw(canvas)
	try:
		font = ImageFont.truetype("arial.ttf", 28)
	except Exception:
		font = ImageFont.load_default()
	try:
		bbox = draw.textbbox((0, 0), text, font=font)
		w = bbox[2] - bbox[0]
	except Exception:
		# Fallback approximate width
		w = max(0, len(text) * 14)
	draw.text((x + (width - w) // 2, y), text, fill=(0, 0, 0), font=font)


def draw_slider(canvas: Image.Image, weights: Tuple[float, float, float], x: int, y: int, width: int, height: int = 12, pad: int = 6):
	draw = ImageDraw.Draw(canvas)
	# background
	draw.rectangle([x, y, x + width, y + height], outline=(0, 0, 0), width=1, fill=(245, 245, 245))
	# stacked colored bars: visual=blue, sem=green, ctx=orange
	wv, wa, ws = weights
	S = wv + wa + ws + 1e-9
	wv = wv / S; wa = wa / S; ws = ws / S
	w1 = int(round(width * wv))
	w2 = int(round(width * wa))
	# ensure fill across width
	x0 = x
	draw.rectangle([x0, y, x0 + w1, y + height], fill=(66, 135, 245))
	x0 += w1
	draw.rectangle([x0, y, x0 + w2, y + height], fill=(90, 200, 90))
	x0 += w2
	draw.rectangle([x0, y, x + width, y + height], fill=(240, 170, 60))


def draw_caption(canvas: Image.Image, text: str, x: int, y: int, width: int):
	draw = ImageDraw.Draw(canvas)
	try:
		font = ImageFont.truetype("arial.ttf", 16)
	except Exception:
		font = ImageFont.load_default()
	draw.text((x, y), text, fill=(20, 20, 20), font=font)


def add_border(img: Image.Image, color=(180, 180, 180), width=1) -> Image.Image:
	W, H = img.size
	canvas = Image.new("RGB", (W + 2 * width, H + 2 * width), (255, 255, 255))
	canvas.paste(img, (width, width))
	dr = ImageDraw.Draw(canvas)
	dr.rectangle([0, 0, canvas.width - 1, canvas.height - 1], outline=color, width=width)
	return canvas


def build_figure5(images_root: Path, data_dir: Path, out_path: Path, rows: int = 4, cell: int = 360):
	# Try fast path: use precomputed embeddings + id_map
	use_fallback = False
	try:
		X, items = load_idmap_and_vectors(data_dir)
	except Exception:
		use_fallback = True

	meta = load_metadata(data_dir)

	if not use_fallback:
		# Pick a random query index that has a resolvable thumbnail file
		import random
		tries = 0
		while True:
			qi = random.randrange(len(items))
			thumb = items[qi].get("thumb") or ""
			if thumb.startswith("/images/"):
				rel = thumb.replace("/images/", "").lstrip("/")
				imgp = images_root / rel
				if imgp.exists():
					break
			tries += 1
			if tries > 2000:
				use_fallback = True
				break
		if not use_fallback:
			# Load query image
			q_img = pil_from_path(imgp)
			q_img = resize_with_max_side(q_img, cell)
			# Retrieval under three presets
			presets = [
				("Visual emphasis", (0.8, 0.15, 0.05)),
				("Semantic emphasis", (0.2, 0.7, 0.1)),
				("Contextual emphasis", (0.15, 0.15, 0.7)),
			]
			results_by_preset: List[List[int]] = []
			for _, w in presets:
				ranked = fused_ranking(X[qi], X, items, meta, w, exclude_idx=qi, topk=rows - 1)
				indices = [idx for idx, _ in ranked]
				results_by_preset.append(indices)

			# Layout & rendering
			return _render_figure5_canvas(images_root, items, presets, results_by_preset, q_img, out_path, rows, cell)

	# Fallback: compute embeddings on-the-fly for a sample of images_root
	print("[info] Falling back to on-the-fly embeddings over a sample of images_root")
	from common import list_image_files
	from model_utils import load_model_and_transform

	all_paths = list_image_files(images_root)
	# sample up to 600 for speed
	sample = all_paths[:600] if len(all_paths) > 600 else all_paths
	if not sample:
		raise RuntimeError("No images found under images_root")

	model, tfm, device = load_model_and_transform()
	vecs = []
	fallback_items = []
	for p in sample:
		try:
			im = pil_from_path(p)
			v = embed_image(im, model, tfm, device)
		except Exception:
			continue
		vecs.append(v)
		# crude pid extraction: nearest ancestor folder starting with 'p_'
		pid = ""
		for part in p.parts[::-1]:
			if part.startswith("p_"):
				pid = part
				break
		fallback_items.append({"image_id": p.stem, "project_id": pid, "thumb": f"/images/{p.relative_to(images_root).as_posix()}"})
	if not vecs:
		raise RuntimeError("Failed to compute any embeddings on-the-fly")
	X = np.stack(vecs, 0).astype("float32")
	n = np.linalg.norm(X, axis=1, keepdims=True) + 1e-12
	X = X / n
	items = fallback_items

	# pick random query
	import random
	qi = random.randrange(len(items))
	imgp = images_root / items[qi]["thumb"].replace("/images/", "").lstrip("/")
	q_img = resize_with_max_side(pil_from_path(imgp), cell)
	# retrieval
	presets = [
		("Visual emphasis", (0.8, 0.15, 0.05)),
		("Semantic emphasis", (0.2, 0.7, 0.1)),
		("Contextual emphasis", (0.15, 0.15, 0.7)),
	]
	results_by_preset = []
	for _, w in presets:
		ranked = fused_ranking(X[qi], X, items, meta, w, exclude_idx=qi, topk=rows - 1)
		indices = [idx for idx, _ in ranked]
		results_by_preset.append(indices)
	return _render_figure5_canvas(images_root, items, presets, results_by_preset, q_img, out_path, rows, cell)


def _render_figure5_canvas(images_root: Path, items: List[Dict], presets: List[Tuple[str, Tuple[float, float, float]]], results_by_preset: List[List[int]], q_img: Image.Image, out_path: Path, rows: int, cell: int):
	# Layout
	col_w = cell + 2  # border space
	col_pad = 40
	header_h = 60
	slider_h = 18
	row_pad = 22
	# rows include 1 header row area + 1 query row + (rows-1) result rows
	total_rows = 1 + rows
	row_h = cell + 2 + (slider_h + 8 if False else 0)
	# Compute size explicitly
	W = 3 * col_w + 2 * col_pad
	H = header_h + rows * (cell + 2) + (rows - 1) * row_pad + (cell + 2) + row_pad  # header + query row + result rows and paddings
	canvas = Image.new("RGB", (W, H), (255, 255, 255))
	draw = ImageDraw.Draw(canvas)
	# Headers
	xs = [0, col_w + col_pad, 2 * (col_w + col_pad)]
	for i, (title, _) in enumerate(presets):
		draw_header(canvas, title, xs[i], 10, col_w)
	# Query row with sliders
	try:
		font_small = ImageFont.truetype("arial.ttf", 14)
	except Exception:
		font_small = ImageFont.load_default()
	y_cursor = header_h
	for i, (title, w) in enumerate(presets):
		col_x = xs[i]
		cell_img = add_border(q_img, width=1)
		canvas.paste(cell_img, (col_x, y_cursor))
		# mini slider under image
		draw_slider(canvas, w, col_x, y_cursor + cell_img.height + 4, cell_img.width, height=10)
	# Results rows
	for r in range(rows - 1):
		y_cursor = header_h + (r + 1) * (cell + 2 + row_pad)
		for i in range(3):
			col_x = xs[i]
			idx = results_by_preset[i][r]
			it = items[idx]
			thumb = it.get("thumb") or ""
			if thumb.startswith("/images/"):
				rel = thumb.replace("/images/", "").lstrip("/")
				ip = images_root / rel
			else:
				ip = None
			if ip and ip.exists():
				im = resize_with_max_side(pil_from_path(ip), cell)
			else:
				im = Image.new("RGB", (cell, cell), (230, 230, 230))
			# Border; top-1 result thicker
			b = 3 if r == 0 else 1
			cell_img = add_border(im, width=b)
			canvas.paste(cell_img, (col_x, y_cursor))
			# Tiny rank caption
			draw_caption(canvas, f"Rank {r+1}", col_x, y_cursor + cell_img.height + 4, cell_img.width)
	# Save
	out_path.parent.mkdir(parents=True, exist_ok=True)
	canvas.save(out_path, format="PNG", optimize=True)
	print(f"[ok] Wrote {out_path}")
	return True


def main():
	ap = argparse.ArgumentParser(description="Figure 5: Effect of tri-scalar sliders on retrieval")
	ap.add_argument("--data-dir", type=str, default=str(DEFAULT_DATA_DIR), help="Path to data directory (expects embeddings + metadata)")
	ap.add_argument("--images-root", type=str, required=True, help="Path to images root (to resolve thumbnails)")
	ap.add_argument("--rows", type=int, default=4, help="Result rows (3 or 4 recommended)")
	ap.add_argument("--cell", type=int, default=360, help="Cell max side in pixels")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory (default: scripts/CAADRIA/OUTPUTS)")
	ap.add_argument("--filename", type=str, default="figure_5_triscalar.png")
	args = ap.parse_args()

	data_dir = Path(args.data_dir)
	images_root = Path(args.images_root)
	out_dir = ensure_output_dir(args.output_dir)
	out_path = out_dir / args.filename
	build_figure5(images_root, data_dir, out_path, rows=args.rows, cell=args.cell)


if __name__ == "__main__":
	main()


