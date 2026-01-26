"""
Generation Router

Endpoints for AI-powered architectural concept generation and validation.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import time
import numpy as np

from ..services.gemini_service import get_gemini_service
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generate"])


# ============ Request/Response Models ============

class GenerateRequest(BaseModel):
    """Request model for concept generation."""
    prompt: str = Field(..., description="Text description of the architectural concept")
    style: str = Field(default="render", description="Rendering style: photorealistic, render, sketch")
    style_reference_url: Optional[str] = Field(default=None, description="URL of style reference image")
    style_reference_description: Optional[str] = Field(default=None, description="Text description of style reference")
    variations: int = Field(default=4, ge=1, le=4, description="Number of variations to generate")


class GeneratedImage(BaseModel):
    """Model for a generated image."""
    id: str
    url: Optional[str] = None
    prompt: str
    style: str
    variation: int
    description: Optional[str] = None
    embedding: Optional[List[float]] = None


class GenerateResponse(BaseModel):
    """Response model for concept generation."""
    images: List[GeneratedImage]
    search_ready: bool = False
    latency_ms: int
    message: Optional[str] = None


class ValidateRequest(BaseModel):
    """Request model for concept validation."""
    image_url: Optional[str] = Field(default=None, description="URL of image to validate")
    embedding: Optional[List[float]] = Field(default=None, description="Pre-computed embedding vector")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of similar projects to return")
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0, description="Minimum similarity threshold")


class ValidatedProject(BaseModel):
    """Model for a validated similar project."""
    project_id: str
    title: Optional[str] = None
    similarity: float
    thumb_url: Optional[str] = None
    typology: Optional[str] = None
    country: Optional[str] = None


class ValidateResponse(BaseModel):
    """Response model for concept validation."""
    query_image: Optional[str] = None
    similar_projects: List[ValidatedProject]
    validation_score: float
    latency_ms: int


class StyleExtractRequest(BaseModel):
    """Request model for style extraction."""
    image_url: str = Field(..., description="URL of the reference image")


class StyleExtractResponse(BaseModel):
    """Response model for style extraction."""
    description: str
    materials: Optional[List[str]] = None
    palette: Optional[List[str]] = None
    massing_description: Optional[str] = None
    success: bool
    latency_ms: int


# ============ Endpoints ============

@router.get("/status")
async def generation_status():
    """Check if generation service is available."""
    service = get_gemini_service()
    return {
        "available": service.is_available(),
        "message": "Generation service is ready" if service.is_available() else "Generation service not configured. Set GEMINI_API_KEY environment variable."
    }


@router.post("/concept", response_model=GenerateResponse)
async def generate_concept(request: GenerateRequest):
    """
    Generate architectural concept images from a text prompt.
    
    This endpoint uses Gemini's image generation capabilities to create
    architectural visualizations based on the provided description.
    
    The generated images are automatically prepared for downstream search
    operations to find similar real-world projects.
    """
    service = get_gemini_service()
    
    if not service.is_available():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "service_unavailable",
                "message": "Generation service is not configured",
                "suggestion": "Set the GEMINI_API_KEY environment variable to enable generation"
            }
        )
    
    t0 = time.time()
    
    try:
        # Generate concept images
        raw_images = await service.generate_concept(
            prompt=request.prompt,
            style=request.style,
            variation_count=request.variations,
            style_reference_description=request.style_reference_description
        )
        
        # Convert to response format
        images = [
            GeneratedImage(
                id=img["id"],
                url=img.get("url"),
                prompt=img["prompt"],
                style=img["style"],
                variation=img["variation"],
                description=img.get("description"),
                embedding=img.get("embedding")
            )
            for img in raw_images
        ]
        
        latency_ms = int((time.time() - t0) * 1000)
        
        return GenerateResponse(
            images=images,
            search_ready=all(img.embedding is not None for img in images),
            latency_ms=latency_ms,
            message=f"Generated {len(images)} concept variations"
        )
        
    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "generation_failed",
                "message": str(e),
                "suggestion": "Try simplifying your prompt or try again later"
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error in generate_concept: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred during generation",
            }
        )


@router.post("/validate", response_model=ValidateResponse)
async def validate_concept(request: ValidateRequest):
    """
    Find real built projects similar to a generated or uploaded concept.
    
    This is the validation step that grounds AI-generated concepts in reality
    by finding actual architectural precedents with similar characteristics.
    
    Accepts either an image URL or a pre-computed embedding vector.
    """
    t0 = time.time()
    
    # Import here to avoid circular dependencies
    from ..main import get_store, embed_pil, downsample_pil
    from PIL import Image
    from io import BytesIO
    import requests
    
    st = get_store()
    query_embedding = None
    
    # Get embedding from URL or use provided embedding
    if request.embedding:
        query_embedding = np.array(request.embedding, dtype=np.float32)
    elif request.image_url:
        try:
            # Fetch the image
            response = requests.get(request.image_url, timeout=10)
            response.raise_for_status()
            pil = Image.open(BytesIO(response.content))
            pil = downsample_pil(pil)
            query_embedding = embed_pil(pil)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "image_fetch_failed",
                    "message": f"Could not load image: {str(e)[:100]}",
                    "suggestion": "Check that the URL is accessible and points to a valid image"
                }
            )
    else:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "missing_input",
                "message": "Provide either image_url or embedding",
                "suggestion": "Include an image URL or pre-computed embedding vector"
            }
        )
    
    # Search for similar projects
    try:
        D, I = st.search(query_embedding, request.top_k * 2)  # Get extra for filtering
        results = st.results_payload(D, I)
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "search_failed",
                "message": "Failed to search for similar projects"
            }
        )
    
    # Filter and format results
    similar_projects = []
    for result in results:
        # Convert distance to similarity (assuming L2 distance)
        distance = result.get("distance", 0)
        similarity = float(np.exp(-2.0 * distance))  # Exponential decay
        
        if similarity >= request.min_similarity:
            similar_projects.append(ValidatedProject(
                project_id=result.get("project_id", ""),
                title=result.get("title"),
                similarity=round(similarity, 3),
                thumb_url=result.get("thumb_url"),
                typology=result.get("typology"),
                country=result.get("country")
            ))
        
        if len(similar_projects) >= request.top_k:
            break
    
    # Calculate validation score (average similarity of top results)
    if similar_projects:
        validation_score = sum(p.similarity for p in similar_projects[:5]) / min(5, len(similar_projects))
    else:
        validation_score = 0.0
    
    latency_ms = int((time.time() - t0) * 1000)
    
    return ValidateResponse(
        query_image=request.image_url,
        similar_projects=similar_projects,
        validation_score=round(validation_score, 3),
        latency_ms=latency_ms
    )


@router.post("/style-extract", response_model=StyleExtractResponse)
async def extract_style(request: StyleExtractRequest):
    """
    Extract style description from a reference image.
    
    Analyzes the provided image and extracts architectural style characteristics
    including materials, color palette, and massing qualities.
    
    The extracted description can be used to condition concept generation.
    """
    service = get_gemini_service()
    
    if not service.is_available():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "service_unavailable",
                "message": "Style extraction requires Gemini API",
                "suggestion": "Set the GEMINI_API_KEY environment variable"
            }
        )
    
    t0 = time.time()
    
    try:
        # Fetch the image
        import requests
        response = requests.get(request.image_url, timeout=10)
        response.raise_for_status()
        image_bytes = response.content
        
        # Extract style
        result = await service.extract_style(image_bytes)
        
        latency_ms = int((time.time() - t0) * 1000)
        
        return StyleExtractResponse(
            description=result.get("description", ""),
            materials=result.get("materials"),
            palette=result.get("palette"),
            massing_description=result.get("massing"),
            success=result.get("success", False),
            latency_ms=latency_ms
        )
        
    except requests.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "image_fetch_failed",
                "message": f"Could not load image: {str(e)[:100]}",
                "suggestion": "Check that the URL is accessible and points to a valid image"
            }
        )
    except Exception as e:
        logger.error(f"Style extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "extraction_failed",
                "message": "Failed to extract style from image"
            }
        )


@router.post("/validate-file")
async def validate_concept_file(
    file: UploadFile = File(...),
    top_k: int = Query(10, ge=1, le=50),
    min_similarity: float = Query(0.5, ge=0.0, le=1.0),
):
    """
    Find real projects similar to an uploaded concept image.
    
    Alternative to /validate that accepts a file upload directly
    instead of a URL.
    """
    t0 = time.time()
    
    # Import here to avoid circular dependencies
    from ..main import get_store, embed_pil, downsample_pil
    from PIL import Image
    
    try:
        pil = Image.open(file.file)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_image",
                "message": "The uploaded file is not a valid image",
                "suggestion": "Upload a JPG or PNG image file"
            }
        )
    
    # Process and search
    pil = downsample_pil(pil)
    query_embedding = embed_pil(pil)
    
    st = get_store()
    D, I = st.search(query_embedding, top_k * 2)
    results = st.results_payload(D, I)
    
    # Filter and format
    similar_projects = []
    for result in results:
        distance = result.get("distance", 0)
        similarity = float(np.exp(-2.0 * distance))
        
        if similarity >= min_similarity:
            similar_projects.append(ValidatedProject(
                project_id=result.get("project_id", ""),
                title=result.get("title"),
                similarity=round(similarity, 3),
                thumb_url=result.get("thumb_url"),
                typology=result.get("typology"),
                country=result.get("country")
            ))
        
        if len(similar_projects) >= top_k:
            break
    
    validation_score = (
        sum(p.similarity for p in similar_projects[:5]) / min(5, len(similar_projects))
        if similar_projects else 0.0
    )
    
    latency_ms = int((time.time() - t0) * 1000)
    
    return ValidateResponse(
        query_image=None,
        similar_projects=similar_projects,
        validation_score=round(validation_score, 3),
        latency_ms=latency_ms
    )

