/**
 * Node Registry
 * Centralized definition of all node types, their ports, parameters, and metadata
 */

import { NodeData, NodeType, NodePort } from '../types/nodes';

export interface NodeParameter {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'slider' | 'boolean' | 'color';
  defaultValue: any;
  options?: string[] | { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  description: string;
  color: string;
  icon?: string;
  inputs: NodePort[];
  outputs: NodePort[];
  parameters: NodeParameter[];
  category: 'search' | 'generate' | 'analyze' | 'organize' | 'control';
}

/**
 * Node Registry - defines all available node types
 */
export const NODE_REGISTRY: Record<NodeType, NodeTypeDefinition> = {
  precedent: {
    type: 'precedent',
    label: 'Precedent Search',
    description: 'Search for architectural precedents matching criteria',
    color: '#64B5FF', // Blue
    category: 'search',
    inputs: [
      { id: 'query', label: 'Query', type: 'text' },
      { id: 'filters', label: 'Filters', type: 'data' },
    ],
    outputs: [
      { id: 'results', label: 'Results', type: 'data' },
      { id: 'projects', label: 'Projects', type: 'data' },
    ],
    parameters: [
      {
        id: 'query',
        label: 'Search Query',
        type: 'text',
        defaultValue: '',
        description: 'Text query to search for precedents',
      },
      {
        id: 'limit',
        label: 'Result Limit',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 100,
        description: 'Maximum number of results to return',
      },
      {
        id: 'filterTags',
        label: 'Filter Tags',
        type: 'multiselect',
        defaultValue: [],
        options: ['cultural', 'educational', 'residential', 'commercial', 'hot climate', 'cold climate'],
        description: 'Filter results by tags',
      },
    ],
  },

  stackedPrecedent: {
    type: 'stackedPrecedent',
    label: 'Stacked Precedent',
    description: 'Multiple precedents stacked for comparison',
    color: '#64B5FF',
    category: 'search',
    inputs: [
      { id: 'precedents', label: 'Precedents', type: 'data' },
    ],
    outputs: [
      { id: 'stack', label: 'Stack', type: 'data' },
      { id: 'dna', label: 'DNA', type: 'data' },
    ],
    parameters: [
      {
        id: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Precedent Stack',
      },
    ],
  },

  text: {
    type: 'text',
    label: 'Text',
    description: 'Text input or prompt node',
    color: '#F5F1E8',
    category: 'generate',
    inputs: [
      { id: 'input', label: 'Input', type: 'text' },
    ],
    outputs: [
      { id: 'output', label: 'Output', type: 'text' },
      { id: 'text', label: 'Text', type: 'text' },
    ],
    parameters: [
      {
        id: 'content',
        label: 'Content',
        type: 'text',
        defaultValue: '',
        description: 'Text content',
      },
    ],
  },

  image: {
    type: 'image',
    label: 'Image (Visual Search)',
    description: 'Upload an image and run visual similarity search against the FAISS index',
    color: '#64B5FF',
    category: 'search',
    inputs: [],
    outputs: [
      { id: 'results', label: 'Raw Results', type: 'data' },
      { id: 'projects', label: 'Projects', type: 'data' },
    ],
    parameters: [
      {
        id: 'topK',
        label: 'Top K',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 100,
        description: 'How many matches to return',
      },
    ],
  },

  '3d': {
    type: '3d',
    label: '3D Model',
    description: 'Generate or load 3D models',
    color: '#90A4AE',
    category: 'generate',
    inputs: [
      { id: 'input', label: 'Input', type: 'text' },
      { id: 'prompt', label: 'Prompt', type: 'text' },
    ],
    outputs: [
      { id: 'output', label: 'Model', type: '3d' },
      { id: 'geometry', label: 'Geometry', type: 'data' },
    ],
    parameters: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        defaultValue: '',
        description: 'Description of the 3D model to generate',
      },
      {
        id: 'model',
        label: 'Model Type',
        type: 'select',
        defaultValue: 'mesh',
        options: ['mesh', 'point-cloud', 'voxel'],
      },
    ],
  },

  'image-gen': {
    type: 'image-gen',
    label: 'Image Generation',
    description: 'Generate images using AI models',
    color: '#FF6B6B', // Red/Pink
    category: 'generate',
    inputs: [
      { id: 'input', label: 'Input', type: 'text' },
      { id: 'prompt', label: 'Prompt', type: 'text' },
      { id: 'projects', label: 'Projects', type: 'data' },
    ],
    outputs: [
      { id: 'output', label: 'Images', type: 'image' },
      { id: 'image', label: 'Image', type: 'image' },
      { id: 'prompt', label: 'Prompt', type: 'text' },
    ],
    parameters: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        defaultValue: '',
        description: 'Image generation prompt',
      },
      {
        id: 'model',
        label: 'Model',
        type: 'select',
        defaultValue: 'midjourney',
        options: ['midjourney', 'dall-e', 'stable-diffusion', 'claude-vision'],
        description: 'AI model to use for generation',
      },
      {
        id: 'style',
        label: 'Style',
        type: 'select',
        defaultValue: 'photorealistic',
        options: ['photorealistic', 'sketch', 'architectural-drawing', 'watercolor'],
      },
      {
        id: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        defaultValue: '16:9',
        options: ['16:9', '4:3', '1:1', '9:16'],
      },
      {
        id: 'seed',
        label: 'Seed',
        type: 'number',
        defaultValue: -1,
        description: 'Random seed for reproducibility (-1 for random)',
      },
    ],
  },

  llm: {
    type: 'llm',
    label: 'LLM Analysis',
    description: 'Process text with language models',
    color: '#32C864', // Green
    category: 'analyze',
    inputs: [
      { id: 'input', label: 'Input', type: 'text' },
      { id: 'text', label: 'Text', type: 'text' },
    ],
    outputs: [
      { id: 'output', label: 'Response', type: 'text' },
      { id: 'text', label: 'Text', type: 'text' },
      { id: 'response', label: 'Response', type: 'text' },
    ],
    parameters: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        defaultValue: '',
        description: 'System prompt for the LLM',
      },
      {
        id: 'model',
        label: 'Model',
        type: 'select',
        defaultValue: 'claude-3',
        options: ['claude-3', 'gpt-4', 'gpt-3.5'],
        description: 'Language model to use',
      },
    ],
  },

  overseer: {
    type: 'overseer',
    label: 'Overseer',
    description: 'Orchestrate batch operations and parallel workflows',
    color: '#FFC800', // Yellow
    category: 'control',
    inputs: [
      { id: 'config', label: 'Config', type: 'data' },
    ],
    outputs: [
      { id: 'output', label: 'Results', type: 'data' },
      { id: 'tasks', label: 'Tasks', type: 'data' },
      { id: 'status', label: 'Status', type: 'data' },
    ],
    parameters: [
      {
        id: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Overseer Task',
      },
      {
        id: 'iterations',
        label: 'Iterations',
        type: 'number',
        defaultValue: 5,
        min: 1,
        max: 50,
        description: 'Number of variations to generate',
      },
      {
        id: 'batchSize',
        label: 'Batch Size',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        description: 'Number of parallel operations',
      },
      {
        id: 'approvalThreshold',
        label: 'Approval Threshold',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'Minimum quality score to continue',
      },
    ],
  },

  collection: {
    type: 'collection',
    label: 'Collection',
    description: 'Organize and aggregate multiple items',
    color: '#9D7BE8', // Purple
    category: 'organize',
    inputs: [
      { id: 'items', label: 'Items', type: 'any' },
    ],
    outputs: [
      { id: 'output', label: 'Collection', type: 'data' },
      { id: 'collection', label: 'Collection', type: 'data' },
      { id: 'count', label: 'Count', type: 'data' },
    ],
    parameters: [
      {
        id: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Collection',
      },
      {
        id: 'layout',
        label: 'Layout',
        type: 'select',
        defaultValue: 'grid',
        options: ['grid', 'timeline', 'comparison'],
        description: 'How to organize the collection',
      },
    ],
  },
};

/**
 * Get node type definition
 */
export function getNodeTypeDefinition(type: NodeType): NodeTypeDefinition {
  return NODE_REGISTRY[type];
}

/**
 * Get all node types by category
 */
export function getNodeTypesByCategory(category: NodeTypeDefinition['category']): NodeTypeDefinition[] {
  return Object.values(NODE_REGISTRY).filter(def => def.category === category);
}

/**
 * Get input port definition
 */
export function getInputPort(nodeType: NodeType, portId: string): NodePort | undefined {
  const definition = NODE_REGISTRY[nodeType];
  return definition.inputs.find(input => input.id === portId);
}

/**
 * Get output port definition
 */
export function getOutputPort(nodeType: NodeType, portId: string): NodePort | undefined {
  const definition = NODE_REGISTRY[nodeType];
  return definition.outputs.find(output => output.id === portId);
}

/**
 * Check if two ports are compatible for connection
 */
export function arePortsCompatible(
  sourceType: NodeType,
  sourcePortId: string,
  targetType: NodeType,
  targetPortId: string
): boolean {
  const sourcePort = getOutputPort(sourceType, sourcePortId);
  const targetPort = getInputPort(targetType, targetPortId);

  if (!sourcePort || !targetPort) {
    return false;
  }

  // 'any' type accepts anything
  if (targetPort.type === 'any' || sourcePort.type === 'any') {
    return true;
  }

  // Exact match
  if (sourcePort.type === targetPort.type) {
    return true;
  }

  // 'data' type accepts most types
  if (targetPort.type === 'data' && sourcePort.type !== 'text' && sourcePort.type !== 'image') {
    return true;
  }

  return false;
}


