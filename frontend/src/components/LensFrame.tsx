import { ReactNode } from "react";

interface LensFrameProps {
  children?: ReactNode;
  className?: string;
  blurBackground?: boolean;
  style?: React.CSSProperties;
}

export function LensFrame({ children, className = "", blurBackground = true, style }: LensFrameProps) {
  return (
    <div className={`relative ${className}`} style={style}>
      {/* Glass morphism background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "inherit",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          backdropFilter: blurBackground ? "blur(12px)" : "none",
          WebkitBackdropFilter: blurBackground ? "blur(12px)" : "none",
          background: "rgba(255, 255, 255, 0.35)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      
      {/* Content layer - remains sharp and legible */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}