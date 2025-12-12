import React from 'react';
import { SearchResult } from '../../stores/searchStore';
import { LensFrame } from '../LensFrame';

interface ResultCardCompactProps {
  project: SearchResult;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  fusionWeights?: {
    visual: number;
    spatial: number;
    attribute: number;
  };
}

export const ResultCardCompact: React.FC<ResultCardCompactProps> = ({
  project,
  onClick,
  onDragStart,
  fusionWeights,
}) => {
  // Calculate fused score if weights provided
  const fusedScore = fusionWeights && project.visualScore !== undefined
    ? (project.visualScore || 0) * (fusionWeights.visual / 100) +
      (project.spatialScore || 0) * (fusionWeights.spatial / 100) +
      (project.attributeScore || 0) * (fusionWeights.attribute / 100)
    : project.matchPercentage ? project.matchPercentage / 100 : 0;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <LensFrame
        style={{
          padding: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: '80px',
              height: '80px',
              minWidth: '80px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#FFC800',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {project.url || project.imageUrl ? (
              <img
                src={project.url || project.imageUrl}
                alt={project.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFC800',
                  color: '#000',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '24px',
                }}
              >
                📐
              </div>
            )}
            {/* Match Score Badge */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: '#FFC800',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: '1.2',
              }}
            >
              {Math.round(fusedScore * 100)}%
            </div>

            {/* Activation Overlay Bars */}
            {project.visualScore !== undefined && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  gap: '0px',
                  height: '3px',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#FFC800',
                    opacity: Math.max(0.3, project.visualScore || 0),
                    transition: 'opacity 300ms ease',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#64B5FF',
                    opacity: Math.max(0.3, project.spatialScore || 0),
                    transition: 'opacity 300ms ease',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#32C864',
                    opacity: Math.max(0.3, project.attributeScore || 0),
                    transition: 'opacity 300ms ease',
                  }}
                />
              </div>
            )}
          </div>

          {/* Project Info */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '14px',
                fontWeight: 600,
                color: '#000000',
                margin: 0,
                marginBottom: '4px',
                lineHeight: '1.3',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.7)',
                margin: 0,
                marginBottom: '2px',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.architect}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '11px',
                color: 'rgba(0,0,0,0.5)',
                margin: 0,
                lineHeight: '1.4',
              }}
            >
              {project.location} • {project.year}
            </p>
          </div>
        </div>
      </LensFrame>
    </div>
  );
};

