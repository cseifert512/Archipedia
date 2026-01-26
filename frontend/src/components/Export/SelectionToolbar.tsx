import React from 'react';
import { Download, X, CheckSquare, Square } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import type { SearchResultData } from '../ClassicSearch';

interface SelectionToolbarProps {
  allResults: SearchResultData[];
  onExport: () => void;
}

export function SelectionToolbar({ allResults, onExport }: SelectionToolbarProps) {
  const { 
    getSelectedCount, 
    clearSelection, 
    selectAll, 
    isSelectionMode,
    setSelectionMode,
  } = useSelectionStore();
  
  const selectedCount = getSelectedCount();
  const totalCount = allResults.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  if (!isSelectionMode && selectedCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        zIndex: 100,
      }}
    >
      {/* Selection Count */}
      <span
        style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '14px',
          fontWeight: 500,
          color: 'white',
        }}
      >
        {selectedCount} selected
      </span>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      />

      {/* Select All / Deselect All */}
      <button
        onClick={() => {
          if (allSelected) {
            clearSelection();
          } else {
            selectAll(allResults);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'var(--font-secondary)',
          fontSize: '13px',
          color: 'white',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
      >
        {allSelected ? (
          <>
            <Square size={14} />
            Deselect All
          </>
        ) : (
          <>
            <CheckSquare size={14} />
            Select All ({totalCount})
          </>
        )}
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        disabled={selectedCount === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          backgroundColor: selectedCount > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '6px',
          cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          color: 'white',
          transition: 'all 150ms',
          opacity: selectedCount > 0 ? 1 : 0.5,
        }}
      >
        <Download size={14} />
        Export PDF
      </button>

      {/* Close / Clear Selection */}
      <button
        onClick={() => {
          clearSelection();
          setSelectionMode(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          color: 'white',
          transition: 'background-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
        title="Clear selection"
      >
        <X size={14} />
      </button>
    </div>
  );
}



