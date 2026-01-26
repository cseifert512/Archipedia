import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { ValidateNodeData, ValidatedProjectData } from '../../types/nodes';
import { X, Play, Search, Loader2, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ValidateNodeProps {
  data: ValidateNodeData;
  selected?: boolean;
  id?: string;
}

export const ValidateNode: React.FC<ValidateNodeProps> = ({
  data,
  selected,
  id
}) => {
  const { deleteNode, updateNode, executeFromNode } = useCanvasStore();
  const [topK, setTopK] = useState(data.topK || 5);
  const [minSimilarity, setMinSimilarity] = useState(data.minSimilarity || 0.5);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      updateNode(id, { 
        topK, 
        minSimilarity,
        status: 'validating',
        error: undefined 
      });
      await executeFromNode(id);
    }
  };

  // Execution status
  const status = data.status || (data as any).executionStatus;
  const isValidating = status === 'validating' || status === 'running';
  const error = data.error || (data as any).executionError;
  
  // Get validated projects from executionResult or direct data
  const executionResult = (data as any).executionResult;
  const validatedProjects = executionResult?.validatedProjects || data.validatedProjects || [];
  const validationScore = executionResult?.validationScore || data.validationScore || 0;
  const inputImageUrl = data.inputImageUrl;

  // Calculate positions for connection handles
  const inputHandleY = 60;
  const outputHandleY = 280;

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '300px',
        minHeight: '300px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #4CAF50' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #4CAF50, 0 8px 32px rgba(0,0,0,0.2)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.02 : 1})`,
        fontFamily: 'var(--font-primary)',
        position: 'relative',
      }}
    >
      {/* Connection Handle - INPUT (Left side) */}
      <div
        style={{
          position: 'absolute',
          left: '-20px',
          top: `${inputHandleY}px`,
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="image-input"
          style={{
            width: '40px',
            height: '40px',
            background: 'transparent',
            border: 'none',
            position: 'relative',
          }}
        />
        <div
          style={{
            width: '12px',
            height: '12px',
            background: '#4CAF50',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            position: 'absolute',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Connection Handle - OUTPUT (Right side) */}
      <div
        style={{
          position: 'absolute',
          right: '-20px',
          top: `${outputHandleY}px`,
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      >
        <Handle
          type="source"
          position={Position.Right}
          id="results-output"
          style={{
            width: '40px',
            height: '40px',
            background: 'transparent',
            border: 'none',
            position: 'relative',
          }}
        />
        <div
          style={{
            width: '12px',
            height: '12px',
            background: '#4CAF50',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            position: 'absolute',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: '#4CAF50',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Search size={14} />
          FIND REAL PROJECTS
        </h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Status icon */}
          {isValidating && <Loader2 size={14} className="animate-spin" color="#FFFFFF" />}
          {status === 'error' && <AlertTriangle size={14} color="#FFFFFF" />}
          {status === 'complete' && <CheckCircle2 size={14} color="#FFFFFF" />}
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isValidating}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              cursor: isValidating ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: isValidating ? 0.5 : 0.9,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
              color: '#FFFFFF',
            }}
          >
            {isValidating ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                SEARCHING...
              </>
            ) : (
              <>
                <Play size={10} />
                VALIDATE
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
              transition: 'opacity 0.2s',
            }}
          >
            <X size={14} color="#FFFFFF" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <section
        style={{
          flex: '1',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {/* Input Preview */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e0e0e0',
              flexShrink: 0,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {inputImageUrl ? (
              <img
                src={inputImageUrl}
                alt="Input concept"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '10px', color: '#999', textAlign: 'center', padding: '8px' }}>
                Connect image input
              </span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                fontWeight: 500,
                color: '#666',
                marginBottom: '4px',
              }}
            >
              Your Concept
            </div>
            {validationScore > 0 && (
              <div
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#4CAF50',
                }}
              >
                {Math.round(validationScore * 100)}%
                <span style={{ fontSize: '10px', fontWeight: 400, color: '#666', marginLeft: '4px' }}>
                  validated
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Results
            </label>
            <select
              value={topK}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTopK(val);
                if (id) updateNode(id, { topK: val });
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '10px',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                background: '#fafafa',
              }}
            >
              <option value={3}>Top 3</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Min. Similarity
            </label>
            <select
              value={minSimilarity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMinSimilarity(val);
                if (id) updateNode(id, { minSimilarity: val });
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '10px',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                background: '#fafafa',
              }}
            >
              <option value={0.3}>30%</option>
              <option value={0.5}>50%</option>
              <option value={0.7}>70%</option>
            </select>
          </div>
        </div>

        {/* Similar Projects List */}
        {validatedProjects.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 500, color: '#666' }}>
              Similar Built Projects:
            </div>
            {validatedProjects.slice(0, topK).map((project, idx) => (
              <div
                key={project.project_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#f9f9f9',
                  border: '1px solid #eee',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#e0e0e0',
                  }}
                >
                  {project.thumb_url && (
                    <img
                      src={project.thumb_url}
                      alt={project.title || 'Project'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {project.title || project.project_id}
                  </div>
                  <div style={{ fontSize: '9px', color: '#888' }}>
                    {project.typology}
                    {project.country && ` • ${project.country}`}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#4CAF50',
                    flexShrink: 0,
                  }}
                >
                  {Math.round(project.similarity * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {status === 'error' && error && (
          <div
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,0,0,0.25)',
              backgroundColor: 'rgba(255,0,0,0.06)',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: 'rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Validation failed</div>
            <div style={{ opacity: 0.85 }}>{error}</div>
          </div>
        )}

        {/* Empty State */}
        {status !== 'validating' && validatedProjects.length === 0 && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: '16px',
              color: '#999',
              fontSize: '11px',
            }}
          >
            Connect an image and click Validate to find similar real projects
          </div>
        )}
      </section>
    </div>
  );
};

