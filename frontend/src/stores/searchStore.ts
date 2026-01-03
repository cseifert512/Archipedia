import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project } from '../lib/mockData';

export interface SearchResult extends Project {
  matchPercentage?: number;
  similarityScore?: number;
  url?: string;
  typology?: string;
  materials?: string[];
  visualScore?: number;
  spatialScore?: number;
  attributeScore?: number;
  fusedScore?: number;
}

interface SearchState {
  searchResults: SearchResult[];
  searchQuery: string;
  // Canvas page specific state
  canvasFilters: {
    typology: string[];
    climate: string[];
  };
  canvasFusionWeights: {
    visual: number;
    spatial: number;
    attribute: number;
  };
  canvasHasSearched: boolean;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchQuery: (query: string) => void;
  setCanvasFilters: (filters: { typology: string[]; climate: string[] }) => void;
  setCanvasFusionWeights: (weights: { visual: number; spatial: number; attribute: number }) => void;
  setCanvasHasSearched: (hasSearched: boolean) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      searchResults: [],
      searchQuery: '',
      canvasFilters: { typology: [], climate: [] },
      canvasFusionWeights: { visual: 33, spatial: 33, attribute: 34 },
      canvasHasSearched: false,
      setSearchResults: (results) => set({ searchResults: results }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCanvasFilters: (filters) => set({ canvasFilters: filters }),
      setCanvasFusionWeights: (weights) => set({ canvasFusionWeights: weights }),
      setCanvasHasSearched: (hasSearched) => set({ canvasHasSearched: hasSearched }),
    }),
    {
      name: 'archipedia-search-state',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

