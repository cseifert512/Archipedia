from pydantic import Field
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Model settings
    model_name: str = Field(default="vit_base_patch14_dinov2", env="MODEL_NAME")
    emb_dim: int = Field(default=768, env="EMB_DIM")
    
    # OpenAI settings (for text search)
    openai_api_key: str | None = Field(default=None, env="OPENAI_API_KEY")
    openai_embedding_model: str = Field(default="text-embedding-3-small", env="OPENAI_EMBEDDING_MODEL")
    
    # Gemini settings (for generation)
    gemini_api_key: str | None = Field(default=None, env="GEMINI_API_KEY")
    
    # Cloudflare R2 settings (for image hosting)
    r2_account_id: str | None = Field(default=None, env="R2_ACCOUNT_ID")
    r2_access_key_id: str | None = Field(default=None, env="R2_ACCESS_KEY_ID")
    r2_secret_access_key: str | None = Field(default=None, env="R2_SECRET_ACCESS_KEY")
    r2_bucket_name: str = Field(default="archipedia-images", env="R2_BUCKET_NAME")
    r2_public_url: str | None = Field(default=None, env="R2_PUBLIC_URL")
    
    # FAISS settings
    faiss_nlist: int = Field(default=4096, env="FAISS_NLIST")
    faiss_m: int = Field(default=16, env="FAISS_M")
    
    # Search settings
    topk_default: int = Field(default=50, env="TOPK_DEFAULT")
    patch_grid: int = Field(default=4, env="PATCH_GRID")
    
    # Data paths
    data_dir: str = Field(default="data", env="DATA_DIR")
    embeddings_dir: str = Field(default="embeddings", env="EMBEDDINGS_DIR")
    index_dir: str = Field(default="index", env="INDEX_DIR")
    
    # API settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")

    # Study/beta settings
    allowed_origins: str = Field(default="*", env="ALLOWED_ORIGINS")  # comma-separated
    study_token: str | None = Field(default=None, env="STUDY_TOKEN")
    max_upload_mb: int = Field(default=10, env="MAX_UPLOAD_MB")
    allow_pdf: bool = Field(default=True, env="ALLOW_PDF")
    upload_tmp_dir: str = Field(default="/tmp", env="UPLOAD_TMP_DIR")
    
    # Clerk authentication settings
    # Get from Clerk Dashboard: https://dashboard.clerk.com
    clerk_frontend_api: str | None = Field(default=None, env="CLERK_FRONTEND_API")
    clerk_secret_key: str | None = Field(default=None, env="CLERK_SECRET_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    @property
    def images_dir(self) -> Path:
        return Path(self.data_dir) / "images"
    
    @property
    def plans_dir(self) -> Path:
        return Path(self.data_dir) / "plans"
    
    @property
    def metadata_csv(self) -> Path:
        return Path(self.data_dir) / "metadata" / "projects.csv"
    
    @property
    def image_embeddings_dir(self) -> Path:
        return Path(self.embeddings_dir) / "image"
    
    @property
    def patch_embeddings_dir(self) -> Path:
        return Path(self.embeddings_dir) / "patch"
    
    @property
    def faiss_index_path(self) -> Path:
        return Path(self.index_dir) / "faiss_ivfpq.index"
    
    @property
    def idmap_path(self) -> Path:
        return Path(self.index_dir) / "idmap.json"

# Global settings instance
settings = Settings()
