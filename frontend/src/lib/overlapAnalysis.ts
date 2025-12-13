import { PrecedentProject } from '../types/nodes';

export interface OverlapResult {
  attr: string;
  count: number;
  total: number;
}

export function analyzeOverlap(projects: PrecedentProject[]): OverlapResult[] {
  const attributes = projects.flatMap((p) => Object.entries(p.attributes));
  const frequency: Record<string, number> = {};
  
  attributes.forEach(([key, val]) => {
    if (val) {
      const attrKey = `${key}:${val}`;
      frequency[attrKey] = (frequency[attrKey] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .filter(([_, count]) => count >= 2)
    .map(([attr, count]) => ({
      attr,
      count,
      total: projects.length,
    }))
    .sort((a, b) => b.count - a.count);
}

