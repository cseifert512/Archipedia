# Implementation Plan: Search Features #12 and #18

**Created:** January 6, 2026  
**Branch:** search-v2  
**Status:** Planning

---

## Overview

This document outlines the implementation plan for two selected features from `SEARCH_IMPROVEMENTS.md`:

1. **#12 Progressive Result Loading (Infinite Scroll)**
2. **#18 Query Expansion**

---

## Feature #12: Progressive Result Loading (Infinite Scroll)

### Current State
- `ClassicSearchPage.tsx` has pagination with a "Load More" button
- Backend already supports `page` and `page_size` parameters
- `has_more` and `total_count` are returned from API

### Goal
Replace the manual "Load More" button with automatic infinite scroll for seamless browsing.

### Implementation Steps

#### Frontend Changes (`frontend/src/pages/ClassicSearchPage.tsx`)

**Step 1: Add Intersection Observer Hook**
```typescript
// Add a custom hook for infinite scroll detection
const useInfiniteScroll = (callback: () => void, hasMore: boolean) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [callback, hasMore]);

  return sentinelRef;
};
```

**Step 2: Replace Load More Button**
- Add a sentinel `<div ref={sentinelRef} />` at the bottom of results grid
- Keep loading spinner visible while fetching more results
- Add debounce to prevent rapid-fire requests

**Step 3: Add Loading State Indicator**
```tsx
{/* Infinite scroll sentinel and loading indicator */}
{hasMore && (
  <div ref={sentinelRef} style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center' }}>
    {isLoadingMore ? (
      <div className="loading-spinner">Loading more results...</div>
    ) : (
      <div style={{ height: '1px' }} /> {/* Invisible sentinel */}
    )}
  </div>
)}
```

**Step 4: Optimize Result Rendering**
- Implement `React.memo` on `SearchResultCard` to prevent unnecessary re-renders
- Consider virtualization with `react-window` for very large result sets (optional)

### Testing Checklist
- [ ] Scroll triggers load when sentinel enters viewport
- [ ] No duplicate requests while loading
- [ ] Loading indicator appears during fetch
- [ ] Works correctly after filter changes
- [ ] Handles error states gracefully
- [ ] Mobile scroll behavior works correctly

---

## Feature #18: Query Expansion

### Current State
- Text search uses semantic embeddings only (`text_embedder.py`)
- Short queries (< 4 chars) use hybrid keyword+semantic search
- No synonym or related term expansion

### Goal
Expand text queries with synonyms and related architectural terms to improve recall, especially for short or specific queries.

### Implementation Steps

#### Backend Changes

**Step 1: Create Query Expander Module** (`navigator/app/services/query_expander.py`)

```python
"""Query expansion for improved text search recall."""
import re
from typing import List, Set

# Architectural synonym mappings
ARCHITECTURAL_SYNONYMS = {
    # Building types
    "house": ["residence", "dwelling", "home", "villa"],
    "museum": ["gallery", "exhibition space", "cultural center"],
    "school": ["educational facility", "academy", "learning center"],
    "office": ["workplace", "commercial building", "business center"],
    "church": ["chapel", "religious building", "place of worship"],
    "library": ["learning center", "media center", "archive"],
    "hospital": ["medical center", "healthcare facility", "clinic"],
    "hotel": ["hospitality", "resort", "lodge", "inn"],
    "apartment": ["flat", "residential unit", "housing unit", "condo"],
    
    # Architectural elements
    "courtyard": ["patio", "atrium", "central court", "inner court"],
    "facade": ["elevation", "exterior", "front"],
    "roof": ["rooftop", "canopy", "covering"],
    "window": ["glazing", "fenestration", "opening"],
    "balcony": ["terrace", "veranda", "loggia"],
    "stair": ["staircase", "stairway", "steps"],
    
    # Materials
    "wood": ["timber", "wooden", "lumber"],
    "concrete": ["cement", "béton", "reinforced concrete"],
    "brick": ["masonry", "brickwork"],
    "glass": ["glazed", "transparent", "curtain wall"],
    "steel": ["metal", "iron", "metallic"],
    "stone": ["masonry", "granite", "limestone", "marble"],
    
    # Styles
    "modern": ["contemporary", "modernist"],
    "brutalist": ["brutalism", "raw concrete"],
    "minimalist": ["minimal", "minimalism", "simple"],
    "sustainable": ["green", "eco-friendly", "environmental"],
    
    # Spatial concepts
    "open plan": ["open space", "open layout", "flowing space"],
    "atrium": ["void", "central space", "light well"],
    "circulation": ["movement", "flow", "pathways"],
}

# Reverse mapping for quick lookup
_SYNONYM_LOOKUP = {}
for key, synonyms in ARCHITECTURAL_SYNONYMS.items():
    _SYNONYM_LOOKUP[key.lower()] = synonyms
    for syn in synonyms:
        if syn.lower() not in _SYNONYM_LOOKUP:
            _SYNONYM_LOOKUP[syn.lower()] = [key] + [s for s in synonyms if s != syn]


def expand_query(query: str, max_expansions: int = 3) -> List[str]:
    """
    Expand a search query with synonyms and related terms.
    
    Args:
        query: Original search query
        max_expansions: Maximum number of expanded terms to add
        
    Returns:
        List of expanded query strings
    """
    query_lower = query.lower().strip()
    words = re.findall(r'\b\w+\b', query_lower)
    
    expansions: Set[str] = set()
    
    for word in words:
        if word in _SYNONYM_LOOKUP:
            # Add synonyms for this word
            for syn in _SYNONYM_LOOKUP[word][:max_expansions]:
                # Create expanded query by replacing word with synonym
                expanded = query_lower.replace(word, syn)
                if expanded != query_lower:
                    expansions.add(expanded)
    
    # Also try multi-word phrases
    for phrase, synonyms in ARCHITECTURAL_SYNONYMS.items():
        if phrase in query_lower:
            for syn in synonyms[:max_expansions]:
                expanded = query_lower.replace(phrase, syn)
                if expanded != query_lower:
                    expansions.add(expanded)
    
    return list(expansions)[:max_expansions * 2]


def get_expanded_terms(query: str) -> List[str]:
    """
    Get individual expanded terms for a query (for keyword matching).
    
    Args:
        query: Original search query
        
    Returns:
        List of related/synonym terms
    """
    query_lower = query.lower().strip()
    words = re.findall(r'\b\w+\b', query_lower)
    
    expanded_terms: Set[str] = set()
    
    for word in words:
        if word in _SYNONYM_LOOKUP:
            expanded_terms.update(_SYNONYM_LOOKUP[word][:3])
    
    return list(expanded_terms)
```

**Step 2: Integrate with Text Embedder** (`navigator/app/services/text_embedder.py`)

Modify the `search()` method to use query expansion:

```python
from .query_expander import expand_query, get_expanded_terms

def search(self, query: str, top_k: int = 12) -> List[dict]:
    """Search with optional query expansion."""
    results = self._search_single(query, top_k * 2)  # Get more candidates
    
    # For short queries, also search with expanded terms
    if len(query.split()) <= 3:
        expanded_queries = expand_query(query, max_expansions=2)
        for exp_query in expanded_queries:
            exp_results = self._search_single(exp_query, top_k)
            # Merge results, keeping higher scores
            results = self._merge_results(results, exp_results)
    
    # Deduplicate by project_id and return top_k
    seen = set()
    final = []
    for r in sorted(results, key=lambda x: -x.get('score', 0)):
        if r['project_id'] not in seen:
            seen.add(r['project_id'])
            final.append(r)
        if len(final) >= top_k:
            break
    
    return final
```

**Step 3: Update Search Response**

Add expansion info to debug output for transparency:

```python
return {
    # ... existing response fields ...
    "debug": {
        "expanded_queries": expanded_queries if len(query.split()) <= 3 else [],
        "expansion_enabled": True,
    }
}
```

### Testing Checklist
- [ ] "house" query also matches "residence", "villa"
- [ ] "timber" query also matches "wood", "wooden"
- [ ] Short queries benefit most from expansion
- [ ] No performance regression for long queries
- [ ] Expanded terms shown in debug output
- [ ] Results properly deduplicated

---

## Estimated Timeline

| Task | Effort | Priority |
|------|--------|----------|
| #12: Infinite Scroll Hook | 2 hours | High |
| #12: Replace Load More | 1 hour | High |
| #12: Loading States | 1 hour | Medium |
| #12: Testing | 1 hour | High |
| #18: Query Expander Module | 2 hours | Medium |
| #18: Text Embedder Integration | 1 hour | Medium |
| #18: Testing & Tuning | 2 hours | Medium |

**Total Estimated Effort:** ~10 hours

---

## Dependencies

- No new npm packages required for #12 (using native IntersectionObserver)
- No new Python packages required for #18

---

## Rollback Plan

Both features can be easily rolled back:
- #12: Revert to "Load More" button by removing IntersectionObserver
- #18: Disable expansion by setting `max_expansions=0` or removing call

---

## Success Metrics

**#12 Progressive Loading:**
- Reduced time to discover more results (no click required)
- Increased average results viewed per session

**#18 Query Expansion:**
- Increased recall for short queries (< 4 words)
- Reduced "no results" occurrences
- Improved search satisfaction (measured via feedback)

---

## Next Steps

1. ✅ Create this implementation plan
2. Commit plan to search-v2 branch
3. Implement #12 (Frontend - Infinite Scroll)
4. Implement #18 (Backend - Query Expansion)
5. Test both features
6. Create PR for review

