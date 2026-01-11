import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { OperatorANDNodeData } from '../../types/nodes';
import { Circle, Plus, X, ChevronDown, ChevronUp, Play, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface OperatorANDNodeProps {
  data: OperatorANDNodeData;
  selected?: boolean;
  id?: string;
}

export const OperatorANDNode: React.FC<OperatorANDNodeProps> = ({
  data,
  selected,
  id,
}) => {
  const { deleteNode, executeFromNode, nodes } = useCanvasStore();
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [resultCount, setResultCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Watch for execution results
  useEffect(() => {
    if (id) {
      const node = nodes.find(n => n.id === id);
      if (node?.data) {
        const nodeData = node.data as any;
        // executionStatus is stored separately from executionResult (which is just outputs)
        if (nodeData.executionStatus === 'success') {
          setStatus('success');
          setResultCount(nodeData.executionResult?.count || nodeData.executionResult?.results?.length || 0);
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputs, setInputs] = useState(data.inputData || [
    { nodeId: 'input-a', weight: 60, results: [] },
    { nodeId: 'input-b', weight: 40, results: [] },
  ]);
  const [logic, setLogic] = useState<'weightedSum' | 'product'>(data.logic || 'weightedSum');
  const [outputCount, setOutputCount] = useState(6);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const updateWeight = (index: number, weight: number) => {
    const newInputs = [...inputs];
    newInputs[index].weight = weight;
    // Normalize weights
    const total = newInputs.reduce((sum, inp) => sum + inp.weight, 0);
    if (total > 0) {
      newInputs.forEach(inp => {
        inp.weight = Math.round((inp.weight / total) * 100);
      });
    }
    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, { nodeId: `input-${inputs.length + 1}`, weight: 0, results: [] }]);
  };

  const removeInput = (index: number) => {
    if (inputs.length > 2) {
      const newInputs = inputs.filter((_, i) => i !== index);
      // Renormalize
      const total = newInputs.reduce((sum, inp) => sum + inp.weight, 0);
      if (total > 0) {
        newInputs.forEach(inp => {
          inp.weight = Math.round((inp.weight / total) * 100);
        });
      }
      setInputs(newInputs);
    }
  };

  const handleApply = () => {
    // Mock combination - in real implementation, this would combine results
    setOutputCount(Math.min(...inputs.map(inp => inp.results?.length || 12)));
  };

  // Calculate positions for connection handles aligned with text labels
  const headerHeight = isExpanded ? 48 : 32;
  const currentMinHeight = isExpanded 
    ? Math.max(500, headerHeight + 100 + inputs.length * 60)
    : Math.max(90, headerHeight + 20 + inputs.length * 20);
  
  let inputHandleYPositions: number[];
  let outputHandleY: number;
  
  if (isExpanded) {
    // Expanded view: align with INPUTS and OUTPUT text labels
    const contentPadding = 16;
    const inputsSectionTop = headerHeight + contentPadding + 8; // Header + padding + margin to INPUTS label
    const inputSpacing = 30;
    const firstInputY = inputsSectionTop + 10; // Aligned with "INPUTS:" text
    
    inputHandleYPositions = inputs.map((_, index) => 
      firstInputY + index * inputSpacing
    );
    
    // OUTPUT section is near the bottom, align with "OUTPUT: Combined Results" text
    const outputSectionTop = currentMinHeight - 80; // Approximate position of OUTPUT section
    outputHandleY = outputSectionTop + 10; // Aligned with "OUTPUT:" text
  } else {
    // Collapsed view: center inputs
    const contentStartY = headerHeight;
    const contentHeight = currentMinHeight - headerHeight;
    const contentCenterY = contentStartY + contentHeight / 2;
    const inputSpacing = 20;
    const totalInputHeight = inputs.length > 1 ? (inputs.length - 1) * inputSpacing : 0;
    const firstInputY = contentCenterY - (totalInputHeight / 2);
    
    inputHandleYPositions = inputs.map((_, index) => 
      firstInputY + index * inputSpacing
    );
    
    outputHandleY = contentCenterY;
  }

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: isExpanded ? '400px' : '180px',
        minHeight: isExpanded 
          ? `${Math.max(500, headerHeight + 100 + inputs.length * 60)}px` 
          : `${Math.max(90, headerHeight + 20 + inputs.length * 20)}px`,
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #FF9F43' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: isExpanded ? '12px' : '8px',
        boxShadow: selected
          ? '0 0 0 2px #FF9F43, 0 4px 12px rgba(0,0,0,0.15)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.05 : 1})`,
        position: 'relative',
        transition: 'width 0.3s ease, min-height 0.3s ease',
      }}
    >
      {/* Multiple Input Handles */}
      {inputs.map((_, index) => (
        <div
          key={`input-wrapper-${index}`}
          style={{
            position: 'absolute',
            left: '-20px',
            top: `${inputHandleYPositions[index]}px`,
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
            key={`input-${index}`}
            type="target"
            position={Position.Left}
            id={`input-${index}`}
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
              background: '#FF9F43',
              border: '2px solid #FFFFFF',
              borderRadius: '50%',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        </div>
      ))}
      
      {/* Output Handle */}
      <div
        style={{
          position: 'absolute',
          right: '-20px',
          top: isExpanded ? `${outputHandleY}px` : '50%',
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
            background: '#FF9F43',
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
          padding: isExpanded ? '12px 16px' : '8px 12px',
          backgroundColor: '#FF9F43',
          borderTopLeftRadius: isExpanded ? '12px' : '8px',
          borderTopRightRadius: isExpanded ? '12px' : '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isExpanded ? '8px' : '4px' }}>
          <Circle size={isExpanded ? 16 : 12} color="#000000" />
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
            {isExpanded ? 'AND - Combine Results' : 'AND'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {status === 'running' && <Loader2 size={14} className="animate-spin" color="#000" />}
          {status === 'error' && <AlertTriangle size={14} color="#ef4444" />}
          {status === 'success' && <CheckCircle2 size={14} color="#22c55e" />}
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={status === 'running'}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '3px',
              cursor: status === 'running' ? 'not-allowed' : 'pointer',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              opacity: status === 'running' ? 0.5 : 0.7,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '8px',
              color: '#000000',
            }}
            onMouseEnter={(e) => {
              if (status !== 'running') {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = status === 'running' ? '0.5' : '0.7';
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
            {inputs.length} inputs
          </div>
          {status === 'error' && errorMessage && (
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '8px', color: '#ef4444', textAlign: 'center' }}>
              {errorMessage}
            </div>
          )}
          {status === 'success' && resultCount > 0 && (
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '8px', color: '#22c55e', textAlign: 'center' }}>
              {resultCount} results
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addInput();
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: '1px dashed rgba(0,0,0,0.2)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '8px',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <Plus size={8} />
            Add
          </button>
        </div>
      )}

      {/* Content - Expanded */}
      {isExpanded && (
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* INPUTS */}
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
              INPUTS:
            </div>
            {inputs.map((input, index) => (
              <div key={input.nodeId} style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#000000' }}>
                    Input {String.fromCharCode(65 + index)}: ({input.results?.length || 12} proj)
                  </span>
                  {inputs.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeInput(index);
                      }}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: 'rgba(255,0,0,0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={12} color="#000000" />
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.7)' }}>
                      Weight:
                    </span>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.7)' }}>
                      {input.weight}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={input.weight}
                    onChange={(e) => updateWeight(index, parseInt(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      height: '4px',
                      borderRadius: '2px',
                      appearance: 'none',
                      background: `linear-gradient(to right, #FF9F43 0%, #FF9F43 ${input.weight}%, rgba(0,0,0,0.1) ${input.weight}%, rgba(0,0,0,0.1) 100%)`,
                      outline: 'none',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addInput();
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: '1px dashed rgba(0,0,0,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Plus size={12} />
              Add Input
            </button>
          </div>

          {/* Logic */}
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
              Logic:
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
                  checked={logic === 'weightedSum'}
                  onChange={() => setLogic('weightedSum')}
                  onClick={(e) => e.stopPropagation()}
                />
                Weighted Sum
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
                  checked={logic === 'product'}
                  onChange={() => setLogic('product')}
                  onClick={(e) => e.stopPropagation()}
                />
                Product
              </label>
            </div>
          </div>

          {/* OUTPUT: Combined Results */}
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
              OUTPUT: Combined Results
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(0,0,0,0.7)', marginBottom: '8px' }}>
              ◉ {outputCount} projects in both sets (intersection)
            </div>
            <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.5)' }}>
              Final score = {inputs.map((inp, i) => `${(inp.weight / 100).toFixed(1)}×${String.fromCharCode(65 + i)}_score`).join(' + ')}
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
              backgroundColor: '#FF9F43',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: '#000000',
            }}
          >
            Apply
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Output to downstream nodes
            }}
            disabled={outputCount === 0}
            style={{
              padding: '8px 12px',
              backgroundColor: outputCount > 0 ? '#FF9F43' : 'rgba(0,0,0,0.1)',
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

