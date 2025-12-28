/**
 * Search history utilities for localStorage-based history tracking.
 * Stores recent searches for quick access and repeat queries.
 */

const HISTORY_KEY = 'archipedia_search_history';
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  hasImage: boolean;
  resultCount?: number;
}

/**
 * Add a search to history. Deduplicates and moves existing queries to top.
 */
export function addToHistory(query: string, hasImage: boolean, resultCount?: number): void {
  if (!query.trim() && !hasImage) return;
  
  const history = getHistory();
  // Remove existing entry for this query (to avoid duplicates)
  const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  
  // Add new entry at the beginning
  filtered.unshift({
    query: query.trim(),
    timestamp: Date.now(),
    hasImage,
    resultCount,
  });
  
  // Keep only MAX_HISTORY items
  const trimmed = filtered.slice(0, MAX_HISTORY);
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // localStorage might be full or disabled
    console.warn('Failed to save search history:', e);
  }
}

/**
 * Get all search history items, sorted by most recent first.
 */
export function getHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch (e) {
    console.warn('Failed to read search history:', e);
    return [];
  }
}

/**
 * Clear all search history.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear search history:', e);
  }
}

/**
 * Remove a specific item from history by query text.
 */
export function removeFromHistory(query: string): void {
  const history = getHistory();
  const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to update search history:', e);
  }
}

/**
 * Format timestamp for display (e.g., "2 hours ago", "yesterday").
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  
  // Format as date for older entries
  return new Date(timestamp).toLocaleDateString();
}

