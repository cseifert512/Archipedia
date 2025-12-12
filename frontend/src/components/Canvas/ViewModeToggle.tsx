import React from 'react';
import { LayoutGrid, Workflow } from 'lucide-react';

interface ViewModeToggleProps {
  mode: 'results' | 'workflow';
  onToggle: () => void;
  selectedCount?: number;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onToggle,
  selectedCount = 0,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          height: '36px',
          padding: '0 20px',
          backgroundColor: mode === 'results' ? '#FFC800' : 'transparent',
          color: mode === 'results' ? '#1a1a1a' : '#666666',
          border: mode === 'results' ? 'none' : '1px solid #E5E5E5',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-primary)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 150ms ease',
        }}
      >
        <LayoutGrid size={16} />
        Results
      </button>
      <button
        onClick={onToggle}
        style={{
          height: '36px',
          padding: '0 20px',
          backgroundColor: mode === 'workflow' ? '#4CAF50' : 'transparent',
          color: mode === 'workflow' ? 'white' : '#666666',
          border: mode === 'workflow' ? 'none' : '1px solid #E5E5E5',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-primary)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 150ms ease',
          position: 'relative',
        }}
      >
        <Workflow size={16} />
        Workflow
        {selectedCount > 0 && mode === 'results' && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#FFC800',
              color: '#1a1a1a',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {selectedCount}
          </span>
        )}
      </button>
    </div>
  );
};
