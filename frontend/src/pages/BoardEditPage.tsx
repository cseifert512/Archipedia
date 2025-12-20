import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Reorder, useDragControls } from 'framer-motion';
import {
  useBoardStore,
  Board,
  BoardBlock,
  ReferenceBlock,
  TextBlock,
  DividerBlock,
  LayoutPreset,
} from '../stores/boardStore';
import { ImageReplacer as ImageReplacerModal, ExportMenu } from '../components/Boards';
import {
  ArrowLeft,
  Eye,
  Share2,
  Download,
  Check,
  GripVertical,
  X,
  Type,
  Minus,
  Plus,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  Star,
  Edit2,
} from 'lucide-react';

export function BoardEditPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id || '';
  const [, setLocation] = useLocation();

  const board = useBoardStore((state) => state.getBoardById(boardId));
  const updateBoard = useBoardStore((state) => state.updateBoard);
  const reorderBlocks = useBoardStore((state) => state.reorderBlocks);
  const removeBlock = useBoardStore((state) => state.removeBlock);
  const updateBlockCaption = useBoardStore((state) => state.updateBlockCaption);
  const addTextBlock = useBoardStore((state) => state.addTextBlock);
  const addDividerBlock = useBoardStore((state) => state.addDividerBlock);
  const lastSaved = useBoardStore((state) => state.lastSaved);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (board) {
      setTitleValue(board.title);
    }
  }, [board]);

  const handleTitleSave = useCallback(() => {
    if (board && titleValue.trim()) {
      updateBoard(boardId, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  }, [board, boardId, titleValue, updateBoard]);

  const handleReorder = useCallback(
    (newOrder: BoardBlock[]) => {
      reorderBlocks(boardId, newOrder.map((b) => b.id));
    },
    [boardId, reorderBlocks]
  );

  const handleAddTextBlock = useCallback(
    (afterBlockId: string | undefined, style: 'h2' | 'body') => {
      addTextBlock(boardId, style, style === 'h2' ? 'Section Title' : 'Add your text here...', afterBlockId);
      setShowAddMenu(null);
    },
    [boardId, addTextBlock]
  );

  const handleAddDivider = useCallback(
    (afterBlockId: string | undefined) => {
      addDividerBlock(boardId, 'line', afterBlockId);
      setShowAddMenu(null);
    },
    [boardId, addDividerBlock]
  );

  if (!board) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '24px', marginBottom: '16px' }}>
            Board Not Found
          </h2>
          <Link href="/search">
            <button
              style={{
                fontFamily: 'var(--font-primary)',
                backgroundColor: 'var(--accent)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Back to Search
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedBlocks = [...board.blocks].sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-[var(--bg-neutral)] flex flex-col">
      {/* Top Toolbar */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/search">
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
          </Link>

          {/* Editable Title */}
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '18px',
                fontWeight: 600,
                border: 'none',
                borderBottom: '2px solid var(--accent)',
                outline: 'none',
                padding: '4px 0',
                minWidth: '200px',
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {board.title}
            </h1>
          )}

          {/* Save Indicator */}
          {lastSaved && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              <Check size={14} />
              Saved
            </span>
          )}
        </div>

        {/* Center Section - Layout Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', color: 'rgba(0,0,0,0.5)' }}>
            Layout:
          </span>
          <select
            value={board.layout_preset}
            onChange={(e) => updateBoard(boardId, { layout_preset: e.target.value as LayoutPreset })}
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
              padding: '6px 12px',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="grid">Grid</option>
            <option value="masonry">Masonry</option>
            <option value="slides">Slides (16:9)</option>
          </select>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setLocation(`/boards/${boardId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
            }}
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/b/${board.share_token}`);
              alert('Share link copied!');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
            }}
          >
            <Share2 size={15} />
            Share
          </button>
          <button
            onClick={() => setShowExportMenu(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </header>

      {/* Export Menu Modal */}
      {showExportMenu && (
        <ExportMenu boardId={boardId} onClose={() => setShowExportMenu(false)} />
      )}

      {/* Main Editor Area */}
      <main style={{ flex: 1, display: 'flex' }}>
        {/* Canvas */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Empty State */}
            {board.blocks.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 40px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '2px dashed rgba(0,0,0,0.15)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <ImageIcon size={28} style={{ color: 'rgba(0,0,0,0.3)' }} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '18px',
                    fontWeight: 500,
                    marginBottom: '8px',
                  }}
                >
                  Your board is empty
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.5)',
                    marginBottom: '24px',
                  }}
                >
                  Save projects from search results to start building your collection.
                </p>
                <Link href="/search">
                  <button
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      padding: '12px 24px',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Projects
                  </button>
                </Link>
              </div>
            )}

            {/* Blocks List */}
            {board.blocks.length > 0 && (
              <Reorder.Group
                axis="y"
                values={sortedBlocks}
                onReorder={handleReorder}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {sortedBlocks.map((block) => (
                  <EditableBlock
                    key={block.id}
                    block={block}
                    boardId={boardId}
                    onRemove={() => removeBlock(boardId, block.id)}
                    onUpdateCaption={(caption) => updateBlockCaption(boardId, block.id, caption)}
                    onShowAddMenu={() => setShowAddMenu(block.id)}
                    showAddMenu={showAddMenu === block.id}
                    onAddText={(style) => handleAddTextBlock(block.id, style)}
                    onAddDivider={() => handleAddDivider(block.id)}
                    onCloseAddMenu={() => setShowAddMenu(null)}
                  />
                ))}
              </Reorder.Group>
            )}

            {/* Add First Block Button */}
            {board.blocks.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowAddMenu('end')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      backgroundColor: 'white',
                      border: '1px dashed rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '13px',
                      color: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    <Plus size={16} />
                    Add Block
                  </button>
                  {showAddMenu === 'end' && (
                    <AddBlockMenu
                      onAddText={(style) => handleAddTextBlock(undefined, style)}
                      onAddDivider={() => handleAddDivider(undefined)}
                      onClose={() => setShowAddMenu(null)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inspector Sidebar */}
        <aside
          style={{
            width: '280px',
            backgroundColor: 'white',
            borderLeft: '1px solid rgba(0,0,0,0.08)',
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'rgba(0,0,0,0.5)',
            }}
          >
            Board Settings
          </h3>

          {/* Subtitle */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Subtitle
            </label>
            <input
              type="text"
              value={board.subtitle || ''}
              onChange={(e) => updateBoard(boardId, { subtitle: e.target.value })}
              placeholder="Optional subtitle..."
              style={{
                width: '100%',
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '6px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <textarea
              value={board.description || ''}
              onChange={(e) => updateBoard(boardId, { description: e.target.value })}
              placeholder="Describe your board..."
              rows={4}
              style={{
                width: '100%',
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '6px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Stats */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderRadius: '8px',
              marginTop: '24px',
            }}
          >
            <h4
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Statistics
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>
                  Total blocks
                </span>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', fontWeight: 500 }}>
                  {board.blocks.length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>
                  References
                </span>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', fontWeight: 500 }}>
                  {board.blocks.filter((b) => b.type === 'reference').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>
                  Text blocks
                </span>
                <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '13px', fontWeight: 500 }}>
                  {board.blocks.filter((b) => b.type === 'text').length}
                </span>
              </div>
            </div>
          </div>

          {/* Share Token */}
          <div style={{ marginTop: '24px' }}>
            <label
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Share Link
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '6px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.6)',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                /b/{board.share_token}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/b/${board.share_token}`);
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ============ Editable Block Component ============

interface EditableBlockProps {
  block: BoardBlock;
  boardId: string;
  onRemove: () => void;
  onUpdateCaption: (caption: string) => void;
  onShowAddMenu: () => void;
  showAddMenu: boolean;
  onAddText: (style: 'h2' | 'body') => void;
  onAddDivider: () => void;
  onCloseAddMenu: () => void;
}

function EditableBlock({
  block,
  boardId,
  onRemove,
  onUpdateCaption,
  onShowAddMenu,
  showAddMenu,
  onAddText,
  onAddDivider,
  onCloseAddMenu,
}: EditableBlockProps) {
  const dragControls = useDragControls();
  const [isHovered, setIsHovered] = useState(false);
  const updateBlock = useBoardStore((state) => state.updateBlock);

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={dragControls}
      style={{
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'visible',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        style={{
          position: 'absolute',
          left: '-32px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          opacity: isHovered ? 0.5 : 0,
          transition: 'opacity 150ms',
        }}
      >
        <GripVertical size={16} />
      </div>

      {/* Remove Button */}
      {isHovered && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={14} />
        </button>
      )}

      {/* Block Content */}
      {block.type === 'reference' && (
        <ReferenceBlockEditor block={block} boardId={boardId} onUpdateCaption={onUpdateCaption} />
      )}
      {block.type === 'text' && (
        <TextBlockEditor
          block={block}
          onUpdate={(text) => updateBlock(boardId, block.id, { text })}
        />
      )}
      {block.type === 'divider' && <DividerBlockEditor block={block} />}

      {/* Add Block Button (between blocks) */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <button
            onClick={onShowAddMenu}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Plus size={14} />
          </button>
          {showAddMenu && (
            <AddBlockMenu
              onAddText={onAddText}
              onAddDivider={onAddDivider}
              onClose={onCloseAddMenu}
            />
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

// ============ Reference Block Editor ============

function ReferenceBlockEditor({
  block,
  boardId,
  onUpdateCaption,
}: {
  block: ReferenceBlock;
  boardId: string;
  onUpdateCaption: (caption: string) => void;
}) {
  const { data } = block;
  const [captionValue, setCaptionValue] = useState(data.caption || '');
  const [showImageReplacer, setShowImageReplacer] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const updateBlockImage = useBoardStore((state) => state.updateBlockImage);

  useEffect(() => {
    setCaptionValue(data.caption || '');
  }, [data.caption]);

  const handleCaptionBlur = () => {
    if (captionValue !== data.caption) {
      onUpdateCaption(captionValue);
    }
  };

  const handleImageSelect = (imageId: string, thumbUrl: string, imageUrl: string) => {
    updateBlockImage(boardId, block.id, imageId, thumbUrl, imageUrl);
    setShowImageReplacer(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
        {/* Thumbnail with Replace button */}
        <div
          style={{
            position: 'relative',
            width: '160px',
            height: '120px',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'rgba(0,0,0,0.05)',
          }}
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
        >
          <img
            src={data.thumb_url_snapshot}
            alt={data.title_snapshot}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {isImageHovered && (
            <button
              onClick={() => setShowImageReplacer(true)}
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                backgroundColor: 'rgba(0,0,0,0.75)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              Replace Image
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.title_snapshot}
          </h4>
          {data.architect_snapshot && (
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.6)',
                margin: 0,
                marginBottom: '2px',
              }}
            >
              {data.architect_snapshot}
            </p>
          )}
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              color: 'rgba(0,0,0,0.4)',
              margin: 0,
              marginBottom: '12px',
            }}
          >
            {data.location_snapshot}
            {data.year_snapshot && ` · ${data.year_snapshot}`}
          </p>

          {/* Caption Input */}
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="Add a caption..."
            style={{
              width: '100%',
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
              fontStyle: 'italic',
              padding: '8px 12px',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              outline: 'none',
              backgroundColor: 'rgba(0,0,0,0.02)',
            }}
          />
        </div>
      </div>

      {/* Image Replacer Modal */}
      {showImageReplacer && (
        <ImageReplacerModal
          projectId={data.project_id}
          currentImageId={data.image_id}
          onSelect={handleImageSelect}
          onClose={() => setShowImageReplacer(false)}
        />
      )}
    </>
  );
}

// ============ Text Block Editor ============

function TextBlockEditor({
  block,
  onUpdate,
}: {
  block: TextBlock;
  onUpdate: (text: string) => void;
}) {
  const { data } = block;
  const [textValue, setTextValue] = useState(data.text);

  useEffect(() => {
    setTextValue(data.text);
  }, [data.text]);

  const handleBlur = () => {
    if (textValue !== data.text) {
      onUpdate(textValue);
    }
  };

  const styleMap: Record<string, React.CSSProperties> = {
    h1: {
      fontFamily: 'var(--font-primary)',
      fontSize: '28px',
      fontWeight: 600,
    },
    h2: {
      fontFamily: 'var(--font-primary)',
      fontSize: '18px',
      fontWeight: 600,
    },
    body: {
      fontFamily: 'var(--font-secondary)',
      fontSize: '15px',
      lineHeight: 1.6,
    },
    quote: {
      fontFamily: 'var(--font-secondary)',
      fontSize: '16px',
      fontStyle: 'italic',
      borderLeft: '3px solid var(--accent)',
      paddingLeft: '16px',
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <textarea
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onBlur={handleBlur}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          ...styleMap[data.style],
        }}
        rows={data.style === 'body' || data.style === 'quote' ? 4 : 1}
      />
    </div>
  );
}

// ============ Divider Block Editor ============

function DividerBlockEditor({ block }: { block: DividerBlock }) {
  const { data } = block;

  if (data.variant === 'line') {
    return (
      <div style={{ padding: '16px 20px' }}>
        <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: data.variant === 'space-sm' ? '24px' : '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontFamily: 'var(--font-secondary)', fontSize: '11px', color: 'rgba(0,0,0,0.3)' }}>
        {data.variant === 'space-sm' ? 'Small spacer' : 'Large spacer'}
      </span>
    </div>
  );
}

// ============ Add Block Menu ============

function AddBlockMenu({
  onAddText,
  onAddDivider,
  onClose,
}: {
  onAddText: (style: 'h2' | 'body') => void;
  onAddDivider: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 30,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '8px',
          zIndex: 40,
          minWidth: '160px',
        }}
      >
        <button
          onClick={() => onAddText('h2')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Type size={16} />
          Section Header
        </button>
        <button
          onClick={() => onAddText('body')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Edit2 size={16} />
          Paragraph
        </button>
        <button
          onClick={onAddDivider}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Minus size={16} />
          Divider
        </button>
      </div>
    </>
  );
}

