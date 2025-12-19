#!/usr/bin/env python3
"""
AI-Powered Project Enrichment Script

Uses OpenAI GPT-4 (with vision for images) to:
1. Extract detailed project information from titles and images
2. Generate comprehensive metadata fields
3. Create extensive tags for search functionality
4. Fill in all documentation fields

Usage:
    python scripts/enrich_projects_ai.py --limit 10  # Process first 10 projects
    python scripts/enrich_projects_ai.py              # Process all projects
"""

import os
import sys
import json
import csv
import argparse
import asyncio
import base64
import httpx
from pathlib import Path
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from openai import OpenAI, AsyncOpenAI
except ImportError:
    print("OpenAI package not found. Install with: pip install openai")
    sys.exit(1)


@dataclass
class EnrichedProject:
    """Comprehensive project metadata structure."""
    # Core identifiers
    project_id: str
    archdaily_id: str = ""
    archdaily_url: str = ""
    
    # Basic info
    title: str = ""
    title_clean: str = ""  # Without architect name
    architect: str = ""
    architect_full: str = ""  # Full firm name
    
    # Location
    city: str = ""
    region: str = ""
    country: str = ""
    continent: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    
    # Dates
    year_completed: int = 0
    year_designed: int = 0
    construction_start: int = 0
    construction_duration_months: int = 0
    
    # Building classification
    typology: str = ""
    typology_secondary: str = ""
    program: str = ""  # Detailed program description
    building_use: str = ""  # residential, commercial, institutional, etc.
    
    # Physical characteristics
    building_area_sqm: float = 0.0
    site_area_sqm: float = 0.0
    floors_above_ground: int = 0
    floors_below_ground: int = 0
    height_meters: float = 0.0
    
    # Design characteristics
    massing_type: str = ""  # compact, linear, courtyard, pavilion, etc.
    circulation_type: str = ""  # central, linear, radial, etc.
    spatial_organization: str = ""
    structural_system: str = ""  # concrete frame, steel, timber, masonry, etc.
    
    # Facade/envelope
    facade_material_primary: str = ""
    facade_material_secondary: str = ""
    facade_color: str = ""
    wwr_band: str = ""  # window-to-wall ratio
    glazing_type: str = ""
    shading_strategy: str = ""
    
    # Climate & sustainability
    climate_bin: str = ""  # tropical, arid, temperate, continental, polar
    climate_zone_koppen: str = ""
    sustainability_features: List[str] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)
    passive_strategies: List[str] = field(default_factory=list)
    
    # Interior
    interior_materials: List[str] = field(default_factory=list)
    lighting_strategy: str = ""
    acoustic_treatment: str = ""
    
    # Context
    urban_context: str = ""  # urban, suburban, rural, natural
    site_conditions: str = ""
    orientation: str = ""
    landscape_integration: str = ""
    
    # Awards & recognition
    awards: List[str] = field(default_factory=list)
    publications: List[str] = field(default_factory=list)
    
    # Project narrative
    description_short: str = ""  # 1-2 sentences
    description_long: str = ""  # Full paragraph
    design_concept: str = ""
    notable_features: List[str] = field(default_factory=list)
    
    # Search tags (comprehensive)
    tags: List[str] = field(default_factory=list)
    
    # Image analysis results
    exterior_characteristics: List[str] = field(default_factory=list)
    interior_characteristics: List[str] = field(default_factory=list)
    
    # Metadata
    enrichment_date: str = ""
    enrichment_model: str = ""
    confidence_score: float = 0.0
    
    # Original data
    image_ids: List[str] = field(default_factory=list)


# R2 CDN base URL
R2_BASE = "https://pub-96a82c12e12a4f05b29760410a5e8f45.r2.dev"


def get_image_url(image_id: str) -> str:
    """Generate R2 CDN URL for an image."""
    return f"{R2_BASE}/images/{image_id}.jpg"


def get_thumb_url(image_id: str) -> str:
    """Generate R2 CDN URL for a thumbnail."""
    return f"{R2_BASE}/thumbs/{image_id}.jpg"


async def download_image_as_base64(url: str, max_size_kb: int = 500) -> Optional[str]:
    """Download an image and convert to base64 for GPT-4 Vision."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                # Check size
                content = response.content
                if len(content) > max_size_kb * 1024:
                    # Image too large, skip or resize
                    return None
                return base64.b64encode(content).decode('utf-8')
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
    return None


def parse_project_title(title: str) -> tuple[str, str]:
    """Parse project title to extract clean name and architect."""
    # Common patterns: "Project Name / Architect Name" or "Project Name - Architect"
    separators = [' / ', ' - ', ' – ', ' | ']
    for sep in separators:
        if sep in title:
            parts = title.split(sep, 1)
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()
    return title, ""


def extract_archdaily_id(project_id: str) -> str:
    """Extract ArchDaily numeric ID from project_id."""
    # Format: p_project_name_1234567
    parts = project_id.split('_')
    if parts and parts[-1].isdigit():
        return parts[-1]
    return ""


ENRICHMENT_PROMPT = """You are an expert architectural researcher. Analyze this architecture project and provide comprehensive metadata.

PROJECT TITLE: {title}
ARCHDAILY URL: {url}
KNOWN LOCATION (lat, lon): {lat}, {lon}

Based on the title, URL, and any images provided, fill in as much information as possible. For unknown fields, make educated guesses based on architectural knowledge, or leave empty if truly unknown.

Respond with a JSON object containing:

{{
  "title_clean": "Project name without architect",
  "architect": "Primary architect/firm name",
  "architect_full": "Full firm name with any partners",
  
  "city": "City name",
  "region": "State/Province/Region",
  "country": "Country name",
  "continent": "Continent (Asia, Europe, North America, South America, Africa, Oceania)",
  
  "year_completed": 2024,
  "year_designed": 2022,
  
  "typology": "Primary building type (museum, school, library, residential, office, etc.)",
  "typology_secondary": "Secondary type if mixed-use",
  "program": "Detailed program description",
  "building_use": "residential/commercial/institutional/industrial/cultural/religious/mixed",
  
  "building_area_sqm": 0,
  "site_area_sqm": 0,
  "floors_above_ground": 0,
  "floors_below_ground": 0,
  "height_meters": 0,
  
  "massing_type": "compact/linear/courtyard/pavilion/tower/clustered/fragmented",
  "circulation_type": "central/linear/radial/spiral/distributed",
  "spatial_organization": "Description of how spaces are organized",
  "structural_system": "concrete frame/steel frame/timber/masonry/hybrid",
  
  "facade_material_primary": "Primary facade material",
  "facade_material_secondary": "Secondary facade material",
  "facade_color": "Dominant facade color",
  "wwr_band": "low (0-30%)/medium (30-50%)/high (50-70%)/very high (70%+)",
  "glazing_type": "Description of glazing",
  "shading_strategy": "Description of sun shading if visible",
  
  "climate_bin": "tropical/arid/temperate/continental/polar",
  "climate_zone_koppen": "Specific Köppen climate classification if known",
  "sustainability_features": ["List of visible or likely sustainability features"],
  "passive_strategies": ["List of passive design strategies"],
  
  "interior_materials": ["List of interior materials if visible"],
  "lighting_strategy": "Natural/artificial lighting approach",
  
  "urban_context": "urban/suburban/rural/natural",
  "site_conditions": "Description of site (slope, waterfront, etc.)",
  "orientation": "Primary building orientation if apparent",
  "landscape_integration": "How building relates to landscape",
  
  "description_short": "1-2 sentence project summary",
  "description_long": "Full paragraph describing the project",
  "design_concept": "Main design concept or idea",
  "notable_features": ["List of notable architectural features"],
  
  "tags": ["Extensive list of 30-50 searchable tags covering: materials, style, features, spatial qualities, program elements, construction methods, climate response, cultural context, architectural movements, etc."],
  
  "exterior_characteristics": ["Visual characteristics from exterior images"],
  "interior_characteristics": ["Visual characteristics from interior images"],
  
  "confidence_score": 0.8
}}

Be thorough with tags - they should cover:
- Materials (concrete, glass, timber, brick, stone, metal, etc.)
- Architectural style (modernist, brutalist, minimalist, vernacular, etc.)
- Spatial qualities (open plan, double height, courtyard, atrium, etc.)
- Features (cantilever, skylight, green roof, ramp, etc.)
- Climate response (natural ventilation, thermal mass, shading, etc.)
- Program specifics (reading room, gallery, classroom, lobby, etc.)
- Construction (prefab, in-situ, modular, etc.)
- Context (urban, waterfront, hillside, forest, etc.)

Return ONLY valid JSON, no other text."""


VISION_PROMPT = """Analyze these architectural photographs and describe:

1. EXTERIOR CHARACTERISTICS:
- Facade materials and colors
- Massing and form
- Roof type and features
- Window patterns and proportions
- Entrance design
- Landscape context
- Scale relative to surroundings

2. INTERIOR CHARACTERISTICS (if interior images present):
- Interior materials (floors, walls, ceilings)
- Spatial qualities (height, openness, flow)
- Lighting (natural/artificial)
- Furniture and fixtures style
- Color palette

3. NOTABLE FEATURES:
- Unique architectural elements
- Sustainability features visible
- Structural expression
- Special details

Respond as JSON with keys: exterior_characteristics, interior_characteristics, notable_features (all as lists of strings)."""


class ProjectEnricher:
    """Enriches project metadata using OpenAI."""
    
    def __init__(self, api_key: Optional[str] = None, use_vision: bool = True):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key)
        self.async_client = AsyncOpenAI(api_key=self.api_key)
        self.use_vision = use_vision
        self.model = "gpt-4o"  # GPT-4 with vision
        self.text_model = "gpt-4o-mini"  # Faster for text-only
        
    async def analyze_images(self, image_ids: List[str], max_images: int = 3) -> Dict:
        """Analyze project images using GPT-4 Vision."""
        if not self.use_vision or not image_ids:
            return {}
        
        # Select a mix of exterior and interior images
        exteriors = [img for img in image_ids if 'exterior' in img.lower()]
        interiors = [img for img in image_ids if 'interior' in img.lower()]
        
        selected = exteriors[:2] + interiors[:1]  # 2 exterior, 1 interior max
        if not selected:
            selected = image_ids[:max_images]
        
        # Download images
        image_contents = []
        for img_id in selected[:max_images]:
            url = get_thumb_url(img_id)  # Use thumbnails for speed
            b64 = await download_image_as_base64(url)
            if b64:
                image_contents.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{b64}",
                        "detail": "low"  # Use low detail for cost savings
                    }
                })
        
        if not image_contents:
            return {}
        
        try:
            response = await self.async_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": VISION_PROMPT},
                            *image_contents
                        ]
                    }
                ],
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            print(f"Vision analysis failed: {e}")
            return {}
    
    async def enrich_project(self, project_data: Dict) -> EnrichedProject:
        """Enrich a single project with AI-generated metadata."""
        project_id = project_data.get("project_id", "")
        title = project_data.get("title", project_data.get("projectTitle", ""))
        url = project_data.get("archdaily_url", project_data.get("projectUrl", ""))
        lat = project_data.get("lat", project_data.get("latitude", 0))
        lon = project_data.get("lon", project_data.get("longitude", 0))
        image_ids = project_data.get("image_ids", [])
        
        # Parse image_ids if it's a string representation of a list
        if isinstance(image_ids, str):
            try:
                image_ids = eval(image_ids)
            except:
                image_ids = []
        
        print(f"Enriching: {title[:60]}...")
        
        # Parse title for initial data
        title_clean, architect = parse_project_title(title)
        archdaily_id = extract_archdaily_id(project_id)
        
        # Build URL if not provided
        if not url and archdaily_id:
            url = f"https://www.archdaily.com/{archdaily_id}"
        
        # Analyze images first (if enabled)
        vision_data = {}
        if self.use_vision and image_ids:
            vision_data = await self.analyze_images(image_ids)
        
        # Build enrichment prompt
        prompt = ENRICHMENT_PROMPT.format(
            title=title,
            url=url,
            lat=lat,
            lon=lon
        )
        
        # Add vision context if available
        if vision_data:
            vision_context = f"\n\nIMAGE ANALYSIS RESULTS:\n{json.dumps(vision_data, indent=2)}"
            prompt += vision_context
        
        try:
            response = await self.async_client.chat.completions.create(
                model=self.text_model,
                messages=[
                    {"role": "system", "content": "You are an expert architectural researcher. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2500,
                response_format={"type": "json_object"}
            )
            
            enriched_data = json.loads(response.choices[0].message.content)
            
            # Create EnrichedProject object
            project = EnrichedProject(
                project_id=project_id,
                archdaily_id=archdaily_id,
                archdaily_url=url,
                title=title,
                image_ids=image_ids if isinstance(image_ids, list) else [],
                enrichment_date=datetime.now().isoformat(),
                enrichment_model=self.text_model,
            )
            
            # Update with enriched data
            for key, value in enriched_data.items():
                if hasattr(project, key):
                    # Capitalize list fields for professional presentation
                    if isinstance(value, list) and key in [
                        "tags", "notable_features", "sustainability_features", 
                        "passive_strategies", "certifications", "awards",
                        "exterior_characteristics", "interior_characteristics",
                        "interior_materials"
                    ]:
                        value = [item.title() if isinstance(item, str) else item for item in value]
                    setattr(project, key, value)
            
            # Merge vision data
            if vision_data:
                if vision_data.get("exterior_characteristics"):
                    project.exterior_characteristics = vision_data["exterior_characteristics"]
                if vision_data.get("interior_characteristics"):
                    project.interior_characteristics = vision_data["interior_characteristics"]
                if vision_data.get("notable_features"):
                    project.notable_features = list(set(project.notable_features + vision_data["notable_features"]))
            
            # Ensure latitude/longitude are preserved
            if lat and lon:
                project.latitude = float(lat)
                project.longitude = float(lon)
            
            return project
            
        except Exception as e:
            print(f"Enrichment failed for {project_id}: {e}")
            # Return minimal project
            return EnrichedProject(
                project_id=project_id,
                title=title,
                title_clean=title_clean,
                architect=architect,
                archdaily_url=url,
                latitude=float(lat) if lat else 0.0,
                longitude=float(lon) if lon else 0.0,
                image_ids=image_ids if isinstance(image_ids, list) else [],
                enrichment_date=datetime.now().isoformat(),
                confidence_score=0.0
            )


def load_projects(data_dir: Path) -> List[Dict]:
    """Load projects from metadata files."""
    projects = []
    
    # Try projects.csv first
    projects_csv = data_dir / "metadata" / "projects.csv"
    if projects_csv.exists():
        with open(projects_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                projects.append(row)
        print(f"Loaded {len(projects)} projects from projects.csv")
        return projects
    
    # Fallback to individual JSON files
    metadata_dir = data_dir / "metadata"
    for json_file in metadata_dir.glob("p_*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                projects.append(data)
        except Exception as e:
            print(f"Failed to load {json_file}: {e}")
    
    print(f"Loaded {len(projects)} projects from JSON files")
    return projects


def deduplicate_projects(projects: List[Dict]) -> List[Dict]:
    """Deduplicate projects by base project ID (remove exterior/interior variants)."""
    seen = {}
    for project in projects:
        project_id = project.get("project_id", project.get("projectId", ""))
        
        # Extract base ID (remove _exteriors_, _interiors_, _diagrams_ suffixes)
        base_id = project_id
        for suffix in ["_exteriors_", "_interiors_", "_diagrams_"]:
            if suffix in base_id:
                base_id = base_id.split(suffix)[0]
                break
        
        if base_id not in seen:
            # Merge image_ids from all variants
            seen[base_id] = project.copy()
            seen[base_id]["project_id"] = base_id
        else:
            # Merge image_ids
            existing_images = seen[base_id].get("image_ids", [])
            new_images = project.get("image_ids", [])
            if isinstance(existing_images, str):
                try:
                    existing_images = eval(existing_images)
                except:
                    existing_images = []
            if isinstance(new_images, str):
                try:
                    new_images = eval(new_images)
                except:
                    new_images = []
            seen[base_id]["image_ids"] = list(set(existing_images + new_images))
    
    return list(seen.values())


async def main():
    parser = argparse.ArgumentParser(description="Enrich project metadata using AI")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of projects to process")
    parser.add_argument("--skip", type=int, default=0, help="Skip first N projects")
    parser.add_argument("--no-vision", action="store_true", help="Disable image analysis")
    parser.add_argument("--output", type=str, default="projects_enriched.jsonl", help="Output file name")
    parser.add_argument("--data-dir", type=str, default="data", help="Data directory path")
    args = parser.parse_args()
    
    # Check API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set")
        print("Set it with: $env:OPENAI_API_KEY = 'your-key-here'")
        sys.exit(1)
    
    # Load projects
    data_dir = Path(__file__).parent.parent / args.data_dir
    projects = load_projects(data_dir)
    
    # Deduplicate
    projects = deduplicate_projects(projects)
    print(f"After deduplication: {len(projects)} unique projects")
    
    # Apply skip and limit
    projects = projects[args.skip:]
    if args.limit:
        projects = projects[:args.limit]
    
    print(f"Processing {len(projects)} projects...")
    
    # Initialize enricher
    enricher = ProjectEnricher(api_key=api_key, use_vision=not args.no_vision)
    
    # Output file
    output_path = data_dir / "metadata" / args.output
    
    # Process projects
    enriched_count = 0
    with open(output_path, 'a', encoding='utf-8') as f:
        for i, project in enumerate(projects):
            try:
                enriched = await enricher.enrich_project(project)
                
                # Write as JSONL
                f.write(json.dumps(asdict(enriched), ensure_ascii=False) + '\n')
                f.flush()
                
                enriched_count += 1
                print(f"[{enriched_count}/{len(projects)}] Enriched: {enriched.title_clean or enriched.title[:50]}")
                print(f"  Tags: {len(enriched.tags)} | Confidence: {enriched.confidence_score:.1%}")
                
                # Rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                print(f"Failed to process project {i}: {e}")
                continue
    
    print(f"\n[OK] Enriched {enriched_count} projects")
    print(f"[OK] Output saved to: {output_path}")
    
    # Also create a summary CSV for quick viewing
    summary_csv = output_path.with_suffix('.csv')
    print(f"[OK] Creating summary CSV: {summary_csv}")
    
    # Read JSONL and write CSV summary
    with open(output_path, 'r', encoding='utf-8') as f:
        enriched_projects = [json.loads(line) for line in f if line.strip()]
    
    if enriched_projects:
        csv_fields = [
            'project_id', 'title_clean', 'architect', 'city', 'country',
            'typology', 'massing_type', 'climate_bin', 'year_completed',
            'description_short', 'confidence_score'
        ]
        
        with open(summary_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction='ignore')
            writer.writeheader()
            for project in enriched_projects:
                writer.writerow({k: project.get(k, '') for k in csv_fields})
        
        print(f"[OK] Summary CSV saved")


if __name__ == "__main__":
    asyncio.run(main())

