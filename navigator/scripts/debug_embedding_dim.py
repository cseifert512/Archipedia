import sys
from pathlib import Path

import faiss
from PIL import Image

# Make sure the project root (the folder that contains `app/`) is on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import settings
from app.services.model import get_model_and_transform, embed_pil


def main() -> None:
    print("=== debug_embedding_dim ===")
    print("project_root:", ROOT)
    print("settings.model_name:", getattr(settings, "model_name", None))
    print("settings.emb_dim:", getattr(settings, "emb_dim", None))
    print("settings.data_dir:", getattr(settings, "data_dir", None))

    # Inspect model + embedding dimension
    model, tfm = get_model_and_transform()
    print("model class:", type(model).__name__)
    print("model.num_features:", getattr(model, "num_features", None))

    img = Image.new("RGB", (224, 224), color="white")
    vec = embed_pil(img)
    print("embed_pil(vec) shape:", getattr(vec, "shape", None))

    # Load the SAME index path FaissStore uses
    from app.faiss_service import FaissStore

    store = FaissStore(settings.data_dir)
    index = store._index  # type: ignore[attr-defined]
    print("faiss index dimension (index.d):", index.d)

    # Sanity check: make sure we compare 1D vector length to index.d
    if getattr(vec, "ndim", 0) != 1:
        print("WARNING: embed_pil produced non-1D vector:", getattr(vec, "shape", None))
    else:
        print("embed_pil vector length:", vec.shape[0])

    if hasattr(vec, "shape") and vec.shape[-1] != index.d:
        print("MISMATCH: embed dim", vec.shape[-1], "!= index dim", index.d)
    else:
        print("OK: embed dim matches index dim")


if __name__ == "__main__":
    main()