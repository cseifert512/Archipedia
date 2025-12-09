import argparse
from pathlib import Path
from typing import List, Tuple

from PIL import Image
import math
import numpy as np

from common import (
	DEFAULT_DATA_DIR,
	ensure_output_dir,
	list_image_files,
	pil_from_path,
)
from model_utils import load_model_and_transform, compute_saliency_map


def list_project_dirs(images_root: Path) -> list[Path]:
	return [p for p in sorted(images_root.glob("*")) if p.is_dir()]


def list_project_images(project_dir: Path) -> list[Path]:
	patterns = ["**/*.jpg", "**/*.jpeg", "**/*.png", "**/*.JPG", "**/*.JPEG", "**/*.PNG"]
	paths: list[Path] = []
	for pat in patterns:
		paths.extend(sorted(project_dir.glob(pat)))
	return paths


def pick_images_from_sample(images_root: Path, sample_projects: int, target_count: int) -> list[Path]:
	"""
	Pick up to target_count images by sampling project folders and interleaving
	one image from each in a round-robin fashion to reduce repeats.
	Will automatically expand beyond the initial sample if needed to reach target_count.
	"""
	all_dirs = list_project_dirs(images_root)
	if not all_dirs:
		return []
	k = max(1, sample_projects)
	chosen: list[Path] = []
	seen: set[str] = set()
	start = 0
	while len(chosen) < target_count and start < len(all_dirs):
		end = min(len(all_dirs), start + k)
		batch_dirs = all_dirs[start:end]
		per_project_lists = [list_project_images(d) for d in batch_dirs]
		per_project_lists = [lst for lst in per_project_lists if lst]
		if not per_project_lists:
			start = end
			continue
		i = 0
		progress_any = True
		while len(chosen) < target_count and progress_any:
			progress_any = False
			for lst in per_project_lists:
				if i < len(lst):
					p = lst[i]
					key = str(p.resolve())
					if key not in seen:
						chosen.append(p)
						seen.add(key)
						progress_any = True
						if len(chosen) >= target_count:
							break
			i += 1
		# If still not enough, expand to next batch of projects
		start = end
	return chosen


def choose_grid(total_images: int, canvas_w: int, canvas_h: int, pad: int = 6, min_cell: int = 40) -> Tuple[int, int]:
	"""
	Choose columns (M) and rows (N) so that:
	- M*N <= total_images (no blanks)
	- Used cells are maximized
	- Cell size remains reasonable (> min_cell)
	"""
	best = (0, 0, -1, -1)  # (used, area, M, N)
	for M in range(4, 64):  # plausible columns
		N = total_images // M
		if N <= 0:
			continue
		cell_w = (canvas_w - (M - 1) * pad) // M
		cell_h = (canvas_h - (N - 1) * pad) // N
		if cell_w < min_cell or cell_h < min_cell:
			continue
		used = M * N
		area = cell_w * cell_h
		# Maximize used first, then area
		score = (used, area)
		if score > (best[0], best[1]):
			best = (used, area, M, N)
	if best[2] == -1:
		# Fallback to a trivial 1-column stack if counts are very small
		M = 1
		N = min(total_images, max(1, (canvas_h - pad) // (min_cell + pad)))
		return M, N
	return best[2], best[3]


def center_crop_to_ratio(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
	"""
	Crop the image center to match the target aspect ratio before resizing.
	"""
	ih, iw = img.height, img.width
	tr = target_w / target_h
	ir = iw / ih
	if abs(ir - tr) < 1e-3:
		return img
	if ir > tr:
		# image too wide -> crop width
		new_w = int(round(ih * tr))
		x0 = (iw - new_w) // 2
		return img.crop((x0, 0, x0 + new_w, ih))
	else:
		# image too tall -> crop height
		new_h = int(round(iw / tr))
		y0 = (ih - new_h) // 2
		return img.crop((0, y0, iw, y0 + new_h))


def _colorize_heatmap(heatmap_01: np.ndarray, size: tuple[int, int]) -> Image.Image:
	"""
	Convert [0,1] heatmap to a colored heatmap image resized to size (W,H).
	Simple red/yellow mapping: R = hm, G = sqrt(hm), B = 0
	"""
	Hm = heatmap_01
	H, W = size[1], size[0]
	if Hm.shape != (H, W):
		Hm = np.array(Image.fromarray((Hm * 255).astype("uint8")).resize((W, H), Image.BICUBIC)) / 255.0
	Hm = np.clip(Hm, 0.0, 1.0)
	colored = np.zeros((H, W, 3), dtype="float32")
	colored[..., 0] = Hm
	colored[..., 1] = np.sqrt(Hm)
	colored[..., 2] = 0.0
	colored = (np.clip(colored, 0, 1) * 255).astype("uint8")
	return Image.fromarray(colored)


def _diagonal_alpha_mask(width: int, height: int) -> np.ndarray:
	"""
	Alpha increases from 0 at top-right to 1 at bottom-left.
	alpha(x,y) ~ (u + v)/2, where u = 1 - x/W, v = y/H.
	Returns float32 array shape (H,W) in [0,1].
	"""
	W, H = width, height
	x = np.linspace(0, 1, W, dtype="float32")  # 0 .. 1 left->right
	y = np.linspace(0, 1, H, dtype="float32")  # 0 .. 1 top->bottom
	X, Y = np.meshgrid(x, y)
	u = 1.0 - X  # 1 at left, 0 at right
	v = Y        # 0 at top, 1 at bottom
	alp = (u + v) * 0.5
	return np.clip(alp, 0.0, 1.0)


def _blend_with_mask(base: Image.Image, overlay: Image.Image, alpha_mask_01: np.ndarray) -> Image.Image:
	"""
	Blend overlay onto base using a per-pixel alpha mask (float [0,1]).
	All images must match in size.
	"""
	W, H = base.size
	if overlay.size != (W, H):
		overlay = overlay.resize((W, H), Image.BICUBIC)
	base_np = np.array(base).astype("float32")
	ov_np = np.array(overlay).astype("float32")
	a = alpha_mask_01.astype("float32")
	a3 = np.stack([a, a, a], axis=-1)
	out = a3 * ov_np + (1.0 - a3) * base_np
	return Image.fromarray(np.clip(out, 0, 255).astype("uint8"))


def build_montage(images_root: Path, out_path: Path, canvas_w: int, canvas_h: int, pad: int = 6, jpeg_quality: int = 70, sample_projects: int | None = None, target_count: int | None = None) -> None:
	target = target_count or 0
	paths = pick_images_from_sample(images_root, sample_projects or 10, target or 100) if sample_projects or target else list_image_files(images_root)
	# Fallback: if not enough images chosen, fill from global list to reach target
	if target and len(paths) < target:
		all_files = list_image_files(images_root)
		seen = {str(p.resolve()) for p in paths}
		for p in all_files:
			key = str(p.resolve())
			if key in seen:
				continue
			paths.append(p)
			seen.add(key)
			if len(paths) >= target:
				break
	if not paths:
		raise FileNotFoundError(f"No images found under: {images_root}")

	M, N = choose_grid(len(paths), canvas_w, canvas_h, pad=pad)
	used = M * N
	paths = paths[:used]

	cell_w = (canvas_w - (M - 1) * pad) // M
	cell_h = (canvas_h - (N - 1) * pad) // N

	canvas = Image.new("RGB", (canvas_w, canvas_h), color=(255, 255, 255))

	# Load model once
	model, tfm, device = load_model_and_transform()
	alpha_mask = _diagonal_alpha_mask(cell_w, cell_h)
	target_aspect = cell_w / cell_h
	for idx, p in enumerate(paths):
		r = idx // M
		c = idx % M
		x = c * (cell_w + pad)
		y = r * (cell_h + pad)

		try:
			im_full = pil_from_path(p)
		except Exception:
			continue
		# Crop to ratio before computing saliency so shapes align visually
		im_crop = center_crop_to_ratio(im_full, cell_w, cell_h)
		# Compute saliency on the cropped image
		try:
			hm = compute_saliency_map(im_crop, model, tfm, device)  # [H',W'] in [0,1]
		except Exception:
			# Fallback: no saliency (use zeros)
			hm = np.zeros((im_crop.height, im_crop.width), dtype="float32")
		# Resize base and colored heatmap to cell size
		base_cell = im_crop.resize((cell_w, cell_h), Image.BICUBIC)
		colored = _colorize_heatmap(hm, (cell_w, cell_h))
		# Blend with diagonal mask (0 at top-right → show base; 1 at bottom-left → show heatmap)
		blended = _blend_with_mask(base_cell, colored, alpha_mask)
		canvas.paste(blended, (x, y))

	out_path.parent.mkdir(parents=True, exist_ok=True)
	# Save as JPEG for substantial compression
	canvas.save(out_path, format="JPEG", quality=jpeg_quality, optimize=True, progressive=True)
	print(f"[ok] Wrote {out_path} ({canvas_w}x{canvas_h}, {M}x{N}={used} images)")


def main():
	ap = argparse.ArgumentParser(description="Figure 1 (All): Pack images into a 6x9 montage.")
	ap.add_argument("--data-dir", type=str, default=str(DEFAULT_DATA_DIR), help="Path to data directory (expects images under data/images)")
	ap.add_argument("--images-root", type=str, default=None, help="Optional explicit images root (overrides data-dir/images)")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory (default: scripts/CAADRIA/OUTPUTS)")
	ap.add_argument("--filename", type=str, default="figure_1_all_montage_landscape.jpg", help="Output filename")
	# Landscape 6x9 (horizontal): width > height
	ap.add_argument("--width", type=int, default=4500, help="Output width (pixels)")
	ap.add_argument("--height", type=int, default=3000, help="Output height (pixels)")
	ap.add_argument("--pad", type=int, default=6, help="Padding between cells (pixels)")
	ap.add_argument("--quality", type=int, default=70, help="JPEG quality (lower -> smaller file)")
	ap.add_argument("--sample-projects", type=int, default=10, help="Sample this many project folders")
	ap.add_argument("--target-count", type=int, default=100, help="Aim for this many images (grid will use <= this without blanks)")
	ap.add_argument("--grid-cols", type=int, default=None, help="Force grid columns (overrides auto grid selection)")
	ap.add_argument("--grid-rows", type=int, default=None, help="Force grid rows (overrides auto grid selection)")
	args = ap.parse_args()

	if args.images_root:
		images_root = Path(args.images_root)
	else:
		data_dir = Path(args.data_dir)
		images_root = data_dir / "images"
	if not images_root.exists():
		raise FileNotFoundError(f"Images directory not found: {images_root}")

	# Debug counts
	proj_dirs = list_project_dirs(images_root)
	all_files = list_image_files(images_root)
	print(f"[info] projects={len(proj_dirs)} images_found={len(all_files)}")

	out_dir = ensure_output_dir(args.output_dir)
	out_path = out_dir / args.filename

	# Build list of images first to honor grid override counts
	target = args.target_count or 0
	if args.sample_projects or target:
		paths = pick_images_from_sample(images_root, args.sample_projects or 10, target or 100)
	else:
		paths = list_image_files(images_root)
	# Fallback to fill up to target if needed
	if target and len(paths) < target:
		seen = {str(p.resolve()) for p in paths}
		for p in all_files:
			k = str(p.resolve())
			if k in seen:
				continue
			paths.append(p)
			seen.add(k)
			if len(paths) >= target:
				break

	# Decide grid
	if args.grid_cols and args.grid_rows:
		M, N = args.grid_cols, args.grid_rows
	else:
		M, N = choose_grid(len(paths), args.width, args.height, pad=args.pad)
	used = min(len(paths), M * N)
	paths = paths[:used]

	cell_w = (args.width - (M - 1) * args.pad) // M
	cell_h = (args.height - (N - 1) * args.pad) // N

	canvas = Image.new("RGB", (args.width, args.height), color=(255, 255, 255))
	for idx, p in enumerate(paths):
		r = idx // M
		c = idx % M
		x = c * (cell_w + args.pad)
		y = r * (cell_h + args.pad)
		try:
			im = pil_from_path(p)
		except Exception:
			continue
		im = center_crop_to_ratio(im, cell_w, cell_h)
		im = im.resize((cell_w, cell_h), Image.BICUBIC)
		canvas.paste(im, (x, y))

	canvas.save(out_path, format="JPEG", quality=args.quality, optimize=True, progressive=True)
	print(f"[ok] Wrote {out_path} ({args.width}x{args.height}, {M}x{N}={used} images)")


if __name__ == "__main__":
	main()


