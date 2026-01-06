import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { ResultsNodeData } from '../../types/nodes';
import { Grid3x3, X, Play, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ResultsNodeProps {
  data: ResultsNodeData;
  selected?: boolean;
  id?: string;
}

export const ResultsNode: React.FC<ResultsNodeProps> = ({
  data,
  selected,
  id,
}) => {
  const { deleteNode, executeFromNode, nodes } = useCanvasStore();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [resultCount, setResultCount] = useState(data.resultCount || 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Watch for execution results
  useEffect(() => {
    if (id) {
      const node = nodes.find(n => n.id === id);
      if (node?.data) {
        const nodeData = node.data as any;
        if (nodeData.executionStatus === 'success') {
          setStatus('success');
          setResultCount(nodeData.executionResult?.count || nodeData.executionResult?.results?.length || nodeData.resultCount || 0);
          setErrorMessage(null);
        } else if (nodeData.executionStatus === 'error') {
          setStatus('error');
          setErrorMessage(nodeData.executionError || 'Execution failed');
        } else if (nodeData.executionStatus === 'running') {
          setStatus('running');
        }
      }
    }
  }, [id, nodes]);

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      setStatus('running');
      setErrorMessage(null);
      try {
        await executeFromNode(id);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Execution failed');
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  // Calculate positions for connection handles aligned with text labels
  const headerHeight = 48;
  const contentPadding = 16;
  const inputSectionTop = headerHeight + contentPadding + 8; // Header + padding + margin to INPUT label
  const inputHandleY = inputSectionTop + 10; // Aligned with "INPUT: Results from upstream" text
  
  // OUTPUT section is further down, calculate its position
  const inputSectionHeight = 40; // Approximate height of INPUT section
  const outputSectionTop = headerHeight + contentPadding + inputSectionHeight + 16 + 8; // After INPUT section + gap
  const outputHandleY = outputSectionTop + 10; // Aligned with "OUTPUT: Filtered Results" text

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '400px',
        minHeight: '400px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #7B68EE' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #7B68EE, 0 8px 32px rgba(0,0,0,0.2)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.02 : 1})`,
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
          id="input"
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
            background: '#7B68EE',
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
          id="output"
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
            background: '#7B68EE',
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
          backgroundColor: '#7B68EE',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Grid3x3 size={16} color="#FFFFFF" />
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              fontWeight: 400,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Results Node
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '8px', right: '8px' }}>
          {status === 'running' && <Loader2 size={14} className="animate-spin" color="#FFFFFF" />}
          {status === 'error' && <AlertTriangle size={14} color="#ef4444" />}
          {status === 'success' && <CheckCircle2 size={14} color="#22c55e" />}
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={status === 'running'}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'running' ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: status === 'running' ? 0.5 : 0.9,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (status !== 'running') {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = status === 'running' ? '0.5' : '0.9';
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <Play size={10} />
            RUN
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
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <X size={14} color="#FFFFFF" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {/* INPUT: Results from upstream */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            INPUT: Results from upstream
          </div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(0,0,0,0.7)' }}>
            ◉ Receives: Project list ({resultCount} items)
          </div>
        </div>

        {/* OUTPUT: Filtered Results */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            OUTPUT: Filtered Results
          </div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(0,0,0,0.7)', marginBottom: '8px' }}>
            ◉ {resultCount} results
          </div>
          <div
            style={{
              marginTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  backgroundColor: '#7B68EE',
                  borderRadius: '4px',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Action Buttons */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Output to downstream nodes
          }}
          disabled={resultCount === 0}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: resultCount > 0 ? '#7B68EE' : 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '4px',
            cursor: resultCount > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-primary)',
            fontSize: '10px',
            color: resultCount > 0 ? '#FFFFFF' : '#000000',
          }}
        >
          → Output
        </button>
      </div>
    </div>
  );
};



