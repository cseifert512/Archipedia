# Geographic Distance Filtering Visual

## Overview

The geographic distance filtering visual creates a grid montage where images are progressively overlaid with a semi-transparent grey veil based on their distance from a reference location. This provides an intuitive visualization of the geographic distribution of architectural projects in your dataset.

**Key Features:**
- 6×9 grid layout (54 images displayed from ~120 randomly selected)
- Images close to the reference location remain vibrant and colorful
- Images far from the reference location become progressively more faded with grey overlay
- Semi-transparent grey overlay (not greyscale conversion) for maximum visual impact
- Fully customizable reference location
- High-resolution output (4500×3000 by default)

## Quick Start

### Basic Usage (Cambridge, MA as reference)

```bash
cd scripts/CAADRIA
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"
```

Output: `OUTPUTS/figure_geographic_filter.jpg`

### Custom Reference Location (Beijing)

```bash
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data" \
  --ref-lat 39.9526 --ref-lon 116.4074 \
  --filename "figure_geographic_filter_beijing.jpg"
```

## How It Works

1. **Image Selection**: ~120 images are randomly selected from the image dataset
2. **Coordinate Lookup**: Each image's geographic coordinates are retrieved from `projects.csv`
3. **Distance Calculation**: The Haversine formula calculates the great-circle distance from each image's location to the reference location
4. **Overlay Intensity Mapping**: Distance is converted to an overlay opacity (0=no grey overlay, 1=full grey overlay)
5. **Grey Overlay Application**: Each image is overlaid with a semi-transparent grey veil based on this intensity
6. **Grid Assembly**: Images are arranged in a 6×9 grid and assembled into a high-resolution montage

## Command-Line Arguments

### Required
- `--data-dir`: Path to the data directory containing `images/` and `metadata/projects.csv`

### Reference Location (Optional)
- `--ref-lat`: Reference latitude (default: 42.3601 for Cambridge, MA)
- `--ref-lon`: Reference longitude (default: -71.0589 for Cambridge, MA)

### Grid Configuration (Optional)
- `--cols`: Number of columns in grid (default: 6)
- `--rows`: Number of rows in grid (default: 9)
- `--num-images`: Approximate number of images to randomly select (default: 120)

### Output Configuration (Optional)
- `--output-dir`: Output directory (default: `OUTPUTS/`)
- `--filename`: Output filename (default: `figure_geographic_filter.jpg`)
- `--width`: Output width in pixels (default: 4500)
- `--height`: Output height in pixels (default: 3000)
- `--quality`: JPEG quality 1-100 (default: 70)
- `--pad`: Padding between grid cells in pixels (default: 6)

### Data Configuration (Optional)
- `--projects-csv`: Path to projects.csv (auto-detected if not provided)
- `--images-root`: Override images root directory

## Examples

### Generate for Multiple Cities

Use the included example generator script:

```bash
python generate_geographic_filter_examples.py
```

This generates filter visuals for:
- Cambridge, MA (default)
- Beijing, China
- Dubai, UAE
- London, UK
- Tokyo, Japan
- Sydney, Australia
- New York, USA

### Custom Grid (8×8 instead of 6×9)

```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --cols 8 --rows 8 \
  --num-images 64 \
  --filename "figure_geographic_filter_8x8.jpg"
```

### Higher Quality Output

```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --quality 90 \
  --width 6000 --height 4000 \
  --filename "figure_geographic_filter_hq.jpg"
```

### Smaller File Size

```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --quality 50 \
  --width 2400 --height 1600 \
  --filename "figure_geographic_filter_small.jpg"
```

## Interpreting the Visual

The resulting image shows:

1. **Left/Top Areas**: Usually more colorful (closer to reference location)
2. **Right/Bottom Areas**: Usually more greyscale (further from reference location)
3. **Mixed**: Depending on your dataset distribution

### Important Notes

- **Random Selection**: Each run selects different images (different seed if desired)
- **Distance Normalization**: Maximum distance is set to 15,000 km by default (full Earth)
- **Invalid Coordinates**: Images with (0, 0) coordinates are treated as greyscale
- **Color Blending**: Uses PIL's ImageEnhance for smooth color transitions

## Geographic Reference Coordinates

Common reference locations:

| City | Latitude | Longitude |
|------|----------|-----------|
| Cambridge, MA | 42.3601 | -71.0589 |
| Boston, MA | 42.3601 | -71.0596 |
| New York | 40.7128 | -74.0060 |
| Los Angeles | 34.0522 | -118.2437 |
| London | 51.5074 | -0.1278 |
| Paris | 48.8566 | 2.3522 |
| Tokyo | 35.6762 | 139.6503 |
| Beijing | 39.9526 | 116.4074 |
| Dubai | 25.2048 | 55.2708 |
| Sydney | -33.8688 | 151.2093 |

## Requirements

- Python 3.8+
- PIL (Pillow)
- numpy
- CSV files with geographic coordinates (expected in `data/metadata/projects.csv`)

## Technical Details

### Distance Calculation

The script uses the Haversine formula to calculate great-circle distances:

```python
distance = 2 * R * arcsin(sqrt(sin²(Δlat/2) + cos(lat1)*cos(lat2)*sin²(Δlon/2)))
```

Where:
- R = 6371 km (Earth's radius)
- Δlat, Δlon = differences in latitude/longitude in radians

### Overlay Intensity Function

```python
intensity = min(1.0, distance_km / 15000.0)
```

Where:
- 0 = no overlay (fully colored, at reference location)
- 1 = full grey overlay (>15,000 km away, very faded)

### Grey Overlay Blending

For each pixel:
```
result = (1 - overlay_opacity) * original_color + overlay_opacity * grey(128,128,128)
```

This creates a progressive fading effect where images become increasingly washed out with a neutral grey overlay as distance increases.

## Troubleshooting

### "No images found"
- Ensure `--data-dir` points to a directory with `images/` and `metadata/projects.csv`

### All images are greyscale
- Check that your dataset has proper geographic coordinates in `projects.csv`
- Some projects may have invalid (0, 0) coordinates

### File size too large
- Reduce `--quality` (70 is default, 50 is smaller)
- Reduce `--width` and `--height` (4500×3000 is default)
- Reduce `--num-images` for fewer cells

### Script runs slowly
- This is normal for high-resolution output (~1-2 minutes)
- Reduce resolution with smaller `--width`/`--height` to speed up

## Output Files

All output images are saved to `OUTPUTS/` directory with filenames like:
- `figure_geographic_filter.jpg` (default)
- `figure_geographic_filter_beijing.jpg` (custom reference)
- `figure_geographic_filter_hq.jpg` (high quality)

Each file is typically 1.5-3 MB depending on settings.

