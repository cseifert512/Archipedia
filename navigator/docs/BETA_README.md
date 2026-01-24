## Archipedia – System Diagram (Textual)

This document describes the major components and data flows in the Archipedia index‑layer system in textual form.

---

## Components

1. **Browser (React/Vite app – `ui-v2/`)**
   - Renders pages (`Homepage`, `ImageSearchPage`, `ResultsPage`, `ProjectDetailPage`).
   - Calls the backend via JSON/HTTP using `fetch` in `src/services/api.ts`.
   - Stores transient UI state in `sessionStorage` (e.g. last search results, preferred image per project).

2. **API Gateway (FastAPI app – `app/main.py`)**
   - Hosts the HTTP endpoints (`/search/*`, `/upload/*`, `/projects*`, `/feedback`, `/admin/*`, `/healthz`).
   - Sets up CORS, static file mounts (`/images`, `/plans`).
   - Wires routers under `app/api/routes/`.

3. **Index Services (`app/services/*`)**
   - `store.py` – manages a singleton `FaissStore` instance, bound to `settings.data_dir`.
   - `model.py` – manages a singleton DINOv2 model + transform used for `embed_pil`.
   - `spatial.py` – computes spatial metrics from plan images.
   - `fusion.py` – merges visual / spatial / attribute distances using adjustable weights.
   - `sessions.py` – manages `SessionStore` for feedback and evolving weights.

4. **Index & Metadata (`app/faiss_service.py`, `data/**`)**
   - `FaissStore` wraps:
     - `index.faiss` – FAISS nearest‑neighbour index.
     - `id_map.json` – maps FAISS ids to `image_id`, `project_id`, `thumb`.
     - `projects.csv` – per‑project metadata.
     - `spatial.csv` – per‑project spatial features.
   - Responsible for:
     - Running FAISS searches.
     - Hydrating raw indices to metadata rows.
     - Normalizing spatial features.

5. **Session & Feedback (`app/session.py`, `data/logs`, `data/sessions`)**
   - Tracks per‑session weights and logs interactions.
   - Provides nudging utilities to gradually adjust search weighting based on feedback.

6. **Offline Scripts (`navigator/scripts/*.py`)**
   - `embed_images.py` – builds embeddings and `id_map.json`.
   - `build_faiss.py` – builds `index.faiss`.
   - `compute_latent_2d.py` – builds `latent_2d.csv`.
   - Others support scraping, geocoding, telemetry, etc.

---

## Information Flow – Image Search

1. **User action**
   - User uploads or drops an image on `Homepage` or `ImageSearchPage`.
   - UI converts it to a file/blob or passes a public URL.

2. **Frontend → Backend**
   - For local files: POST `/search/file` with a multipart `file` field.
   - For URLs: GET `/search/url?url=...&top_k=...`.

3. **Backend processing**
   - `search.py` router:
     1. Reads the image (either from upload or via `requests.get` for URLs).
     2. Optionally downsamples (`downsample_pil`) to keep inference fast.
     3. Embeds via `embed_pil` (DINOv2) → 768‑dim normalized vector.
     4. Calls `FaissStore.search(q, search_k)` to get FAISS distances and ids.
     5. Hydrates hits via `FaissStore.results_payload(D, I)`:
        - Looks up each FAISS id in `id_map.json` and `projects.csv`.
        - Attaches `project_id`, `image_id`, `thumb_url`, and metadata.
        - Skips any hits without a valid `project_id` or thumbnail on disk.
     6. Passes hydrated results, distances, and optional spatial features into `fuse_and_sort`:
        - Computes a combined score from visual / spatial / attribute distances.
        - Applies lensing and filters.
     7. Returns a JSON payload with ranked results and debug info.

4. **Backend → Frontend**
   - Response shape includes:
     - `results[]` with `project_id`, `image_id`, `title`, `country`, `thumb_url`, `distance`, etc.
     - `query_id`, `latency_ms`, and debug fields about weights and filters.

5. **Frontend rendering**
   - `ResultsPage.tsx` maps results to `ProjectCard` props.
   - The `ProjectCard` renders:
     - Thumbnail (`ImageWithFallback`).
     - Title / location / year, match percentage.
   - Clicking a card navigates to `/project/:id`, where `ProjectDetailPage` calls `/projects/{project_id}/images` to render all images for that project.

---

## Information Flow – Feedback

1. User clicks a positive/negative control in the UI.
2. Frontend sends a POST to `/feedback` with:
   - `query_id`
   - `project_id` and/or `image_id`
   - feedback type (e.g. “good match”, “bad match”).
3. Backend:
   - `feedback.py` router validates the payload using `Feedback` model.
   - `SessionStore` logs the event in `data/logs/feedback.jsonl`.
   - Weight nudges are computed (`compute_weight_nudges`) and applied to the in‑memory session via `apply_weight_nudges`.
4. Future searches in that session can read the updated weights and influence ranking.

---

## Interaction Layer (future)

The planned node‑based / graph UI layer will sit **on top of** this Index Layer:

- It can:
  - Call the same FastAPI endpoints as the current React frontend.
  - Or, in a Python environment, import `FaissStore`, `embed_pil`, and fusion utilities directly.
- The Index Layer remains responsible for:
  - Owning and updating embeddings and indices.
  - Enforcing consistent model/index dimension (`emb_dim` vs FAISS `d`).
  - Serving search and metadata APIs.





