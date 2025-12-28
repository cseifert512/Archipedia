import { create } from 'zustand';
import { TLStoreSnapshot, Editor } from 'tldraw';

const API_BASE = 'http://localhost:8000';

// ============ Types ============

export interface BoardDoc {
  board_id: string;
  version: number;
  schema_version: number;
  doc_json: TLStoreSnapshot;
  updated_at: string;
}

interface TlCanvasState {
  // Document state
  boardId: string | null;
  version: number;
  schemaVersion: number;
  lastSavedAt: string | null;
  
  // Editor reference
  editor: Editor | null;
  
  // Save status
  isSaving: boolean;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  
  // Conflict state
  hasConflict: boolean;
  conflictVersion: number | null;
  
  // Actions
  setEditor: (editor: Editor | null) => void;
  setBoardId: (boardId: string) => void;
  loadDocument: (boardId: string) => Promise<boolean>;
  saveDocument: () => Promise<boolean>;
  markUnsaved: () => void;
  resolveConflict: (action: 'reload' | 'overwrite') => Promise<void>;
  reset: () => void;
}

// ============ Debounce Helper ============

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DELAY = 700;

// ============ Store ============

export const useTlCanvasStore = create<TlCanvasState>((set, get) => ({
  // Initial state
  boardId: null,
  version: 0,
  schemaVersion: 1,
  lastSavedAt: null,
  editor: null,
  isSaving: false,
  saveError: null,
  hasUnsavedChanges: false,
  hasConflict: false,
  conflictVersion: null,

  setEditor: (editor) => {
    set({ editor });
    
    // Set up change listener for autosave
    if (editor) {
      editor.store.listen(() => {
        get().markUnsaved();
      });
    }
  },

  setBoardId: (boardId) => {
    set({ boardId, version: 0, hasUnsavedChanges: false });
  },

  loadDocument: async (boardId) => {
    set({ boardId, isSaving: false, saveError: null, hasConflict: false });
    
    try {
      const response = await fetch(`${API_BASE}/boards/${boardId}/doc`);
      
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status}`);
      }
      
      const data: BoardDoc = await response.json();
      
      set({
        version: data.version,
        schemaVersion: data.schema_version,
        lastSavedAt: data.updated_at,
        hasUnsavedChanges: false,
      });
      
      // Load snapshot into editor if available
      const { editor } = get();
      if (editor && data.doc_json) {
        try {
          editor.store.loadSnapshot(data.doc_json);
        } catch (e) {
          console.warn('Failed to load snapshot, using default state:', e);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load document:', error);
      set({ 
        saveError: error instanceof Error ? error.message : 'Failed to load',
        version: 0,
      });
      return false;
    }
  },

  saveDocument: async () => {
    const { boardId, version, editor, isSaving, hasConflict } = get();
    
    if (!boardId || !editor || isSaving || hasConflict) {
      return false;
    }
    
    set({ isSaving: true, saveError: null });
    
    try {
      // Get current snapshot from editor
      const snapshot = editor.store.getSnapshot();
      
      const response = await fetch(`${API_BASE}/boards/${boardId}/doc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc_json: snapshot,
          expected_version: version,
        }),
      });
      
      if (response.status === 409) {
        // Version conflict
        const errorData = await response.json();
        const currentVersion = parseInt(errorData.detail?.match(/current is (\d+)/)?.[1] || '0');
        
        set({
          isSaving: false,
          hasConflict: true,
          conflictVersion: currentVersion,
          saveError: 'Document was modified elsewhere',
        });
        return false;
      }
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      
      const data: BoardDoc = await response.json();
      
      set({
        version: data.version,
        lastSavedAt: data.updated_at,
        isSaving: false,
        hasUnsavedChanges: false,
        saveError: null,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save document:', error);
      set({
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Save failed',
      });
      return false;
    }
  },

  markUnsaved: () => {
    const { boardId } = get();
    if (!boardId) return;
    
    set({ hasUnsavedChanges: true });
    
    // Debounced autosave
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
      get().saveDocument();
    }, AUTOSAVE_DELAY);
  },

  resolveConflict: async (action) => {
    const { boardId } = get();
    if (!boardId) return;
    
    if (action === 'reload') {
      // Reload document from server
      set({ hasConflict: false, conflictVersion: null });
      await get().loadDocument(boardId);
    } else if (action === 'overwrite') {
      // Force save with current server version
      const { conflictVersion, editor } = get();
      if (!editor || conflictVersion === null) return;
      
      set({ 
        version: conflictVersion,
        hasConflict: false, 
        conflictVersion: null,
      });
      
      await get().saveDocument();
    }
  },

  reset: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    set({
      boardId: null,
      version: 0,
      schemaVersion: 1,
      lastSavedAt: null,
      editor: null,
      isSaving: false,
      saveError: null,
      hasUnsavedChanges: false,
      hasConflict: false,
      conflictVersion: null,
    });
  },
}));

// ============ API Helpers ============

export async function createCanvasBoard(title: string = 'Untitled Board'): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        layout_mode: 'canvas',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create board');
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Failed to create canvas board:', error);
    return null;
  }
}

export async function updateBoardLayoutMode(boardId: string, mode: 'grid' | 'canvas'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/boards/${boardId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layout_mode: mode,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to update layout mode:', error);
    return false;
  }
}

