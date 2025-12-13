import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNodeData } from '../../types/nodes';
import { X, Play, Upload, Image as ImageIcon } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface ImageNodeData extends BaseNodeData {
  type: 'image';
  imageUrl?: string;
  imageFile?: File;
}

interface ImageNodeProps {
  data: ImageNodeData;
  selected?: boolean;
  id?: string;
}

export const ImageNode: React.FC<ImageNodeProps> = ({
  data,
  selected,
  id
}) => {
  const { deleteNode, executeFromNode, updateNode } = useCanvasStore();
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Calculate positions for connection handles
  const inputHandleY = 60; // After header
  const outputHandleY = 200; // After image section (tuned for smaller default size)

  const resultCount = Array.isArray((data as any).executionResult?.results)
    ? (data as any).executionResult.results.length
    : 0;

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '280px',
        minHeight: '240px',
        backgroundColor: '#FFFFFF',
        border: selected ? '2px solid #64B5FF' : '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px',
        boxShadow: selected
          ? '0 0 0 2px #64B5FF, 0 8px 32px rgba(0,0,0,0.2)'
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
          background: '#64B5FF',
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
          background: '#64B5FF',
          border: '2px solid #FFFFFF',
          borderRadius: '50%',
          clipPath: 'inset(0 0 0 50%)',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: '#64B5FF',
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
          <ImageIcon size={14} />
          IMAGE
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

      {/* Image Section */}
      <section
        style={{
          flex: '1',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {imageUrl ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '12px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={imageUrl}
              alt="Uploaded"
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
              aspectRatio: '16/9',
              borderRadius: '8px',
              border: isDragging ? '2px dashed #64B5FF' : '2px dashed rgba(0,0,0,0.2)',
              backgroundColor: isDragging ? 'rgba(100, 181, 255, 0.1)' : 'rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: '8px',
            }}
          >
            <Upload size={32} color={isDragging ? '#64B5FF' : 'rgba(0,0,0,0.3)'} />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.5)',
                textAlign: 'center',
              }}
            >
              Click to upload or drag & drop
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
        {imageUrl && (
          <button
            onClick={handleClick}
            style={{
              padding: '8px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: '#000000',
              width: '100%',
            }}
          >
            Change Image
          </button>
        )}

        {/* Execution summary */}
        {data.executionStatus === 'success' && resultCount > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: 'rgba(100, 181, 255, 0.08)',
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              color: 'rgba(0,0,0,0.75)',
              textAlign: 'center',
            }}
          >
            Found {resultCount} visually similar matches
          </div>
        )}
      </section>
    </div>
  );
};

