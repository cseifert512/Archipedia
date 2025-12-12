import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    typology: string[];
    climate: string[];
  };
  onFilterChange: (category: 'typology' | 'climate', value: string, checked: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const TYPOLOGY_OPTIONS = ['Cultural', 'Educational', 'Commercial', 'Residential', 'Civic'];
const CLIMATE_OPTIONS = ['Temperate', 'Arid / Hot-Dry', 'Hot-Humid', 'Cold', 'Mediterranean', 'Continental'];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Filter size={18} />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(0,0,0,0.6)',
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              transition: 'color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(0,0,0,0.6)';
            }}
          >
            <X size={14} style={{ marginRight: '4px' }} />
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Typology
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TYPOLOGY_OPTIONS.map((type) => {
              const isChecked = filters.typology.includes(type);
              return (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: isChecked ? '#000' : '#1a1a1a',
                    cursor: 'pointer',
                    padding: '6px 0',
                    fontWeight: isChecked ? 500 : 400,
                    transition: 'all 150ms ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onFilterChange('typology', type, e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid #CCCCCC',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      accentColor: '#FFC800',
                    }}
                  />
                  {type}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Climate
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CLIMATE_OPTIONS.map((climate) => {
              const isChecked = filters.climate.includes(climate);
              return (
                <label
                  key={climate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: isChecked ? '#000' : '#1a1a1a',
                    cursor: 'pointer',
                    padding: '6px 0',
                    fontWeight: isChecked ? 500 : 400,
                    transition: 'all 150ms ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onFilterChange('climate', climate, e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '1px solid #CCCCCC',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      accentColor: '#FFC800',
                    }}
                  />
                  {climate}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
