import argparse
from pathlib import Path
from PIL import Image

from common import ensure_output_dir


def combine_side_by_side(left_path: Path, right_path: Path, out_path: Path, pad: int = 24) -> None:
	left = Image.open(left_path).convert("RGB")
	right = Image.open(right_path).convert("RGB")
	# Match heights by scaling the narrower canvas to the other's height
	H = max(left.height, right.height)
	def resize_to_height(im: Image.Image, H: int) -> Image.Image:
		if im.height == H:
			return im
		w = int(round(im.width * (H / im.height)))
		return im.resize((w, H), Image.BICUBIC)
	left = resize_to_height(left, H)
	right = resize_to_height(right, H)
	W = left.width + pad + right.width
	canvas = Image.new("RGB", (W, H), color=(255, 255, 255))
	canvas.paste(left, (0, 0))
	canvas.paste(right, (left.width + pad, 0))
	out_path.parent.mkdir(parents=True, exist_ok=True)
	canvas.save(out_path, format="PNG", optimize=True)
	print(f"[ok] Wrote {out_path}")


def main():
	ap = argparse.ArgumentParser(description="Combine Figures 2 and 3 into a single side-by-side image.")
	ap.add_argument("--left", type=str, required=True, help="Path to Figure 2 exterior image")
	ap.add_argument("--right", type=str, required=True, help="Path to Figure 3 interior image")
	ap.add_argument("--output-dir", type=str, default=None, help="Output directory (default: same dir as left)")
	ap.add_argument("--filename", type=str, default="figure_2_3_combined.png", help="Output filename")
	ap.add_argument("--pad", type=int, default=24, help="Padding between images (pixels)")
	args = ap.parse_args()

	left = Path(args.left)
	right = Path(args.right)
	out_dir = ensure_output_dir(args.output_dir) if args.output_dir else left.parent
	out_path = out_dir / args.filename
	combine_side_by_side(left, right, out_path, pad=args.pad)


if __name__ == "__main__":
	main()





