import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Upload, Link as LinkIcon, ChevronDown, ChevronUp, Clock, Trash2, Search, Plus, MinusCircle } from 'lucide-react';
import { getHistory, removeFromHistory, formatTimestamp, type SearchHistoryItem } from '../../lib/searchHistory';
import { getAutocomplete, type AutocompleteSuggestion, type FusionMode } from '../../lib/navigatorApi';

export type MatchEmphasis = 'visual' | 'balanced' | 'semantic';

export interface MultiImageData {
  files: File[];
  negativeFiles: File[];
  fusionMode: FusionMode;
}

interface ClassicSearchBarProps {
  initialQuery?: string;
  initialImageUrl?: string | null;
  /** Legacy single-image callback (still supported for backward compatibility) */
  onSearch: (query: string, image: File | string | null, emphasis: MatchEmphasis) => void;
  /** New multi-image callback (called when multiple images are uploaded) */
  onMultiImageSearch?: (query: string, multiImageData: MultiImageData, emphasis: MatchEmphasis) => void;
  onClear: () => void;
  isSearching?: boolean;
  /** Enable multi-image mode (default: true) */
  enableMultiImage?: boolean;
  /** Maximum number of positive images (default: 5) */
  maxImages?: number;
}

export function ClassicSearchBar({
  initialQuery = '',
  initialImageUrl = null,
  onSearch,
  onMultiImageSearch,
  onClear,
  isSearching = false,
  enableMultiImage = true,
  maxImages = 5,
}: ClassicSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  
  // Multi-image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [negativeFiles, setNegativeFiles] = useState<File[]>([]);
  const [negativePreviews, setNegativePreviews] = useState<string[]>([]);
  const [fusionMode, setFusionMode] = useState<FusionMode>('average');
  
  // Legacy single-image state (for URL-based images)
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  
  const [emphasis, setEmphasis] = useState<MatchEmphasis>('balanced');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showNegativeZone, setShowNegativeZone] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const negativeFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history when dropdown opens
  useEffect(() => {
    if (showHistory) {
      setHistory(getHistory());
    }
  }, [showHistory]);

  // Fetch autocomplete suggestions with debounce
  useEffect(() => {
    // Don't show suggestions if history dropdown is open
    if (showHistory) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const results = await getAutocomplete(query.trim(), 8);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [query, showHistory]);

  const hasImage = imageFiles.length > 0 || imageUrl;
  const hasMultipleImages = imageFiles.length > 1;
  const hasQuery = query.trim().length > 0;
  const showEmphasisControl = hasImage && hasQuery;
  const canAddMoreImages = imageFiles.length < maxImages;

  const handleFileSelect = useCallback((file: File, isNegative: boolean = false) => {
    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      alert('Please select a JPG or PNG image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    
    if (isNegative) {
      if (negativeFiles.length >= 3) {
        alert('Maximum 3 negative reference images allowed');
        return;
      }
      setNegativeFiles(prev => [...prev, file]);
      setNegativePreviews(prev => [...prev, URL.createObjectURL(file)]);
    } else {
      if (imageFiles.length >= maxImages) {
        alert(`Maximum ${maxImages} reference images allowed`);
        return;
      }
      setImageFiles(prev => [...prev, file]);
      setImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
      setImageUrl(null); // Clear URL when adding files
    }
  }, [imageFiles.length, negativeFiles.length, maxImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleFileSelect(file, false));
    }
  };
  
  const handleNegativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleFileSelect(file, true));
    }
  };
  
  const removeImageAtIndex = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const toRevoke = prev[index];
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== index);
    });
  };
  
  const removeNegativeAtIndex = (index: number) => {
    setNegativeFiles(prev => prev.filter((_, i) => i !== index));
    setNegativePreviews(prev => {
      const toRevoke = prev[index];
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Fetch an image from URL and convert to File for search
  const fetchAndSetImage = useCallback(async (url: string, imageName?: string, isNegative: boolean = false) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const filename = imageName ? `${imageName}.jpg` : 'dropped-image.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      handleFileSelect(file, isNegative);
    } catch (error) {
      console.error('Failed to fetch image from URL:', error);
      // Fallback: just use the URL directly (only for positive images)
      if (!isNegative) {
        setImageUrl(url);
      }
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback(async (e: React.DragEvent, isNegativeZone: boolean = false) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check for internal image drag (from result cards)
    const imageData = e.dataTransfer.getData('application/x-archipedia-image');
    if (imageData) {
      try {
        const { url, image_id } = JSON.parse(imageData);
        await fetchAndSetImage(url, image_id, isNegativeZone);
        return;
      } catch (err) {
        console.error('Failed to parse dropped image data:', err);
      }
    }
    
    // Check for URL drag (text/uri-list)
    const urlData = e.dataTransfer.getData('text/uri-list');
    if (urlData && urlData.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i)) {
      await fetchAndSetImage(urlData, undefined, isNegativeZone);
      return;
    }
    
    // File drop logic - support multiple files
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => handleFileSelect(file, isNegativeZone));
    }
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

  const removeAllImages = () => {
    // Revoke all preview URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    negativePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setImageFiles([]);
    setImagePreviews([]);
    setNegativeFiles([]);
    setNegativePreviews([]);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (negativeFileInputRef.current) {
      negativeFileInputRef.current.value = '';
    }
  };

  const handleSearch = () => {
    if (!hasQuery && !hasImage) return;
    
    // Use multi-image callback if multiple images and callback provided
    if (imageFiles.length > 0 && onMultiImageSearch && (imageFiles.length > 1 || negativeFiles.length > 0)) {
      onMultiImageSearch(query, {
        files: imageFiles,
        negativeFiles: negativeFiles,
        fusionMode: fusionMode,
      }, emphasis);
    } else {
      // Fall back to legacy single-image callback
      onSearch(query, imageFiles[0] || imageUrl, emphasis);
    }
  };

  const handleClear = () => {
    setQuery('');
    removeAllImages();
    setEmphasis('balanced');
    setFusionMode('average');
    setShowNegativeZone(false);
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle autocomplete navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        return;
      }
    }
    
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
      setShowHistory(false);
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowHistory(false);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    // Show history on focus if input is empty
    if (!query.trim()) {
      setShowHistory(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicking items
    setTimeout(() => {
      setShowHistory(false);
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
    // Trigger search with the selected suggestion
    if (imageFiles.length > 0 && onMultiImageSearch && (imageFiles.length > 1 || negativeFiles.length > 0)) {
      onMultiImageSearch(suggestion.value, { files: imageFiles, negativeFiles, fusionMode }, emphasis);
    } else {
      onSearch(suggestion.value, imageFiles[0] || imageUrl, emphasis);
    }
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setShowHistory(false);
    // Trigger search with the history item
    if (imageFiles.length > 0 && onMultiImageSearch && (imageFiles.length > 1 || negativeFiles.length > 0)) {
      onMultiImageSearch(item.query, { files: imageFiles, negativeFiles, fusionMode }, emphasis);
    } else {
      onSearch(item.query, imageFiles[0] || imageUrl, emphasis);
    }
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
        multiple={enableMultiImage}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        ref={negativeFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        multiple
        onChange={handleNegativeFileChange}
        style={{ display: 'none' }}
      />

      {/* Main Search Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Multi-Image Upload Zone */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexShrink: 0,
            alignItems: 'center',
          }}
        >
          {/* Existing images grid */}
          {imagePreviews.map((preview, index) => (
            <div
              key={`img-${index}`}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                border: '2px solid rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={preview}
                alt={`Reference ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImageAtIndex(index);
                }}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
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
                <X size={10} />
              </button>
              {index === 0 && imageFiles.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    fontSize: '8px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '3px',
                  }}
                >
                  Primary
                </div>
              )}
            </div>
          ))}
          
          {/* URL-based image (legacy) */}
          {imageUrl && imagePreviews.length === 0 && (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                border: '2px solid rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrl}
                alt="Reference"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                onClick={() => setImageUrl(null)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
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
                <X size={10} />
              </button>
            </div>
          )}
          
          {/* Add more images button */}
          {canAddMoreImages && (
            <div
              onDrop={(e) => handleDrop(e, false)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: imagePreviews.length > 0 ? '60px' : '80px',
                height: imagePreviews.length > 0 ? '60px' : '80px',
                borderRadius: '8px',
                border: isDragging
                  ? '2px dashed var(--accent)'
                  : '2px dashed rgba(0,0,0,0.2)',
                backgroundColor: isDragging ? 'rgba(182, 68, 36, 0.05)' : 'rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {imagePreviews.length > 0 ? (
                <Plus size={20} style={{ opacity: 0.4 }} />
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
          
          {/* Negative images indicator */}
          {negativePreviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
              <div style={{ display: 'flex', gap: '4px' }}>
                {negativePreviews.map((preview, index) => (
                  <div
                    key={`neg-${index}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      border: '2px solid rgba(220, 38, 38, 0.5)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={preview}
                      alt={`Exclude ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.6,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(45deg, transparent 45%, rgba(220,38,38,0.3) 45%, rgba(220,38,38,0.3) 55%, transparent 55%)',
                      }}
                    />
                    <button
                      onClick={() => removeNegativeAtIndex(index)}
                      style={{
                        position: 'absolute',
                        top: '1px',
                        right: '1px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 38, 38, 0.8)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Text Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Hide history when typing, show suggestions
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
          
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && !showHistory && (
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
                <Search size={12} style={{ opacity: 0.5 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11px',
                    color: 'rgba(0,0,0,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Suggestions
                </span>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: selectedSuggestionIndex === index ? 'rgba(0,0,0,0.05)' : 'transparent',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                    setSelectedSuggestionIndex(index);
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSuggestionIndex !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-secondary)',
                      fontSize: '10px',
                      padding: '2px 6px',
                      backgroundColor: 
                        suggestion.type === 'typology' ? 'rgba(182, 68, 36, 0.1)' :
                        suggestion.type === 'architect' ? 'rgba(68, 102, 182, 0.1)' :
                        suggestion.type === 'city' ? 'rgba(68, 182, 102, 0.1)' :
                        suggestion.type === 'tag' ? 'rgba(182, 68, 182, 0.1)' :
                        'rgba(0,0,0,0.05)',
                      color:
                        suggestion.type === 'typology' ? 'rgba(182, 68, 36, 1)' :
                        suggestion.type === 'architect' ? 'rgba(68, 102, 182, 1)' :
                        suggestion.type === 'city' ? 'rgba(68, 132, 102, 1)' :
                        suggestion.type === 'tag' ? 'rgba(142, 68, 142, 1)' :
                        'rgba(0,0,0,0.6)',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      flexShrink: 0,
                    }}
                  >
                    {suggestion.type}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '14px',
                      color: '#1a1a1a',
                    }}
                  >
                    {suggestion.value}
                  </span>
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
              marginBottom: '12px',
            }}
          >
            Multi-Image Search Controls
          </div>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Fusion Mode */}
            {hasMultipleImages && (
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '11px',
                    color: 'rgba(0,0,0,0.6)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Fusion Mode
                </label>
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: '6px',
                    padding: '2px',
                  }}
                >
                  {([
                    { value: 'average', label: 'Match All' },
                    { value: 'max_pool', label: 'Match Any' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFusionMode(option.value)}
                      style={{
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '11px',
                        padding: '5px 12px',
                        backgroundColor: fusionMode === option.value ? 'white' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: fusionMode === option.value ? '#000' : 'rgba(0,0,0,0.5)',
                        boxShadow: fusionMode === option.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Negative Images */}
            <div>
              <label
                style={{
                  fontFamily: 'var(--font-secondary)',
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.6)',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Exclude Images (avoid similar results)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {negativePreviews.map((preview, index) => (
                  <div
                    key={`neg-adv-${index}`}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      border: '2px solid rgba(220, 38, 38, 0.5)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={preview}
                      alt={`Exclude ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.7,
                      }}
                    />
                    <button
                      onClick={() => removeNegativeAtIndex(index)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 38, 38, 0.8)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {negativeFiles.length < 3 && (
                  <button
                    onClick={() => negativeFileInputRef.current?.click()}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      border: '2px dashed rgba(220, 38, 38, 0.3)',
                      backgroundColor: 'rgba(220, 38, 38, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.02)';
                    }}
                  >
                    <MinusCircle size={16} style={{ color: 'rgba(220, 38, 38, 0.5)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-secondary)',
                        fontSize: '8px',
                        color: 'rgba(220, 38, 38, 0.6)',
                        marginTop: '2px',
                      }}
                    >
                      Exclude
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Info text */}
          <div
            style={{
              fontFamily: 'var(--font-secondary)',
              fontSize: '10px',
              color: 'rgba(0,0,0,0.4)',
              marginTop: '12px',
            }}
          >
            {hasMultipleImages
              ? 'Using multiple reference images. Fusion mode controls how they are combined.'
              : 'Add more images above for multi-image search. Drag and drop from search results.'}
          </div>
        </div>
      )}
    </div>
  );
}

