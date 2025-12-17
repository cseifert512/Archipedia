import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoardItem {
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

export interface Board {
  id: string;
  name: string;
  items: BoardItem[];
  created_at: string;
  updated_at: string;
}

interface BoardState {
  boards: Board[];
  activeBoardId: string | null;
  isDrawerOpen: boolean;
  
  // Actions
  createBoard: (name?: string) => Board;
  deleteBoard: (boardId: string) => void;
  renameBoard: (boardId: string, name: string) => void;
  setActiveBoard: (boardId: string | null) => void;
  
  addItemToBoard: (boardId: string, item: Omit<BoardItem, 'board_item_id' | 'created_at'>) => void;
  removeItemFromBoard: (boardId: string, itemId: string) => void;
  
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  
  // Helpers
  getActiveBoard: () => Board | null;
  saveToActiveBoard: (item: Omit<BoardItem, 'board_item_id' | 'created_at'>) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      isDrawerOpen: false,

      createBoard: (name = 'Untitled Board') => {
        const newBoard: Board = {
          id: generateId(),
          name,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
        }));
        return newBoard;
      },

      deleteBoard: (boardId) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== boardId),
          activeBoardId: state.activeBoardId === boardId ? null : state.activeBoardId,
        }));
      },

      renameBoard: (boardId, name) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId ? { ...b, name, updated_at: new Date().toISOString() } : b
          ),
        }));
      },

      setActiveBoard: (boardId) => {
        set({ activeBoardId: boardId });
      },

      addItemToBoard: (boardId, item) => {
        const newItem: BoardItem = {
          ...item,
          board_item_id: generateId(),
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? { ...b, items: [...b.items, newItem], updated_at: new Date().toISOString() }
              : b
          ),
        }));
      },

      removeItemFromBoard: (boardId, itemId) => {
        set((state) => ({
          boards: state.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  items: b.items.filter((i) => i.board_item_id !== itemId),
                  updated_at: new Date().toISOString(),
                }
              : b
          ),
        }));
      },

      toggleDrawer: () => {
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen }));
      },

      openDrawer: () => {
        set({ isDrawerOpen: true });
      },

      closeDrawer: () => {
        set({ isDrawerOpen: false });
      },

      getActiveBoard: () => {
        const state = get();
        return state.boards.find((b) => b.id === state.activeBoardId) || null;
      },

      saveToActiveBoard: (item) => {
        const state = get();
        let boardId = state.activeBoardId;
        
        // Create a board if none exists
        if (!boardId || !state.boards.find((b) => b.id === boardId)) {
          const newBoard = state.createBoard();
          boardId = newBoard.id;
        }
        
        state.addItemToBoard(boardId, item);
        state.openDrawer();
      },
    }),
    {
      name: 'archipedia-boards',
    }
  )
);

