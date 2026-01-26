"""
Gemini Service for AI Image Generation

Provides architectural concept image generation using Google's Gemini API.
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
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
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
        
        # Build the architectural system prompt
        style_prompts = {
            "photorealistic": "highly realistic architectural photograph, professional photography, natural lighting, detailed materials",
            "render": "architectural rendering, 3D visualization, clean presentation, professional architectural render",
            "sketch": "architectural sketch, hand-drawn concept, pencil drawing, conceptual architecture"
        }
        
        style_instruction = style_prompts.get(style, style_prompts["render"])
        
        system_prompt = f"""You are generating an architectural visualization image.
Style: {style_instruction}
Focus on: realistic materials, proper scale, buildable designs, architectural quality.
The image should look like a professional architectural {style}."""

        # Add style reference conditioning if provided
        full_prompt = f"{system_prompt}\n\nConcept: {prompt}"
        if style_reference_description:
            full_prompt += f"\n\nStyle reference: {style_reference_description}"
        
        generated_images = []
        
        try:
            # Use Gemini's imagen model for image generation
            # Note: The actual API may vary based on Gemini version
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            for i in range(variation_count):
                try:
                    # Generate with variation in the prompt
                    variation_prompt = f"{full_prompt}\n\n(Variation {i+1} of {variation_count} - create a unique interpretation)"
                    
                    # For now, we'll generate a placeholder response
                    # In production, this would call the actual Imagen API
                    response = await asyncio.to_thread(
                        model.generate_content,
                        variation_prompt
                    )
                    
                    # Create image data structure
                    image_id = f"gen_{uuid.uuid4().hex[:8]}"
                    
                    generated_images.append({
                        "id": image_id,
                        "url": None,  # Will be populated after storage
                        "prompt": prompt,
                        "style": style,
                        "variation": i + 1,
                        "description": response.text if response.text else f"Generated concept for: {prompt}",
                    })
                    
                except Exception as e:
                    logger.error(f"Failed to generate variation {i+1}: {e}")
                    continue
            
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

