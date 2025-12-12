/**
 * Example Workflow Configurations
 *
 * This file demonstrates how to programmatically create workflows
 * similar to Flora AI and Fuser Studio
 */

import { Node, Edge } from 'reactflow';
import { NodeData } from '../types/nodes';
import {
  createTextNode,
  createLLMNode,
  createImageGenNode,
  createPrecedentNode,
  create3DNode,
} from '../lib/nodeFactory';

/**
 * Example 1: Simple Text Processing Chain
 * Concept → LLM Enhancement → Output
 */
export function createTextProcessingWorkflow(): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const nodes = [
    createTextNode(
      { x: 100, y: 100 },
      'Design a modern museum with sustainable materials'
    ),
    createLLMNode(
      { x: 450, y: 100 },
      'Analyze and expand this architectural concept with specific details'
    ),
    createTextNode({ x: 800, y: 100 }, ''),
  ];

  const edges: Edge[] = [
    {
      id: 'e1-2',
      source: nodes[0].id,
      target: nodes[1].id,
    },
    {
      id: 'e2-3',
      source: nodes[1].id,
      target: nodes[2].id,
    },
  ];

  return { nodes, edges };
}

/**
 * Example 2: Image Generation Pipeline
 * Precedent → Analysis → Prompt Enhancement → Image Generation
 */
export function createImageGenerationWorkflow(
  precedentProjects: any[]
): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const nodes = [
    createPrecedentNode({ x: 50, y: 100 }, precedentProjects),
    createLLMNode(
      { x: 400, y: 100 },
      'Extract key design elements and create an image generation prompt'
    ),
    createImageGenNode({ x: 750, y: 100 }, ''),
  ];

  const edges: Edge[] = [
    {
      id: 'e1-2',
      source: nodes[0].id,
      target: nodes[1].id,
    },
    {
      id: 'e2-3',
      source: nodes[1].id,
      target: nodes[2].id,
    },
  ];

  return { nodes, edges };
}

/**
 * Example 3: Multi-Output Branching
 * Single concept generates multiple variations
 */
export function createMultiOutputWorkflow(): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const conceptNode = createTextNode(
    { x: 100, y: 250 },
    'Sustainable community center'
  );

  const llmNode = createLLMNode(
    { x: 400, y: 250 },
    'Create detailed architectural descriptions'
  );

  // Three parallel outputs
  const imageNode1 = createImageGenNode({ x: 750, y: 100 }, '');
  const imageNode2 = createImageGenNode({ x: 750, y: 250 }, '');
  const threeDNode = create3DNode({ x: 750, y: 400 });

  const nodes = [conceptNode, llmNode, imageNode1, imageNode2, threeDNode];

  const edges: Edge[] = [
    { id: 'e1-2', source: conceptNode.id, target: llmNode.id },
    { id: 'e2-3a', source: llmNode.id, target: imageNode1.id },
    { id: 'e2-3b', source: llmNode.id, target: imageNode2.id },
    { id: 'e2-3c', source: llmNode.id, target: threeDNode.id },
  ];

  return { nodes, edges };
}

/**
 * Example 4: Parameter Variation Matrix
 * One concept → Multiple variations with different parameters
 */
export function createParameterMatrixWorkflow(): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const basePrompt = createTextNode(
    { x: 100, y: 300 },
    'Modern residential building'
  );

  // Create variations with different styles
  const variations = [
    { style: 'minimalist', y: 100 },
    { style: 'parametric', y: 250 },
    { style: 'vernacular', y: 400 },
    { style: 'brutalist', y: 550 },
  ];

  const nodes = [basePrompt];
  const edges: Edge[] = [];

  variations.forEach((variant, index) => {
    const imageNode = createImageGenNode(
      { x: 500, y: variant.y },
      `${variant.style} architecture`
    );

    // Update node label
    imageNode.data.label = `${variant.style.charAt(0).toUpperCase() + variant.style.slice(1)} Variation`;

    nodes.push(imageNode);
    edges.push({
      id: `e1-${index + 2}`,
      source: basePrompt.id,
      target: imageNode.id,
    });
  });

  return { nodes, edges };
}

/**
 * Example 5: Iterative Refinement
 * Concept → Generate → Analyze → Refine → Generate
 */
export function createIterativeRefinementWorkflow(): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const nodes = [
    createTextNode({ x: 50, y: 200 }, 'Initial design concept'),
    createImageGenNode({ x: 350, y: 200 }, ''),
    createLLMNode({ x: 650, y: 200 }, 'Analyze this design and suggest improvements'),
    createImageGenNode({ x: 950, y: 200 }, ''),
  ];

  const edges: Edge[] = [
    { id: 'e1-2', source: nodes[0].id, target: nodes[1].id },
    { id: 'e2-3', source: nodes[1].id, target: nodes[2].id },
    { id: 'e3-4', source: nodes[2].id, target: nodes[3].id },
  ];

  return { nodes, edges };
}

/**
 * Example 6: Data Aggregation
 * Multiple sources → Collection → Analysis
 */
export function createAggregationWorkflow(
  precedentProjects: any[]
): {
  nodes: Node<NodeData>[];
  edges: Edge[];
} {
  const precedent1 = createPrecedentNode(
    { x: 50, y: 100 },
    [precedentProjects[0]]
  );
  const precedent2 = createPrecedentNode(
    { x: 50, y: 250 },
    [precedentProjects[1]]
  );
  const precedent3 = createPrecedentNode(
    { x: 50, y: 400 },
    [precedentProjects[2]]
  );

  const analysisNode = createLLMNode(
    { x: 400, y: 250 },
    'Compare these precedents and extract common design patterns'
  );

  const synthesisNode = createTextNode({ x: 750, y: 250 }, '');

  const nodes = [precedent1, precedent2, precedent3, analysisNode, synthesisNode];

  const edges: Edge[] = [
    { id: 'e1-4', source: precedent1.id, target: analysisNode.id },
    { id: 'e2-4', source: precedent2.id, target: analysisNode.id },
    { id: 'e3-4', source: precedent3.id, target: analysisNode.id },
    { id: 'e4-5', source: analysisNode.id, target: synthesisNode.id },
  ];

  return { nodes, edges };
}

/**
 * Helper function to load workflow into canvas
 */
export function loadWorkflowIntoCanvas(
  workflow: { nodes: Node<NodeData>[]; edges: Edge[] },
  canvasStore: any
) {
  // Clear existing nodes and edges
  canvasStore.addNodes(workflow.nodes);
  canvasStore.addEdges(workflow.edges);
}

/**
 * Usage example:
 *
 * import { useCanvasStore } from '../stores/canvasStore';
 * import { createTextProcessingWorkflow, loadWorkflowIntoCanvas } from './examples/workflowExample';
 *
 * function MyComponent() {
 *   const canvasStore = useCanvasStore();
 *
 *   const handleLoadExample = () => {
 *     const workflow = createTextProcessingWorkflow();
 *     loadWorkflowIntoCanvas(workflow, canvasStore);
 *   };
 *
 *   return <button onClick={handleLoadExample}>Load Example Workflow</button>;
 * }
 */
