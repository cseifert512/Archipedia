import React, { useState, useRef, useEffect } from "react";
import { Camera, RefreshCw, X, RotateCw } from "lucide-react";
import { useLocation } from "wouter";
import { LensFrame } from "./LensFrame";

const searchPlaceholders = [
  "1960s Brutalist Brazilian Architecture",
  "Polycarbonate Engineered Facades in Arid Climate Regions",
  "Cross-Laminated Timber High-Rise Construction Details",
  "Metabolist Movement Japanese Capsule Housing",
  "Passive Cooling Strategies in Tropical Courtyard Typologies",
  "Rammed Earth Wall Sections with Integrated Insulation",
  "Louis Kahn Travertine Detailing and Shadow Gaps",
  "Parametric ETFE Roof Systems for Sports Facilities",
  "Tadao Ando Concrete Formwork Patterns and Board Marks",
  "Post-War Scandinavian Brick Bond Variations",
  "Carlo Scarpa Brass-to-Concrete Joint Details",
  "Tensile Membrane Structures in Desert Climates",
  "Soviet Modernist Prefabricated Panel Housing Systems",
  "Shigeru Ban Cardboard Tube Structural Applications",
  "Venetian Terrazzo Floor Compositions in Mid-Century Modernism",
  "Double-Skin Facade Systems for High-Rise Office Towers",
  "Herzog & de Meuron Perforated Metal Screen Assemblies",
  "Gunite Shotcrete Shell Structures from 1950s-1970s",
  "Alvar Aalto Bent Plywood Ceiling and Wall Applications",
  "Kinetic Facade Systems with Automated Brise-Soleil Elements",
];

interface HeaderProps {
  variant?: "default" | "minimal";
  onSearch?: (query: string, image: string | null) => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  initialQuery?: string;
  initialImage?: string | null;
}

export function Header({ 
  variant = "default",
  onSearch, 
  onRefresh, 
  showRefresh = false,
  initialQuery = "",
  initialImage = null 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  if (variant === "minimal") {
    return (
      <header
        className="fixed top-0 left-0 right-0"
        style={{
          padding: "8px",
          zIndex: 50,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="hover:opacity-80 transition-opacity"
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "9px",
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "4px",
            padding: "4px 6px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          ← Back
        </button>
      </header>
    );
  }

  // Placeholder rotation effect with fade animation
  useEffect(() => {
    if (searchQuery) return; // Don't rotate if user is typing
    
    const interval = setInterval(() => {
      setIsPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        setIsPlaceholderVisible(true);
      }, 400);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery, uploadedImage);
    } else {
      // Default behavior: navigate into canvas (even if query is empty).
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery);
      if (uploadedImage) params.set('type', 'image');
      const qs = params.toString();
      setLocation(qs ? `/canvas?${qs}` : "/canvas");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 flex justify-center"
      style={{
        padding: "0",
        paddingTop: "4px",
        zIndex: 50,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />

      <div 
        style={{
          width: "50%",
          maxWidth: "600px",
          minWidth: "320px",
          overflow: "hidden",
      }}
    >
        <LensFrame 
          className="px-2 rounded-b-lg"
          style={{
            paddingTop: "2px",
            paddingBottom: "2px",
          }}
        >
          {uploadedImage && (
            <div className="mb-0.5 flex justify-center">
              <div className="relative inline-block">
                <div className="relative w-7 h-7 rounded overflow-hidden border border-[rgba(0,0,0,0.3)]">
                  <img
                    src={uploadedImage}
                    alt="Uploaded reference"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={removeUploadedImage}
                    className="absolute top-0 right-0 p-0.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    type="button"
                  >
                    <X size={6} className="text-[#000000]" />
                  </button>
                </div>
                <div 
                  className="absolute -top-1 -left-1 px-0.5 py-0 bg-[rgba(0,0,0,0.8)] text-white rounded"
                  style={{ fontSize: "5px" }}
                >
                  Ref
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center gap-1" style={{ marginLeft: "4px" }}>
                {showRefresh && onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="hover:opacity-100 transition-all cursor-pointer z-10"
                    style={{ 
                      opacity: 0.3,
                    }}
                    title="Refresh nodes"
                  >
                    <RotateCw size={9} strokeWidth={1.5} color="#000000" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="hover:opacity-100 transition-opacity cursor-pointer z-10"
                  style={{ 
                    opacity: uploadedImage ? 1 : 0.3,
                    marginLeft: showRefresh ? "0" : "0"
                  }}
                  title="Upload reference image"
                >
                  <Camera size={9} strokeWidth={1.5} color="#000000" />
                </button>
        </div>

          <input
            type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[rgba(0,0,0,0.3)] pb-0.5 focus:outline-none transition-colors"
            style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "9px",
                  color: searchQuery ? "#000000" : "transparent",
                  padding: `3px 6px 3px ${showRefresh ? '32px' : '22px'}`,
                }}
              />
              
              {!searchQuery && (
                <div 
                  className="absolute inset-0 flex items-end pb-0.5 pointer-events-none"
                  style={{
                    opacity: isPlaceholderVisible ? 1 : 0,
                    transition: "opacity 500ms ease-in-out"
                  }}
                >
                  <span 
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "9px",
                      color: "#000000",
                      padding: `3px 6px 3px ${showRefresh ? '32px' : '22px'}`
                    }}
                  >
                    {searchPlaceholders[placeholderIndex]}
                  </span>
                </div>
              )}
            </div>

          <button
            type="submit"
              className="rounded transition-all"
            style={{
                fontFamily: "var(--font-primary)",
                fontSize: "7px",
                backgroundColor: (searchQuery || uploadedImage) ? "var(--accent)" : "transparent",
                color: "#000000",
                border: (searchQuery || uploadedImage) ? "none" : "1px solid rgba(0,0,0,0.3)",
                backdropFilter: !(searchQuery || uploadedImage) ? "blur(4px)" : "none",
                paddingLeft: "8px",
                paddingRight: "10px",
                paddingTop: "4px",
                paddingBottom: "4px",
            }}
          >
            Search
          </button>
        </form>
        </LensFrame>
      </div>
    </header>
  );
}
