import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Editor, TLShape } from 'tldraw';

interface PresentModeProps {
  boardId: string;
  editor: Editor | null;
  onClose: () => void;
}

interface FrameData {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  shapes: TLShape[];
}

export function PresentMode({ boardId, editor, onClose }: PresentModeProps) {
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get all frames sorted by position (y then x)
  useEffect(() => {
    if (!editor) return;

    const allShapes = editor.getCurrentPageShapes();
    const frameShapes = allShapes.filter((s) => s.type === 'frame');

    // Sort by y, then x
    const sortedFrames = frameShapes
      .map((frame) => ({
        id: frame.id,
        x: frame.x,
        y: frame.y,
        w: (frame.props as any).w || 1920,
        h: (frame.props as any).h || 1080,
        title: (frame.props as any).title || 'Untitled',
        shapes: allShapes.filter(
          (s) =>
            s.id !== frame.id &&
            s.x >= frame.x &&
            s.y >= frame.y &&
            s.x + ((s.props as any).w || 100) <= frame.x + ((frame.props as any).w || 1920) &&
            s.y + ((s.props as any).h || 100) <= frame.y + ((frame.props as any).h || 1080)
        ),
      }))
      .sort((a, b) => {
        if (Math.abs(a.y - b.y) > 100) return a.y - b.y;
        return a.x - b.x;
      });

    setFrames(sortedFrames);
  }, [editor]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          setCurrentIndex((i) => Math.max(0, i - 1));
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          setCurrentIndex((i) => Math.min(frames.length - 1, i + 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length, onClose]);

  const goToPrevious = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goToNext = () => setCurrentIndex((i) => Math.min(frames.length - 1, i + 1));

  const currentFrame = frames[currentIndex];

  if (frames.length === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center', color: 'white' }}>
          <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 16, marginBottom: 20 }}>
            No frames to present.
          </p>
          <p style={{ fontFamily: 'var(--font-secondary)', fontSize: 14, opacity: 0.6 }}>
            Add frames to your canvas to create slides.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 20,
              padding: '10px 24px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: 14,
            }}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: 0.8,
          transition: 'opacity 200ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        <span
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 14,
            color: 'white',
          }}
        >
          {currentFrame?.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {currentIndex + 1} / {frames.length}
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Frame content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {currentFrame && (
          <div
            style={{
              width: '100%',
              maxWidth: currentFrame.w,
              aspectRatio: `${currentFrame.w}/${currentFrame.h}`,
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Render frame content - simplified view */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-primary)',
                fontSize: 24,
                color: 'rgba(0,0,0,0.3)',
              }}
            >
              {currentFrame.title}
              {currentFrame.shapes.length > 0 && (
                <span style={{ fontSize: 14, marginLeft: 12 }}>
                  ({currentFrame.shapes.length} objects)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
        }}
      >
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            color: 'white',
            opacity: currentIndex === 0 ? 0.3 : 1,
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === frames.length - 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            cursor: currentIndex === frames.length - 1 ? 'not-allowed' : 'pointer',
            color: 'white',
            opacity: currentIndex === frames.length - 1 ? 0.3 : 1,
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
        }}
      >
        {frames.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

