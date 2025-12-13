import { Node } from 'reactflow';
import { NodeData } from '../types/nodes';
import { createImageGenNode, createTextNode } from './nodeFactory';

export interface SpawnConfig {
  parentNodeId: string;
  parentPosition: { x: number; y: number };
  childCount: number;
  childType: 'image-gen' | 'text' | '3d';
  layout: 'grid' | 'horizontal' | 'vertical';
}

export function calculateGridLayout(
  parentPosition: { x: number; y: number },
  childCount: number,
  childWidth: number = 160,
  childHeight: number = 140,
  gap: number = 20
) {
  const cols = Math.ceil(Math.sqrt(childCount));
  const rows = Math.ceil(childCount / cols);
  const totalWidth = cols * childWidth + (cols - 1) * gap;
  const totalHeight = rows * childHeight + (rows - 1) * gap;

  return {
    startX: parentPosition.x - totalWidth / 2,
    startY: parentPosition.y + 320,
    cols,
    rows,
    childWidth,
    childHeight,
    gap,
  };
}

export function spawnChildNodes(config: SpawnConfig): Node<NodeData>[] {
  const { parentPosition, childCount, childType, layout } = config;
  const childNodes: Node<NodeData>[] = [];

  if (layout === 'grid') {
    const grid = calculateGridLayout(parentPosition, childCount);
    
    for (let i = 0; i < childCount; i++) {
      const row = Math.floor(i / grid.cols);
      const col = i % grid.cols;
      const x = grid.startX + col * (grid.childWidth + grid.gap);
      const y = grid.startY + row * (grid.childHeight + grid.gap);

      let childNode: Node<NodeData>;
      if (childType === 'image-gen') {
        childNode = createImageGenNode({ x, y }, `Generated concept ${i + 1}`);
        childNode.data.status = 'generating';
      } else if (childType === 'text') {
        childNode = createTextNode({ x, y }, `Text output ${i + 1}`);
      } else {
        childNode = createImageGenNode({ x, y }, `Generated concept ${i + 1}`);
      }

      childNode.data.label = `${childType} ${i + 1}`;
      childNode.data.parentId = config.parentNodeId;
      childNodes.push(childNode);
    }
  } else if (layout === 'horizontal') {
    const childWidth = 160;
    const gap = 20;
    const startX = parentPosition.x - ((childCount * childWidth + (childCount - 1) * gap) / 2);
    
    for (let i = 0; i < childCount; i++) {
      const x = startX + i * (childWidth + gap);
      const y = parentPosition.y + 320;
      
      const childNode = createImageGenNode({ x, y }, `Generated concept ${i + 1}`);
      childNode.data.label = `Concept ${i + 1}`;
      childNode.data.status = 'generating';
      childNode.data.parentId = config.parentNodeId;
      childNodes.push(childNode);
    }
  } else {
    // vertical
    const childHeight = 140;
    const gap = 20;
    
    for (let i = 0; i < childCount; i++) {
      const x = parentPosition.x;
      const y = parentPosition.y + 320 + i * (childHeight + gap);
      
      const childNode = createImageGenNode({ x, y }, `Generated concept ${i + 1}`);
      childNode.data.label = `Concept ${i + 1}`;
      childNode.data.status = 'generating';
      childNode.data.parentId = config.parentNodeId;
      childNodes.push(childNode);
    }
  }

  return childNodes;
}

