import { useParams, Link, useLocation } from 'wouter';
import { useBoardStore, BoardBlock, ReferenceBlock, TextBlock, DividerBlock } from '../stores/boardStore';
import { ArrowLeft, Edit3, Download, Share2, ExternalLink, Calendar } from 'lucide-react';
import { Footer } from '../components/Footer';

export function BoardViewPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id || '';
  const [, setLocation] = useLocation();
  
  const board = useBoardStore((state) => state.getBoardById(boardId));

  if (!board) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <h2 style={{ fontFamily: 'var(--font-primary)', fontSize: '24px', marginBottom: '16px' }}>
            Board Not Found
          </h2>
          <p style={{ fontFamily: 'var(--font-secondary)', fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginBottom: '24px' }}>
            This board may have been deleted or the link is incorrect.
          </p>
          <Link href="/search">
            <button style={{
              fontFamily: 'var(--font-primary)',
              backgroundColor: 'var(--accent)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}>
              Back to Search
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const referenceBlocks = board.blocks.filter((b): b is ReferenceBlock => b.type === 'reference');
  const formattedDate = new Date(board.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Top Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/search">
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  color: 'rgba(0,0,0,0.6)',
                }}
              >
                <ArrowLeft size={18} />
                Back
              </button>
            </Link>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '20px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {board.title}
              </h1>
              {board.subtitle && (
                <p
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '14px',
                    color: 'rgba(0,0,0,0.5)',
                    margin: 0,
                    marginTop: '2px',
                  }}
                >
                  {board.subtitle}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setLocation(`/boards/${boardId}/edit`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
              }}
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/b/${board.share_token}`);
                alert('Share link copied to clipboard!');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
              }}
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              onClick={() => alert('PDF export coming soon!')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Board Description */}
          {board.description && (
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(0,0,0,0.7)',
                maxWidth: '720px',
                marginBottom: '48px',
              }}
            >
              {board.description}
            </p>
          )}

          {/* Blocks Grid */}
          {board.blocks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 40px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '16px',
                border: '2px dashed rgba(0,0,0,0.1)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '16px',
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: '16px',
                }}
              >
                This board is empty.
              </p>
              <button
                onClick={() => setLocation(`/boards/${boardId}/edit`)}
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '14px',
                  padding: '12px 24px',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Start Adding Content
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {board.blocks
                .sort((a, b) => a.position - b.position)
                .map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px',
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={14} />
              Last updated {formattedDate}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              {referenceBlocks.length} reference{referenceBlocks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '12px',
              color: 'rgba(0,0,0,0.3)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Created with Archipedia
          </span>
        </div>
      </div>

      <Footer variant="minimal" logoLink="/" />
    </div>
  );
}

// ============ Block Renderers ============

function BlockRenderer({ block }: { block: BoardBlock }) {
  switch (block.type) {
    case 'reference':
      return <ReferenceBlockView block={block} />;
    case 'text':
      return <TextBlockView block={block} />;
    case 'divider':
      return <DividerBlockView block={block} />;
    default:
      return null;
  }
}

function ReferenceBlockView({ block }: { block: ReferenceBlock }) {
  const { data } = block;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Image */}
      <Link href={`/project/${data.project_id}`}>
        <div
          style={{
            position: 'relative',
            paddingBottom: '66.67%',
            backgroundColor: 'rgba(0,0,0,0.05)',
            cursor: 'pointer',
          }}
        >
          <img
            src={data.thumb_url_snapshot}
            alt={data.title_snapshot}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <Link href={`/project/${data.project_id}`}>
          <h3
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '18px',
              fontWeight: 600,
              margin: 0,
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            {data.title_snapshot}
          </h3>
        </Link>

        {data.architect_snapshot && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
              color: 'rgba(0,0,0,0.6)',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            {data.architect_snapshot}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {data.location_snapshot && (
            <span
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              {data.location_snapshot}
            </span>
          )}
          {data.year_snapshot && (
            <span
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.4)',
              }}
            >
              {data.year_snapshot}
            </span>
          )}
        </div>

        {data.caption && (
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'rgba(0,0,0,0.7)',
              fontStyle: 'italic',
              flex: 1,
            }}
          >
            "{data.caption}"
          </p>
        )}

        {data.tags && data.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
            {data.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '4px',
                  color: 'rgba(0,0,0,0.6)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link href={`/project/${data.project_id}`}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '16px',
              padding: '8px 0',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
              color: 'var(--accent)',
            }}
          >
            <ExternalLink size={14} />
            View Project
          </button>
        </Link>
      </div>
    </div>
  );
}

function TextBlockView({ block }: { block: TextBlock }) {
  const { data } = block;

  const styles: Record<string, React.CSSProperties> = {
    h1: {
      fontFamily: 'var(--font-primary)',
      fontSize: '32px',
      fontWeight: 600,
      margin: 0,
      paddingTop: '24px',
    },
    h2: {
      fontFamily: 'var(--font-primary)',
      fontSize: '20px',
      fontWeight: 600,
      margin: 0,
      paddingTop: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    },
    body: {
      fontFamily: 'var(--font-secondary)',
      fontSize: '16px',
      lineHeight: 1.7,
      color: 'rgba(0,0,0,0.7)',
      maxWidth: '720px',
    },
    quote: {
      fontFamily: 'var(--font-secondary)',
      fontSize: '18px',
      lineHeight: 1.6,
      fontStyle: 'italic',
      color: 'rgba(0,0,0,0.6)',
      borderLeft: '3px solid var(--accent)',
      paddingLeft: '20px',
      marginLeft: '0',
    },
  };

  return (
    <div style={styles[data.style]}>
      {data.text}
    </div>
  );
}

function DividerBlockView({ block }: { block: DividerBlock }) {
  const { data } = block;

  if (data.variant === 'line') {
    return (
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          margin: '16px 0',
        }}
      />
    );
  }

  if (data.variant === 'space-sm') {
    return <div style={{ height: '24px' }} />;
  }

  if (data.variant === 'space-lg') {
    return <div style={{ height: '48px' }} />;
  }

  return null;
}

