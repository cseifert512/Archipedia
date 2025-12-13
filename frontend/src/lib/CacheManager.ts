/**
 * Cache Manager
 * Intelligent caching system for node execution results
 * Uses parameter hashing to determine cache hits
 */

import { Node } from 'reactflow';
import { NodeData, NodeType } from '../types/nodes';
import { NodeExecutionResult } from './workflowEngine';

export interface CacheEntry {
  result: NodeExecutionResult;
  timestamp: number;
  cacheKey: string;
  nodeId: string;
}

/**
 * Generate a cache key from node parameters and inputs
 */
export function generateCacheKey(
  node: Node<NodeData>,
  inputs: Record<string, any>
): string {
  const { type, id } = node.data;
  
  // Extract all parameter values
  const params: Record<string, any> = {};
  Object.keys(node.data).forEach(key => {
    if (key !== 'id' && key !== 'type' && key !== 'label' && 
        key !== 'executionStatus' && key !== 'executionResult' &&
        key !== 'inputs' && key !== 'outputs' && key !== 'selected') {
      const v = (node.data as any)[key];
      // Avoid unstable/huge objects in cache keys (e.g., File, data URLs)
      if (typeof File !== 'undefined' && v instanceof File) {
        params[key] = { name: v.name, size: v.size, type: v.type, lastModified: v.lastModified };
      } else if (typeof v === 'string' && v.startsWith('data:') && v.length > 64) {
        params[key] = { dataUrl: true, length: v.length, prefix: v.slice(0, 32) };
      } else {
        params[key] = v;
      }
    }
  });

  // Include input values in cache key
  const inputValues = Object.entries(inputs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('|');

  // Create deterministic string representation
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('|');

  // Simple hash function
  const combined = `${type}|${paramString}|${inputValues}`;
  return hashString(combined);
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cache Manager class
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 1000; // Maximum number of cached entries
  private ttl: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Get cached result if available
   */
  get(node: Node<NodeData>, inputs: Record<string, any>): NodeExecutionResult | null {
    const cacheKey = generateCacheKey(node, inputs);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.result;
  }

  /**
   * Store result in cache
   */
  set(node: Node<NodeData>, inputs: Record<string, any>, result: NodeExecutionResult): void {
    const cacheKey = generateCacheKey(node, inputs);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      cacheKey,
      nodeId: node.data.id,
    });
  }

  /**
   * Invalidate cache for a specific node
   */
  invalidateNode(nodeId: string): void {
    // Find all cache entries for this node
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.nodeId === nodeId) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses to calculate
    };
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    // Find oldest entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

