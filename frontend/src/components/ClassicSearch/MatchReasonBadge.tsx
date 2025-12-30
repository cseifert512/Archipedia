import React, { useState } from 'react';

interface MatchReasonBadgeProps {
  score: number;
  reason?: string;
  typology?: string;
  country?: string;
  matchedAttrs?: string[];  // List of matched attribute strings from backend
}

export function MatchReasonBadge({ score, reason, typology, country, matchedAttrs }: MatchReasonBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayScore = (score * 100).toFixed(0);
  // Use the provided reason from backend, fallback to generated one
  const matchType = reason || (score >= 0.8 ? 'Very similar' : score >= 0.6 ? 'Similar' : 'Related');

  // Build rich tooltip content
  const tooltipLines: string[] = [];
  
  // Primary match reason with score
  tooltipLines.push(`${matchType} (${(score * 100).toFixed(0)}%)`);
  
  // Add typology and country if provided
  if (typology) tooltipLines.push(`Typology: ${typology}`);
  if (country) tooltipLines.push(`Location: ${country}`);
  
  // Add matched attributes from backend (limit to 3 to avoid clutter)
  if (matchedAttrs && matchedAttrs.length > 0) {
    const attrsToShow = matchedAttrs.slice(0, 3);
    attrsToShow.forEach(attr => {
      // Only add if not already covered by typology/country
      if (!attr.toLowerCase().includes('typology') && !attr.toLowerCase().includes('country')) {
        tooltipLines.push(attr);
      }
    });
  }
  
  const tooltipContent = tooltipLines.join(' · ');

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '6px',
        }}
      >
        {/* Score indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor:
              score >= 0.8
                ? '#32C864'
                : score >= 0.6
                ? '#FFC800'
                : 'rgba(255,255,255,0.5)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'white',
          }}
        >
          {displayScore}%
        </span>
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              color: 'white',
              lineHeight: 1.4,
            }}
          >
            {tooltipContent}
          </div>
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0,0,0,0.9)',
            }}
          />
        </div>
      )}
    </div>
  );
}

