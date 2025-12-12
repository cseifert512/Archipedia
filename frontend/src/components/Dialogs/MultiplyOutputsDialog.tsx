import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ParameterMatrix } from '../../types/nodes';

interface MultiplyOutputsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (matrix: ParameterMatrix, layoutMode: 'grid' | 'horizontal' | 'vertical') => void;
}

export const MultiplyOutputsDialog: React.FC<MultiplyOutputsDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [axis1, setAxis1] = useState<string>('');
  const [axis2, setAxis2] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'horizontal' | 'vertical'>('grid');

  if (!open) return null;

  const handleConfirm = () => {
    const axis1Values = axis1.split(',').map((v) => v.trim()).filter(Boolean);
    const axis2Values = axis2.split(',').map((v) => v.trim()).filter(Boolean);

    if (axis1Values.length > 0 && axis2Values.length > 0) {
      onConfirm(
        {
          axis1: axis1Values,
          axis2: axis2Values,
        },
        layoutMode
      );
      onClose();
      setAxis1('');
      setAxis2('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1a1a',
            }}
          >
            Multiply Outputs
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1a1a1a',
              }}
            >
              Axis 1 (comma-separated):
            </label>
            <input
              type="text"
              value={axis1}
              onChange={(e) => setAxis1(e.target.value)}
              placeholder="e.g., Oak, Pine, Birch, Maple"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CCCCCC',
                borderRadius: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1a1a1a',
              }}
            >
              Axis 2 (comma-separated):
            </label>
            <input
              type="text"
              value={axis2}
              onChange={(e) => setAxis2(e.target.value)}
              placeholder="e.g., White, Grey, Beige"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #CCCCCC',
                borderRadius: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1a1a1a',
              }}
            >
              Layout Mode:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['grid', 'horizontal', 'vertical'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLayoutMode(mode)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: layoutMode === mode ? '#4CAF50' : 'rgba(0,0,0,0.05)',
                    color: layoutMode === mode ? 'white' : '#1a1a1a',
                    border: '1px solid #CCCCCC',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: '1px solid #CCCCCC',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Generate Nodes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

