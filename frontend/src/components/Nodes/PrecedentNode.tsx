import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { PrecedentNodeData, PrecedentProject } from '../../types/nodes';
import { X, Play, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';

interface PrecedentNodeProps {
  data: PrecedentNodeData;
  selected?: boolean;
  id?: string;
}


export const PrecedentNode: React.FC<PrecedentNodeProps> = ({ data, selected, id }) => {
  const { deleteNode, updateNode, executeFromNode } = useCanvasStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const projects = data.projects || [];
  const currentProject = projects[currentIndex];
  const isStacked = projects.length > 1;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      deleteNode(id);
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (id && projects.length > 1) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      const newIndex = currentIndex >= updatedProjects.length ? updatedProjects.length - 1 : currentIndex;
      setCurrentIndex(Math.max(0, newIndex));
      updateNode(id, { projects: updatedProjects });
    } else if (id) {
      // If only one project, delete the entire node
      deleteNode(id);
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : projects.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < projects.length - 1 ? prev + 1 : 0));
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      await executeFromNode(id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const dropData = e.dataTransfer.getData('application/archipedia-precedent');
    if (dropData && id) {
      try {
        const project: any = JSON.parse(dropData);
        const newProject: PrecedentProject = {
          id: project.id,
          title: project.name,
          thumbnail: project.imageUrl || project.url || '',
          attributes: {
            circulation: project.typology || '',
            materiality: project.materials?.join('+') || '',
            climate: project.climate || '',
          },
        };
        const updatedProjects = [...projects, newProject];
        updateNode(id, { projects: updatedProjects });
      } catch (error) {
        console.error('Error parsing dropped data:', error);
      }
    }
  };

  // Calculate positions for connection handles
  const inputHandleY = 60; // After header
  const outputHandleY = 250; // After content section

  return (
    <div
      className="rounded-lg overflow-visible cursor-move group transition-all"
      style={{
        width: '320px',
        minHeight: '300px',
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
          Precedent
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
          position: 'relative',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
      >
        {currentProject ? (
          <>
            {/* Stacked Background Effect - Show when multiple projects */}
            {isStacked && (
              <>
                {/* First background layer (most visible) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    right: '12px',
                    bottom: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    opacity: 0.5,
                    zIndex: 0,
                    transform: 'translate(8px, 8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                {/* Second background layer (subtle) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: '8px',
                    bottom: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    opacity: 0.3,
                    zIndex: 0,
                    transform: 'translate(16px, 16px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
              </>
            )}

            {/* Project Image Container */}
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {currentProject.thumbnail ? (
                <img
                  src={currentProject.thumbnail}
                  alt={currentProject.title}
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
                    backgroundColor: '#FFC800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={32} color="#1a1a1a" />
                </div>
              )}
              {/* Carousel Navigation Arrows - Only show when stacked */}
              {isStacked && (
                <>
                  <button
                    onClick={handlePrevious}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    }}
                  >
                    <ChevronLeft size={16} color="#FFFFFF" />
                  </button>
                  <button
                    onClick={handleNext}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.8,
                      transition: 'all 0.2s',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                    }}
                  >
                    <ChevronRight size={16} color="#FFFFFF" />
                  </button>
                </>
              )}

              {/* X button to remove this project */}
              {isStacked && (
                <button
                  onClick={(e) => handleDeleteProject(e, currentProject.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.8,
                    transition: 'opacity 0.2s',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.background = 'rgba(255,0,0,0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                  }}
                >
                  <X size={12} color="#FFFFFF" />
                </button>
              )}
            </div>

            {/* Project Title */}
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#000000',
                marginBottom: '8px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {currentProject.title}
            </div>

            {/* Project Attributes */}
            <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.7)', position: 'relative', zIndex: 1 }}>
              {Object.entries(currentProject.attributes).slice(0, 2).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '4px' }}>
                  {key}: {value}
                </div>
              ))}
            </div>

            {/* Stack Indicator - Show when multiple projects */}
            {isStacked && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px',
                  backgroundColor: 'rgba(100, 181, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '9px',
                  color: 'rgba(0,0,0,0.7)',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 500,
                }}
              >
                {currentIndex + 1} of {projects.length}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '8px',
              border: isDragOver ? '2px dashed #64B5FF' : '2px dashed rgba(0,0,0,0.2)',
              backgroundColor: isDragOver ? 'rgba(100, 181, 255, 0.1)' : 'rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ImageIcon size={32} color="rgba(0,0,0,0.3)" />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.5)',
                textAlign: 'center',
              }}
            >
              Drop projects here
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

