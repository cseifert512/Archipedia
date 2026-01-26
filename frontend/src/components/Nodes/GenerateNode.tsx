import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { GenerateNodeData, GeneratedImageData } from '../../types/nodes';
import { X, Play, Sparkles, Loader2, AlertTriangle, CheckCircle2, Check } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface GenerateNodeProps {
  data: GenerateNodeData;
  selected?: boolean;
  id?: string;
}

export const GenerateNode: React.FC<GenerateNodeProps> = ({
  data,
  selected,
  id
}) => {
  const { deleteNode, updateNode, executeFromNode } = useCanvasStore();
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [style, setStyle] = useState<'photorealistic' | 'render' | 'sketch'>(data.style || 'render');
  const [variationCount, setVariationCount] = useState<1 | 2 | 4>(data.variationCount || 4);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      // Sync current UI state to store before executing
      updateNode(id, { 
        prompt, 
        style, 
        variationCount,
        status: 'generating',
        error: undefined 
      });
      await executeFromNode(id);
    }
  };

  const handleSelectImage = useCallback((index: number) => {
    if (id) {
      updateNode(id, { selectedImageIndex: index });
    }
  }, [id, updateNode]);

  // Execution status
  const status = data.status || (data as any).executionStatus;
  const isGenerating = status === 'generating' || status === 'running';
  const error = data.error || (data as any).executionError;
  
  // Get generated images from executionResult or direct data
  const executionResult = (data as any).executionResult;
  const generatedImages = executionResult?.images || data.generatedImages || [];
  const selectedIndex = data.selectedImageIndex || 0;

  // Calculate positions for connection handles
  const inputHandleY = 60;
  const outputHandleY = 320;

  const styles = [
    { value: 'render', label: 'Render' },
    { value: 'photorealistic', label: 'Photo' },
    { value: 'sketch', label: 'Sketch' },
  ] as const;

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '320px',
        minHeight: '340px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #9D7BE8' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #9D7BE8, 0 8px 32px rgba(0,0,0,0.2)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.02 : 1})`,
        fontFamily: 'var(--font-primary)',
        position: 'relative',
      }}
    >
      {/* Connection Handle - INPUT (Left side) for style reference */}
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
          id="style-input"
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
            background: '#9D7BE8',
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
          id="image-output"
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
            background: '#9D7BE8',
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
          backgroundColor: '#9D7BE8',
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
          <Sparkles size={14} />
          GENERATE CONCEPT
        </h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Status icon */}
          {isGenerating && <Loader2 size={14} className="animate-spin" color="#FFFFFF" />}
          {status === 'error' && <AlertTriangle size={14} color="#FFFFFF" />}
          {status === 'complete' && <CheckCircle2 size={14} color="#FFFFFF" />}
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isGenerating || !prompt.trim()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: isGenerating || !prompt.trim() ? 0.5 : 0.9,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && prompt.trim()) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isGenerating || !prompt.trim() ? '0.5' : '0.9';
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <Play size={10} />
                GENERATE
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
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
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
        }}
      >
        {/* Prompt Input */}
        <div>
          <label
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
              display: 'block',
            }}
          >
            PROMPT:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (id) {
                updateNode(id, { prompt: e.target.value });
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Describe your architectural concept..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'Monaco, monospace',
              resize: 'none',
              height: '70px',
              background: '#fafafa',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#9D7BE8';
              e.target.style.background = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.background = '#fafafa';
            }}
          />
        </div>

        {/* Style Selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {styles.map(({ value, label }) => (
            <button
              key={value}
              onClick={(e) => {
                e.stopPropagation();
                setStyle(value);
                if (id) {
                  updateNode(id, { style: value });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '6px 12px',
                fontSize: '10px',
                fontFamily: 'var(--font-primary)',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: style === value ? '#9D7BE8' : '#f0f0f0',
                color: style === value ? '#FFFFFF' : '#666666',
              }}
            >
              {label}
            </button>
          ))}
          
          {/* Variation Count */}
          <select
            value={variationCount}
            onChange={(e) => {
              const val = parseInt(e.target.value) as 1 | 2 | 4;
              setVariationCount(val);
              if (id) {
                updateNode(id, { variationCount: val });
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '6px 8px',
              fontSize: '10px',
              fontFamily: 'var(--font-primary)',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              background: '#fafafa',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <option value={1}>1 variation</option>
            <option value={2}>2 variations</option>
            <option value={4}>4 variations</option>
          </select>
        </div>

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: generatedImages.length > 2 ? 'repeat(2, 1fr)' : `repeat(${generatedImages.length}, 1fr)`,
              gap: '8px',
            }}
          >
            {generatedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectImage(idx);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: selectedIndex === idx ? '2px solid #9D7BE8' : '2px solid transparent',
                  boxShadow: selectedIndex === idx ? '0 0 0 2px rgba(157, 123, 232, 0.3)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  background: '#f0f0f0',
                }}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={`Generated concept ${idx + 1}`}
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
                      background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
                    }}
                  >
                    <Sparkles size={20} color="#9D7BE8" />
                  </div>
                )}
                {selectedIndex === idx && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      background: '#9D7BE8',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={12} color="#FFFFFF" />
                  </div>
                )}
              </button>
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
              lineHeight: 1.35,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Generation failed</div>
            <div style={{ opacity: 0.85 }}>{error}</div>
          </div>
        )}

        {/* Success Summary */}
        {status === 'complete' && generatedImages.length > 0 && (
          <div
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: 'rgba(157, 123, 232, 0.08)',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: 'rgba(0,0,0,0.75)',
              textAlign: 'center',
            }}
          >
            Generated {generatedImages.length} concept{generatedImages.length > 1 ? 's' : ''} • Select one to use
          </div>
        )}
      </section>
    </div>
  );
};

