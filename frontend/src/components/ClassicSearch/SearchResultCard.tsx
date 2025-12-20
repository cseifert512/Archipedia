import React, { useState, useCallback } from 'react';
import { Bookmark, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { MatchReasonBadge } from './MatchReasonBadge';

export interface ProjectImage {
  image_id: string;
  thumb_url: string;
  image_url: string;
}

export interface SearchResultData {
  project_id: string;
  project_title: string;
  architect: string;
  location_display: string;
  year?: number;
  image_id: string;
  thumb_url: string;
  image_url: string;
  images?: ProjectImage[]; // Multiple images for the project
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
  onOpen: (result: SearchResultData, currentImageIndex?: number) => void;
  onSave: (result: SearchResultData, currentImage?: ProjectImage) => void;
  onSearchLikeThis: (result: SearchResultData, currentImage?: ProjectImage) => void;
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Build images array - use provided images or fallback to single image
  const images: ProjectImage[] = result.images && result.images.length > 0
    ? result.images
    : [{ image_id: result.image_id, thumb_url: result.thumb_url, image_url: result.image_url }];

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageError(false);
  }, [images.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setImageError(false);
  }, [images.length]);

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
            src={currentImage.thumb_url || currentImage.image_url}
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

        {/* Image Navigation Arrows - Always visible when multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(80, 80, 80, 0.3)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(80, 80, 80, 0.9)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(80, 80, 80, 0.3)')}
            >
              <ChevronLeft size={18} style={{ color: '#fff' }} />
            </button>
            <button
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(80, 80, 80, 0.3)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(80, 80, 80, 0.9)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(80, 80, 80, 0.3)')}
            >
              <ChevronRight size={18} style={{ color: '#fff' }} />
            </button>
          </>
        )}

        {/* Image Indicator Dots - Always visible when multiple images */}
        {hasMultipleImages && (
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '5px',
            }}
          >
            {images.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'all 150ms ease',
                }}
              />
            ))}
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
              onClick={() => onSave(result, currentImage)}
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
              onClick={() => onSearchLikeThis(result, currentImage)}
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

