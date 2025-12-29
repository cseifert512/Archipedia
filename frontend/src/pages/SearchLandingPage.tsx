import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { HamburgerMenu } from "../components/HamburgerMenu";

export function SearchLandingPage() {
  const [query, setQuery] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      const encodedQuery = encodeURIComponent(trimmed);

      if (advancedMode) {
        // Go to canvas with query as a parameter
        setLocation(`/canvas?q=${encodedQuery}`);
      } else {
        // Go to classic search with query
        setLocation(`/search/classic?q=${encodedQuery}`);
      }
    },
    [query, advancedMode, setLocation]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hamburger Menu in upper right */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 100,
        }}
      >
        <HamburgerMenu />
      </div>

      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      {/* Logo / Brand */}
      <div
        style={{
          marginBottom: "48px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "42px",
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          Archipedia
        </h1>
        <p
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "15px",
            color: "rgba(0,0,0,0.5)",
            fontWeight: 400,
          }}
        >
          Search the world's architecture
        </p>
      </div>

      {/* Search Container */}
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "640px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: "relative",
            width: "100%",
            transition: "all 0.2s ease",
            transform: isFocused ? "scale(1.01)" : "scale(1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              color: isFocused ? "#1A1A1A" : "rgba(0,0,0,0.35)",
              transition: "color 0.2s ease",
              pointerEvents: "none",
            }}
          >
            <Search size={20} strokeWidth={1.5} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, typologies, materials..."
            style={{
              width: "100%",
              padding: "20px 60px 20px 52px",
              fontSize: "16px",
              fontFamily: "var(--font-primary)",
              fontWeight: 400,
              color: "#1A1A1A",
              background: "#FFFFFF",
              border: isFocused
                ? "1px solid rgba(0,0,0,0.15)"
                : "1px solid rgba(0,0,0,0.08)",
              borderRadius: "16px",
              outline: "none",
              boxShadow: isFocused
                ? "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
                : "0 4px 16px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease",
            }}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: query.trim() ? "#1A1A1A" : "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: "12px",
              cursor: query.trim() ? "pointer" : "default",
              transition: "all 0.2s ease",
              opacity: query.trim() ? 1 : 0.5,
            }}
          >
            <ArrowRight
              size={18}
              color={query.trim() ? "#FFFFFF" : "rgba(0,0,0,0.3)"}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Advanced Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => setAdvancedMode(!advancedMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: advancedMode
                ? "linear-gradient(135deg, #1A1A1A 0%, #333333 100%)"
                : "rgba(0,0,0,0.03)",
              border: advancedMode
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.06)",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Sparkles
              size={14}
              color={advancedMode ? "#FFFFFF" : "rgba(0,0,0,0.4)"}
              strokeWidth={1.5}
            />
            <span
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "13px",
                fontWeight: 500,
                color: advancedMode ? "#FFFFFF" : "rgba(0,0,0,0.5)",
                letterSpacing: "0.01em",
              }}
            >
              Advanced Canvas
            </span>
          </button>

          {advancedMode && (
            <span
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "12px",
                color: "rgba(0,0,0,0.4)",
                fontStyle: "italic",
              }}
            >
              Visual workflow mode
            </span>
          )}
        </div>
      </form>

      {/* Quick suggestions */}
      <div
        style={{
          marginTop: "48px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          maxWidth: "600px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          "Museum",
          "Tropical Climate",
          "Concrete Facade",
          "School",
          "Residential Tower",
          "Cultural Center",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setQuery(suggestion);
              inputRef.current?.focus();
            }}
            style={{
              padding: "8px 14px",
              fontFamily: "var(--font-primary)",
              fontSize: "12px",
              fontWeight: 400,
              color: "rgba(0,0,0,0.55)",
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.color = "#1A1A1A";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.7)";
              e.currentTarget.style.color = "rgba(0,0,0,0.55)";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-primary)",
          fontSize: "11px",
          color: "rgba(0,0,0,0.3)",
        }}
      >
        Press Enter to search
      </div>
    </div>
  );
}

