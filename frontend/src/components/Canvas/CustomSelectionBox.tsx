import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CustomSelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onGroup: () => void;
  onUngroup?: () => void;
  onSaveWorkflow: () => void;
  selectedCount: number;
  canUngroup?: boolean;
}

export const CustomSelectionBox: React.FC<CustomSelectionBoxProps> = ({
  x,
  y,
  width,
  height,
  onGroup,
  onUngroup,
  onSaveWorkflow,
  selectedCount,
  canUngroup = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const padding = 8; // Padding offset
  const frameWidth = 2; // Frame thickness

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x - padding}px`,
        top: `${y - padding}px`,
        width: `${width + padding * 2}px`,
        height: `${height + padding * 2}px`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `${frameWidth}px solid rgba(0, 0, 0, 0.2)`,
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Dropdown Menu at Top */}
      <div
        style={{
          position: 'absolute',
          top: `-${32 + frameWidth}px`,
          left: '0',
          backgroundColor: 'white',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          minWidth: '180px',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-primary)',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            textAlign: 'left',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#000000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>Selection ({selectedCount})</span>
          {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {isDropdownOpen && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            {canUngroup && onUngroup ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUngroup();
                  setIsDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Ungroup
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGroup();
                  setIsDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Group ({selectedCount} nodes)
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveWorkflow();
                setIsDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Save Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

