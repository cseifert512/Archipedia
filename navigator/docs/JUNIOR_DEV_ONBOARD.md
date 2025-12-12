## Archipedia – Junior Dev Onboarding

Welcome to the Archipedia index‑layer codebase. This document is a practical guide for a new developer joining the project.

---

## 1. What this app does

Archipedia is an **architectural precedent search engine**. You can:

- Upload an image (plan, facade, interior) and get **visually similar projects**.
- Browse a gallery of curated projects and drill into per‑project image sets.
- Adjust **visual / spatial / regional** weights and filters to refine results.

The backend is a FastAPI service that:

- Embeds images with a DINOv2 model (`vit_base_patch14_dinov2`, 768‑dim).
- Searches a FAISS index built over those embedding vectors.
- Hydrates hits with metadata (title, country, typology, etc.) and spatial features.

The frontend (`ui-v2`) is a React/Vite app that calls the backend APIs and renders the UI.

---

## 2. Local setup

### 2.1. Backend (`navigator/`)

1. **Install Python** (3.11+ recommended).
2. From `navigator/`, create and activate a virtualenv:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # on Windows
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Ensure the **data directory** exists and has:

   - `data/images/**` – project image folders.
   - `data/embeddings/index.faiss`, `data/embeddings/id_map.json`, `data/embeddings/image/*.npy`.
   - `data/metadata/projects.csv`, `data/metadata/spatial.csv`.

5. Set recommended environment variables (PowerShell example):

   ```powershell
   $env:MODEL_NAME = "vit_base_patch14_dinov2"
   $env:EMB_DIM = "768"
   # Optional: study token and CORS
   # $env:STUDY_TOKEN = "your-token"
   # $env:ALLOWED_ORIGINS = "http://localhost:5173"
   ```

6. Run the backend:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   Health check: visit `http://localhost:8000/healthz`.

### 2.2. Frontend (`ui-v2/`)

1. From `ui-v2/`:

   ```bash
   npm install
   npm run dev
   ```

2. The app should be available at `http://localhost:5173`.

3. For local development, the default backend base URL is `http://localhost:8000`. If you deploy the backend elsewhere (e.g. Render), set:

   ```bash
   VITE_API_BASE=http://your-backend-url
   ```

   in `ui-v2/.env.local`.

---

## 3. How search works (pipeline overview)

### 3.1. Embeddings and index

1. **Embed images** with `scripts/embed_images.py`:

   ```bash
   python scripts/embed_images.py --data_dir data --model vit_base_patch14_dinov2
   ```

   This:

   - Walks `data/images/**` and loads each image.
   - Runs the DINOv2 model to produce a 768‑dim vector per image.
   - Saves vectors to `data/embeddings/image/*.npy`.
   - Builds `data/embeddings/id_map.json`, mapping FAISS ids to:
     - `image_id`
     - `project_id`
     - `thumb` (image URL).

2. **Build FAISS index** with `scripts/build_faiss.py`:

   ```bash
   python scripts/build_faiss.py --data_dir data
   ```

   This:

   - Reads all `.npy` vectors from `data/embeddings/image`.
   - Builds a FAISS index with dimension `d=768`.
   - Writes `data/embeddings/index.faiss`.

3. The **backend** uses:

   - `FaissStore.search(q, top_k)` to query the index.
   - `FaissStore.results_payload(D, I)` to hydrate FAISS hits to JSON rows.

### 3.2. Request flow

For `/search/file` (image upload) the flow is:

1. The frontend posts an image to `/search/file`.
2. Backend:
   - Reads and downscales the image (`downsample_pil`).
   - Embeds it with `embed_pil` (DINOv2).
   - Uses `FaissStore.search` to get nearest neighbors.
   - Hydrates via `results_payload` (project metadata + thumb URLs).
   - Calls fusion utilities (`fuse_and_sort`, `apply_lens`) to score and filter.
3. Response contains ranked results with:

   - `project_id`, `image_id`
   - `title`, `country`, `typology`, `climate_bin`, `massing_type`
   - `thumb_url`
   - debug info (weights, distances) for UI experimentation.

---

## 4. Adding / adjusting filters

Filters live at two levels:

1. **Attribute filters** (typology, climate, massing, etc.) – driven by metadata.
2. **UI filters** (sliders, checkboxes) – in `ResultsPage.tsx`.

To add a new attribute filter end‑to‑end:

1. **Add a metadata column** to `data/metadata/projects.csv`, e.g. `roof_type`.
2. **Teach `FaissStore._hydrate`** to include it:

   - It already converts project rows to dicts; you’d extend the `row.update({...})` mapping.

3. **Extend the Pydantic filter model**:

   - Add a field to `Filters` in `app/models.py`.

4. **Update fusion logic** if the new attribute should affect ranking:

   - Extend `attr_distance` in `app/services/fusion.py`.

5. **Wire into the frontend**:

   - Add a checkbox group / select in `ResultsPage.tsx`.
   - Extend the request body or query params passed to `/search/*` so the backend receives the selection.

When in doubt, trace how the existing `typology` and `climate_bin` filters pass through models → fusion → frontend.

---

## 5. Day 1–3 learning path

### Day 1 – Orientation

- Skim:
  - `navigator/docs/ARCHITECTURE.md` (this document + architecture).
  - `navigator/app/main.py` – see how routers and services are wired.
  - `navigator/app/faiss_service.py` – understand `FaissStore`.
- Run the system locally:
  - Bring up backend and frontend.
  - Hit `/healthz`, `/projects`, `/projects/<some-id>/images` in a browser.
  - Try a few image searches in the UI.

### Day 2 – Read the search pipeline

- Backend:
  - Study `app/services/model.py` (embedding helper).
  - Study `app/services/fusion.py` (how weights and distances combine).
  - Read `app/api/routes/search.py` and `/upload.py`.
- Scripts:
  - Read `scripts/embed_images.py` and `scripts/build_faiss.py`.
  - Run `scripts/debug_embedding_dim.py` to see model/index dims.

### Day 3 – Make a safe change

- Add a **tiny** UX improvement or filter:
  - E.g., expose an existing metadata field in `ResultsPage.tsx`.
- Or add a small debug endpoint:
  - E.g., `/debug/index-stats` that returns `N`, `d`, and some histograms from `FaissStore`.
- Write down:
  - What you changed.
  - How you tested it (curl commands, manual UI checks).

By the end of Day 3 you should be comfortable:

- Tracing a request from UI → API router → services → FAISS → response.
- Making small schema‑preserving changes.
- Rebuilding embeddings + index in a dev environment without breaking data.


