# Archipedia – Index Layer

This repository contains the **index layer** for Archipedia: a full‑stack architectural precedent search engine. It includes:

- A **FastAPI** backend (`navigator/`) that exposes image search and project APIs backed by a FAISS index.
- A **React/Vite** frontend (`ui-v2/`) that provides a minimal, production‑ready search UI.

The goal of this layer is to provide a clean, well‑documented, data‑backed search API that a richer “Interaction Layer” (future node/graph UI) can build on.

---

## Getting started

### Backend (FastAPI)

```bash
cd navigator
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Recommended model / index configuration
$env:MODEL_NAME = "vit_base_patch14_dinov2"
$env:EMB_DIM = "768"

uvicorn app.main:app --reload --port 8000
```

Key endpoints:

- `GET /healthz` – health check
- `POST /search/file` – image upload search
- `GET /search/url` – search by public image URL
- `GET /projects` – list projects
- `GET /projects/{project_id}/images` – project image gallery

### Frontend (React/Vite)

```bash
cd ui-v2
npm install
npm run dev
```

By default the frontend talks to `http://localhost:8000`. To point it at a different backend (e.g. on Render), set:

```bash
VITE_API_BASE=https://your-backend-url
```

in `ui-v2/.env.local`.

---

## Data and indexing

The index layer expects the following structure under `navigator/data/`:

- `images/<project_id>/*.jpg|*.png` – source imagery.
- `embeddings/image/*.npy` – per‑image 768‑dim vectors.
- `embeddings/id_map.json` – mapping from FAISS ids to image/project metadata.
- `embeddings/index.faiss` – FAISS index over all image vectors.
- `metadata/projects.csv` – per‑project metadata.
- `metadata/spatial.csv` – per‑project spatial features.

The standard pipeline is:

1. Embed images:
   ```bash
   cd navigator
   python scripts/embed_images.py --data_dir data --model vit_base_patch14_dinov2
   ```
2. Build FAISS index:
   ```bash
   python scripts/build_faiss.py --data_dir data
   ```

The model (`MODEL_NAME`) and the index must agree on dimensionality (`emb_dim` / FAISS `d`). The `scripts/debug_embedding_dim.py` helper can be used to verify this.

---

## Documentation

- `navigator/docs/ARCHITECTURE.md` – detailed backend + frontend architecture.
- `navigator/docs/JUNIOR_DEV_ONBOARD.md` – onboarding guide and Day 1–3 plan.
- `navigator/docs/SYSTEM_DIAGRAM.md` – textual system and data‑flow diagram.

These are the best starting points for understanding and extending the system.

