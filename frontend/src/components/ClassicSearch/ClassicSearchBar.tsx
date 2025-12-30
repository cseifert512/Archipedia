import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Upload, Link as LinkIcon, ChevronDown, ChevronUp, Clock, Trash2 } from 'lucide-react';
import { getHistory, removeFromHistory, formatTimestamp, type SearchHistoryItem } from '../../lib/searchHistory';

export type MatchEmphasis = 'visual' | 'balanced' | 'semantic';

interface ClassicSearchBarProps {
  initialQuery?: string;
  initialImageUrl?: string | null;
  onSearch: (query: string, image: File | string | null, emphasis: MatchEmphasis) => void;
  onClear: () => void;
  isSearching?: boolean;
}

export function ClassicSearchBar({
  initialQuery = '',
  initialImageUrl = null,
  onSearch,
  onClear,
  isSearching = false,
}: ClassicSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [emphasis, setEmphasis] = useState<MatchEmphasis>('balanced');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history when dropdown opens
  useEffect(() => {
    if (showHistory) {
      setHistory(getHistory());
    }
  }, [showHistory]);

  const hasImage = imageFile || imageUrl;
  const hasQuery = query.trim().length > 0;
  const showEmphasisControl = hasImage && hasQuery;

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      alert('Please select a JPG or PNG image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    setImageFile(file);
    setImageUrl(null);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Fetch an image from URL and convert to File for search
  const fetchAndSetImage = useCallback(async (url: string, imageName?: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const filename = imageName ? `${imageName}.jpg` : 'dropped-image.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      handleFileSelect(file);
    } catch (error) {
      console.error('Failed to fetch image from URL:', error);
      // Fallback: just use the URL directly
      setImageUrl(url);
      setImageFile(null);
      setImagePreview(url);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check for internal image drag (from result cards)
    const imageData = e.dataTransfer.getData('application/x-archipedia-image');
    if (imageData) {
      try {
        const { url, image_id } = JSON.parse(imageData);
        await fetchAndSetImage(url, image_id);
        return;
      } catch (err) {
        console.error('Failed to parse dropped image data:', err);
      }
    }
    
    // Check for URL drag (text/uri-list)
    const urlData = e.dataTransfer.getData('text/uri-list');
    if (urlData && urlData.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
      await fetchAndSetImage(urlData);
      return;
    }
    
    // Existing file drop logic
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect, fetchAndSetImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUrlSubmit = () => {
    const url = urlInputValue.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImageUrl(url);
      setImageFile(null);
      setImagePreview(url);
      setShowUrlInput(false);
      setUrlInputValue('');
    } else {
      alert('Please enter a valid HTTP(S) URL');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSearch = () => {
    if (!hasQuery && !hasImage) return;
    onSearch(query, imageFile || imageUrl, emphasis);
  };

  const handleClear = () => {
    setQuery('');
    removeImage();
    setEmphasis('balanced');
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
      setShowHistory(false);
    }
    if (e.key === 'Escape') {
      setShowHistory(false);
    }
  };

  const handleInputFocus = () => {
    // Show history on focus if input is empty
    if (!query.trim()) {
      setShowHistory(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicking history items
    setTimeout(() => setShowHistory(false), 200);
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setShowHistory(false);
    // Trigger search with the history item
    onSearch(item.query, imageFile || imageUrl, emphasis);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, queryText: string) => {
    e.stopPropagation();
    removeFromHistory(queryText);
    setHistory(getHistory());
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.1)',
        padding: '20px 24px',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Main Search Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Image Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !hasImage && fileInputRef.current?.click()}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            border: isDragging
              ? '2px dashed var(--accent)'
              : hasImage
              ? '2px solid rgba(0,0,0,0.1)'
              : '2px dashed rgba(0,0,0,0.2)',
            backgroundColor: isDragging ? 'rgba(182, 68, 36, 0.05)' : 'rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasImage ? 'default' : 'pointer',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 150ms ease',
          }}
        >
          {imagePreview ? (
            <>
              <img
                src={imagePreview}
                alt="Reference"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Camera size={24} style={{ opacity: 0.4 }} />
              <div
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '9px',
                  color: 'rgba(0,0,0,0.4)',
                  marginTop: '4px',
                }}
              >
                Drop image
              </div>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Hide history when typing
              if (e.target.value.trim()) {
                setShowHistory(false);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Describe what you want (e.g., 'courtyard housing in Mexico')"
            style={{
              width: '100%',
              fontFamily: 'var(--font-primary)',
              fontSize: '18px',
              border: 'none',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
              backgroundColor: 'transparent',
              padding: '12px 0',
              outline: 'none',
            }}
          />
          
          {/* Search History Dropdown */}
          {showHistory && history.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.1)',
                zIndex: 1000,
                marginTop: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} style={{ opacity: 0.5 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11px',
                    color: 'rgba(0,0,0,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Recent Searches
                </span>
              </div>
              {history.map((item, index) => (
                <div
                  key={`${item.query}-${index}`}
                  onClick={() => handleHistorySelect(item)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '14px',
                        color: '#1a1a1a',
                      }}
                    >
                      {item.query || (item.hasImage ? '(Image search)' : '')}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '11px',
                        color: 'rgba(0,0,0,0.4)',
                        marginTop: '2px',
                      }}
                    >
                      {formatTimestamp(item.timestamp)}
                      {item.resultCount !== undefined && ` · ${item.resultCount} results`}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveHistoryItem(e, item.query)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: 0.4,
                      transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Image options row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '11px',
                color: 'rgba(0,0,0,0.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Upload size={12} />
              Upload
            </button>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '11px',
                color: 'rgba(0,0,0,0.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LinkIcon size={12} />
              Use URL
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {(hasQuery || hasImage) && (
            <button
              onClick={handleClear}
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: '14px',
                padding: '12px 20px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'rgba(0,0,0,0.6)',
                transition: 'all 150ms ease',
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={(!hasQuery && !hasImage) || isSearching}
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: '14px',
              padding: '12px 28px',
              backgroundColor: hasQuery || hasImage ? 'var(--accent)' : 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: hasQuery || hasImage ? 'pointer' : 'not-allowed',
              color: hasQuery || hasImage ? 'white' : 'rgba(0,0,0,0.4)',
              transition: 'all 150ms ease',
              opacity: isSearching ? 0.7 : 1,
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Advanced
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* URL Input Row */}
      {showUrlInput && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          <input
            type="text"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{
              flex: 1,
              fontFamily: 'var(--font-secondary)',
              fontSize: '13px',
              padding: '8px 12px',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '6px',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              padding: '8px 16px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Load
          </button>
          <button
            onClick={() => {
              setShowUrlInput(false);
              setUrlInputValue('');
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <X size={16} style={{ opacity: 0.5 }} />
          </button>
        </div>
      )}

      {/* Match Emphasis Control */}
      {showEmphasisControl && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
              color: 'rgba(0,0,0,0.5)',
            }}
          >
            Match emphasis:
          </span>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {(['visual', 'balanced', 'semantic'] as MatchEmphasis[]).map((option) => (
              <button
                key={option}
                onClick={() => setEmphasis(option)}
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '12px',
                  padding: '6px 16px',
                  backgroundColor: emphasis === option ? 'white' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: emphasis === option ? '#000' : 'rgba(0,0,0,0.5)',
                  boxShadow: emphasis === option ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 150ms ease',
                  textTransform: 'capitalize',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Panel */}
      {showAdvanced && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '11px',
              color: 'rgba(0,0,0,0.4)',
              marginBottom: '8px',
            }}
          >
            Advanced controls (coming soon)
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          >
            <div>
              <label style={{ fontFamily: 'var(--font-secondary)', fontSize: '11px' }}>
                Fusion Weights
              </label>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-secondary)', fontSize: '11px' }}>
                Search Mode
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

