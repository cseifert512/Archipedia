#!/usr/bin/env python3
"""
Image Captioning Script for Architecture Images

Uses OpenAI GPT-4 Vision to generate detailed text descriptions
for each image in the dataset. These captions enable text-based
search to find specific images.

Usage:
    python scripts/caption_images.py --limit 100  # Test with 100 images
    python scripts/caption_images.py              # Process all images
    python scripts/caption_images.py --resume     # Resume from last position

Cost estimate: ~$0.01-0.02 per image with GPT-4o-mini vision
For 12,000 images: ~$120-240
"""

import os
import sys
import json
import argparse
import asyncio
import base64
import time
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from openai import AsyncOpenAI
except ImportError:
    print("OpenAI package not found. Install with: pip install openai")
    sys.exit(1)


# Architecture-focused image captioning prompt
CAPTION_PROMPT = """Analyze this architectural photograph for a search database.

Provide TWO things:

1. **DESCRIPTION** (80-120 words): A flowing paragraph describing what you see - building elements, materials, style, spatial qualities, lighting, colors, and context.

2. **KEYWORDS** (30-50 words): A comma-separated list of nouns and descriptive terms visible in the image. Include:
   - Objects: window, door, staircase, column, beam, railing, furniture, lamp, plant, car, person
   - Materials: concrete, glass, brick, wood, steel, stone, metal, tile, fabric
   - Spaces: lobby, corridor, courtyard, balcony, roof, facade, entrance, atrium
   - Qualities: minimalist, industrial, warm, bright, shadowy, geometric, curved, angular
   - Context: urban, residential, commercial, landscape, trees, sky, water

Format your response EXACTLY like this:
DESCRIPTION: [your paragraph here]
KEYWORDS: [word1, word2, word3, ...]"""


class ImageCaptioner:
    """Generates captions for architecture images using GPT-4 Vision."""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        self.max_retries = 3
        self.rate_limit_delay = 0.5  # seconds between requests
        
    async def caption_image(self, image_path: Path) -> Optional[Dict[str, str]]:
        """Generate a caption for a single image. Returns dict with description and keywords."""
        # Read and encode image
        try:
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            print(f"  Error reading {image_path}: {e}")
            return None
        
        # Determine mime type
        suffix = image_path.suffix.lower()
        mime_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(suffix, "image/jpeg")
        
        # Call API with retries
        for attempt in range(self.max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": CAPTION_PROMPT},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{image_data}",
                                        "detail": "low"  # Use low detail for cost savings
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=400,
                )
                
                raw_response = response.choices[0].message.content.strip()
                
                # Parse the response
                description = ""
                keywords = ""
                
                if "DESCRIPTION:" in raw_response and "KEYWORDS:" in raw_response:
                    parts = raw_response.split("KEYWORDS:")
                    description = parts[0].replace("DESCRIPTION:", "").strip()
                    keywords = parts[1].strip() if len(parts) > 1 else ""
                else:
                    # Fallback: treat entire response as description
                    description = raw_response
                
                return {
                    "description": description,
                    "keywords": keywords,
                    "full_text": f"{description} {keywords}"  # Combined for search
                }
                
            except Exception as e:
                if "rate_limit" in str(e).lower():
                    wait_time = (attempt + 1) * 2
                    print(f"  Rate limited, waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                elif attempt < self.max_retries - 1:
                    await asyncio.sleep(1)
                else:
                    print(f"  Error captioning {image_path.name}: {e}")
                    return None
        
        return None


def find_all_images(images_dir: Path) -> List[Path]:
    """Find all image files in the images directory."""
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    images = []
    
    for project_dir in sorted(images_dir.iterdir()):
        if project_dir.is_dir():
            for img_file in sorted(project_dir.iterdir()):
                if img_file.suffix.lower() in extensions:
                    images.append(img_file)
    
    return images


def load_existing_captions(output_file: Path) -> Dict[str, str]:
    """Load existing captions for resume capability."""
    captions = {}
    if output_file.exists():
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        captions[data["image_path"]] = data["caption"]
        except Exception as e:
            print(f"Warning: Error loading existing captions: {e}")
    return captions


async def process_images(
    captioner: ImageCaptioner,
    images: List[Path],
    output_file: Path,
    existing_captions: Dict[str, str],
    batch_size: int = 5,
):
    """Process images in batches with rate limiting."""
    
    # Filter out already-captioned images
    to_process = []
    for img in images:
        rel_path = str(img.relative_to(img.parent.parent))
        if rel_path not in existing_captions:
            to_process.append(img)
    
    print(f"Images to process: {len(to_process)} (skipping {len(images) - len(to_process)} existing)")
    
    if not to_process:
        print("All images already captioned!")
        return
    
    # Open output file in append mode
    with open(output_file, "a", encoding="utf-8") as f:
        processed = 0
        start_time = time.time()
        
        for i in range(0, len(to_process), batch_size):
            batch = to_process[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [captioner.caption_image(img) for img in batch]
            results = await asyncio.gather(*tasks)
            
            # Save results
            for img, result in zip(batch, results):
                if result:
                    rel_path = str(img.relative_to(img.parent.parent))
                    project_id = img.parent.name
                    image_name = img.stem
                    
                    entry = {
                        "image_path": rel_path,
                        "project_id": project_id,
                        "image_name": image_name,
                        "description": result.get("description", ""),
                        "keywords": result.get("keywords", ""),
                        "caption": result.get("full_text", ""),  # Combined for backward compat
                        "captioned_at": datetime.now().isoformat(),
                        "model": captioner.model,
                    }
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                    f.flush()
                    processed += 1
            
            # Progress update
            elapsed = time.time() - start_time
            rate = processed / elapsed if elapsed > 0 else 0
            remaining = (len(to_process) - (i + len(batch))) / rate if rate > 0 else 0
            
            print(f"  [{i + len(batch)}/{len(to_process)}] "
                  f"Processed: {processed} | "
                  f"Rate: {rate:.1f}/s | "
                  f"ETA: {remaining/60:.1f}m")
            
            # Rate limiting
            await asyncio.sleep(captioner.rate_limit_delay)
    
    print(f"\nCompleted! Total captions: {processed}")


async def main():
    parser = argparse.ArgumentParser(description="Generate captions for architecture images")
    parser.add_argument("--data-dir", default="data", help="Data directory path")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of images")
    parser.add_argument("--skip", type=int, default=0, help="Skip first N images")
    parser.add_argument("--batch-size", type=int, default=5, help="Concurrent batch size")
    parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI model to use")
    parser.add_argument("--output", default="image_captions.jsonl", help="Output file name")
    parser.add_argument("--resume", action="store_true", help="Resume from existing captions")
    args = parser.parse_args()
    
    # Check API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set")
        sys.exit(1)
    
    # Setup paths
    data_dir = Path(__file__).parent.parent / args.data_dir
    images_dir = data_dir / "images"
    output_file = data_dir / "metadata" / args.output
    
    print("=" * 60)
    print("ARCHITECTURE IMAGE CAPTIONING")
    print("=" * 60)
    print(f"Images directory: {images_dir}")
    print(f"Output file: {output_file}")
    print(f"Model: {args.model}")
    print("=" * 60)
    
    # Find all images
    print("\nScanning for images...")
    images = find_all_images(images_dir)
    print(f"Found {len(images)} images")
    
    # Apply skip and limit
    images = images[args.skip:]
    if args.limit:
        images = images[:args.limit]
    print(f"Processing {len(images)} images (skip={args.skip}, limit={args.limit})")
    
    # Load existing captions for resume
    existing_captions = {}
    if args.resume or output_file.exists():
        existing_captions = load_existing_captions(output_file)
        print(f"Loaded {len(existing_captions)} existing captions")
    
    # Initialize captioner
    captioner = ImageCaptioner(api_key=api_key, model=args.model)
    
    # Process images
    await process_images(
        captioner,
        images,
        output_file,
        existing_captions,
        batch_size=args.batch_size,
    )
    
    print("\n" + "=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("""
Captions have been saved to image_captions.jsonl

To use these captions for text search:
1. Run the text index update script to incorporate captions
2. Captions will be searchable alongside project metadata
""")


if __name__ == "__main__":
    asyncio.run(main())

