import React from 'react';

interface SelectionContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onGroup: () => void;
  onUngroup?: () => void;
  onSaveWorkflow: () => void;
  selectedCount: number;
  canUngroup?: boolean;
}

export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  x,
  y,
  onClose,
  onGroup,
  onUngroup,
  onSaveWorkflow,
  selectedCount,
  canUngroup = false,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        padding: '4px',
        zIndex: 1000,
        minWidth: '180px',
        fontFamily: 'var(--font-primary)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {canUngroup && onUngroup ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUngroup();
            onClose();
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
            borderRadius: '4px',
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
            onClose();
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
            borderRadius: '4px',
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
          onClose();
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
          borderRadius: '4px',
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
  );
};

