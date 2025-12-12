import { useState, useRef, useEffect, ReactNode } from "react";
import { Camera, X, RotateCw, RefreshCw } from "lucide-react";
import { LensFrame } from "./LensFrame";

interface AdvancedSearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (query: string, image?: string | null) => void;
  variant?: "default" | "hero" | "header" | "inline";
  showImageUpload?: boolean;
  disabled?: boolean;
  className?: string;
  // Homepage-specific features
  animatedPlaceholders?: string[];
  // Refresh button
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  refreshButtonPosition?: "before" | "after"; // "before" = before camera, "after" = after camera
  // Button customization
  buttonText?: string;
  buttonStyle?: "default" | "transparent-when-empty";
  // For results page
  hasConnections?: boolean;
}

export function AdvancedSearchBar({
  placeholder = "",
  initialValue = "",
  onSearch,
  variant = "default",
  showImageUpload = true,
  disabled = false,
  className = "",
  animatedPlaceholders = [],
  showRefreshButton = false,
  onRefresh,
  refreshButtonPosition = "after",
  buttonText,
  buttonStyle = "default",
  hasConnections = false,
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animated placeholder effect for homepage
  useEffect(() => {
    if (animatedPlaceholders.length > 0 && !query) {
      const interval = setInterval(() => {
        setIsPlaceholderVisible(false);
        setTimeout(() => {
          setPlaceholderIndex((prev) => (prev + 1) % animatedPlaceholders.length);
          setIsPlaceholderVisible(true);
        }, 400);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [animatedPlaceholders, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() || uploadedImage) {
      onSearch(query, uploadedImage);
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
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <LensFrame 
        className={`px-14 ${variant === "hero" ? "rounded-lg" : "rounded-b-lg"} ${className}`}
      >
        <div style={{
          paddingTop: "5px",
          paddingBottom: "5px",
        }}>
        {uploadedImage && (
          <div className="mb-4 flex justify-center">
            <div className="relative inline-block">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-[rgba(0,0,0,0.3)]">
                <img
                  src={uploadedImage}
                  alt="Uploaded reference"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={removeUploadedImage}
                  className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <X size={14} className="text-[#000000]" />
                </button>
              </div>
              <div 
                className="absolute -top-2 -left-2 px-2 py-0.5 bg-[rgba(0,0,0,0.8)] text-white rounded"
                style={{ fontSize: "10px" }}
              >
                Reference
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-8">
          <div className="flex-1 relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center gap-3" style={{ marginLeft: "12px" }}>
              {showImageUpload && (
                <>
                  {showRefreshButton && refreshButtonPosition === "before" && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="hover:opacity-70 transition-opacity cursor-pointer z-10"
                      style={{ 
                        opacity: 0.5,
                      }}
                      title="Refresh results"
                    >
                      {variant === "hero" ? (
                        <RotateCw size={20} strokeWidth={1.5} color="#000000" />
                      ) : (
                        <RefreshCw size={20} strokeWidth={1.5} color="#000000" />
                      )}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="hover:opacity-100 transition-opacity cursor-pointer z-10"
                    style={{ 
                      opacity: uploadedImage ? 1 : 0.3,
                    }}
                    title="Upload reference image"
                  >
                    <Camera size={20} strokeWidth={1.5} color="#000000" />
                  </button>

                  {showRefreshButton && refreshButtonPosition === "after" && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="hover:opacity-100 transition-all cursor-pointer z-10"
                      style={{ 
                        opacity: 0.5,
                      }}
                      title="Refresh"
                    >
                      {variant === "hero" ? (
                        <RotateCw size={20} strokeWidth={1.5} color="#000000" />
                      ) : (
                        <RefreshCw size={20} strokeWidth={1.5} color="#000000" />
                      )}
                    </button>
                  )}
                </>
              )}
              
              {!showImageUpload && showRefreshButton && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="hover:opacity-70 transition-opacity cursor-pointer z-10"
                  style={{ 
                    opacity: 0.5,
                  }}
                  title="Refresh"
                >
                  <RefreshCw size={20} strokeWidth={1.5} color="#000000" />
                </button>
              )}
            </div>

            {(() => {
              const buttonCount = (showImageUpload ? 1 : 0) + (showRefreshButton ? 1 : 0);
              // ResultsPage uses 74px when both buttons are present
              const leftPadding = buttonCount === 0 ? "42px" : buttonCount === 1 ? "42px" : (refreshButtonPosition === "before" ? "74px" : "80px");
              
              return (
                <>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[rgba(0,0,0,0.3)] pb-3 focus:outline-none transition-colors"
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "25px",
                      color: animatedPlaceholders.length > 0 && !query ? "transparent" : "#000000",
                      padding: `12px 18px 12px ${leftPadding}`,
                    }}
                    placeholder={animatedPlaceholders.length === 0 ? placeholder : ""}
                    disabled={disabled}
                  />
                  
                  {animatedPlaceholders.length > 0 && !query && (
                    <>
                      <div 
                        className="absolute inset-0 flex items-end pb-3 pointer-events-none"
                        style={{
                          opacity: isPlaceholderVisible ? 1 : 0,
                          transition: "opacity 500ms ease-in-out"
                        }}
                      >
                        <span 
                          style={{
                            fontFamily: "var(--font-primary)",
                            fontSize: "25px",
                            color: "#000000",
                            padding: `12px 18px 12px ${leftPadding}`
                          }}
                        >
                          {animatedPlaceholders[placeholderIndex]}
                        </span>
                      </div>
                      
                      <div
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                        style={{
                          fontSize: "13px",
                          color: "rgba(0,0,0,0.4)",
                          fontFamily: "var(--font-primary)",
                          fontWeight: 300,
                        }}
                      >
                        text + image
                      </div>
                    </>
                  )}
                  
                  {animatedPlaceholders.length === 0 && (
                    <div
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
                      style={{
                        fontSize: "13px",
                        color: "rgba(0,0,0,0.4)",
                        fontFamily: "var(--font-primary)",
                        fontWeight: 300,
                      }}
                    >
                      text + image
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <button
            type="submit"
            className="rounded-md transition-all"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "21px",
              backgroundColor: buttonStyle === "transparent-when-empty" && !query && !uploadedImage
                ? "transparent"
                : hasConnections
                ? "#10B981"
                : "var(--accent)",
              color: "#000000",
              border: buttonStyle === "transparent-when-empty" && !query && !uploadedImage
                ? "1px solid rgba(0,0,0,0.3)"
                : "none",
              backdropFilter: buttonStyle === "transparent-when-empty" && !query && !uploadedImage
                ? "blur(4px)"
                : "none",
              paddingLeft: "32px",
              paddingRight: "32px",
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
            disabled={disabled}
          >
            {buttonText || (hasConnections ? "Remix" : "Search")}
          </button>
        </form>
        </div>
      </LensFrame>
    </>
  );
}

