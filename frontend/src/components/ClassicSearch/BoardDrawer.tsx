import React, { useState } from 'react';
import { X, Plus, Trash2, ExternalLink, FolderOpen } from 'lucide-react';
import { useBoardStore, Board, BoardItem } from '../../stores/boardStore';

interface BoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BoardDrawer({ isOpen, onClose }: BoardDrawerProps) {
  const {
    boards,
    activeBoardId,
    createBoard,
    deleteBoard,
    renameBoard,
    setActiveBoard,
    removeItemFromBoard,
  } = useBoardStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      createBoard(newBoardName.trim());
      setNewBoardName('');
      setIsCreating(false);
    }
  };

  const handleRenameBoard = (boardId: string) => {
    if (editingName.trim()) {
      renameBoard(boardId, editingName.trim());
      setEditingBoardId(null);
      setEditingName('');
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
          width: '360px',
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
            borderBottom: '1px solid rgba(0,0,0,0.1)',
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
            borderBottom: '1px solid rgba(0,0,0,0.1)',
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
                    board.id === activeBoardId ? 'rgba(182, 68, 36, 0.08)' : 'rgba(0,0,0,0.03)',
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
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingBoardId(board.id);
                      setEditingName(board.name);
                    }}
                  >
                    {board.name}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {board.items.length}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                }}
              >
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Board name..."
                  autoFocus
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '14px',
                    padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateBoard();
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewBoardName('');
                    }
                  }}
                />
                <button
                  onClick={handleCreateBoard}
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Create
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
                  {activeBoard.name}
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '12px',
                    color: 'rgba(0,0,0,0.4)',
                  }}
                >
                  {activeBoard.items.length} items
                </span>
              </div>

              {activeBoard.items.length === 0 ? (
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
                  {activeBoard.items.map((item) => (
                    <BoardItemCard
                      key={item.board_item_id}
                      item={item}
                      onRemove={() => removeItemFromBoard(activeBoard.id, item.board_item_id)}
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

        {/* Footer */}
        {activeBoard && activeBoard.items.length > 0 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <button
              onClick={() => {
                // Navigate to board view (future feature)
                alert('Board view coming soon!');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background 150ms ease',
              }}
            >
              <ExternalLink size={16} />
              Open Board
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function BoardItemCard({ item, onRemove }: { item: BoardItem; onRemove: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: '8px',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={item.thumb_url}
        alt={item.title_snapshot}
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
          {item.title_snapshot}
        </h4>
        {item.architect_snapshot && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'rgba(0,0,0,0.5)',
              margin: 0,
              marginBottom: '2px',
            }}
          >
            {item.architect_snapshot}
          </p>
        )}
        {item.location_snapshot && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'rgba(0,0,0,0.4)',
              margin: 0,
            }}
          >
            {item.location_snapshot}
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

