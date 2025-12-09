"""
Figure: Geographic Distance Filtering Visual

Creates a 6x9 grid of ~120 randomly selected images, where each image
is greyed out based on its geographic distance from Cambridge, MA.

Images closer to Cambridge remain vibrant, while images further away
become progressively more greyscale.
"""

import argparse
import random
import csv
from pathlib import Path
from typing import List, Tuple, Dict
import math

from PIL import Image
import numpy as np

from common import (
    DEFAULT_DATA_DIR,
    ensure_output_dir,
    list_image_files,
    pil_from_path,
)


# Cambridge, MA coordinates
CAMBRIDGE_LAT = 42.3601
CAMBRIDGE_LON = -71.0589

# Earth's radius in km
EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (in km).
    """
    # Handle invalid coordinates (0, 0)
    if lat1 == 0 and lon1 == 0:
        return float('inf')
    if lat2 == 0 and lon2 == 0:
        return float('inf')

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_KM * c


def load_coordinates_map(projects_csv: Path) -> Dict[str, Tuple[float, float]]:
    """
    Load lat/lon coordinates from projects.csv.
    Maps project_id (extracted from folder name) to (lat, lon).
    """
    coords = {}
    with open(projects_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            project_id = row.get("project_id", "").strip()
            try:
                lat = float(row.get("lat", 0))
                lon = float(row.get("lon", 0))
                if project_id:
                    coords[project_id] = (lat, lon)
            except (ValueError, TypeError):
                pass
    return coords


def extract_project_id_from_path(image_path: Path) -> str:
    """
    Extract the project ID from an image path.
    Example: p_as_salam_mosque_archeground_ltd_1030739_exteriors_...
    Returns: p_as_salam_mosque_archeground_ltd_1030739
    """
    # Get the project directory name (parent of the image)
    folder_name = image_path.parent.name
    # Split by underscore and reconstruct the project ID
    # The project ID is typically before the last part (exteriors/interiors/diagrams)
    parts = folder_name.split("_")
    # Find the numeric ID at the end (usually 7 digits)
    for i in range(len(parts) - 1, -1, -1):
        if parts[i].isdigit() and len(parts[i]) == 7:
            # Reconstruct the ID up to this point
            return "_".join(parts[: i + 1])
    # Fallback: return the full folder name
    return folder_name


def get_greyscale_intensity(distance_km: float, max_distance_km: float = 15000.0) -> float:
    """
    Convert distance to a greyscale intensity [0, 1].
    0 = fully colored (at Cambridge)
    1 = fully greyscale (at max distance or beyond)
    """
    if distance_km == float('inf'):
        return 1.0  # Fully greyscale for invalid coordinates
    
    intensity = min(1.0, distance_km / max_distance_km)
    return intensity


def apply_greyscale_based_on_distance(
    image: Image.Image, intensity: float
) -> Image.Image:
    """
    Apply a semi-transparent grey overlay to an image based on intensity.
    intensity = 0 -> no overlay (fully colored)
    intensity = 1 -> full grey overlay (very faded)
    
    This uses a grey overlay rather than greyscale conversion,
    making the effect more obvious and visually striking.
    """
    if intensity <= 0:
        return image
    
    # Convert intensity (0-1) to overlay opacity (0-1)
    overlay_opacity = intensity
    
    # Convert image to array
    img_array = np.array(image, dtype=np.float32)
    
    # Create grey overlay (RGB: 128, 128, 128 = neutral grey)
    grey_overlay = np.full_like(img_array, 128.0, dtype=np.float32)
    
    # Blend: original * (1 - opacity) + grey * opacity
    result = img_array * (1.0 - overlay_opacity) + grey_overlay * overlay_opacity
    
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))


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


def build_geographic_filter_montage(
    images_root: Path,
    coordinates: Dict[str, Tuple[float, float]],
    out_path: Path,
    canvas_w: int = 4500,
    canvas_h: int = 3000,
    cols: int = 6,
    rows: int = 9,
    pad: int = 6,
    jpeg_quality: int = 70,
    num_images: int = 120,
) -> None:
    """
    Build a montage with geographic distance-based greyscaling.
    """
    # Get all image files
    all_images = list_image_files(images_root)
    print(f"[info] Found {len(all_images)} total images")
    
    if not all_images:
        raise FileNotFoundError(f"No images found under: {images_root}")
    
    # Randomly select ~num_images images
    selected_images = random.sample(all_images, min(num_images, len(all_images)))
    print(f"[info] Selected {len(selected_images)} images for montage")
    
    # Calculate grid dimensions
    total_images = min(len(selected_images), cols * rows)
    selected_images = selected_images[:total_images]
    
    cell_w = (canvas_w - (cols - 1) * pad) // cols
    cell_h = (canvas_h - (rows - 1) * pad) // rows
    
    # Create canvas
    canvas = Image.new("RGB", (canvas_w, canvas_h), color=(255, 255, 255))
    
    # Process each image
    for idx, img_path in enumerate(selected_images):
        row = idx // cols
        col = idx % cols
        x = col * (cell_w + pad)
        y = row * (cell_h + pad)
        
        # Extract project ID and get coordinates
        project_id = extract_project_id_from_path(img_path)
        lat, lon = coordinates.get(project_id, (0, 0))
        
        # Calculate distance and greyscale intensity
        distance = haversine_distance(CAMBRIDGE_LAT, CAMBRIDGE_LON, lat, lon)
        intensity = get_greyscale_intensity(distance)
        
        # Load, crop, resize image
        try:
            im = pil_from_path(img_path)
        except Exception as e:
            print(f"[warn] Could not load {img_path}: {e}")
            continue
        
        im = center_crop_to_ratio(im, cell_w, cell_h)
        im = im.resize((cell_w, cell_h), Image.BICUBIC)
        
        # Apply greyscale based on distance
        im = apply_greyscale_based_on_distance(im, intensity)
        
        # Paste into canvas
        canvas.paste(im, (x, y))
        
        if (idx + 1) % 20 == 0:
            print(f"[progress] Processed {idx + 1}/{total_images} images")
    
    # Save output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, format="JPEG", quality=jpeg_quality, optimize=True, progressive=True)
    print(f"[ok] Wrote {out_path} ({canvas_w}x{canvas_h}, {cols}x{rows}={total_images} images)")


def main():
    ap = argparse.ArgumentParser(
        description="Figure: Geographic Distance Filtering Visual"
    )
    ap.add_argument(
        "--data-dir",
        type=str,
        default=str(DEFAULT_DATA_DIR),
        help="Path to data directory (expects images under data/images)",
    )
    ap.add_argument(
        "--images-root",
        type=str,
        default=None,
        help="Optional explicit images root (overrides data-dir/images)",
    )
    ap.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory (default: scripts/CAADRIA/OUTPUTS)",
    )
    ap.add_argument(
        "--filename",
        type=str,
        default="figure_geographic_filter.jpg",
        help="Output filename",
    )
    ap.add_argument("--width", type=int, default=4500, help="Output width (pixels)")
    ap.add_argument("--height", type=int, default=3000, help="Output height (pixels)")
    ap.add_argument("--pad", type=int, default=6, help="Padding between cells (pixels)")
    ap.add_argument("--quality", type=int, default=70, help="JPEG quality (lower -> smaller file)")
    ap.add_argument("--cols", type=int, default=6, help="Grid columns")
    ap.add_argument("--rows", type=int, default=9, help="Grid rows")
    ap.add_argument("--num-images", type=int, default=120, help="Number of images to select (~)")
    ap.add_argument(
        "--projects-csv",
        type=str,
        default=None,
        help="Path to projects.csv (auto-detected if not provided)",
    )
    ap.add_argument(
        "--ref-lat",
        type=float,
        default=CAMBRIDGE_LAT,
        help="Reference latitude (default: Cambridge, MA)",
    )
    ap.add_argument(
        "--ref-lon",
        type=float,
        default=CAMBRIDGE_LON,
        help="Reference longitude (default: Cambridge, MA)",
    )
    
    args = ap.parse_args()
    
    # Update reference coordinates if provided
    globals()['CAMBRIDGE_LAT'] = args.ref_lat
    globals()['CAMBRIDGE_LON'] = args.ref_lon
    
    # Determine images root
    if args.images_root:
        images_root = Path(args.images_root)
    else:
        data_dir = Path(args.data_dir)
        images_root = data_dir / "images"
    
    if not images_root.exists():
        raise FileNotFoundError(f"Images directory not found: {images_root}")
    
    # Determine projects.csv path
    if args.projects_csv:
        projects_csv = Path(args.projects_csv)
    else:
        # Auto-detect: look for it next to the images directory
        data_dir = images_root.parent
        projects_csv = data_dir / "metadata" / "projects.csv"
    
    if not projects_csv.exists():
        raise FileNotFoundError(f"Projects CSV not found: {projects_csv}")
    
    # Load coordinates
    print(f"[info] Loading coordinates from {projects_csv}")
    coordinates = load_coordinates_map(projects_csv)
    print(f"[info] Loaded coordinates for {len(coordinates)} projects")
    
    # Ensure output directory
    out_dir = ensure_output_dir(args.output_dir)
    out_path = out_dir / args.filename
    
    # Build montage
    build_geographic_filter_montage(
        images_root,
        coordinates,
        out_path,
        canvas_w=args.width,
        canvas_h=args.height,
        cols=args.cols,
        rows=args.rows,
        pad=args.pad,
        jpeg_quality=args.quality,
        num_images=args.num_images,
    )


if __name__ == "__main__":
    main()

