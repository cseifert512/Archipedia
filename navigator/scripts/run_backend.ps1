# navigator/scripts/run_backend.ps1
$env:MODEL_NAME = "vit_base_patch14_dinov2"
$env:EMB_DIM = "768"

# Optional: tighten later if you want
$env:FAISS_NLIST = "4096"
$env:FAISS_M = "16"

uvicorn app.main:app --reload --port 8000
