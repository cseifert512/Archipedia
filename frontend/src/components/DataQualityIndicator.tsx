// src/components/DataQualityIndicator.tsx
// This component is used for the Circular Dial on the Project Detail Page
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

interface DataQualityIndicatorProps {
  type: "verified" | "sourced" | "estimated" | "missing";
  source?: string;
}

export function DataQualityIndicator({ type, source }: DataQualityIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const config = {
    verified: {
      icon: CheckCircle,
      color: "#10B981",
      label: "Verified",
    },
    sourced: {
      icon: Info,
      color: "#3B82F6",
      label: "Sourced",
    },
    estimated: {
      icon: AlertTriangle,
      color: "#F59E0B",
      label: "Estimated",
    },
    missing: {
      icon: AlertTriangle,
      color: "#EF4444",
      label: "Missing",
    },
  };

  // Fallback for unknown types
  const configEntry = config[type] || config.missing;
  const { icon: Icon, color, label } = configEntry;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon size={14} style={{ color }} />
      
      {isHovered && source && (
        <div
          className="absolute z-50 rounded-lg shadow-lg"
          style={{
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "200px",
            maxWidth: "300px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.1)",
            padding: "12px 16px",
            whiteSpace: "nowrap"
          }}
        >
          <div style={{
            fontFamily: "var(--font-primary)",
            fontSize: "13px",
            color: "#000000",
            fontWeight: 500,
            marginBottom: "4px"
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: "var(--font-primary)",
            fontSize: "12px",
            color: "rgba(0,0,0,0.6)",
            whiteSpace: "normal"
          }}>
            {source}
          </div>
          {/* Triangle pointer */}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(255, 255, 255, 0.9)",
            }}
          />
        </div>
      )}
    </div>
  );
}