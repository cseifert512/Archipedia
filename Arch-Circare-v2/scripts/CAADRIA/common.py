import os
import glob
from pathlib import Path
from typing import Iterable, List, Tuple, Dict, Optional

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import json
import glob as _glob

try:
	import cv2  # type: ignore
	_CV2 = True
except Exception:
	_CV2 = False


# Default locations (can be overridden via CLI args)
REPO_ROOT = Path(__file__).resolve().parents[2]

def _detect_default_data_dir() -> Path:
	"""
	Detect data dir under repo root, preferring:
	1) <repo>/data (if it contains images/)
	2) <repo>/navigator/data (if it contains images/)
	3) fallback to <repo>/data
	"""
	candidates = [
		REPO_ROOT / "data",
		REPO_ROOT / "navigator" / "data",
	]
	for c in candidates:
		if (c / "images").exists():
			return c
	return REPO_ROOT / "data"

DEFAULT_DATA_DIR = _detect_default_data_dir()
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "OUTPUTS"


def ensure_output_dir(out_dir: str | os.PathLike | None = None) -> Path:
	p = Path(out_dir) if out_dir else DEFAULT_OUTPUT_DIR
	p.mkdir(parents=True, exist_ok=True)
	return p


def list_image_files(images_root: str | os.PathLike) -> List[Path]:
	"""
	Collect all jpg/jpeg/png under data/images/* (recursively per project).
	"""
	images_root = Path(images_root)
	patterns = ["**/*.jpg", "**/*.jpeg", "**/*.png", "**/*.JPG", "**/*.JPEG", "**/*.PNG"]
	all_files: List[Path] = []
	for proj_dir in sorted((images_root).glob("*")):
		if not proj_dir.is_dir():
			continue
		for pat in patterns:
			all_files.extend(sorted(proj_dir.glob(pat)))
	return all_files


def load_external_metadata(metadata_glob: Optional[str]) -> Dict[str, Dict[str, List[str]]]:
	"""
	Load external per-project JSONs that specify exteriors/interiors lists.
	Returns: {project_id: {"exteriors":[filenames], "interiors":[filenames]}}
	Expected JSON shape example:
	{
	  "projectId": "...",
	  "fileStructure": {
	    "exteriors": ["<filename>.jpg", ...],
	    "interiors": ["<filename>.jpg", ...]
	  }
	}
	"""
	index: Dict[str, Dict[str, List[str]]] = {}
	if not metadata_glob:
		return index
	paths = _glob.glob(metadata_glob)
	for p in paths:
		try:
			with open(p, "r", encoding="utf-8") as f:
				obj = json.load(f)
			pid = obj.get("projectId") or obj.get("project_id")
			fs = (obj.get("fileStructure") or {})
			exteriors = fs.get("exteriors") or []
			interiors = fs.get("interiors") or []
			if pid:
				index[pid] = {
					"exteriors": [str(x) for x in exteriors],
					"interiors": [str(x) for x in interiors],
				}
		except Exception:
			# tolerant parse; skip file on error
			continue
	return index


def categorize_with_metadata(path: Path, meta_index: Dict[str, Dict[str, List[str]]]) -> str:
	"""
	Use external metadata index if available, else fallback to filename heuristics.
	"""
	pid = path.parent.name
	entry = meta_index.get(pid)
	if entry:
		fn = path.name
		if fn in entry.get("exteriors", []):
			return "exterior"
		if fn in entry.get("interiors", []):
			return "interior"
	return categorize_image_by_filename(path)


def categorize_image_by_filename(path: Path) -> str:
	"""
	Heuristic categorization based on filename tokens.
	Returns one of: 'exterior', 'interior', 'plan', 'unknown'.
	"""
	name = path.stem.lower()
	ext_tokens = [
		"facade", "façade", "exterior", "outside", "street", "hero", "elevation", "urban"
	]
	int_tokens = [
		"interior", "inside", "atrium", "lobby", "hall", "room", "gallery", "corridor", "stair", "void"
	]
	plan_tokens = [
		"plan", "floorplan", "floor_plan", "ground_floor_plan", "site_plan", "drawing", "diagram", "diagrams"
	]
	if any(tok in name for tok in ext_tokens):
		return "exterior"
	if any(tok in name for tok in int_tokens):
		return "interior"
	if any(tok in name for tok in plan_tokens):
		return "plan"
	return "unknown"


def resize_with_max_side(pil: Image.Image, max_side: int) -> Image.Image:
	w, h = pil.size
	if max(w, h) <= max_side:
		return pil
	scale = max_side / float(max(w, h))
	nw, nh = int(round(w * scale)), int(round(h * scale))
	return pil.resize((nw, nh), Image.BICUBIC)


def pil_from_path(path: Path) -> Image.Image:
	return Image.open(path).convert("RGB")


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
	"""
	Compute cosine similarity between two L2-normalized vectors.
	"""
	return float(np.dot(a, b))


def draw_label_bar(pil: Image.Image, text: str, bar_height: int = 28) -> Image.Image:
	"""
	Add a label bar at the bottom of the image with provided text.
	"""
	w, h = pil.size
	out = Image.new("RGB", (w, h + bar_height), color=(255, 255, 255))
	out.paste(pil, (0, 0))
	draw = ImageDraw.Draw(out)
	try:
		# Try a common font; not guaranteed on all systems
		font = ImageFont.truetype("arial.ttf", 14)
	except Exception:
		font = ImageFont.load_default()
	draw.text((8, h + 6), text, fill=(0, 0, 0), font=font)
	return out


def overlay_heatmap(pil: Image.Image, heatmap_01: np.ndarray, alpha: float = 0.45) -> Image.Image:
	"""
	Overlay a heatmap (H,W float in [0,1]) onto a PIL image using OpenCV if available,
	else use a matplotlib-like simple colormap approximation.
	"""
	img = np.array(pil)
	h, w = pil.height, pil.width
	# Resize heatmap to match image size
	hm = heatmap_01
	if hm.shape[0] != h or hm.shape[1] != w:
		if _CV2:
			hm = cv2.resize(hm, (w, h), interpolation=cv2.INTER_CUBIC)
		else:
			hm = np.array(Image.fromarray((hm * 255).astype("uint8")).resize((w, h), Image.BICUBIC)) / 255.0

	hm = np.clip(hm, 0.0, 1.0)
	if _CV2:
		colored = cv2.applyColorMap((hm * 255).astype("uint8"), cv2.COLORMAP_JET)
		colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
	else:
		# simple red-yellow colormap
		colored = np.zeros((h, w, 3), dtype="float32")
		colored[..., 0] = hm  # R
		colored[..., 1] = np.sqrt(hm)  # G
		colored[..., 2] = 0.0  # B
		colored = (np.clip(colored, 0, 1) * 255).astype("uint8")

	overlay = (alpha * colored + (1.0 - alpha) * img).astype("uint8")
	return Image.fromarray(overlay)


def make_grid(images: List[Image.Image], cols: int, pad: int = 8, bg=(255, 255, 255)) -> Image.Image:
	"""
	Pack images into a grid with fixed number of columns. Rows inferred.
	Images are assumed pre-resized to a common size.
	"""
	if not images:
		return Image.new("RGB", (512, 512), color=bg)
	w, h = images[0].size
	rows = (len(images) + cols - 1) // cols
	grid_w = cols * w + (cols - 1) * pad
	grid_h = rows * h + (rows - 1) * pad
	canvas = Image.new("RGB", (grid_w, grid_h), color=bg)
	for idx, im in enumerate(images):
		r = idx // cols
		c = idx % cols
		x = c * (w + pad)
		y = r * (h + pad)
		canvas.paste(im, (x, y))
	return canvas


def path_labels_for_catalog(paths: List[Path]) -> List[str]:
	"""
	Derive concise labels for catalog grid cells.
	Format: <project_id>/<filename>
	"""
	out = []
	for p in paths:
		try:
			proj = p.parent.name
			out.append(f"{proj}/{p.name}")
		except Exception:
			out.append(p.name)
	return out


