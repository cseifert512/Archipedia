import React from 'react';
import { Type, ImageIcon, Grid3X3, Settings, Search, Filter, Ruler, Circle, GitMerge, Minus } from 'lucide-react';

interface NodeType {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  type: string;
  color: string;
}

const nodeTypes: NodeType[] = [
  { icon: Type, label: 'Text', type: 'text', color: '#F5F1E8' },
  { icon: ImageIcon, label: 'Image', type: 'image', color: '#64B5FF' },
  { icon: Filter, label: 'Attributes', type: 'attributeFilter', color: '#90EE90' },
  { icon: Ruler, label: 'Constraints', type: 'scalar', color: '#4A90E2' },
  { icon: Circle, label: 'AND', type: 'operatorAND', color: '#FF9F43' },
  { icon: GitMerge, label: 'OR', type: 'operatorOR', color: '#9D7BE8' },
  { icon: Minus, label: 'NOT', type: 'operatorNOT', color: '#FF6B6B' },
];

interface NodePaletteSidebarProps {
  onAddNode: (type: string) => void;
}

export const NodePaletteSidebar: React.FC<NodePaletteSidebarProps> = ({ onAddNode }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '120px',
        width: '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 40,
      }}
    >
      {nodeTypes.map((node) => {
        const IconComponent = node.icon;
        return (
          <button
            key={node.type}
            onClick={() => onAddNode(node.type)}
            title={node.label}
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: node.color,
              border: '1px solid rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 12px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <IconComponent size={16} color="#000000" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                flex: 1,
                textAlign: 'left',
              }}
            >
              {node.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};



