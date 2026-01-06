import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { NodeData } from '../../types/nodes';

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  createdAt: string;
}

interface TemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  currentNodes: Node<NodeData>[];
  currentEdges: Edge[];
}

export const TemplatesDialog: React.FC<TemplatesDialogProps> = ({
  open,
  onClose,
  onLoadTemplate,
  currentNodes,
  currentEdges,
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('archipedia-workflow-templates');
      if (saved) {
        try {
          setTemplates(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load templates:', e);
        }
      }
    }
  }, [open]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: WorkflowTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      nodes: currentNodes,
      edges: currentEdges,
      createdAt: new Date().toISOString(),
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('archipedia-workflow-templates', JSON.stringify(updated));
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveDialog(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('archipedia-workflow-templates', JSON.stringify(updated));
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    onLoadTemplate(template);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderOpen size={20} color="#000000" />
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '16px',
                fontWeight: 600,
                color: '#000000',
                margin: 0,
              }}
            >
              Workflow Templates
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} color="#000000" />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {showSaveDialog ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#000000',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#000000',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Description (optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: templateName.trim() ? '#32C864' : 'rgba(0,0,0,0.1)',
                    color: templateName.trim() ? 'white' : '#666',
                    cursor: templateName.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                  }}
                >
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.7)',
                    margin: 0,
                  }}
                >
                  {templates.length} saved template{templates.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#32C864',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  Save Current Workflow
                </button>
              </div>

              {templates.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'rgba(0,0,0,0.5)',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '12px',
                  }}
                >
                  No templates saved yet. Create one by clicking "Save Current Workflow".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      style={{
                        padding: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#000000',
                            marginBottom: '4px',
                          }}
                        >
                          {template.name}
                        </div>
                        {template.description && (
                          <div
                            style={{
                              fontFamily: 'var(--font-primary)',
                              fontSize: '11px',
                              color: 'rgba(0,0,0,0.6)',
                              marginBottom: '4px',
                            }}
                          >
                            {template.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '10px',
                            color: 'rgba(0,0,0,0.5)',
                          }}
                        >
                          {template.nodes.length} nodes, {template.edges.length} connections
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          style={{
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#32C864',
                            color: 'white',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-primary)',
                            fontSize: '11px',
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          style={{
                            padding: '6px',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'rgba(255,0,0,0.1)',
                            color: '#FF0000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

