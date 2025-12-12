import React from 'react';

interface TriSliderProps {
  visualValue: number;
  spatialValue: number;
  attributeValue: number;
  onChange: (weights: { visual: number; spatial: number; attribute: number }) => void;
  compact?: boolean; // For compact horizontal layout
}

export const TriSlider: React.FC<TriSliderProps> = ({
  visualValue,
  spatialValue,
  attributeValue,
  onChange,
  compact = false,
}) => {
  const handleSliderChange = (channel: 'visual' | 'spatial' | 'attribute', newValue: number) => {
    const values = { visual: visualValue, spatial: spatialValue, attribute: attributeValue };
    values[channel] = newValue;
    
    // Normalize to 100
    const total = values.visual + values.spatial + values.attribute;
    if (total === 0) {
      onChange({ visual: 33, spatial: 33, attribute: 34 });
      return;
    }
    
    onChange({
      visual: Math.round((values.visual / total) * 100),
      spatial: Math.round((values.spatial / total) * 100),
      attribute: Math.round((values.attribute / total) * 100),
    });
  };

  if (compact) {
    // Compact horizontal layout
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Visual Similarity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Visual Similarity</span>
              <span style={{ color: 'rgba(0,0,0,0.5)' }}>{visualValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={visualValue}
              onChange={(e) => handleSliderChange('visual', parseInt(e.target.value))}
              className="tri-slider tri-slider-yellow"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, #FFC800 0%, #FFC800 ${visualValue}%, rgba(255, 200, 0, 0.2) ${visualValue}%, rgba(255, 200, 0, 0.2) 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '9px',
                fontWeight: 300,
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              Motif-level features
            </div>
          </div>

          {/* Spatial Logic */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Spatial Logic</span>
              <span style={{ color: 'rgba(0,0,0,0.5)' }}>{spatialValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={spatialValue}
              onChange={(e) => handleSliderChange('spatial', parseInt(e.target.value))}
              className="tri-slider tri-slider-blue"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, #64B5FF 0%, #64B5FF ${spatialValue}%, rgba(100, 181, 255, 0.2) ${spatialValue}%, rgba(100, 181, 255, 0.2) 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '9px',
                fontWeight: 300,
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              Plan descriptors
            </div>
          </div>

          {/* Regional Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-primary)',
                fontSize: '11px',
                fontWeight: 400,
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Regional Context</span>
              <span style={{ color: 'rgba(0,0,0,0.5)' }}>{attributeValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={attributeValue}
              onChange={(e) => handleSliderChange('attribute', parseInt(e.target.value))}
              className="tri-slider tri-slider-green"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                appearance: 'none',
                background: `linear-gradient(to right, #32C864 0%, #32C864 ${attributeValue}%, rgba(50, 200, 100, 0.2) ${attributeValue}%, rgba(50, 200, 100, 0.2) 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '9px',
                fontWeight: 300,
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              Climate & materials
            </div>
          </div>
        </div>

        <style>{`
          .tri-slider::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #FFFFFF;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .tri-slider-yellow::-webkit-slider-thumb {
            border: 2px solid #FFC800;
          }
          
          .tri-slider-blue::-webkit-slider-thumb {
            border: 2px solid #64B5FF;
          }
          
          .tri-slider-green::-webkit-slider-thumb {
            border: 2px solid #32C864;
          }
          
          .tri-slider::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #FFFFFF;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: none;
          }
          
          .tri-slider-yellow::-moz-range-thumb {
            border: 2px solid #FFC800;
          }
          
          .tri-slider-blue::-moz-range-thumb {
            border: 2px solid #64B5FF;
          }
          
          .tri-slider-green::-moz-range-thumb {
            border: 2px solid #32C864;
          }
        `}</style>
      </>
    );
  }

  // Original vertical layout (for left panel)
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Visual Similarity Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Visual Similarity
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={visualValue}
            onChange={(e) => handleSliderChange('visual', parseInt(e.target.value))}
            className="tri-slider tri-slider-yellow"
            style={{
              width: '160px',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              background: `linear-gradient(to right, #FFC800 0%, #FFC800 ${visualValue}%, rgba(255, 200, 0, 0.2) ${visualValue}%, rgba(255, 200, 0, 0.2) 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              fontWeight: 300,
              color: 'rgba(0,0,0,0.6)',
            }}
          >
            Motif-level features • {visualValue}%
          </div>
        </div>

        {/* Spatial Logic Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Spatial Logic
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={spatialValue}
            onChange={(e) => handleSliderChange('spatial', parseInt(e.target.value))}
            className="tri-slider tri-slider-blue"
            style={{
              width: '160px',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              background: `linear-gradient(to right, #64B5FF 0%, #64B5FF ${spatialValue}%, rgba(100, 181, 255, 0.2) ${spatialValue}%, rgba(100, 181, 255, 0.2) 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              fontWeight: 300,
              color: 'rgba(0,0,0,0.6)',
            }}
          >
            Plan descriptors • {spatialValue}%
          </div>
        </div>

        {/* Regional Context Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13px',
              fontWeight: 400,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Regional Context
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={attributeValue}
            onChange={(e) => handleSliderChange('attribute', parseInt(e.target.value))}
            className="tri-slider tri-slider-green"
            style={{
              width: '160px',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              background: `linear-gradient(to right, #32C864 0%, #32C864 ${attributeValue}%, rgba(50, 200, 100, 0.2) ${attributeValue}%, rgba(50, 200, 100, 0.2) 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '11px',
              fontWeight: 300,
              color: 'rgba(0,0,0,0.6)',
            }}
          >
            Climate & materials • {attributeValue}%
          </div>
        </div>
      </div>

      <style>{`
        .tri-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .tri-slider-yellow::-webkit-slider-thumb {
          border: 2px solid #FFC800;
        }
        
        .tri-slider-blue::-webkit-slider-thumb {
          border: 2px solid #64B5FF;
        }
        
        .tri-slider-green::-webkit-slider-thumb {
          border: 2px solid #32C864;
        }
        
        .tri-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: none;
        }
        
        .tri-slider-yellow::-moz-range-thumb {
          border: 2px solid #FFC800;
        }
        
        .tri-slider-blue::-moz-range-thumb {
          border: 2px solid #64B5FF;
        }
        
        .tri-slider-green::-moz-range-thumb {
          border: 2px solid #32C864;
        }
      `}</style>
    </>
  );
};
