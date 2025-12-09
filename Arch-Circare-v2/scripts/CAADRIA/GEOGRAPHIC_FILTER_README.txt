================================================================================
GEOGRAPHIC DISTANCE FILTERING VISUAL - QUICK START
================================================================================

WHAT IT DOES:
Creates a visual grid montage where images are progressively overlaid with 
a semi-transparent grey veil based on their geographic distance from a 
reference location. Images near the reference stay vibrant and colorful, 
while images far away become increasingly faded and washed out with grey.

FILES CREATED:
- figure_geographic_filter.py        (Main script)
- generate_geographic_filter_examples.py  (Batch generator)
- GEOGRAPHIC_FILTER_GUIDE.md         (Detailed documentation)
- OUTPUTS/figure_geographic_filter*.jpg   (Generated images)

QUICK START (Cambridge, MA as reference):
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"

QUICK START (Custom location - Beijing):
python figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data" \
  --ref-lat 39.9526 --ref-lon 116.4074 \
  --filename "figure_geographic_filter_beijing.jpg"

KEY PARAMETERS:
--ref-lat, --ref-lon   : Reference location (latitude, longitude)
--num-images          : Number of images to select (~120 default)
--cols, --rows        : Grid dimensions (6x9 default = 54 images)
--width, --height     : Output resolution (4500x3000 default)
--quality             : JPEG quality 1-100 (70 default)
--data-dir            : Path to navigator data directory (REQUIRED)

GENERATED FILES LOCATIONS:
All output saved to: C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\Arch-Circare-v2\scripts\CAADRIA\OUTPUTS\

Examples generated:
- figure_geographic_filter.jpg              (Cambridge, MA reference)
- figure_geographic_filter_beijing.jpg      (Beijing reference)
- figure_geographic_filter_london.jpg       (London reference)

DATA REQUIREMENTS:
✓ Images directory at: navigator\data\images\*\*.jpg
✓ Metadata at: navigator\data\metadata\projects.csv (with lat/lon columns)

HOW IT WORKS:
1. Randomly selects ~120 images
2. Looks up geographic coordinates for each image
3. Calculates distance from reference location using Haversine formula
4. Converts distance to greyscale intensity (0=color, 1=greyscale)
5. Blends each image between color and greyscale
6. Arranges into 6x9 grid (54 displayed images)

INTERPRETING THE RESULT:
- Top-left typically colorful  = projects closer to reference
- Bottom-right typically grey  = projects further from reference
- Mix of colors/grey          = depends on your dataset distribution

REFERENCE COORDINATES:
Cambridge, MA:  42.3601, -71.0589
Beijing:        39.9526, 116.4074
London:         51.5074, -0.1278
New York:       40.7128, -74.0060
Tokyo:          35.6762, 139.6503
Sydney:        -33.8688, 151.2093
Dubai:          25.2048, 55.2708

FOR MORE INFORMATION:
See GEOGRAPHIC_FILTER_GUIDE.md for:
- Detailed usage instructions
- Advanced options
- Troubleshooting
- Technical details about distance calculation

BATCH GENERATION:
To generate examples for multiple cities:
python generate_geographic_filter_examples.py

This will create visuals for Cambridge, Beijing, Dubai, London, 
Tokyo, Sydney, and New York.

REQUIREMENTS:
- Python 3.8+
- PIL/Pillow
- numpy
- 2-3 minutes runtime for 4500x3000 resolution

FILE SIZES:
Typical output: 1.5-3 MB per image (JPEG format)

CONTACT / NOTES:
Each run uses different random images due to random.sample()
Geographic data comes from projects.csv (lat/lon columns)
Images with (0,0) coordinates are treated as invalid

================================================================================

