import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { AttributeFilterNodeData } from '../../types/nodes';
import { Filter, X, Play } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface AttributeFilterNodeProps {
  data: AttributeFilterNodeData;
  selected?: boolean;
  id?: string;
}

export const AttributeFilterNode: React.FC<AttributeFilterNodeProps> = ({
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
  const [weights, setWeights] = useState(data.weights || { visual: 40, spatial: 10, regional: 50 });
  const [keywords, setKeywords] = useState(data.keywords || '');
  const [inputCount, setInputCount] = useState(12);
  const [outputCount, setOutputCount] = useState(8);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleWeightChange = (key: 'visual' | 'spatial' | 'regional', value: number) => {
    const newWeights = { ...weights, [key]: value };
    const total = newWeights.visual + newWeights.spatial + newWeights.regional;
    if (total > 0) {
      setWeights({
        visual: Math.round((newWeights.visual / total) * 100),
        spatial: Math.round((newWeights.spatial / total) * 100),
        regional: Math.round((newWeights.regional / total) * 100),
      });
    }
  };

  const handleApplyFilters = () => {
    // Mock filter application based on keywords
    if (keywords.trim()) {
      // Simulate filtering based on keywords
      const keywordCount = keywords.split(/\s+/).length;
      setOutputCount(Math.max(0, inputCount - keywordCount * 2));
    } else {
      setOutputCount(inputCount);
    }
  };

  // Calculate positions for connection handles aligned with text labels
  const headerHeight = 48;
  const contentPadding = 16;
  const inputSectionTop = headerHeight + contentPadding + 8; // Header + padding + margin to INPUT label
  const inputHandleY = inputSectionTop + 10; // Aligned with "INPUT: Results from upstream" text
  
  // OUTPUT section is near the bottom, align with "OUTPUT: Filtered Results" text
  // Calculate based on content sections: INPUT + FUSION WEIGHTS + KEYWORD + OUTPUT
  const inputSectionHeight = 40;
  const fusionWeightsHeight = 120;
  const keywordSectionHeight = 60;
  const outputSectionTop = headerHeight + contentPadding + inputSectionHeight + fusionWeightsHeight + keywordSectionHeight + 16 + 8;
  // OUTPUT section starts at outputSectionTop, text is at +8px, so handle should be at +18px to align with text
  const outputHandleY = outputSectionTop + 18; // Aligned with "OUTPUT: Filtered Results" text

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '400px',
        minHeight: '450px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #90EE90' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #90EE90, 0 8px 32px rgba(0,0,0,0.2)'
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
            background: '#90EE90',
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
            background: '#90EE90',
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
          backgroundColor: '#90EE90',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#000000" />
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Attributes - Fusion Weights
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '8px', right: '8px' }}>
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: 0.7,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
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
            <Play size={10} />
            RUN
          </button>
          <button
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.05)',
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
              e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            }}
          >
            <X size={14} color="#000000" />
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
            ◉ Receives: Project list ({inputCount} items)
          </div>
        </div>

        {/* FUSION WEIGHTS */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            FUSION WEIGHTS:
          </div>
          {[
            { key: 'visual' as const, label: 'Visual', color: '#FFC800', description: 'Similarity to visual reference' },
            { key: 'spatial' as const, label: 'Spatial', color: '#64B5FF', description: 'Circulation, corridor ratio, etc' },
            { key: 'regional' as const, label: 'Regional', color: '#32C864', description: 'Climate, geography, typology' },
          ].map((slider) => (
            <div key={slider.key} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#000000' }}>
                  {slider.label} [{weights[slider.key]}%]
                </span>
              </div>
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ position: 'relative' }}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[slider.key]}
                  onChange={(e) => handleWeightChange(slider.key, parseInt(e.target.value))}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    background: `linear-gradient(to right, ${slider.color} 0%, ${slider.color} ${weights[slider.key]}%, rgba(0,0,0,0.1) ${weights[slider.key]}%, rgba(0,0,0,0.1) 100%)`,
                    outline: 'none',
                    cursor: 'grab',
                    marginBottom: '4px',
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 10,
                  }}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      e.stopPropagation();
                    }
                  }}
                />
              </div>
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: '9px', color: 'rgba(0,0,0,0.5)' }}>
                ◉ {slider.description}
              </div>
            </div>
          ))}
        </div>

        {/* Keyword Search */}
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
            Keyword Search:
          </div>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Enter keywords (e.g., mediterranean, stone, courtyard...)"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              backgroundColor: 'white',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#90EE90';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,0,0,0.1)';
            }}
          />
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
            ◉ {outputCount} results ({inputCount - outputCount} filtered out)
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
            setWeights({ visual: 33, spatial: 33, regional: 34 });
            setKeywords('');
            setOutputCount(inputCount);
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-primary)',
            fontSize: '10px',
            color: '#000000',
          }}
        >
          Reset
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleApplyFilters();
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#90EE90',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-primary)',
            fontSize: '10px',
            color: '#000000',
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};


