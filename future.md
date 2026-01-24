# Archipedia: Strategic Roadmap & Implementation Plan

> **Last Updated:** January 24, 2026  
> **Status:** Active Development  
> **Current Phase:** Pre-launch Beta

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Big Vision](#the-big-vision)
3. [Market Analysis](#market-analysis)
4. [Workflow Integration](#workflow-integration)
5. [Two-Week Sprint](#two-week-sprint-the-credibility-build)
6. [Two-Month Roadmap](#two-month-roadmap-the-stickiness-build)
7. [Long-Term Vision: Firm Intelligence Platform](#long-term-vision-firm-intelligence-platform)
8. [Generative AI Integration](#generative-ai-integration-gemini)
9. [Technical Architecture](#technical-architecture)
10. [Positioning & Messaging](#positioning--messaging)
11. [Business Model](#business-model)
12. [Risks & Mitigations](#risks--mitigations)
13. [Success Metrics](#success-metrics)

---

## Executive Summary

Archipedia is a **visual search engine for architectural precedents** that lets architects find relevant design references by uploading images, sketching concepts, or describing ideas in natural language.

**Current State:**
- ~2-3K indexed projects from ArchDaily
- Multi-modal search (visual similarity via DINOv2, spatial analysis, text/hybrid)
- Sophisticated fusion weighting system
- Node-based workflow system (React Flow)
- Deployed on Render with React/Vite frontend and FastAPI backend

**The Core Insight:**
The search engine is not the product—it's the **wedge into something bigger**. The real opportunity is becoming the **knowledge layer for architecture practice**: the searchable memory of firms, not just a prettier Pinterest.

**The Path:**
1. **Now:** Credibility features (export, collections, professional UI)
2. **2 Months:** Stickiness features (accounts, private uploads, team sharing)
3. **6+ Months:** Firm Intelligence Platform (detail search, integrations, generation)

---

## The Big Vision

### What We're Really Building

**Level 1: Search Engine** (where we are)
> "Find projects like this"

**Level 2: Research Platform** (2 months)
> "Understand why projects work, save and organize references"

**Level 3: Firm Knowledge Base** (6 months)
> "Your firm's collective memory—every project, detail, and lesson searchable"

**Level 4: Design Intelligence Platform** (12+ months)
> "AI-assisted exploration grounded in real precedent and firm knowledge"

### The One-Liner

> **"The searchable memory of architecture—find any precedent, detail, or lesson from the world's projects and your own."**

---

## Market Analysis

### The Pain Points We Solve

| Pain Point | Current Workaround | Archipedia Solution |
|------------|-------------------|---------------------|
| "I saw a project years ago with this feeling..." | Endless scrolling through bookmarks, Pinterest, ArchDaily | Upload a sketch or reference image → instant results |
| Junior designers don't know what exists | Senior designers manually curate references | Self-service discovery, democratized knowledge |
| Precedent presentations take forever | Manual assembly from scattered sources | Moodboard builder with exportable PDFs |
| Hard to find projects by spatial organization | Text search is useless for layout patterns | Spatial/plan similarity matching |
| Regional appropriateness | Manual research on climate, materials, context | Filter by climate zone, materials, massing type |
| "Find more like this but different" | Impossible | Multi-image queries with negative references |
| Finding past firm details | Search server, email old PM (45+ minutes) | Visual search across firm library |
| Knowledge loss when people leave | Tribal knowledge walks out the door | Captured in searchable system |

### Competitive Landscape

| Tool | What It Does | Gap We Fill |
|------|--------------|-------------|
| **ArchDaily / Dezeen** | Browse articles, basic text search | No visual search, no spatial analysis |
| **Pinterest / Are.na** | Personal curation, visual discovery | Unstructured, no architectural metadata |
| **Google Image Search** | Reverse image search | Generic—doesn't understand architecture |
| **Midjourney / DALL-E** | Image generation | No grounding in real precedent, no search |
| **Firm intranets/SharePoint** | File storage | Terrible search, no intelligence |
| **Newforma / BIM 360** | Project management | Not knowledge management |

**Our Moat:** The only tool combining (1) architectural domain-specific embeddings, (2) spatial/plan analysis, (3) rich metadata filtering, (4) multi-modal search, and (5) a path to firm-specific knowledge.

---

## Workflow Integration

### The Brutal Reality of Architectural Practice

```
ACTUAL TIME ALLOCATION (typical architect week)
───────────────────────────────────────────────

Meetings & Coordination          ████████████████████████  35%
Production (Revit/CAD/Rhino)     ██████████████████████    30%
Review & Redlines                ██████████████            15%
Email & Admin                    ████████                  10%
Site Visits / CA                 ████                       5%
Research & Design Exploration    ██                         3%
Precedent Search                 █                          2%
```

**Key Insight:** Precedent search is ~2% of time, BUT it happens at critical decision points where stakes are high.

### When Architects Would Actually Use Archipedia

| Moment | What They're Doing | Current Solution | Our Solution |
|--------|-------------------|------------------|--------------|
| **Client Kickoff** | "Show me buildings you like" | Google Images, Pinterest | Structured search, export to PDF |
| **Design Meeting** | "What about that Copenhagen project?" | Someone's memory, frantic googling | Instant visual search |
| **Stuck on Massing** | "How have others done this?" | ArchDaily text search (fails) | Visual + typology search |
| **Detail Development** | "How did Piano do this curtain wall?" | Google, manufacturer sites | Detail-level visual search |
| **Presentation Prep** | Need 5 precedent images | Screenshot scramble | Collections → Export |
| **Spec Writing** | "What did we use before?" | Search server, email | Firm knowledge search |
| **QA Review** | "Is this detail right for this climate?" | Senior's memory | Climate-filtered search |

### Minimum Viable Workflow Integration

**Wrong approach:** "Open Archipedia, upload sketch, get AI analysis, use node canvas..."
**Right approach:** "When you'd normally google something, use this instead. It actually works."

```
CURRENT WORKFLOW              ARCHIPEDIA WORKFLOW
────────────────              ──────────────────

Need reference                Need reference
     │                             │
     ↓                             ↓
Google "modern library"       Search or drag in image
     │                             │
     ↓                             ↓
Scroll through junk           Get actual architectural projects
     │                             │
     ↓                             ↓
Click through sources         Full metadata, multiple views
     │                             │
     ↓                             ↓
Screenshot, save somewhere    Save to collection
     │                             │
     ↓                             ↓
Lose it later                 Export for presentation
```

---

## Two-Week Sprint: The Credibility Build

These features transform "cool demo" into "useful tool."

### Feature 1: Export to PDF (3-4 days)

**Why it matters:** Closes the loop. Architects need to PUT precedents somewhere—presentations, pin-ups, client emails.

**User Flow:**
1. Select multiple projects from results (checkboxes)
2. Click "Export Selected"
3. Choose format and options
4. Download PDF/PPT/ZIP

**UI Specification:**

```
┌─────────────────────────────────────────┐
│  Export Selected Projects               │
├─────────────────────────────────────────┤
│                                         │
│  Format:  ○ PDF   ○ PowerPoint   ○ ZIP  │
│                                         │
│  Layout:  ○ 1 per page (full detail)    │
│           ○ 2x2 grid (comparison)       │
│           ○ Contact sheet (thumbnails)  │
│                                         │
│  Include: ☑ Project title               │
│           ☑ Architect                   │
│           ☑ Location / Year             │
│           ☑ Typology                    │
│           ☐ Source URL                  │
│           ☐ My notes                    │
│                                         │
│  [Export 5 Projects]                    │
│                                         │
└─────────────────────────────────────────┘
```

**Technical Implementation:**

```typescript
// Frontend: src/components/ExportDialog.tsx
interface ExportOptions {
  format: 'pdf' | 'pptx' | 'zip';
  layout: 'single' | 'grid' | 'contact';
  includeTitle: boolean;
  includeArchitect: boolean;
  includeLocation: boolean;
  includeTypology: boolean;
  includeUrl: boolean;
  includeNotes: boolean;
}

// Use jspdf for PDF generation
import { jsPDF } from 'jspdf';

async function exportToPdf(
  projects: ProjectCard[], 
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: options.layout === 'single' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    
    if (i > 0 && options.layout === 'single') {
      doc.addPage();
    }

    // Add image
    const imgData = await fetchImageAsBase64(project.thumb_url);
    doc.addImage(imgData, 'JPEG', 20, 20, 170, 120);

    // Add metadata
    let yPos = 150;
    if (options.includeTitle) {
      doc.setFontSize(16);
      doc.text(project.title, 20, yPos);
      yPos += 10;
    }
    if (options.includeArchitect && project.architect) {
      doc.setFontSize(12);
      doc.text(`Architect: ${project.architect}`, 20, yPos);
      yPos += 7;
    }
    // ... more fields
  }

  return doc.output('blob');
}
```

**Backend Endpoint (optional, for server-side generation):**

```python
# navigator/app/routers/export.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import io

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    """Generate PDF of selected projects."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    
    for project in request.projects:
        # Add project to PDF
        c.drawString(100, 750, project.title)
        # ... add image, metadata
        c.showPage()
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=archipedia_export.pdf"}
    )
```

---

### Feature 2: Collections / Boards (3-4 days)

**Why it matters:** Without this, every search is throwaway. With this, you become where they *store* references.

**User Flow:**
1. See a result you like → Click "Save" or drag to collection
2. Collections panel shows saved projects
3. Collections persist across sessions
4. Can share collections via link

**Data Model:**

```typescript
// src/types/collections.ts
interface Collection {
  id: string;
  name: string;
  description?: string;
  projects: SavedProject[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  shareId?: string; // for public sharing
}

interface SavedProject {
  project_id: string;
  image_id: string;
  title: string;
  thumb_url: string;
  notes?: string;
  savedAt: string;
}
```

**Storage (Phase 1 - localStorage):**

```typescript
// src/lib/collectionStore.ts
const STORAGE_KEY = 'archipedia_collections';

export function getCollections(): Collection[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveCollection(collection: Collection): void {
  const collections = getCollections();
  const idx = collections.findIndex(c => c.id === collection.id);
  if (idx >= 0) {
    collections[idx] = collection;
  } else {
    collections.push(collection);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export function addToCollection(collectionId: string, project: SavedProject): void {
  const collections = getCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (collection) {
    collection.projects.push(project);
    collection.updatedAt = new Date().toISOString();
    saveCollection(collection);
  }
}
```

**UI Components:**

```typescript
// src/components/Collections/CollectionsSidebar.tsx
// - List of user's collections
// - "New Collection" button
// - Drag-drop targets

// src/components/Collections/SaveToCollectionButton.tsx
// - Dropdown showing collections
// - Quick-add to most recent
// - Create new inline

// src/components/Collections/CollectionView.tsx
// - Grid of saved projects
// - Reorder, remove, add notes
// - Export entire collection
```

---

### Feature 3: "Search Like This" Enhancement (1 day)

**Why it matters:** Most common action after seeing a result. Make it effortless.

**Current State:** Partially implemented with "Search like this" button.

**Improvements:**
- Make button more prominent (primary action on hover)
- Show instant preview of results count
- Add keyboard shortcut (press 'S' while hovering)

```typescript
// Enhanced SearchResultCard.tsx
<button
  onClick={() => searchByImageId(project.image_id)}
  className="absolute top-2 right-2 bg-black/80 text-white px-3 py-1 
             rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 
             transition-opacity"
>
  Find Similar →
</button>
```

---

### Feature 4: Compare Mode (2-3 days)

**Why it matters:** Architects always compare. "Put these three next to each other."

**User Flow:**
1. Select 2-4 projects (checkbox or Shift+click)
2. Click "Compare" button
3. Opens side-by-side view
4. Synchronized metadata display

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Compare Projects (3 selected)                              [Exit Compare] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐         │
│  │                   │ │                   │ │                   │         │
│  │      IMAGE 1      │ │      IMAGE 2      │ │      IMAGE 3      │         │
│  │                   │ │                   │ │                   │         │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘         │
│                                                                             │
│  Title:     Nordic Museum    Oslo Library       Bergen Cultural Ctr        │
│  Architect: BIG              Snøhetta           KODE Architects            │
│  Location:  Stockholm        Oslo               Bergen                      │
│  Year:      2018             2020               2022                        │
│  Typology:  Museum           Library            Cultural Center             │
│  Climate:   Continental      Continental        Maritime                    │
│                                                                             │
│  [Add to Collection]  [Export Comparison]  [Share Link]                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component:**

```typescript
// src/pages/ComparePage.tsx
interface ComparePageProps {
  projectIds: string[];
}

export function ComparePage({ projectIds }: ComparePageProps) {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  
  useEffect(() => {
    Promise.all(projectIds.map(id => fetchProject(id)))
      .then(setProjects);
  }, [projectIds]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
      {projects.map(project => (
        <CompareCard key={project.project_id} project={project} />
      ))}
      
      <ComparisonTable projects={projects} />
    </div>
  );
}
```

---

### Feature 5: Professional Landing Page (2 days)

**Why it matters:** First impressions. If it looks like a hackathon project, firms won't trust it.

**Key Elements:**

1. **Hero Section**
   - Clear headline: "Find architectural precedents instantly"
   - Subhead: "Search by image, sketch, or text. Export for presentations."
   - Live search demo (not a static image)

2. **How It Works** (3 steps)
   - Upload an image or describe what you need
   - Get relevant projects with full metadata
   - Save to collections, export to PDF

3. **Feature Highlights**
   - Visual search that understands architecture
   - Filter by typology, climate, materials
   - Export presentation-ready boards

4. **Social Proof**
   - "Used by architects at [Firm Names]" (get permission)
   - One real testimonial quote
   - Number of projects indexed

5. **CTA**
   - "Try a Search — No signup required"
   - Search bar directly on landing page

**What to AVOID:**
- "AI-powered" (signals toy/hype)
- "Revolutionary" / "Game-changing"
- Abstract graphics instead of real UI
- Feature lists without context

---

### Two-Week Sprint Summary

| Feature | Days | Status | Priority |
|---------|------|--------|----------|
| PDF Export | 3-4 | Not started | P0 |
| Collections (localStorage) | 3-4 | Not started | P0 |
| "Search Like This" enhancement | 1 | Partial | P1 |
| Compare Mode | 2-3 | Not started | P1 |
| Landing Page refresh | 2 | Not started | P0 |
| Buffer for bugs/polish | 2-3 | — | — |
| **Total** | **~14 days** | | |

---

## Two-Month Roadmap: The Stickiness Build

These features create switching costs and unlock enterprise potential.

### Month 1: Foundation for Retention

#### Week 1-2: User Accounts & Authentication

**Why it matters:** Collections tied to accounts, not browser. Team features become possible.

**Implementation Options:**

| Option | Pros | Cons |
|--------|------|------|
| **Supabase Auth** | Fast, free tier, Postgres included | Another dependency |
| **Clerk** | Great UX, handles everything | Cost at scale |
| **Auth0** | Enterprise-ready | Complex, expensive |
| **DIY (JWT + Postgres)** | Full control | More work |

**Recommended: Supabase** — Includes auth + database + storage in one.

**Database Schema:**

```sql
-- Users (handled by Supabase Auth)

-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved Projects
CREATE TABLE saved_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  image_id TEXT,
  notes TEXT,
  position INTEGER,
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- Search History
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  query_type TEXT, -- 'text', 'image', 'hybrid'
  query_text TEXT,
  query_image_id TEXT,
  results_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Week 3-4: Private Project Uploads

**Why it matters:** The wedge into "firm knowledge base." Once they upload their work, switching cost increases massively.

**User Flow:**
1. Go to "My Library" section
2. Drag-drop folder of images OR click to upload
3. Add basic metadata (project name, year, location, typology)
4. Images get embedded and indexed
5. Private projects appear in user's search results (marked as "My Library")

**Technical Requirements:**

```python
# New endpoint: navigator/app/routers/uploads.py
@router.post("/upload/project")
async def upload_project(
    name: str = Form(...),
    year: Optional[int] = Form(None),
    location: Optional[str] = Form(None),
    typology: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
    user: User = Depends(get_current_user)
):
    """Upload a private project with images."""
    project_id = f"user_{user.id}_{slugify(name)}"
    
    # Store images
    image_ids = []
    for img in images:
        image_id = await store_image(img, project_id)
        image_ids.append(image_id)
    
    # Create embeddings (async job)
    await queue_embedding_job(project_id, image_ids)
    
    # Store metadata
    await db.projects.insert({
        "project_id": project_id,
        "user_id": user.id,
        "name": name,
        "year": year,
        "location": location,
        "typology": typology,
        "image_ids": image_ids,
        "is_private": True,
        "created_at": datetime.now()
    })
    
    return {"project_id": project_id, "status": "processing"}
```

**Search Integration:**

```python
# Modify search to include user's private projects
async def search_with_private(
    query_embedding: np.ndarray,
    user_id: Optional[str],
    top_k: int = 50
):
    # Search public index
    public_results = faiss_store.search(query_embedding, top_k)
    
    # If logged in, also search user's private index
    if user_id:
        private_index = get_user_index(user_id)
        if private_index:
            private_results = private_index.search(query_embedding, top_k)
            # Merge and re-rank
            results = merge_results(public_results, private_results)
        else:
            results = public_results
    else:
        results = public_results
    
    return results
```

### Month 2: Differentiation

#### Week 5-6: Detail-Level Search

**Why it matters:** Nobody else does visual search for architectural details. This is unique.

**Implementation:**

1. **Encourage detail uploads**
   - Add "detail" tag during upload
   - UI prompt: "Are these detail/section drawings?"
   
2. **Search filter**
   - Toggle: "Show details only" / "Show all"
   - Or filter chips: "Facades" | "Details" | "Plans" | "Interiors"

3. **Category classification**
   - Use Gemini Vision to auto-classify uploaded images
   - "This appears to be a curtain wall detail"

```python
async def classify_image_type(image_bytes: bytes) -> str:
    """Use Gemini to classify architectural image type."""
    response = await gemini.generate_content([
        "Classify this architectural image into one category:",
        "- exterior (building exterior/facade view)",
        "- interior (interior space)",
        "- detail (construction detail, section, connection)",
        "- plan (floor plan, site plan)",
        "- section (building section)",
        "- diagram (concept diagram, analysis)",
        "- render (3D visualization)",
        "Respond with only the category name.",
        image_bytes
    ])
    return response.text.strip().lower()
```

#### Week 7-8: Notes & Lessons Learned

**Why it matters:** Captures institutional knowledge. "Why did we save this?"

**Features:**
- Add notes to any saved project
- Notes are searchable (text search across notes)
- Structured tags: "What worked" / "What to avoid" / "Reference for..."

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Nordic Museum / BIG                                             │
│  Stockholm, 2018                                        [Edit]  │
├─────────────────────────────────────────────────────────────────┤
│  Your Notes:                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Great example of using wood in a cold climate. The facade   │ │
│  │ weathering strategy is worth referencing for the Thompson   │ │
│  │ project. Talk to structural about the cantilever detail.    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Tags: #wood-facade #cantilever #scandinavia                    │
│                                                                  │
│  Saved to: Museum References, Thompson Project Refs             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Long-Term Vision: Firm Intelligence Platform

### Beyond Concept Design

The data that exists on ArchDaily is concept-level. The data inside firms is MUCH more valuable:
- CAD/Revit details
- Specifications
- RFIs and how they were resolved
- Post-occupancy feedback
- Cost data
- What worked vs. what failed

### What Gets Indexed (Future State)

| Data Type | Current State | Archipedia-Indexed State |
|-----------|--------------|-------------------------|
| **Project photos** | Scattered folders | Visual search ✓ (have this) |
| **CAD/Revit details** | Buried in project folders | Searchable by geometry + text |
| **Specifications** | Word docs, PDFs | Semantic search, version tracking |
| **RFI threads** | Email chains | "How did we solve X?" lookup |
| **Cost data** | Excel sheets | "What did glazing cost on similar?" |
| **Submittals** | Filing cabinets / Box | Visual search for products |
| **Post-occupancy notes** | Doesn't exist | Captured and linked to elements |
| **Lessons learned** | Tribal knowledge | Structured, searchable |

### What Firms Could Ask

**Today:** "Find a museum with a courtyard"

**Future:**
- "Show me curtain wall details we've used in cold climates"
- "How did we resolve the flashing issue on the Johnson project?"
- "What acoustic specs do we typically use for performance spaces?"
- "Which of our past projects is most similar to this new brief?"
- "What did waterproofing cost per SF on our last 5 residential towers?"
- "Show me all the RFIs related to concrete formwork"

### Integration Roadmap

```
PHASE 1 (Now)         PHASE 2 (6mo)         PHASE 3 (12mo)
─────────────         ─────────────         ──────────────

Manual upload         Cloud sync            Deep integrations
(drag-drop)           (Box, Dropbox,        (Revit plugin,
                      Google Drive,          Bluebeam, specs
                      SharePoint)            software)
```

---

## Generative AI Integration (Gemini)

### Why Generation Matters (But Not Yet)

Generation is powerful when combined with firm-specific knowledge:

**Commodity:** "Generate a concept image" (everyone can do this)
**Valuable:** "Generate a detail in our firm's style, informed by 10 years of our projects" (only we can do this)

### Node Types for Generative Workflows

#### Input Nodes

| Node Type | Description | API |
|-----------|-------------|-----|
| **Brief Parser** | Paste brief → Extract program, constraints, aesthetic intent | Gemini Pro |
| **Site Input** | Upload site photo → Extract context | Gemini Vision |
| **Sketch Input** | Freehand sketch → Embed for search | DINOv2 |
| **Precedent Selector** | Pick N projects as "inspiration seeds" | Existing search |

#### Analysis Nodes

| Node Type | Description | API |
|-----------|-------------|-----|
| **Spatial Analyzer** | Image → Circulation diagrams, room relationships | Gemini Vision |
| **Material Extractor** | Image → List materials with confidence | Gemini Vision |
| **Style Descriptor** | Image → Rich text description | Gemini Vision |
| **Why This Works** | Brief + Precedent → Explain relevance | Gemini Pro |

#### Synthesis Nodes

| Node Type | Description | API |
|-----------|-------------|-----|
| **Concept Generator** | Brief + Precedents → Concept images | Imagen 3 |
| **Style Transfer** | Apply materiality of A to massing of B | Imagen |
| **Sketch-to-Render** | Rough sketch → Photorealistic concept | Imagen |
| **Climate Adaptation** | "What would this look like in tropical climate?" | Imagen |

#### Feedback Nodes

| Node Type | Description | Technical |
|-----------|-------------|-----------|
| **Rate & Compare** | Side-by-side rating | UI + storage |
| **Find Similar** | Generated image → Search real precedents | DINOv2 → FAISS |
| **Critique** | AI suggests improvements | Gemini Pro |

### Example Workflow: Competition Sprint

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Brief Parser │ ──→ │  Auto-Search │ ──→ │ Analyze Top  │
│ "5000m²      │     │  (generated  │     │ 10 Results   │
│ library,     │     │  query)      │     │              │
│ Nordic"      │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
       ┌────────────────────────────────────────┘
       ↓
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Extract 3    │ ──→ │ Generate 30  │ ──→ │ Human Picks  │
│ Directions   │     │ Concepts     │     │ Top 9        │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
       ┌────────────────────────────────────────┘
       ↓
┌──────────────┐     ┌──────────────┐
│ Refine &     │ ──→ │ Export 3     │
│ Variations   │     │ Boards       │
└──────────────┘     └──────────────┘

Time: 4 hours instead of 40 hours
```

### Gemini API Integration

```python
# navigator/app/services/gemini_service.py
import google.generativeai as genai
from PIL import Image
import io

genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiService:
    def __init__(self):
        self.text_model = genai.GenerativeModel('gemini-1.5-pro')
        self.vision_model = genai.GenerativeModel('gemini-1.5-pro-vision')
    
    async def parse_brief(self, brief_text: str) -> dict:
        """Extract structured information from a design brief."""
        prompt = """
        Parse this architectural design brief and extract:
        1. Program requirements (spaces, areas)
        2. Site constraints (location, climate, context)
        3. Budget level (luxury/mid/budget)
        4. Aesthetic intent (modern/traditional/etc)
        5. Key priorities (sustainability, views, flexibility, etc)
        6. A search query to find relevant precedents
        
        Respond in JSON format.
        
        Brief:
        {brief}
        """
        response = await self.text_model.generate_content_async(
            prompt.format(brief=brief_text)
        )
        return json.loads(response.text)
    
    async def analyze_image(self, image_bytes: bytes, analysis_type: str) -> dict:
        """Analyze an architectural image."""
        image = Image.open(io.BytesIO(image_bytes))
        
        prompts = {
            "spatial": "Describe the spatial organization of this building...",
            "material": "List the primary and secondary materials visible...",
            "style": "Describe the architectural style and aesthetic qualities...",
            "climate": "Identify climate-responsive design strategies..."
        }
        
        response = await self.vision_model.generate_content_async([
            prompts[analysis_type],
            image
        ])
        return {"analysis": response.text, "type": analysis_type}
```

---

## Technical Architecture

### Current Stack

```
Frontend                Backend                 Data
────────                ───────                 ────
React 18 + Vite         FastAPI                 FAISS (in-memory)
TypeScript              Python 3.11             projects.csv
React Flow              DINOv2 embeddings       R2/S3 images
Tailwind + shadcn       Pydantic                PostgreSQL (future)
Zustand                 CORS + static serving   
```

### Scaled Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHIPEDIA ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │   Vite/     │     │   FastAPI   │     │   Qdrant/   │                   │
│  │   React     │ ──→ │  (multiple  │ ──→ │  Pinecone   │                   │
│  │   Frontend  │     │  instances) │     │  Vector DB  │                   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘                   │
│                             │                                               │
│                      ┌──────┴──────┐                                        │
│                      │             │                                        │
│               ┌──────┴─────┐ ┌─────┴──────┐                                │
│               │ PostgreSQL │ │    R2/S3   │                                │
│               │ (users,    │ │  (images,  │                                │
│               │ collections│ │  exports)  │                                │
│               │ metadata)  │ │            │                                │
│               └────────────┘ └────────────┘                                │
│                                                                             │
│               ┌────────────┐ ┌────────────┐                                │
│               │   Redis    │ │   Gemini   │                                │
│               │  (cache,   │ │   API      │                                │
│               │  sessions) │ │            │                                │
│               └────────────┘ └────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Structure

```
/api
├── /search
│   ├── POST /file          # Image upload search
│   ├── GET  /url           # URL-based search
│   ├── POST /text          # Text search
│   ├── POST /hybrid        # Combined text+image
│   ├── POST /multi-image   # Multiple reference images
│   └── GET  /id/{image_id} # Find similar to existing
│
├── /projects
│   ├── GET  /              # List projects
│   ├── GET  /{id}          # Project details
│   └── GET  /{id}/images   # Project images
│
├── /collections (NEW)
│   ├── GET  /              # User's collections
│   ├── POST /              # Create collection
│   ├── PUT  /{id}          # Update collection
│   ├── DELETE /{id}        # Delete collection
│   ├── POST /{id}/projects # Add project to collection
│   └── GET  /{id}/export   # Export collection
│
├── /uploads (NEW)
│   ├── POST /project       # Upload private project
│   ├── GET  /projects      # User's uploaded projects
│   └── DELETE /project/{id}
│
├── /export (NEW)
│   ├── POST /pdf           # Generate PDF
│   └── POST /pptx          # Generate PowerPoint
│
├── /auth (NEW)
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   └── GET  /me
│
└── /analyze (FUTURE)
    ├── POST /brief         # Parse design brief
    ├── POST /image         # Analyze image
    └── POST /compare       # Compare projects
```

---

## Positioning & Messaging

### What NOT to Say

| ❌ Avoid | Why |
|---------|-----|
| "AI-powered" | Signals toy, hype, not production-ready |
| "Inspiration" | That's Pinterest |
| "Revolutionary" | Eye-roll inducing |
| "Generate designs" | Threatens architects |
| "Supercharge creativity" | Empty marketing |

### What TO Say

| ✓ Use | Why |
|-------|-----|
| "Search" | Utilitarian, understood |
| "Find" | Direct, action-oriented |
| "Precedent library" | Professional term |
| "Project database" | Sounds structured |
| "Research tool" | Legitimate, academic |

### Positioning Statement

> **Archipedia is a visual search engine for architectural precedents.**
>
> Upload an image or describe what you're looking for. Find relevant projects instantly. Save to collections. Export for presentations.
>
> Built for architects who are tired of scrolling through Pinterest.

### Taglines (Options)

- "Search architecture by what it looks like"
- "Find the precedent. Fast."
- "Your architectural research, organized"
- "From reference to presentation in minutes"

---

## Business Model

### Pricing Tiers

| Tier | Price | Target | Features |
|------|-------|--------|----------|
| **Free** | $0 | Individual exploration | 50 searches/mo, 2 collections |
| **Pro** | $29/mo | Individual architect | Unlimited search, collections, export |
| **Team** | $99/mo (up to 5) | Small firm | Shared collections, team analytics |
| **Studio** | $299/mo (up to 20) | Mid-size firm | Private uploads (100 projects), priority support |
| **Enterprise** | Custom | Large firm | Unlimited private, SSO, API, integrations |

### Academic Pricing

50% discount for students and educators (build brand loyalty).

### ROI Argument for Firms

**For a 50-person firm:**

| Problem | Cost Today | With Archipedia |
|---------|-----------|-----------------|
| Senior answering "where's that?" | 5 hrs/wk × $150/hr = $39K/yr | Self-service |
| Recreating existing details | 10 hrs/wk × $75/hr = $39K/yr | Find and reuse |
| Mistakes from unknown lessons | 2 issues/yr × $50K = $100K/yr | Proactive surfacing |
| New hire ramp-up | 6mo × 50% productivity = $20K/person | Weeks, not months |

**Total cost: $200K+/year**  
**Archipedia price: $25K-50K**  
**ROI: 4-8x**

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Architects won't change behavior** | High | High | Make it faster than current methods, not "better in theory" |
| **Search quality not good enough** | Medium | High | Focus on high-quality data (fewer but better projects) |
| **No willingness to pay** | High | High | Prove ROI with time-saved metrics; target firms not individuals |
| **Data moat is weak** | Medium | Medium | Move fast into firm uploads; proprietary data |
| **Context switch too high** | Medium | Medium | Browser extension, meet them where they are |
| **Perception as "AI toy"** | Medium | High | Professional design, lead with utility not tech |
| **ArchDaily builds this** | Medium | High | Move fast, build firm-specific features |
| **Generation quality issues** | Medium | Medium | Always pair with real precedents; "AI-assisted, human-directed" |

---

## Success Metrics

### Engagement

| Metric | Target (3mo) | Target (12mo) |
|--------|--------------|---------------|
| MAU (Monthly Active Users) | 500 | 5,000 |
| Searches per session | 5+ | 8+ |
| Collections created | 0.5 per user | 2+ per user |
| Projects saved per user | 10 | 50+ |

### Retention

| Metric | Target |
|--------|--------|
| D7 Retention | 30% |
| D30 Retention | 15% |
| Monthly churn (paid) | <5% |

### Business

| Metric | Target (6mo) | Target (12mo) |
|--------|--------------|---------------|
| Paying users | 100 | 500 |
| MRR | $5K | $25K |
| Enterprise contracts | 2 | 10 |
| NPS | 40+ | 50+ |

---

## Implementation Checklist

### Two-Week Sprint

- [ ] **Day 1-2:** PDF export component (frontend)
- [ ] **Day 3:** PDF export endpoint (backend, optional)
- [ ] **Day 4-5:** Collections data model and localStorage
- [ ] **Day 6-7:** Collections UI (sidebar, save buttons)
- [ ] **Day 8:** "Search Like This" enhancement
- [ ] **Day 9-10:** Compare mode
- [ ] **Day 11-12:** Landing page refresh
- [ ] **Day 13-14:** Testing, polish, deploy

### Month 1 Milestones

- [ ] Week 1-2: User accounts with Supabase
- [ ] Week 3: Private project uploads
- [ ] Week 4: Collection sharing & team invites

### Month 2 Milestones

- [ ] Week 5-6: Detail-level search / image classification
- [ ] Week 7: Notes & lessons on saved projects
- [ ] Week 8: Basic analytics dashboard

---

## Appendix: Code Templates

### PDF Export (jspdf)

```typescript
// src/lib/exportPdf.ts
import { jsPDF } from 'jspdf';

export interface ExportProject {
  title: string;
  architect?: string;
  location?: string;
  year?: number;
  typology?: string;
  imageUrl: string;
}

export async function exportToPdf(
  projects: ExportProject[],
  options: {
    layout: 'single' | 'grid';
    title?: string;
  }
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Title page
  if (options.title) {
    doc.setFontSize(24);
    doc.text(options.title, pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${projects.length} projects`, pageWidth / 2, 50, { align: 'center' });
    doc.text(`Generated by Archipedia`, pageWidth / 2, 60, { align: 'center' });
    doc.addPage();
  }

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    
    if (i > 0) doc.addPage();

    // Load and add image
    try {
      const imgData = await loadImageAsBase64(project.imageUrl);
      doc.addImage(imgData, 'JPEG', 20, 20, 180, 120);
    } catch (e) {
      console.error('Failed to load image:', project.imageUrl);
    }

    // Add metadata
    let y = 150;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(project.title, 20, y);
    
    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (project.architect) {
      doc.text(`Architect: ${project.architect}`, 20, y);
      y += 6;
    }
    if (project.location) {
      doc.text(`Location: ${project.location}`, 20, y);
      y += 6;
    }
    if (project.year) {
      doc.text(`Year: ${project.year}`, 20, y);
      y += 6;
    }
    if (project.typology) {
      doc.text(`Typology: ${project.typology}`, 20, y);
    }
  }

  return doc.output('blob');
}

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### Collections Store (Zustand)

```typescript
// src/stores/collectionsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedProject {
  project_id: string;
  image_id: string;
  title: string;
  thumb_url: string;
  architect?: string;
  location?: string;
  notes?: string;
  savedAt: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  projects: SavedProject[];
  createdAt: string;
  updatedAt: string;
}

interface CollectionsState {
  collections: Collection[];
  activeCollectionId: string | null;
  
  // Actions
  createCollection: (name: string, description?: string) => string;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addToCollection: (collectionId: string, project: Omit<SavedProject, 'savedAt'>) => void;
  removeFromCollection: (collectionId: string, projectId: string) => void;
  updateProjectNotes: (collectionId: string, projectId: string, notes: string) => void;
  setActiveCollection: (id: string | null) => void;
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set, get) => ({
      collections: [],
      activeCollectionId: null,

      createCollection: (name, description) => {
        const id = `col_${Date.now()}`;
        const now = new Date().toISOString();
        set(state => ({
          collections: [...state.collections, {
            id,
            name,
            description,
            projects: [],
            createdAt: now,
            updatedAt: now
          }]
        }));
        return id;
      },

      deleteCollection: (id) => {
        set(state => ({
          collections: state.collections.filter(c => c.id !== id),
          activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId
        }));
      },

      renameCollection: (id, name) => {
        set(state => ({
          collections: state.collections.map(c =>
            c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
          )
        }));
      },

      addToCollection: (collectionId, project) => {
        set(state => ({
          collections: state.collections.map(c => {
            if (c.id !== collectionId) return c;
            // Don't add duplicates
            if (c.projects.some(p => p.project_id === project.project_id)) return c;
            return {
              ...c,
              projects: [...c.projects, { ...project, savedAt: new Date().toISOString() }],
              updatedAt: new Date().toISOString()
            };
          })
        }));
      },

      removeFromCollection: (collectionId, projectId) => {
        set(state => ({
          collections: state.collections.map(c =>
            c.id === collectionId
              ? {
                  ...c,
                  projects: c.projects.filter(p => p.project_id !== projectId),
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        }));
      },

      updateProjectNotes: (collectionId, projectId, notes) => {
        set(state => ({
          collections: state.collections.map(c =>
            c.id === collectionId
              ? {
                  ...c,
                  projects: c.projects.map(p =>
                    p.project_id === projectId ? { ...p, notes } : p
                  ),
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        }));
      },

      setActiveCollection: (id) => {
        set({ activeCollectionId: id });
      }
    }),
    {
      name: 'archipedia-collections'
    }
  )
);
```

---

## Next Steps

1. **This week:** Start two-week sprint with PDF export
2. **Get beta users:** Find 10 architects for honest feedback
3. **Weekly check-ins:** Understand their workflow, watch them use the tool
4. **Iterate:** Build what they actually need, not what we assume

---

*This document is a living roadmap. Update as we learn from users.*

