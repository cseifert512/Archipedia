import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Connection,
  Node,
  NodeMouseHandler,
  ReactFlowInstance,
  Edge,
  EdgeMouseHandler,
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
import { ResultsNode } from '../Nodes/ResultsNode';
import { GenerateNode } from '../Nodes/GenerateNode';
import { ValidateNode } from '../Nodes/ValidateNode';
import { StyleReferenceNode } from '../Nodes/StyleReferenceNode';
import { ChildNodeGroup } from './ChildNodeGroup';
import { NodeData, ParameterMatrix, PrecedentProject } from '../../types/nodes';
import { MultiplyOutputsDialog } from '../Dialogs/MultiplyOutputsDialog';
import { calculateGridPosition, calculateHorizontalLayout, calculateVerticalLayout } from '../../lib/layoutAlgorithms';
import { 
  createNode, 
  createPrecedentNode,
  createTextNode,
  createImageNode,
  createAttributeFilterNode,
  createScalarNode,
  createResultsNode,
  createOperatorANDNode,
  createOperatorORNode,
  createOperatorNOTNode,
  createGenerateNode,
  createValidateNode,
  createStyleReferenceNode,
} from '../../lib/nodeFactory';
import { SearchResult } from '../../stores/searchStore';
import { SelectionContextMenu } from '../ContextMenu/SelectionContextMenu';
import { TemplatesDialog } from '../Dialogs/TemplatesDialog';
import { CustomSelectionBox } from './CustomSelectionBox';

const nodeTypes: NodeTypes = {
  precedent: PrecedentNode,
  text: TextNode,
  image: ImageNode,
  attributeFilter: AttributeFilterNode,
  scalar: ScalarNode,
  operatorAND: OperatorANDNode,
  operatorOR: OperatorORNode,
  operatorNOT: OperatorNOTNode,
  results: ResultsNode,
  generate: GenerateNode,
  validate: ValidateNode,
  styleReference: StyleReferenceNode,
  default: TextNode,
};

interface NodeCanvasProps {
  initialPrecedents?: SearchResult[];
  onOpenTemplates?: () => void;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ initialPrecedents = [], onOpenTemplates }) => {
  const [showMultiplyDialog, setShowMultiplyDialog] = useState(false);
  const [selectedNodeForMultiply, setSelectedNodeForMultiply] = useState<Node<NodeData> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);

  // Expose templates dialog to parent
  useEffect(() => {
    if (onOpenTemplates) {
      // Store the open function in a way parent can call it
      (window as any).__openTemplates = () => setShowTemplatesDialog(true);
    }
  }, [onOpenTemplates]);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodes,
    deleteNode,
    selectedNodes,
    groupNodes,
    ungroupNodes,
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
      // Only connect if we're still in connecting state (Esc not pressed)
      if (isConnecting) {
        onConnect(connection);
      }
      setIsConnecting(false);
    },
    [onConnect, isConnecting]
  );

  const handleConnectStart = useCallback(() => {
    setIsConnecting(true);
  }, []);

  const handleConnectEnd = useCallback(() => {
    setIsConnecting(false);
  }, []);

  // Handle Esc key to cancel connection/unselect nodes and Delete/Backspace to delete edges/nodes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isConnecting) {
          event.preventDefault();
          setIsConnecting(false);
        } else if (selectedNodes.length > 0) {
          // Unselect all nodes
          event.preventDefault();
          onNodesChange(selectedNodes.map(nodeId => ({ type: 'select', id: nodeId, selected: false })));
        } else if (selectedEdgeId) {
          // Unselect edge
          event.preventDefault();
          setSelectedEdgeId(null);
        }
      } else if ((event.key === 'Backspace' || event.key === 'Delete')) {
        // Prioritize deleting selected nodes over edges
        if (selectedNodes.length > 0) {
          event.preventDefault();
          selectedNodes.forEach(nodeId => {
            deleteNode(nodeId);
          });
        } else if (selectedEdgeId) {
          // Delete selected edge
          event.preventDefault();
          const edgeToRemove = edges.find(e => {
            const edgeId = e.id || `${e.source}-${e.sourceHandle || ''}-${e.target}-${e.targetHandle || ''}`;
            return edgeId === selectedEdgeId;
          });
          if (edgeToRemove) {
            onEdgesChange([{ type: 'remove', id: edgeToRemove.id || selectedEdgeId }]);
            setSelectedEdgeId(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnecting, selectedEdgeId, selectedNodes, edges, onEdgesChange, onNodesChange, deleteNode]);

  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((event, edge) => {
    const edgeId = edge.id || `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${edge.targetHandle || ''}`;
    setHoveredEdgeId(edgeId);
  }, []);

  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

  const handleEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.stopPropagation();
    const edgeId = edge.id || `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${edge.targetHandle || ''}`;
    setSelectedEdgeId(edgeId === selectedEdgeId ? null : edgeId);
  }, [selectedEdgeId]);

  const handlePaneClick = useCallback(() => {
    // Deselect edge when clicking on empty canvas
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    // Only show context menu if multiple nodes are selected
    if (selectedNodes.length >= 2) {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY });
    }
  }, [selectedNodes.length]);

  const handleGroupNodes = useCallback(() => {
    if (selectedNodes.length >= 2) {
      groupNodes(selectedNodes);
      setContextMenu(null);
    }
  }, [selectedNodes, groupNodes]);

  const handleUngroupNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      // Find the group ID of the first selected node
      const firstNode = nodes.find(n => selectedNodes.includes(n.id));
      if (firstNode && (firstNode.data as any).groupId) {
        const groupId = (firstNode.data as any).groupId;
        ungroupNodes(groupId);
        setContextMenu(null);
      }
    }
  }, [selectedNodes, nodes, ungroupNodes]);

  // Check if all selected nodes are in the same group
  const canUngroup = useMemo(() => {
    if (selectedNodes.length === 0) return false;
    const selectedNodeData = nodes
      .filter(n => selectedNodes.includes(n.id))
      .map(n => (n.data as any).groupId);
    if (selectedNodeData.length === 0) return false;
    const firstGroupId = selectedNodeData[0];
    return firstGroupId && selectedNodeData.every(g => g === firstGroupId);
  }, [selectedNodes, nodes]);

  const handleSaveWorkflow = useCallback(() => {
    // Open templates dialog in save mode
    setShowTemplatesDialog(true);
    setContextMenu(null);
  }, []);

  const handleLoadTemplate = useCallback((template: { nodes: Node<NodeData>[]; edges: Edge[] }) => {
    // Clear current canvas and load template
    const newNodes = template.nodes.map(node => ({
      ...node,
      position: {
        x: node.position.x + 100, // Offset slightly
        y: node.position.y + 100,
      },
    }));
    addNodes(newNodes);
      // Add edges
      template.edges.forEach(edge => {
        onConnect({
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
        });
      });
  }, [addNodes, onConnect]);

  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNodeForMultiply(node);
    setShowMultiplyDialog(true);
  }, []);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate selection box bounds for multi-select
  const selectionBox = useMemo(() => {
    if (selectedNodes.length < 2 || !reactFlowInstance) return null;
    
    const selectedNodeObjects = nodes.filter(n => selectedNodes.includes(n.id));
    if (selectedNodeObjects.length === 0) return null;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedNodeObjects.forEach(node => {
      const position = node.position;
      const width = (node.width as number) || 300;
      const height = (node.height as number) || 200;
      
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + width);
      maxY = Math.max(maxY, position.y + height);
    });

    // Convert to screen coordinates
    const screenMin = reactFlowInstance.project({ x: minX, y: minY });
    const screenMax = reactFlowInstance.project({ x: maxX, y: maxY });

    return {
      x: screenMin.x,
      y: screenMin.y,
      width: screenMax.x - screenMin.x,
      height: screenMax.y - screenMin.y,
    };
  }, [selectedNodes, nodes, reactFlowInstance]);

  // Handle middle mouse button panning
  useEffect(() => {
    if (!reactFlowInstance) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && reactFlowInstance) {
        e.preventDefault();
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        const viewport = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport({ ...viewport, x: viewport.x + deltaX, y: viewport.y + deltaY });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        setIsPanning(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [reactFlowInstance, isPanning, panStart]);

  const handlePaneDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      // Try to get precedent data first
      let data = event.dataTransfer.getData('application/archipedia-precedent');
      let nodeType = 'precedent';
      
      // If no precedent data, try other node types
      if (!data) {
        data = event.dataTransfer.getData('application/archipedia-node-type');
        if (data) {
          nodeType = data;
        } else {
          // If no recognized data, don't create a node
          return;
        }
      }

      if (reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (nodeType === 'precedent' && data) {
          try {
            const project: SearchResult = JSON.parse(data);
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
            console.log('[NodeCanvas] Creating precedent node:', newNode.type, newNode.data.type);
            addNodes([newNode]);
          } catch (error) {
            console.error('Error parsing dropped data:', error);
          }
        } else if (['text', 'image', 'attributeFilter', 'scalar', 'results', 'operatorAND', 'operatorOR', 'operatorNOT', 'generate', 'validate', 'styleReference'].includes(nodeType)) {
          // Handle other node types
          let newNode: Node<NodeData> | null = null;
          
          switch (nodeType) {
            case 'text':
              newNode = createTextNode(position, '');
              break;
            case 'image':
              newNode = createImageNode(position);
              break;
            case 'attributeFilter':
              newNode = createAttributeFilterNode(position);
              break;
            case 'scalar':
              newNode = createScalarNode(position);
              break;
            case 'results':
              newNode = createResultsNode(position, 0);
              break;
            case 'operatorAND':
              newNode = createOperatorANDNode(position);
              break;
            case 'operatorOR':
              newNode = createOperatorORNode(position);
              break;
            case 'operatorNOT':
              newNode = createOperatorNOTNode(position);
              break;
            case 'generate':
              newNode = createGenerateNode(position);
              break;
            case 'validate':
              newNode = createValidateNode(position);
              break;
            case 'styleReference':
              newNode = createStyleReferenceNode(position);
              break;
          }
          
          if (newNode) {
            console.log('[NodeCanvas] Creating node:', nodeType, newNode.type, newNode.data.type);
            addNodes([newNode]);
          }
        }
      }
    },
    [addNodes, reactFlowInstance]
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

  // Custom edge styles based on hover and selection
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const edgeId = edge.id || `${edge.source}-${edge.sourceHandle || ''}-${edge.target}-${edge.targetHandle || ''}`;
      const isHovered = hoveredEdgeId === edgeId;
      const isSelected = selectedEdgeId === edgeId;
      const strokeColor = isSelected || isHovered ? '#FF0000' : '#CCCCCC';
      const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2;

      return {
        ...edge,
        id: edgeId,
        style: {
          ...edge.style,
          stroke: strokeColor,
          strokeWidth,
        },
        selected: isSelected,
      };
    });
  }, [edges, hoveredEdgeId, selectedEdgeId]);

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
        ref={reactFlowWrapperRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F5F1E8',
        }}
        onDragOver={handleDragOver}
        onDrop={handlePaneDrop}
      >
        <ReactFlow
          nodes={nodes.map(node => {
            const nodeData = node.data as any;
            const isGrouped = !!nodeData.groupId;
            // Grouped nodes can be dragged, but they'll move together
            // Selected nodes cannot be dragged (for slider interaction)
            return {
              ...node,
              draggable: !selectedNodes.includes(node.id) && !isGrouped ? true : !selectedNodes.includes(node.id),
            };
          })}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onEdgeMouseEnter={handleEdgeMouseEnter}
          onEdgeMouseLeave={handleEdgeMouseLeave}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          onNodeContextMenu={handleNodeContextMenu}
          selectNodesOnDrag={false}
          selectionOnDrag={true}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
          panOnDrag={true}
          panOnScroll={false}
          zoomOnScroll={true}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          connectionLineType={"smoothstep" as any}
          snapToGrid={false}
          snapGrid={[20, 20]}
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

      {selectionBox && selectedNodes.length >= 2 && (
        <CustomSelectionBox
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          onGroup={handleGroupNodes}
          onUngroup={canUngroup ? handleUngroupNodes : undefined}
          onSaveWorkflow={handleSaveWorkflow}
          selectedCount={selectedNodes.length}
          canUngroup={canUngroup}
        />
      )}

      {contextMenu && selectedNodes.length >= 2 && (
        <SelectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onGroup={handleGroupNodes}
          onUngroup={canUngroup ? handleUngroupNodes : undefined}
          onSaveWorkflow={handleSaveWorkflow}
          selectedCount={selectedNodes.length}
          canUngroup={canUngroup}
        />
      )}

      {showTemplatesDialog && (
        <TemplatesDialog
          open={showTemplatesDialog}
          onClose={() => setShowTemplatesDialog(false)}
          onLoadTemplate={handleLoadTemplate}
          currentNodes={nodes}
          currentEdges={edges}
        />
      )}
    </>
  );
};

