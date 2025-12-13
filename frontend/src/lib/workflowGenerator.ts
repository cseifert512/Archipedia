import { NodeGraph, WorkflowIntent, PrecedentProject } from '../types/nodes';

// Mock LLM workflow generation
export function generateWorkflow(intent: WorkflowIntent): NodeGraph {
  // Simulate API delay
  const mockPrecedents: PrecedentProject[] = [
    {
      id: 'p1',
      title: 'Courtyard House',
      thumbnail: '/precedents/courtyard.jpg',
      attributes: {
        circulation: 'courtyard',
        materiality: 'concrete+wood',
        climate: 'hot-humid',
      },
    },
    {
      id: 'p2',
      title: 'Linear Block',
      thumbnail: '/precedents/linear.jpg',
      attributes: {
        circulation: 'double-loaded-corridor',
        materiality: 'concrete+wood',
        climate: 'hot-humid',
      },
    },
  ];

  // Generate workflow based on intent
  const nodes = [
    {
      id: '1',
      type: 'precedent' as const,
      label: 'Selected Precedents',
      data: { projects: mockPrecedents },
      position: { x: 100, y: 100 },
    },
    {
      id: '2',
      type: 'llm' as const,
      label: 'Synthesis',
      data: { model: 'claude-3', prompt: intent.task },
      position: { x: 450, y: 100 },
    },
    {
      id: '3',
      type: 'image-gen' as const,
      label: 'Concept Renders',
      data: { model: 'midjourney', variations: intent.variations },
      position: { x: 800, y: 100 },
    },
  ];

  const edges = [
    { source: '1', target: '2', id: 'e1-2' },
    { source: '2', target: '3', id: 'e2-3' },
  ];

  return { nodes, edges };
}

// Mock async workflow generation with delay
export async function generateWorkflowAsync(intent: WorkflowIntent): Promise<NodeGraph> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateWorkflow(intent));
    }, 1500); // Simulate API call
  });
}

