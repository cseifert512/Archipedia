import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { StyleReferenceNodeData } from '../../types/nodes';
import { X, Play, Palette, Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface StyleReferenceNodeProps {
  data: StyleReferenceNodeData;
  selected?: boolean;
  id?: string;
}

export const StyleReferenceNode: React.FC<StyleReferenceNodeProps> = ({
  data,
  selected,
  id
}) => {
  const { deleteNode, updateNode, executeFromNode } = useCanvasStore();
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [extractMaterials, setExtractMaterials] = useState(data.extractMaterials !== false);
  const [extractPalette, setExtractPalette] = useState(data.extractPalette !== false);
  const [extractMassing, setExtractMassing] = useState(data.extractMassing || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && imageUrl) {
      updateNode(id, { 
        imageUrl,
        extractMaterials,
        extractPalette,
        extractMassing,
        status: 'extracting',
        error: undefined 
      });
      await executeFromNode(id);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const nextUrl = e.target?.result as string;
        setImageUrl(nextUrl);
        if (id) {
          updateNode(id, { imageUrl: nextUrl, imageFile: file });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Execution status
  const status = data.status || (data as any).executionStatus;
  const isExtracting = status === 'extracting' || status === 'running';
  const error = data.error || (data as any).executionError;
  
  // Get style description from executionResult or direct data
  const executionResult = (data as any).executionResult;
  const styleDescription = executionResult?.styleDescription || data.styleDescription || '';

  // Calculate positions for connection handles
  const outputHandleY = 200;

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '280px',
        minHeight: '260px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #FFA500' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #FFA500, 0 8px 32px rgba(0,0,0,0.2)'
          : '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: selected ? 50 : 10,
        transform: `scale(${selected ? 1.02 : 1})`,
        fontFamily: 'var(--font-primary)',
        position: 'relative',
      }}
    >
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
          id="style-output"
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
            background: '#FFA500',
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
          backgroundColor: '#FFA500',
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
          <Palette size={14} />
          STYLE REFERENCE
        </h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Status icon */}
          {isExtracting && <Loader2 size={14} className="animate-spin" color="#FFFFFF" />}
          {status === 'error' && <AlertTriangle size={14} color="#FFFFFF" />}
          {status === 'complete' && <CheckCircle2 size={14} color="#FFFFFF" />}
          <button
            onClick={handleRun}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={isExtracting || !imageUrl}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              cursor: isExtracting || !imageUrl ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: isExtracting || !imageUrl ? 0.5 : 0.9,
              transition: 'opacity 0.2s',
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
              color: '#FFFFFF',
            }}
          >
            {isExtracting ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                EXTRACTING...
              </>
            ) : (
              <>
                <Play size={10} />
                EXTRACT
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
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Image Upload */}
        {imageUrl ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/10',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
            onClick={handleClick}
          >
            <img
              src={imageUrl}
              alt="Style reference"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : (
          <div
            onClick={handleClick}
            style={{
              width: '100%',
              aspectRatio: '16/10',
              borderRadius: '8px',
              border: isDragging ? '2px dashed #FFA500' : '2px dashed rgba(0,0,0,0.2)',
              backgroundColor: isDragging ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: '8px',
            }}
          >
            <Upload size={28} color={isDragging ? '#FFA500' : 'rgba(0,0,0,0.3)'} />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.5)',
                textAlign: 'center',
              }}
            >
              Drop reference image
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Extract Options */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#666',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={extractMaterials}
              onChange={(e) => {
                setExtractMaterials(e.target.checked);
                if (id) updateNode(id, { extractMaterials: e.target.checked });
              }}
              style={{ margin: 0 }}
            />
            Materials
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#666',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={extractPalette}
              onChange={(e) => {
                setExtractPalette(e.target.checked);
                if (id) updateNode(id, { extractPalette: e.target.checked });
              }}
              style={{ margin: 0 }}
            />
            Palette
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#666',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={extractMassing}
              onChange={(e) => {
                setExtractMassing(e.target.checked);
                if (id) updateNode(id, { extractMassing: e.target.checked });
              }}
              style={{ margin: 0 }}
            />
            Massing
          </label>
        </div>

        {/* Style Description */}
        {styleDescription && (
          <div
            style={{
              padding: '10px',
              borderRadius: '6px',
              background: 'rgba(255, 165, 0, 0.08)',
              border: '1px solid rgba(255, 165, 0, 0.2)',
              fontSize: '10px',
              lineHeight: '1.5',
              color: '#555',
              maxHeight: '80px',
              overflow: 'auto',
            }}
          >
            {styleDescription}
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
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Extraction failed</div>
            <div style={{ opacity: 0.85 }}>{error}</div>
          </div>
        )}
      </section>
    </div>
  );
};

