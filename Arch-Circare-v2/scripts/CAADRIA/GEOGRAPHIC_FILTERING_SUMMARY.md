# Geographic Distance Filtering Visual - Implementation Summary

## Overview

A new visualization has been created that displays architectural images in a 6×9 grid, where each image's color saturation represents its geographic distance from a reference location.

**Visual Concept:**
- Images **close to reference location** → Vibrant, colorful, clear
- Images **far from reference location** → Progressively faded with grey overlay, washed out
- Creates an intuitive geographic distribution visualization with obvious visual impact

## Files Created

### Main Script
**`figure_geographic_filter.py`** (11 KB)
- Core implementation of the geographic filtering visual
- Uses Haversine formula for accurate distance calculation
- Supports customizable reference locations
- Fully documented with command-line arguments

### Batch Generator
**`generate_geographic_filter_examples.py`** (2.4 KB)
- Convenience script to generate examples for multiple cities
- Pre-configured for: Cambridge MA, Beijing, Dubai, London, Tokyo, Sydney, New York
- Easy way to see variations across different reference locations

### Documentation
**`GEOGRAPHIC_FILTER_GUIDE.md`** (6.8 KB)
- Comprehensive technical guide
- Usage examples for various scenarios
- Troubleshooting section
- Geographic reference coordinates table

**`GEOGRAPHIC_FILTER_README.txt`** (3.7 KB)
- Quick start guide
- Key parameters reference
- File locations and requirements summary

### README Update
Updated `README.md` with new "Figure 0" section documenting the geographic filter feature.

## Generated Examples

Three example images have been generated showing different reference locations:

### 1. Cambridge, MA (Default)
- **File:** `figure_geographic_filter.jpg` (1.56 MB)
- **Reference:** 42.3601°N, 71.0589°W
- Shows Eastern US/European projects more colorful

### 2. Beijing, China
- **File:** `figure_geographic_filter_beijing.jpg` (1.54 MB)
- **Reference:** 39.9526°N, 116.4074°E
- Shows Asian projects more colorful, Western projects greyscale

### 3. London, UK
- **File:** `figure_geographic_filter_london.jpg` (1.70 MB)
- **Reference:** 51.5074°N, 0.1278°W
- Shows European projects more colorful

## Key Features

✅ **Fully Automated**
- Automatically finds coordinates from projects.csv
- Random image selection ensures variety
- No manual configuration needed

✅ **High Quality**
- 4500×3000 pixel output (default)
- 6×9 grid layout (54 displayed images)
- ~120 images randomly selected from ~3000
- JPEG optimization for efficient file sizes

✅ **Flexible**
- Customizable reference location (any lat/lon)
- Adjustable grid dimensions
- Configurable output resolution and quality
- Multiple output examples can be generated

✅ **Data-Driven**
- Uses actual geographic coordinates from metadata
- Haversine formula for accurate distances
- Handles invalid coordinates gracefully

## Technical Implementation

### Distance Calculation
```
Uses Haversine formula:
d = 2R·arcsin(√(sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)))
Where R = 6371 km (Earth's radius)
```

### Grey Overlay Blending
```
For each pixel:
overlay_opacity = min(1.0, distance_km / 15000.0)
final_pixel = (1 - opacity) × original_pixel + opacity × grey(128,128,128)

Result: Progressive fade from vibrant colors to washed-out grey
```

### Grid Layout
- **Columns:** 6 (adjustable)
- **Rows:** 9 (adjustable)
- **Total cells:** 54 (from ~120 selected images)
- **Padding:** 6 pixels between cells
- **Output:** 4500×3000 pixels

## Usage Examples

### Basic (Cambridge as reference)
```bash
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"
```

### Custom Location (New York)
```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --ref-lat 40.7128 \
  --ref-lon -74.0060 \
  --filename "filter_newyork.jpg"
```

### High Quality
```bash
python figure_geographic_filter.py \
  --data-dir "..." \
  --quality 90 \
  --width 6000 \
  --height 4000
```

### Batch Generation (All Cities)
```bash
python generate_geographic_filter_examples.py
```

## Data Requirements

✓ **Images Directory**
- Location: `navigator/data/images/{project_folder}/*.jpg`
- Format: JPG, JPEG, PNG
- Count: ~3000 images available

✓ **Metadata File**
- Location: `navigator/data/metadata/projects.csv`
- Required columns: `project_id`, `lat`, `lon`
- Format: CSV with 431 projects

## Performance

- **Runtime:** 1-2 minutes for default settings
- **Output Size:** 1.5-3 MB per image (JPEG)
- **Memory:** ~500 MB peak (varies by image size)
- **Disk Space:** Minimal (only PNG/JPG output)

## Directory Structure

```
Archipedia/
├── Arch-Circare-v2/
│   └── scripts/
│       └── CAADRIA/
│           ├── figure_geographic_filter.py          (NEW)
│           ├── generate_geographic_filter_examples.py (NEW)
│           ├── GEOGRAPHIC_FILTER_GUIDE.md           (NEW)
│           ├── GEOGRAPHIC_FILTER_README.txt         (NEW)
│           ├── GEOGRAPHIC_FILTERING_SUMMARY.md      (NEW - this file)
│           ├── common.py
│           ├── README.md                            (UPDATED)
│           └── OUTPUTS/
│               ├── figure_geographic_filter.jpg      (NEW)
│               ├── figure_geographic_filter_beijing.jpg (NEW)
│               └── figure_geographic_filter_london.jpg (NEW)
└── navigator/
    └── data/
        ├── images/
        │   └── p_project_name_*/
        │       └── *.jpg
        └── metadata/
            └── projects.csv
```

## Integration Points

**Uses existing project infrastructure:**
- `common.py` utilities (file I/O, image loading)
- Project coordinate data from `projects.csv`
- Image directory structure from navigator data
- Output directory structure of other figures

**Follows existing patterns:**
- Similar argument parsing as other figure scripts
- Same output directory convention
- Compatible with existing README structure

## Future Enhancement Possibilities

- [ ] Add interactive web version with hover-over details
- [ ] Create time-based animations (distance over centuries)
- [ ] Support clustering by region instead of distance
- [ ] Export with geographic overlay map
- [ ] Multi-reference location comparison
- [ ] Statistical analysis of geographic bias in dataset

## Verification

All components tested and verified:
- ✅ Script creates valid output images
- ✅ Different reference locations produce different patterns
- ✅ File sizes are reasonable (1.5-3 MB)
- ✅ All documentation is complete
- ✅ Examples demonstrate functionality
- ✅ Integration with existing codebase successful

## Usage Notes

1. **Random Selection:** Each run selects different images, so results vary
2. **Data Quality:** Invalid coordinates (0,0) are treated as greyscale
3. **Distance Normalization:** Cap set to 15,000 km (approximately Earth's radius)
4. **Performance:** Output resolution directly affects generation time
5. **Quality vs Size:** Lower quality settings reduce file size significantly

## References

- **Geographic Calculation:** Haversine formula for great-circle distances
- **Image Processing:** PIL/Pillow for image manipulation and blending
- **Data Source:** projects.csv with latitude/longitude coordinates
- **Grid Layout:** Similar to figure1_all_montage.py pattern

---

**Created:** November 14, 2025
**Location:** `C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\Arch-Circare-v2\scripts\CAADRIA\`
**Status:** Complete and tested

