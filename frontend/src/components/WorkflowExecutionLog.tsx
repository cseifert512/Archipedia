import React from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { NodeData } from '../types/nodes';

interface ExecutionLogEntry {
  id: number;
  command: string;
  timestamp: number;
  input?: string;
  output?: string;
}

interface WorkflowExecutionLogProps {
  customLogs?: ExecutionLogEntry[];
}

export const WorkflowExecutionLog: React.FC<WorkflowExecutionLogProps> = ({ customLogs }) => {
  const { nodes } = useCanvasStore();

  // Use custom logs if provided, otherwise generate from nodes
  const executionLogs: ExecutionLogEntry[] = customLogs || [];

  // Filter overseer nodes and their children
  const overseerNodes = nodes.filter(n => n.data.type === 'overseer');
  const childNodes = nodes.filter(n => n.data.parentId);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const ExecutionLogEntry: React.FC<{ entry: ExecutionLogEntry }> = ({ entry }) => {
    return (
      <div
        style={{
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          padding: '12px 0',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              color: '#000000',
            }}
          >
            {entry.command}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            {formatTime(entry.timestamp)}
          </span>
        </div>

        {entry.input && (
          <div style={{ marginBottom: '6px' }}>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px',
              }}
            >
              Input
            </div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.7)',
                padding: '6px 8px',
                backgroundColor: 'rgba(255,200,0,0.08)',
                borderRadius: '3px',
                borderLeft: '2px solid #FFC800',
              }}
            >
              {entry.input}
            </div>
          </div>
        )}

        {entry.output && (
          <div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px',
              }}
            >
              Output
            </div>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.7)',
                padding: '6px 8px',
                backgroundColor: 'rgba(50,200,100,0.08)',
                borderRadius: '3px',
                borderLeft: '2px solid #32C864',
              }}
            >
              {entry.output}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {executionLogs.length === 0 && overseerNodes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(0,0,0,0.4)',
            fontFamily: 'var(--font-secondary)',
            fontSize: '12px',
          }}
        >
          No execution logs yet
        </div>
      )}

      {executionLogs.map((entry) => (
        <ExecutionLogEntry key={entry.id} entry={entry} />
      ))}

      {overseerNodes.map((overseer) => {
        const children = childNodes.filter(n => n.data.parentId === overseer.id);
        const running = children.filter(n => n.data.status === 'generating' || n.data.status === 'running');
        const complete = children.filter(n => n.data.status === 'complete');
        
        return (
          <div
            key={overseer.id}
            style={{
              padding: '12px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                marginBottom: '8px',
              }}
            >
              {overseer.data.title || 'Overseer'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '8px',
              }}
            >
              {complete.length}/{children.length} complete
              {running.length > 0 && ` • ${running.length} running`}
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${children.length > 0 ? (complete.length / children.length) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#FFC800',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
