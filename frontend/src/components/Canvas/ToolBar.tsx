import React from 'react';
import { MousePointer2, Hand, Type, Frame, Square } from 'lucide-react';
import { Editor } from 'tldraw';

type Tool = 'select' | 'hand' | 'text' | 'frame' | 'rect';

interface ToolBarProps {
  editor: Editor | null;
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: <Hand size={20} />, label: 'Pan', shortcut: 'H' },
  { id: 'text', icon: <Type size={20} />, label: 'Text', shortcut: 'T' },
  { id: 'frame', icon: <Frame size={20} />, label: 'Frame', shortcut: 'F' },
  { id: 'rect', icon: <Square size={20} />, label: 'Shape', shortcut: 'R' },
];

export function ToolBar({ editor, activeTool, onToolChange }: ToolBarProps) {
  const handleToolClick = (tool: Tool) => {
    onToolChange(tool);
    
    if (!editor) return;
    
    // Map our tools to tldraw tools
    switch (tool) {
      case 'select':
        editor.setCurrentTool('select');
        break;
      case 'hand':
        editor.setCurrentTool('hand');
        break;
      case 'text':
        editor.setCurrentTool('text');
        break;
      case 'frame':
        // For frame, we'll use a custom tool or create shape directly
        editor.setCurrentTool('select');
        break;
      case 'rect':
        editor.setCurrentTool('geo');
        break;
    }
  };

  return (
    <div
      style={{
        width: 48,
        backgroundColor: 'white',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        gap: 4,
        flexShrink: 0,
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeTool === tool.id ? 'rgba(182, 68, 36, 0.1)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: activeTool === tool.id ? 'var(--accent)' : 'rgba(0,0,0,0.6)',
            transition: 'all 150ms',
          }}
        >
          {tool.icon}
        </button>
      ))}

      <div
        style={{
          width: 24,
          height: 1,
          backgroundColor: 'rgba(0,0,0,0.1)',
          margin: '8px 0',
        }}
      />

      {/* Snap toggle could go here */}
    </div>
  );
}

