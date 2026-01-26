# Imagine Mode: AI Generation Integration

> **Last Updated:** January 25, 2026  
> **Status:** Planning  
> **Integration Target:** Existing Node Canvas (React Flow)

---

## Overview

Add AI image generation capabilities to Archipedia's existing node-based canvas interface. The unique value: **Generate → Search → Validate** — create concept images, then instantly find real built projects that validate the approach.

**Core Value Proposition:**
> "Generate architectural concepts. Instantly find real buildings that prove they work."

---

## Integration Strategy

### Why Use the Existing Canvas

The React Flow node canvas is already built with:
- Drag-and-drop node creation
- Connection-based data flow
- Results visualization
- Export functionality

**Don't reinvent the wheel.** Add generation as new node types that plug into the existing system.

```
CURRENT CANVAS                      ENHANCED CANVAS
─────────────────                   ─────────────────

┌──────────┐                        ┌──────────┐
│  Image   │                        │  Image   │
│  Input   │───→ Search             │  Input   │───→ Search
└──────────┘                        └──────────┘
                                    
┌──────────┐                        ┌──────────┐     ┌──────────┐
│  Text    │                        │  Text    │     │ Generate │
│  Input   │───→ Search             │  Input   │───→ │   Node   │───→ Search
└──────────┘                        └──────────┘     └──────────┘
                                                           │
                                                           ↓
                                                     [AI Concept]
                                                           │
                                                           ↓
                                                     [Real Projects]
```

---

## New Node Types

### 1. GenerateNode (Primary)

**Purpose:** Convert text prompt into AI-generated architectural concept image

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Generate Concept                              [≡] [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prompt:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ A cantilevered timber pavilion over water with      │   │
│  │ floor-to-ceiling glazing and a green roof           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Style: ○ Photorealistic  ● Architectural Render  ○ Sketch │
│                                                             │
│  [✨ Generate]                        Variations: [4] ▼    │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │          │ │          │ │          │ │          │      │
│  │  [img1]  │ │  [img2]  │ │  [img3]  │ │  [img4]  │      │
│  │          │ │          │ │          │ │          │      │
│  │   [✓]    │ │   [ ]    │ │   [ ]    │ │   [ ]    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Selected output connects to next node →               ●───│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Inputs:**
- Text prompt (required)
- Style reference image (optional, from upstream node)

**Outputs:**
- Generated image(s)
- Embedding vector (auto-computed for downstream search)

**Node Data Model:**

```typescript
interface GenerateNodeData {
  prompt: string;
  style: 'photorealistic' | 'render' | 'sketch';
  variationCount: 1 | 2 | 4;
  styleReferenceImageUrl?: string;
  generatedImages: GeneratedImage[];
  selectedImageIndex: number;
  status: 'idle' | 'generating' | 'complete' | 'error';
}

interface GeneratedImage {
  id: string;
  url: string;
  embedding: number[];  // For downstream search
  prompt: string;
  createdAt: string;
}
```

---

### 2. StyleReferenceNode

**Purpose:** Provide style/aesthetic reference to condition generation

```
┌─────────────────────────────────────────────────────────┐
│  🎨 Style Reference                          [≡] [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐                               │
│  │                     │  Drop image or select from    │
│  │    [Image Here]     │  search results               │
│  │                     │                               │
│  └─────────────────────┘                               │
│                                                         │
│  Extract:  ☑ Materials  ☑ Palette  ☐ Massing          │
│                                                         │
│  Style description (auto-extracted):                    │
│  "Warm wood tones, exposed concrete, brass accents,    │
│   natural light from clerestory windows"               │
│                                                         │
│                                             output ●───│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3. ValidateNode (Auto-Search)

**Purpose:** Automatically search for real projects similar to generated/input image

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Find Real Projects                       [≡] [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ───● input (from Generate or any image)               │
│                                                         │
│  ┌─────────────────────┐  Similar Built Projects:      │
│  │                     │                               │
│  │  [Generated Image]  │  1. Nordic Pavilion (89%)     │
│  │                     │  2. Serpentine 2023 (84%)     │
│  │  "Your concept"     │  3. Casa Barragan (79%)       │
│  └─────────────────────┘  4. Thermal Baths (76%)       │
│                           5. Chapel of Light (72%)      │
│                                                         │
│  Show: [5] ▼  Min similarity: [70%] ▼                  │
│                                                         │
│                                             output ●───│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Insight:** This node takes ANY image (generated or uploaded) and finds real projects. It's the validation step that makes generation useful.

---

## Workflow Examples

### Workflow 1: Basic Generate → Validate

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Text     │     │  Generate  │     │  Validate  │
│   Input    │────→│   Node     │────→│   Node     │
│            │     │            │     │            │
│ "timber    │     │ [concepts] │     │ [real      │
│  pavilion" │     │            │     │  projects] │
└────────────┘     └────────────┘     └────────────┘
```

### Workflow 2: Style-Conditioned Generation

```
┌────────────┐
│   Style    │
│ Reference  │─────┐
│ [Zumthor]  │     │
└────────────┘     │
                   ▼
┌────────────┐  ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Text     │  │  Generate  │     │  Validate  │     │  Results   │
│   Input    │─→│   Node     │────→│   Node     │────→│   Grid     │
│ "museum"   │  │            │     │            │     │            │
└────────────┘  └────────────┘     └────────────┘     └────────────┘
```

### Workflow 3: Iterative Exploration

```
                              ┌────────────┐
                         ┌───→│  Generate  │───→ Validate
                         │    │  Option A  │
┌────────────┐     ┌─────┴──┐ └────────────┘
│   Brief    │     │ Branch │
│   Parser   │────→│  Node  │ ┌────────────┐
│            │     │        │→│  Generate  │───→ Validate
└────────────┘     └─────┬──┘ │  Option B  │
                         │    └────────────┘
                         │    ┌────────────┐
                         └───→│  Generate  │───→ Validate
                              │  Option C  │
                              └────────────┘
```

### Workflow 4: Competition Sprint

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Brief   │──→│  Auto    │──→│  User    │──→│  Extract │
│  Parser  │   │  Search  │   │  Selects │   │  Common  │
│          │   │          │   │  Top 3   │   │  Themes  │
└──────────┘   └──────────┘   └──────────┘   └────┬─────┘
                                                  │
       ┌──────────────────────────────────────────┘
       │
       ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Generate │──→│ Validate │──→│  User    │──→│  Export  │
│ 20       │   │ Each     │   │  Picks   │   │  Board   │
│ Concepts │   │ Concept  │   │  Top 5   │   │  PDF     │
└──────────┘   └──────────┘   └──────────┘   └──────────┘

Total time: 2 hours instead of 20 hours
```

---

## API Integration

### New Backend Endpoint

```python
# navigator/app/routers/generate.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai

router = APIRouter(prefix="/generate", tags=["generate"])

class GenerateRequest(BaseModel):
    prompt: str
    style: str = "render"  # photorealistic, render, sketch
    style_reference_url: Optional[str] = None
    variations: int = 4

class GeneratedImage(BaseModel):
    id: str
    url: str
    embedding: List[float]
    prompt: str

class GenerateResponse(BaseModel):
    images: List[GeneratedImage]
    search_ready: bool  # True if embeddings computed

@router.post("/concept", response_model=GenerateResponse)
async def generate_concept(request: GenerateRequest):
    """
    Generate architectural concept images from text prompt.
    Automatically computes embeddings for downstream search.
    """
    # Build the architectural system prompt
    system_prompt = """
    You are generating architectural visualization images.
    Focus on: realistic materials, proper scale, buildable designs.
    Style: Professional architectural rendering.
    """
    
    full_prompt = f"{system_prompt}\n\n{request.prompt}"
    
    # Add style reference conditioning if provided
    if request.style_reference_url:
        # Extract style description from reference
        style_desc = await analyze_style(request.style_reference_url)
        full_prompt += f"\n\nStyle reference: {style_desc}"
    
    # Generate images using Gemini Imagen
    generated_images = []
    for i in range(request.variations):
        image_data = await gemini_generate_image(
            prompt=full_prompt,
            style=request.style,
            seed=i  # Different seed for variations
        )
        
        # Store image and get URL
        image_url = await store_generated_image(image_data)
        
        # Compute embedding for search
        embedding = await compute_embedding(image_data)
        
        generated_images.append(GeneratedImage(
            id=f"gen_{uuid.uuid4().hex[:8]}",
            url=image_url,
            embedding=embedding,
            prompt=request.prompt
        ))
    
    return GenerateResponse(
        images=generated_images,
        search_ready=True
    )


@router.post("/validate")
async def validate_concept(image_url: str, top_k: int = 10):
    """
    Find real built projects similar to a generated concept.
    This is the validation step that grounds AI in reality.
    """
    # Get or compute embedding
    embedding = await get_or_compute_embedding(image_url)
    
    # Search against real project index
    results = await search_by_embedding(
        embedding=embedding,
        top_k=top_k,
        filter_generated=True  # Only return real projects
    )
    
    return {
        "query_image": image_url,
        "similar_projects": results,
        "validation_score": compute_validation_score(results)
    }
```

### Frontend API Client

```typescript
// frontend/src/lib/generateApi.ts

export interface GenerateOptions {
  prompt: string;
  style: 'photorealistic' | 'render' | 'sketch';
  styleReferenceUrl?: string;
  variations: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  embedding: number[];
  prompt: string;
}

export async function generateConcept(
  options: GenerateOptions
): Promise<GeneratedImage[]> {
  const response = await fetch(`${API_BASE}/generate/concept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  
  const data = await response.json();
  return data.images;
}

export async function validateConcept(
  imageUrl: string,
  topK: number = 10
): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE}/generate/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, top_k: topK }),
  });
  
  const data = await response.json();
  return data.similar_projects;
}
```

---

## Node Component Implementation

### GenerateNode Component

```typescript
// frontend/src/components/Nodes/GenerateNode.tsx
import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { generateConcept, GeneratedImage } from '../../lib/generateApi';

interface GenerateNodeData {
  prompt: string;
  style: 'photorealistic' | 'render' | 'sketch';
  variations: number;
  generatedImages: GeneratedImage[];
  selectedIndex: number;
  status: 'idle' | 'generating' | 'complete' | 'error';
  onDataChange: (data: Partial<GenerateNodeData>) => void;
}

export function GenerateNode({ data, id }: { data: GenerateNodeData; id: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = useCallback(async () => {
    if (!data.prompt.trim()) return;
    
    setIsGenerating(true);
    data.onDataChange({ status: 'generating' });
    
    try {
      const images = await generateConcept({
        prompt: data.prompt,
        style: data.style,
        variations: data.variations,
      });
      
      data.onDataChange({
        generatedImages: images,
        selectedIndex: 0,
        status: 'complete',
      });
    } catch (error) {
      data.onDataChange({ status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [data]);
  
  const handleSelectImage = (index: number) => {
    data.onDataChange({ selectedIndex: index });
  };
  
  return (
    <div className="generate-node bg-white rounded-lg shadow-lg border-2 border-purple-200 w-80">
      {/* Input handle */}
      <Handle type="target" position={Position.Left} id="style-input" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b bg-purple-50 rounded-t-lg flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-purple-900">Generate Concept</span>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Prompt input */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Prompt</label>
          <textarea
            value={data.prompt}
            onChange={(e) => data.onDataChange({ prompt: e.target.value })}
            placeholder="Describe your architectural concept..."
            className="w-full mt-1 p-2 border rounded-md text-sm resize-none h-20"
          />
        </div>
        
        {/* Style selector */}
        <div className="flex gap-2">
          {(['render', 'photorealistic', 'sketch'] as const).map((style) => (
            <button
              key={style}
              onClick={() => data.onDataChange({ style })}
              className={`px-3 py-1 text-xs rounded-full transition ${
                data.style === style
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
        
        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !data.prompt.trim()}
          className="w-full py-2 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate ({data.variations} variations)
            </>
          )}
        </button>
        
        {/* Generated images grid */}
        {data.generatedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {data.generatedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => handleSelectImage(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                  data.selectedIndex === idx
                    ? 'border-purple-600 ring-2 ring-purple-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={img.url}
                  alt={`Generated concept ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {data.selectedIndex === idx && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="image-output" />
    </div>
  );
}
```

---

## Node Registration

Add to existing node types:

```typescript
// frontend/src/components/Nodes/index.ts
export { GenerateNode } from './GenerateNode';
export { ValidateNode } from './ValidateNode';
export { StyleReferenceNode } from './StyleReferenceNode';

// Update nodeTypes map
export const nodeTypes = {
  // Existing
  imageNode: ImageNode,
  textNode: TextNode,
  resultsNode: ResultsNode,
  // ...
  
  // New generation nodes
  generateNode: GenerateNode,
  validateNode: ValidateNode,
  styleReferenceNode: StyleReferenceNode,
};
```

Update node palette:

```typescript
// frontend/src/components/Sidebar/NodePalette.tsx
const nodeCategories = [
  {
    name: 'Input',
    nodes: [
      { type: 'imageNode', label: 'Image', icon: Image },
      { type: 'textNode', label: 'Text', icon: Type },
    ],
  },
  {
    name: 'Generate',  // NEW CATEGORY
    nodes: [
      { type: 'generateNode', label: 'Generate Concept', icon: Sparkles },
      { type: 'styleReferenceNode', label: 'Style Reference', icon: Palette },
    ],
  },
  {
    name: 'Search',
    nodes: [
      { type: 'searchNode', label: 'Search', icon: Search },
      { type: 'validateNode', label: 'Find Real Projects', icon: CheckCircle },
    ],
  },
  {
    name: 'Output',
    nodes: [
      { type: 'resultsNode', label: 'Results Grid', icon: Grid },
      { type: 'exportNode', label: 'Export PDF', icon: Download },
    ],
  },
];
```

---

## Implementation Phases

### Phase 1: Backend (2-3 days) ✅ COMPLETE
- [x] Set up Gemini API integration for image generation
- [x] Create `/generate/concept` endpoint
- [x] Create `/generate/validate` endpoint  
- [x] Create `/generate/style-extract` endpoint
- [ ] Add generated image storage (R2/S3) - *deferred until API keys configured*
- [ ] Auto-compute embeddings for generated images - *deferred*

### Phase 2: Generate Node (2-3 days) ✅ COMPLETE
- [x] Create `GenerateNode` component
- [x] Add to node types and palette
- [x] Implement prompt → generation flow
- [x] Handle loading/error states
- [x] Image selection UI

### Phase 3: Validate Node (1-2 days) ✅ COMPLETE
- [x] Create `ValidateNode` component
- [x] Wire to existing search infrastructure
- [x] Display similar real projects
- [x] Connect output to Results node

### Phase 4: Style Reference (1-2 days) ✅ COMPLETE
- [x] Create `StyleReferenceNode` component
- [x] Implement style extraction (Gemini Vision)
- [x] Connect to Generate node as conditioning input

### Phase 5: Polish & Testing (2-3 days) ✅ COMPLETE
- [x] Error handling and edge cases
- [x] Loading states and feedback
- [x] Node palette integration
- [ ] Workflow templates (pre-built flows) - *to be added by users*
- [x] Documentation

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation latency | <10s for 4 images | API timing |
| Validation relevance | >70% "useful" ratings | User feedback |
| Workflow completion | >60% complete a full Generate→Validate flow | Analytics |
| Time savings | 10x faster than manual reference gathering | User interviews |

---

## Future Enhancements

1. **Batch generation** — Generate 20+ concepts at once
2. **Negative prompts** — "Like this, but NOT like that"
3. **Region editing** — Modify specific parts of generated images
4. **3D integration** — Generate from/to 3D models
5. **Collaboration** — Share generation workflows with team

---

*This document outlines the integration of AI generation into Archipedia's existing canvas interface. The key differentiator is the instant validation against real built architecture.*

