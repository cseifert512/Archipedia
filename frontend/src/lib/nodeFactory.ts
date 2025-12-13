import { Node } from 'reactflow';
import { NodeData, NodeType, PrecedentProject } from '../types/nodes';

export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  data: Partial<NodeData> = {}
): Node<NodeData> {
  const baseData: any = {
    id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    label: data.label || type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  };

  // Map node types to ReactFlow node types
  const reactFlowType = 
    type === 'precedent' ? 'precedent' :
    type === 'image' ? 'image' :
    type === 'attributeFilter' ? 'attributeFilter' :
    type === 'scalar' ? 'scalar' :
    type === 'operatorAND' ? 'operatorAND' :
    type === 'operatorOR' ? 'operatorOR' :
    type === 'operatorNOT' ? 'operatorNOT' :
    type === 'text' ? 'text' :
    'default';

  return {
    id: baseData.id,
    type: reactFlowType,
    position,
    data: baseData,
  };
}

export function createPrecedentNode(
  position: { x: number; y: number },
  projects: PrecedentProject[]
): Node<NodeData> {
  return createNode('precedent', position, {
    type: 'precedent',
    projects,
    isStacked: projects.length > 1,
    expanded: false,
  });
}

export function createTextNode(
  position: { x: number; y: number },
  content: string = ''
): Node<NodeData> {
  return createNode('text', position, {
    type: 'text',
    content,
  });
}

export function createImageNode(
  position: { x: number; y: number },
  imageUrl?: string
): Node<NodeData> {
  return createNode('image', position, {
    type: 'image',
    imageUrl,
  });
}



export function createAttributeFilterNode(
  position: { x: number; y: number }
): Node<NodeData> {
  return createNode('attributeFilter', position, {
    type: 'attributeFilter',
    weights: {
      visual: 40,
      spatial: 10,
      regional: 50,
    },
    attributeFilters: [],
    inputResults: [],
    outputResults: [],
  });
}

export function createScalarNode(
  position: { x: number; y: number }
): Node<NodeData> {
  return createNode('scalar', position, {
    type: 'scalar',
    constraints: [],
    inputResults: [],
    matchingCount: 0,
    outputResults: [],
  });
}

export function createOperatorANDNode(
  position: { x: number; y: number }
): Node<NodeData> {
  return createNode('operatorAND', position, {
    type: 'operatorAND',
    inputData: [
      { nodeId: 'input-a', weight: 60, results: [] },
      { nodeId: 'input-b', weight: 40, results: [] },
    ],
    logic: 'weightedSum',
    outputResults: [],
  });
}

export function createOperatorORNode(
  position: { x: number; y: number }
): Node<NodeData> {
  return createNode('operatorOR', position, {
    type: 'operatorOR',
    inputData: [
      { nodeId: 'input-a', results: [] },
      { nodeId: 'input-b', results: [] },
    ],
    logic: 'hardMax',
    outputResults: [],
  });
}

export function createOperatorNOTNode(
  position: { x: number; y: number }
): Node<NodeData> {
  return createNode('operatorNOT', position, {
    type: 'operatorNOT',
    includeInput: { nodeId: 'input-a', results: [] },
    excludeInput: { nodeId: 'input-b', results: [] },
    exclusionStrategy: 'mask',
    similarityThreshold: 0.70,
    outputResults: [],
  });
}

