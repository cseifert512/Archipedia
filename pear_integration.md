# Pear + Archipedia Integration Strategy

> **Last Updated:** January 25, 2026  
> **Status:** Strategic Planning  
> **Vision:** Design software that thinks as fast as you do

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Product Architecture](#product-architecture)
3. [The Core Insight](#the-core-insight)
4. [Extending the Node-Based Interface](#extending-the-node-based-interface)
5. [Archipedia API Design](#archipedia-api-design)
6. [Pear.design Vision](#peardesign-vision)
7. [Integration Roadmap](#integration-roadmap)
8. [Brand Strategy](#brand-strategy)

---

## The Big Picture

### The Problem with Current Design Software

Current design tools (Rhino, SketchUp, Revit, etc.) are **geometry processors**. They're excellent at manipulating vertices, edges, and faces. But they have:

- **No memory** — doesn't know what you did yesterday
- **No knowledge** — doesn't know what anyone has ever built
- **No intent understanding** — doesn't know *what* you're trying to design
- **No feedback** — can't tell you if your idea is good, common, unusual, or already solved

The feedback loop is brutal:
```
Idea in your head (instant)
      ↓
Model it (hours)
      ↓
Render it (minutes to hours)
      ↓
Evaluate it (your brain, now exhausted)
      ↓
Iterate (back to step 2)
```

**Your brain works at milliseconds. The tools work at hours. That mismatch is the entire problem.**

### What We're Building

**Pear** = Design software that thinks as fast as you do

**Archipedia** = The knowledge layer that makes it intelligent

The relationship:
- Archipedia is the **memory and knowledge** of architecture
- Pear is the **design interface** that thinks with you
- Together: design tools grounded in real precedent, firm knowledge, and architectural intelligence

---

## Product Architecture

```
                    ┌─────────────────────────────┐
                    │           PEAR              │
                    │      (the company)          │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │   ARCHIPEDIA    │           │   PEAR.DESIGN   │
          │                 │           │                 │
          │  archipedia.ai  │    API    │  pear.design    │
          │                 │ ────────→ │                 │
          │  Knowledge      │           │  Design         │
          │  Infrastructure │           │  Interface      │
          │  + Search UI    │           │                 │
          └─────────────────┘           └─────────────────┘
                 │                             │
                 │                             │
                 ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │  Also serves:   │           │  Also integrates│
          │  - Other tools  │           │  with:          │
          │  - Plugins      │           │  - Rhino        │
          │  - 3rd parties  │           │  - SketchUp     │
          └─────────────────┘           │  - Revit        │
                                        └─────────────────┘
```

### Two Distinct Products

| | Archipedia | Pear.design |
|---|---|---|
| **Domain** | archipedia.ai | pear.design |
| **What it is** | Knowledge infrastructure + search | Design interface |
| **User job** | "Find me references" | "Help me design" |
| **Use pattern** | Episodic (search, find, leave) | Continuous (live in it while designing) |
| **Standalone value** | Yes | Yes (but better with Archipedia) |
| **Could serve competitors?** | Yes (and that's good — ecosystem play) | No |

### Why Separate?

1. **API-first discipline** — Forces clean contracts between systems
2. **Ecosystem potential** — Archipedia can power other tools
3. **Independent value** — Each product stands alone
4. **Different scaling needs** — Search infrastructure ≠ design canvas
5. **Clearer positioning** — Users understand what each does

---

## The Core Insight

### Archipedia is Not the End State

The search engine is the **wedge**, not the destination.

| Level | What It Is | Status |
|-------|------------|--------|
| **Level 1** | Search engine for precedents | ✅ Built |
| **Level 2** | Knowledge infrastructure (API) | 🔄 In progress |
| **Level 3** | Design intelligence layer | 🎯 Next |
| **Level 4** | Foundation for Pear.design | 🔮 Vision |

### What the Data Enables

With indexed architectural knowledge (visual embeddings, spatial patterns, metadata, firm knowledge), we can power:

| Capability | What It Does | Data Required |
|------------|--------------|---------------|
| **Visual search** | Find similar projects | Visual embeddings (have this) |
| **Spatial matching** | Find similar layouts/organizations | Spatial embeddings (have this) |
| **Contextual suggestions** | Surface relevant precedents while designing | Real-time embedding queries |
| **Grounded generation** | Generate variations informed by real buildings | Embeddings as conditioning |
| **Validation** | Check designs against patterns | Pattern recognition across dataset |
| **Specification hints** | Suggest materials/assemblies | Metadata + firm knowledge |
| **Design memory** | Remember explorations, decisions, lessons | Process capture |

---

## Extending the Node-Based Interface

### Current State

We already have a **React Flow node-based interface** for search workflows. This is powerful infrastructure that can evolve.

```
Current: Search Workflow Nodes
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐         │
│  │  Image   │ ───→ │  Search  │ ───→ │ Results  │         │
│  │  Input   │      │  Node    │      │  Grid    │         │
│  └──────────┘      └──────────┘      └──────────┘         │
│                                                             │
│  ┌──────────┐      ┌──────────┐                            │
│  │  Text    │ ───→ │  Hybrid  │ ───→ ...                  │
│  │  Input   │      │  Search  │                            │
│  └──────────┘      └──────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Evolution: Design Workflow Nodes

The same node canvas can support **design operations**, not just search.

```
Future: Design + Search Workflow Nodes
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  INPUT NODES                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Image   │  │  Sketch  │  │  Text    │  │  Brief   │                   │
│  │  Upload  │  │  Canvas  │  │  Prompt  │  │  Parser  │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       │             │             │             │                           │
│       └─────────────┴──────┬──────┴─────────────┘                           │
│                            │                                                │
│  SEARCH / RETRIEVAL        ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │              │
│  │  │  Visual  │  │  Spatial │  │  Hybrid  │  │  Detail  │ │              │
│  │  │  Search  │  │  Search  │  │  Search  │  │  Search  │ │              │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │              │
│  └───────┴─────────────┴────────────┴──────────────┴───────┘              │
│                            │                                                │
│  ANALYSIS                  ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │              │
│  │  │ Material │  │  Spatial │  │  Style   │  │  Why It  │ │              │
│  │  │ Extractor│  │ Analyzer │  │ Describe │  │  Works   │ │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │              │
│  └──────────────────────────────────────────────────────────┘              │
│                            │                                                │
│  GENERATION (NEW)          ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │              │
│  │  │  Sketch  │  │  Style   │  │ Variation│  │  Massing │ │              │
│  │  │ to Render│  │ Transfer │  │ Generator│  │ Explorer │ │              │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │              │
│  └──────────────────────────────────────────────────────────┘              │
│                            │                                                │
│  OUTPUT                    ▼                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Results │  │   Save   │  │  Export  │  │  Compare │                   │
│  │   Grid   │  │Collection│  │   PDF    │  │   View   │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Node Types to Add

#### Input Nodes

| Node | Description | Implementation |
|------|-------------|----------------|
| **Sketch Canvas** | Freehand drawing that becomes search query | HTML Canvas → embed with DINOv2 |
| **Brief Parser** | Paste design brief → extract structured requirements | Gemini Pro text analysis |
| **Site Context** | Upload site photo → extract constraints | Gemini Vision analysis |
| **Precedent Selector** | Pick N projects as "inspiration seeds" | Multi-select from search results |

#### Analysis Nodes

| Node | Description | Implementation |
|------|-------------|----------------|
| **Material Extractor** | Image → list of materials with confidence | Gemini Vision |
| **Spatial Analyzer** | Image → circulation, relationships, zones | Gemini Vision + custom prompts |
| **Style Descriptor** | Image → rich text description of aesthetic | Gemini Vision |
| **Why This Works** | Brief + Precedent → explain relevance | Gemini Pro |
| **Climate Advisor** | Project + location → climate-responsive suggestions | Gemini + metadata |

#### Generation Nodes

| Node | Description | Implementation |
|------|-------------|----------------|
| **Sketch to Render** | Rough sketch → photorealistic concept | Imagen 3 / Gemini |
| **Style Transfer** | Apply materiality of A to massing of B | Imagen with conditioning |
| **Variation Generator** | Base image → N variations | Imagen with seeds |
| **Massing Explorer** | Parameters → massing options | Procedural + AI hybrid |
| **Detail Suggester** | Context → relevant detail approaches | Retrieval + generation |

#### Synthesis Nodes

| Node | Description | Implementation |
|------|-------------|----------------|
| **Blend Precedents** | N precedents → merged concept | Embedding interpolation + generation |
| **Adapt to Climate** | Design + new climate → adapted version | Gemini analysis + Imagen |
| **Scale Variation** | Design → versions at different scales | Parametric + AI |

### Example Design Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Brief Parser │ ──→ │  Auto-Search │ ──→ │  Top 10      │
│              │     │  (generated  │     │  Results     │
│ "5000m²      │     │  query from  │     │              │
│ library,     │     │  brief)      │     │              │
│ Nordic       │     │              │     │              │
│ climate"     │     │              │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
       ┌─────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Selects │ ──→ │  Extract     │ ──→ │  Generate    │
│ 3 Favorites  │     │  Common      │     │  20 Concepts │
│              │     │  Patterns    │     │  Based On    │
│              │     │  (materials, │     │  Selections  │
│              │     │  spatial)    │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
       ┌─────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Picks   │ ──→ │  Find Real   │ ──→ │  Export      │
│ Top 5        │     │  Precedents  │     │  Moodboard   │
│              │     │  Similar to  │     │  PDF         │
│              │     │  Generations │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Key insight:** Generation is always grounded in real precedents. We generate → then find similar real projects → so the output is validated against built work.

---

## Archipedia API Design

### Current Endpoints (to formalize)

```
BASE: https://archipedia.ai/api/v1

# Search
POST   /search/image          # Visual similarity search
POST   /search/text           # Text/semantic search  
POST   /search/hybrid         # Combined text + image
POST   /search/multi-image    # Multiple reference images
GET    /search/id/{image_id}  # Find similar to existing

# Projects
GET    /projects              # List/filter projects
GET    /projects/{id}         # Project details
GET    /projects/{id}/images  # Project images

# Images
GET    /images/{id}           # Image details + metadata
GET    /images/{id}/embedding # Raw embedding vector
```

### New Endpoints (for Pear integration)

```
# Analysis (Gemini-powered)
POST   /analyze/image         # General image analysis
POST   /analyze/materials     # Extract materials from image
POST   /analyze/spatial       # Analyze spatial organization
POST   /analyze/style         # Describe aesthetic/style
POST   /analyze/brief         # Parse design brief

# Generation (future)
POST   /generate/from-sketch  # Sketch → rendered concept
POST   /generate/variations   # Base → N variations
POST   /generate/blend        # N precedents → blended concept

# Embeddings (advanced use)
POST   /embed/image           # Get embedding for arbitrary image
POST   /embed/text            # Get embedding for text
GET    /embed/project/{id}    # Get all embeddings for project

# Collections (user data)
GET    /collections           # User's collections
POST   /collections           # Create collection
PUT    /collections/{id}      # Update collection
DELETE /collections/{id}      # Delete collection
POST   /collections/{id}/add  # Add project to collection

# Firm Knowledge (future)
POST   /firm/upload           # Upload private project
GET    /firm/projects         # List firm's projects
POST   /firm/search           # Search including private data
```

### Authentication

```
# API Key (for server-to-server)
Authorization: Bearer sk_archipedia_xxxxx

# User Token (for user-scoped operations)
Authorization: Bearer user_token_xxxxx
```

### Response Format

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "request_id": "req_xxxxx",
    "latency_ms": 142,
    "credits_used": 1
  }
}
```

---

## Pear.design Vision

### The Interface Philosophy

**Current design tools:** You tell them exactly what to do (explicit commands)
**Pear:** You show intent, it understands and assists (implicit understanding)

### Core Interactions

| Interaction | Traditional Tool | Pear |
|-------------|------------------|------|
| Start designing | Blank canvas, explicit commands | Describe or sketch intent → instant suggestions |
| Find references | Leave tool, search elsewhere | Contextual sidebar shows relevant precedents |
| Explore variations | Manually model each | "Show me 10 variations of this" |
| Get feedback | Ask colleagues, wait | Instant: "This is similar to X, they solved Y like this" |
| Make decisions | Undocumented | "Why did you choose this?" is captured |

### Interface Concepts

#### 1. The Split View
```
┌─────────────────────────────────────┬─────────────────────────────────────┐
│                                     │                                     │
│          DESIGN CANVAS              │         KNOWLEDGE SIDEBAR           │
│                                     │                                     │
│   [Your sketch / model / concept]   │   ┌───────────────────────────┐   │
│                                     │   │ Similar Projects (live)   │   │
│                                     │   ├───────────────────────────┤   │
│                                     │   │ [thumb] Oslo Opera House  │   │
│                                     │   │ [thumb] Copenhagen Library│   │
│                                     │   │ [thumb] Helsinki Central  │   │
│                                     │   └───────────────────────────┘   │
│                                     │                                     │
│                                     │   ┌───────────────────────────┐   │
│                                     │   │ Suggestions               │   │
│                                     │   ├───────────────────────────┤   │
│                                     │   │ "Consider how Oslo handled│   │
│                                     │   │  the waterfront edge..."  │   │
│                                     │   └───────────────────────────┘   │
│                                     │                                     │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

#### 2. The Node Canvas (extended from Archipedia)
- Same React Flow infrastructure
- Design operations as nodes
- Workflows that combine search + analysis + generation
- Shareable workflow templates

#### 3. The Exploration Tree
```
                    ┌─────────┐
                    │ Initial │
                    │ Concept │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │ Option  │    │ Option  │    │ Option  │
    │    A    │    │    B    │    │    C    │
    └────┬────┘    └────┬────┘    └─────────┘
         │               │           (rejected:
    ┌────┴────┐         │            "too tall")
    │ Refined │         │
    │    A    │    ┌────┴────┐
    └─────────┘    │ Refined │
    (selected)     │    B    │
                   └─────────┘

Every branch captures: what was tried, why it was rejected/selected,
which precedents influenced it.
```

---

## Integration Roadmap

### Phase 1: API Formalization (Week 1-2)

**Goal:** Clean, documented API that Pear can consume

- [ ] Document existing endpoints
- [ ] Add OpenAPI/Swagger spec
- [ ] Implement API key authentication
- [ ] Add rate limiting
- [ ] Create developer docs

### Phase 2: Analysis Endpoints (Week 3-4)

**Goal:** Gemini-powered analysis available via API

- [ ] `/analyze/image` — general analysis
- [ ] `/analyze/materials` — material extraction
- [ ] `/analyze/spatial` — spatial organization
- [ ] `/analyze/style` — aesthetic description
- [ ] `/analyze/brief` — brief parsing

### Phase 3: Design Nodes in Archipedia (Week 5-8)

**Goal:** Extend node canvas with design-oriented nodes

- [ ] Sketch Canvas input node
- [ ] Brief Parser node
- [ ] Material Extractor node
- [ ] Spatial Analyzer node
- [ ] Style Descriptor node
- [ ] Basic generation node (sketch → render)

### Phase 4: Pear.design MVP (Week 9-12)

**Goal:** Separate site with design-first interface

- [ ] New repo: pear-design
- [ ] Basic split-view interface
- [ ] Archipedia API integration
- [ ] Real-time precedent suggestions
- [ ] Simple sketch input

### Phase 5: Deep Integration (Month 4+)

**Goal:** Full design intelligence

- [ ] Exploration tree / version history
- [ ] Decision capture ("why did you choose this?")
- [ ] Generation grounded in precedents
- [ ] Firm-specific knowledge integration
- [ ] Plugin system for external tools

---

## Brand Strategy

### For Now (Launch Phase)

Keep it simple:

| Brand | Visibility | Purpose |
|-------|------------|---------|
| **Archipedia** | Public, primary | The product people know |
| **Pear** | Background | Company name in footer |
| **pear.design** | Not launched | Coming soon |

### When Launching Pear.design

Position as:
> "From the makers of Archipedia"  
> "Powered by Archipedia's knowledge layer"

This gives Pear the halo of Archipedia's credibility.

### Eventually

Two distinct products, one company:

| Brand | Domain | Tagline |
|-------|--------|---------|
| **Archipedia** | archipedia.ai | "The knowledge layer for architecture" |
| **Pear** | pear.design | "Design software that thinks with you" |

Relationship messaging:
- For Pear users: "Powered by the world's largest architectural knowledge base"
- For Archipedia users: "See what's possible when knowledge meets design"

---

## Technical Notes

### Shared Infrastructure

Both products can share:
- Embedding models (DINOv2)
- Vector store (FAISS → Qdrant/Pinecone)
- Image storage (R2/S3)
- User authentication (Supabase)
- Analytics infrastructure

### Separate Concerns

Keep separate:
- Frontend codebases
- Design canvas logic (Pear-specific)
- Workflow state management
- Generation pipeline (Pear-specific)

### API Contract

The API is the **contract** between Archipedia and Pear. Both teams (even if it's just you) should treat it as a stable interface:
- Version the API (`/v1/`, `/v2/`)
- Don't break existing endpoints
- Add, don't modify
- Document everything

---

## Questions to Resolve

1. **Generation model:** Imagen 3? Stable Diffusion? Flux? Need to evaluate for architectural quality.

2. **Real-time collaboration:** Should Pear support multiplayer from day 1?

3. **3D or 2D first:** Does Pear start as 2D canvas (easier) or go 3D (harder but more powerful)?

4. **Plugin architecture:** How do external tools (Rhino, Revit) integrate?

5. **Pricing separation:** Same subscription covers both? Or separate pricing?

---

## Success Metrics

### Archipedia (Knowledge Layer)

| Metric | Target |
|--------|--------|
| API uptime | 99.9% |
| Search latency | <500ms |
| Projects indexed | 10K → 100K |
| API consumers | 10+ (including Pear) |

### Pear.design (Design Tool)

| Metric | Target |
|--------|--------|
| Time from idea to visual | <30 seconds |
| Precedent relevance score | >80% "useful" |
| Session length | 30+ minutes |
| Return rate | 50% weekly |

### Combined

| Metric | Target |
|--------|--------|
| Design decisions captured | 10K+ |
| Firm knowledge uploaded | 100+ firms |
| Workflow templates shared | 500+ |

---

*This document captures the strategic vision for Pear + Archipedia integration. Update as the vision evolves.*

