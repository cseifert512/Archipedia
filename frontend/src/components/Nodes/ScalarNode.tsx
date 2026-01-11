import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ScalarNodeData, ScalarConstraint } from '../../types/nodes';
import { Ruler, Plus, X, Play } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ScalarNodeProps {
  data: ScalarNodeData;
  selected?: boolean;
  id?: string;
}

const availableScalars = [
  { name: 'Floor Count', unit: 'floors', key: 'floorCount', defaultMin: 1, defaultMax: 10 },
  { name: 'Height', unit: 'm', key: 'heightM', defaultMin: 10, defaultMax: 100 },
  { name: 'WWR', unit: '%', key: 'wwr', defaultMin: 10, defaultMax: 80 },
  { name: 'Site Area', unit: 'm²', key: 'siteArea', defaultMin: 100, defaultMax: 10000 },
  { name: 'Density', unit: 'units/ha', key: 'density', defaultMin: 10, defaultMax: 200 },
];

export const ScalarNode: React.FC<ScalarNodeProps> = ({
  data,
  selected,
  id,
}) => {
  const { deleteNode, executeFromNode } = useCanvasStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      await executeFromNode(id);
    }
  };
  const [constraints, setConstraints] = useState<ScalarConstraint[]>(data.constraints || []);
  const [matchingCount, setMatchingCount] = useState(data.matchingCount || 0);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customMin, setCustomMin] = useState(0);
  const [customMax, setCustomMax] = useState(100);

  const addConstraint = (scalar: typeof availableScalars[0]) => {
    if (constraints.find(c => c.key === scalar.key)) return;
    setConstraints([...constraints, {
      name: scalar.name,
      min: scalar.defaultMin,
      max: scalar.defaultMax,
      unit: scalar.unit,
      key: scalar.key,
    }]);
  };

  const addCustomConstraint = () => {
    if (!customName.trim() || !customUnit.trim()) return;
    const key = `custom-${Date.now()}`;
    setConstraints([...constraints, {
      name: customName,
      min: customMin,
      max: customMax,
      unit: customUnit,
      key: key,
    }]);
    setCustomName('');
    setCustomUnit('');
    setCustomMin(0);
    setCustomMax(100);
    setShowCustomForm(false);
  };

  const removeConstraint = (key: string) => {
    setConstraints(constraints.filter(c => c.key !== key));
  };

  const updateConstraint = (key: string, field: 'min' | 'max', value: number) => {
    setConstraints(constraints.map(c => {
      if (c.key === key) {
        const updated = { ...c, [field]: value };
        // Ensure min <= max
        if (field === 'min' && updated.min > updated.max) {
          updated.max = updated.min;
        } else if (field === 'max' && updated.max < updated.min) {
          updated.min = updated.max;
        }
        return updated;
      }
      return c;
    }));
    // Mock matching count update
    setMatchingCount(Math.max(0, 34 - constraints.length * 4));
  };

  const handleApply = () => {
    // Mock apply - in real implementation, this would filter the input results
    setMatchingCount(Math.max(0, 34 - constraints.length * 4));
  };

  const availableToAdd = availableScalars.filter(s => !constraints.find(c => c.key === s.key));

  // Calculate positions for connection handles aligned with text labels
  const headerHeight = 48;
  const contentPadding = 16;
  // Input handle aligned with "INPUT: Results from upstream" text
  const inputSectionTop = headerHeight + contentPadding + 8; // Header + padding + margin to INPUT label
  const inputHandleY = inputSectionTop + 10; // Aligned with "INPUT: Results from upstream" text
  
  // OUTPUT section is near the bottom, align with "OUTPUT: Constrained Results" text
  // Calculate based on node height (500px) minus approximate footer/OUTPUT section position
  const nodeHeight = 500;
  const outputSectionTop = nodeHeight - 100; // Approximate position of OUTPUT section from top
  const outputHandleY = outputSectionTop + 10; // Aligned with "OUTPUT:" text

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '400px',
        minHeight: '500px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #4A90E2' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #4A90E2, 0 8px 32px rgba(0,0,0,0.2)'
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
            background: '#4A90E2',
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
            background: '#4A90E2',
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
          backgroundColor: '#4A90E2',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ruler size={16} color="#000000" />
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
            Constraints
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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
            ◉ Receives: Project list
          </div>
        </div>

        {/* PARAMETERS */}
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
            PARAMETERS:
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            {constraints.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.5)', textAlign: 'center', padding: '20px' }}>
                No constraints added. Click + to add.
              </div>
            ) : (
              constraints.map((constraint) => (
                <div key={constraint.key} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: '#000000', fontWeight: 400 }}>
                      {constraint.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeConstraint(constraint.key);
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
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '9px', color: 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>
                        Min:
                      </div>
                      <input
                        type="number"
                        value={constraint.min}
                        onChange={(e) => updateConstraint(constraint.key, 'min', parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '10px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-primary)', fontSize: '9px', color: 'rgba(0,0,0,0.5)', marginBottom: '4px' }}>
                        Max:
                      </div>
                      <input
                        type="number"
                        value={constraint.max}
                        onChange={(e) => updateConstraint(constraint.key, 'max', parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '10px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ fontFamily: 'var(--font-primary)', fontSize: '10px', color: 'rgba(0,0,0,0.5)', paddingTop: '20px' }}>
                      {constraint.unit}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#32C864',
                      borderRadius: '1px',
                      marginBottom: '4px',
                    }}
                  />
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '9px', color: 'rgba(0,0,0,0.5)' }}>
                    Matching: {matchingCount} precedents
                  </div>
                </div>
              ))
            )}
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableToAdd.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const scalar = availableScalars.find(s => s.key === e.target.value);
                      if (scalar) addConstraint(scalar);
                      e.target.value = '';
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '10px',
                    border: '1px dashed rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">+ Add from template...</option>
                  {availableToAdd.map((scalar) => (
                    <option key={scalar.key} value={scalar.key}>
                      {scalar.name} ({scalar.unit})
                    </option>
                  ))}
                </select>
              )}
              {!showCustomForm ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCustomForm(true);
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
                  Create Custom Parameter
                </button>
              ) : (
                <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Parameter name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '10px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., m, kg, %)"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '6px',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '10px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="Min"
                        value={customMin}
                        onChange={(e) => setCustomMin(parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '10px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={customMax}
                        onChange={(e) => setCustomMax(parseInt(e.target.value) || 100)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontFamily: 'var(--font-primary)',
                          fontSize: '10px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addCustomConstraint();
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        backgroundColor: '#32C864',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '10px',
                        color: '#000000',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomForm(false);
                        setCustomName('');
                        setCustomUnit('');
                        setCustomMin(0);
                        setCustomMax(100);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '10px',
                        color: '#000000',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OUTPUT: Constrained Results */}
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
            OUTPUT: Constrained Results
          </div>
          <div style={{ fontFamily: 'var(--font-primary)', fontSize: '11px', color: 'rgba(0,0,0,0.7)' }}>
            ◉ {matchingCount} projects match all constraints
          </div>
          <div
            style={{
              marginTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
            }}
          >
            {Array.from({ length: Math.min(matchingCount, 6) }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  backgroundColor: '#32C864',
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
            setConstraints([]);
            setMatchingCount(34);
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
            handleApply();
          }}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#32C864',
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
          disabled={matchingCount === 0}
          style={{
            padding: '8px 12px',
            backgroundColor: matchingCount > 0 ? '#32C864' : 'rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '4px',
            cursor: matchingCount > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-primary)',
            fontSize: '10px',
            color: '#000000',
          }}
        >
          → Output
        </button>
      </div>
    </div>
  );
};


