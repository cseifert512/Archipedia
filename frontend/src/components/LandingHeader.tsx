import React from "react";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";

interface LandingHeaderProps {
  onBookPilot: () => void;
  showAnnouncementBar?: boolean;
}

const NAV_LINKS = [
  { label: "Live Demo", href: "/search" },
  { label: "Contact", href: "#contact" },
];

export function LandingHeader({ onBookPilot, showAnnouncementBar = false }: LandingHeaderProps) {
  const [, setLocation] = useLocation();

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      setLocation(href);
    }
  };

  return (
    <>
      {/* CSS for hover dropdown */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .menu-dropdown {
            opacity: 0;
            transform: translateY(-8px);
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .menu-container:hover .menu-dropdown {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
          }
        `
      }} />
      
      <header
        className="fixed left-0 right-0 transition-[top] duration-200"
        style={{
          zIndex: 9998,
          top: showAnnouncementBar ? "40px" : "0px",
          background: "rgba(250, 250, 250, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          className="container flex items-center justify-between"
          style={{
            maxWidth: "1200px",
            padding: "14px 24px",
          }}
        >
          {/* Logo / Wordmark */}
          <button
            onClick={() => setLocation("/")}
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: "var(--font-primary)",
              color: "var(--text-primary)",
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em" }}>
              ARCHIPEDIA
            </div>
          </button>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onBookPilot}
              className="hover:opacity-90 transition-all"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "12px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "8px",
                background: "var(--accent)",
                padding: "10px 16px",
                color: "var(--text-primary)",
              }}
            >
              Book a pilot
            </button>
          </div>

          {/* Menu with CSS Hover Dropdown */}
          <div className="menu-container relative">
            <button
              className="p-2 hover:opacity-70 transition-opacity flex items-center gap-2"
              aria-label="Open menu"
              style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "14px",
                color: "var(--text-secondary)",
              }}
            >
              <Menu size={20} />
            </button>

            {/* Dropdown Menu - paddingTop creates invisible hover bridge */}
            <div
              className="menu-dropdown"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                paddingTop: "8px", // Invisible bridge area for hover
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                  border: "1px solid var(--border-light)",
                  padding: "8px 0",
                  minWidth: "160px",
                }}
              >
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="w-full text-left hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: "var(--font-secondary)",
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "var(--text-primary)",
                      padding: "10px 16px",
                      display: "block",
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
