import React, { useState } from 'react';
import { Bookmark, Search, ExternalLink } from 'lucide-react';
import { MatchReasonBadge } from './MatchReasonBadge';

export interface SearchResultData {
  project_id: string;
  project_title: string;
  architect: string;
  location_display: string;
  year?: number;
  image_id: string;
  thumb_url: string;
  image_url: string;
  score: number;
  match_reason?: string;
  badges?: {
    typology?: string[];
    country?: string[];
    climate_bin?: string[];
  };
}

interface SearchResultCardProps {
  result: SearchResultData;
  onOpen: (result: SearchResultData) => void;
  onSave: (result: SearchResultData) => void;
  onSearchLikeThis: (result: SearchResultData) => void;
  isSaved?: boolean;
}

export function SearchResultCard({
  result,
  onOpen,
  onSave,
  onSearchLikeThis,
  isSaved = false,
}: SearchResultCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const badges = [
    ...(result.badges?.typology || []),
    ...(result.badges?.country || []),
    ...(result.badges?.climate_bin || []),
  ].slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.1)',
        overflow: 'hidden',
        transition: 'all 200ms ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 24px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(result)}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '66.67%',
          backgroundColor: 'rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {!imageError ? (
          <img
            src={result.thumb_url || result.image_url}
            alt={result.project_title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 300ms ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
            }}
          >
            Image unavailable
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '6px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onSave(result)}
              title="Save to board"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: isSaved ? 'var(--accent)' : 'rgba(255,255,255,0.95)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Bookmark
                size={16}
                style={{
                  color: isSaved ? 'white' : '#000',
                  fill: isSaved ? 'white' : 'none',
                }}
              />
            </button>
            <button
              onClick={() => onSearchLikeThis(result)}
              title="Search like this"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Search size={16} style={{ color: '#000' }} />
            </button>
          </div>
        )}

        {/* Match Score Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
          }}
        >
          <MatchReasonBadge
            score={result.score}
            reason={result.match_reason}
            typology={result.badges?.typology?.[0]}
            country={result.badges?.country?.[0]}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '15px',
            fontWeight: 600,
            color: '#000',
            margin: 0,
            marginBottom: '4px',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.project_title}
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            color: 'rgba(0,0,0,0.6)',
            margin: 0,
            marginBottom: '8px',
          }}
        >
          {result.architect}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '12px',
            color: 'rgba(0,0,0,0.5)',
            margin: 0,
            marginBottom: badges.length > 0 ? '10px' : 0,
          }}
        >
          {result.location_display}
          {result.year && ` · ${result.year}`}
        </p>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {badges.map((badge, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '10px',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  color: 'rgba(0,0,0,0.6)',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

