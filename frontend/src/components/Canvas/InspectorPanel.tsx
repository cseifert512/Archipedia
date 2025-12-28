import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, ArrowUp, ArrowDown } from 'lucide-react';
import { Editor, TLShape, TLShapeId } from 'tldraw';

interface InspectorPanelProps {
  editor: Editor | null;
  onClose: () => void;
}

export function InspectorPanel({ editor, onClose }: InspectorPanelProps) {
  const [selectedShapes, setSelectedShapes] = useState<TLShape[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for selection changes
  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const shapes = editor.getSelectedShapes();
      setSelectedShapes(shapes);
      setForceUpdate((n) => n + 1);
    };

    updateSelection();
    
    // Listen for changes
    const unsubscribe = editor.store.listen(updateSelection);
    
    return () => {
      unsubscribe();
    };
  }, [editor]);

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  return (
    <div
      style={{
        width: 300,
        backgroundColor: 'white',
        borderLeft: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 600 }}>
          Inspector
        </span>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {selectedShapes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 12, margin: 0 }}>
              Select an object to view properties
            </p>
          </div>
        ) : selectedShapes.length > 1 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(0,0,0,0.6)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 13, margin: 0 }}>
              {selectedShapes.length} objects selected
            </p>
          </div>
        ) : selectedShape ? (
          <ShapeInspector
            key={selectedShape.id + forceUpdate}
            editor={editor!}
            shape={selectedShape}
          />
        ) : null}
      </div>
    </div>
  );
}

// Shape-specific inspector
function ShapeInspector({ editor, shape }: { editor: Editor; shape: TLShape }) {
  const [position, setPosition] = useState({ x: shape.x, y: shape.y });
  const [size, setSize] = useState({ w: (shape.props as any).w || 100, h: (shape.props as any).h || 100 });
  const [isLocked, setIsLocked] = useState(shape.isLocked);

  useEffect(() => {
    setPosition({ x: shape.x, y: shape.y });
    setSize({ w: (shape.props as any).w || 100, h: (shape.props as any).h || 100 });
    setIsLocked(shape.isLocked);
  }, [shape]);

  const updatePosition = (axis: 'x' | 'y', value: number) => {
    const newPos = { ...position, [axis]: value };
    setPosition(newPos);
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      x: newPos.x,
      y: newPos.y,
    });
  };

  const updateSize = (dim: 'w' | 'h', value: number) => {
    const newSize = { ...size, [dim]: value };
    setSize(newSize);
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { [dim]: value },
    });
  };

  const toggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      isLocked: newLocked,
    });
  };

  const bringToFront = () => {
    editor.bringToFront([shape.id]);
  };

  const sendToBack = () => {
    editor.sendToBack([shape.id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Shape Type */}
      <div>
        <label style={labelStyle}>Type</label>
        <div style={{ fontFamily: 'var(--font-secondary)', fontSize: 13, textTransform: 'capitalize' }}>
          {shape.type.replace('-', ' ')}
        </div>
      </div>

      {/* Position */}
      <div>
        <label style={labelStyle}>Position</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={subLabelStyle}>X</span>
            <input
              type="number"
              value={Math.round(position.x)}
              onChange={(e) => updatePosition('x', parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={subLabelStyle}>Y</span>
            <input
              type="number"
              value={Math.round(position.y)}
              onChange={(e) => updatePosition('y', parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Size */}
      {'w' in shape.props && (
        <div>
          <label style={labelStyle}>Size</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>W</span>
              <input
                type="number"
                value={Math.round(size.w)}
                onChange={(e) => updateSize('w', parseFloat(e.target.value) || 100)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>H</span>
              <input
                type="number"
                value={Math.round(size.h)}
                onChange={(e) => updateSize('h', parseFloat(e.target.value) || 100)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <label style={labelStyle}>Actions</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleLock} style={actionButtonStyle}>
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button onClick={bringToFront} style={actionButtonStyle} title="Bring to Front">
            <ArrowUp size={14} />
          </button>
          <button onClick={sendToBack} style={actionButtonStyle} title="Send to Back">
            <ArrowDown size={14} />
          </button>
        </div>
      </div>

      {/* Shape-specific properties */}
      {shape.type === 'reference-card' && (
        <ReferenceCardProps editor={editor} shape={shape} />
      )}

      {shape.type === 'frame' && (
        <FrameProps editor={editor} shape={shape} />
      )}

      {shape.type === 'text-block' && (
        <TextBlockProps editor={editor} shape={shape} />
      )}
    </div>
  );
}

// Reference card specific properties
function ReferenceCardProps({ editor, shape }: { editor: Editor; shape: TLShape }) {
  const props = shape.props as any;
  const [caption, setCaption] = useState(props.caption || '');

  const updateProp = (key: string, value: any) => {
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { [key]: value },
    });
  };

  return (
    <>
      <div>
        <label style={labelStyle}>Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            updateProp('caption', e.target.value);
          }}
          placeholder="Add a caption..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Display</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.showTitle}
              onChange={(e) => updateProp('showTitle', e.target.checked)}
            />
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: 12 }}>Show title</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.showMeta}
              onChange={(e) => updateProp('showMeta', e.target.checked)}
            />
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: 12 }}>Show metadata</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.showCaption}
              onChange={(e) => updateProp('showCaption', e.target.checked)}
            />
            <span style={{ fontFamily: 'var(--font-secondary)', fontSize: 12 }}>Show caption</span>
          </label>
        </div>
      </div>
    </>
  );
}

// Frame specific properties
function FrameProps({ editor, shape }: { editor: Editor; shape: TLShape }) {
  const props = shape.props as any;
  const [title, setTitle] = useState(props.title || '');

  const updateProp = (key: string, value: any) => {
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { [key]: value },
    });
  };

  return (
    <>
      <div>
        <label style={labelStyle}>Frame Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            updateProp('title', e.target.value);
          }}
          placeholder="Frame title..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Preset</label>
        <select
          value={props.preset}
          onChange={(e) => updateProp('preset', e.target.value)}
          style={inputStyle}
        >
          <option value="16:9">16:9 (1920×1080)</option>
          <option value="4:3">4:3 (1600×1200)</option>
          <option value="letter">Letter (2550×3300)</option>
        </select>
      </div>
    </>
  );
}

// Text block specific properties
function TextBlockProps({ editor, shape }: { editor: Editor; shape: TLShape }) {
  const props = shape.props as any;
  const [text, setText] = useState(props.text || '');

  const updateProp = (key: string, value: any) => {
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { [key]: value },
    });
  };

  return (
    <>
      <div>
        <label style={labelStyle}>Text</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateProp('text', e.target.value);
          }}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Style</label>
        <select
          value={props.style}
          onChange={(e) => updateProp('style', e.target.value)}
          style={inputStyle}
        >
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="body">Body</option>
          <option value="caption">Caption</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Alignment</label>
        <select
          value={props.align}
          onChange={(e) => updateProp('align', e.target.value)}
          style={inputStyle}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </>
  );
}

// Styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-secondary)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'rgba(0,0,0,0.5)',
  marginBottom: 6,
};

const subLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-secondary)',
  fontSize: 10,
  color: 'rgba(0,0,0,0.4)',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-secondary)',
  fontSize: 13,
  padding: '8px 10px',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  backgroundColor: 'rgba(0,0,0,0.04)',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'var(--font-secondary)',
  fontSize: 12,
};

