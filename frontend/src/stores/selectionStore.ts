import { create } from 'zustand';
import type { SearchResultData } from '../components/ClassicSearch';

interface SelectionState {
  // Map of project_id -> SearchResultData for selected projects
  selectedProjects: Map<string, SearchResultData>;
  
  // Whether selection mode is active (shows checkboxes)
  isSelectionMode: boolean;
  
  // Last selected index for shift-click range selection
  lastSelectedIndex: number | null;
  
  // Actions
  toggleSelection: (project: SearchResultData) => void;
  selectAll: (projects: SearchResultData[]) => void;
  selectRange: (projects: SearchResultData[], fromIndex: number, toIndex: number) => void;
  clearSelection: () => void;
  setSelectionMode: (enabled: boolean) => void;
  setLastSelectedIndex: (index: number | null) => void;
  
  // Helpers
  isSelected: (projectId: string) => boolean;
  getSelectedArray: () => SearchResultData[];
  getSelectedCount: () => number;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedProjects: new Map(),
  isSelectionMode: false,
  lastSelectedIndex: null,

  toggleSelection: (project: SearchResultData) => {
    set((state) => {
      const newMap = new Map(state.selectedProjects);
      
      if (newMap.has(project.project_id)) {
        newMap.delete(project.project_id);
      } else {
        newMap.set(project.project_id, project);
      }
      
      // Enable selection mode when first item is selected
      const isSelectionMode = newMap.size > 0 || state.isSelectionMode;
      
      return {
        selectedProjects: newMap,
        isSelectionMode,
      };
    });
  },

  selectAll: (projects: SearchResultData[]) => {
    set(() => {
      const newMap = new Map<string, SearchResultData>();
      projects.forEach((project) => {
        newMap.set(project.project_id, project);
      });
      return {
        selectedProjects: newMap,
        isSelectionMode: true,
      };
    });
  },

  selectRange: (projects: SearchResultData[], fromIndex: number, toIndex: number) => {
    set((state) => {
      const newMap = new Map(state.selectedProjects);
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      
      for (let i = start; i <= end; i++) {
        if (projects[i]) {
          newMap.set(projects[i].project_id, projects[i]);
        }
      }
      
      return {
        selectedProjects: newMap,
        isSelectionMode: true,
      };
    });
  },

  clearSelection: () => {
    set({
      selectedProjects: new Map(),
      isSelectionMode: false,
      lastSelectedIndex: null,
    });
  },

  setSelectionMode: (enabled: boolean) => {
    set((state) => ({
      isSelectionMode: enabled,
      // Clear selection when disabling selection mode
      selectedProjects: enabled ? state.selectedProjects : new Map(),
      lastSelectedIndex: enabled ? state.lastSelectedIndex : null,
    }));
  },

  setLastSelectedIndex: (index: number | null) => {
    set({ lastSelectedIndex: index });
  },

  isSelected: (projectId: string) => {
    return get().selectedProjects.has(projectId);
  },

  getSelectedArray: () => {
    return Array.from(get().selectedProjects.values());
  },

  getSelectedCount: () => {
    return get().selectedProjects.size;
  },
}));



