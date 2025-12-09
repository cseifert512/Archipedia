# Geographic Distance Filter - Complete Index

## Quick Navigation

### For Quick Start
- **5-minute setup:** See `GEOGRAPHIC_FILTER_README.txt`
- **One-liner command:** See "Quick Start (Cambridge, MA)" below

### For Detailed Information  
- **Full guide:** See `GEOGRAPHIC_FILTER_GUIDE.md`
- **Technical details:** See `GEOGRAPHIC_FILTERING_SUMMARY.md`

### For Code
- **Main script:** `figure_geographic_filter.py`
- **Batch generator:** `generate_geographic_filter_examples.py`

## Quick Start (30 seconds)

```bash
cd scripts/CAADRIA
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"
```

Output: `OUTPUTS/figure_geographic_filter.jpg`

## What This Does

Creates a visual montage showing ~120 architectural images arranged in a 6×9 grid where:
- **Colorful images** = Projects close to the reference location
- **Greyscale images** = Projects far from the reference location

This provides an intuitive way to visualize geographic distribution of architectural projects.

## File Map

| File | Purpose | Size | Type |
|------|---------|------|------|
| `figure_geographic_filter.py` | Main script | 11 KB | Python |
| `generate_geographic_filter_examples.py` | Batch generator | 2.4 KB | Python |
| `GEOGRAPHIC_FILTER_README.txt` | Quick reference | 3.7 KB | Text |
| `GEOGRAPHIC_FILTER_GUIDE.md` | Comprehensive guide | 6.8 KB | Markdown |
| `GEOGRAPHIC_FILTERING_SUMMARY.md` | Implementation details | 7 KB | Markdown |
| `GEOGRAPHIC_FILTER_INDEX.md` | This file | Navigation | Markdown |

## Output Files Generated

| File | Reference | Size | Status |
|------|-----------|------|--------|
| `figure_geographic_filter.jpg` | Cambridge, MA | 1.56 MB | ✅ |
| `figure_geographic_filter_beijing.jpg` | Beijing, China | 1.54 MB | ✅ |
| `figure_geographic_filter_london.jpg` | London, UK | 1.70 MB | ✅ |

## Common Tasks

### Generate for Cambridge (Default)
```bash
python figure_geographic_filter.py \
  --data-dir "C:\path\to\navigator\data"
```

### Generate for Beijing
```bash
python figure_geographic_filter.py \
  --data-dir "C:\path\to\navigator\data" \
  --ref-lat 39.9526 --ref-lon 116.4074 \
  --filename "filter_beijing.jpg"
```

### Generate for Any City
Find coordinates and use:
```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --ref-lat LATITUDE \
  --ref-lon LONGITUDE \
  --filename "filter_cityname.jpg"
```

### Batch Generate (7 cities)
```bash
python generate_geographic_filter_examples.py
```

### High Quality Output
```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --quality 90 \
  --width 6000 --height 4000
```

### Smaller File Size
```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --quality 50 \
  --width 2400 --height 1600
```

## Key Parameters Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--data-dir` | *required* | Path to navigator data directory |
| `--ref-lat` | 42.3601 | Reference latitude (Cambridge, MA) |
| `--ref-lon` | -71.0589 | Reference longitude (Cambridge, MA) |
| `--cols` | 6 | Grid columns |
| `--rows` | 9 | Grid rows |
| `--num-images` | 120 | Images to randomly select |
| `--width` | 4500 | Output width (pixels) |
| `--height` | 3000 | Output height (pixels) |
| `--quality` | 70 | JPEG quality (1-100) |
| `--pad` | 6 | Padding between cells |
| `--output-dir` | `OUTPUTS/` | Output directory |
| `--filename` | `figure_geographic_filter.jpg` | Output filename |

## How It Works (30-second version)

1. **Select Images:** Randomly picks ~120 images from dataset
2. **Lookup Coordinates:** Finds lat/lon for each image from metadata
3. **Calculate Distance:** Uses Haversine formula to find distance from reference
4. **Create Gradient:** Converts distance to greyscale intensity (0-1 range)
5. **Blend Colors:** Mixes original color with greyscale based on distance
6. **Arrange Grid:** Places images in 6×9 grid with padding
7. **Save Output:** Exports as high-quality JPEG

## Reference Coordinates (Lat, Lon)

```
Cambridge, MA       42.3601   -71.0589    (default)
Boston              42.3601   -71.0596
New York            40.7128   -74.0060
Los Angeles         34.0522  -118.2437
London              51.5074    -0.1278
Paris               48.8566     2.3522
Berlin              52.5200    13.4050
Amsterdam           52.3676     4.9041
Tokyo               35.6762   139.6503
Beijing             39.9526   116.4074
Shanghai            31.2304   121.4737
Bangkok             13.7563   100.5018
Sydney             -33.8688   151.2093
Melbourne          -37.8136   144.9631
Toronto             43.6532   -79.3832
Sydney             -33.8688   151.2093
Dubai               25.2048    55.2708
Dubai               25.2048    55.2708
```

## Troubleshooting

### "No images found"
→ Check `--data-dir` points to `navigator/data/`

### All images greyscale
→ Dataset may lack geographic coordinates

### Slow generation
→ Normal for 4500×3000 output (1-2 min is typical)

### Large file size
→ Reduce `--quality` or `--width`/`--height`

See `GEOGRAPHIC_FILTER_GUIDE.md` for more troubleshooting.

## Requirements

- Python 3.8+
- PIL/Pillow
- numpy
- CSV with geographic data (projects.csv)

## Integration

This script integrates with the existing CAADRIA figure generation pipeline:
- Uses `common.py` utilities
- Follows same argument patterns as other figures
- Outputs to same `OUTPUTS/` directory
- Compatible with existing dataset structure

## Examples Provided

Three fully-generated examples are included showing different reference locations:

1. **Cambridge Version** - Shows Eastern bias (close to reference)
2. **Beijing Version** - Shows Asian bias (close to reference)
3. **London Version** - Shows European bias (close to reference)

All examples use the same random seed range, so you can compare how different reference points change the visualization.

## Tips & Tricks

**Tip 1: Batch Processing**
```bash
for city in "cambridge" "beijing" "london" "tokyo"; do
  python generate_geographic_filter_examples.py
done
```

**Tip 2: Different Grid Sizes**
```bash
# Compact 5×7 grid
python figure_geographic_filter.py --cols 5 --rows 7 --num-images 35

# Dense 8×10 grid  
python figure_geographic_filter.py --cols 8 --rows 10 --num-images 80
```

**Tip 3: Fast Preview**
```bash
# Small, low-quality for quick preview
python figure_geographic_filter.py \
  --data-dir "..." \
  --width 1200 --height 800 \
  --quality 40 \
  --filename "preview.jpg"
```

**Tip 4: Archive All Versions**
Create multiple versions with different settings and reference points, then use for presentation/publication.

## Performance Notes

| Setting | Time | File Size |
|---------|------|-----------|
| Default (4500×3000, Q70) | 1-2 min | 1.5 MB |
| High Quality (6000×4000, Q90) | 3-4 min | 3 MB |
| Fast Preview (1200×800, Q40) | 10 sec | 400 KB |

## Next Steps

1. **Try the default:** Run with Cambridge reference
2. **Customize location:** Try your city of interest
3. **Batch generate:** Use example generator for 7 cities
4. **Adjust settings:** Experiment with grid size, quality
5. **Compare outputs:** See how different references change the pattern

## Support & Questions

- For usage help: See `GEOGRAPHIC_FILTER_GUIDE.md`
- For implementation details: See `GEOGRAPHIC_FILTERING_SUMMARY.md`
- For quick reference: See `GEOGRAPHIC_FILTER_README.txt`
- For code: See `figure_geographic_filter.py`

## Technical Details

- **Distance Method:** Haversine formula (great-circle distance)
- **Image Loading:** PIL/Pillow with automatic format detection
- **Color Space:** RGB for display, converted to greyscale for blending
- **Interpolation:** BICUBIC for high-quality resizing
- **File Format:** JPEG with progressive encoding and optimization

## Dataset Composition

- **Total Images:** ~2,994
- **Total Projects:** 431
- **Geographic Coverage:** Worldwide
- **Image Types:** Exterior, Interior, Diagrams/Plans
- **Coordinate Quality:** 431/431 projects have coordinates

## Links & References

See files in this directory for:
- `figure_geographic_filter.py` - Complete source code
- `common.py` - Shared utilities
- `README.md` - Main project guide

---

**Last Updated:** November 14, 2025  
**Status:** Ready to use  
**Version:** 1.0






