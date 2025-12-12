import React from 'react';
import { SearchResult } from '../../stores/searchStore';
import { ResultCard } from './ResultCard';

interface ResultsGridProps {
  results: SearchResult[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onDragStart?: (e: React.DragEvent, project: SearchResult) => void;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  results,
  selectedIds,
  onSelect,
  onDragStart,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {results.map((project) => (
        <ResultCard
          key={project.id}
          project={project}
          selected={selectedIds.includes(project.id)}
          onSelect={onSelect}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
};

