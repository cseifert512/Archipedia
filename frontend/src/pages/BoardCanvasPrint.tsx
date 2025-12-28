import React, { useEffect, useState } from 'react';
import { useParams, useSearch } from 'wouter';

// This page is rendered by Playwright for PDF export
// It displays frames as individual pages with no editor chrome

interface FrameData {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  objects: CanvasObject[];
}

interface CanvasObject {
  id: string;
  type: string;
  x: number;
  y: number;
  props: Record<string, any>;
}

const API_BASE = 'http://localhost:8000';

export function BoardCanvasPrint() {
  const params = useParams<{ id: string }>();
  const boardId = params.id || '';
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const mode = searchParams.get('mode') || 'frames';

  const [frames, setFrames] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoardDoc();
  }, [boardId]);

  const loadBoardDoc = async () => {
    try {
      const response = await fetch(`${API_BASE}/boards/${boardId}/doc`);
      if (!response.ok) throw new Error('Failed to load document');
      
      const data = await response.json();
      const docJson = data.doc_json;
      
      if (!docJson || !docJson.objects) {
        setFrames([]);
        setLoading(false);
        return;
      }

      // Extract frames and their contents
      const allObjects: CanvasObject[] = docJson.objects;
      const frameObjects = allObjects.filter((o: any) => o.type === 'frame');
      
      // Sort frames by y then x
      const sortedFrames = frameObjects
        .map((frame: any) => {
          const frameX = frame.x || 0;
          const frameY = frame.y || 0;
          const frameW = frame.data?.w || frame.props?.w || 1920;
          const frameH = frame.data?.h || frame.props?.h || 1080;
          
          // Find objects inside this frame
          const objectsInFrame = allObjects.filter((obj: any) => {
            if (obj.id === frame.id) return false;
            const objX = obj.x || 0;
            const objY = obj.y || 0;
            return objX >= frameX && objY >= frameY &&
                   objX <= frameX + frameW && objY <= frameY + frameH;
          });

          return {
            id: frame.id,
            x: frameX,
            y: frameY,
            w: frameW,
            h: frameH,
            title: frame.data?.title || frame.props?.title || 'Untitled',
            objects: objectsInFrame.map((obj: any) => ({
              id: obj.id,
              type: obj.type,
              x: (obj.x || 0) - frameX,
              y: (obj.y || 0) - frameY,
              props: obj.data || obj.props || {},
            })),
          };
        })
        .sort((a: FrameData, b: FrameData) => {
          if (Math.abs(a.y - b.y) > 100) return a.y - b.y;
          return a.x - b.x;
        });

      setFrames(sortedFrames);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
        {error}
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        No frames to export.
      </div>
    );
  }

  // Render each frame as a page
  return (
    <div className="print-container">
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }
        body {
          margin: 0;
          padding: 0;
          background: #f0f0f0;
        }
        .print-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
        }
        @media print {
          .print-container {
            gap: 0;
            padding: 0;
          }
        }
      `}</style>
      
      {frames.map((frame, index) => (
        <FramePage key={frame.id} frame={frame} pageNumber={index + 1} totalPages={frames.length} />
      ))}
    </div>
  );
}

// Render a single frame as a page
function FramePage({ 
  frame, 
  pageNumber, 
  totalPages 
}: { 
  frame: FrameData; 
  pageNumber: number; 
  totalPages: number;
}) {
  // Scale to fit on screen while maintaining aspect ratio
  const scale = Math.min(1, 1200 / frame.w);
  
  return (
    <div 
      className="print-page"
      style={{
        width: frame.w * scale,
        height: frame.h * scale,
        backgroundColor: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        margin: '0 auto',
      }}
    >
      {/* Frame content */}
      <div
        style={{
          width: frame.w,
          height: frame.h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
        }}
      >
        {/* Render objects */}
        {frame.objects.map((obj) => (
          <RenderObject key={obj.id} object={obj} />
        ))}
        
        {/* Page footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'rgba(0,0,0,0.4)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <span>Generated with Archipedia</span>
          <span>{pageNumber} / {totalPages}</span>
        </div>
      </div>
    </div>
  );
}

// Render individual canvas objects
function RenderObject({ object }: { object: CanvasObject }) {
  const { type, x, y, props } = object;
  
  switch (type) {
    case 'reference-card':
      return (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: props.w || 320,
            height: props.h || 260,
            backgroundColor: 'white',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          {/* Image */}
          <div
            style={{
              width: '100%',
              height: '70%',
              backgroundColor: '#f0f0f0',
              overflow: 'hidden',
            }}
          >
            {props.thumb_url_snapshot && (
              <img
                src={props.thumb_url_snapshot}
                alt={props.title_snapshot}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
          
          {/* Content */}
          <div style={{ padding: '8px 10px' }}>
            {props.showTitle !== false && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#1a1a1a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {props.title_snapshot}
              </div>
            )}
            
            {props.showMeta !== false && (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#666666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {[props.architect_snapshot, props.location_snapshot, props.year_snapshot]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
            
            {props.showCaption !== false && props.caption && (
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'system-ui, sans-serif',
                  fontStyle: 'italic',
                  color: '#888888',
                  marginTop: 4,
                }}
              >
                "{props.caption}"
              </div>
            )}
          </div>
        </div>
      );

    case 'text-block':
      const textStyles: Record<string, React.CSSProperties> = {
        h1: { fontSize: 48, fontWeight: 700 },
        h2: { fontSize: 32, fontWeight: 600 },
        body: { fontSize: 18, fontWeight: 400 },
        caption: { fontSize: 14, fontWeight: 400, color: '#666' },
      };
      const style = textStyles[props.style] || textStyles.body;
      
      return (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: props.w || 400,
            fontFamily: 'system-ui, sans-serif',
            color: '#1a1a1a',
            textAlign: props.align || 'left',
            ...style,
          }}
        >
          {props.text}
        </div>
      );

    case 'shape-rect':
      return (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: props.w || 200,
            height: props.h || 200,
            backgroundColor: props.fill || '#f5f5f5',
            opacity: props.opacity ?? 1,
            borderRadius: props.borderRadius || 0,
          }}
        />
      );

    default:
      return null;
  }
}

