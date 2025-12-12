import React from 'react';
import { SearchResult } from '../../stores/searchStore';
import { Image } from 'lucide-react';

interface ResultCardProps {
  project: SearchResult;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onDragStart?: (e: React.DragEvent, project: SearchResult) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  project,
  selected,
  onSelect,
  onDragStart,
}) => {
  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(project.id, !selected);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, project);
    } else {
      e.dataTransfer.setData(
        'application/archipedia-precedent',
        JSON.stringify(project)
      );
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        border: selected ? '2px solid #FFC800' : 'none',
        boxShadow: selected
          ? '0 4px 16px rgba(255, 200, 0, 0.3)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'move',
        transition: 'all 200ms ease',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          width: '24px',
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '6px',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
        onClick={handleCheckboxChange}
      >
        {selected && (
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#FFC800',
              borderRadius: '2px',
            }}
          />
        )}
      </div>

      <div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          backgroundColor: '#FFC800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Image size={48} color="#1a1a1a" />
        {project.matchPercentage && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.75)',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '6px',
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {project.matchPercentage}%
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '16px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '4px',
          }}
        >
          {project.name}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#666666',
            lineHeight: '1.4',
          }}
        >
          {project.architect}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: '#999999',
            marginTop: '4px',
          }}
        >
          {project.location} • {project.year}
        </p>
      </div>
    </div>
  );
};

