import { Node, Edge } from 'reactflow';
import { NodeData } from '../types/nodes';
import { cacheManager } from './CacheManager';
import { searchByImageFile, searchByText, toAbsoluteUrl } from './navigatorApi';
import { PrecedentProject } from '../types/nodes';
import { generateConcept, validateConceptFile, extractStyle } from './generateApi';
import { createImageNode } from './nodeFactory';
import { useCanvasStore } from '../stores/canvasStore';

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
      
      // Also pass through results and projects if they exist (for ResultsNode consumption)
      if (sourceResult.outputs.results && !inputs.results) {
        inputs.results = sourceResult.outputs.results;
      }
      if (sourceResult.outputs.projects && !inputs.projects) {
        inputs.projects = sourceResult.outputs.projects;
      }
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

      case 'operatorAND':
        return executeOperatorANDNode(node, context);

      case 'results':
        return executeResultsNode(node, context);

      case 'generate':
        return executeGenerateNode(node, context);

      case 'validate':
        return executeValidateNode(node, context);

      case 'styleReference':
        return executeStyleReferenceNode(node, context);

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
  console.log('[DEBUG executeTextNode] content:', content, 'q:', q);
  if (!q) {
    console.log('[DEBUG executeTextNode] Empty query, returning early');
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
  console.log('[DEBUG executeTextNode] Calling searchByText with q:', q);
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
 * Execute operator AND node - combines/intersects results from multiple inputs
 */
async function executeOperatorANDNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const logic = data.logic || 'weightedSum';
  const inputData = data.inputData || [];

  // Get all input results from connected nodes
  const allInputs = Object.entries(context.inputs);

  if (allInputs.length === 0) {
    return {
      outputs: { output: [], results: [] },
      status: 'error',
      error: 'No inputs connected. Connect search nodes to combine results.',
    };
  }

  // Extract results arrays from each input
  const inputResultSets: Array<{ weight: number; results: any[] }> = [];

  for (let i = 0; i < allInputs.length; i++) {
    const [, inputValue] = allInputs[i];
    const weight = inputData[i]?.weight || (100 / allInputs.length);

    // Handle different input formats
    let results: any[] = [];
    if (Array.isArray(inputValue)) {
      results = inputValue;
    } else if (inputValue?.results && Array.isArray(inputValue.results)) {
      results = inputValue.results;
    } else if (inputValue?.output && Array.isArray(inputValue.output)) {
      results = inputValue.output;
    }

    inputResultSets.push({ weight, results });
  }

  // Build a map of project_id -> aggregated score data
  const projectScores = new Map<string, { 
    project: any; 
    scores: number[]; 
    weights: number[];
    count: number;
  }>();

  for (const { weight, results } of inputResultSets) {
    for (const result of results) {
      const projectId = result.project_id || result.id || result.image_id;
      if (!projectId) continue;

      const score = result.score ?? result.similarity ?? (1 - (result.distance || 0));

      if (projectScores.has(projectId)) {
        const existing = projectScores.get(projectId)!;
        existing.scores.push(score);
        existing.weights.push(weight);
        existing.count++;
      } else {
        projectScores.set(projectId, {
          project: result,
          scores: [score],
          weights: [weight],
          count: 1,
        });
      }
    }
  }

  // Calculate combined scores based on logic
  const combinedResults: any[] = [];
  const totalInputs = inputResultSets.length;

  for (const [projectId, data] of projectScores.entries()) {
    // For AND logic, only include projects that appear in ALL inputs
    if (data.count < totalInputs) continue;

    let combinedScore: number;

    if (logic === 'product') {
      // Product of all scores
      combinedScore = data.scores.reduce((acc, s) => acc * s, 1);
    } else {
      // Weighted sum (default)
      const totalWeight = data.weights.reduce((a, b) => a + b, 0);
      combinedScore = data.scores.reduce((acc, s, i) => {
        return acc + (s * (data.weights[i] / totalWeight));
      }, 0);
    }

    combinedResults.push({
      ...data.project,
      project_id: projectId,
      score: combinedScore,
      combined_from: data.count,
    });
  }

  // Sort by combined score descending
  combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));

  return {
    outputs: {
      output: combinedResults,
      results: combinedResults,
      count: combinedResults.length,
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
 * Execute results node - passes through and aggregates results from upstream nodes
 */
async function executeResultsNode(
  _node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  // Collect all results and projects from upstream nodes
  const allResults: any[] = [];
  const allProjects: PrecedentProject[] = [];
  
  // Process all inputs (from connected upstream nodes)
  for (const inputKey of Object.keys(context.inputs)) {
    const input = context.inputs[inputKey];
    
    // Handle direct results arrays
    if (Array.isArray(input)) {
      allResults.push(...input);
    }
    // Handle objects with results/projects properties
    else if (input && typeof input === 'object') {
      if (input.results && Array.isArray(input.results)) {
        allResults.push(...input.results);
      }
      if (input.projects && Array.isArray(input.projects)) {
        allProjects.push(...input.projects);
      }
    }
  }
  
  // Also check for direct results/projects in inputs (from edge connections)
  if (context.inputs.results && Array.isArray(context.inputs.results)) {
    allResults.push(...context.inputs.results);
  }
  if (context.inputs.projects && Array.isArray(context.inputs.projects)) {
    allProjects.push(...context.inputs.projects);
  }
  
  // Deduplicate by id
  const uniqueResults = allResults.filter((r, i, arr) => 
    arr.findIndex(x => (x.project_id || x.id) === (r.project_id || r.id)) === i
  );
  const uniqueProjects = allProjects.filter((p, i, arr) => 
    arr.findIndex(x => x.id === p.id) === i
  );
  
  return {
    outputs: {
      output: uniqueProjects,
      results: uniqueResults,
      projects: uniqueProjects,
      count: uniqueProjects.length || uniqueResults.length,
    },
    status: 'success',
  };
}

/**
 * Execute generate node - creates AI concept images
 * After successful generation, auto-spawns a blue ImageNode with the generated image
 */
async function executeGenerateNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const prompt = data.prompt || '';
  const style = data.style || 'render';
  const variationCount = data.variationCount || 4;
  
  // Get style reference from input if connected
  let styleReferenceDescription = data.styleReferenceDescription;
  if (context.inputs['style-input'] && typeof context.inputs['style-input'] === 'object') {
    styleReferenceDescription = context.inputs['style-input'].styleDescription || styleReferenceDescription;
  }

  if (!prompt.trim()) {
    return {
      outputs: {},
      status: 'error',
      error: 'Please enter a prompt to generate concepts.',
    };
  }

  try {
    const response = await generateConcept({
      prompt,
      style,
      variations: variationCount,
      styleReferenceDescription,
    });

    // Auto-spawn a blue ImageNode with the first generated image
    const firstImage = response.images[0];
    if (firstImage && firstImage.url) {
      // Position the ImageNode to the right of the GenerateNode
      const imageNodePosition = {
        x: node.position.x + 400,
        y: node.position.y,
      };
      
      const imageNode = createImageNode(imageNodePosition, firstImage.url);
      
      // Add the ImageNode to the canvas
      const { addNodes, addEdges } = useCanvasStore.getState();
      addNodes([imageNode]);
      
      // Create an edge connecting the GenerateNode output to the ImageNode input
      const edge = {
        id: `edge-${node.id}-${imageNode.id}`,
        source: node.id,
        sourceHandle: 'image-output',
        target: imageNode.id,
        targetHandle: 'input',
      };
      
      // Add the edge after a brief delay to ensure the node is added
      setTimeout(() => {
        addEdges([edge]);
      }, 50);
    }

    return {
      outputs: {
        output: response.images,
        images: response.images,
        selectedImage: response.images[0],
        searchReady: response.search_ready,
      },
      status: 'success',
    };
  } catch (error) {
    return {
      outputs: {},
      status: 'error',
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Execute validate node - finds real projects similar to input
 */
async function executeValidateNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const topK = data.topK || 5;
  const minSimilarity = data.minSimilarity || 0.5;
  
  // Get image from input connection
  let imageUrl = data.inputImageUrl;
  let imageFile: File | undefined;
  
  // Check for image from connected generate node or image node
  const imageInput = context.inputs['image-input'] || context.inputs.input;
  if (imageInput) {
    if (typeof imageInput === 'string') {
      imageUrl = imageInput;
    } else if (imageInput.selectedImage?.url) {
      imageUrl = imageInput.selectedImage.url;
    } else if (imageInput.images?.[0]?.url) {
      imageUrl = imageInput.images[0].url;
    } else if (imageInput.imageUrl) {
      imageUrl = imageInput.imageUrl;
    } else if (imageInput instanceof File) {
      imageFile = imageInput;
    }
  }

  if (!imageUrl && !imageFile) {
    return {
      outputs: {},
      status: 'error',
      error: 'Connect an image input to validate against real projects.',
    };
  }

  try {
    // For file-based validation, we need to create a File from a data URL
    if (imageUrl && imageUrl.startsWith('data:')) {
      const blob = await fetch(imageUrl).then(r => r.blob());
      imageFile = new File([blob], 'concept.png', { type: blob.type || 'image/png' });
    }

    if (imageFile) {
      const response = await validateConceptFile(imageFile, topK, minSimilarity);
      
      return {
        outputs: {
          output: response.similar_projects,
          validatedProjects: response.similar_projects,
          validationScore: response.validation_score,
          projects: response.similar_projects.map(p => ({
            id: p.project_id,
            title: p.title || p.project_id,
            thumbnail: p.thumb_url || '',
            attributes: {
              typology: p.typology,
              country: p.country,
            },
          })),
        },
        status: 'success',
      };
    }

    // URL-based validation would need a different endpoint
    return {
      outputs: {},
      status: 'error',
      error: 'Image validation requires a file upload. Connect an image node.',
    };
  } catch (error) {
    return {
      outputs: {},
      status: 'error',
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Execute style reference node - extracts style description from image
 */
async function executeStyleReferenceNode(
  node: Node<NodeData>,
  context: NodeExecutionContext
): Promise<NodeExecutionResult> {
  const data = node.data as any;
  const imageUrl = data.imageUrl;

  if (!imageUrl) {
    return {
      outputs: {},
      status: 'error',
      error: 'Upload a reference image to extract style.',
    };
  }

  try {
    const response = await extractStyle(imageUrl);

    if (!response.success) {
      return {
        outputs: {},
        status: 'error',
        error: 'Failed to extract style from image.',
      };
    }

    return {
      outputs: {
        output: response.description,
        styleDescription: response.description,
        materials: response.materials,
        palette: response.palette,
        massingDescription: response.massing_description,
      },
      status: 'success',
    };
  } catch (error) {
    return {
      outputs: {},
      status: 'error',
      error: error instanceof Error ? error.message : 'Style extraction failed',
    };
  }
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
    initialResults?: Map<string, NodeExecutionResult>;
  }
): Promise<Map<string, NodeExecutionResult>> {
  const useCache = options?.useCache !== false; // Default to true
  const parallelExecution = options?.parallelExecution === true; // Default to false

  // Sort nodes in execution order
  const sortedNodes = topologicalSort(nodes, edges);

  // Store execution results - start with any pre-seeded results from upstream nodes
  const results = new Map<string, NodeExecutionResult>(options?.initialResults || []);

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
