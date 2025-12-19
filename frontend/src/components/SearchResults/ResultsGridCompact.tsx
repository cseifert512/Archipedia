import React from 'react';
import { SearchResult } from '../../stores/searchStore';

interface ResultsGridCompactProps {
  projects: SearchResult[];
  weights: {
    visual: number;
    spatial: number;
    attribute: number;
  };
  onDragStart: (e: React.DragEvent, project: SearchResult) => void;
}

export const ResultsGridCompact: React.FC<ResultsGridCompactProps> = ({
  projects,
  weights,
  onDragStart,
}) => {
  // Calculate fused scores and rank
  const rankedProjects = [...projects]
    .map((p) => {
      const visual = (p.visualScore || 0.5) * (weights.visual / 100);
      const spatial = (p.spatialScore || 0.5) * (weights.spatial / 100);
      const attribute = (p.attributeScore || 0.5) * (weights.attribute / 100);
      const fusedScore = visual + spatial + attribute;
      return { ...p, fusedScore };
    })
    .sort((a, b) => (b.fusedScore || 0) - (a.fusedScore || 0));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        padding: '16px',
        flex: 1,
        overflowY: 'auto',
      }}
    >
      {rankedProjects.map((project) => (
        <div
          key={project.id}
          draggable
          onDragStart={(e) => onDragStart(e, project)}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Open project detail page in new tab
            const projectId = project.id || project.name || 'unknown';
            console.log('[DEBUG] Double-click opening project:', projectId);
            window.open(`/project/${encodeURIComponent(projectId)}`, '_blank');
          }}
          className="group"
          style={{
            aspectRatio: '1',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.1)',
            cursor: 'grab',
            transition: 'all 200ms ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            e.currentTarget.style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
            {project.url || project.imageUrl ? (
              <img
                src={project.url || project.imageUrl}
                alt={project.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#FFC800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '32px',
                }}
              >
                📐
              </div>
            )}

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
                  height: '2px',
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

            {/* Hover Content */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5), transparent)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                pointerEvents: 'none',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '10px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  margin: '0 0 4px 0',
                }}
              >
                {project.name}
              </h4>
              <div
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '8px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {Math.round((project.fusedScore || 0) * 100)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

