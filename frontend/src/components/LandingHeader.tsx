import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface LandingHeaderProps {
  onBookPilot: () => void;
  showAnnouncementBar?: boolean;
}

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Demo", href: "#demo" },
  { label: "Live Demo", href: "/canvas" },
  { label: "Enterprise", href: "#enterprise" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
];

export function LandingHeader({ onBookPilot, showAnnouncementBar = false }: LandingHeaderProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="hover:text-[var(--accent)] transition-colors"
              style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--text-secondary)",
                textTransform: "none",
                letterSpacing: "0",
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

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

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-[300px] bg-white">
              <div className="flex flex-col h-full pt-8">
                <nav className="flex flex-col gap-6">
                  {NAV_LINKS.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => handleNavClick(link.href)}
                      className="text-left hover:text-[var(--accent)] transition-colors"
                      style={{
                        fontFamily: "var(--font-primary)",
                        fontSize: "18px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-auto pb-8 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLocation("/demo");
                    }}
                    className="w-full hover:opacity-90 transition-all"
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "14px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderRadius: "8px",
                      border: "1px solid var(--border-light)",
                      background: "transparent",
                      padding: "14px 16px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Try the demo
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBookPilot();
                    }}
                    className="w-full hover:opacity-90 transition-all"
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "14px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderRadius: "8px",
                      background: "var(--accent)",
                      padding: "14px 16px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Book a pilot
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

