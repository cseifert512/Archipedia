import { Node, Edge } from 'reactflow';
import { NodeData } from '../types/nodes';
import { cacheManager } from './CacheManager';
import { searchByImageFile, searchByText, toAbsoluteUrl } from './navigatorApi';
import { PrecedentProject } from '../types/nodes';

/**
 * Workflow Execution Engine
 * Implements DAG-based execution similar to Flora AI and Fuser Studio
 * - Topological sorting for execution order
 * - Data flow between connected nodes
 * - Parameter mapping and variable passing
 * - Intelligent caching for performance
 * - Parallel execution support
 */

export interface NodeExecutionContext {
  inputs: Record<string, any>;
  parameters: Record<string, any>;
}

export interface NodeExecutionResult {
  outputs: Record<string, any>;
  status: 'success' | 'error' | 'pending';
  error?: string;
  nodeId?: string;
  cached?: boolean;
  executionTime?: number;
}

export type NodeExecutor = (
  node: Node<NodeData>,
  context: NodeExecutionContext
) => Promise<NodeExecutionResult>;

/**
 * Topological sort to determine node execution order
 * Based on DAG (Directed Acyclic Graph) structure
 */
export function topologicalSort(
  nodes: Node<NodeData>[],
  edges: Edge[]
): Node<NodeData>[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });

  // Build graph
  edges.forEach(edge => {
    const sourceId = edge.source;
    const targetId = edge.target;

    adjacencyList.get(sourceId)?.push(targetId);
    inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1);
  });

  // Find nodes with no dependencies (in-degree = 0)
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sorted: Node<NodeData>[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      sorted.push(node);
    }

    // Reduce in-degree for neighbors
    adjacencyList.get(nodeId)?.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) {
        queue.push(neighborId);
      }
    });
  }

  // Check for cycles
  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in workflow graph');
  }

  return sorted;
}

/**
 * Get input data for a node from its connected predecessors
 */
export function getNodeInputs(
  nodeId: string,
  edges: Edge[],
  executionResults: Map<string, NodeExecutionResult>
): Record<string, any> {
  const inputs: Record<string, any> = {};

  // Find all edges that target this node
  const incomingEdges = edges.filter(edge => edge.target === nodeId);

  incomingEdges.forEach((edge, index) => {
    const sourceResult = executionResults.get(edge.source);
    if (sourceResult?.outputs) {
      // Map source outputs to target inputs
      // Use edge handle IDs if available, otherwise use index
      const inputKey = edge.targetHandle || `input_${index}`;
      const outputKey = edge.sourceHandle || 'output';

      inputs[inputKey] = sourceResult.outputs[outputKey];
    }
  });

  return inputs;
}

/**
 * Execute a single node based on its type
 */
export async function executeNode(
  node: Node<NodeData>,
  context: NodeExecutionContext,
  executor?: NodeExecutor
): Promise<NodeExecutionResult> {
  // Use custom executor if provided
  if (executor) {
    return executor(node, context);
  }

  // Default execution logic based on node type
  const { type } = node.data;

  try {
    switch (type) {
      case 'text':
        return executeTextNode(node, context);

      case 'image':
        return executeImageNode(node, context);

      case 'llm':
        return executeLLMNode(node, context);

      case 'image-gen':
        return executeImageGenNode(node, context);

      case '3d':
        return execute3DNode(node, context);

      case 'precedent':
      case 'stackedPrecedent':
        return executePrecedentNode(node, context);

      case 'overseer':
        return executeOverseerNode(node, context);

      case 'collection':
        return executeCollectionNode(node, context);

      default:
        return {
          outputs: { output: context.inputs },
          status: 'success',
        };
    }
  } catch (error) {
    return {
      outputs: {},
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute image node - uploads image and runs visual similarity search via Navigator API
 */
async function executeImageNode(
  node: Node<NodeData>,
  _context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const file: File | undefined = data.imageFile;
  const imageUrl: string | undefined = data.imageUrl;

  let uploadFile: File | undefined = file;

  // Fallback: derive a Blob from a data URL if needed
  if (!uploadFile && imageUrl && imageUrl.startsWith('data:')) {
    const blob = await fetch(imageUrl).then(r => r.blob());
    uploadFile = new File([blob], 'query.png', { type: blob.type || 'image/png' });
  }

  if (!uploadFile) {
    return {
      outputs: {},
      status: 'error',
      error: 'No image selected. Upload an image first.',
    };
  }

  // Visual-only search by default (no attr/spatial fusion)
  const topK = typeof data.topK === 'number' ? data.topK : 12;
  const resp = await searchByImageFile(uploadFile, {
    topK,
    wVisual: 1.0,
    wAttr: 0.0,
    wSpatial: 0.0,
  });

  const results = Array.isArray(resp.results) ? resp.results : [];

  const projects: PrecedentProject[] = results
    .filter(r => r && (r.project_id || r.image_id))
    .map((r) => ({
      id: String(r.project_id || r.image_id || r.faiss_id || r.rank || ''),
      title: String(r.title || r.project_id || r.image_id || 'Result'),
      thumbnail: toAbsoluteUrl(r.thumb_url) || '',
      attributes: {
        typology: r.typology ? String(r.typology) : undefined,
        climate: r.climate_bin ? String(r.climate_bin) : undefined,
        massing: r.massing_type ? String(r.massing_type) : undefined,
      },
    }));

  return {
    outputs: {
      output: results,
      results,
      projects,
      query_id: resp.query_id,
      latency_ms: resp.latency_ms,
    },
    status: 'success',
  };
}

/**
 * Execute text node - passes through or generates text
 */
async function executeTextNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const content = (node.data as any).content || '';
  const inputText = context.inputs.input || '';

  // Combine input with node content
  const output = inputText ? `${inputText}\n${content}` : content;

  const q = (output || '').trim();
  if (!q) {
    return {
      outputs: {
        output: output,
        text: output,
        results: [],
        projects: [],
      },
      status: 'success',
    };
  }

  // Treat Text node as a text-search node: call Navigator /search/text
  const topK = typeof (node.data as any).topK === 'number' ? (node.data as any).topK : 12;
  const resp: any = await searchByText(q, { topK });
  const results = Array.isArray(resp?.results) ? resp.results : [];

  const projects: PrecedentProject[] = results
    .filter((r: any) => r && (r.project_id || r.image_id))
    .map((r: any) => ({
      id: String(r.project_id || r.image_id || ''),
      title: String(r.title || r.project_id || r.image_id || 'Result'),
      thumbnail: toAbsoluteUrl(r.thumb_url) || '',
      attributes: {
        typology: r.typology ? String(r.typology) : undefined,
        climate: r.climate_bin ? String(r.climate_bin) : undefined,
        massing: r.massing_type ? String(r.massing_type) : undefined,
      },
    }));

  return {
    outputs: {
      output: output,
      text: output,
      results,
      projects,
      query_id: resp?.query_id,
      latency_ms: resp?.latency_ms,
    },
    status: 'success',
  };
}

/**
 * Execute LLM node - processes with language model
 */
async function executeLLMNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const prompt = data.prompt || '';
  const inputText = context.inputs.input || context.inputs.text || '';

  // Combine prompt with input
  const fullPrompt = inputText ? `${prompt}\n\nInput: ${inputText}` : prompt;

  // Simulate LLM processing (in real app, call actual API)
  const response = `[LLM Response to: ${fullPrompt}]`;

  return {
    outputs: {
      output: response,
      text: response,
      response: response,
    },
    status: 'success',
  };
}

/**
 * Execute image generation node
 */
async function executeImageGenNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const prompt = data.prompt || '';
  const inputPrompt = context.inputs.input || context.inputs.text || '';

  // Combine prompts
  const fullPrompt = inputPrompt ? `${inputPrompt} ${prompt}` : prompt;

  // Simulate image generation
  const imageUrl = `data:image,${encodeURIComponent(fullPrompt)}`;

  return {
    outputs: {
      output: imageUrl,
      image: imageUrl,
      prompt: fullPrompt,
    },
    status: 'success',
  };
}

/**
 * Execute 3D node
 */
async function execute3DNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const prompt = data.prompt || '';
  const inputData = context.inputs.input || '';

  return {
    outputs: {
      output: { model: 'generated', prompt: `${inputData} ${prompt}` },
      geometry: { type: 'mesh', data: {} },
    },
    status: 'success',
  };
}

/**
 * Execute precedent node - passes through project data
 */
async function executePrecedentNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const projects = data.projects || [];

  return {
    outputs: {
      output: projects,
      projects: projects,
      dna: data.extractedDNA || [],
    },
    status: 'success',
  };
}

/**
 * Execute overseer node - manages workflow orchestration
 */
async function executeOverseerNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const childTasks = data.childTasks || [];

  return {
    outputs: {
      output: childTasks,
      tasks: childTasks,
      status: data.status,
    },
    status: 'success',
  };
}

/**
 * Execute collection node - aggregates inputs
 */
async function executeCollectionNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const items = data.items || [];

  // Collect all inputs into the collection
  const allInputs = Object.values(context.inputs);

  return {
    outputs: {
      output: [...items, ...allInputs],
      collection: [...items, ...allInputs],
      count: items.length + allInputs.length,
    },
    status: 'success',
  };
}

/**
 * Execute entire workflow graph with caching and parallel execution
 */
export async function executeWorkflow(
  nodes: Node<NodeData>[],
  edges: Edge[],
  executor?: NodeExecutor,
  onNodeExecuted?: (nodeId: string, result: NodeExecutionResult) => void,
  options?: {
    useCache?: boolean;
    parallelExecution?: boolean;
  }
): Promise<Map<string, NodeExecutionResult>> {
  const useCache = options?.useCache !== false; // Default to true
  const parallelExecution = options?.parallelExecution === true; // Default to false

  // Sort nodes in execution order
  const sortedNodes = topologicalSort(nodes, edges);

  // Store execution results
  const results = new Map<string, NodeExecutionResult>();

  // Execute nodes in order (or in parallel when possible)
  if (parallelExecution) {
    // Group nodes by execution level (nodes that can run in parallel)
    const executionLevels: Node<NodeData>[][] = [];
    const executed = new Set<string>();

    for (const node of sortedNodes) {
      const level = getExecutionLevel(node.id, edges, executed);
      if (!executionLevels[level]) {
        executionLevels[level] = [];
      }
      executionLevels[level].push(node);
      executed.add(node.id);
    }

    // Execute each level in parallel
    for (const level of executionLevels) {
      await Promise.all(
        level.map(async (node) => {
          const inputs = getNodeInputs(node.id, edges, results);
          const parameters = node.data;

          // Check cache first
          if (useCache) {
            const cached = cacheManager.get(node, inputs);
            if (cached) {
              const cachedResult = { ...cached, cached: true, nodeId: node.id };
              results.set(node.id, cachedResult);
              if (onNodeExecuted) {
                onNodeExecuted(node.id, cachedResult);
              }
              return;
            }
          }

          // Execute node
          const startTime = Date.now();
          const result = await executeNode(node, { inputs, parameters }, executor);
          const executionTime = Date.now() - startTime;

          const finalResult = {
            ...result,
            nodeId: node.id,
            cached: false,
            executionTime,
          };

          // Store in cache
          if (useCache && result.status === 'success') {
            cacheManager.set(node, inputs, finalResult);
          }

          results.set(node.id, finalResult);

          if (onNodeExecuted) {
            onNodeExecuted(node.id, finalResult);
          }
        })
      );
    }
  } else {
    // Sequential execution with caching
    for (const node of sortedNodes) {
      // Get inputs from predecessor nodes
      const inputs = getNodeInputs(node.id, edges, results);

      // Check cache first
      if (useCache) {
        const cached = cacheManager.get(node, inputs);
        if (cached) {
          const cachedResult = { ...cached, cached: true, nodeId: node.id };
          results.set(node.id, cachedResult);
          if (onNodeExecuted) {
            onNodeExecuted(node.id, cachedResult);
          }
          continue;
        }
      }

      // Get node parameters
      const parameters = node.data;

      // Execute node
      const startTime = Date.now();
      const result = await executeNode(node, { inputs, parameters }, executor);
      const executionTime = Date.now() - startTime;

      const finalResult = {
        ...result,
        nodeId: node.id,
        cached: false,
        executionTime,
      };

      // Store in cache
      if (useCache && result.status === 'success') {
        cacheManager.set(node, inputs, finalResult);
      }

      // Store result
      results.set(node.id, finalResult);

      // Notify callback
      if (onNodeExecuted) {
        onNodeExecuted(node.id, finalResult);
      }
    }
  }

  return results;
}

/**
 * Get execution level for parallel execution
 */
function getExecutionLevel(
  nodeId: string,
  edges: Edge[],
  executed: Set<string>
): number {
  const incomingEdges = edges.filter(e => e.target === nodeId);
  
  if (incomingEdges.length === 0) {
    return 0;
  }

  // Find maximum level of dependencies
  let maxLevel = -1;
  for (const edge of incomingEdges) {
    // For simplicity, we'll use a simple approach
    // In a more sophisticated implementation, we'd track levels properly
    maxLevel = Math.max(maxLevel, 0);
  }

  return maxLevel + 1;
}

/**
 * Get node dependencies (predecessors)
 */
export function getNodeDependencies(
  nodeId: string,
  edges: Edge[]
): string[] {
  return edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);
}

/**
 * Get node dependents (successors)
 */
export function getNodeDependents(
  nodeId: string,
  edges: Edge[]
): string[] {
  return edges
    .filter(edge => edge.source === nodeId)
    .map(edge => edge.target);
}

/**
 * Validate workflow graph for cycles
 */
export function validateWorkflow(
  nodes: Node<NodeData>[],
  edges: Edge[]
): { valid: boolean; error?: string } {
  try {
    topologicalSort(nodes, edges);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid workflow',
    };
  }
}
