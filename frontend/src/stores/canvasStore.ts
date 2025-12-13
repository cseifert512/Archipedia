import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { NodeData, NodeType } from '../types/nodes';
import { executeWorkflow, NodeExecutionResult, validateWorkflow } from '../lib/workflowEngine';
import { validateWorkflowEdges, canCreateEdge } from '../lib/DataFlowValidator';
import { useExecutionStore } from './executionStore';
import { createNode, createPrecedentNode } from '../lib/nodeFactory';

interface CanvasState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodes: string[];
  isExecuting: boolean;
  executionResults: Map<string, NodeExecutionResult>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<NodeData>) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string) => void;
  deselectNode: (id: string) => void;
  clearSelection: () => void;
  addNodes: (nodes: Node<NodeData>[]) => void;
  addEdges: (edges: Edge[]) => void;
  executeWorkflow: () => Promise<void>;
  executeFromNode: (nodeId: string) => Promise<void>;
  clearExecutionResults: () => void;
  duplicateNode: (nodeId: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodes: [],
  isExecuting: false,
  executionResults: new Map(),

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });

    // Validate workflow after connection
    const { nodes, edges } = get();
    const validation = validateWorkflow(nodes, [...edges, addEdge(connection, edges)[edges.length]]);
    if (!validation.valid) {
      console.error('Invalid workflow:', validation.error);
    }
  },

  addNode: (node: Node<NodeData>) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  updateNode: (id: string, data: Partial<NodeData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },

  selectNode: (id: string) => {
    const selected = get().selectedNodes;
    if (!selected.includes(id)) {
      set({ selectedNodes: [...selected, id] });
    }
  },

  deselectNode: (id: string) => {
    set({
      selectedNodes: get().selectedNodes.filter((nid) => nid !== id),
    });
  },

  clearSelection: () => {
    set({ selectedNodes: [] });
  },

  addNodes: (nodes: Node<NodeData>[]) => {
    set({
      nodes: [...get().nodes, ...nodes],
    });
  },

  addEdges: (edges: Edge[]) => {
    set({
      edges: [...get().edges, ...edges],
    });
  },

  executeWorkflow: async () => {
    const { nodes, edges } = get();
    const executionStore = useExecutionStore.getState();

    if (nodes.length === 0) {
      console.warn('No nodes to execute');
      return;
    }

    // Validate workflow first
    const validation = validateWorkflow(nodes, edges);
    if (!validation.valid) {
      console.error('Cannot execute invalid workflow:', validation.error);
      executionStore.failExecution(validation.error || 'Invalid workflow');
      return;
    }

    // Validate edges
    const edgeValidation = validateWorkflowEdges(nodes, edges);
    if (!edgeValidation.valid) {
      console.error('Edge validation failed:', edgeValidation.errors);
      const errorMsg = edgeValidation.errors.map(e => e.message).join('; ');
      executionStore.failExecution(errorMsg);
      return;
    }

    set({ isExecuting: true });
    executionStore.startExecution(nodes.length);

    try {
      let step = 0;
      // Execute workflow with caching enabled
      const results = await executeWorkflow(
        nodes,
        edges,
        undefined,
        (nodeId, result) => {
          step++;
          executionStore.updateProgress(step, nodeId);
          
          // Update node status during execution
          get().updateNode(nodeId, {
            executionStatus: result.status === 'success' ? 'success' :
                           result.status === 'error' ? 'error' : 'running',
            executionResult: result.outputs,
            executionError: result.error,
            cached: result.cached,
          });

          // Log execution
          executionStore.logExecution(nodeId, result, result.executionTime || 0);
        },
        {
          useCache: true,
          parallelExecution: false, // Can be enabled for better performance
        }
      );

      set({ executionResults: results });
      executionStore.completeExecution();
    } catch (error) {
      console.error('Workflow execution failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      executionStore.failExecution(errorMsg);
    } finally {
      set({ isExecuting: false });
    }
  },

  executeFromNode: async (nodeId: string) => {
    const { nodes, edges } = get();

    // Find all nodes downstream from the specified node
    const downstreamNodes = new Set<string>([nodeId]);
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const dependents = edges
        .filter(e => e.source === currentId)
        .map(e => e.target);

      dependents.forEach(dep => {
        if (!downstreamNodes.has(dep)) {
          downstreamNodes.add(dep);
          queue.push(dep);
        }
      });
    }

    // Filter nodes to execute
    const nodesToExecute = nodes.filter(n => downstreamNodes.has(n.id));
    const edgesToUse = edges.filter(e =>
      downstreamNodes.has(e.source) && downstreamNodes.has(e.target)
    );

    // Mark the starting node as running immediately so the UI reacts even if the executor fails early.
    get().updateNode(nodeId, { executionStatus: 'running', executionError: undefined });
    set({ isExecuting: true });

    try {
      await executeWorkflow(
        nodesToExecute,
        edgesToUse,
        undefined,
        (nodeId, result) => {
          // Always store execution metadata on the node so UI can reflect failures too.
          get().updateNode(nodeId, {
            executionStatus: result.status === 'success' ? 'success' :
                           result.status === 'error' ? 'error' : 'running',
            executionResult: result.outputs,
            executionError: result.error,
          });

          // Special-case: when an Image node returns projects, spawn a Precedent node once per query_id.
          const thisNode = get().nodes.find(n => n.id === nodeId);
          if (thisNode?.data?.type === 'image' && result.status === 'success') {
            const projects = (result.outputs as any)?.projects;
            const queryId = (result.outputs as any)?.query_id;
            const alreadySpawned = (thisNode.data as any).lastSpawnQueryId && (thisNode.data as any).lastSpawnQueryId === queryId;
            if (Array.isArray(projects) && projects.length > 0 && queryId && !alreadySpawned) {
              const pos = thisNode.position || { x: 0, y: 0 };
              const newNode = createPrecedentNode({ x: pos.x + 340, y: pos.y }, projects);
              get().addNodes([newNode]);
              get().updateNode(nodeId, { lastSpawnQueryId: queryId });
            }
          }
        }
      );
    } catch (error) {
      console.error('Node execution failed:', error);
    } finally {
      set({ isExecuting: false });
    }
  },

  clearExecutionResults: () => {
    const { nodes } = get();

    // Clear execution status from all nodes
    set({
      nodes: nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          executionStatus: 'idle',
          executionResult: undefined,
          cached: undefined,
        },
      })),
      executionResults: new Map(),
    });

    // Clear execution store
    useExecutionStore.getState().clearExecution();
  },

  duplicateNode: (nodeId: string) => {
    const { nodes } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Create duplicate with new ID and offset position
    const duplicate = createNode(
      node.data.type,
      { x: node.position.x + 320, y: node.position.y },
      {
        ...node.data,
        label: `${node.data.label} (Copy)`,
      }
    );

    set({
      nodes: [...nodes, duplicate],
    });
  },
}));

