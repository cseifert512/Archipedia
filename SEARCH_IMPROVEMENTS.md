# Search Functionality Improvement Recommendations

This document outlines comprehensive improvements for the Archipedia search system, organized by priority and impact.

---

## ✅ Implementation Status (Updated: Dec 30, 2024)

The following improvements have been **implemented**:

| # | Improvement | Status | Implementation Details |
|---|-------------|--------|------------------------|
| 2 | Remove client-side filtering | ✅ **DONE** | Removed duplicate filtering from `StudyResultsPage.tsx` and `ClassicSearchPage.tsx`. Now server-only. |
| 3 | Batch Project ID Lookups | ✅ **DONE** | Added `get_project_ids_batch` and `get_image_ids_batch` methods to `index_store.py`. Updated `pipeline.py` to use batch lookups. |
| 4 | Search result caching | ✅ **DONE** | Added TTL-based cache (1 hour) in `text_embedder.py` with max 500 entries. |
| 5 | Improved Distance-to-Similarity Conversion | ✅ **DONE** | Replaced `1 - distance` with exponential decay `np.exp(-alpha * dist)` in `pipeline.py`. Alpha=2.0 based on testing. |
| 8b | Short query text search | ✅ **DONE** | Hybrid search (keyword + semantic) for queries < 5 chars. Keyword fallback in `text_embedder.py`. |
| 10 | Search history | ✅ **DONE** | localStorage-based history with dropdown UI in `ClassicSearchBar.tsx`. Persists across sessions. |
| 16 | Better error messages | ✅ **DONE** | Structured errors with `{error, message, suggestion}` in backend. Error UI in search pages. |
| 7 | Fusion Score Normalization | ✅ **DONE** | Added `_normalize_distances()` method in `pipeline.py`. Min-max normalization applied to visual, spatial, attr distances before fusion. |
| 15 | Search by Image ID | ✅ **DONE** | Implemented `query_image_id` support in `search.py` using `FaissStore.vector_for_image()`. |
| 6 | Better Weight Normalization | ✅ **DONE** | Widened clamp range from [0.1, 0.7] to [0.0, 0.95]. Added `strict` mode for backward compatibility. |
| 11 | Search Result Explanations | ✅ **DONE** | Enhanced `get_explanation()` with human-readable `match_reason`. Updated `MatchReasonBadge` tooltip. |

**Additional UI improvements:**
- Filter sidebar now collapsed by default (`FilterSidebar.tsx`)

---

## 🔴 Critical Performance Issues

### 1. **Inefficient Filtering Pipeline**
**Current Issue**: Filters are applied after retrieving candidates, causing unnecessary computation.

**Location**: `navigator/app/services/pipeline.py:31-64`

**Recommendation**:
- Implement pre-filtering at the FAISS index level using metadata filters
- Use FAISS IDSelector to filter indices before distance computation
- Consider building filtered sub-indexes for common filter combinations

**Impact**: Can reduce search latency by 30-50% when filters are active

### 2. **Duplicate Filtering (Client + Server)** ✅ IMPLEMENTED
**Current Issue**: Filters are applied both server-side and client-side, causing redundant work.

**Location**: 
- Server: `navigator/app/main.py:750-759`
- Client: `frontend/src/pages/StudyResultsPage.tsx:217-245`

**Recommendation**:
- Remove client-side filtering, rely entirely on server-side filtering
- Pass all filter parameters in API requests
- Add query parameter validation to ensure consistency

**Impact**: Reduces frontend computation and ensures consistent results

### 3. **Sequential Project ID Lookups** ✅ IMPLEMENTED
**Current Issue**: Multiple sequential lookups in pipeline.search() method

**Location**: `navigator/app/services/pipeline.py:91-95`

**Recommendation**:
```python
# Batch lookup instead of loop
project_ids = self.index_store.get_project_ids_batch(indices)
```

**Implementation Details**:
- Added `get_project_ids_batch()` and `get_image_ids_batch()` methods to `index_store.py`
- Updated `pipeline.py` to use batch lookups in `_apply_filters()` and `search()` methods
- Fixes also resolved issues with dictionary-based `id_map.json` entries

**Impact**: 20-30% faster for large candidate sets

### 4. **No Search Result Caching** ✅ IMPLEMENTED
**Current Issue**: Identical queries are recomputed every time

**Recommendation**:
- Implement Redis/memory cache for query vectors + filter combinations
- Cache key: hash(query_vector) + filters + weights
- TTL: 1 hour for common queries, 24 hours for exact matches
- Cache invalidation on index updates

**Impact**: 90%+ latency reduction for repeated queries

---

## 🟠 Search Quality Improvements

### 5. **Improved Distance-to-Similarity Conversion** ✅ IMPLEMENTED
**Current Issue**: Simple `1 - distance` conversion doesn't account for distance distribution

**Location**: `navigator/app/services/pipeline.py:109-112`

**Recommendation**:
```python
# Use exponential decay or sigmoid transformation
v_sim = np.exp(-alpha * v_dist)  # Or sigmoid(-v_dist)
# Calibrate alpha based on distance distribution statistics
```

**Implementation Details**:
- Added `SIMILARITY_ALPHA = 2.0` class constant in `pipeline.py`
- Replaced `1.0 - min(dist, 1.0)` with `np.exp(-alpha * dist)` for all similarity conversions
- Alpha value calibrated through testing with `test_similarity_conversion.py` script
- Alpha=2.0 provides better score differentiation than higher values

**Impact**: Better score normalization, improved relevance

### 6. **Better Weight Normalization** ✅ IMPLEMENTED
**Current Issue**: Hard clamping [0.1, 0.7] is too restrictive, doesn't adapt to query type

**Location**: `navigator/app/services/pipeline.py:28-51`

**Recommendation**:
- Allow wider weight ranges for different search modes
- Implement adaptive weight adjustment based on query characteristics
- Use learned weight combinations for different query types

**Implementation Details**:
- Widened default clamp range from [0.1, 0.7] to [0.0, 0.95]
- Added `strict` parameter to `normalize_weights()` for backward compatibility
- Min 0.0 allows disabling unused dimensions (e.g., no spatial features)
- Max 0.95 prevents complete single-dimension search while allowing near-pure searches
- Tested with `test_weight_normalization.py` script

**Impact**: More flexible and accurate search results

### 7. **Fusion Score Normalization** ✅ IMPLEMENTED
**Current Issue**: Visual, spatial, and attribute distances have different scales, fusion is biased

**Location**: `navigator/app/services/pipeline.py:105-120`

**Recommendation**:
- Normalize each distance metric independently before fusion
- Use quantile-based normalization to handle outliers
- Apply min-max scaling per metric type

**Implementation Details**:
- Added `_normalize_distances()` helper method to Pipeline class
- Applied min-max normalization to visual, spatial, and attribute distances before fusion
- Normalization ensures all distance types are on [0, 1] scale before exponential decay conversion
- Tested with `test_fusion_normalization.py` script confirming proper weight proportionality

**Impact**: More balanced fusion, better search relevance

### 8. **Hybrid Text + Visual Search**
**Current Issue**: Text and image search are separate, no cross-modal fusion

**Recommendation**:
- Implement hybrid search that combines text embeddings with visual embeddings
- Use weighted combination of text and visual search results
- Cross-modal reranking: reorder visual results using text similarity

**Impact**: More relevant results when users combine text + image queries

### 8b. **Short Query Text Search Improvements** ✅ IMPLEMENTED
**Current Issue**: Very short queries (e.g., "arch") fail to return results due to weak semantic embeddings and lack of fallback mechanisms

**Location**: `navigator/app/services/text_embedder.py:188-240`

**Recommendation**:
- Implement hybrid search strategy for short queries (< 4 characters or < 2 words):
  - **Primary**: Continue using semantic embeddings for full semantic matching
  - **Fallback**: Add keyword/substring matching against project titles, typologies, and metadata
  - **Fuzzy matching**: Use Levenshtein distance or trigram matching for typos
- For very short queries, boost substring matches in titles and typologies
- Consider query expansion for short queries (e.g., "arch" → "architecture", "architectural", "architect")
- Implement minimum similarity threshold with graceful degradation to keyword search
- Add query normalization (lowercase, strip whitespace, handle special characters)

**Impact**: Short queries like "arch" will return relevant results, improving discoverability for non-expert users

---

## 🟡 User Experience Enhancements

### 9. **Search Autocomplete/Suggestions**
**Current Issue**: No query autocomplete or suggestions

**Recommendation**:
- Build autocomplete index from project titles, typologies, locations
- Implement fuzzy matching for typos
- Show suggestions based on popular searches
- Use Trie or Elasticsearch for fast prefix matching

**Impact**: Faster query entry, reduced typos, better discovery

### 10. **Search History & Recent Searches** ✅ IMPLEMENTED
**Current Issue**: No way to access previous searches

**Recommendation**:
- Store search history in localStorage/sessionStorage
- Show recent searches dropdown
- Implement "Search again" functionality
- Add search result bookmarking

**Impact**: Improved user workflow, easier iteration

### 11. **Search Result Explanations** ✅ IMPLEMENTED
**Current Issue**: Limited explanation for why results match (get_explanation exists but underutilized)

**Location**: `navigator/app/services/pipeline.py:182-270`

**Recommendation**:
- Expose explanation endpoint in API
- Show match reasons in frontend (e.g., "Similar visual style", "Same typology", "Matching spatial layout")
- Highlight matched attributes/filters
- Visual indicators for match strength

**Implementation Details**:
- Enhanced `get_explanation()` to return human-readable `match_reason` based on weights and score
- Added `_generate_match_reason()` helper method with context-aware explanations
- Added `matched_attrs` list to WhyBlock for display in frontend
- Updated `MatchReasonBadge.tsx` to show detailed tooltip with match reason and attributes
- Match reasons adapt based on: dominant weight, score level, patch matches, and matched attributes

**Impact**: Better user understanding, improved trust in results

### 12. **Progressive Result Loading**
**Current Issue**: All results loaded at once, no pagination

**Recommendation**:
- Implement pagination or infinite scroll
- Load top results first, then progressively load more
- Show loading indicators per result batch
- Cache pages for back/forward navigation

**Impact**: Faster initial render, better perceived performance

### 13. **Search Result Filtering UI Improvements**
**Current Issue**: Filters applied post-search, no dynamic filtering feedback

**Recommendation**:
- Show filter counts (e.g., "23 results match this filter")
- Allow filter combination with AND/OR logic
- Implement filter presets/saved filters
- Real-time filter preview (show how many results would match)

**Impact**: Better filter discovery, more intuitive filtering

---

## 🔵 Architecture & Code Quality

### 14. **Unified Search Pipeline**
**Current Issue**: Two different search implementations (main.py vs pipeline.py/router)

**Location**: 
- `navigator/app/main.py` (legacy fuse_and_sort)
- `navigator/app/services/pipeline.py` (new Pipeline class)
- `navigator/app/routers/search.py` (new router)

**Recommendation**:
- Migrate all endpoints to use Pipeline class
- Deprecate fuse_and_sort in main.py
- Ensure consistent API responses across all endpoints
- Add comprehensive tests for both paths during migration

**Impact**: Reduced code duplication, easier maintenance, consistent behavior

### 15. **Implement Search by Image ID** ✅ IMPLEMENTED
**Current Issue**: Feature declared but not implemented

**Location**: `navigator/app/routers/search.py:44-50`

**Recommendation**:
- Store image embeddings in IndexStore or separate embedding store
- Implement image_id -> vector lookup
- Cache embeddings for faster retrieval
- Add endpoint: `GET /embed/{image_id}` for embedding retrieval

**Implementation Details**:
- Wired up existing `FaissStore.vector_for_image()` method in search router
- The `/api/v2/search` endpoint now accepts `query_image_id` parameter
- Returns 404 with descriptive error if embedding not found for image_id
- Tested with `test_image_id_search.py` script

**Impact**: Enables "find similar to this image" feature

### 16. **Better Error Handling & Validation** ✅ IMPLEMENTED
**Current Issue**: Limited error messages, no request validation

**Recommendation**:
- Add Pydantic validators for all search requests
- Return detailed error messages with suggestions
- Implement request rate limiting
- Add query complexity checks (prevent extremely large k values)

**Impact**: Better debugging, improved user experience, security

### 17. **Search Metrics & Analytics**
**Current Issue**: Limited telemetry on search performance

**Recommendation**:
- Track search latency by query type
- Monitor filter usage patterns
- Log query patterns for optimization
- A/B test different fusion strategies
- Track result click-through rates

**Impact**: Data-driven optimization, better understanding of user needs

---

## 🟢 Feature Additions

### 18. **Query Expansion**
**Recommendation**:
- Expand visual queries with semantically similar embeddings
- Use synonym expansion for text queries
- Implement "More like this" button on results

**Impact**: Better recall, discoverability

### 19. **Relevance Feedback Loop**
**Recommendation**:
- Let users mark results as relevant/irrelevant
- Adjust weights based on feedback
- Learn user preferences over time
- Implement "Search similar" based on liked results

**Impact**: Personalized search results

### 20. **Advanced Spatial Search**
**Current Issue**: Spatial features computation is optional and limited

**Recommendation**:
- Pre-compute spatial features for all projects with plans
- Add spatial search UI controls (room count, layout type)
- Visualize spatial similarity in results
- Support plan sketch queries

**Impact**: Better architectural plan search

### 21. **Multi-Image Query**
**Recommendation**:
- Allow users to upload multiple reference images
- Combine embeddings (average, weighted average, or best match)
- Support "Find projects that match ALL of these images"

**Impact**: More precise queries, better specificity

### 22. **Negative Search (Exclude Filters)**
**Recommendation**:
- Allow "NOT typology" filters
- Implement negative image queries ("not like this")
- Support exclusion lists

**Impact**: More refined search capabilities

---

## 🔷 Patch-Based Search Enhancements

### 23. **Patch-Wise Image Tagging**
**Current Issue**: Patches exist for reranking but lack semantic tagging, limiting fine-grained search capabilities

**Location**: 
- Patch extraction: `navigator/app/patches.py`, `navigator/scripts/embed_patches.py`
- Patch features: `navigator/app/services/features/patches.py`

**Recommendation**:
- Generate semantic tags/labels for each patch using vision-language models (CLIP, BLIP, or GPT-4V)
- Tag patches with architectural elements (e.g., "arch", "column", "window", "facade", "entrance", "roof", "balcony")
- Store patch tags in metadata alongside embeddings
- Enable search by patch-level features (e.g., "find buildings with arched windows")
- Build inverted index: tag → list of (image_id, patch_idx) tuples
- Consider multi-label tagging (patches can have multiple tags)

**Implementation Notes**:
- Use CLIP for zero-shot tagging (faster, no training needed)
- Create taxonomy of architectural elements for consistent tagging
- Batch process patches for efficiency
- Store tags in JSON alongside patch embeddings

**Impact**: Enables fine-grained search at architectural element level, not just whole-image matching

### 24. **Patch-Based Similarity Search**
**Current Issue**: Patch reranking exists but patch-level similarity search is not available as a primary search mode

**Location**: `navigator/app/services/features/patches.py:58-107`

**Recommendation**:
- Build separate FAISS index for patch embeddings (currently patches are only used for reranking)
- Implement patch-to-patch similarity search as primary search mode
- Allow users to search by uploading a detail image (e.g., a specific window style, entrance design)
- Return results ranked by best patch match, not just image-level similarity
- Support "find similar architectural details" use case
- Add API endpoint: `POST /search/patch` that searches patch index directly
- Combine patch search with image search using weighted fusion:
  - Patch matches boost results if patch similarity is high
  - Image-level similarity provides overall context

**Implementation Notes**:
- Create `PatchIndexStore` similar to `IndexStore` but for patches
- Patch index should map: patch_embedding → (image_id, patch_idx, patch_coords)
- Use min-patch-distance strategy (find images where at least one patch is very similar)
- Support configurable patch grid sizes (4x4, 8x8) for different granularities

**Impact**: Enables search for specific building features/details, not just overall building style

### 25. **Patch Match Heatmaps**
**Current Issue**: When patches match, users can't see which parts of the image matched

**Recommendation**:
- Generate heatmap overlays showing patch match scores for each image result
- Visualize which patches contributed most to the match
- Show patch boundaries and match intensity (e.g., color-coded by similarity score)
- Support interactive exploration: hover/click to see patch details and tags
- Add endpoint: `GET /search/patch-heatmap/{image_id}` that returns:
  - Patch coordinates and match scores
  - Overlay image or coordinates for frontend rendering
  - Patch tags for matched regions

**Frontend Implementation**:
- Overlay semi-transparent heatmap on result images
- Use color gradient (red = high match, blue = low match)
- Add toggle to show/hide heatmap
- Click on heatmap region to see patch details

**Implementation Notes**:
- Store patch coordinates during extraction (currently only patch_idx is stored)
- Return patch bounding boxes with match scores in search results
- Use canvas/WebGL for efficient heatmap rendering in frontend
- Consider pre-computing heatmap data for common queries (cache)

**Impact**: Better user understanding of why results match, visual feedback for patch-based search

---

## 📊 Priority Matrix

### High Impact + Low Effort (Quick Wins)
1. ~~Remove client-side filtering (#2)~~ ✅ DONE
2. ~~Implement search result caching (#4)~~ ✅ DONE
3. ~~Better error messages (#16)~~ ✅ DONE
4. ~~Search history (#10)~~ ✅ DONE
5. ~~Short query text search improvements (#8b)~~ ✅ DONE

### High Impact + High Effort (Major Projects)
1. Unified search pipeline (#14)
2. Pre-filtering optimization (#1)
3. Hybrid text+visual search (#8)
4. Search autocomplete (#9)

### Medium Impact (Quality Improvements)
1. ~~Improved distance normalization (#5)~~ ✅ DONE
2. ~~Fusion normalization (#7)~~ ✅ DONE
3. ~~Search by Image ID (#15)~~ ✅ DONE
4. ~~Better weight normalization (#6)~~ ✅ DONE
5. ~~Search explanations (#11)~~ ✅ DONE
6. Progressive loading (#12)
7. Query expansion (#18)
8. Patch match heatmaps (#25)

---

## 🚀 Implementation Roadmap

### Phase 1 (1-2 weeks): Quick Wins ✅ COMPLETE
- ~~Fix duplicate filtering (#2)~~ ✅
- ~~Add search caching (#4)~~ ✅
- ~~Improve error handling (#16)~~ ✅
- ~~Add search history (#10)~~ ✅
- ~~Short query improvements (#8b)~~ ✅

### Phase 2 (3-4 weeks): Performance
- Optimize filtering pipeline (#1)
- ~~Batch project ID lookups (#3)~~ ✅
- ~~Improved distance-to-similarity conversion (#5)~~ ✅
- ~~Improve fusion normalization (#7)~~ ✅
- ~~Search by Image ID (#15)~~ ✅
- Unified pipeline migration (#14)

### Phase 3 (4-6 weeks): Quality & UX
- Search autocomplete (#9)
- ~~Better weight normalization (#6)~~ ✅
- ~~Result explanations (#11)~~ ✅
- Progressive loading (#12)
- Hybrid search (#8)

### Phase 4 (6+ weeks): Advanced Features
- Relevance feedback (#19)
- Multi-image queries (#21)
- Advanced spatial search (#20)
- Query expansion (#18)
- Patch-wise image tagging (#23)
- Patch-based similarity search (#24)
- Patch match heatmaps (#25)

---

## 📝 Notes

- All improvements should maintain backward compatibility with existing API consumers
- Add comprehensive tests for each improvement
- Monitor performance metrics before/after changes
- Consider A/B testing for UX changes
- Document API changes in changelog

