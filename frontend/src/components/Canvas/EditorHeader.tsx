import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Share2,
  Download,
  Play,
  LayoutGrid,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Editor } from 'tldraw';
import { useCanvasStore } from '../../stores/canvasStore';

interface EditorHeaderProps {
  boardId: string;
  title: string;
  shareToken: string;
  editor: Editor | null;
  onModeToggle: () => void;
  onPresent: () => void;
  onExport: () => void;
  onTitleChange: (title: string) => void;
}

export function EditorHeader({
  boardId,
  title,
  shareToken,
  editor,
  onModeToggle,
  onPresent,
  onExport,
  onTitleChange,
}: EditorHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [zoom, setZoom] = useState(100);

  const { isSaving, hasUnsavedChanges, saveError, hasConflict } = useCanvasStore();

  useEffect(() => {
    setTitleValue(title);
  }, [title]);

  useEffect(() => {
    if (editor) {
      const updateZoom = () => {
        setZoom(Math.round(editor.getZoomLevel() * 100));
      };
      updateZoom();
      // Listen for camera changes
      editor.store.listen(updateZoom);
    }
  }, [editor]);

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== title) {
      onTitleChange(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleUndo = () => editor?.undo();
  const handleRedo = () => editor?.redo();

  const handleZoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newZoom = parseInt(e.target.value) / 100;
    editor?.setCamera({ x: editor.getCamera().x, y: editor.getCamera().y, z: newZoom });
    setZoom(parseInt(e.target.value));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/b/${shareToken}`);
    alert('Share link copied to clipboard!');
  };

  return (
    <header
      style={{
        height: 56,
        backgroundColor: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href={`/boards/${boardId}`}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
        </Link>

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            autoFocus
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 16,
              fontWeight: 600,
              border: 'none',
              borderBottom: '2px solid var(--accent)',
              outline: 'none',
              padding: '4px 0',
              minWidth: 200,
            }}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            {title}
          </h1>
        )}

        {/* Save Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isSaving && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.5)', fontSize: 12 }}>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          )}
          {!isSaving && hasUnsavedChanges && (
            <span style={{ color: 'rgba(0,0,0,0.4)', fontSize: 12 }}>Unsaved</span>
          )}
          {!isSaving && !hasUnsavedChanges && !saveError && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontSize: 12 }}>
              <Check size={14} />
              Saved
            </span>
          )}
          {saveError && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12 }}>
              <AlertCircle size={14} />
              {saveError}
            </span>
          )}
        </div>
      </div>

      {/* Center Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleUndo}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={handleRedo}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={18} />
        </button>

        <div style={{ width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)', margin: '0 8px' }} />

        <select
          value={zoom}
          onChange={handleZoomChange}
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: 13,
            padding: '6px 10px',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 6,
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
          <option value="400">400%</option>
        </select>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onModeToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 13,
          }}
          title="Switch to Grid mode"
        >
          <LayoutGrid size={16} />
          Grid
        </button>

        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 13,
          }}
        >
          <Share2 size={16} />
          Share
        </button>

        <button
          onClick={onExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 13,
          }}
        >
          <Download size={16} />
          Export
        </button>

        <button
          onClick={onPresent}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Play size={16} />
          Present
        </button>
      </div>
    </header>
  );
}

