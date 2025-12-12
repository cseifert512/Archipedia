// Type definitions for node-based canvas system

export type NodeType = 
  | 'precedent' 
  | 'stackedPrecedent'
  | 'text' 
  | 'image'
  | 'image-gen' 
  | 'llm' 
  | 'collection'
  | 'attributeFilter'
  | 'scalar'
  | 'operatorAND'
  | 'operatorOR'
  | 'operatorNOT';

export interface PrecedentProject {
  id: string;
  title: string;
  thumbnail: string;
  attributes: {
    circulation?: string;
    materiality?: string;
    climate?: string;
    [key: string]: string | undefined;
  };
}

export interface NodePort {
  id: string;
  label: string;
  type: 'text' | 'image' | 'video' | 'audio' | '3d' | 'data' | 'any';
}

export interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  selected?: boolean;
  inputs?: NodePort[];
  outputs?: NodePort[];
  executionStatus?: 'idle' | 'running' | 'success' | 'error';
  executionResult?: any;
  [key: string]: any;
}

export interface PrecedentNodeData extends BaseNodeData {
  type: 'precedent';
  projects: PrecedentProject[];
  isStacked?: boolean;
  expanded?: boolean;
}

export interface StackedPrecedentNodeData extends BaseNodeData {
  type: 'stackedPrecedent';
  title: string;
  projects: PrecedentProject[];
  extractedDNA?: string[];
  expanded?: boolean;
}

export interface CollectionNodeData extends BaseNodeData {
  type: 'collection';
  title: string;
  childNodeIds: string[];
  items: Array<{
    id: string;
    type: string;
    data: any;
  }>;
}

export interface TextNodeData extends BaseNodeData {
  type: 'text';
  content: string;
  prompt?: string;
  model?: string;
}

export interface ImageNodeData extends BaseNodeData {
  type: 'image';
  imageUrl?: string;
  imageFile?: File;
}

export interface ImageGenNodeData extends BaseNodeData {
  type: 'image-gen';
  prompt?: string;
  model?: string;
  status?: 'idle' | 'generating' | 'complete';
}

export interface LLMNodeData extends BaseNodeData {
  type: 'llm';
  model?: string;
  prompt?: string;
  response?: string;
  status?: 'idle' | 'processing' | 'complete';
}

export interface ChildTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'blocked' | 'awaiting_input';
  requiresHumanInput: boolean;
  type?: 'batch' | 'human_gate' | 'single';
  progress?: number;
  childCount?: number;
  dependsOn?: string[];
  options?: {
    minSelect?: number;
    maxSelect?: number;
    sourceNodeIds?: string[];
  };
}


export interface AttributeFilterNodeData extends BaseNodeData {
  type: 'attributeFilter';
  weights: {
    visual: number;
    spatial: number;
    regional: number;
  };
  attributeFilters: Array<{ key: string; values: string[] }>;
  inputResults?: any[];
  outputResults?: any[];
}

export interface ScalarConstraint {
  name: string;
  min: number;
  max: number;
  unit: string;
  key: string;
}

export interface ScalarNodeData extends BaseNodeData {
  type: 'scalar';
  constraints: ScalarConstraint[];
  inputResults?: any[];
  matchingCount?: number;
  outputResults?: any[];
}

export interface OperatorANDNodeData extends BaseNodeData {
  type: 'operatorAND';
  inputs?: NodePort[];
  inputData?: Array<{ nodeId: string; weight: number; results?: any[] }>;
  logic: 'weightedSum' | 'product';
  outputResults?: any[];
}

export interface OperatorORNodeData extends BaseNodeData {
  type: 'operatorOR';
  inputs?: NodePort[];
  inputData?: Array<{ nodeId: string; results?: any[] }>;
  logic: 'hardMax' | 'softmax';
  outputResults?: any[];
}

export interface OperatorNOTNodeData extends BaseNodeData {
  type: 'operatorNOT';
  includeInput?: { nodeId: string; results?: any[] };
  excludeInput?: { nodeId: string; results?: any[] };
  exclusionStrategy: 'mask' | 'penalize';
  similarityThreshold: number;
  outputResults?: any[];
}

export type NodeData = 
  | PrecedentNodeData 
  | StackedPrecedentNodeData
  | TextNodeData 
  | ImageNodeData
  | ImageGenNodeData 
  | LLMNodeData 
  | CollectionNodeData
  | AttributeFilterNodeData
  | ScalarNodeData
  | OperatorANDNodeData
  | OperatorORNodeData
  | OperatorNOTNodeData;

export interface NodeGraph {
  nodes: Array<{
    id: string;
    type: NodeType;
    label: string;
    data: any;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
    id?: string;
  }>;
}

export interface WorkflowIntent {
  task: string;
  parameters: Record<string, any>;
  variations: number;
}

export interface ParameterMatrix {
  axis1: string[];
  axis2: string[];
}

export interface MultiplyOutputsDialog {
  parameterMatrix: ParameterMatrix;
  layoutMode: 'grid' | 'horizontal' | 'vertical';
}

