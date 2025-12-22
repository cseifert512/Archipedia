# Archipedia - Page Directory

This document provides a comprehensive overview of all pages in the Archipedia frontend application.

---

## Public Pages

### Landing Page
| Property | Value |
|----------|-------|
| **URL** | `/` |
| **Component** | `LandingPage` |
| **File** | `frontend/src/pages/LandingPage.tsx` |
| **Description** | Main marketing landing page with hero section, feature highlights, and calls-to-action. |
| **Links To** | `/search`, `/demo`, `/enterprise` |

---

### Demo Page
| Property | Value |
|----------|-------|
| **URL** | `/demo` |
| **Component** | `DemoPage` |
| **File** | `frontend/src/pages/DemoPage.tsx` |
| **Description** | Interactive demo showcasing the platform's capabilities. |
| **Links To** | `/search`, `/` |

---

### Enterprise Page
| Property | Value |
|----------|-------|
| **URL** | `/enterprise` |
| **Component** | `EnterprisePage` |
| **File** | `frontend/src/pages/enterprise.tsx` |
| **Description** | Enterprise offering page with pricing, features, and contact information for business customers. |
| **Links To** | `/`, `/search` |

---

## Search Pages

### Search Landing
| Property | Value |
|----------|-------|
| **URL** | `/search` |
| **Component** | `SearchLandingPage` |
| **File** | `frontend/src/pages/SearchLandingPage.tsx` |
| **Description** | Clean, Google-style search landing page. Users can enter text queries and toggle between classic and advanced (canvas) modes. |
| **Links To** | `/search/classic` (default), `/canvas` (advanced mode) |

---

### Classic Search Results
| Property | Value |
|----------|-------|
| **URL** | `/search/classic` |
| **Component** | `ClassicSearchPage` |
| **File** | `frontend/src/pages/ClassicSearchPage.tsx` |
| **Description** | Traditional search results page with filter sidebar, result cards, and sorting options. Supports text and image-based search. |
| **Query Params** | `q` (search query), `typology`, `country`, `emphasis` |
| **Links To** | `/project/:id`, `/` |

---

### Text Search
| Property | Value |
|----------|-------|
| **URL** | `/search/text` |
| **Component** | `TextSearchPage` |
| **File** | `frontend/src/pages/TextSearchPage.tsx` |
| **Description** | Dedicated text-based search interface. |
| **Links To** | `/project/:id`, `/search` |

---

### Image Search
| Property | Value |
|----------|-------|
| **URL** | `/search/image` |
| **Component** | `ImageSearchPage` |
| **File** | `frontend/src/pages/ImageSearchPage.tsx` |
| **Description** | Image upload and visual similarity search interface. |
| **Links To** | `/project/:id`, `/search` |

---

### Canvas (Advanced Results)
| Property | Value |
|----------|-------|
| **URL** | `/canvas` |
| **Component** | `ResultsPage` (wrapped in `PasswordGate`) |
| **File** | `frontend/src/pages/ResultsPage.tsx` |
| **Description** | Advanced visual canvas for exploring and organizing search results. Password protected. |
| **Auth** | Requires password |
| **Links To** | `/project/:id` |

---

### Results Page
| Property | Value |
|----------|-------|
| **URL** | `/results` |
| **Component** | `ResultsPage` |
| **File** | `frontend/src/pages/ResultsPage.tsx` |
| **Description** | Alternative results view (not password protected). |
| **Links To** | `/project/:id` |

---

### Empty Results
| Property | Value |
|----------|-------|
| **URL** | `/empty` |
| **Component** | `EmptyResultsPage` |
| **File** | `frontend/src/pages/EmptyResultsPage.tsx` |
| **Description** | Displayed when a search returns no results. Provides suggestions and alternative actions. |
| **Links To** | `/search` |

---

## Project Pages

### Project Detail
| Property | Value |
|----------|-------|
| **URL** | `/project/:id` |
| **Component** | `ProjectDetailPage` |
| **File** | `frontend/src/pages/ProjectDetailPage.tsx` |
| **Description** | Detailed view of an individual architecture project. Shows image carousel, metadata, description, and related projects. |
| **URL Params** | `:id` - Project ID |
| **Query Params** | `image_id`, `from` (navigation context) |
| **Links To** | `/search/classic`, related `/project/:id` pages |

---

## Board Pages

### Board View
| Property | Value |
|----------|-------|
| **URL** | `/boards/:id` |
| **Component** | `BoardViewPage` |
| **File** | `frontend/src/pages/BoardViewPage.tsx` |
| **Description** | View a saved board with collected project references. |
| **URL Params** | `:id` - Board ID |
| **Links To** | `/boards/:id/edit`, `/project/:id` |

---

### Board Edit
| Property | Value |
|----------|-------|
| **URL** | `/boards/:id/edit` |
| **Component** | `BoardEditPage` |
| **File** | `frontend/src/pages/BoardEditPage.tsx` |
| **Description** | Edit mode for boards - add/remove items, reorder, add annotations. |
| **URL Params** | `:id` - Board ID |
| **Links To** | `/boards/:id`, `/project/:id` |

---

### Board Print
| Property | Value |
|----------|-------|
| **URL** | `/boards/:id/print` |
| **Component** | `BoardPrintPage` |
| **File** | `frontend/src/pages/BoardPrintPage.tsx` |
| **Description** | Print-optimized view of a board for PDF export or printing. |
| **URL Params** | `:id` - Board ID |
| **Links To** | `/boards/:id` |

---

### Board Share
| Property | Value |
|----------|-------|
| **URL** | `/b/:token` |
| **Component** | `BoardSharePage` |
| **File** | `frontend/src/pages/BoardSharePage.tsx` |
| **Description** | Public shareable link for a board. Uses short token-based URLs. |
| **URL Params** | `:token` - Share token |
| **Links To** | `/project/:id` |

---

## Academic Study Pages

> **Note:** These pages are anonymous versions without Archipedia branding, designed for use in academic research studies where participants should not be influenced by product identity.

### Study Search Landing
| Property | Value |
|----------|-------|
| **URL** | `/study` |
| **Component** | `StudySearchPage` |
| **File** | `frontend/src/pages/StudySearchPage.tsx` |
| **Description** | Anonymous search landing page. Shows "Architecture Search" instead of Archipedia branding. Uses system fonts and neutral styling. |
| **Links To** | `/study/results` |

---

### Study Results
| Property | Value |
|----------|-------|
| **URL** | `/study/results` |
| **Component** | `StudyResultsPage` |
| **File** | `frontend/src/pages/StudyResultsPage.tsx` |
| **Description** | Anonymous search results page. No logo, neutral colors, "Saved" instead of "Boards". |
| **Query Params** | `q` (search query), `typology`, `country`, `emphasis` |
| **Links To** | `/study`, `/project/:id` |

---

## Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LANDING (/)                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌──────────┐
    │  /demo  │     │ /search │     │/enterprise│
    └─────────┘     └────┬────┘     └──────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌──────────────┐ ┌────────┐ ┌─────────────┐
    │/search/classic│ │/canvas │ │/search/image│
    └──────┬───────┘ └───┬────┘ └──────┬──────┘
           │             │             │
           └─────────────┼─────────────┘
                         ▼
               ┌─────────────────┐
               │  /project/:id   │
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐
    │/boards/:id│ │   Edit    │ │   Print   │
    └───────────┘ └───────────┘ └───────────┘
```

---

## File Structure

```
frontend/src/pages/
├── BoardEditPage.tsx
├── BoardPrintPage.tsx
├── BoardSharePage.tsx
├── BoardViewPage.tsx
├── ClassicSearchPage.tsx
├── DemoPage.tsx
├── EmptyResultsPage.tsx
├── enterprise.tsx
├── Homepage.tsx
├── ImageSearchPage.tsx
├── LandingPage.tsx
├── ProjectDetailPage.tsx
├── ResultsPage.tsx
├── SearchLandingPage.tsx
├── StudyResultsPage.tsx
├── StudySearchPage.tsx
└── TextSearchPage.tsx
```

---

*Last updated: December 2024*

