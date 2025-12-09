CAADRIA Paper Figure Scripts
============================

Outputs are saved to `scripts/CAADRIA/OUTPUTS/`.

Setup
-----
1) Create a virtual environment (recommended), then install dependencies:
```
pip install -r scripts/CAADRIA/requirements.txt
```

2) Ensure your dataset lives under `data/images/{project_id}/*.jpg|png` at the repo root (same as the Navigator app).
If your data is elsewhere, pass `--data-dir` to scripts.

Figure 0: Geographic Distance Filtering
-----------------------------------------
Creates a 6x9 montage (~120 randomly selected images) where each image is greyed out based on its geographic distance from a reference location (default: Cambridge, MA).

Images closer to the reference remain vibrant and colorful, while images further away become progressively more greyscale. This provides a visual representation of the geographic distribution of projects.

Run (default: Cambridge, MA):
```
python scripts/CAADRIA/figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data"
```

Run (custom reference location):
```
python scripts/CAADRIA/figure_geographic_filter.py \
  --data-dir "C:\Users\clayh\OneDrive\Documents\Desktop\Archipedia\navigator\data" \
  --ref-lat 40.7128 --ref-lon -74.0060
```

Optional arguments:
- `--data-dir`: Path to data directory
- `--num-images`: Number of images to randomly select (default: 120)
- `--cols`: Grid columns (default: 6)
- `--rows`: Grid rows (default: 9)
- `--ref-lat`, `--ref-lon`: Reference location coordinates (default: Cambridge, MA @ 42.3601, -71.0589)
- `--width`, `--height`: Output dimensions (default: 4500x3000)
- `--quality`: JPEG quality (default: 70)

Output:
- `figure_geographic_filter.jpg`

Figure 1: Catalog of Dataset A/B/C (plans skipped for now)
----------------------------------------------------------
Generates per-dataset catalogs for exterior and interior imagery.
Datasets are provided via a JSON file mapping dataset label to an array of `project_id`s.

Example `scripts/CAADRIA/datasets.json`:
```
{
  "A": ["p_big_8house", "p_mvrdv_markthal"],
  "B": ["p_sanaa_rolex"],
  "C": ["p_zumthor_vals"]
}
```

Run:
```
python scripts/CAADRIA/figure1_catalog.py --datasets-config scripts/CAADRIA/datasets.json
```
Outputs:
- `figure_1_a_exterior.png`
- `figure_1_a_interior.png`
- `figure_1_b_exterior.png`
- `figure_1_b_interior.png`
- `figure_1_c_exterior.png`
- `figure_1_c_interior.png`

Notes:
- Heuristic filename-based categorization is used by default:
  - Exterior tokens: facade, façade, exterior, outside, street, hero, elevation, urban
  - Interior tokens: interior, inside, atrium, lobby, hall, room, gallery, corridor, stair, void
- Plans are intentionally omitted per instruction; we can add them later.

Figure 2 and 3: Nearest Visual Pair (+ saliency)
------------------------------------------------
Finds the nearest neighbor within a subset (exterior or interior) for a selected query image, and renders a 2x2 composite:
top row (query, match), bottom row (query saliency, match saliency).
Saliency is gradient-based over the ViT feature norm.

Run (exterior):
```
python scripts/CAADRIA/figure2_3_pairs.py --mode exterior
```
Run (interior):
```
python scripts/CAADRIA/figure2_3_pairs.py --mode interior
```

Optional arguments:
- `--data-dir`: point to your data directory (default: repo_root/data)
- `--query`: path or suffix to a specific image to use as the query
- `--output-dir`: custom output directory (default: scripts/CAADRIA/OUTPUTS)
- `--filename`: override output filename
- `--ext-meta-glob`: glob for external per-project JSONs that include `fileStructure.exteriors/interiors`, e.g.
  ```
  --ext-meta-glob "C:\Users\clayh\Downloads\zip-2\*_metadata_json"
  ```

Typical outputs:
- `figure_2_exterior.png`
- `figure_3_interior.png`

Model Notes
-----------
- Uses a timm ViT backbone (default: `vit_small_patch14_dinov2`), reset to feature mode.
- Embeddings are L2-normalized for cosine similarity.
- Saliency uses gradients of the feature-norm w.r.t. the input (model-agnostic, stable).

Clarifications Needed
---------------------
- Please confirm membership of Datasets A/B/C (project_id lists).
- If you have stronger rules for interior vs exterior classification (beyond filename tokens), share them and we’ll wire them in. If you provide `--ext-meta-glob`, the scripts will use those files to classify images as exterior/interior precisely (by matching filenames per project), falling back to heuristics when a file is not listed.


