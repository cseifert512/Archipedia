from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Weights(BaseModel):
    visual: float = Field(1.0, ge=0.0, le=1.0)
    spatial: float = Field(0.0, ge=0.0, le=1.0)
    attr: float = Field(0.25, ge=0.0, le=1.0)

class Filters(BaseModel):
    # Inclusion filters (results must match these)
    typology: Optional[List[str]] = None
    climate_bin: Optional[List[str]] = None
    massing_type: Optional[List[str]] = None
    # Exclusion filters (results must NOT match these)
    exclude_typology: Optional[List[str]] = None
    exclude_climate_bin: Optional[List[str]] = None
    exclude_massing_type: Optional[List[str]] = None
    exclude_project_ids: Optional[List[str]] = None

class SearchRequest(BaseModel):
    # Provide either query_image_id or query_vector
    query_image_id: Optional[str] = None
    query_vector: Optional[List[float]] = None
    weights: Weights = Weights()
    filters: Filters = Filters()
    k: int = 50

class WhyBlock(BaseModel):
    patch_match: Optional[Dict] = None  # {image_id, patch_idx, score}
    attr_hits: Optional[Dict[str, str]] = None
    match_reason: Optional[str] = None  # Human-readable explanation (e.g., "Similar visual style")
    matched_attrs: Optional[List[str]] = None  # List of matched attribute strings

class SearchResult(BaseModel):
    project_id: str
    image_id: str
    score: float
    thumb_url: str
    why: WhyBlock = WhyBlock()

class SearchResponse(BaseModel):
    results: List[SearchResult]

class Feedback(BaseModel):
    session_id: str
    query_id: str
    liked: List[str] = []  # image_ids
    disliked: List[str] = []
    weights_before: Optional[Weights] = None  # client echo; optional

class EmbedResponse(BaseModel):
    vector: List[float]
    dimension: int

class ProjectCard(BaseModel):
    project_id: str
    title: str
    country: str
    climate_bin: str
    typology: str
    massing_type: str
    wwr_band: str
    image_ids: List[str]
    plan_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ExplainResponse(BaseModel):
    project_id: str
    explanation: str

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: Optional[Dict] = None
