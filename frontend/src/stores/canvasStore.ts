import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { NodeData } from '../types/nodes';
import { executeNode, getNodeInputs, topologicalSort, NodeExecutionResult } from '../lib/workflowEngine';

const API_BASE = 'http://localhost:8000';

// ============ Types ============

export interface BoardDoc {
  board_id: string;
  version: number;
  schema_version: number;
  doc_json: any;
  updated_at: string;
}

// Legacy node types for backwards compatibility with ResultsPage
export interface LegacyNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface CanvasState {
  // Document state
  boardId: string | null;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  
  // Editor reference (for tldraw) - typed as any to avoid import issues
  editor: any | null;
  
  // Save status
  isSaving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  
  // Conflict state
  hasConflict: boolean;
  conflictVersion: number | null;
  
  // ReactFlow state
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodes: string[];
  
  // Actions - tldraw
  setEditor: (editor: any | null) => void;
  setBoardId: (boardId: string) => void;
  loadDocument: (boardId: string) => Promise<boolean>;
  saveDocument: () => Promise<boolean>;
  markUnsaved: () => void;
  resolveConflict: (action: 'reload' | 'overwrite') => Promise<void>;
  reset: () => void;
  
  // Actions - ReactFlow
  addNodes: (nodes: Node<NodeData>[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Record<string, any>) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  
  // Actions - Workflow execution
  executeFromNode: (nodeId: string) => Promise<void>;
  executeWorkflow: () => Promise<void>;
}

// ============ Debounce Helper ============

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DELAY = 700;

// ============ Store ============

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
  // Initial state
  boardId: null,
  version: 0,
  schemaVersion: 1,
  lastSavedAt: null,
  editor: null,
  isSaving: false,
  saveError: null,
  hasUnsavedChanges: false,
  hasConflict: false,
  conflictVersion: null,
  
  // ReactFlow state
  nodes: [],
  edges: [],
  selectedNodes: [],

  setEditor: (editor) => {
    set({ editor });
    
    // Set up change listener for autosave
    if (editor) {
      editor.store.listen(() => {
        get().markUnsaved();
      });
    }
  },

  setBoardId: (boardId) => {
    set({ boardId, version: 0, hasUnsavedChanges: false });
  },

  loadDocument: async (boardId) => {
    set({ boardId, isSaving: false, saveError: null, hasConflict: false });
    
    try {
      const response = await fetch(`${API_BASE}/boards/${boardId}/doc`);
      
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`);
      }
      
      const data: BoardDoc = await response.json();
      
      set({
        version: data.version,
        schemaVersion: data.schema_version,
        lastSavedAt: data.updated_at,
        hasUnsavedChanges: false,
      });
      
      // Load snapshot into editor if available
      const { editor } = get();
      if (editor && data.doc_json) {
        try {
          editor.store.loadSnapshot(data.doc_json);
        } catch (e) {
          console.warn('Failed to load snapshot, using default state:', e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load document:', error);
      set({ 
        saveError: error instanceof Error ? error.message : 'Failed to load',
        version: 0,
      });
      return false;
    }
  },

  saveDocument: async () => {
    const { boardId, version, editor, isSaving, hasConflict } = get();
    
    if (!boardId || !editor || isSaving || hasConflict) {
      return false;
    }
    
    set({ isSaving: true, saveError: null });
    
    try {
      // Get current snapshot from editor
      const snapshot = editor.store.getSnapshot();
      
      const response = await fetch(`${API_BASE}/boards/${boardId}/doc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_json: snapshot,
          expected_version: version,
        }),
      });
      
      if (response.status === 409) {
        // Version conflict
        const errorData = await response.json();
        const currentVersion = parseInt(errorData.detail?.match(/current is (\d+)/)?.[1] || '0');
        
        set({
          isSaving: false,
          hasConflict: true,
          conflictVersion: currentVersion,
          saveError: 'Document was modified elsewhere',
        });
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      
      const data: BoardDoc = await response.json();
      
      set({
        version: data.version,
        lastSavedAt: data.updated_at,
        isSaving: false,
        hasUnsavedChanges: false,
        saveError: null,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save document:', error);
      set({
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Save failed',
      });
      return false;
    }
  },

  markUnsaved: () => {
    const { boardId } = get();
    if (!boardId) return;
    
    set({ hasUnsavedChanges: true });
    
    // Debounced autosave
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
      get().saveDocument();
    }, AUTOSAVE_DELAY);
  },

  resolveConflict: async (action) => {
    const { boardId } = get();
    if (!boardId) return;
    
    if (action === 'reload') {
      // Reload document from server
      set({ hasConflict: false, conflictVersion: null });
      await get().loadDocument(boardId);
    } else if (action === 'overwrite') {
      // Force save with current server version
      const { conflictVersion, editor } = get();
      if (!editor || conflictVersion === null) return;
      
      set({ 
        version: conflictVersion,
        hasConflict: false, 
        conflictVersion: null,
      });
      
      await get().saveDocument();
    }
  },

  reset: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    set({
      boardId: null,
      version: 0,
      schemaVersion: 1,
      lastSavedAt: null,
      editor: null,
      isSaving: false,
      saveError: null,
      hasUnsavedChanges: false,
      hasConflict: false,
      conflictVersion: null,
      nodes: [],
      edges: [],
      selectedNodes: [],
    });
  },
  
  // ReactFlow actions
  addNodes: (newNodes) => {
    console.log('[canvasStore] addNodes called with', newNodes.length, 'nodes');
    set((state) => ({
      nodes: [...state.nodes, ...newNodes],
    }));
  },
  
  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes) as Node<NodeData>[];
      
      // Track selected nodes in the same update
      const selectedIds = newNodes
        .filter((node) => node.selected)
        .map((node) => node.id);
      
      return {
        nodes: newNodes,
        selectedNodes: selectedIds,
      };
    });
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  
  onConnect: (connection) => {
    console.log('[canvasStore] onConnect called', connection);
    set((state) => ({
      edges: addEdge(connection, state.edges),
    }));
  },
  
  deleteNode: (nodeId) => {
    console.log('[canvasStore] deleteNode called for', nodeId);
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
  },
  
  updateNode: (nodeId, dataUpdate) => {
    console.log('[canvasStore] updateNode called for', nodeId, dataUpdate);
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...dataUpdate,
            },
          };
        }
        return node;
      }),
    }));
  },
  
  setSelectedNodes: (nodeIds) => {
    set({ selectedNodes: nodeIds });
  },
  
  // Workflow execution
  executeFromNode: async (nodeId) => {
    const state = get();
    const { nodes, edges } = state;
    
    // Find the node
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) {
      console.error('[executeFromNode] Node not found:', nodeId);
      return;
    }
    
    console.log('[executeFromNode] Starting execution for node:', nodeId);
    
    // Mark node as running using direct set() to ensure it works
    set((s) => ({
      nodes: s.nodes.map((n) => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, executionStatus: 'running', executionError: undefined } }
          : n
      ),
    }));
    
    try {
      // Find all upstream nodes (dependencies)
      const getUpstreamNodes = (nId: string, visited = new Set<string>()): string[] => {
        if (visited.has(nId)) return [];
        visited.add(nId);
        
        const incomingEdges = edges.filter((e) => e.target === nId);
        const upstreamIds = incomingEdges.map((e) => e.source);
        
        let allUpstream: string[] = [];
        for (const upId of upstreamIds) {
          allUpstream = [...allUpstream, ...getUpstreamNodes(upId, visited), upId];
        }
        return allUpstream;
      };
      
      const upstreamNodeIds = getUpstreamNodes(nodeId);
      const nodesToExecute = [...upstreamNodeIds, nodeId];
      
      // Get only the nodes we need
      const relevantNodes = nodes.filter((n) => nodesToExecute.includes(n.id));
      const relevantEdges = edges.filter(
        (e) => nodesToExecute.includes(e.source) && nodesToExecute.includes(e.target)
      );
      
      // Execute in topological order
      const executionResults = new Map<string, NodeExecutionResult>();
      
      let sortedNodes: Node<NodeData>[];
      try {
        sortedNodes = topologicalSort(relevantNodes, relevantEdges);
      } catch (e) {
        // If there's a cycle or no dependencies, just execute the single node
        sortedNodes = [node];
      }
      
      console.log('[executeFromNode] Executing nodes in order:', sortedNodes.map(n => n.id));
      
      for (const execNode of sortedNodes) {
        const inputs = getNodeInputs(execNode.id, relevantEdges, executionResults);
        
        console.log('[executeFromNode] Executing node:', execNode.id, 'type:', execNode.data.type);
        
        // Execute the node
        const result = await executeNode(execNode, {
          inputs,
          parameters: execNode.data,
        });
        
        console.log('[executeFromNode] Node result:', execNode.id, result.status);
        
        executionResults.set(execNode.id, result);
        
        // Update node status in the store - only for the target node
        if (execNode.id === nodeId) {
          set((s) => ({
            nodes: s.nodes.map((n) => 
              n.id === execNode.id 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      executionStatus: result.status === 'error' ? 'error' : 'success',
                      executionError: result.error,
                      executionResult: result.outputs,
                    } 
                  }
                : n
            ),
          }));
        }
      }
      
      console.log('[executeFromNode] Execution completed for node:', nodeId);
      
    } catch (error) {
      console.error('[executeFromNode] Execution failed:', error);
      set((s) => ({
        nodes: s.nodes.map((n) => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  executionStatus: 'error',
                  executionError: error instanceof Error ? error.message : 'Unknown error',
                } 
              }
            : n
        ),
      }));
    }
  },
  
  executeWorkflow: async () => {
    const { nodes, edges } = get();
    
    if (nodes.length === 0) {
      console.log('[executeWorkflow] No nodes to execute');
      return;
    }
    
    console.log('[executeWorkflow] Starting workflow execution with', nodes.length, 'nodes');
    
    // Mark all nodes as running
    set((s) => ({
      nodes: s.nodes.map((n) => ({ 
        ...n, 
        data: { ...n.data, executionStatus: 'running', executionError: undefined } 
      })),
    }));
    
    try {
      // Sort nodes topologically
      let sortedNodes: Node<NodeData>[];
      try {
        sortedNodes = topologicalSort(nodes, edges);
      } catch (e) {
        console.error('[executeWorkflow] Cycle detected in workflow');
        set((s) => ({
          nodes: s.nodes.map((n) => ({ 
            ...n, 
            data: { ...n.data, executionStatus: 'error', executionError: 'Cycle detected in workflow' } 
          })),
        }));
        return;
      }
      
      const executionResults = new Map<string, NodeExecutionResult>();
      
      for (const node of sortedNodes) {
        console.log('[executeWorkflow] Executing node:', node.id);
        
        const inputs = getNodeInputs(node.id, edges, executionResults);
        
        try {
          const result = await executeNode(node, {
            inputs,
            parameters: node.data,
          });
          
          executionResults.set(node.id, result);
          
          set((s) => ({
            nodes: s.nodes.map((n) => 
              n.id === node.id 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      executionStatus: result.status === 'error' ? 'error' : 'success',
                      executionError: result.error,
                      executionResult: result.outputs,
                    } 
                  }
                : n
            ),
          }));
        } catch (error) {
          set((s) => ({
            nodes: s.nodes.map((n) => 
              n.id === node.id 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      executionStatus: 'error',
                      executionError: error instanceof Error ? error.message : 'Unknown error',
                    } 
                  }
                : n
            ),
          }));
        }
      }
      
      console.log('[executeWorkflow] Workflow execution completed');
    } catch (error) {
      console.error('[executeWorkflow] Workflow execution failed:', error);
    }
  },
}),
    {
      name: 'archipedia-canvas-state',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist ReactFlow state (nodes, edges) - exclude non-serializable values
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        selectedNodes: state.selectedNodes,
      }),
    }
  )
);

// ============ API Helpers ============

export async function createCanvasBoard(title: string = 'Untitled Board'): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        layout_mode: 'canvas',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create board');
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Failed to create canvas board:', error);
    return null;
  }
}

export async function updateBoardLayoutMode(boardId: string, mode: 'grid' | 'canvas'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/boards/${boardId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layout_mode: mode,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to update layout mode:', error);
    return false;
  }
}
