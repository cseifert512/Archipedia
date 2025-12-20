import { useParams, Link } from 'wouter';
import { useBoardStore, BoardBlock, ReferenceBlock, TextBlock, DividerBlock } from '../stores/boardStore';
import { ExternalLink, Calendar, ArrowUpRight } from 'lucide-react';

export function BoardSharePage() {
  const params = useParams<{ token: string }>();
  const token = params.token || '';

  const board = useBoardStore((state) => state.getBoardByShareToken(token));

  if (!board) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Board Not Found
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '15px',
              color: 'rgba(0,0,0,0.6)',
              marginBottom: '32px',
              lineHeight: 1.6,
            }}
          >
            This board may have been deleted or the link is incorrect.
          </p>
          <Link href="/">
            <button
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '14px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Go to Archipedia
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
      {/* Header */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '24px 32px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: '32px',
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
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '16px',
                    color: 'rgba(0,0,0,0.5)',
                    margin: 0,
                  }}
                >
                  {board.subtitle}
                </p>
              )}
            </div>

            <Link href="/">
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
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
                <ArrowUpRight size={16} />
                Open in Archipedia
              </button>
            </Link>
          </div>

          {board.description && (
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'rgba(0,0,0,0.7)',
                maxWidth: '720px',
                marginTop: '20px',
              }}
            >
              {board.description}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {board.blocks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 40px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '16px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '16px',
                  color: 'rgba(0,0,0,0.5)',
                }}
              >
                This board has no content yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {board.blocks
                .sort((a, b) => a.position - b.position)
                .map((block) => (
                  <ShareBlockRenderer key={block.id} block={block} />
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '24px 32px',
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              Updated {formattedDate}
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

          <a
            href="/"
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '13px',
              color: 'rgba(0,0,0,0.4)',
              textDecoration: 'none',
              letterSpacing: '0.03em',
            }}
          >
            Created with <strong style={{ color: 'var(--accent)' }}>Archipedia</strong>
          </a>
        </div>
      </footer>
    </div>
  );
}

// ============ Block Renderers for Share View ============

function ShareBlockRenderer({ block }: { block: BoardBlock }) {
  switch (block.type) {
    case 'reference':
      return <ShareReferenceBlock block={block} />;
    case 'text':
      return <ShareTextBlock block={block} />;
    case 'divider':
      return <ShareDividerBlock block={block} />;
    default:
      return null;
  }
}

function ShareReferenceBlock({ block }: { block: ReferenceBlock }) {
  const { data } = block;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          paddingBottom: '60%',
          backgroundColor: 'rgba(0,0,0,0.05)',
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

      {/* Content */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '8px',
          }}
        >
          {data.title_snapshot}
        </h3>

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

        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '13px',
            color: 'rgba(0,0,0,0.4)',
            margin: 0,
            marginBottom: '16px',
          }}
        >
          {data.location_snapshot}
          {data.year_snapshot && ` · ${data.year_snapshot}`}
        </p>

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
      </div>
    </div>
  );
}

function ShareTextBlock({ block }: { block: TextBlock }) {
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
    },
  };

  return <div style={styles[data.style]}>{data.text}</div>;
}

function ShareDividerBlock({ block }: { block: DividerBlock }) {
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

  return <div style={{ height: data.variant === 'space-sm' ? '24px' : '48px' }} />;
}

