import React from 'react';

interface RecipeTemplate {
  id: string;
  name: string;
  description: string;
  author: string;
}

const recipeTemplates: RecipeTemplate[] = [
  {
    id: 'template-1',
    name: 'Iterate Precedent',
    description: 'Generate variations from precedent stack',
    author: 'Archipedia Team',
  },
  {
    id: 'template-2',
    name: 'Parametric Exploration',
    description: 'Explore design space with parametric variation',
    author: 'Community',
  },
  {
    id: 'template-3',
    name: 'Concept to 3D',
    description: 'From sketch concept to 3D model generation',
    author: 'Archipedia Team',
  },
  {
    id: 'template-4',
    name: 'Material Study',
    description: 'Explore material options at scale',
    author: 'Community',
  },
  {
    id: 'template-5',
    name: 'Climate Responsive Design',
    description: 'Generate climate-adapted solutions',
    author: 'Archipedia Team',
  },
];

interface RecipeTemplatesProps {
  onSelectTemplate?: (template: RecipeTemplate) => void;
}

export const RecipeTemplates: React.FC<RecipeTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {recipeTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate?.(template)}
          style={{
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = '#FFC800';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              fontWeight: 400,
              color: '#000000',
              marginBottom: '4px',
            }}
          >
            {template.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '9px',
              color: 'rgba(0,0,0,0.5)',
              marginBottom: '4px',
            }}
          >
            {template.description}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '8px',
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            by {template.author}
          </div>
        </button>
      ))}
    </div>
  );
};



