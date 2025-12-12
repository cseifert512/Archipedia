import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LensFrame } from '../LensFrame';

interface WorkflowTemplate {
  description: string;
  nodes: Array<{
    type: string;
    role?: string;
    iterations?: number;
    batchSize?: number;
  }>;
  estimatedCalls: number;
  estimatedTime: string;
}

interface RecipeBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onExecute: (workflow: WorkflowTemplate) => void;
}

const workflowTemplates: Record<string, WorkflowTemplate> = {
  iterate: {
    description: 'User describes iteration task',
    nodes: [
      { type: 'text', role: 'synthesizer' },
      { type: 'overseer', iterations: 5 },
      { type: 'image-gen', role: 'generator' },
      { type: 'collection' },
    ],
    estimatedCalls: 6,
    estimatedTime: '~2 min',
  },
  batch_variation: {
    description: 'User wants parametric exploration',
    nodes: [
      { type: 'overseer', batchSize: 10, iterations: 20 },
      { type: 'image-gen' },
      { type: 'collection' },
    ],
    estimatedCalls: 20,
    estimatedTime: '~5 min',
  },
  synthesis: {
    description: 'Synthesize design principles from precedents',
    nodes: [
      { type: 'text', role: 'synthesis' },
      { type: 'overseer', batchSize: 3, iterations: 3 },
      { type: 'image-gen' },
      { type: 'collection' },
    ],
    estimatedCalls: 4,
    estimatedTime: '~1.5 min',
  },
};

export const RecipeBuilderDialog: React.FC<RecipeBuilderDialogProps> = ({
  open,
  onClose,
  onExecute,
}) => {
  const [inputText, setInputText] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowTemplate | null>(null);

  const handleGenerateRecipe = () => {
    // Mock NLP parsing - match input to template
    const lowerInput = inputText.toLowerCase();
    let matchedTemplate: WorkflowTemplate | null = null;

    if (lowerInput.includes('variation') || lowerInput.includes('batch') || lowerInput.includes('20') || lowerInput.includes('10')) {
      matchedTemplate = workflowTemplates.batch_variation;
    } else if (lowerInput.includes('synthesize') || lowerInput.includes('principle') || lowerInput.includes('precedent')) {
      matchedTemplate = workflowTemplates.synthesis;
    } else {
      matchedTemplate = workflowTemplates.iterate;
    }

    setGeneratedWorkflow(matchedTemplate);
  };

  const handleExecute = () => {
    if (generatedWorkflow) {
      onExecute(generatedWorkflow);
      onClose();
      setInputText('');
      setGeneratedWorkflow(null);
    }
  };

  const handleClear = () => {
    setInputText('');
    setGeneratedWorkflow(null);
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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <LensFrame
          style={{
            padding: '24px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '18px',
                fontWeight: 400,
                color: '#000000',
                margin: 0,
              }}
            >
              Design Recipe Builder
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

          {/* Input Area */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Describe your design task:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Generate 5 concept sketches of a courtyard that reinterprets these 3 Mediterranean precedents..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                fontFamily: 'var(--font-primary)',
                fontSize: '13px',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '6px',
                resize: 'vertical',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <button
                onClick={handleGenerateRecipe}
                disabled={!inputText.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: inputText.trim() ? 'var(--accent)' : 'rgba(0,0,0,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  color: inputText.trim() ? '#000000' : 'rgba(0,0,0,0.3)',
                }}
              >
                Generate Recipe
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  color: '#000000',
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Workflow Preview */}
          {generatedWorkflow && (
            <div
              style={{
                padding: '20px',
                backgroundColor: 'rgba(255,200,0,0.05)',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                }}
              >
                Proposed Workflow:
              </div>

              {/* Workflow Visualization */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {generatedWorkflow.nodes.map((node, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-primary)',
                        fontSize: '11px',
                        color: '#000000',
                      }}
                    >
                      {node.type === 'overseer' && node.iterations
                        ? `Overseer ${node.iterations}×`
                        : node.type === 'overseer' && node.batchSize
                        ? `Overseer ${node.batchSize}×`
                        : node.type === 'text'
                        ? 'Text (Synthesis)'
                        : node.type === 'image-gen'
                        ? 'Image Gen'
                        : node.type}
                    </div>
                    {idx < generatedWorkflow.nodes.length - 1 && (
                      <span style={{ color: 'rgba(0,0,0,0.3)' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.6)',
                  marginBottom: '16px',
                }}
              >
                Estimated: {generatedWorkflow.estimatedCalls} API calls, {generatedWorkflow.estimatedTime}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleExecute}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    color: '#000000',
                    fontWeight: 400,
                  }}
                >
                  Execute
                </button>
                <button
                  onClick={() => setGeneratedWorkflow(null)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    color: '#000000',
                  }}
                >
                  Modify Workflow
                </button>
              </div>
            </div>
          )}
        </LensFrame>
      </div>
    </div>
  );
};

