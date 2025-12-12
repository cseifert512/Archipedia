import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Connection,
  Node,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../../stores/canvasStore';
import { PrecedentNode } from '../Nodes/PrecedentNode';
import { TextNode } from '../Nodes/TextNode';
import { ImageNode } from '../Nodes/ImageNode';
import { AttributeFilterNode } from '../Nodes/AttributeFilterNode';
import { ScalarNode } from '../Nodes/ScalarNode';
import { OperatorANDNode } from '../Nodes/OperatorANDNode';
import { OperatorORNode } from '../Nodes/OperatorORNode';
import { OperatorNOTNode } from '../Nodes/OperatorNOTNode';
import { ChildNodeGroup } from './ChildNodeGroup';
import { NodeData, ParameterMatrix, PrecedentProject } from '../../types/nodes';
import { MultiplyOutputsDialog } from '../Dialogs/MultiplyOutputsDialog';
import { calculateGridPosition, calculateHorizontalLayout, calculateVerticalLayout } from '../../lib/layoutAlgorithms';
import { createNode, createPrecedentNode } from '../../lib/nodeFactory';
import { SearchResult } from '../../stores/searchStore';

const nodeTypes: NodeTypes = {
  precedent: PrecedentNode,
  text: TextNode,
  image: ImageNode,
  attributeFilter: AttributeFilterNode,
  scalar: ScalarNode,
  operatorAND: OperatorANDNode,
  operatorOR: OperatorORNode,
  operatorNOT: OperatorNOTNode,
  default: TextNode,
};

interface NodeCanvasProps {
  initialPrecedents?: SearchResult[];
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ initialPrecedents = [] }) => {
  const [showMultiplyDialog, setShowMultiplyDialog] = useState(false);
  const [selectedNodeForMultiply, setSelectedNodeForMultiply] = useState<Node<NodeData> | null>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodes,
  } = useCanvasStore();

  // Convert search results to precedent nodes on mount
  useEffect(() => {
    if (initialPrecedents && Array.isArray(initialPrecedents) && initialPrecedents.length > 0 && nodes.length === 0) {
      const precedentProjects: PrecedentProject[] = initialPrecedents.map((result: SearchResult) => ({
        id: result.id,
        title: result.name,
        thumbnail: result.imageUrl || (typeof result.url === 'string' ? result.url : ''),
        attributes: {
          circulation: typeof result.typology === 'string' ? result.typology : '',
          materiality: Array.isArray(result.materials) ? result.materials.join('+') : (result.materials || ''),
          climate:
            Array.isArray(result.climate)
              ? result.climate.join('+')
              : (typeof result.climate === 'string' ? result.climate : ''),
        },
      }));

      const precedentNode = createPrecedentNode(
        { x: 100, y: 200 },
        precedentProjects
      );
      addNodes([precedentNode]);
    }
  }, [initialPrecedents, nodes.length, addNodes]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNodeForMultiply(node);
    setShowMultiplyDialog(true);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/archipedia-precedent');
      if (data) {
        try {
          const project: SearchResult = JSON.parse(data);
          const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
          const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          };

          const precedentProject: PrecedentProject = {
            id: project.id,
            title: project.name,
            thumbnail: project.imageUrl || project.url || '',
            attributes: {
              circulation: project.typology || '',
              materiality: Array.isArray(project.materials) ? project.materials.join('+') : (project.materials || ''),
              climate: Array.isArray(project.climate) ? project.climate.join('+') : (typeof project.climate === 'string' ? project.climate : ''),
            },
          };

          const newNode = createPrecedentNode(position, [precedentProject]);
          addNodes([newNode]);
        } catch (error) {
          console.error('Error parsing dropped data:', error);
        }
      }
    },
    [addNodes]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleMultiplyConfirm = useCallback(
    (matrix: ParameterMatrix, layoutMode: 'grid' | 'horizontal' | 'vertical') => {
      if (!selectedNodeForMultiply) return;

      const combinations = matrix.axis1.flatMap((a1) =>
        matrix.axis2.map((a2) => ({ a1, a2 }))
      );

      const basePosition = selectedNodeForMultiply.position;
      const childNodes = combinations.map((combo, index) => {
        let position;
        switch (layoutMode) {
          case 'grid':
            position = calculateGridPosition(index, combinations.length);
            break;
          case 'horizontal':
            position = calculateHorizontalLayout(index);
            break;
          case 'vertical':
            position = calculateVerticalLayout(index);
            break;
        }

        return createNode(
          selectedNodeForMultiply.data.type,
          {
            x: basePosition.x + position.x + 320,
            y: basePosition.y + position.y,
          },
          {
            ...selectedNodeForMultiply.data,
            label: `${selectedNodeForMultiply.data.label} (${combo.a1}, ${combo.a2})`,
            variant: combo,
          }
        );
      });

      addNodes(childNodes);
      setShowMultiplyDialog(false);
      setSelectedNodeForMultiply(null);
    },
    [selectedNodeForMultiply, addNodes]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { strokeWidth: 2, stroke: '#CCCCCC' },
      type: 'smoothstep',
      animated: false,
    }),
    []
  );

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F5F1E8',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeContextMenu={handleNodeContextMenu}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          panOnDrag={[1]} // Pan with middle mouse button (industry standard: middle click = pan)
          panOnScroll={false} // Don't pan with scroll wheel (industry standard: scroll = zoom)
          zoomOnScroll={true} // Zoom with scroll wheel (industry standard)
          selectionOnDrag={true} // Box selection with left mouse button drag on empty space
          selectNodesOnDrag={false} // Don't select nodes when dragging them
          panOnSpace={true} // Pan with spacebar + drag (industry standard)
          nodesDraggable={true} // Allow node dragging with left mouse button
          nodesConnectable={true} // Allow connecting nodes
          elementsSelectable={true} // Allow selecting elements
          connectionLineType="smoothstep" // Smooth connection lines
          snapToGrid={false} // No grid snapping (can be enabled if needed)
          snapGrid={[20, 20]} // Grid size if snapping is enabled
        >
          <Background color="#E8E4D9" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node: Node<NodeData>) => {
              const colors: Record<string, string> = {
                precedent: '#FFC800',
                stackedPrecedent: '#FFC800',
                text: '#F5F1E8',
                image: '#64B5FF',
                'image-gen': '#4CAF50',
                llm: '#4CAF50',
                attributeFilter: '#FFC800',
                scalar: '#32C864',
                operatorAND: '#FF9F43',
                operatorOR: '#9D7BE8',
                operatorNOT: '#FF6B6B',
                collection: '#9D7BE8',
              };
              return colors[node.type || 'default'] || '#CCCCCC';
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #CCCCCC',
            }}
          />
        </ReactFlow>
      </div>
      
      {showMultiplyDialog && (
        <MultiplyOutputsDialog
          open={showMultiplyDialog}
          onClose={() => {
            setShowMultiplyDialog(false);
            setSelectedNodeForMultiply(null);
          }}
          onConfirm={handleMultiplyConfirm}
        />
      )}
    </>
  );
};

