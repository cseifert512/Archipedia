import React, { useState } from 'react';
import { Type, Image as ImageIcon, Grid3X3, Settings } from 'lucide-react';

interface NodePaletteProps {
  onSelectNodeType?: (type: string | null) => void;
  selectedNodeType?: string | null;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ 
  onSelectNodeType,
  selectedNodeType: externalSelectedNodeType,
}) => {
  const [internalSelectedNodeType, setInternalSelectedNodeType] = useState<string | null>(null);
  const selectedNodeType = externalSelectedNodeType !== undefined 
    ? externalSelectedNodeType 
    : internalSelectedNodeType;

  const nodeTypes = [
    { icon: Type, label: 'Text', type: 'text' },
    { icon: ImageIcon, label: 'Image', type: 'image' },
    { icon: Grid3X3, label: 'Mesh', type: 'mesh' },
    { icon: Settings, label: 'Overseer', type: 'overseer' },
  ];

  const handleClick = (type: string) => {
    const newSelection = selectedNodeType === type ? null : type;
    if (externalSelectedNodeType === undefined) {
      setInternalSelectedNodeType(newSelection);
    }
    onSelectNodeType?.(newSelection);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {nodeTypes.map(({ icon: Icon, label, type }) => {
        const isSelected = selectedNodeType === type;
        return (
          <button
            key={type}
            onClick={() => handleClick(type)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              transition: 'all 150ms ease',
              backgroundColor: isSelected
                ? 'var(--accent)'
                : 'rgba(0,0,0,0.05)',
              border: isSelected
                ? '2px solid var(--accent)'
                : '1px solid rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }
            }}
          >
            <Icon
              size={20}
              color={isSelected ? '#000000' : 'rgba(0,0,0,0.6)'}
              strokeWidth={1.5}
            />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '13px',
                fontWeight: 400,
                color: isSelected ? '#000000' : 'rgba(0,0,0,0.7)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
      </div>
  );
};
