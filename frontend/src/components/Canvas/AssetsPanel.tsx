import React, { useState } from 'react';
import { X, Package, Layout, ChevronDown } from 'lucide-react';
import { Editor } from 'tldraw';
import { useBoardStore, ReferenceBlock } from '../../stores/boardStore';
import { createReferenceCardProps } from './shapes';

interface AssetsPanelProps {
  boardId: string;
  editor: Editor | null;
  onClose: () => void;
}

type Tab = 'items' | 'templates';

export function AssetsPanel({ boardId, editor, onClose }: AssetsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [draggedItem, setDraggedItem] = useState<ReferenceBlock | null>(null);

  // Get saved reference blocks from the board
  const getReferenceBlocks = useBoardStore((state) => state.getReferenceBlocks);
  const referenceBlocks = getReferenceBlocks(boardId);

  const handleDragStart = (block: ReferenceBlock, e: React.DragEvent) => {
    setDraggedItem(block);
    e.dataTransfer.setData('application/json', JSON.stringify(block));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!editor || !draggedItem) return;

    const data = draggedItem.data;
    const point = editor.screenToPage({ x: e.clientX, y: e.clientY });

    // Create reference card shape
    editor.createShape({
      type: 'reference-card',
      x: point.x - 160, // Center the card
      y: point.y - 130,
      props: createReferenceCardProps({
        project_id: data.project_id,
        image_id: data.image_id,
        thumb_url: data.thumb_url_snapshot,
        image_url: data.image_url_snapshot,
        title: data.title_snapshot,
        architect: data.architect_snapshot,
        location: data.location_snapshot,
        year: data.year_snapshot,
      }),
    });
  };

  const handleItemClick = (block: ReferenceBlock) => {
    if (!editor) return;

    const data = block.data;
    const center = editor.getViewportScreenCenter();
    const point = editor.screenToPage(center);

    editor.createShape({
      type: 'reference-card',
      x: point.x - 160,
      y: point.y - 130,
      props: createReferenceCardProps({
        project_id: data.project_id,
        image_id: data.image_id,
        thumb_url: data.thumb_url_snapshot,
        image_url: data.image_url_snapshot,
        title: data.title_snapshot,
        architect: data.architect_snapshot,
        location: data.location_snapshot,
        year: data.year_snapshot,
      }),
    });
  };

  return (
    <div
      style={{
        width: 260,
        backgroundColor: 'white',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-primary)', fontSize: 14, fontWeight: 600 }}>
          Library
        </span>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => setActiveTab('items')}
          style={{
            flex: 1,
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'items' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 12,
            color: activeTab === 'items' ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
          }}
        >
          <Package size={14} />
          Items
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            flex: 1,
            padding: '10px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'templates' ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: 12,
            color: activeTab === 'templates' ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
          }}
        >
          <Layout size={14} />
          Templates
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {activeTab === 'items' ? (
          <ItemsTab
            items={referenceBlocks}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onItemClick={handleItemClick}
          />
        ) : (
          <TemplatesTab editor={editor} />
        )}
      </div>
    </div>
  );
}

// Items tab content
function ItemsTab({
  items,
  onDragStart,
  onDragEnd,
  onItemClick,
}: {
  items: ReferenceBlock[];
  onDragStart: (block: ReferenceBlock, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onItemClick: (block: ReferenceBlock) => void;
}) {
  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(0,0,0,0.4)',
        }}
      >
        <Package size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 12, margin: 0 }}>
          No items saved yet.
          <br />
          Save projects from search to add them here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => onDragStart(item, e)}
          onDragEnd={onDragEnd}
          onClick={() => onItemClick(item)}
          style={{
            aspectRatio: '4/3',
            borderRadius: 6,
            overflow: 'hidden',
            cursor: 'grab',
            position: 'relative',
            backgroundColor: '#f0f0f0',
          }}
        >
          <img
            src={item.data.thumb_url_snapshot}
            alt={item.data.title_snapshot}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            draggable={false}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 6px 4px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: 10,
                color: 'white',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.data.title_snapshot}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Templates tab content
function TemplatesTab({ editor }: { editor: Editor | null }) {
  const templates = [
    {
      id: 'title-slide',
      name: 'Title Slide + 3 Frames',
      description: 'Cover frame with title and 3 content frames',
    },
    {
      id: 'comparison',
      name: 'Precedent Comparison',
      description: '2x2 card grid with captions',
    },
    {
      id: 'moodboard',
      name: 'Moodboard',
      description: 'Mixed-size layout with background',
    },
  ];

  const applyTemplate = (templateId: string) => {
    if (!editor) return;

    const center = editor.getViewportScreenCenter();
    const point = editor.screenToPage(center);

    switch (templateId) {
      case 'title-slide':
        // Create 4 frames
        editor.createShapes([
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y - 540,
            props: { title: 'Title Slide', preset: '16:9', clip: true },
          },
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y + 600,
            props: { title: 'Slide 2', preset: '16:9', clip: true },
          },
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y + 1800,
            props: { title: 'Slide 3', preset: '16:9', clip: true },
          },
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y + 3000,
            props: { title: 'Slide 4', preset: '16:9', clip: true },
          },
        ]);
        break;

      case 'comparison':
        editor.createShapes([
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y - 540,
            props: { title: 'Comparison', preset: '16:9', clip: true },
          },
        ]);
        break;

      case 'moodboard':
        editor.createShapes([
          {
            type: 'frame',
            x: point.x - 960,
            y: point.y - 540,
            props: { title: 'Moodboard', preset: '16:9', clip: true },
          },
          {
            type: 'shape-rect',
            x: point.x - 940,
            y: point.y - 520,
            props: { w: 1880, h: 1040, fill: '#f5f5f5', opacity: 0.5, borderRadius: 16, borderColor: 'transparent', borderWidth: 0 },
          },
        ]);
        break;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => applyTemplate(template.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 12,
            backgroundColor: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 150ms',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {template.name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: 11,
              color: 'rgba(0,0,0,0.5)',
            }}
          >
            {template.description}
          </span>
        </button>
      ))}
    </div>
  );
}

