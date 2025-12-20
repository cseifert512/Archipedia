import { useState, useEffect, useRef } from 'react';
import { Type, AlignLeft, Quote, ChevronDown } from 'lucide-react';

export type TextBlockStyle = 'h1' | 'h2' | 'body' | 'quote';

interface TextBlockEditorProps {
  text: string;
  style: TextBlockStyle;
  onChange: (text: string) => void;
  onStyleChange?: (style: TextBlockStyle) => void;
  placeholder?: string;
  editable?: boolean;
}

const STYLE_OPTIONS: { value: TextBlockStyle; label: string; icon: React.ReactNode }[] = [
  { value: 'h1', label: 'Heading 1', icon: <Type size={16} /> },
  { value: 'h2', label: 'Heading 2', icon: <Type size={14} /> },
  { value: 'body', label: 'Paragraph', icon: <AlignLeft size={14} /> },
  { value: 'quote', label: 'Quote', icon: <Quote size={14} /> },
];

const STYLE_CSS: Record<TextBlockStyle, React.CSSProperties> = {
  h1: {
    fontFamily: 'var(--font-primary)',
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: 1.3,
    color: '#000',
  },
  h2: {
    fontFamily: 'var(--font-primary)',
    fontSize: '20px',
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#000',
  },
  body: {
    fontFamily: 'var(--font-secondary)',
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: 'rgba(0,0,0,0.75)',
  },
  quote: {
    fontFamily: 'var(--font-secondary)',
    fontSize: '17px',
    fontWeight: 400,
    fontStyle: 'italic',
    lineHeight: 1.6,
    color: 'rgba(0,0,0,0.65)',
  },
};

export function TextBlockEditor({
  text,
  style,
  onChange,
  onStyleChange,
  placeholder = 'Type something...',
  editable = true,
}: TextBlockEditorProps) {
  const [localText, setLocalText] = useState(text);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localText, style]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStyleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBlur = () => {
    setIsFocused(false);
    if (localText !== text) {
      onChange(localText);
    }
  };

  const handleStyleSelect = (newStyle: TextBlockStyle) => {
    onStyleChange?.(newStyle);
    setShowStyleMenu(false);
  };

  const currentStyleOption = STYLE_OPTIONS.find((s) => s.value === style) || STYLE_OPTIONS[0];

  return (
    <div
      style={{
        position: 'relative',
        borderLeft: style === 'quote' ? '3px solid var(--accent)' : 'none',
        paddingLeft: style === 'quote' ? '20px' : 0,
      }}
    >
      {/* Style Selector (only visible on focus and if editable) */}
      {editable && isFocused && onStyleChange && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '-36px',
            left: style === 'quote' ? '20px' : 0,
            display: 'flex',
            gap: '4px',
            backgroundColor: 'white',
            padding: '4px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12px',
            }}
          >
            {currentStyleOption.icon}
            {currentStyleOption.label}
            <ChevronDown size={12} />
          </button>

          {showStyleMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.08)',
                padding: '4px',
                minWidth: '140px',
                zIndex: 20,
              }}
            >
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStyleSelect(option.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: option.value === style ? 'rgba(0,0,0,0.05)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-secondary)',
                    fontSize: '13px',
                    textAlign: 'left',
                  }}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        readOnly={!editable}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          ...STYLE_CSS[style],
        }}
        rows={1}
      />
    </div>
  );
}

// ============ Read-Only Text Block Display ============

interface TextBlockDisplayProps {
  text: string;
  style: TextBlockStyle;
}

export function TextBlockDisplay({ text, style }: TextBlockDisplayProps) {
  const baseStyles = STYLE_CSS[style];

  if (style === 'h1') {
    return (
      <h1
        style={{
          ...baseStyles,
          margin: 0,
          paddingTop: '24px',
        }}
      >
        {text}
      </h1>
    );
  }

  if (style === 'h2') {
    return (
      <h2
        style={{
          ...baseStyles,
          margin: 0,
          paddingTop: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {text}
      </h2>
    );
  }

  if (style === 'quote') {
    return (
      <blockquote
        style={{
          ...baseStyles,
          margin: 0,
          borderLeft: '3px solid var(--accent)',
          paddingLeft: '20px',
        }}
      >
        {text}
      </blockquote>
    );
  }

  return (
    <p
      style={{
        ...baseStyles,
        margin: 0,
        maxWidth: '720px',
      }}
    >
      {text}
    </p>
  );
}

