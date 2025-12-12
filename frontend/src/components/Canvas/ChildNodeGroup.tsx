import React from 'react';
import { Node } from 'reactflow';
import { NodeData } from '../../types/nodes';

interface ChildNodeGroupProps {
  parentNode: Node<NodeData>;
  childNodes: Node<NodeData>[];
}

export const ChildNodeGroup: React.FC<ChildNodeGroupProps> = ({ parentNode, childNodes }) => {
  if (childNodes.length === 0) return null;

  // Calculate bounding box
  const positions = childNodes.map(n => n.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x + 300));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y + 280));

  const width = maxX - minX;
  const height = maxY - minY;

  // Determine group color based on status
  const hasRunning = childNodes.some(n => n.data.status === 'generating' || n.data.status === 'running');
  const allComplete = childNodes.every(n => n.data.status === 'complete');
  const hasFailed = childNodes.some(n => n.data.status === 'failed');

  const groupColor = hasFailed
    ? 'rgba(244, 67, 54, 0.1)'
    : allComplete
    ? 'rgba(76, 175, 80, 0.1)'
    : hasRunning
    ? 'rgba(255, 200, 0, 0.1)'
    : 'rgba(0, 0, 0, 0.05)';

  const borderColor = hasFailed
    ? 'rgba(244, 67, 54, 0.3)'
    : allComplete
    ? 'rgba(76, 175, 80, 0.3)'
    : hasRunning
    ? 'rgba(255, 200, 0, 0.3)'
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <>
      {/* Background Group */}
      <div
        style={{
          position: 'absolute',
          left: `${minX - 20}px`,
          top: `${minY - 20}px`,
          width: `${width + 40}px`,
          height: `${height + 40}px`,
          backgroundColor: groupColor,
          border: `2px dashed ${borderColor}`,
          borderRadius: '12px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Connection Lines from Parent */}
      {childNodes.map((child) => (
        <svg
          key={`line-${child.id}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <line
            x1={parentNode.position.x + 150}
            y1={parentNode.position.y + 280}
            x2={child.position.x + 150}
            y2={child.position.y}
            stroke={borderColor}
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </svg>
      ))}
    </>
  );
};

