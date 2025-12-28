import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Block Data Types ============

export interface ReferenceBlockData {
  project_id: string;
  image_id?: string;
  thumb_url_snapshot: string;
  image_url_snapshot?: string;
  title_snapshot: string;
  architect_snapshot?: string;
  location_snapshot?: string;
  year_snapshot?: number;
  source_url_snapshot?: string;
  caption?: string;
  tags?: string[];
  added_from?: {
    query?: string;
    filters?: Record<string, string[]>;
    score?: number;
  };
}

export interface TextBlockData {
  style: 'h1' | 'h2' | 'body' | 'quote';
  text: string;
}

export interface DividerBlockData {
  variant: 'line' | 'space-sm' | 'space-lg';
}

// ============ Block Types ============

export interface ReferenceBlock {
  type: 'reference';
  id: string;
  position: number;
  data: ReferenceBlockData;
}

export interface TextBlock {
  type: 'text';
  id: string;
  position: number;
  data: TextBlockData;
}

export interface DividerBlock {
  type: 'divider';
  id: string;
  position: number;
  data: DividerBlockData;
}

export type BoardBlock = ReferenceBlock | TextBlock | DividerBlock;

// ============ Layout Types ============

export type LayoutPreset = 'grid' | 'masonry' | 'slides';
export type LayoutMode = 'grid' | 'canvas';
export type PageFormat = 'web' | '16:9' | '4:3' | 'letter' | 'a4';

// ============ Board Type ============

export interface Board {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image_url?: string;
  layout_preset: LayoutPreset;
  layout_mode: LayoutMode;
  page_format: PageFormat;
  share_token: string;
  blocks: BoardBlock[];
  created_at: string;
  updated_at: string;
}

// ============ Legacy Type (for migration) ============

interface LegacyBoardItem {
  board_item_id: string;
  project_id: string;
  image_id?: string;
  thumb_url: string;
  title_snapshot: string;
  architect_snapshot?: string;
  location_snapshot?: string;
  created_at: string;
  source_context?: {
    query?: string;
    filters?: Record<string, string[]>;
  };
}

interface LegacyBoard {
  id: string;
  name: string;
  items: LegacyBoardItem[];
  created_at: string;
  updated_at: string;
}

// ============ Store State ============

interface BoardState {
  boards: Board[];
  activeBoardId: string | null;
  isDrawerOpen: boolean;
  lastSaved: string | null;
  
  // Board CRUD
  createBoard: (title?: string, layoutMode?: LayoutMode) => Board;
  createBoardWithTemplate: (title?: string) => Board;
  deleteBoard: (boardId: string) => void;
  updateBoard: (boardId: string, updates: Partial<Pick<Board, 'title' | 'subtitle' | 'description' | 'cover_image_url' | 'layout_preset' | 'layout_mode' | 'page_format'>>) => void;
  setActiveBoard: (boardId: string | null) => void;
  getBoardById: (boardId: string) => Board | undefined;
  getBoardByShareToken: (token: string) => Board | undefined;
  
  // Block CRUD
  addBlock: (boardId: string, block: Omit<BoardBlock, 'id' | 'position'>) => void;
  addReferenceBlock: (boardId: string, data: Omit<ReferenceBlockData, 'caption' | 'tags'>) => void;
  addTextBlock: (boardId: string, style: TextBlockData['style'], text: string, afterBlockId?: string) => void;
  addDividerBlock: (boardId: string, variant: DividerBlockData['variant'], afterBlockId?: string) => void;
  updateBlock: (boardId: string, blockId: string, updates: Partial<BoardBlock['data']>) => void;
  updateBlockCaption: (boardId: string, blockId: string, caption: string) => void;
  updateBlockImage: (boardId: string, blockId: string, imageId: string, thumbUrl: string, imageUrl?: string) => void;
  removeBlock: (boardId: string, blockId: string) => void;
  reorderBlocks: (boardId: string, blockIds: string[]) => void;
  
  // Drawer
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  
  // Helpers
  getActiveBoard: () => Board | null;
  saveToActiveBoard: (data: Omit<ReferenceBlockData, 'caption' | 'tags'>) => void;
  getBlockCount: (boardId: string) => number;
  getReferenceBlocks: (boardId: string) => ReferenceBlock[];
}

// ============ Utilities ============

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateShareToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Migrate legacy board format to new format
const migrateBoard = (board: Board | LegacyBoard): Board => {
  // Check if already migrated (has blocks array)
  if ('blocks' in board && Array.isArray(board.blocks)) {
    const b = board as Board;
    // Ensure share_token and layout_mode exist
    const needsMigration = !b.share_token || !b.layout_mode;
    if (needsMigration) {
      return { 
        ...b, 
        share_token: b.share_token || generateShareToken(),
        layout_mode: b.layout_mode || 'grid',
      };
    }
    return b;
  }

  // Migrate from legacy format
  const legacyBoard = board as LegacyBoard;
  const blocks: BoardBlock[] = legacyBoard.items.map((item, index) => ({
    type: 'reference' as const,
    id: item.board_item_id,
    position: index,
    data: {
      project_id: item.project_id,
      image_id: item.image_id,
      thumb_url_snapshot: item.thumb_url,
      title_snapshot: item.title_snapshot,
      architect_snapshot: item.architect_snapshot,
      location_snapshot: item.location_snapshot,
      added_from: item.source_context ? {
        query: item.source_context.query,
        filters: item.source_context.filters,
      } : undefined,
    },
  }));

  return {
    id: legacyBoard.id,
    title: legacyBoard.name,
    layout_preset: 'grid',
    layout_mode: 'grid' as LayoutMode,
    page_format: 'web',
    share_token: generateShareToken(),
    blocks,
    created_at: legacyBoard.created_at,
    updated_at: legacyBoard.updated_at,
  };
};

// ============ Store ============

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      isDrawerOpen: false,
      lastSaved: null,

      // ---- Board CRUD ----

      createBoard: (title = 'Untitled Board', layoutMode: LayoutMode = 'grid') => {
        const newBoard: Board = {
          id: generateId(),
          title,
          layout_preset: 'grid',
          layout_mode: layoutMode,
          page_format: 'web',
          share_token: generateShareToken(),
          blocks: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
          lastSaved: new Date().toISOString(),
        }));
        return newBoard;
      },

      createBoardWithTemplate: (title = 'Research Board') => {
        // Create template blocks with narrative structure
        const templateBlocks: BoardBlock[] = [
          {
            type: 'text',
            id: generateId(),
            position: 0,
            data: {
              style: 'h1',
              text: 'Design Intent',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 1,
            data: {
              style: 'body',
              text: 'Add reference projects that exemplify the design direction...',
            },
          },
          {
            type: 'divider',
            id: generateId(),
            position: 2,
            data: {
              variant: 'space-lg',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 3,
            data: {
              style: 'h2',
              text: 'Spatial Strategy',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 4,
            data: {
              style: 'body',
              text: 'Explore how similar projects organize space and circulation...',
            },
          },
          {
            type: 'divider',
            id: generateId(),
            position: 5,
            data: {
              variant: 'space-lg',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 6,
            data: {
              style: 'h2',
              text: 'Material Palette',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 7,
            data: {
              style: 'body',
              text: 'Collect precedents that inform material and finish decisions...',
            },
          },
          {
            type: 'divider',
            id: generateId(),
            position: 8,
            data: {
              variant: 'space-lg',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 9,
            data: {
              style: 'h2',
              text: 'Key Takeaways',
            },
          },
          {
            type: 'text',
            id: generateId(),
            position: 10,
            data: {
              style: 'body',
              text: 'Summarize the main insights and design principles...',
            },
          },
        ];

        const newBoard: Board = {
          id: generateId(),
          title,
          subtitle: 'A curated collection of architectural precedents',
          layout_preset: 'grid',
          layout_mode: 'grid',
          page_format: 'web',
          share_token: generateShareToken(),
          blocks: templateBlocks,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
          lastSaved: new Date().toISOString(),
        }));
        return newBoard;
      },

      deleteBoard: (boardId) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== boardId),
          activeBoardId: state.activeBoardId === boardId ? null : state.activeBoardId,
          lastSaved: new Date().toISOString(),
        }));
      },

      updateBoard: (boardId, updates) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, ...updates, updated_at: new Date().toISOString() }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      setActiveBoard: (boardId) => {
        set({ activeBoardId: boardId });
      },

      getBoardById: (boardId) => {
        return get().boards.find((b) => b.id === boardId);
      },

      getBoardByShareToken: (token) => {
        return get().boards.find((b) => b.share_token === token);
      },

      // ---- Block CRUD ----

      addBlock: (boardId, block) => {
        const newBlock: BoardBlock = {
          ...block,
          id: generateId(),
          position: get().boards.find((b) => b.id === boardId)?.blocks.length || 0,
        } as BoardBlock;

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: [...b.blocks, newBlock],
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      addReferenceBlock: (boardId, data) => {
        const state = get();
        const board = state.boards.find((b) => b.id === boardId);
        const position = board?.blocks.length || 0;

        const newBlock: ReferenceBlock = {
          type: 'reference',
          id: generateId(),
          position,
          data: {
            ...data,
            caption: undefined,
            tags: [],
          },
        };

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: [...b.blocks, newBlock],
                  // Set cover image to first reference if none set
                  cover_image_url: b.cover_image_url || data.thumb_url_snapshot,
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      addTextBlock: (boardId, style, text, afterBlockId) => {
        const state = get();
        const board = state.boards.find((b) => b.id === boardId);
        if (!board) return;

        let insertIndex = board.blocks.length;
        if (afterBlockId) {
          const afterIndex = board.blocks.findIndex((b) => b.id === afterBlockId);
          if (afterIndex !== -1) insertIndex = afterIndex + 1;
        }

        const newBlock: TextBlock = {
          type: 'text',
          id: generateId(),
          position: insertIndex,
          data: { style, text },
        };

        // Reposition blocks after insert
        const newBlocks = [...board.blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        const repositionedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, blocks: repositionedBlocks, updated_at: new Date().toISOString() }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      addDividerBlock: (boardId, variant, afterBlockId) => {
        const state = get();
        const board = state.boards.find((b) => b.id === boardId);
        if (!board) return;

        let insertIndex = board.blocks.length;
        if (afterBlockId) {
          const afterIndex = board.blocks.findIndex((b) => b.id === afterBlockId);
          if (afterIndex !== -1) insertIndex = afterIndex + 1;
        }

        const newBlock: DividerBlock = {
          type: 'divider',
          id: generateId(),
          position: insertIndex,
          data: { variant },
        };

        const newBlocks = [...board.blocks];
        newBlocks.splice(insertIndex, 0, newBlock);
        const repositionedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));

        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, blocks: repositionedBlocks, updated_at: new Date().toISOString() }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      updateBlock: (boardId, blockId, updates) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: b.blocks.map((block) =>
                    block.id === blockId
                      ? { ...block, data: { ...block.data, ...updates } }
                      : block
                  ) as BoardBlock[],
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      updateBlockCaption: (boardId, blockId, caption) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: b.blocks.map((block) =>
                    block.id === blockId && block.type === 'reference'
                      ? { ...block, data: { ...block.data, caption } }
                      : block
                  ) as BoardBlock[],
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      updateBlockImage: (boardId, blockId, imageId, thumbUrl, imageUrl) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: b.blocks.map((block) =>
                    block.id === blockId && block.type === 'reference'
                      ? {
                          ...block,
                          data: {
                            ...block.data,
                            image_id: imageId,
                            thumb_url_snapshot: thumbUrl,
                            image_url_snapshot: imageUrl,
                          },
                        }
                      : block
                  ) as BoardBlock[],
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      removeBlock: (boardId, blockId) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  blocks: b.blocks
                    .filter((block) => block.id !== blockId)
                    .map((block, i) => ({ ...block, position: i })),
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
          lastSaved: new Date().toISOString(),
        }));
      },

      reorderBlocks: (boardId, blockIds) => {
        set((state) => ({
          boards: state.boards.map((b) => {
            if (b.id !== boardId) return b;

            const blockMap = new Map(b.blocks.map((block) => [block.id, block]));
            const reorderedBlocks = blockIds
              .map((id, index) => {
                const block = blockMap.get(id);
                if (!block) return null;
                return { ...block, position: index };
              })
              .filter((b): b is BoardBlock => b !== null);

            return {
              ...b,
              blocks: reorderedBlocks,
              updated_at: new Date().toISOString(),
            };
          }),
          lastSaved: new Date().toISOString(),
        }));
      },

      // ---- Drawer ----

      toggleDrawer: () => {
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen }));
      },

      openDrawer: () => {
        set({ isDrawerOpen: true });
      },

      closeDrawer: () => {
        set({ isDrawerOpen: false });
      },

      // ---- Helpers ----

      getActiveBoard: () => {
        const state = get();
        return state.boards.find((b) => b.id === state.activeBoardId) || null;
      },

      saveToActiveBoard: (data) => {
        const state = get();
        let boardId = state.activeBoardId;

        // Create a board if none exists
        if (!boardId || !state.boards.find((b) => b.id === boardId)) {
          const newBoard = state.createBoard();
          boardId = newBoard.id;
        }

        state.addReferenceBlock(boardId, data);
        state.openDrawer();
      },

      getBlockCount: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        return board?.blocks.length || 0;
      },

      getReferenceBlocks: (boardId) => {
        const board = get().boards.find((b) => b.id === boardId);
        if (!board) return [];
        return board.blocks.filter((b): b is ReferenceBlock => b.type === 'reference');
      },
    }),
    {
      name: 'archipedia-boards',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Migrate from v1 (legacy format) to v2 (blocks format)
          const state = persistedState as { boards: (Board | LegacyBoard)[] };
          return {
            ...state,
            boards: state.boards.map(migrateBoard),
            lastSaved: null,
          };
        }
        return persistedState as BoardState;
      },
    }
  )
);
