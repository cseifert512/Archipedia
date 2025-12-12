import React from 'react';
import { Sparkles, Plus, Save, Filter, SortAsc, Play, RotateCcw } from 'lucide-react';
import { ViewModeToggle } from './ViewModeToggle';
import { WorkflowGeneratorDialog } from '../Dialogs/WorkflowGeneratorDialog';
import { useCanvasStore } from '../../stores/canvasStore';

interface CanvasToolbarProps {
  viewMode: 'results' | 'workflow';
  onToggleMode: () => void;
  selectedCount: number;
  onAddNode?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  viewMode,
  onToggleMode,
  selectedCount,
  onAddNode,
}) => {
  const [showWorkflowDialog, setShowWorkflowDialog] = React.useState(false);
  const { executeWorkflow, clearExecutionResults, isExecuting } = useCanvasStore();

  return (
    <>
      <div
        style={{
          height: '48px',
          padding: '0 40px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E5E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <ViewModeToggle
          mode={viewMode}
          onToggle={onToggleMode}
          selectedCount={selectedCount}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {viewMode === 'results' ? (
            <>
              <button
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Filter size={16} />
                Filters
              </button>
              <button
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <SortAsc size={16} />
                Sort
              </button>
              {selectedCount > 0 && (
                <button
                  onClick={onToggleMode}
                  style={{
                    height: '36px',
                    padding: '0 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Build Workflow ({selectedCount})
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => executeWorkflow()}
                disabled={isExecuting}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  backgroundColor: isExecuting ? '#999' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                  opacity: isExecuting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isExecuting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Play size={16} />
                {isExecuting ? 'Running...' : 'Run Workflow'}
              </button>
              <button
                onClick={() => clearExecutionResults()}
                disabled={isExecuting}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                  opacity: isExecuting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isExecuting) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <RotateCcw size={16} />
                Clear Results
              </button>
              <button
                onClick={() => setShowWorkflowDialog(true)}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Sparkles size={16} />
                Generate Workflow
              </button>
              {onAddNode && (
                <button
                  onClick={onAddNode}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Plus size={16} />
                  Add Node
                </button>
              )}
              <button
                style={{
                  height: '36px',
                  padding: '0 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Save size={16} />
                Save
              </button>
            </>
          )}
        </div>
      </div>
      {showWorkflowDialog && (
        <WorkflowGeneratorDialog
          open={showWorkflowDialog}
          onClose={() => setShowWorkflowDialog(false)}
        />
      )}
    </>
  );
};
