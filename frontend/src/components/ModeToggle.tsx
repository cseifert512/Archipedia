import React from 'react';

interface ModeToggleProps {
  mode: 'search' | 'workflow';
  onChange: (mode: 'search' | 'workflow') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: '6px',
      }}
    >
      <button
        onClick={() => onChange('search')}
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: '4px',
          border: 'none',
          fontFamily: 'var(--font-primary)',
          fontSize: '11px',
          fontWeight: 400,
          backgroundColor: mode === 'search' ? '#FFC800' : 'transparent',
          color: '#000000',
          cursor: 'pointer',
          transition: 'all 200ms ease',
        }}
      >
        🔍 Research
      </button>
    </div>
  );
};

