import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { OperatorNOTNodeData } from '../../types/nodes';
import { Minus, X, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface OperatorNOTNodeProps {
  data: OperatorNOTNodeData;
  selected?: boolean;
  id?: string;
}

export const OperatorNOTNode: React.FC<OperatorNOTNodeProps> = ({
  data,
  selected,
  id,
}) => {
  const { deleteNode, executeFromNode } = useCanvasStore();

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      await executeFromNode(id);
    }
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [includeInput, setIncludeInput] = useState(data.includeInput || { nodeId: 'input-a', results: [] });
  const [excludeInput, setExcludeInput] = useState(data.excludeInput || { nodeId: 'input-b', results: [] });
  const [exclusionStrategy, setExclusionStrategy] = useState<'mask' | 'penalize'>(data.exclusionStrategy || 'mask');
  const [similarityThreshold, setSimilarityThreshold] = useState(data.similarityThreshold || 0.70);
  const [outputCount, setOutputCount] = useState(9);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleApply = () => {
    // Mock exclusion - in real implementation, this would filter based on similarity
    const includeCount = includeInput.results?.length || 12;
    const excludeCount = excludeInput.results?.length || 3;
    setOutputCount(Math.max(0, includeCount - excludeCount));
  };

  // Calculate positions for connection handles based on expanded state
  const includeHandleY = isExpanded ? 180 : 40;
  const excludeHandleY = isExpanded ? 250 : 60;
  const outputHandleY = isExpanded ? 450 : 40;

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: isExpanded ? '400px' : '120px',
        minHeight: isExpanded ? '500px' : '80px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #FF6B6B' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: isExpanded ? '12px' : '8px',
        boxShadow: selected
          ? '0 0 0 2px #FF6B6B, 0 4px 12px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.05 : 1})`,
        position: 'relative',
        transition: 'width 0.3s ease, min-height 0.3s ease',
      }}
    >
      {/* Include Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="include"
        style={{
          left: isExpanded ? '-8px' : '-6px',
          top: `${includeHandleY}px`,
          width: isExpanded ? '16px' : '12px',
          height: isExpanded ? '16px' : '12px',
          background: '#32C864',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: isExpanded ? 'inset(0 50% 0 0)' : 'none',
        }}
      />

      {/* Exclude Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="exclude"
        style={{
          left: isExpanded ? '-8px' : '-6px',
          top: `${excludeHandleY}px`,
          width: isExpanded ? '16px' : '12px',
          height: isExpanded ? '16px' : '12px',
          background: '#FF6B6B',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: isExpanded ? 'inset(0 50% 0 0)' : 'none',
        }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          right: isExpanded ? '-8px' : '-6px',
          top: isExpanded ? `${outputHandleY}px` : '50%',
          width: isExpanded ? '16px' : '12px',
          height: isExpanded ? '16px' : '12px',
          background: '#FF6B6B',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: isExpanded ? 'inset(0 0 0 50%)' : 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: isExpanded ? '12px 16px' : '8px 12px',
          backgroundColor: '#FF6B6B',
          borderTopLeftRadius: isExpanded ? '12px' : '8px',
          borderTopRightRadius: isExpanded ? '12px' : '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isExpanded ? '8px' : '4px' }}>
          <Minus size={isExpanded ? 16 : 12} color="#000000" />
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: isExpanded ? '12px' : '10px',
              fontWeight: isExpanded ? 400 : 600,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isExpanded ? 'NOT - Exclude Bad Examples' : 'NOT'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '8px',
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            }}
          >
            <Play size={8} />
            RUN
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
          >
            {isExpanded ? <ChevronUp size={12} color="#000000" /> : <ChevronDown size={12} color="#000000" />}
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            }}
          >
            <X size={10} color="#000000" />
          </button>
        </div>
      </div>

      {/* Content - Collapsed */}
      {!isExpanded && (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '8px', color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
            2 inputs
          </div>
        </div>
      )}

      {/* Content - Expanded */}
      {isExpanded && (
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {/* INCLUDE (source results) */}
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
            INCLUDE (source results):
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(50,200,100,0.1)', borderRadius: '6px', border: '1px solid rgba(50,200,100,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#000000' }}>
              ◉ Input A: [Image Clip results] ({includeInput.results?.length || 12})
            </div>
          </div>
        </div>

        {/* EXCLUDE (negative examples) */}
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
            EXCLUDE (negative examples):
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#000000' }}>
              ◉ Input B: [Bad precedents] ({excludeInput.results?.length || 3} proj)
            </div>
          </div>
        </div>

        {/* Exclusion Strategy */}
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
            Exclusion Strategy:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                color: '#000000',
              }}
            >
              <input
                type="radio"
                checked={exclusionStrategy === 'mask'}
                onChange={() => setExclusionStrategy('mask')}
                onClick={(e) => e.stopPropagation()}
              />
              Mask (remove similar items)
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                color: '#000000',
              }}
            >
              <input
                type="radio"
                checked={exclusionStrategy === 'penalize'}
                onChange={() => setExclusionStrategy('penalize')}
                onClick={(e) => e.stopPropagation()}
              />
              Boost inverse (penalize similar)
            </label>
          </div>
        </div>

        {/* Similarity Threshold */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.7)' }}>
              Similarity Threshold:
            </span>
            <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.7)' }}>
              {similarityThreshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              appearance: 'none',
              background: `linear-gradient(to right, #FF6B6B 0%, #FF6B6B ${((similarityThreshold - 0.5) / 0.45) * 100}%, rgba(0,0,0,0.1) ${((similarityThreshold - 0.5) / 0.45) * 100}%, rgba(0,0,0,0.1) 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '9px', color: 'rgba(0,0,0,0.5)', marginTop: '4px' }}>
            Items to remove if &gt; threshold
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
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(0,0,0,0.7)' }}>
            ◉ {outputCount} projects ({(includeInput.results?.length || 12) - outputCount} removed as too similar)
          </div>
        </div>
        </div>
      )}

      {/* Footer: Action Buttons - Only when expanded */}
      {isExpanded && (
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
              handleApply();
            }}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#FF6B6B',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: '#000000',
            }}
          >
            Apply Exclusion
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Output to downstream nodes
            }}
            disabled={outputCount === 0}
            style={{
              padding: '8px 12px',
              backgroundColor: outputCount > 0 ? '#FF6B6B' : 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '4px',
              cursor: outputCount > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: '#000000',
            }}
          >
            → Output
          </button>
        </div>
      )}
    </div>
  );
};


