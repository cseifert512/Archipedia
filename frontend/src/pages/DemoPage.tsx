import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePageMeta } from "../lib/seo";
import { trackLandingEvent } from "../lib/analytics";

// Placeholder - replace with actual Loom video ID
const LOOM_VIDEO_ID = ""; // TODO: Replace with actual Loom video ID
const CALENDLY_URL = "https://calendly.com/archipedia/pilot"; // TODO: Replace

export function DemoPage() {
  const [, setLocation] = useLocation();
  const [loomLoaded, setLoomLoaded] = useState(false);

  usePageMeta({
    title: "Demo — Archipedia",
    description: "See Archipedia in action. Search your architectural archive by image or text.",
  });

  useEffect(() => {
    trackLandingEvent("demo_page_view", {});
  }, []);

  const handleTryLiveDemo = () => {
    trackLandingEvent("try_live_demo_click", {});
    setLocation("/canvas");
  };

  const handleBookPilot = () => {
    trackLandingEvent("book_pilot_click", { location: "demo_page" });
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0"
        style={{
          zIndex: 9998,
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
            padding: "18px 32px",
          }}
        >
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{
              fontFamily: "var(--font-secondary)",
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={() => setLocation("/")}
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "20px",
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            ARCHIPEDIA
          </button>

          <button
            onClick={handleBookPilot}
            className="hover:opacity-90 transition-all"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              borderRadius: "8px",
              background: "var(--accent)",
              padding: "12px 20px",
              color: "var(--text-primary)",
            }}
          >
            Book a pilot
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1"
        style={{ paddingTop: "140px", paddingBottom: "120px" }}
      >
        <div className="container" style={{ maxWidth: "960px", padding: "0 32px" }}>
          {/* Hero Text */}
          <div className="text-center" style={{ marginBottom: "56px" }}>
            <h1
              className="heading-l"
              style={{ fontSize: "42px", marginBottom: "20px", lineHeight: 1.2 }}
            >
              See Archipedia in action
            </h1>
            <p
              className="body-l"
              style={{ 
                color: "var(--text-secondary)", 
                maxWidth: "52ch", 
                margin: "0 auto",
                fontSize: "18px",
                lineHeight: 1.6,
              }}
            >
              Watch a 90-second walkthrough of image and text search, filters, and boards.
            </p>
          </div>

          {/* Video Container */}
          <div
            className="glass rounded-2xl overflow-hidden"
            style={{
              aspectRatio: "16/9",
              border: "1px solid var(--border-light)",
              marginBottom: "48px",
            }}
          >
            {loomLoaded && LOOM_VIDEO_ID ? (
              <iframe
                src={`https://www.loom.com/embed/${LOOM_VIDEO_ID}?autoplay=1`}
                frameBorder="0"
                allowFullScreen
                allow="autoplay"
                style={{ width: "100%", height: "100%" }}
                title="Archipedia Demo"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "rgba(0,0,0,0.03)" }}
                onClick={() => {
                  setLoomLoaded(true);
                  trackLandingEvent("demo_video_play", {});
                }}
              >
                <div className="text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: "var(--accent)", marginBottom: "24px" }}
                  >
                    <ArrowRight size={40} />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "18px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "12px",
                    }}
                  >
                    {LOOM_VIDEO_ID ? "Click to play" : "Video coming soon"}
                  </div>
                  <div 
                    className="body-m" 
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {LOOM_VIDEO_ID 
                      ? "90-second walkthrough" 
                      : "[Loom Video Placeholder - Add LOOM_VIDEO_ID]"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div 
            className="flex flex-wrap items-center justify-center"
            style={{ marginBottom: "64px", gap: "24px" }}
          >
            <button
              onClick={handleTryLiveDemo}
              className="hover:opacity-90 transition-all"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "15px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "12px",
                background: "var(--accent)",
                padding: "18px 32px",
                color: "var(--text-primary)",
              }}
            >
              Try the live demo
            </button>
            <button
              onClick={handleBookPilot}
              className="hover:opacity-90 transition-all"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "15px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                background: "transparent",
                padding: "18px 32px",
                color: "var(--text-primary)",
              }}
            >
              Book an enterprise pilot
            </button>
          </div>

          {/* Features Preview */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Image search",
                desc: "Upload any image to find visual neighbors in your archive.",
              },
              {
                title: "Text search",
                desc: "Describe what you're looking for in natural language.",
              },
              {
                title: "Filters & Boards",
                desc: "Narrow by metadata, save results to shareable collections.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-xl text-center"
                style={{ 
                  border: "1px solid var(--border-light)",
                  padding: "32px 24px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "16px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    marginBottom: "12px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="body-m"
                  style={{ lineHeight: 1.6 }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "32px 0",
        }}
      >
        <div
          className="container flex items-center justify-between"
          style={{ maxWidth: "1200px", padding: "0 32px" }}
        >
          <button
            onClick={() => setLocation("/")}
            className="hover:opacity-70 transition-opacity"
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "18px",
              color: "var(--text-primary)",
            }}
          >
            ARCHIPEDIA
          </button>
          <p
            style={{
              fontFamily: "var(--font-secondary)",
              fontSize: "13px",
              color: "var(--text-tertiary)",
            }}
          >
            © {new Date().getFullYear()} Spolia Labs
          </p>
        </div>
      </footer>
    </div>
  );
}
