"""
Gemini Service for AI Image Generation

Provides architectural concept image generation using Google's Gemini API.
Uses Imagen 3 through the Gemini API for actual image generation.
"""

import os
import uuid
import base64
import logging
import asyncio
from typing import List, Optional
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)

# Try to import google.generativeai
GEMINI_AVAILABLE = False
genai = None

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("google-generativeai not installed. Generation features will be disabled.")


class GeminiService:
    """Service for generating architectural concept images using Gemini."""
    
    def __init__(self, api_key: Optional[str] = None):
        # Import settings here to load .env file
        from ..config import settings
        self.api_key = api_key or settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        self._configured = False
        
        if self.api_key and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=self.api_key)
                self._configured = True
                logger.info("Gemini API configured successfully")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {e}")
    
    def is_available(self) -> bool:
        """Check if Gemini service is available."""
        return GEMINI_AVAILABLE and self._configured
    
    async def generate_concept(
        self,
        prompt: str,
        style: str = "render",
        variation_count: int = 4,
        style_reference_description: Optional[str] = None,
    ) -> List[dict]:
        """
        Generate architectural concept images from a text prompt.
        
        Args:
            prompt: User's architectural concept description
            style: Rendering style (photorealistic, render, sketch)
            variation_count: Number of variations to generate (1, 2, or 4)
            style_reference_description: Optional style reference to condition generation
        
        Returns:
            List of generated image data with URLs and metadata
        """
        if not self.is_available():
            raise RuntimeError("Gemini API is not available. Please configure GEMINI_API_KEY.")
        
        # Build the architectural image prompt
        style_prompts = {
            "photorealistic": "highly realistic architectural photograph, professional photography, natural lighting, detailed materials and textures",
            "render": "professional architectural 3D rendering, clean modern visualization, soft lighting, high quality render",
            "sketch": "architectural concept sketch, hand-drawn style, pencil and ink, conceptual architecture drawing"
        }
        
        style_instruction = style_prompts.get(style, style_prompts["render"])
        
        # Construct the full image generation prompt
        full_prompt = f"{style_instruction}. {prompt}"
        if style_reference_description:
            full_prompt += f". Style inspired by: {style_reference_description}"
        
        generated_images = []
        
        try:
            # Try Imagen 3 first (requires specific API access)
            imagen_success = False
            try:
                # Check if ImageGenerationModel is available
                if hasattr(genai, 'ImageGenerationModel'):
                    imagen = genai.ImageGenerationModel("imagen-3.0-generate-002")
                    
                    for i in range(variation_count):
                        try:
                            variation_prompt = f"{full_prompt} (unique variation {i+1})"
                            
                            response = await asyncio.to_thread(
                                imagen.generate_images,
                                prompt=variation_prompt,
                                number_of_images=1,
                                aspect_ratio="16:9",
                            )
                            
                            if response and hasattr(response, 'images') and response.images:
                                image = response.images[0]
                                image_id = f"gen_{uuid.uuid4().hex[:8]}"
                                
                                # Get image data
                                img_url = None
                                if hasattr(image, '_pil_image') and image._pil_image:
                                    buffered = BytesIO()
                                    image._pil_image.save(buffered, format="PNG")
                                    img_base64 = base64.b64encode(buffered.getvalue()).decode()
                                    img_url = f"data:image/png;base64,{img_base64}"
                                elif hasattr(image, 'data') and image.data:
                                    img_base64 = base64.b64encode(image.data).decode()
                                    img_url = f"data:image/png;base64,{img_base64}"
                                
                                if img_url:
                                    generated_images.append({
                                        "id": image_id,
                                        "url": img_url,
                                        "prompt": prompt,
                                        "style": style,
                                        "variation": i + 1,
                                        "description": f"Generated concept: {prompt}",
                                    })
                                    imagen_success = True
                                    
                        except Exception as e:
                            logger.debug(f"Imagen variation {i+1} failed: {e}")
                            continue
                            
            except Exception as e:
                logger.info(f"Imagen 3 not available: {e}")
            
            if imagen_success and generated_images:
                logger.info(f"Successfully generated {len(generated_images)} images with Imagen 3")
                return generated_images
            
            # Fallback: Use Gemini 2.0 Flash with image generation capabilities
            generated_images = []
            try:
                # Gemini 2.0 Flash Experimental with image generation
                # Must use specific generation config to enable image output
                logger.info("Attempting Gemini 2.0 Flash image generation...")
                
                generation_config = {
                    "temperature": 1,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 8192,
                    "response_modalities": ["image", "text"],  # Enable image output
                    "response_mime_type": "text/plain",
                }
                
                model = genai.GenerativeModel(
                    model_name='gemini-2.0-flash-exp',
                    generation_config=generation_config,
                )
                
                for i in range(variation_count):
                    try:
                        variation_prompt = f"""Generate an architectural visualization image.

REQUIREMENTS:
- Style: {style_instruction}
- Subject: {prompt}
- Variation: {i+1} of {variation_count} (make each unique)

You MUST generate an actual image, not just describe one. Create a high-quality architectural rendering."""
                        
                        # Request image generation
                        response = await asyncio.to_thread(
                            model.generate_content,
                            variation_prompt,
                        )
                        
                        image_id = f"gen_{uuid.uuid4().hex[:8]}"
                        img_url = None
                        description = f"Generated concept: {prompt}"
                        
                        # Check response for image data
                        logger.debug(f"Response type: {type(response)}")
                        logger.debug(f"Response has candidates: {hasattr(response, 'candidates')}")
                        
                        if response and hasattr(response, 'candidates') and response.candidates:
                            candidate = response.candidates[0]
                            logger.debug(f"Candidate has content: {hasattr(candidate, 'content')}")
                            if hasattr(candidate, 'content') and candidate.content:
                                logger.debug(f"Number of parts: {len(candidate.content.parts)}")
                                for part in candidate.content.parts:
                                    part_type = "unknown"
                                    if hasattr(part, 'inline_data') and part.inline_data:
                                        part_type = "image"
                                    elif hasattr(part, 'text') and part.text:
                                        part_type = "text"
                                    logger.debug(f"Part type: {part_type}")
                                    
                                    # Check for inline image data (Gemini 2.0 image output)
                                    if hasattr(part, 'inline_data') and part.inline_data:
                                        data = part.inline_data
                                        if hasattr(data, 'data') and data.data:
                                            mime = getattr(data, 'mime_type', 'image/png')
                                            img_base64 = base64.b64encode(data.data).decode()
                                            img_url = f"data:{mime};base64,{img_base64}"
                                            logger.info(f"Generated image for variation {i+1}")
                                            break
                                    # Also capture text description as fallback
                                    elif hasattr(part, 'text') and part.text:
                                        description = part.text[:300]
                        
                        if not img_url:
                            logger.warning(f"Variation {i+1}: No image in response, got text: {description[:100]}")
                        
                        generated_images.append({
                            "id": image_id,
                            "url": img_url,
                            "prompt": prompt,
                            "style": style,
                            "variation": i + 1,
                            "description": description,
                        })
                        
                    except Exception as e:
                        logger.warning(f"Gemini Flash variation {i+1} failed: {e}")
                        generated_images.append({
                            "id": f"gen_{uuid.uuid4().hex[:8]}",
                            "url": None,
                            "prompt": prompt,
                            "style": style,
                            "variation": i + 1,
                            "description": f"Concept: {prompt}",
                        })
                
            except Exception as e:
                logger.warning(f"Gemini 2.0 Flash failed: {e}")
                logger.warning(f"Exception type: {type(e).__name__}")
                
                # Check if any images were generated before the error
                images_with_urls = [img for img in generated_images if img.get("url")]
                if images_with_urls:
                    logger.info(f"Returning {len(images_with_urls)} images generated before error")
                    return generated_images
                
                # Final fallback: Gemini 1.5 Flash (text only, for descriptions)
                try:
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    
                    for i in range(variation_count):
                        try:
                            variation_prompt = f"""You are an architectural visualization expert. 
Describe in detail what an image would look like for this architectural concept:
- Style: {style_instruction}
- Concept: {prompt}
- Variation {i+1} of {variation_count}

Provide a vivid, detailed description of this architectural visualization."""
                            
                            response = await asyncio.to_thread(
                                model.generate_content,
                                variation_prompt
                            )
                            
                            description = response.text if response.text else f"Architectural concept: {prompt}"
                            
                            generated_images.append({
                                "id": f"gen_{uuid.uuid4().hex[:8]}",
                                "url": None,
                                "prompt": prompt,
                                "style": style,
                                "variation": i + 1,
                                "description": description[:500],
                            })
                            
                        except Exception as e:
                            logger.error(f"Gemini 1.5 variation {i+1} failed: {e}")
                            generated_images.append({
                                "id": f"gen_{uuid.uuid4().hex[:8]}",
                                "url": None,
                                "prompt": prompt,
                                "style": style,
                                "variation": i + 1,
                                "description": f"Concept: {prompt}",
                            })
                            
                except Exception as e:
                    logger.error(f"All Gemini models failed: {e}")
                    # Return placeholder entries
                    for i in range(variation_count):
                        generated_images.append({
                            "id": f"gen_{uuid.uuid4().hex[:8]}",
                            "url": None,
                            "prompt": prompt,
                            "style": style,
                            "variation": i + 1,
                            "description": f"Architectural concept: {prompt}",
                        })
            
            return generated_images
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            raise RuntimeError(f"Image generation failed: {str(e)}")
    
    async def extract_style(self, image_bytes: bytes) -> dict:
        """
        Extract style description from a reference image using Gemini Vision.
        
        Args:
            image_bytes: Raw image bytes
        
        Returns:
            Dictionary with extracted style information
        """
        if not self.is_available():
            raise RuntimeError("Gemini API is not available. Please configure GEMINI_API_KEY.")
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Convert bytes to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Create the analysis prompt
            prompt = """Analyze this architectural image and extract the following:

1. **Materials**: List the primary visible materials (e.g., concrete, wood, glass, steel, brick)
2. **Color Palette**: Describe the dominant colors and tones
3. **Massing**: Describe the overall form and volumetric composition
4. **Lighting Quality**: Describe the lighting character (natural, dramatic, soft, etc.)
5. **Architectural Style**: Identify the style if recognizable
6. **Key Design Elements**: Note distinctive features

Provide a concise, professional architectural description that could be used to generate similar imagery."""

            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, pil_image]
            )
            
            return {
                "description": response.text if response.text else "Unable to extract style description",
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Style extraction failed: {e}")
            return {
                "description": "Style extraction failed",
                "success": False,
                "error": str(e)
            }
    
    async def analyze_architectural_image(self, image_bytes: bytes) -> dict:
        """
        Analyze an architectural image for various properties.
        
        Args:
            image_bytes: Raw image bytes
        
        Returns:
            Dictionary with analysis results
        """
        if not self.is_available():
            raise RuntimeError("Gemini API is not available")
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            pil_image = Image.open(BytesIO(image_bytes))
            
            prompt = """Analyze this architectural image and provide:
1. Building typology (residential, commercial, cultural, etc.)
2. Estimated era/style period
3. Key materials visible
4. Climate responsiveness features
5. Notable design qualities

Respond in a structured JSON format."""

            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, pil_image]
            )
            
            return {
                "analysis": response.text,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "analysis": None,
                "success": False,
                "error": str(e)
            }


# Global service instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the global Gemini service instance."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

