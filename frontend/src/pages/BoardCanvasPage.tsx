import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import {
  Tldraw,
  Editor,
  TLComponents,
  DefaultToolbar,
  DefaultToolbarContent,
} from 'tldraw';
import 'tldraw/tldraw.css';

import { useCanvasStore } from '../stores/canvasStore';
import { useBoardStore } from '../stores/boardStore';
import { customShapeUtils } from '../components/Canvas/shapes';
import { EditorHeader } from '../components/Canvas/EditorHeader';
import { ToolBar } from '../components/Canvas/ToolBar';
import { AssetsPanel } from '../components/Canvas/AssetsPanel';
import { InspectorPanel } from '../components/Canvas/InspectorPanel';
import { PresentMode } from '../components/Canvas/PresentMode';
import { ExportMenu } from '../components/Boards/ExportMenu';

type Tool = 'select' | 'hand' | 'text' | 'frame' | 'rect';

export function BoardCanvasPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id || '';
  const [, setLocation] = useLocation();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [showPresent, setShowPresent] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Board data from local store (for metadata)
  const board = useBoardStore((state) => state.getBoardById(boardId));
  const updateBoard = useBoardStore((state) => state.updateBoard);

  // Canvas store for document state
  const {
    loadDocument,
    setEditor: setCanvasEditor,
    hasConflict,
    resolveConflict,
    reset,
  } = useCanvasStore();

  // Load document on mount
  useEffect(() => {
    if (boardId) {
      loadDocument(boardId);
    }

    return () => {
      reset();
    };
  }, [boardId, loadDocument, reset]);

  // Set editor in canvas store when ready
  useEffect(() => {
    setCanvasEditor(editor);
  }, [editor, setCanvasEditor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          editor?.setCurrentTool('select');
          break;
        case 'h':
          setActiveTool('hand');
          editor?.setCurrentTool('hand');
          break;
        case 't':
          setActiveTool('text');
          editor?.setCurrentTool('text');
          break;
        case 'f':
          setActiveTool('frame');
          // Create frame at center
          if (editor) {
            const { x, y } = editor.getViewportScreenCenter();
            editor.createShape({
              type: 'frame',
              x: x - 960,
              y: y - 540,
              props: {
                title: 'New Frame',
                preset: '16:9',
                clip: true,
              },
            });
          }
          break;
        case 'r':
          setActiveTool('rect');
          editor?.setCurrentTool('geo');
          break;
        case ' ':
          if (!e.repeat) {
            editor?.setCurrentTool('hand');
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        // Return to previous tool
        editor?.setCurrentTool(activeTool === 'hand' ? 'select' : activeTool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editor, activeTool]);

  const handleModeToggle = () => {
    // Switch to grid mode
    setLocation(`/boards/${boardId}/edit`);
  };

  const handleTitleChange = useCallback((title: string) => {
    updateBoard(boardId, { title });
  }, [boardId, updateBoard]);

  const handleEditorMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
  }, []);

  // Conflict resolution modal
  if (hasConflict) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: 20, marginBottom: 16 }}>
            Document Updated
          </h2>
          <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 14, color: 'rgba(0,0,0,0.6)', marginBottom: 24 }}>
            This board was modified elsewhere. How would you like to proceed?
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => resolveConflict('reload')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: 14,
              }}
            >
              Reload
            </button>
            <button
              onClick={() => resolveConflict('overwrite')}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: 14,
              }}
            >
              Keep My Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <EditorHeader
        boardId={boardId}
        title={board.title}
        shareToken={board.share_token}
        editor={editor}
        onModeToggle={handleModeToggle}
        onPresent={() => setShowPresent(true)}
        onExport={() => setShowExport(true)}
        onTitleChange={handleTitleChange}
      />

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Tool Rail */}
        <ToolBar
          editor={editor}
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />

        {/* Left Panel (Assets) */}
        {leftPanelOpen && (
          <AssetsPanel
            boardId={boardId}
            editor={editor}
            onClose={() => setLeftPanelOpen(false)}
          />
        )}

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Tldraw
            shapeUtils={customShapeUtils}
            onMount={handleEditorMount}
            inferDarkMode={false}
          />
        </div>

        {/* Right Panel (Inspector) */}
        {rightPanelOpen && (
          <InspectorPanel
            editor={editor}
            onClose={() => setRightPanelOpen(false)}
          />
        )}
      </div>

      {/* Present Mode */}
      {showPresent && (
        <PresentMode
          boardId={boardId}
          editor={editor}
          onClose={() => setShowPresent(false)}
        />
      )}

      {/* Export Menu */}
      {showExport && (
        <ExportMenu
          boardId={boardId}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

