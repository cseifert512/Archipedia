/**
 * Data Flow Validator
 * Validates connections between nodes based on port types
 */

import { Edge } from 'reactflow';
import { NodeData, NodeType } from '../types/nodes';
import { arePortsCompatible, getInputPort, getOutputPort } from './NodeRegistry';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'incompatible_types' | 'missing_port' | 'circular_dependency' | 'invalid_edge';
  message: string;
  edgeId?: string;
  nodeId?: string;
}

export interface ValidationWarning {
  type: 'unused_output' | 'missing_input' | 'performance';
  message: string;
  nodeId?: string;
  portId?: string;
}

/**
 * Validate a single edge connection
 */
export function validateEdge(
  edge: Edge,
  sourceNodeType: NodeType,
  targetNodeType: NodeType
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Get port definitions
  const sourcePort = getOutputPort(sourceNodeType, edge.sourceHandle || 'output');
  const targetPort = getInputPort(targetNodeType, edge.targetHandle || 'input');

  // Check if ports exist
  if (!sourcePort) {
    errors.push({
      type: 'missing_port',
      message: `Source port '${edge.sourceHandle || 'output'}' not found on ${sourceNodeType} node`,
      edgeId: edge.id,
      nodeId: edge.source,
    });
  }

  if (!targetPort) {
    errors.push({
      type: 'missing_port',
      message: `Target port '${edge.targetHandle || 'input'}' not found on ${targetNodeType} node`,
      edgeId: edge.id,
      nodeId: edge.target,
    });
  }

  // Check type compatibility
  if (sourcePort && targetPort) {
    if (!arePortsCompatible(sourceNodeType, edge.sourceHandle || 'output', targetNodeType, edge.targetHandle || 'input')) {
      errors.push({
        type: 'incompatible_types',
        message: `Cannot connect ${sourcePort.type} output to ${targetPort.type} input`,
        edgeId: edge.id,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all edges in a workflow
 */
export function validateWorkflowEdges(
  nodes: Array<{ id: string; data: NodeData }>,
  edges: Edge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Create node map for quick lookup
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Validate each edge
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode) {
      errors.push({
        type: 'invalid_edge',
        message: `Source node '${edge.source}' not found`,
        edgeId: edge.id,
      });
      return;
    }

    if (!targetNode) {
      errors.push({
        type: 'invalid_edge',
        message: `Target node '${edge.target}' not found`,
        edgeId: edge.id,
      });
      return;
    }

    // Validate edge connection
    const edgeValidation = validateEdge(edge, sourceNode.data.type, targetNode.data.type);
    errors.push(...edgeValidation.errors);
    warnings.push(...edgeValidation.warnings);
  });

  // Check for unused outputs
  nodes.forEach(node => {
    const nodeDef = node.data;
    if (nodeDef.outputs) {
      const connectedOutputs = new Set(
        edges
          .filter(e => e.source === node.id)
          .map(e => e.sourceHandle || 'output')
      );

      nodeDef.outputs.forEach(output => {
        if (!connectedOutputs.has(output.id)) {
          warnings.push({
            type: 'unused_output',
            message: `Output '${output.label}' on ${nodeDef.type} node is not connected`,
            nodeId: node.id,
            portId: output.id,
          });
        }
      });
    }
  });

  // Check for missing required inputs
  nodes.forEach(node => {
    const nodeDef = node.data;
    if (nodeDef.inputs) {
      const connectedInputs = new Set(
        edges
          .filter(e => e.target === node.id)
          .map(e => e.targetHandle || 'input')
      );

      // Note: We don't mark all inputs as required by default
      // This is just a warning, not an error
      nodeDef.inputs.forEach(input => {
        if (!connectedInputs.has(input.id) && input.id !== 'query' && input.id !== 'filters') {
          // Some inputs are optional (like query, filters)
          warnings.push({
            type: 'missing_input',
            message: `Input '${input.label}' on ${nodeDef.type} node is not connected (optional)`,
            nodeId: node.id,
            portId: input.id,
          });
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if an edge can be created (for real-time validation during connection)
 */
export function canCreateEdge(
  sourceNodeType: NodeType,
  sourcePortId: string,
  targetNodeType: NodeType,
  targetPortId: string
): { canConnect: boolean; reason?: string } {
  const sourcePort = getOutputPort(sourceNodeType, sourcePortId);
  const targetPort = getInputPort(targetNodeType, targetPortId);

  if (!sourcePort) {
    return { canConnect: false, reason: `Source port '${sourcePortId}' not found` };
  }

  if (!targetPort) {
    return { canConnect: false, reason: `Target port '${targetPortId}' not found` };
  }

  if (!arePortsCompatible(sourceNodeType, sourcePortId, targetNodeType, targetPortId)) {
    return {
      canConnect: false,
      reason: `Cannot connect ${sourcePort.type} to ${targetPort.type}`,
    };
  }

  return { canConnect: true };
}


