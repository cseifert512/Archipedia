import React, { useState, useEffect } from 'react';
import { Type, ImageIcon, Grid3X3, Settings, Search, Filter, Ruler, Circle, GitMerge, Minus, FolderOpen, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Sparkles, CheckCircle, Palette } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../../types/nodes';

interface NodeType {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  type: string;
  color: string;
}

const nodeTypes: NodeType[] = [
  // Input nodes
  { icon: Type, label: 'Text', type: 'text', color: '#F5F1E8' },
  { icon: ImageIcon, label: 'Image', type: 'image', color: '#64B5FF' },
  // Generation nodes
  { icon: Sparkles, label: 'Generate', type: 'generate', color: '#9D7BE8' },
  { icon: Palette, label: 'Style Ref', type: 'styleReference', color: '#FFA500' },
  { icon: CheckCircle, label: 'Validate', type: 'validate', color: '#4CAF50' },
  // Filter & operators
  { icon: Filter, label: 'Attributes', type: 'attributeFilter', color: '#90EE90' },
  { icon: Ruler, label: 'Constraints', type: 'scalar', color: '#4A90E2' },
  { icon: Circle, label: 'AND', type: 'operatorAND', color: '#FF9F43' },
  { icon: GitMerge, label: 'OR', type: 'operatorOR', color: '#C8A2C8' },
  { icon: Minus, label: 'NOT', type: 'operatorNOT', color: '#FF6B6B' },
  // Output
  { icon: Grid3X3, label: 'Results', type: 'results', color: '#7B68EE' },
];

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  createdAt: string;
}

interface NodePaletteSidebarProps {
  onAddNode: (type: string) => void;
  onOpenTemplates?: () => void;
  onLoadTemplate?: (template: WorkflowTemplate) => void;
  currentNodes?: Node<NodeData>[];
  currentEdges?: Edge[];
}

export const NodePaletteSidebar: React.FC<NodePaletteSidebarProps> = ({ 
  onAddNode, 
  onOpenTemplates,
  onLoadTemplate,
  currentNodes = [],
  currentEdges = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('archipedia-workflow-templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    }
  }, [isExpanded]);

  const handleSaveTemplate = () => {
    if (onOpenTemplates) {
      onOpenTemplates();
    }
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    if (onLoadTemplate) {
      onLoadTemplate(template);
    }
    setIsExpanded(false);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation(); // Prevent triggering the load template action
    const updated = templates.filter(t => t.id !== templateId);
    setTemplates(updated);
    localStorage.setItem('archipedia-workflow-templates', JSON.stringify(updated));
  };
  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        top: '120px',
        width: isCollapsed ? '40px' : '180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 40,
        transition: 'width 200ms ease',
      }}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          width: '100%',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 12px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
        }}
      >
        {!isCollapsed && (
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '10px',
              fontWeight: 500,
              color: 'rgba(0,0,0,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Nodes
          </span>
        )}
        {isCollapsed ? (
          <ChevronRight size={16} color="rgba(0,0,0,0.5)" />
        ) : (
          <ChevronLeft size={16} color="rgba(0,0,0,0.5)" />
        )}
      </button>

      {/* Node type buttons - only show when expanded */}
      {!isCollapsed && nodeTypes.map((node) => {
        const IconComponent = node.icon;
        return (
          <button
            key={node.type}
            onClick={() => onAddNode(node.type)}
            title={node.label}
            style={{
              width: '100%',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: node.color,
              border: '1px solid rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 12px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <IconComponent size={16} color="#000000" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                flex: 1,
                textAlign: 'left',
              }}
            >
              {node.label}
            </span>
          </button>
        );
      })}
      
      {/* Templates Button - Separated (only show when expanded) */}
      {!isCollapsed && (
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title="Workflows"
          style={{
            width: '100%',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 12px',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
        >
          <FolderOpen size={16} color="#000000" strokeWidth={1.5} />
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              fontWeight: 400,
              color: '#000000',
              flex: 1,
              textAlign: 'left',
            }}
          >
            Workflows
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Expanded Templates List */}
        {isExpanded && (
          <div
            style={{
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            {templates.length === 0 ? (
              <button
                onClick={handleSaveTemplate}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px dashed rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '11px',
                  color: '#000000',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                }}
              >
                <Plus size={14} />
                Add Workflow +
              </button>
            ) : (
              <>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleLoadTemplate(template)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '4px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-primary)',
                      fontSize: '11px',
                      color: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: '2px' }}>{template.name}</div>
                      {template.description && (
                        <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.6)' }}>{template.description}</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      style={{
                        flexShrink: 0,
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        color: 'rgba(0,0,0,0.5)',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
                        e.currentTarget.style.color = '#FF0000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
                      }}
                      title="Delete workflow"
                    >
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))}
                <button
                  onClick={handleSaveTemplate}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: '1px dashed rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '11px',
                    color: '#000000',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                >
                  <Plus size={14} />
                  Add Workflow +
                </button>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};



