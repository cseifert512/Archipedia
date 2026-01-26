# Archipedia: Product Functionality Report

> **Report Generated:** January 26, 2026  
> **Product Version:** Pre-launch Beta  
> **Report Type:** Comprehensive Feature Inventory

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Product Overview](#core-product-overview)
3. [Search Engine Capabilities](#1-search-engine-capabilities)
4. [Node-Based Workflow System](#2-node-based-workflow-system)
5. [Boards & Collections System](#3-boards--collections-system)
6. [AI Generation Integration](#4-ai-generation-integration)
7. [Backend API Services](#5-backend-api-services)
8. [User Interface Pages](#6-user-interface-pages)
9. [Data & Indexing System](#7-data--indexing-system)
10. [Technical Architecture](#8-technical-architecture)
11. [Enterprise Features](#9-enterprise-features)
12. [Analytics & Feedback System](#10-analytics--feedback-system)

---

## Executive Summary

**Archipedia** is a sophisticated visual search engine for architectural precedents with an integrated node-based workflow system. The platform enables architects to:

- **Search** for architectural projects using images, text, or hybrid queries
- **Organize** references into shareable boards with multiple layout modes
- **Explore** design variations through a visual node-based canvas
- **Generate** AI-powered architectural concepts grounded in real precedents
- **Export** presentation-ready PDFs and boards

### Key Statistics
- **~2,000+ indexed architectural projects** from ArchDaily
- **Multi-modal search**: Visual (DINOv2), Semantic (text), Spatial (plan analysis), Hybrid
- **13+ specialized node types** for workflow automation
- **Full CRUD boards system** with grid and canvas modes
- **Gemini AI integration** for concept generation and style analysis

---

## Core Product Overview

Archipedia combines two primary capabilities:

### Phase 1: Search Engine (✅ Complete)
A visual search engine for architectural precedents with intelligent matching algorithms, multi-modal search, and rich filtering capabilities.

### Phase 2: Node-Based Workflow System (✅ Complete)
A React Flow-powered canvas for building visual workflows that chain search, analysis, and generation operations without code.

---

## 1. Search Engine Capabilities

### 1.1 Search Methods

| Search Type | Description | API Endpoint | Status |
|-------------|-------------|--------------|--------|
| **Image Search** | Upload an image to find visually similar projects | `POST /search/file` | ✅ Complete |
| **URL Search** | Search using a public image URL | `GET /search/url` | ✅ Complete |
| **Text Search** | Natural language description search using OpenAI embeddings | `POST /search/text` | ✅ Complete |
| **ID-Based Search** | "More like this" - search using existing image embedding | `POST /search/id` | ✅ Complete |
| **Hybrid Search** | Combined visual + semantic search | `POST /search/hybrid` | ✅ Complete |
| **Multi-Image Search** | Search using 1-5 positive + negative reference images | `POST /search/multi-image` | ✅ Complete |
| **Vector Search** | Direct embedding vector search | `POST /search/vector` | ✅ Complete |

### 1.2 Fusion Weighting System

Three adjustable weighting dials control result prioritization:

| Weight | Description | Color |
|--------|-------------|-------|
| **Visual Similarity** | Form, materials, aesthetic style | Blue |
| **Spatial Logic** | Layout, circulation, program organization | Green |
| **Regional/Attribute** | Climate, typology, massing type | Orange |

**Technical Details:**
- Weights are normalized to sum to 1.0
- Spatial weight is zeroed if spatial features unavailable
- Results are fused using: `score = w_visual * d_visual + w_spatial * d_spatial + w_attr * d_attr`

### 1.3 Filtering Capabilities

| Filter | Options | Implementation |
|--------|---------|----------------|
| **Typology** | Museum, Residential, Office, Cultural, etc. | Metadata match |
| **Climate Zone** | Tropical, Continental, Maritime, etc. | Metadata match |
| **Massing Type** | Pavilion, Tower, Courtyard, etc. | Metadata match |
| **Strict Mode** | Exclude non-matching results entirely | Hard filter |

### 1.4 Advanced Search Features

#### Lens Filtering
- Filter results to specific image IDs or project IDs
- Enables "neighborhood" search within subsets

#### Pagination
- Full pagination support with `page` and `page_size` parameters
- Returns `has_more` flag and `total_count`

#### Autocomplete
- Real-time search suggestions from project titles, typologies, architects, cities, and tags
- Prefix and substring matching with relevance scoring

#### Patch Reranking
- Optional detailed re-ranking using patch-level similarity
- Computes 4x4 grid patches for fine-grained matching

### 1.5 Spatial Feature Analysis

For floor plan searches, the system computes:
- **Elongation**: Major/minor axis ratio
- **Convexity**: Area vs convex hull ratio
- **Room Count**: Connected components above threshold
- **Corridor Ratio**: Skeleton density

---

## 2. Node-Based Workflow System

### 2.1 Available Node Types

| Node Type | Description | Category |
|-----------|-------------|----------|
| **PrecedentNode** | Display architectural precedents from search | Input |
| **TextNode** | Simple text container for storing/passing text | Input |
| **ImageNode** | Image container with upload/drag-drop | Input |
| **ScalarNode** | Custom parameters with min/max constraints | Input |
| **GenerateNode** | AI-powered concept image generation | Generation |
| **StyleReferenceNode** | Extract style from reference image | Generation |
| **ValidateNode** | Find real projects similar to generated concept | Validation |
| **AttributeFilterNode** | Filter precedents by attributes | Processing |
| **ResultsNode** | Display search results in grid | Output |
| **OperatorANDNode** | Combine multiple inputs (logical AND) | Routing |
| **OperatorORNode** | Union of multiple inputs (logical OR) | Routing |
| **OperatorNOTNode** | Exclude one set from another | Routing |
| **BaseNode** | Base component for all nodes | System |

### 2.2 Workflow Engine Features

| Feature | Description |
|---------|-------------|
| **DAG Execution** | Automatic topological sorting for correct execution order |
| **Cycle Detection** | Prevents infinite loops in workflow graphs |
| **Intelligent Caching** | Avoids redundant API calls with automatic cache management |
| **Type-Safe Connections** | Port type validation prevents invalid connections |
| **Parallel Execution** | Independent nodes execute simultaneously |
| **Progress Tracking** | Real-time execution status updates |

### 2.3 Port Types

Supported data flow types:
- `text` - Text strings
- `image` - Image data
- `video` - Video content
- `audio` - Audio content  
- `3d` - 3D model data
- `data` - Generic data
- `any` - Universal connector

### 2.4 State Management Stores

| Store | Purpose |
|-------|---------|
| `canvasStore.ts` | Canvas state (nodes, edges, viewport) |
| `executionStore.ts` | Workflow execution state and progress |
| `workflowStore.ts` | Workflow persistence and management |
| `selectionStore.ts` | Multi-select and selection state |
| `tlCanvasStore.ts` | TLDraw canvas state (for canvas mode boards) |

---

## 3. Boards & Collections System

### 3.1 Board Features

| Feature | Description |
|---------|-------------|
| **Create Boards** | Create named boards with optional subtitle/description |
| **Multiple Layouts** | Grid mode or Canvas (tldraw) mode |
| **Share Links** | 12-character URL-safe share tokens |
| **PDF Export** | Export boards to PDF using Playwright |
| **Block Reordering** | Drag-and-drop block reordering |

### 3.2 Block Types

| Block Type | Purpose | Data Fields |
|------------|---------|-------------|
| **Reference** | Architectural project reference | project_id, thumb_url, title, architect, location, year, caption, tags |
| **Text** | Text content (h1, h2, body, quote) | style, text |
| **Divider** | Visual separator | variant (line, space-sm, space-lg) |
| **Frame** | Grouping container | title, background |

### 3.3 Canvas Mode Features

For boards in canvas mode:
- **TLDraw Integration**: Full infinite canvas with frame-based slides
- **16:9 Frame Presets**: Slide-oriented layouts
- **Version Control**: Optimistic concurrency with `expected_version` checks
- **Camera State**: Persistent zoom and pan position

### 3.4 Export Capabilities

| Export Type | Format | Features |
|-------------|--------|----------|
| **Long Document** | PDF | Continuous scrolling document |
| **Slides** | PDF (16:9) | Individual slides per frame |
| **Page Formats** | Letter, A4, 16:9 | Configurable dimensions |

---

## 4. AI Generation Integration

### 4.1 Generation Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /generate/concept` | Generate architectural concept images | ✅ Complete |
| `POST /generate/validate` | Find real projects similar to concept | ✅ Complete |
| `POST /generate/validate-file` | Validate uploaded concept image | ✅ Complete |
| `POST /generate/style-extract` | Extract style from reference image | ✅ Complete |
| `GET /generate/status` | Check service availability | ✅ Complete |

### 4.2 Concept Generation

**Request Parameters:**
- `prompt`: Text description of architectural concept
- `style`: photorealistic, render, or sketch
- `variations`: 1-4 concept variations
- `style_reference_description`: Optional style conditioning

**Workflow:**
1. User provides text prompt
2. Gemini generates concept images
3. Embeddings computed automatically
4. Ready for downstream search/validation

### 4.3 Style Extraction (Gemini Vision)

Analyzes reference images to extract:
- **Materials**: Primary visible materials
- **Color Palette**: Dominant colors and tones
- **Massing**: Form and volumetric composition
- **Lighting Quality**: Natural, dramatic, soft, etc.
- **Architectural Style**: Period identification
- **Key Design Elements**: Distinctive features

### 4.4 Concept Validation

The unique "Generate → Search → Validate" workflow:
1. Generate AI concept images
2. Automatically search for similar real projects
3. Return validation score and matched precedents
4. Ground AI concepts in real-world buildable architecture

---

## 5. Backend API Services

### 5.1 Core API Structure

```
/api
├── /search           # All search endpoints
├── /projects         # Project CRUD
├── /boards           # Board management
├── /generate         # AI generation
├── /upload           # File upload endpoints
├── /feedback         # User feedback
├── /autocomplete     # Search suggestions
├── /latent/points    # 2D latent space visualization
├── /enterprise/lead  # Lead capture
└── /healthz          # Health check
```

### 5.2 Project Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects` | GET | List all projects with metadata |
| `/projects/{id}` | GET | Get single project details |
| `/projects/{id}/images` | GET | List project images |

### 5.3 Session Management

- **Session Store**: SQLite-based session persistence
- **Weight Nudging**: Automatic weight adjustment based on feedback
- **Query Tracking**: Generates unique query IDs for each search

### 5.4 FAISS Vector Store

Features:
- In-memory FAISS index for fast similarity search
- L2-normalized embeddings (DINOv2)
- ID mapping with metadata hydration
- R2/S3 URL transformation for image serving
- Spatial feature storage

---

## 6. User Interface Pages

### 6.1 Core Pages

| Page | Route | Description |
|------|-------|-------------|
| **Homepage** | `/` | Landing page with search entry |
| **Landing Page** | `/landing` | Marketing landing page |
| **Text Search** | `/search/text` | Natural language search interface |
| **Image Search** | `/search/image` | Image upload search interface |
| **Results Page** | `/results` | Search results with workflow canvas |
| **Project Detail** | `/projects/:id` | Single project view with all images |
| **Classic Search** | `/classic` | Traditional search interface |

### 6.2 Board Pages

| Page | Route | Description |
|------|-------|-------------|
| **Board Edit** | `/boards/:id/edit` | Edit board in grid mode |
| **Board View** | `/boards/:id` | View board |
| **Board Canvas** | `/boards/:id/canvas` | TLDraw canvas mode |
| **Board Print** | `/boards/:id/print` | Print-optimized view |
| **Board Share** | `/b/:shareToken` | Public share link |

### 6.3 Other Pages

| Page | Route | Description |
|------|-------|-------------|
| **Enterprise** | `/enterprise` | Enterprise landing page with lead capture |
| **Contact** | `/contact` | Contact form |
| **Demo** | `/demo` | Interactive demo |
| **Sign In** | `/sign-in` | Authentication (placeholder) |
| **Study Search/Results** | `/study/*` | A/B testing study variants |

---

## 7. Data & Indexing System

### 7.1 Data Sources

| Data Type | Storage | Format |
|-----------|---------|--------|
| **Project Metadata** | `projects.csv` | CSV with structured fields |
| **Image Embeddings** | `embeddings/` | FAISS index + NPY files |
| **Text Index** | `text_embeddings.npz` | Compressed NumPy archive |
| **ID Mapping** | `id_map.json` | JSON with image→project mapping |
| **Spatial Features** | Computed on-the-fly | 4-element feature vector |
| **Latent 2D Coords** | `latent_2d.csv` | For visualization |

### 7.2 Project Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `project_id` | string | Unique identifier |
| `title` | string | Project name |
| `architect` | string | Architect/firm name |
| `country` | string | Country location |
| `city` | string | City location |
| `year_completed` | int | Completion year |
| `typology` | string | Building type |
| `climate_bin` | string | Climate zone |
| `massing_type` | string | Massing category |
| `wwr_band` | string | Window-to-wall ratio |
| `building_area_sqm` | float | Total area |
| `floors_above_ground` | int | Number of floors |
| `description` | string | Project description |
| `materials` | string | Materials list |
| `tags` | string | Pipe-separated tags |
| `image_ids` | list | Associated image IDs |

### 7.3 Available Scripts

| Script | Purpose |
|--------|---------|
| `build_faiss.py` | Build FAISS index from embeddings |
| `embed_images.py` | Generate DINOv2 embeddings |
| `embed_text.py` | Generate text embeddings |
| `geocode_projects.py` | Add geographic coordinates |
| `import_dataset.py` | Import new project data |
| `prepare_search_index.py` | Prepare text search index |
| `upload_r2.py` | Upload images to Cloudflare R2 |

---

## 8. Technical Architecture

### 8.1 Frontend Stack

| Technology | Purpose |
|------------|---------|
| **React 18+** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **React Flow** | Node canvas |
| **TLDraw** | Canvas mode boards |
| **Tailwind CSS** | Styling |
| **Shadcn/UI** | Component library |
| **Zustand** | State management |
| **Wouter** | Routing |
| **Framer Motion** | Animations |

### 8.2 Backend Stack

| Technology | Purpose |
|------------|---------|
| **FastAPI** | API framework |
| **Python 3.11** | Runtime |
| **FAISS** | Vector similarity search |
| **DINOv2 (ViT)** | Image embeddings |
| **OpenAI** | Text embeddings |
| **Gemini** | AI generation |
| **SQLite** | Boards persistence |
| **Pydantic** | Data validation |
| **Pillow** | Image processing |
| **scikit-image** | Spatial analysis |

### 8.3 Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| **Frontend** | Vercel | Static hosting |
| **Backend** | Render | API hosting |
| **Images** | Cloudflare R2 | Object storage |
| **Database** | SQLite (local) | Boards data |

### 8.4 Environment Configuration

Key environment variables:
- `GEMINI_API_KEY` - Gemini API for generation
- `OPENAI_API_KEY` - Text embeddings
- `R2_BUCKET_NAME` - Image storage bucket
- `R2_PUBLIC_URL` - Public CDN URL
- `ALLOWED_ORIGINS` - CORS configuration
- `MODEL_NAME` - DINOv2 model variant

---

## 9. Enterprise Features

### 9.1 Enterprise Landing Page

Dedicated `/enterprise` page with:
- Feature highlights for firms
- ROI calculator messaging
- Lead capture form

### 9.2 Lead Capture

| Field | Type | Required |
|-------|------|----------|
| `name` | string | No |
| `email` | string | Yes |
| `company` | string | No |
| `role` | string | No |
| `asset_count` | string | No |
| `deployment` | string | No |
| `message` | string | No |

Leads stored in `DATA_DIR/logs/enterprise_leads.jsonl`

### 9.3 Planned Enterprise Features

- **User Accounts**: Supabase Auth integration
- **Private Uploads**: Firm-specific project libraries
- **Team Sharing**: Shared collections and boards
- **SSO**: Enterprise single sign-on
- **API Access**: Direct API integration

---

## 10. Analytics & Feedback System

### 10.1 Feedback Endpoint

`POST /feedback` accepts:
- `session_id`: Current session
- `query_id`: Search query identifier
- `liked`: Array of liked image IDs
- `disliked`: Array of disliked image IDs

### 10.2 Weight Nudging Algorithm

Based on user feedback, weights are automatically adjusted:
- Positive feedback → reinforce current weights
- Negative feedback → adjust weights away from current

### 10.3 Logging

| Log Type | Location | Format |
|----------|----------|--------|
| **Feedback Events** | Session store | JSONL |
| **Enterprise Leads** | `logs/enterprise_leads.jsonl` | JSONL |
| **Search Telemetry** | `reports/telemetry.json` | JSON |
| **Debug Logs** | `.cursor/debug.log` | NDJSON |

---

## Summary

Archipedia is a comprehensive architectural precedent platform with:

### ✅ Complete Features
1. **Multi-modal Search** (image, text, hybrid, multi-image)
2. **Fusion Weighting System** (visual, spatial, attribute)
3. **Advanced Filtering** (typology, climate, massing)
4. **Node-Based Workflow System** (13+ node types)
5. **Boards System** (grid and canvas modes)
6. **PDF Export** (via Playwright)
7. **AI Generation** (Gemini integration)
8. **Concept Validation** (ground AI in real precedents)
9. **Style Extraction** (Gemini Vision)
10. **Autocomplete** (real-time search suggestions)
11. **Pagination** (full pagination support)
12. **Enterprise Lead Capture**

### 🚧 Planned Features
1. User authentication (Supabase)
2. Private project uploads
3. Team collaboration
4. Detail-level search
5. Notes & lessons learned
6. Cloud sync integrations

---

*This report provides a comprehensive inventory of Archipedia's functionality as of January 26, 2026.*

