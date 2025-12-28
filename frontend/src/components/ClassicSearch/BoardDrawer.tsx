import React, { useState } from 'react';
import { X, Plus, Trash2, ExternalLink, FolderOpen, Edit3, Share2, FileText, Layout } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useBoardStore, Board, ReferenceBlock } from '../../stores/boardStore';

interface BoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BoardDrawer({ isOpen, onClose }: BoardDrawerProps) {
  const [, setLocation] = useLocation();
  const {
    boards,
    activeBoardId,
    createBoard,
    createBoardWithTemplate,
    deleteBoard,
    updateBoard,
    setActiveBoard,
    removeBlock,
    getReferenceBlocks,
  } = useBoardStore();

  const [isCreating, setIsCreating] = useState(false);
  const [showTemplateChoice, setShowTemplateChoice] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const activeReferenceBlocks = activeBoardId ? getReferenceBlocks(activeBoardId) : [];

  const handleCreateBoard = (useTemplate: boolean = false) => {
    const name = newBoardName.trim() || (useTemplate ? 'Research Board' : 'Untitled Board');
    if (useTemplate) {
      createBoardWithTemplate(name);
    } else {
      createBoard(name);
    }
    setNewBoardName('');
    setIsCreating(false);
    setShowTemplateChoice(false);
  };

  const handleRenameBoard = (boardId: string) => {
    if (editingName.trim()) {
      updateBoard(boardId, { title: editingName.trim() });
      setEditingBoardId(null);
      setEditingName('');
    }
  };

  const handleOpenBoard = () => {
    if (activeBoard) {
      onClose();
      setLocation(`/boards/${activeBoard.id}/edit`);
    }
  };

  const handleShareBoard = () => {
    if (activeBoard) {
      navigator.clipboard.writeText(`${window.location.origin}/b/${activeBoard.share_token}`);
      alert('Share link copied to clipboard!');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 998,
          }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          backgroundColor: 'white',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Boards
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Board List */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => setActiveBoard(board.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor:
                    board.id === activeBoardId ? 'rgba(182, 68, 36, 0.08)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border:
                    board.id === activeBoardId
                      ? '1px solid var(--accent)'
                      : '1px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                <FolderOpen
                  size={18}
                  style={{
                    color: board.id === activeBoardId ? 'var(--accent)' : 'rgba(0,0,0,0.4)',
                    flexShrink: 0,
                  }}
                />
                {editingBoardId === board.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameBoard(board.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameBoard(board.id)}
                    autoFocus
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      border: 'none',
                      background: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      fontWeight: board.id === activeBoardId ? 500 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingBoardId(board.id);
                      setEditingName(board.title);
                    }}
                  >
                    {board.title}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.4)',
                    flexShrink: 0,
                  }}
                >
                  {board.blocks.filter((b) => b.type === 'reference').length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this board?')) {
                      deleteBoard(board.id);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.4,
                    transition: 'opacity 150ms ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Create New Board */}
            {isCreating ? (
              <div style={{ padding: '8px' }}>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Board name..."
                  autoFocus
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '14px',
                    padding: '10px 12px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                    outline: 'none',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setShowTemplateChoice(true);
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewBoardName('');
                      setShowTemplateChoice(false);
                    }
                  }}
                />
                
                {/* Template choice buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCreateBoard(false)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '14px 12px',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-secondary)',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                    }}
                  >
                    <FileText size={20} style={{ color: 'rgba(0,0,0,0.5)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Blank</span>
                    <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.4)' }}>Start empty</span>
                  </button>
                  
                  <button
                    onClick={() => handleCreateBoard(true)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '14px 12px',
                      backgroundColor: 'rgba(182, 68, 36, 0.05)',
                      border: '1px solid var(--accent)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-secondary)',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(182, 68, 36, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(182, 68, 36, 0.05)';
                    }}
                  >
                    <Layout size={20} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)' }}>Template</span>
                    <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.4)' }}>Narrative structure</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewBoardName('');
                    setShowTemplateChoice(false);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.4)',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: '1px dashed rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: 'rgba(0,0,0,0.5)',
                  transition: 'all 150ms ease',
                }}
              >
                <Plus size={16} />
                New Board
              </button>
            )}
          </div>
        </div>

        {/* Active Board Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {activeBoard ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {activeBoard.title}
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {activeReferenceBlocks.length} item{activeReferenceBlocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {activeReferenceBlocks.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'rgba(0,0,0,0.4)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '13px',
                      margin: 0,
                    }}
                  >
                    No items saved yet.
                    <br />
                    Click the bookmark icon on search results to save.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeReferenceBlocks.map((block) => (
                    <BoardItemCard
                      key={block.id}
                      block={block}
                      onRemove={() => removeBlock(activeBoard.id, block.id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                Select a board or create a new one.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeBoard && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <button
              onClick={handleOpenBoard}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'opacity 150ms ease',
              }}
            >
              <Edit3 size={16} />
              Edit Board
            </button>
            <button
              onClick={handleShareBoard}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              <Share2 size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BoardItemCard({ block, onRemove }: { block: ReferenceBlock; onRemove: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const { data } = block;

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: '8px',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={data.thumb_url_snapshot}
        alt={data.title_snapshot}
        style={{
          width: '60px',
          height: '60px',
          objectFit: 'cover',
          borderRadius: '6px',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '13px',
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
              fontSize: '11px',
              color: 'rgba(0,0,0,0.5)',
              margin: 0,
              marginBottom: '2px',
            }}
          >
            {data.architect_snapshot}
          </p>
        )}
        {data.location_snapshot && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'rgba(0,0,0,0.4)',
              margin: 0,
            }}
          >
            {data.location_snapshot}
          </p>
        )}
        {data.caption && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              fontStyle: 'italic',
              color: 'rgba(0,0,0,0.6)',
              margin: 0,
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            "{data.caption}"
          </p>
        )}
      </div>
      {isHovered && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
