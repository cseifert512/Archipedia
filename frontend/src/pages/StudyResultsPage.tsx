import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { FolderOpen, X, SortAsc, Search, ArrowLeft } from 'lucide-react';
import {
  ClassicSearchBar,
  FilterSidebar,
  SearchResultCard,
  BoardDrawer,
  type MatchEmphasis,
  type FilterState,
  type SearchResultData,
  type ProjectImage,
} from '../components/ClassicSearch';
import { useBoardStore } from '../stores/boardStore';
import { mockProjects } from '../lib/mockData';
import { toast } from 'sonner';
import { searchByText, searchByImageFile, searchHybrid, searchByImageId, toAbsoluteUrl, SearchError } from '../lib/navigatorApi';
import { addToHistory } from '../lib/searchHistory';

/**
 * Anonymous search results page for academic study purposes.
 * No identifying branding or product names.
 */

type SortOption = 'best' | 'visual' | 'semantic';

const EMPTY_FILTERS: FilterState = {
  typology: [],
  country: [],
  climate_bin: [],
  massing_type: [],
  tags: [],
  architect: [],
  wwr_band: [],
};

export function StudyResultsPage() {
  const [, setLocation] = useLocation();

  // URL state
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  const initialTypology = params.get('typology')?.split(',').filter(Boolean) || [];
  const initialCountry = params.get('country')?.split(',').filter(Boolean) || [];
  const initialEmphasis = (params.get('emphasis') as MatchEmphasis) || 'balanced';

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [uploadedImage, setUploadedImage] = useState<File | string | null>(null);
  const [emphasis, setEmphasis] = useState<MatchEmphasis>(initialEmphasis);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [results, setResults] = useState<SearchResultData[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('best');
  const [searchError, setSearchError] = useState<{ message: string; suggestion?: string } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    typology: initialTypology,
    country: initialCountry,
  });

  // Board state
  const { isDrawerOpen, openDrawer, closeDrawer, saveToActiveBoard, boards, activeBoardId } =
    useBoardStore();

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { category: keyof FilterState; value: string }[] = [];
    Object.entries(filters).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        values.forEach((value) => {
          chips.push({ category: key as keyof FilterState, value });
        });
      }
    });
    return chips;
  }, [filters]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.typology.length) params.set('typology', filters.typology.join(','));
    if (filters.country.length) params.set('country', filters.country.join(','));
    if (emphasis !== 'balanced') params.set('emphasis', emphasis);

    const qs = params.toString();
    const newUrl = qs ? `/study/results?${qs}` : '/study/results';

    // Update URL without navigation
    window.history.replaceState(null, '', newUrl);
  }, [query, filters.typology, filters.country, emphasis]);

  // Auto-search if query is present on mount (from landing page redirect)
  useEffect(() => {
    if (initialQuery.trim()) {
      performSearch(initialQuery, null, initialEmphasis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Perform search
  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchImage: File | string | null,
      searchEmphasis: MatchEmphasis
    ) => {
      if (!searchQuery.trim() && !searchImage) return;

      setIsSearching(true);
      setHasSearched(true);
      setSearchError(null);
      setQuery(searchQuery);
      setUploadedImage(searchImage);
      setEmphasis(searchEmphasis);
      setCurrentPage(1);  // Reset pagination on new search

      try {
        let apiResults: any[] = [];
        let apiHasMore = false;
        let apiTotalCount = 0;

        // Decide which API to call based on input type
        const hasImage = searchImage && searchImage instanceof File;
        const hasText = searchQuery.trim().length > 0;
        
        if (hasImage && hasText) {
          // Hybrid search: both image and text
          const wVisual = searchEmphasis === 'visual' ? 0.7 : searchEmphasis === 'semantic' ? 0.3 : 0.5;
          const wText = 1.0 - wVisual;
          const response = await searchHybrid({
            file: searchImage as File,
            query: searchQuery.trim(),
            topK: 50,
            page: 1,
            pageSize: PAGE_SIZE,
            wVisual,
            wText,
          });
          apiResults = response.results || [];
          apiHasMore = response.has_more ?? false;
          apiTotalCount = response.total_count ?? apiResults.length;
        } else if (hasImage) {
          // Image-only search
          const response = await searchByImageFile(searchImage as File, {
            topK: 50,
            page: 1,
            pageSize: PAGE_SIZE,
            wVisual: searchEmphasis === 'visual' ? 1.0 : 0.5,
            wAttr: searchEmphasis === 'semantic' ? 0.5 : 0.25,
          });
          apiResults = response.results || [];
          apiHasMore = response.has_more ?? false;
          apiTotalCount = response.total_count ?? apiResults.length;
        } else if (hasText) {
          // Text-only search
          const response = await searchByText(searchQuery, { topK: 50, page: 1, pageSize: PAGE_SIZE });
          apiResults = response.results || [];
          apiHasMore = response.has_more ?? false;
          apiTotalCount = response.total_count ?? apiResults.length;
        }
        
        setHasMore(apiHasMore);
        setTotalCount(apiTotalCount);

        // Transform API results to SearchResultData format
        const transformedResults: SearchResultData[] = apiResults.map((result, index) => {
          const score = result.score ?? (1 - (result.distance ?? 0.5));
          const thumbUrl = toAbsoluteUrl(result.thumb_url) || '';

          // Build images array from image_urls (full R2 URLs) if available
          let projectImages: ProjectImage[] = [];
          if (result.image_urls && Array.isArray(result.image_urls) && result.image_urls.length > 0) {
            projectImages = result.image_urls.map((url: string, idx: number) => ({
              image_id: `img_${result.project_id}_${idx}`,
              thumb_url: url,
              image_url: url,
            }));
          } else if (thumbUrl) {
            // Fallback to single thumbnail
            projectImages = [
              {
                image_id: result.image_id || `img_${result.project_id}_01`,
                thumb_url: thumbUrl,
                image_url: thumbUrl,
              },
            ];
          }

          return {
            project_id: result.project_id || `project-${index}`,
            project_title: result.title || result.project_id || 'Unknown Project',
            architect: result.architect || 'Unknown Architect',
            location_display: result.country || 'Unknown Location',
            year: result.year || 2024,
            image_id: result.image_id || `img_${result.project_id}_01`,
            thumb_url: projectImages[0]?.thumb_url || thumbUrl,
            image_url: projectImages[0]?.image_url || thumbUrl,
            images: projectImages,
            score: score,
            match_reason: result.match_reason || (
              searchEmphasis === 'visual'
                ? 'Visual similarity'
                : searchEmphasis === 'semantic'
                ? 'Semantic match'
                : 'Balanced match'
            ),
            badges: {
              typology: result.typology ? [result.typology] : [],
              country: result.country ? [result.country] : [],
              climate_bin: result.climate_bin ? [result.climate_bin] : [],
            },
          };
        });

        setResults(transformedResults);
        
        // Record successful search to history
        addToHistory(searchQuery, !!searchImage, transformedResults.length);
      } catch (error) {
        console.error('Search failed:', error);
        
        // Handle structured search errors
        if (error instanceof SearchError) {
          setSearchError({
            message: error.message,
            suggestion: error.suggestion,
          });
          setResults([]);
        } else {
          // Generic error - use fallback
          toast.error('Search failed. Using fallback results.');
          
          // Fallback to mock data
          const fallbackResults: SearchResultData[] = mockProjects.slice(0, 12).map((project, index) => ({
            project_id: project.id,
            project_title: project.name,
            architect: project.architect,
            location_display: project.location,
            year: project.yearBuilt,
            image_id: `img_${project.id}_01`,
            thumb_url: project.imageUrl,
            image_url: project.imageUrl,
            images: [{ image_id: `img_${project.id}_01`, thumb_url: project.imageUrl, image_url: project.imageUrl }],
            score: 0.95 - index * 0.015,
            match_reason: 'Fallback result',
            badges: {
              typology: [project.buildingType],
              country: [project.location.split(',').pop()?.trim() || ''],
              climate_bin: project.climate,
            },
          }));
          setResults(fallbackResults);
        }
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Sort results (filtering is done server-side to avoid duplicate work)
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    switch (sortBy) {
      case 'visual':
        // In a real implementation, would sort by visual score
        return sorted;
      case 'semantic':
        // In a real implementation, would sort by semantic score
        return sorted;
      case 'best':
      default:
        return sorted.sort((a, b) => b.score - a.score);
    }
  }, [results, sortBy]);

  // Load more results (pagination)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      let apiResults: any[] = [];
      let apiHasMore = false;
      
      const hasImage = uploadedImage && uploadedImage instanceof File;
      const hasText = query.trim().length > 0;
      
      if (hasImage && hasText) {
        const wVisual = emphasis === 'visual' ? 0.7 : emphasis === 'semantic' ? 0.3 : 0.5;
        const wText = 1.0 - wVisual;
        const response = await searchHybrid({
          file: uploadedImage as File,
          query: query.trim(),
          topK: 50,
          page: nextPage,
          pageSize: PAGE_SIZE,
          wVisual,
          wText,
        });
        apiResults = response.results || [];
        apiHasMore = response.has_more ?? false;
      } else if (hasImage) {
        const response = await searchByImageFile(uploadedImage as File, {
          topK: 50,
          page: nextPage,
          pageSize: PAGE_SIZE,
          wVisual: emphasis === 'visual' ? 1.0 : 0.5,
          wAttr: emphasis === 'semantic' ? 0.5 : 0.25,
        });
        apiResults = response.results || [];
        apiHasMore = response.has_more ?? false;
      } else if (hasText) {
        const response = await searchByText(query, { topK: 50, page: nextPage, pageSize: PAGE_SIZE });
        apiResults = response.results || [];
        apiHasMore = response.has_more ?? false;
      }
      
      // Transform and append results
      const transformedResults: SearchResultData[] = apiResults.map((result, index) => {
        const score = result.score ?? (1 - (result.distance ?? 0.5));
        const thumbUrl = toAbsoluteUrl(result.thumb_url) || '';
        
        let projectImages: ProjectImage[] = [];
        if (result.image_urls && Array.isArray(result.image_urls) && result.image_urls.length > 0) {
          projectImages = result.image_urls.map((url: string, idx: number) => ({
            image_id: `img_${result.project_id}_${idx}`,
            thumb_url: url,
            image_url: url,
          }));
        } else if (thumbUrl) {
          projectImages = [{
            image_id: result.image_id || `img_${result.project_id}_01`,
            thumb_url: thumbUrl,
            image_url: thumbUrl,
          }];
        }
        
        return {
          project_id: result.project_id || `project-${index}`,
          project_title: result.title || result.project_id || 'Unknown Project',
          architect: result.architect || 'Unknown Architect',
          location_display: result.country || 'Unknown Location',
          year: result.year || 2024,
          image_id: result.image_id || `img_${result.project_id}_01`,
          thumb_url: projectImages[0]?.thumb_url || thumbUrl,
          image_url: projectImages[0]?.image_url || thumbUrl,
          images: projectImages,
          score: score,
          match_reason: result.match_reason || 'Match',
          badges: {
            typology: result.typology ? [result.typology] : [],
            country: result.country ? [result.country] : [],
            climate_bin: result.climate_bin ? [result.climate_bin] : [],
          },
        };
      });
      
      setResults(prev => [...prev, ...transformedResults]);
      setCurrentPage(nextPage);
      setHasMore(apiHasMore);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, uploadedImage, query, emphasis]);

  // Handlers
  const handleSearch = (q: string, image: File | string | null, emp: MatchEmphasis) => {
    performSearch(q, image, emp);
  };

  const handleClearSearch = () => {
    setQuery('');
    setUploadedImage(null);
    setResults([]);
    setHasSearched(false);
    setCurrentPage(1);
    setHasMore(false);
    setTotalCount(0);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const handleRemoveFilterChip = (category: keyof FilterState, value: string) => {
    const currentValues = filters[category];
    if (Array.isArray(currentValues)) {
      setFilters({
        ...filters,
        [category]: currentValues.filter((v) => v !== value),
      });
    }
  };

  const handleOpenResult = (result: SearchResultData, currentImageIndex?: number) => {
    const imageId = currentImageIndex !== undefined && result.images 
      ? result.images[currentImageIndex]?.image_id 
      : result.image_id;
    setLocation(`/project/${result.project_id}?image_id=${imageId}&from=study`);
  };

  const handleSaveResult = (result: SearchResultData, currentImage?: ProjectImage) => {
    const imageToSave = currentImage || { 
      image_id: result.image_id, 
      thumb_url: result.thumb_url, 
      image_url: result.image_url 
    };
    saveToActiveBoard({
      project_id: result.project_id,
      image_id: imageToSave.image_id,
      thumb_url_snapshot: imageToSave.thumb_url,
      image_url_snapshot: imageToSave.image_url,
      title_snapshot: result.project_title,
      architect_snapshot: result.architect,
      location_snapshot: result.location_display,
      year_snapshot: result.year,
      added_from: {
        query,
        filters: {
          typology: filters.typology,
          country: filters.country,
        },
      },
    });
    toast.success('Saved to board', {
      action: {
        label: 'View',
        onClick: () => openDrawer(),
      },
    });
  };

  const handleSearchLikeThis = async (result: SearchResultData, currentImage?: ProjectImage) => {
    // Use the currently displayed image's embedding to search for similar projects
    const imageId = currentImage?.image_id || result.image_id;
    
    if (!imageId) {
      toast.error('Cannot search: no image ID available');
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setQuery(''); // Clear text query since this is visual-only search
    setUploadedImage(null);
    setCurrentPage(1);
    
    toast.info(`Finding similar projects...`);
    
    try {
      const response = await searchByImageId(imageId, {
        topK: 50,
        page: 1,
        pageSize: PAGE_SIZE,
        wVisual: 1.0,
        wAttr: 0.25,
      });
      
      const apiResults = response.results || [];
      const apiHasMore = response.has_more ?? false;
      const apiTotalCount = response.total_count ?? apiResults.length;
      
      setHasMore(apiHasMore);
      setTotalCount(apiTotalCount);
      
      // Transform results
      const transformedResults: SearchResultData[] = apiResults.map((apiResult, index) => {
        const score = apiResult.score ?? (1 - (apiResult.distance ?? 0.5));
        const thumbUrl = toAbsoluteUrl(apiResult.thumb_url) || '';
        
        let projectImages: ProjectImage[] = [];
        if (apiResult.image_urls && Array.isArray(apiResult.image_urls) && apiResult.image_urls.length > 0) {
          projectImages = apiResult.image_urls.map((url: string, idx: number) => ({
            image_id: `img_${apiResult.project_id}_${idx}`,
            thumb_url: url,
            image_url: url,
          }));
        } else if (thumbUrl) {
          projectImages = [{
            image_id: apiResult.image_id || `img_${apiResult.project_id}_01`,
            thumb_url: thumbUrl,
            image_url: thumbUrl,
          }];
        }
        
        return {
          project_id: apiResult.project_id || `project-${index}`,
          project_title: apiResult.title || apiResult.project_id || 'Unknown Project',
          architect: apiResult.architect || 'Unknown Architect',
          location_display: apiResult.country || 'Unknown Location',
          year: apiResult.year || 2024,
          image_id: apiResult.image_id || `img_${apiResult.project_id}_01`,
          thumb_url: projectImages[0]?.thumb_url || thumbUrl,
          image_url: projectImages[0]?.image_url || thumbUrl,
          images: projectImages,
          score: score,
          match_reason: apiResult.match_reason || 'Similar visual style',
          badges: {
            typology: apiResult.typology ? [apiResult.typology] : [],
            country: apiResult.country ? [apiResult.country] : [],
            climate_bin: apiResult.climate_bin ? [apiResult.climate_bin] : [],
          },
        };
      });
      
      setResults(transformedResults);
      
      // Record to history
      addToHistory(`Similar to: ${result.project_title}`, true, transformedResults.length);
      
      toast.success(`Found ${transformedResults.length} similar projects`);
    } catch (error) {
      console.error('Search like this failed:', error);
      
      if (error instanceof SearchError) {
        setSearchError({
          message: error.message,
          suggestion: error.suggestion,
        });
        setResults([]);
      } else {
        toast.error('Search failed. Please try again.');
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Check if an item is saved
  const isItemSaved = (projectId: string) => {
    const activeBoard = boards.find((b) => b.id === activeBoardId);
    if (!activeBoard) return false;
    return activeBoard.blocks.some(
      (block) => block.type === 'reference' && block.data.project_id === projectId
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Top Bar - Anonymous */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Back Button - No branding */}
          <button
            onClick={() => setLocation('/study')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#666',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#666';
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {/* Search Bar */}
          <div style={{ flex: 1 }}>
            <ClassicSearchBar
              initialQuery={query}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isSearching={isSearching}
            />
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={() => openDrawer()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: isDrawerOpen ? '#333' : 'rgba(0,0,0,0.05)',
                color: isDrawerOpen ? 'white' : '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 150ms ease',
              }}
            >
              <FolderOpen size={18} />
              Saved
              {boards.length > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: isDrawerOpen ? 'rgba(255,255,255,0.3)' : '#333',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}
                >
                  {boards.reduce((acc, b) => acc + (b.blocks?.length || 0), 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
          display: 'flex',
          gap: '24px',
        }}
      >
        {/* Left Sidebar - Filters */}
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Main Results Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results Header */}
          {hasSearched && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {isSearching ? 'Searching...' : `${sortedResults.length} results`}
                </span>

                {/* Active Filter Chips */}
                {activeFilterChips.map((chip) => (
                  <span
                    key={`${chip.category}-${chip.value}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)',
                      borderRadius: '6px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '12px',
                      color: '#333',
                    }}
                  >
                    {chip.value}
                    <button
                      onClick={() => handleRemoveFilterChip(chip.category, chip.value)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SortAsc size={16} style={{ opacity: 0.5 }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '13px',
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="best">Best match</option>
                  <option value="visual">Most visually similar</option>
                  <option value="semantic">Most semantically similar</option>
                </select>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {isSearching ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      paddingBottom: '66.67%',
                      backgroundColor: 'rgba(0,0,0,0.08)',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <div style={{ padding: '14px 16px' }}>
                    <div
                      style={{
                        height: '18px',
                        backgroundColor: 'rgba(0,0,0,0.08)',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        width: '70%',
                      }}
                    />
                    <div
                      style={{
                        height: '14px',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '4px',
                        width: '50%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            searchError ? (
              // Error state with helpful message
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 40px',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Search size={24} style={{ color: 'rgb(239, 68, 68)' }} />
                </div>
                <h3
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: 'rgb(185, 28, 28)',
                  }}
                >
                  {searchError.message}
                </h3>
                {searchError.suggestion && (
                  <p
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      color: 'rgba(0,0,0,0.6)',
                      marginBottom: '24px',
                    }}
                  >
                    {searchError.suggestion}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSearchError(null);
                    handleClearSearch();
                  }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    padding: '12px 24px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              </div>
            ) : sortedResults.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                {sortedResults.map((result) => (
                  <SearchResultCard
                    key={result.project_id}
                    result={result}
                    onOpen={handleOpenResult}
                    onSave={handleSaveResult}
                    onSearchLikeThis={handleSearchLikeThis}
                    isSaved={isItemSaved(result.project_id)}
                  />
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', gridColumn: '1 / -1' }}>
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '14px',
                        padding: '14px 40px',
                        backgroundColor: isLoadingMore ? 'rgba(0,0,0,0.1)' : '#333',
                        color: isLoadingMore ? 'rgba(0,0,0,0.4)' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {isLoadingMore ? 'Loading...' : `Load More (${results.length} of ${totalCount})`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 40px',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  borderRadius: '16px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  No results found
                </h3>
                <p
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.6)',
                    marginBottom: '24px',
                  }}
                >
                  Try adjusting your filters or search terms
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  {activeFilterChips.length > 0 && (
                    <button
                      onClick={handleClearFilters}
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '14px',
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleClearSearch();
                      handleClearFilters();
                    }}
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      padding: '12px 24px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Start new search
                  </button>
                </div>
              </div>
            )
          ) : (
            // Empty state before search
            <div
              style={{
                textAlign: 'center',
                padding: '80px 40px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '28px',
                  fontWeight: 500,
                  marginBottom: '16px',
                  color: '#000',
                }}
              >
                Find architectural projects
              </h2>
              <p
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '16px',
                  color: 'rgba(0,0,0,0.6)',
                  marginBottom: '32px',
                  maxWidth: '500px',
                  margin: '0 auto 32px',
                }}
              >
                Search by description, upload a reference image, or both to discover relevant
                architectural projects.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  justifyContent: 'center',
                }}
              >
                {[
                  'Timber atrium school',
                  'Courtyard housing Mexico',
                  'Brutalist museum',
                  'Sustainable office tower',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => performSearch(suggestion, null, 'balanced')}
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '13px',
                      padding: '10px 18px',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Board Drawer */}
      <BoardDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />

      {/* CSS for skeleton animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

