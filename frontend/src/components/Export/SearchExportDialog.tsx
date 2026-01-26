import React, { useState } from 'react';
import { Download, FileText, Grid3X3, LayoutGrid, X, Loader2, Check } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type { SearchResultData } from '../ClassicSearch';
import { SearchResultsPDF } from './SearchResultsPDF';
import type { ExportOptions } from './types';
import { DEFAULT_EXPORT_OPTIONS } from './types';
import { prefetchImages, type ImageCache } from './imageUtils';

interface SearchExportDialogProps {
  projects: SearchResultData[];
  onClose: () => void;
}

export function SearchExportDialog({ projects, onClose }: SearchExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [customTitle, setCustomTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    filename?: string;
    error?: string;
  } | null>(null);

  const handleExport = async () => {
    if (projects.length === 0) {
      setExportResult({ success: false, error: 'No projects selected' });
      return;
    }

    setIsExporting(true);
    setExportResult(null);
    setExportStatus('Loading images...');

    try {
      // Step 1: Pre-fetch all images and convert to base64
      const imageUrls = projects.map(p => p.thumb_url || p.image_url).filter(Boolean);
      const imageCache = await prefetchImages(imageUrls);
      
      const cachedCount = Object.keys(imageCache).length;
      console.log(`Cached ${cachedCount}/${imageUrls.length} images`);
      
      setExportStatus('Generating PDF...');

      // Step 2: Generate the PDF document with cached images
      const doc = (
        <SearchResultsPDF
          results={projects}
          options={options}
          title={customTitle || undefined}
          imageCache={imageCache}
        />
      );

      // Generate blob from PDF
      const blob = await pdf(doc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const layoutSuffix = options.layout === 'single' ? 'full' : options.layout;
      const filename = `archipedia_${projects.length}_projects_${layoutSuffix}.pdf`;

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setExportResult({
        success: true,
        filename,
      });
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed. Please try again.',
      });
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
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
          width: '480px',
          maxHeight: '90vh',
          overflow: 'auto',
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
              Export {projects.length} Project{projects.length !== 1 ? 's' : ''}
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
          {/* Custom Title */}
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
              Document Title (Optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Museum Precedents"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '8px',
                fontFamily: 'var(--font-secondary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Layout Selection */}
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
              Layout
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <LayoutOption
                icon={<FileText size={20} />}
                label="Single Page"
                description="1 project per page"
                isSelected={options.layout === 'single'}
                onClick={() => updateOption('layout', 'single')}
              />
              <LayoutOption
                icon={<LayoutGrid size={20} />}
                label="2×2 Grid"
                description="4 per page"
                isSelected={options.layout === 'grid'}
                onClick={() => updateOption('layout', 'grid')}
              />
              <LayoutOption
                icon={<Grid3X3 size={20} />}
                label="Contact Sheet"
                description="12 per page"
                isSelected={options.layout === 'contact'}
                onClick={() => updateOption('layout', 'contact')}
              />
            </div>
          </div>

          {/* Page Size */}
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
              {(['letter', 'a4'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateOption('pageSize', size)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: options.pageSize === size ? 'var(--accent)' : 'rgba(0,0,0,0.04)',
                    color: options.pageSize === size ? 'white' : 'inherit',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    fontWeight: options.pageSize === size ? 500 : 400,
                    transition: 'all 150ms',
                  }}
                >
                  {size === 'letter' ? 'US Letter' : 'A4'}
                </button>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-secondary)',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Include
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CheckboxOption
                label="Project Title"
                checked={options.includeTitle}
                onChange={(checked) => updateOption('includeTitle', checked)}
              />
              <CheckboxOption
                label="Architect"
                checked={options.includeArchitect}
                onChange={(checked) => updateOption('includeArchitect', checked)}
              />
              <CheckboxOption
                label="Location & Year"
                checked={options.includeLocation}
                onChange={(checked) => updateOption('includeLocation', checked)}
              />
              <CheckboxOption
                label="Typology"
                checked={options.includeTypology}
                onChange={(checked) => updateOption('includeTypology', checked)}
              />
            </div>
          </div>

          {/* Preview Info */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(0,0,0,0.02)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '13px',
                color: 'rgba(0,0,0,0.6)',
                margin: 0,
              }}
            >
              {options.layout === 'single' && (
                <>
                  <strong>{projects.length} pages</strong> — Full-size images with detailed metadata
                </>
              )}
              {options.layout === 'grid' && (
                <>
                  <strong>{Math.ceil(projects.length / 4)} pages</strong> — 2×2 grid layout for comparison
                </>
              )}
              {options.layout === 'contact' && (
                <>
                  <strong>{Math.ceil(projects.length / 12)} pages</strong> — Compact thumbnails for overview
                </>
              )}
            </p>
          </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} style={{ color: '#22c55e' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#22c55e',
                    }}
                  >
                    Downloaded: {exportResult.filename}
                  </span>
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
            disabled={isExporting || projects.length === 0}
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
                <Loader2 size={16} className="animate-spin" />
                {exportStatus || 'Generating PDF...'}
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}

function LayoutOption({
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
        gap: '6px',
        padding: '14px 10px',
        backgroundColor: isSelected ? 'rgba(182, 68, 36, 0.08)' : 'rgba(0,0,0,0.02)',
        border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
        borderRadius: '10px',
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
            fontSize: '12px',
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
            fontSize: '10px',
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

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--accent)',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '13px',
          color: checked ? '#000' : 'rgba(0,0,0,0.6)',
        }}
      >
        {label}
      </span>
    </label>
  );
}

