import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "announcement-dismissed";

interface AnnouncementBarProps {
  onBookPilot: () => void;
  onDismiss?: () => void;
}

export function AnnouncementBar({ onBookPilot, onDismiss }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === "true");
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 w-full"
      style={{
        zIndex: 9999,
        background: "var(--text-primary)",
        color: "var(--bg-primary)",
        padding: "10px 0",
      }}
    >
      <div
        className="container flex items-center justify-between"
        style={{ maxWidth: "1200px" }}
      >
        <div className="flex-1" />
        
        <div
          className="flex items-center gap-4"
          style={{
            fontFamily: "var(--font-secondary)",
            fontSize: "14px",
          }}
        >
          <span>Now piloting with design teams — private archive search available.</span>
          <button
            onClick={onBookPilot}
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            Book a pilot →
          </button>
        </div>

        <div className="flex-1 flex justify-end">
          <button
            onClick={handleDismiss}
            className="hover:opacity-70 transition-opacity p-1"
            aria-label="Dismiss announcement"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

