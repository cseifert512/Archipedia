import { create } from 'zustand';
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
  setSearchResults: (results: SearchResult[]) => void;
  setSearchQuery: (query: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchResults: [],
  searchQuery: '',
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

