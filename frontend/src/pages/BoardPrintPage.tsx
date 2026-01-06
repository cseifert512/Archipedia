/**
 * Print-optimized view of a board for PDF export.
 * This page is rendered by the backend's Playwright service.
 */
import { useState, useEffect } from 'react';
import { useParams, useSearch } from 'wouter';
import { useBoardStore, BoardBlock, ReferenceBlock, TextBlock, DividerBlock, FrameBlock } from '../stores/boardStore';

export function BoardPrintPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id || '';
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode') || 'long'; // 'long' or 'slides'
  const format = searchParams.get('format') || 'letter'; // 'letter', 'a4', '16:9'

  const board = useBoardStore((state) => state.getBoardById(boardId));

  if (!board) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p>Board not found</p>
      </div>
    );
  }

  const sortedBlocks = [...board.blocks].sort((a, b) => a.position - b.position);

  // Long format: continuous document
  if (mode === 'long') {
    return (
      <div
        style={{
          fontFamily: 'var(--font-secondary), -apple-system, BlinkMacSystemFont, sans-serif',
          backgroundColor: 'white',
          color: '#000',
          maxWidth: format === '16:9' ? '1280px' : '800px',
          margin: '0 auto',
          padding: '48px',
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: '48px', borderBottom: '2px solid #000', paddingBottom: '24px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-primary), Georgia, serif',
              fontSize: '36px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '8px',
            }}
          >
            {board.title}
          </h1>
          {board.subtitle && (
            <p
              style={{
                fontSize: '18px',
                color: '#666',
                margin: 0,
                marginBottom: '16px',
              }}
            >
              {board.subtitle}
            </p>
          )}
          {board.description && (
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#444',
                maxWidth: '600px',
              }}
            >
              {board.description}
            </p>
          )}
        </header>

        {/* Blocks */}
        <main>
          {sortedBlocks.map((block) => (
            <PrintBlock key={block.id} block={block} />
          ))}
        </main>

        {/* Footer */}
        <footer
          style={{
            marginTop: '64px',
            paddingTop: '24px',
            borderTop: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#888',
          }}
        >
          <span>
            Created with Archipedia · {new Date(board.updated_at).toLocaleDateString()}
          </span>
          <span>{board.blocks.filter((b) => b.type === 'reference').length} references</span>
        </footer>
      </div>
    );
  }

  // Slides format: frame-based pagination for 16:9 presentation
  return (
    <>
      <style>{`
        @media print {
          .frame-section {
            page-break-after: always;
            page-break-inside: avoid;
          }
        }
        @page {
          size: 1280px 720px;
          margin: 0;
        }
      `}</style>
      <div style={{ backgroundColor: '#f5f5f5' }}>
        {/* Frame-based slides: Each frame defines a slide boundary */}
        <FrameBasedSlides blocks={sortedBlocks} boardTitle={board.title} boardSubtitle={board.subtitle} />
      </div>
    </>
  );
}

// ============ Frame-Based Slides Layout ============

function FrameBasedSlides({ 
  blocks, 
  boardTitle, 
  boardSubtitle 
}: { 
  blocks: BoardBlock[]; 
  boardTitle: string;
  boardSubtitle?: string;
}) {
  // Group blocks by frames: blocks between Frame N and Frame N+1 belong to slide N
  const slides: { frame?: FrameBlock; blocks: BoardBlock[] }[] = [];
  let currentSlide: { frame?: FrameBlock; blocks: BoardBlock[] } = { blocks: [] };
  let hasFrames = false;

  for (const block of blocks) {
    if (block.type === 'frame') {
      hasFrames = true;
      // Start a new slide with this frame
      if (currentSlide.blocks.length > 0 || currentSlide.frame) {
        slides.push(currentSlide);
      }
      currentSlide = { frame: block as FrameBlock, blocks: [] };
    } else {
      // Add block to current slide
      currentSlide.blocks.push(block);
    }
  }

  // Add the last slide
  if (currentSlide.blocks.length > 0 || currentSlide.frame) {
    slides.push(currentSlide);
  }

  // If no frames exist, create a title slide and group blocks
  if (!hasFrames) {
    return (
      <>
        {/* Title Slide */}
        <div
          className="frame-section"
          style={{
            width: '1280px',
            height: '720px',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px',
            pageBreakAfter: 'always',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-primary), Georgia, serif',
              fontSize: '56px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            {boardTitle}
          </h1>
          {boardSubtitle && (
            <p
              style={{
                fontSize: '24px',
                color: '#666',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {boardSubtitle}
            </p>
          )}
        </div>

        {/* Content without frames - use old grouping logic */}
        <SlidesContent blocks={blocks} />

        {/* End Slide */}
        <div
          style={{
            width: '1280px',
            height: '720px',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '16px',
            }}
          >
            Created with
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-primary), Georgia, serif',
              fontSize: '36px',
              fontWeight: 600,
              color: 'var(--accent, #b64424)',
            }}
          >
            Archipedia
          </h2>
        </div>
      </>
    );
  }

  // Render frame-based slides
  return (
    <>
      {slides.map((slide, idx) => (
        <FrameSlide
          key={idx}
          frame={slide.frame}
          blocks={slide.blocks}
          isFirst={idx === 0}
          boardTitle={boardTitle}
          boardSubtitle={boardSubtitle}
        />
      ))}
      {/* End Slide */}
      <div
        style={{
          width: '1280px',
          height: '720px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px',
        }}
      >
        <p
          style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '16px',
          }}
        >
          Created with
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-primary), Georgia, serif',
            fontSize: '36px',
            fontWeight: 600,
            color: 'var(--accent, #b64424)',
          }}
        >
          Archipedia
        </h2>
      </div>
    </>
  );
}

function FrameSlide({
  frame,
  blocks,
  isFirst,
  boardTitle,
  boardSubtitle,
}: {
  frame?: FrameBlock;
  blocks: BoardBlock[];
  isFirst: boolean;
  boardTitle: string;
  boardSubtitle?: string;
}) {
  const frameTitle = frame?.data.title || (isFirst ? boardTitle : 'Slide');
  const frameBackground = frame?.data.background || 'white';

  return (
    <div
      className="frame-section"
      style={{
        width: '1280px',
        height: '720px',
        backgroundColor: frameBackground.startsWith('#') || frameBackground.startsWith('rgb') 
          ? frameBackground 
          : 'white',
        backgroundImage: frameBackground.startsWith('http') || frameBackground.startsWith('/') 
          ? `url(${frameBackground})` 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: '60px',
        pageBreakAfter: 'always',
      }}
    >
      {/* Frame Title */}
      {frame && (
        <h2
          style={{
            fontFamily: 'var(--font-primary), Georgia, serif',
            fontSize: '32px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '32px',
            color: frameBackground.startsWith('#') || frameBackground.startsWith('rgb') 
              ? '#000' 
              : '#fff',
            textShadow: frameBackground.startsWith('http') || frameBackground.startsWith('/')
              ? '0 2px 4px rgba(0,0,0,0.3)'
              : 'none',
          }}
        >
          {frameTitle}
        </h2>
      )}

      {/* Slide Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {blocks.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '16px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              {isFirst ? boardSubtitle || 'Add content to this slide' : 'Empty slide'}
            </p>
          </div>
        ) : (
          blocks.map((block) => (
            <PrintBlock key={block.id} block={block} />
          ))
        )}
      </div>
    </div>
  );
}

// ============ Slides Content Layout (fallback when no frames) ============

function SlidesContent({ blocks }: { blocks: BoardBlock[] }) {
  const slides: BoardBlock[][] = [];
  let currentSlide: BoardBlock[] = [];
  let currentReferenceCount = 0;
  const REFS_PER_SLIDE = 4;

  for (const block of blocks) {
    if (block.type === 'text') {
      // Text blocks get their own slide if they're headers
      if (currentSlide.length > 0) {
        slides.push(currentSlide);
        currentSlide = [];
        currentReferenceCount = 0;
      }
      slides.push([block]);
    } else if (block.type === 'reference') {
      currentSlide.push(block);
      currentReferenceCount++;

      if (currentReferenceCount >= REFS_PER_SLIDE) {
        slides.push(currentSlide);
        currentSlide = [];
        currentReferenceCount = 0;
      }
    } else if (block.type === 'divider') {
      // Dividers trigger new slide
      if (currentSlide.length > 0) {
        slides.push(currentSlide);
        currentSlide = [];
        currentReferenceCount = 0;
      }
    }
  }

  if (currentSlide.length > 0) {
    slides.push(currentSlide);
  }

  return (
    <>
      {slides.map((slide, idx) => (
        <SlideLayout key={idx} blocks={slide} />
      ))}
    </>
  );
}

function SlideLayout({ blocks }: { blocks: BoardBlock[] }) {
  // Single text block = text slide
  if (blocks.length === 1 && blocks[0].type === 'text') {
    const textBlock = blocks[0] as TextBlock;
    return (
      <div
        style={{
          width: '1280px',
          height: '720px',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px',
          pageBreakAfter: 'always',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          {textBlock.data.style === 'h1' || textBlock.data.style === 'h2' ? (
            <h2
              style={{
                fontFamily: 'var(--font-primary), Georgia, serif',
                fontSize: textBlock.data.style === 'h1' ? '48px' : '36px',
                fontWeight: 600,
              }}
            >
              {textBlock.data.text}
            </h2>
          ) : textBlock.data.style === 'quote' ? (
            <blockquote
              style={{
                fontSize: '28px',
                fontStyle: 'italic',
                color: '#444',
                borderLeft: '4px solid var(--accent, #b64424)',
                paddingLeft: '24px',
                textAlign: 'left',
              }}
            >
              {textBlock.data.text}
            </blockquote>
          ) : (
            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.6,
                color: '#333',
              }}
            >
              {textBlock.data.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Reference grid
  const references = blocks.filter((b): b is ReferenceBlock => b.type === 'reference');
  const gridCols = references.length <= 2 ? 2 : 2;
  const gridRows = references.length <= 2 ? 1 : 2;

  return (
    <div
      style={{
        width: '1280px',
        height: '720px',
        backgroundColor: 'white',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: '24px',
        }}
      >
        {references.map((ref) => (
          <SlideReferenceCard key={ref.id} block={ref} />
        ))}
      </div>
    </div>
  );
}

function SlideReferenceCard({ block }: { block: ReferenceBlock }) {
  const { data } = block;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          backgroundImage: `url(${data.thumb_url_snapshot})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px',
        }}
      />
      <div style={{ padding: '16px' }}>
        <h4
          style={{
            fontFamily: 'var(--font-primary), Georgia, serif',
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '4px',
          }}
        >
          {data.title_snapshot}
        </h4>
        <p
          style={{
            fontSize: '13px',
            color: '#666',
            margin: 0,
          }}
        >
          {data.architect_snapshot}
          {data.location_snapshot && ` · ${data.location_snapshot}`}
        </p>
        {data.caption && (
          <p
            style={{
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#888',
              marginTop: '8px',
            }}
          >
            {data.caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ============ Print Block Renderers ============

function PrintBlock({ block }: { block: BoardBlock }) {
  if (block.type === 'reference') {
    return <PrintReferenceBlock block={block as ReferenceBlock} />;
  }
  if (block.type === 'text') {
    return <PrintTextBlock block={block as TextBlock} />;
  }
  if (block.type === 'divider') {
    return <PrintDividerBlock block={block as DividerBlock} />;
  }
  if (block.type === 'frame') {
    // Frames are handled at the slide level, not rendered as content
    return null;
  }
  return null;
}

function PrintReferenceBlock({ block }: { block: ReferenceBlock }) {
  const { data } = block;

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        marginBottom: '32px',
        pageBreakInside: 'avoid',
      }}
    >
      <img
        src={data.thumb_url_snapshot}
        alt={data.title_snapshot}
        style={{
          width: '240px',
          height: '180px',
          objectFit: 'cover',
          borderRadius: '4px',
        }}
      />
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontFamily: 'var(--font-primary), Georgia, serif',
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '6px',
          }}
        >
          {data.title_snapshot}
        </h3>
        {data.architect_snapshot && (
          <p style={{ fontSize: '14px', color: '#444', margin: 0, marginBottom: '4px' }}>
            {data.architect_snapshot}
          </p>
        )}
        <p style={{ fontSize: '13px', color: '#888', margin: 0, marginBottom: '12px' }}>
          {data.location_snapshot}
          {data.year_snapshot && ` · ${data.year_snapshot}`}
        </p>
        {data.caption && (
          <p
            style={{
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#555',
              lineHeight: 1.5,
            }}
          >
            "{data.caption}"
          </p>
        )}
      </div>
    </div>
  );
}

function PrintTextBlock({ block }: { block: TextBlock }) {
  const { data } = block;

  const styles: Record<string, React.CSSProperties> = {
    h1: {
      fontFamily: 'var(--font-primary), Georgia, serif',
      fontSize: '28px',
      fontWeight: 600,
      marginTop: '32px',
      marginBottom: '16px',
      pageBreakAfter: 'avoid',
    },
    h2: {
      fontFamily: 'var(--font-primary), Georgia, serif',
      fontSize: '20px',
      fontWeight: 600,
      marginTop: '24px',
      marginBottom: '12px',
      paddingBottom: '8px',
      borderBottom: '1px solid #ddd',
      pageBreakAfter: 'avoid',
    },
    body: {
      fontSize: '14px',
      lineHeight: 1.7,
      color: '#333',
      marginBottom: '16px',
      maxWidth: '600px',
    },
    quote: {
      fontSize: '16px',
      fontStyle: 'italic',
      color: '#555',
      borderLeft: '3px solid var(--accent, #b64424)',
      paddingLeft: '16px',
      marginLeft: 0,
      marginBottom: '16px',
    },
  };

  return <div style={styles[data.style]}>{data.text}</div>;
}

function PrintDividerBlock({ block }: { block: DividerBlock }) {
  const { data } = block;

  if (data.variant === 'line') {
    return (
      <div
        style={{
          height: '1px',
          backgroundColor: '#ddd',
          margin: '24px 0',
        }}
      />
    );
  }

  return <div style={{ height: data.variant === 'space-sm' ? '24px' : '48px' }} />;
}

