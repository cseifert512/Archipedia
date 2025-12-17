import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterState {
  typology: string[];
  country: string[];
  climate_bin: string[];
  massing_type: string[];
  tags: string[];
  year_range?: { min: number; max: number };
  architect: string[];
  wwr_band: string[];
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const TYPOLOGY_OPTIONS = [
  'Cultural',
  'Educational',
  'Commercial',
  'Residential',
  'Civic',
  'Industrial',
  'Hospitality',
  'Healthcare',
  'Sports',
  'Transportation',
  'Public Space',
  'Sacred',
];

const COUNTRY_OPTIONS = [
  'United States',
  'Mexico',
  'Japan',
  'Switzerland',
  'Denmark',
  'Netherlands',
  'France',
  'Germany',
  'United Kingdom',
  'Spain',
  'Italy',
  'China',
  'Australia',
  'Brazil',
  'India',
];

const CLIMATE_OPTIONS = [
  'Temperate',
  'Arid / Hot-Dry',
  'Hot-Humid',
  'Cold',
  'Mediterranean',
  'Continental',
  'Tropical',
];

const MASSING_OPTIONS = [
  'Courtyard',
  'Linear',
  'Tower',
  'Pavilion',
  'Compound',
  'Atrium',
  'Campus',
];

const TAG_OPTIONS = [
  'Sustainable',
  'Adaptive Reuse',
  'Mass Timber',
  'Prefabricated',
  'Historic',
  'Award Winner',
  'Net Zero',
  'Green Roof',
];

interface FilterGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  defaultExpanded?: boolean;
}

function FilterGroup({ title, options, selected, onChange, defaultExpanded = true }: FilterGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-primary)',
          fontSize: '12px',
          fontWeight: 600,
          color: '#000',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span>
          {title}
          {selected.length > 0 && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--accent)',
              }}
            >
              ({selected.length})
            </span>
          )}
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          {options.map((option) => {
            const isChecked = selected.includes(option);
            return (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                  color: isChecked ? '#000' : 'rgba(0,0,0,0.7)',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontWeight: isChecked ? 500 : 400,
                  transition: 'all 150ms ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleOption(option)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)',
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  const hasActiveFilters =
    filters.typology.length > 0 ||
    filters.country.length > 0 ||
    filters.climate_bin.length > 0 ||
    filters.massing_type.length > 0 ||
    filters.tags.length > 0 ||
    filters.architect.length > 0;

  const totalActiveFilters =
    filters.typology.length +
    filters.country.length +
    filters.climate_bin.length +
    filters.massing_type.length +
    filters.tags.length +
    filters.architect.length;

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '100px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-primary)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#000',
          }}
        >
          <Filter size={16} />
          Filters
          {totalActiveFilters > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: 'white',
                backgroundColor: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {totalActiveFilters}
            </span>
          )}
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
              color: 'rgba(0,0,0,0.5)',
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.5)')}
          >
            <X size={14} style={{ marginRight: '4px' }} />
            Clear all
          </button>
        )}
      </div>

      {/* Primary Filters */}
      <FilterGroup
        title="Typology"
        options={TYPOLOGY_OPTIONS}
        selected={filters.typology}
        onChange={(values) => updateFilter('typology', values)}
      />
      
      <FilterGroup
        title="Country"
        options={COUNTRY_OPTIONS}
        selected={filters.country}
        onChange={(values) => updateFilter('country', values)}
      />
      
      <FilterGroup
        title="Climate"
        options={CLIMATE_OPTIONS}
        selected={filters.climate_bin}
        onChange={(values) => updateFilter('climate_bin', values)}
      />
      
      <FilterGroup
        title="Massing Type"
        options={MASSING_OPTIONS}
        selected={filters.massing_type}
        onChange={(values) => updateFilter('massing_type', values)}
        defaultExpanded={false}
      />
      
      <FilterGroup
        title="Tags"
        options={TAG_OPTIONS}
        selected={filters.tags}
        onChange={(values) => updateFilter('tags', values)}
        defaultExpanded={false}
      />

      {/* More Filters Toggle */}
      <button
        onClick={() => setShowMoreFilters(!showMoreFilters)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '12px',
          marginTop: '8px',
          background: 'rgba(0,0,0,0.03)',
          border: '1px dashed rgba(0,0,0,0.15)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-secondary)',
          fontSize: '12px',
          color: 'rgba(0,0,0,0.6)',
          transition: 'all 150ms ease',
        }}
      >
        {showMoreFilters ? 'Hide' : 'More filters'}
        {showMoreFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Extended Filters */}
      {showMoreFilters && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#000',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Year Range
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="1900"
                value={filters.year_range?.min || ''}
                onChange={(e) =>
                  updateFilter('year_range', {
                    min: parseInt(e.target.value) || 1900,
                    max: filters.year_range?.max || 2025,
                  })
                }
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                }}
              />
              <span style={{ color: 'rgba(0,0,0,0.4)' }}>—</span>
              <input
                type="number"
                placeholder="2025"
                value={filters.year_range?.max || ''}
                onChange={(e) =>
                  updateFilter('year_range', {
                    min: filters.year_range?.min || 1900,
                    max: parseInt(e.target.value) || 2025,
                  })
                }
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-primary)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#000',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              Architect
            </label>
            <input
              type="text"
              placeholder="Search architects..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '6px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

