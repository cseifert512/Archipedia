import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronUp, ChevronDown } from "lucide-react";
import { mockProjects } from "../lib/mockData";
import { useSearchStore, SearchResult } from "../stores/searchStore";
import { searchByText, toAbsoluteUrl } from "../lib/navigatorApi";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeCanvas } from "../components/Canvas/NodeCanvas";
import { NodePaletteSidebar } from "../components/Sidebar/NodePaletteSidebar";
import { ResultsGridCompact } from "../components/SearchResults/ResultsGridCompact";
import { PrecedentProject } from "../types/nodes";
import { UserButton } from "../components/UserButton";
import { 
  createTextNode, 
  createImageNode, 
  createPrecedentNode,
  createAttributeFilterNode, 
  createScalarNode, 
  createResultsNode,
  createOperatorANDNode, 
  createOperatorORNode, 
  createOperatorNOTNode 
} from "../lib/nodeFactory";

export function ResultsPage() {
  const [, setLocation] = useLocation();
  // wouter's useLocation only returns pathname, use window.location.search for query params
  const params = new URLSearchParams(window.location.search);
  const initialSearchQuery = params.get("q") || "";
  const imageParam = params.get("image");
  
  // Use persisted state from store
  const { 
    searchResults, 
    setSearchResults, 
    setSearchQuery: setStoreQuery,
    searchQuery: storedQuery,
    canvasFilters,
    setCanvasFilters,
    canvasFusionWeights,
    setCanvasFusionWeights,
    canvasHasSearched,
    setCanvasHasSearched,
  } = useSearchStore();
  
  // Initialize local state from store or URL params
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialSearchQuery || storedQuery);
  const [hasSearched, setHasSearched] = useState(canvasHasSearched || !!initialSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use store state for filters and weights (persisted)
  const filters = canvasFilters;
  const setFilters = setCanvasFilters;
  const fusionWeights = canvasFusionWeights;
  const setFusionWeights = setCanvasFusionWeights;

  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [researchPanelCollapsed, setResearchPanelCollapsed] = useState(false);
  const { nodes, edges, addNodes, executeWorkflow, selectedNodes } = useCanvasStore();
  
  // Get selected node's execution results (if any)
  const selectedNode = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    return nodes.find((n) => n.id === selectedNodes[0]) || null;
  }, [selectedNodes, nodes]);
  
  // Check if selected node has results to display
  const selectedNodeResults = useMemo(() => {
    if (!selectedNode) return null;
    const data = selectedNode.data as any;
    
    // Helper to transform project/result objects to SearchResult format
    const transformProject = (p: any): SearchResult => ({
      id: p.id || p.project_id || '',
      name: p.title || p.name || 'Project',
      imageUrl: p.thumbnail || p.thumb_url || '',
      url: p.thumbnail || p.thumb_url || '',
      buildingType: p.attributes?.typology || p.typology || '',
      climate: p.attributes?.climate ? [p.attributes.climate] : [],
      matchPercentage: 90,
      similarityScore: 0.9,
      visualScore: 0.9,
      spatialScore: 0.9,
      attributeScore: 0.9,
      typology: p.attributes?.typology || p.typology || '',
    });
    
    const transformResult = (r: any, idx: number): SearchResult => ({
      id: String(r.project_id || r.id || `result_${idx}`),
      name: String(r.title || r.project_id || 'Result'),
      imageUrl: r.thumb_url ? toAbsoluteUrl(r.thumb_url) : undefined,
      url: r.thumb_url ? toAbsoluteUrl(r.thumb_url) : undefined,
      buildingType: r.typology || '',
      climate: r.climate_bin ? [r.climate_bin] : [],
      matchPercentage: Math.max(10, 100 - idx),
      similarityScore: r.score ?? (1 - (r.distance ?? 0.5)),
      visualScore: 0.8,
      spatialScore: 0.8,
      attributeScore: 0.8,
      typology: r.typology || '',
    });
    
    // Check for projects array (from Precedent nodes or execution results)
    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      return data.projects.map(transformProject);
    }
    
    // Check for executionResult with projects array (from ResultsNode or TextNode)
    if (data.executionResult?.projects && Array.isArray(data.executionResult.projects) && data.executionResult.projects.length > 0) {
      return data.executionResult.projects.map(transformProject);
    }
    
    // Check for executionResult with results array
    if (data.executionResult?.results && Array.isArray(data.executionResult.results) && data.executionResult.results.length > 0) {
      return data.executionResult.results.map(transformResult);
    }
    
    // Check for executionResult.output array (from ResultsNode)
    if (data.executionResult?.output && Array.isArray(data.executionResult.output) && data.executionResult.output.length > 0) {
      return data.executionResult.output.map(transformProject);
    }
    
    return null;
  }, [selectedNode]);

  const performTextSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);
    setCanvasHasSearched(true);
    try {
      const resp = await searchByText(q, { topK: 50 });
      const mapped: SearchResult[] = (resp.results || []).map((r: any, idx: number) => {
        const baseScore = 0.65 + Math.random() * 0.25;
        const imageUrl = toAbsoluteUrl(r.thumb_url) || undefined;
        return {
          id: String(r.project_id || `text_${idx}`),
          name: String(r.title || r.project_id || 'Result'),
          imageUrl,
          url: imageUrl,
          buildingType: r.typology || undefined,
          climate: r.climate_bin ? [String(r.climate_bin)] : [],
          matchPercentage: Math.max(10, 100 - idx),
          similarityScore: Math.max(0.1, 1 - idx / 100),
          visualScore: Math.max(0.3, Math.min(1.0, baseScore)),
          spatialScore: Math.max(0.3, Math.min(1.0, baseScore)),
          attributeScore: Math.max(0.3, Math.min(1.0, baseScore)),
          typology: r.typology ? String(r.typology) : undefined,
        } as any;
      });
      setSearchResults(mapped);
      setStoreQuery(q);
    } catch (error) {
      console.error('Text search failed, falling back to mock results:', error);
      const resultsWithMatch: SearchResult[] = mockProjects.slice(0, 50).map((project, index) => {
        const baseScore = 0.7 + (Math.random() * 0.25);
        const visualScore = baseScore + (Math.random() * 0.1 - 0.05);
        const spatialScore = baseScore + (Math.random() * 0.1 - 0.05);
        const attributeScore = baseScore + (Math.random() * 0.1 - 0.05);
        
        return {
          ...project,
          matchPercentage: 95 - (index * 1.5),
          similarityScore: (95 - index * 1.5) / 100,
          visualScore: Math.max(0.3, Math.min(1.0, visualScore)),
          spatialScore: Math.max(0.3, Math.min(1.0, spatialScore)),
          attributeScore: Math.max(0.3, Math.min(1.0, attributeScore)),
          url: project.imageUrl,
          typology: project.buildingType,
          materials: project.style,
          climate: Array.isArray(project.climate) ? project.climate : (project.climate ? [project.climate] : []),
        };
      });
      setSearchResults(resultsWithMatch);
      setStoreQuery(q);
    } finally {
      setIsSearching(false);
    }
  }, [setIsSearching, setHasSearched, setSearchResults, setStoreQuery, setCanvasHasSearched]);

  // If URL provides a query (e.g. /results?q=...), run a text search on load.
  useEffect(() => {
    if (!initialSearchQuery.trim()) return;
    if (searchResults.length > 0) return;
    performTextSearch(initialSearchQuery);
  }, [initialSearchQuery, searchResults.length, performTextSearch]);

  // Track if we've already handled the image param
  const imageParamHandledRef = useRef(false);
  
  // Track if we've already handled the query param for canvas node creation
  const queryParamHandledRef = useRef(false);

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
  
  // Create a text node with query, connect to a results node, and auto-execute
  useEffect(() => {
    const query = initialSearchQuery.trim();
    if (!query) return;
    if (queryParamHandledRef.current) return;
    if (nodes.length > 0) return; // Don't add if there are already nodes on canvas
    
    queryParamHandledRef.current = true;
    
    // Create a text node with the search query
    const textNode = createTextNode(
      { x: 200, y: 150 },
      query
    );
    
    // Create a results node positioned to the right of the text node
    const resultsNode = createResultsNode(
      { x: 650, y: 100 },
      0
    );
    
    // Add both nodes
    const { addEdges } = useCanvasStore.getState();
    addNodes([textNode, resultsNode]);
    
    // Create an edge connecting text node output to results node input
    const edge = {
      id: `edge-${textNode.id}-${resultsNode.id}`,
      source: textNode.id,
      sourceHandle: 'output',
      target: resultsNode.id,
      targetHandle: 'input',
    };
    
    // Add the edge after a brief delay to ensure nodes are added
    setTimeout(() => {
      addEdges([edge]);
      
      // Execute from the results node (triggers upstream text node first)
      const { executeFromNode, setSelectedNodes } = useCanvasStore.getState();
      executeFromNode(resultsNode.id).then(() => {
        // Select the results node after execution so its results appear in the panel
        setSelectedNodes([resultsNode.id]);
      });
    }, 100);
  }, [initialSearchQuery, nodes.length, addNodes]);

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
    const current = filters[category];
    if (checked) {
      setFilters({ ...filters, [category]: [...current, value] });
    } else {
      setFilters({ ...filters, [category]: current.filter((v) => v !== value) });
    }
  }, [filters, setFilters]);

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
      case 'results':
        newNode = createResultsNode(position, 0);
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

        {/* Canvas Top-Right Controls - Profile Button */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '6px 10px',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <UserButton />
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
                pointerEvents: 'none',
              }}
            >
              {/* Left Column - Node Descriptions aligned with sidebar buttons */}
              <div
                style={{
                  position: 'absolute',
                  left: '220px', // Align with sidebar (180px width + 20px left + 20px gap)
                  top: '120px', // Match sidebar top
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px', // Match sidebar gap
                  textAlign: 'left',
                }}
              >
                {/* Box: Node descriptions - each aligned with its button (40px height, 4px gap) */}
                <div
                  style={{
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '0 12px 12px 12px',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '348px', // Match approximate height: 8 nodes * 40px + 7 gaps * 4px = 348px
                    width: '280px', // Match width with workflows box
                  }}
                >
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>TEXT</strong> — Search by description or prompt
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>IMAGE</strong> — Search by visual similarity
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>ATTRIBUTES</strong> — Filter by typology, climate, etc.
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>CONSTRAINTS</strong> — Apply scalar filters (area, height, etc.)
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>RESULTS</strong> — Display search results
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>AND</strong> — Combine multiple inputs
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>OR</strong> — Union of multiple inputs
                    </div>
                  </div>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(0,0,0,0.4)',
                      }}
                    >
                      <strong>NOT</strong> — Exclude similar results
                    </div>
                  </div>
                </div>

                {/* Box: Workflows section - aligned with Workflows button (after 8 nodes + separator) */}
                <div style={{ marginTop: '12px', paddingTop: '12px' }}>
                  <div
                    style={{
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      width: '280px', // Match width with node descriptions box
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'rgba(0,0,0,0.5)',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Workflows
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '12px',
                          fontWeight: 300,
                          color: 'rgba(0,0,0,0.4)',
                          lineHeight: '1.5',
                        }}
                      >
                        Save and load workflow templates.
                        <br />
                        Click the <strong>WORKFLOWS</strong> button to manage your saved workflows.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero and Navigation */}
              {/* Hero box - aligned horizontally with Workflows box */}
              <div
                style={{
                  position: 'absolute',
                  left: '750px', // Position further to the right, separate from left column
                  top: '492px', // Align with Workflows section
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  }}
                >
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

              {/* Navigation box - aligned horizontally with Node Types box */}
              <div
                style={{
                  position: 'absolute',
                  left: '750px', // Position further to the right, separate from left column
                  top: '120px', // Align with Node Types section
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'rgba(0,0,0,0.5)',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Navigation
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '12px',
                      fontWeight: 300,
                      color: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <div><strong>Left Click</strong> — Select node or drag to pan canvas</div>
                    <div><strong>Right Click</strong> — Open context menu</div>
                    <div><strong>Shift + Left Click</strong> — Multi-select nodes</div>
                    <div><strong>Drag Handle</strong> — Connect nodes</div>
                    <div><strong>Scroll</strong> — Zoom in/out</div>
                    <div><strong>Delete/Backspace</strong> — Remove selected nodes</div>
                    <div><strong>Esc</strong> — Cancel connection or deselect</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Palette Sidebar */}
        <NodePaletteSidebar 
          onAddNode={addNodeToCanvas}
          onOpenTemplates={() => {
            if ((window as any).__openTemplates) {
              (window as any).__openTemplates();
            }
          }}
          onLoadTemplate={(template) => {
            // Handle template loading
            if ((window as any).__loadTemplate) {
              (window as any).__loadTemplate(template);
            }
          }}
          currentNodes={nodes}
          currentEdges={edges}
        />
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
        {/* Section 1: Research Header (collapsible toggle) */}
        <div
          style={{
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            padding: '12px 16px',
            flexShrink: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onClick={() => setResearchPanelCollapsed(!researchPanelCollapsed)}
        >
          <h3
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Research
          </h3>
          {researchPanelCollapsed ? (
            <ChevronDown size={16} color="rgba(0,0,0,0.5)" />
          ) : (
            <ChevronUp size={16} color="rgba(0,0,0,0.5)" />
          )}
        </div>

        {/* Collapsible Section: Search + Fusion Weights + Filters */}
        {!researchPanelCollapsed && (
          <>
            {/* Search Input Section */}
            <div
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                padding: '12px 16px',
                flexShrink: 0,
              }}
            >
              {/* Search Input */}
              <input
                type="text"
                placeholder="Search precedents (e.g., courtyard buildings...)"
                value={currentSearchQuery}
                onChange={(e) => {
                  setCurrentSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentSearchQuery.trim() && !isSearching) {
                    performTextSearch(currentSearchQuery);
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
                        setCanvasFusionWeights({
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
          </>
        )}

        {/* Section 3: Results Grid - Show when user has searched, when a node with results is selected, or when any search has been performed */}
        {(hasSearched || selectedNodeResults || searchResults.length > 0) && (
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
                {selectedNodeResults ? (
                  <span>Node Results ({selectedNodeResults.length})</span>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              {selectedNodeResults && selectedNode ? (
                <span style={{ fontSize: '9px', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
                  {(selectedNode.data as any).type === 'precedent' ? 'Precedent Node' : `${(selectedNode.data as any).type} node`}
                </span>
              ) : currentSearchQuery && !isSearching ? (
                <span style={{ fontSize: '9px', color: 'rgba(0,0,0,0.5)', fontStyle: 'italic' }}>
                  "{currentSearchQuery}"
                </span>
              ) : null}
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                alignItems: isSearching && !selectedNodeResults ? 'center' : 'flex-start',
                justifyContent: isSearching && !selectedNodeResults ? 'center' : 'flex-start',
              }}
            >
              {isSearching && !selectedNodeResults ? (
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
                  projects={selectedNodeResults || filteredResults}
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
