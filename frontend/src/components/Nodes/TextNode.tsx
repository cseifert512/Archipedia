import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { TextNodeData } from '../../types/nodes';
import { X, Play } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface TextNodeProps {
  data: TextNodeData;
  selected?: boolean;
  id?: string;
}

export const TextNode: React.FC<TextNodeProps> = ({
  data,
  selected,
  id
}) => {
  const { deleteNode, executeFromNode } = useCanvasStore();
  const [textValue, setTextValue] = useState(data.content || '');

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

  // Calculate positions for connection handles
  const inputHandleY = 60; // After header
  const outputHandleY = 200; // After content section

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '320px',
        minHeight: '400px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #F5F1E8' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #F5F1E8, 0 8px 32px rgba(0,0,0,0.2)'
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
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          left: '-8px',
          top: `${inputHandleY}px`,
          width: '16px',
          height: '16px',
          background: '#F5F1E8',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: 'inset(0 50% 0 0)',
        }}
      />

      {/* Connection Handle - OUTPUT (Right side) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          right: '-8px',
          top: `${outputHandleY}px`,
          width: '16px',
          height: '16px',
          background: '#F5F1E8',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: 'inset(0 0 0 50%)',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #F5F1E8',
          backgroundColor: '#F5F1E8',
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
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          TEXT
        </h3>
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

      {/* Content Section */}
      <section
        style={{
          flex: '1',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
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
          CONTENT:
        </div>
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Enter text content..."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'Monaco, monospace',
            resize: 'vertical',
            minHeight: '150px',
            flex: '1',
            background: '#fafafa',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#F5F1E8';
            e.target.style.background = 'white';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e0e0e0';
            e.target.style.background = '#fafafa';
          }}
        />
      </section>
    </div>
  );
};
