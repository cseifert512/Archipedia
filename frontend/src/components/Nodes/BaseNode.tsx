import React from 'react';
import { Handle, Position } from 'reactflow';
import { NodeData } from '../../types/nodes';
import { Loader2, CheckCircle2, XCircle, Circle, Zap } from 'lucide-react';
import { getNodeTypeDefinition } from '../../lib/NodeRegistry';

interface BaseNodeProps {
  data: NodeData;
  selected?: boolean;
  children: React.ReactNode;
  borderColor?: string;
  backgroundColor?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  selected,
  children,
  borderColor = '#CCCCCC',
  backgroundColor = 'rgba(255, 255, 255, 0.75)',
}) => {
  const executionStatus = data.executionStatus || 'idle';
  const nodeDef = getNodeTypeDefinition(data.type);
  const isCached = (data as any).cached === true;

  // Determine status color and icon
  const getStatusIndicator = () => {
    if (isCached && executionStatus === 'success') {
      return <Zap size={16} className="text-yellow-500" />;
    }
    
    switch (executionStatus) {
      case 'running':
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getStatusBorderColor = () => {
    if (selected) {
      return '#FF0000'; // Red border when selected
    }
    switch (executionStatus) {
      case 'running':
        return '#2196F3';
      case 'success':
        return isCached ? '#FFC800' : '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return nodeDef.color;
    }
  };

  const getHeaderColor = () => {
    return nodeDef.color;
  };

  // Use node definition ports if available, otherwise fall back to data ports
  const inputPorts = nodeDef.inputs.length > 0 ? nodeDef.inputs : (data.inputs || []);
  const outputPorts = nodeDef.outputs.length > 0 ? nodeDef.outputs : (data.outputs || []);

  return (
    <div
      className="node-base"
      style={{
        width: '280px',
        minHeight: '180px',
        borderRadius: '12px',
        border: `2px solid ${getStatusBorderColor()}`,
        backgroundColor,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: selected
          ? '0 8px 24px rgba(0,0,0,0.15)'
          : '0 4px 12px rgba(0,0,0,0.1)',
        padding: '0',
        fontFamily: 'var(--font-secondary)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with colored background */}
      <div
        style={{
          backgroundColor: getHeaderColor(),
          padding: '12px 16px',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{data.label || nodeDef.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIndicator()}
        </div>
      </div>

      {/* Port Indicator Bar */}
      <div
        style={{
          borderTop: `1px solid rgba(0,0,0,0.1)`,
          borderBottom: `1px solid rgba(0,0,0,0.1)`,
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#666',
          fontFamily: 'var(--font-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '14px' }}>◐</span>
          <span style={{ fontWeight: 500 }}>INPUT:</span>
          {inputPorts.length > 0 ? (
            <span>{inputPorts.map(p => p.type).join(', ')}</span>
          ) : (
            <span style={{ color: '#999' }}>None</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 500 }}>OUTPUT:</span>
          {outputPorts.length > 0 ? (
            <span>{outputPorts.map(p => p.type).join(', ')}</span>
          ) : (
            <span style={{ color: '#999' }}>None</span>
          )}
          <span style={{ fontSize: '14px' }}>◑</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px' }}>
        {children}
      </div>

      {/* Input Handles */}
      {inputPorts.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            left: '-20px',
            top: '50%',
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
            type="target"
            position={Position.Left}
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
              background: getStatusBorderColor(),
              border: '2px solid white',
              borderRadius: '50%',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        inputPorts.map((input, index) => (
          <div
            key={input.id}
            style={{
              position: 'absolute',
              left: '-20px',
              top: `${60 + index * 30}px`,
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
              type="target"
              position={Position.Left}
              id={input.id}
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
                background: getStatusBorderColor(),
                border: '2px solid white',
                borderRadius: '50%',
                position: 'absolute',
                pointerEvents: 'none',
              }}
            />
          </div>
        ))
      )}

      {/* Output Handles */}
      {outputPorts.length === 0 ? (
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
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
              background: getStatusBorderColor(),
              border: '2px solid white',
              borderRadius: '50%',
              position: 'absolute',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        outputPorts.map((output, index) => (
          <div
            key={output.id}
            style={{
              position: 'absolute',
              right: '-20px',
              top: `${60 + index * 30}px`,
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
              id={output.id}
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
                background: getStatusBorderColor(),
                border: '2px solid white',
                borderRadius: '50%',
                position: 'absolute',
                pointerEvents: 'none',
              }}
            />
          </div>
        ))
      )}

      {/* Execution Result Preview */}
      {data.executionResult && executionStatus === 'success' && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            fontSize: '9px',
            color: '#666',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            padding: '4px 8px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isCached && <Zap size={10} className="inline mr-1 text-yellow-500" />}
          Output: {JSON.stringify(data.executionResult).substring(0, 40)}...
        </div>
      )}
    </div>
  );
};

