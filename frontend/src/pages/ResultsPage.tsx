import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { mockProjects } from "../lib/mockData";
import { useSearchStore, SearchResult } from "../stores/searchStore";
import { searchByText, toAbsoluteUrl } from "../lib/navigatorApi";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeCanvas } from "../components/Canvas/NodeCanvas";
import { NodePaletteSidebar } from "../components/Sidebar/NodePaletteSidebar";
import { ResultsGridCompact } from "../components/SearchResults/ResultsGridCompact";
import { PrecedentProject } from "../types/nodes";
import { 
  createTextNode, 
  createImageNode, 
  createPrecedentNode,
  createAttributeFilterNode, 
  createScalarNode, 
  createOperatorANDNode, 
  createOperatorORNode, 
  createOperatorNOTNode 
} from "../lib/nodeFactory";

interface FilterState {
  typology: string[];
  climate: string[];
}

interface FusionWeights {
  visual: number;
  spatial: number;
  attribute: number;
}

export function ResultsPage() {
  const [, setLocation] = useLocation();
  // wouter's useLocation only returns pathname, use window.location.search for query params
  const params = new URLSearchParams(window.location.search);
  const initialSearchQuery = params.get("q") || "";
  const imageParam = params.get("image");
  
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialSearchQuery);
  const [hasSearched, setHasSearched] = useState(!!initialSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    typology: [],
    climate: [],
  });
  
  const [fusionWeights, setFusionWeights] = useState<FusionWeights>({
    visual: 33,
    spatial: 33,
    attribute: 34,
  });

  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  
  const { searchResults, setSearchResults, setSearchQuery: setStoreQuery } = useSearchStore();
  const { nodes, addNodes, executeWorkflow } = useCanvasStore();

  // Initialize search results when page loads with a query parameter
  useEffect(() => {
    const performInitialSearch = async () => {
      if (hasSearched && searchResults.length === 0 && currentSearchQuery) {
        setIsSearching(true);
        try {
          const response = await searchByText(currentSearchQuery, { topK: 50 });
          
          const resultsWithMatch: SearchResult[] = response.results.map((result, index) => {
            const score = result.score ?? 0.5;
            const matchPercentage = Math.round(score * 100);
            
            return {
              id: result.project_id || result.image_id || `result-${index}`,
              title: result.title || result.project_id || 'Unknown Project',
              imageUrl: toAbsoluteUrl(result.thumb_url) || '',
              buildingType: result.typology || 'Unknown',
              style: result.massing_type || 'Unknown',
              location: result.country || 'Unknown',
              year: 2024,
              description: `Project in ${result.country || 'unknown location'}`,
              matchPercentage,
              similarityScore: score,
              visualScore: score,
              spatialScore: score * 0.9,
              attributeScore: score * 0.85,
              url: toAbsoluteUrl(result.thumb_url) || '',
              typology: result.typology || 'Unknown',
              materials: result.massing_type || 'Unknown',
              climate: result.climate_bin ? [result.climate_bin] : [],
            };
          });
          
          setSearchResults(resultsWithMatch);
          setStoreQuery(currentSearchQuery);
        } catch (error) {
          console.error('Initial search failed:', error);
          // Fallback to mock data
          const fallbackResults: SearchResult[] = mockProjects.slice(0, 12).map((project, index) => ({
            ...project,
            matchPercentage: 95 - (index * 1.5),
            similarityScore: (95 - index * 1.5) / 100,
            visualScore: 0.7,
            spatialScore: 0.7,
            attributeScore: 0.7,
          }));
          setSearchResults(fallbackResults);
          setStoreQuery(currentSearchQuery);
        } finally {
          setIsSearching(false);
        }
      }
    };
    
    performInitialSearch();
  }, [hasSearched, searchResults.length, currentSearchQuery]);

  // Track if we've already handled the image param
  const imageParamHandledRef = useRef(false);

  // Create an image node if imageParam is present in URL
  useEffect(() => {
    if (imageParam && !imageParamHandledRef.current) {
      imageParamHandledRef.current = true;
      const imageNode = createImageNode(
        { x: 100, y: 200 },
        imageParam
      );
      addNodes([imageNode]);
    }
  }, [imageParam, addNodes]);

  // Filter results
  const filteredResults = useMemo(() => {
    return searchResults.filter((result) => {
      const typologyMatch = filters.typology.length === 0 || 
        filters.typology.includes(result.typology || '');
      
      const resultClimate = Array.isArray(result.climate) 
        ? result.climate 
        : result.climate 
          ? [result.climate] 
          : [];
      const climateMatch = filters.climate.length === 0 || 
        filters.climate.some(c => 
          resultClimate.some(rc => 
            rc.toLowerCase().includes(c.toLowerCase()) || 
            c.toLowerCase().includes(rc.toLowerCase())
          )
        );
      
      return typologyMatch && climateMatch;
    });
  }, [searchResults, filters]);

  const handleFilterChange = useCallback((category: 'typology' | 'climate', value: string, checked: boolean) => {
    setFilters((prev) => {
      const current = prev[category];
      if (checked) {
        return { ...prev, [category]: [...current, value] };
      } else {
        return { ...prev, [category]: current.filter((v) => v !== value) };
      }
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, project: SearchResult) => {
    e.dataTransfer.setData('application/archipedia-precedent', JSON.stringify(project));
  }, []);

  // Add node to canvas
  const addNodeToCanvas = useCallback((type: string) => {
    const position = {
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
    };
    
    let newNode: ReturnType<typeof createTextNode> | null = null;
    switch (type) {
      case 'text':
        newNode = createTextNode(position, '');
        break;
      case 'image':
        newNode = createImageNode(position);
        break;
      case 'attributeFilter':
        newNode = createAttributeFilterNode(position);
        break;
      case 'scalar':
        newNode = createScalarNode(position);
        break;
      case 'operatorAND':
        newNode = createOperatorANDNode(position);
        break;
      case 'operatorOR':
        newNode = createOperatorORNode(position);
        break;
      case 'operatorNOT':
        newNode = createOperatorNOTNode(position);
        break;
      default:
        console.warn(`Unknown node type: ${type}, defaulting to text node`);
        newNode = createTextNode(position, '');
        break;
    }

    if (newNode) {
      addNodes([newNode]);
      setSelectedNodeType(null);
    } else {
      console.error(`Failed to create node of type: ${type}`);
    }
  }, [addNodes, setSelectedNodeType]);

  // Execute workflow from Recipe Builder
  const handleExecuteWorkflow = useCallback((workflow: any) => {
    const startX = 100;
    let currentX = startX;
    const startY = 200;
    let currentY = startY;
    const nodeSpacing = 350;

    const workflowNodes: any[] = [];

    workflow.nodes.forEach((nodeConfig: any, index: number) => {
      const position = { x: currentX, y: currentY };
      let newNode: any = null;

      if (nodeConfig.type === 'text') {
        newNode = createTextNode(position, 'Synthesize design principles...');
        newNode.data.prompt = 'Synthesize design principles from precedents';
      }

      if (newNode) {
        workflowNodes.push(newNode);
        currentX += nodeSpacing;
      }
    });

    addNodes(workflowNodes);
  }, [addNodes]);

  // Import Precedent Stack
  const handleImportPrecedentStack = useCallback(() => {
    const selectedProjects = filteredResults.slice(0, 3).map((result): PrecedentProject => ({
      id: result.id,
      title: result.name,
      thumbnail: result.imageUrl || result.url || '',
      attributes: {
        circulation: result.typology || '',
        materiality: result.materials?.join('+') || '',
        climate: result.climate || '',
      },
    }));

    const position = {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    };

    const stackNode = createPrecedentNode(position, selectedProjects);
    addNodes([stackNode]);
  }, [filteredResults, addNodes]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ===== LEFT (75%) = CANVAS ===== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '75%',
        }}
      >
        {/* Canvas Top-Left Controls */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '8px 12px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          {/* Smiley Logo */}
          <button
            onClick={() => setLocation('/')}
            style={{
              fontSize: '18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            🙂
          </button>

          {/* Actions Dropdown */}
          <select
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              cursor: 'pointer',
              marginRight: '8px',
              appearance: 'none',
              backgroundImage: 'none',
            }}
          >
            <option>Actions</option>
            <option>Share Canvas</option>
            <option>Download JSON</option>
            <option>Export Image</option>
          </select>

          {/* RUN Button */}
          <button
            onClick={async () => {
              try {
                await executeWorkflow();
                console.log('Workflow execution completed');
              } catch (error) {
                console.error('Workflow execution failed:', error);
              }
            }}
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              padding: '4px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#32C864',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#28A855';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#32C864';
            }}
          >
            RUN
          </button>
        </div>

        {/* Canvas Content */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: 'linear-gradient(to bottom right, #F5F1E8, #FAFAF8)',
          overflow: 'hidden',
        }}
      >
          <NodeCanvas />

          {/* Empty State */}
          {nodes.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '16px',
                    fontWeight: 300,
                    color: 'rgba(0,0,0,0.4)',
                    marginBottom: '6px',
                  }}
                >
                  Click node icons to begin
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.3)',
                  }}
                >
                  Add precedents and create stacks
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Palette Sidebar */}
        <NodePaletteSidebar onAddNode={addNodeToCanvas} />
      </div>

      {/* ===== RIGHT (25%) = RESIZABLE SECTIONS ===== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid rgba(0,0,0,0.1)',
          width: '25%',
          minWidth: 0,
        }}
      >
        {/* Section 1: Design Agent Header + Mode Toggle + Search */}
        <div
          style={{
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            padding: '12px 16px',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Research
          </h3>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search precedents (e.g., courtyard buildings...)"
            value={currentSearchQuery}
            onChange={(e) => {
              setCurrentSearchQuery(e.target.value);
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && currentSearchQuery.trim() && !isSearching) {
                setIsSearching(true);
                setHasSearched(true);
                
                try {
                  // Call real API for text search
                  const response = await searchByText(currentSearchQuery, {
                    topK: 50,
                  });
                  
                  // Transform API results to SearchResult format
                  const resultsWithMatch: SearchResult[] = response.results.map((result, index) => {
                    // Convert API score to display scores
                    const score = result.score ?? 0.5;
                    const matchPercentage = Math.round(score * 100);
                    
                    return {
                      id: result.project_id || result.image_id || `result-${index}`,
                      title: result.title || result.project_id || 'Unknown Project',
                      imageUrl: toAbsoluteUrl(result.thumb_url) || '',
                      buildingType: result.typology || 'Unknown',
                      style: result.massing_type || 'Unknown',
                      location: result.country || 'Unknown',
                      year: 2024,
                      description: `Project in ${result.country || 'unknown location'}`,
                      matchPercentage,
                      similarityScore: score,
                      visualScore: score,
                      spatialScore: score * 0.9,
                      attributeScore: score * 0.85,
                      url: toAbsoluteUrl(result.thumb_url) || '',
                      typology: result.typology || 'Unknown',
                      materials: result.massing_type || 'Unknown',
                      climate: result.climate_bin ? [result.climate_bin] : [],
                    };
                  });
                  
                  setSearchResults(resultsWithMatch);
                  setStoreQuery(currentSearchQuery);
                } catch (error) {
                  console.error('Text search failed:', error);
                  // Fallback to mock data on error
                  const fallbackResults: SearchResult[] = mockProjects.slice(0, 12).map((project, index) => ({
                    ...project,
                    matchPercentage: 95 - (index * 1.5),
                    similarityScore: (95 - index * 1.5) / 100,
                    visualScore: 0.7,
                    spatialScore: 0.7,
                    attributeScore: 0.7,
                  }));
                  setSearchResults(fallbackResults);
                  setStoreQuery(currentSearchQuery);
                } finally {
                  setIsSearching(false);
                }
              }
            }}
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              padding: '10px 12px',
              width: '100%',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              boxSizing: 'border-box',
              backgroundColor: 'white',
            }}
          />
          
          {/* Help Text - Show when no search has been performed */}
          {!hasSearched && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '6px',
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                lineHeight: '1.5',
                color: 'rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '6px', color: '#000000' }}>
                How to use this page:
              </div>
              <div style={{ marginBottom: '4px' }}>
                • Type your search query above and press Enter to find architectural precedents
              </div>
              <div style={{ marginBottom: '4px' }}>
                • Adjust the Fusion Weights below to prioritize Visual, Spatial, or Regional similarity
              </div>
              <div style={{ marginBottom: '4px' }}>
                • Use Filters to narrow down by typology or climate
              </div>
              <div>
                • Drag projects from the results onto the canvas to create precedent nodes
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Fusion Weights + Filters */}
        <div
          style={{
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            padding: '12px 16px',
            flexShrink: 0,
            height: hasSearched ? '25%' : 'auto',
            overflowY: 'auto',
            maxHeight: hasSearched ? '25%' : 'none',
          }}
        >
          {/* Fusion Weights */}
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Fusion Weights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Visual', value: fusionWeights.visual, color: '#FFC800' },
                { label: 'Spatial', value: fusionWeights.spatial, color: '#64B5FF' },
                { label: 'Regional', value: fusionWeights.attribute, color: '#32C864' },
              ].map((slider) => (
                <div key={slider.label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '9px',
                      fontWeight: 300,
                      color: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
        >
                    <span>{slider.label}</span>
                    <span>{slider.value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={slider.value}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      const newWeights = { ...fusionWeights };
                      if (slider.label === 'Visual') newWeights.visual = newValue;
                      if (slider.label === 'Spatial') newWeights.spatial = newValue;
                      if (slider.label === 'Regional') newWeights.attribute = newValue;
                      
                      // Normalize
                      const total = newWeights.visual + newWeights.spatial + newWeights.attribute;
                      if (total > 0) {
                        setFusionWeights({
                          visual: Math.round((newWeights.visual / total) * 100),
                          spatial: Math.round((newWeights.spatial / total) * 100),
                          attribute: Math.round((newWeights.attribute / total) * 100),
                        });
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      height: '4px',
                      borderRadius: '2px',
                      appearance: 'none',
                      background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${slider.value}%, rgba(0,0,0,0.08) ${slider.value}%, rgba(0,0,0,0.08) 100%)`,
                      outline: 'none',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Filters ({filters.typology.length + filters.climate.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Cultural', 'Educational', 'Commercial', 'Residential', 'Civic', 'Industrial', 'Hospitality', 'Healthcare', 'Sports', 'Transportation', 'Public Space', 'Sacred'].map((filter) => {
                const isSelected = filters.typology.includes(filter) || filters.climate.includes(filter);
                return (
                  <button
                    key={filter}
                    onClick={() => {
                      // Determine if it's typology or climate based on filter name
                      const isClimate = ['Mediterranean', 'Tropical', 'Arctic', 'Urban', 'Rural', 'Coastal', 'Desert'].includes(filter);
                      handleFilterChange(isClimate ? 'climate' : 'typology', filter, !isSelected);
                    }}
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '9px',
                      padding: '4px 8px',
                      backgroundColor: isSelected ? '#FFC800' : 'rgba(0,0,0,0.05)',
                      border: isSelected
                        ? '1px solid #FFC800'
                        : '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#000000',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Results Grid - Only show when user has searched */}
        {hasSearched && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '50%', flexShrink: 0 }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                fontSize: '10px',
                fontWeight: 400,
                fontFamily: 'var(--font-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Ranked Results {!isSearching && `(${filteredResults.length})`}</span>
                {isSearching && (
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(0,0,0,0.1)',
                      borderTop: '2px solid #64B5FF',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                )}
              </div>
              {currentSearchQuery && !isSearching && (
                <span style={{ fontSize: '9px', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
                  "{currentSearchQuery}"
                </span>
              )}
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                alignItems: isSearching ? 'center' : 'flex-start',
                justifyContent: isSearching ? 'center' : 'flex-start',
              }}
            >
              {isSearching ? (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid rgba(0,0,0,0.1)',
                      borderTop: '3px solid #64B5FF',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 12px',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '10px',
                      color: 'rgba(0,0,0,0.6)',
                    }}
                  >
                    Searching precedents...
                  </div>
                </div>
              ) : (
                <ResultsGridCompact
                  projects={filteredResults}
                  weights={fusionWeights}
                  onDragStart={handleDragStart}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
