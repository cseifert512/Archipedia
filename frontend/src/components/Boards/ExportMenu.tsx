import { useState } from 'react';
import { Download, FileText, Presentation, X, Loader2, Check } from 'lucide-react';

interface ExportMenuProps {
  boardId: string;
  onClose: () => void;
}

type ExportMode = 'long' | 'slides';
type ExportFormat = 'letter' | 'a4' | '16:9';

export function ExportMenu({ boardId, onClose }: ExportMenuProps) {
  const [mode, setMode] = useState<ExportMode>('long');
  const [format, setFormat] = useState<ExportFormat>('letter');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    url?: string;
    error?: string;
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const apiBase =
        (import.meta as any).env?.VITE_API_BASE_URL?.trim()?.replace(/\/+$/, '') ||
        'http://localhost:8000';
      const frontendUrl = window.location.origin;

      const response = await fetch(`${apiBase}/boards/${boardId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          format: mode === 'slides' ? '16:9' : format,
          frontend_url: frontendUrl,
        }),
      });

      const data = await response.json();

      if (data.ok && data.download_url) {
        setExportResult({
          success: true,
          url: `${apiBase}${data.download_url}`,
        });
      } else {
        setExportResult({
          success: false,
          error: data.error || 'Export failed',
        });
      }
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '420px',
          zIndex: 1001,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Download size={20} style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              Export Board
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Export Type Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Export Type
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <ExportTypeOption
                icon={<FileText size={20} />}
                label="Document"
                description="Continuous PDF report"
                isSelected={mode === 'long'}
                onClick={() => setMode('long')}
              />
              <ExportTypeOption
                icon={<Presentation size={20} />}
                label="Slides"
                description="16:9 presentation deck"
                isSelected={mode === 'slides'}
                onClick={() => setMode('slides')}
              />
            </div>
          </div>

          {/* Format Selection (only for document mode) */}
          {mode === 'long' && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '12px',
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Page Size
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['letter', 'a4'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: format === f ? 'var(--accent)' : 'rgba(0,0,0,0.04)',
                      color: format === f ? 'white' : 'inherit',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '13px',
                      fontWeight: format === f ? 500 : 400,
                      transition: 'all 150ms',
                    }}
                  >
                    {f === 'letter' ? 'US Letter' : 'A4'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div
              style={{
                padding: '16px',
                backgroundColor: exportResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {exportResult.success ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <Check size={16} style={{ color: '#22c55e' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#22c55e',
                      }}
                    >
                      Export Complete
                    </span>
                  </div>
                  <a
                    href={exportResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '13px',
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                    }}
                  >
                    Download PDF
                  </a>
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    color: '#ef4444',
                    margin: 0,
                  }}
                >
                  {exportResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              backgroundColor: isExporting ? 'rgba(0,0,0,0.1)' : 'var(--accent)',
              color: isExporting ? 'rgba(0,0,0,0.4)' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {isExporting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function ExportTypeOption({
  icon,
  label,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '20px 16px',
        backgroundColor: isSelected ? 'rgba(182, 68, 36, 0.08)' : 'rgba(0,0,0,0.02)',
        border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      <div
        style={{
          color: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '14px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '2px',
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-secondary)',
            fontSize: '11px',
            color: 'rgba(0,0,0,0.5)',
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

