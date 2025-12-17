import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { FolderOpen, X, SortAsc } from 'lucide-react';
import {
  ClassicSearchBar,
  FilterSidebar,
  SearchResultCard,
  BoardDrawer,
  type MatchEmphasis,
  type FilterState,
  type SearchResultData,
} from '../components/ClassicSearch';
import { useBoardStore } from '../stores/boardStore';
import { mockProjects } from '../lib/mockData';
import { toast } from 'sonner';

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

export function ClassicSearchPage() {
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
    const newUrl = qs ? `/search?${qs}` : '/search';

    // Update URL without navigation
    window.history.replaceState(null, '', newUrl);
  }, [query, filters.typology, filters.country, emphasis]);

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
      setQuery(searchQuery);
      setUploadedImage(searchImage);
      setEmphasis(searchEmphasis);

      // Simulate API call with mock data
      // In production, this would call POST /search
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate mock results from mockProjects
      const mockResults: SearchResultData[] = mockProjects.map((project, index) => {
        const baseScore = 0.95 - index * 0.015;
        const visualWeight = searchEmphasis === 'visual' ? 0.8 : searchEmphasis === 'semantic' ? 0.2 : 0.5;
        const finalScore = Math.max(0.3, baseScore * (0.8 + visualWeight * 0.2));

        return {
          project_id: project.id,
          project_title: project.name,
          architect: project.architect,
          location_display: project.location,
          year: project.yearBuilt,
          image_id: `img_${project.id}_01`,
          thumb_url: project.imageUrl,
          image_url: project.imageUrl,
          score: finalScore,
          match_reason:
            searchEmphasis === 'visual'
              ? 'Visual similarity'
              : searchEmphasis === 'semantic'
              ? 'Semantic match'
              : 'Balanced match',
          badges: {
            typology: [project.buildingType],
            country: [project.location.split(',').pop()?.trim() || ''],
            climate_bin: project.climate,
          },
        };
      });

      setResults(mockResults);
      setIsSearching(false);
    },
    []
  );

  // Filter results client-side
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      // Typology filter
      if (filters.typology.length > 0) {
        const resultTypologies = result.badges?.typology || [];
        if (!filters.typology.some((t) => resultTypologies.includes(t))) {
          return false;
        }
      }

      // Country filter
      if (filters.country.length > 0) {
        const resultCountries = result.badges?.country || [];
        if (!filters.country.some((c) => resultCountries.some((rc) => rc.includes(c)))) {
          return false;
        }
      }

      // Climate filter
      if (filters.climate_bin.length > 0) {
        const resultClimate = result.badges?.climate_bin || [];
        if (!filters.climate_bin.some((c) => resultClimate.some((rc) => rc.includes(c)))) {
          return false;
        }
      }

      return true;
    });
  }, [results, filters]);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];
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
  }, [filteredResults, sortBy]);

  // Handlers
  const handleSearch = (q: string, image: File | string | null, emp: MatchEmphasis) => {
    performSearch(q, image, emp);
  };

  const handleClearSearch = () => {
    setQuery('');
    setUploadedImage(null);
    setResults([]);
    setHasSearched(false);
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

  const handleOpenResult = (result: SearchResultData) => {
    setLocation(`/project/${result.project_id}?image_id=${result.image_id}&from=search`);
  };

  const handleSaveResult = (result: SearchResultData) => {
    saveToActiveBoard({
      project_id: result.project_id,
      image_id: result.image_id,
      thumb_url: result.thumb_url,
      title_snapshot: result.project_title,
      architect_snapshot: result.architect,
      location_snapshot: result.location_display,
      source_context: {
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

  const handleSearchLikeThis = (result: SearchResultData) => {
    // Use the result's image to search
    performSearch('', result.image_url, 'visual');
  };

  // Check if an item is saved
  const isItemSaved = (projectId: string) => {
    const activeBoard = boards.find((b) => b.id === activeBoardId);
    return activeBoard?.items.some((item) => item.project_id === projectId) || false;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Top Bar */}
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
          {/* Logo */}
          <button
            onClick={() => setLocation('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '20px',
              fontWeight: 600,
              color: '#000',
              padding: '8px 0',
            }}
          >
            Archipedia
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
                backgroundColor: isDrawerOpen ? 'var(--accent)' : 'rgba(0,0,0,0.05)',
                color: isDrawerOpen ? 'white' : '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 150ms ease',
              }}
            >
              <FolderOpen size={18} />
              Boards
              {boards.length > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: isDrawerOpen ? 'rgba(255,255,255,0.3)' : 'var(--accent)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '8px',
                  }}
                >
                  {boards.reduce((acc, b) => acc + b.items.length, 0)}
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
                    fontFamily: 'var(--font-primary)',
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
                      backgroundColor: 'rgba(182, 68, 36, 0.1)',
                      borderRadius: '6px',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '12px',
                      color: 'var(--accent)',
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
                    fontFamily: 'var(--font-secondary)',
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
            sortedResults.length > 0 ? (
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
                    fontFamily: 'var(--font-primary)',
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  No results found
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-secondary)',
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
                        fontFamily: 'var(--font-secondary)',
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
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      padding: '12px 24px',
                      backgroundColor: 'var(--accent)',
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
                  fontFamily: 'var(--font-primary)',
                  fontSize: '28px',
                  fontWeight: 500,
                  marginBottom: '16px',
                  color: '#000',
                }}
              >
                Find your next architectural inspiration
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
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
                      fontFamily: 'var(--font-secondary)',
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

