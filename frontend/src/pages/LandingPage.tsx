import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Image, Search, Filter, LayoutGrid, Folder, Shield } from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { LandingHeader } from "../components/LandingHeader";
import { usePageMeta } from "../lib/seo";
import { trackLandingEvent } from "../lib/analytics";

// Placeholder constants - replace with real values
const CALENDLY_URL = "https://calendly.com/archipedia/pilot"; // TODO: Replace
// Video configuration - supports Google Drive or Loom
const VIDEO_CONFIG = {
  type: "gdrive" as "gdrive" | "loom",
  gdriveId: "1Jq-DgxztZ5Yg3vQ18_c7g-rhhrxI-GsQ",
  loomId: "",
};
const FORMSPREE_ID = "xwveeqoq";

export function LandingPage() {
  const [, setLocation] = useLocation();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [loomLoaded, setLoomLoaded] = useState(false);
  const loomRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formState, setFormState] = useState({
    name: "",
    firm: "",
    email: "",
    archiveSize: "<5k images",
    notes: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  usePageMeta({
    title: "Archipedia — Search your firm's archive like Google",
    description: "Image + text precedent search for architectural archives. Private enterprise pilots available.",
  });

  // Check announcement dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem("announcement-dismissed") === "true";
    setShowAnnouncement(!dismissed);
  }, []);

  // Lazy load Loom when in viewport
  useEffect(() => {
    if (!loomRef.current || loomLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoomLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loomRef.current);
    return () => observer.disconnect();
  }, [loomLoaded]);

  const scrollToContact = () => {
    trackLandingEvent("book_pilot_click", { location: "header" });
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTryDemo = () => {
    trackLandingEvent("try_demo_click", { location: "hero" });
    setLocation("/demo");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    trackLandingEvent("contact_form_submit", {});

    try {
      if (!FORMSPREE_ID) {
        // Fallback: open mailto if Formspree not configured
        const subject = encodeURIComponent("Archipedia pilot inquiry");
        const body = encodeURIComponent(
          `Name: ${formState.name}\nFirm: ${formState.firm}\nEmail: ${formState.email}\nArchive Size: ${formState.archiveSize}\n\nNotes:\n${formState.notes}`
        );
        window.location.href = `mailto:hello@archipedia.ai?subject=${subject}&body=${body}`;
        setFormSubmitting(false);
        return;
      }

      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          firm: formState.firm,
          email: formState.email,
          archiveSize: formState.archiveSize,
          notes: formState.notes,
          _subject: `Archipedia inquiry from ${formState.firm || formState.name || "website"}`,
        }),
      });

      if (response.ok) {
        setFormSubmitted(true);
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      // Fallback to mailto on error
      const subject = encodeURIComponent("Archipedia pilot inquiry");
      const body = encodeURIComponent(
        `Name: ${formState.name}\nFirm: ${formState.firm}\nEmail: ${formState.email}\nArchive Size: ${formState.archiveSize}\n\nNotes:\n${formState.notes}`
      );
      window.location.href = `mailto:hello@archipedia.ai?subject=${subject}&body=${body}`;
    } finally {
      setFormSubmitting(false);
    }
  };

  const headerOffset = showAnnouncement ? 104 : 64;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* A. Announcement Bar */}
      {showAnnouncement && (
        <AnnouncementBar 
          onBookPilot={scrollToContact} 
          onDismiss={() => setShowAnnouncement(false)}
        />
      )}

      {/* B. Sticky Header */}
      <LandingHeader onBookPilot={scrollToContact} showAnnouncementBar={showAnnouncement} />

      <main style={{ paddingTop: `${headerOffset}px` }}>
        {/* C. Hero Section */}
        <section
          id="product"
          className="container"
          style={{ maxWidth: "1200px", paddingTop: "64px", paddingBottom: "80px" }}
        >
          <div className="max-w-2xl">
            {/* Left: Copy */}
            <div>
              <h1
                className="heading-l"
                style={{ fontSize: "42px", lineHeight: 1.15, maxWidth: "18ch" }}
              >
                Search architecture like Google — on your firm's own archive.
              </h1>

              <p
                className="body-l"
                style={{ marginTop: "20px", maxWidth: "48ch", color: "var(--text-secondary)" }}
              >
                Find the right precedents in seconds using image or text, then organize results
                into boards you can actually use in concept design.
              </p>

              <ul
                className="body-m"
                style={{
                  marginTop: "24px",
                  display: "grid",
                  gap: "12px",
                  color: "var(--text-primary)",
                }}
              >
                <li>• Stop re-searching old projects buried in folders</li>
                <li>• Ramp new team members faster with searchable institutional memory</li>
                <li>• Stay consistent under deadline with evidence-backed references</li>
              </ul>

              <div className="flex flex-wrap items-center gap-4" style={{ marginTop: "32px" }}>
                <button
                  onClick={handleTryDemo}
                  className="hover:opacity-90 transition-all"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "10px",
                    background: "var(--accent)",
                    padding: "14px 24px",
                    color: "var(--text-primary)",
                  }}
                >
                  Try the demo
                </button>
                <button
                  onClick={scrollToContact}
                  className="hover:opacity-90 transition-all"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "10px",
                    border: "1px solid var(--border-light)",
                    background: "transparent",
                    padding: "14px 24px",
                    color: "var(--text-primary)",
                  }}
                >
                  Book an enterprise pilot
                </button>
              </div>

              <p
                className="body-s"
                style={{ marginTop: "16px", color: "var(--text-tertiary)" }}
              >
                Private by default. Your data stays yours.
              </p>
            </div>
          </div>
        </section>

        {/* D. Social Proof / Credibility Strip */}
        <section style={{ background: "rgba(0,0,0,0.03)", padding: "24px 0" }}>
          <div
            className="container flex flex-wrap items-center justify-center gap-8"
            style={{ maxWidth: "1200px" }}
          >
            <span className="body-s" style={{ color: "var(--text-tertiary)" }}>
              Built by an architecture + ML team at UT Austin and Georgia Tech
            </span>
            <span style={{ color: "var(--border-light)" }}>•</span>
            <span className="body-s" style={{ color: "var(--text-tertiary)" }}>
              Designed for firm archives
            </span>
            <span style={{ color: "var(--border-light)" }}>•</span>
            <span className="body-s" style={{ color: "var(--text-tertiary)" }}>
              Pilot-ready deployment
            </span>
          </div>
        </section>

        {/* E. 90-Second Demo Section */}
        <section
          id="demo"
          className="container"
          style={{ maxWidth: "1200px", paddingTop: "80px", paddingBottom: "80px" }}
        >
          <h2 className="heading-m" style={{ marginBottom: "40px" }}>
            See it in 90 seconds
          </h2>

          <div className="grid gap-12 lg:grid-cols-2 items-start">
            {/* Left: Video Embed */}
            <div
              ref={loomRef}
              className="glass rounded-xl overflow-hidden"
              style={{
                aspectRatio: "16/9",
                border: "1px solid var(--border-light)",
              }}
            >
              {loomLoaded && (VIDEO_CONFIG.gdriveId || VIDEO_CONFIG.loomId) ? (
                VIDEO_CONFIG.type === "gdrive" && VIDEO_CONFIG.gdriveId ? (
                  <iframe
                    src={`https://drive.google.com/file/d/${VIDEO_CONFIG.gdriveId}/preview`}
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay"
                    style={{ width: "100%", height: "100%" }}
                    title="Archipedia Demo"
                  />
                ) : (
                  <iframe
                    src={`https://www.loom.com/embed/${VIDEO_CONFIG.loomId}`}
                    frameBorder="0"
                    allowFullScreen
                    style={{ width: "100%", height: "100%" }}
                    title="Archipedia Demo"
                  />
                )
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.05)" }}
                  onClick={() => setLoomLoaded(true)}
                >
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: "var(--accent)" }}
                    >
                      <ArrowRight size={24} />
                    </div>
                    <div className="body-s" style={{ color: "var(--text-tertiary)" }}>
                      Click to load video
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: What you'll notice */}
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: "18px",
                  fontWeight: 500,
                  marginBottom: "24px",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                What you'll notice
              </h3>
              <ul className="body-m" style={{ display: "grid", gap: "16px" }}>
                <li>
                  <strong>Search by image</strong> (upload or URL) to find visual neighbors
                </li>
                <li>
                  <strong>Narrow results</strong> with typology / region / tags
                </li>
                <li>
                  <strong>Open project cards</strong> and save to boards for a concept narrative
                </li>
              </ul>

              <button
                onClick={handleTryDemo}
                className="hover:opacity-90 transition-all"
                style={{
                  marginTop: "32px",
                  fontFamily: "var(--font-primary)",
                  fontSize: "14px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderRadius: "10px",
                  background: "var(--accent)",
                  padding: "14px 24px",
                  color: "var(--text-primary)",
                }}
              >
                Try the demo →
              </button>
            </div>
          </div>
        </section>

        {/* F. How It Works */}
        <section
          style={{
            background: "rgba(0,0,0,0.02)",
            paddingTop: "80px",
            paddingBottom: "80px",
          }}
        >
          <div className="container" style={{ maxWidth: "1200px" }}>
            <h2 className="heading-m" style={{ marginBottom: "40px" }}>
              How it works
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Ingest",
                  desc: "Point Archipedia at a folder of images + a metadata CSV.",
                },
                {
                  step: "2",
                  title: "Search",
                  desc: "Query by image or text, then refine with filters.",
                },
                {
                  step: "3",
                  title: "Curate",
                  desc: "Turn results into boards you can share with your team.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="glass glass-hover rounded-xl"
                  style={{ border: "1px solid var(--border-light)", padding: "32px" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{
                      background: "var(--accent)",
                      fontFamily: "var(--font-primary)",
                      fontSize: "20px",
                      fontWeight: 600,
                    }}
                  >
                    {item.step}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "22px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="body-l" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* G. Feature Grid */}
        <section
          className="container"
          style={{ maxWidth: "1200px", paddingTop: "80px", paddingBottom: "80px" }}
        >
          <h2 className="heading-m" style={{ marginBottom: "40px" }}>
            Features
          </h2>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-3" style={{ rowGap: "32px" }}>
            {[
              {
                icon: Image,
                title: "Image search",
                desc: "Drop an image, find near matches instantly.",
              },
              {
                icon: Search,
                title: "Text search",
                desc: "Describe what you want; discover relevant precedents.",
              },
              {
                icon: Filter,
                title: "Metadata filters",
                desc: "Typology, region, year, materials, tags.",
              },
              {
                icon: LayoutGrid,
                title: "Project cards",
                desc: "Structured views: key images, notes, attributes.",
              },
              {
                icon: Folder,
                title: "Boards",
                desc: "Collect results into concept sets and share.",
              },
              {
                icon: Shield,
                title: "Enterprise-ready",
                desc: "Private deployment with clear data boundaries.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass glass-hover rounded-xl"
                style={{ border: "1px solid var(--border-light)", padding: "32px" }}
              >
                <feature.icon
                  size={28}
                  style={{ marginBottom: "16px", color: "var(--text-primary)" }}
                />
                <h3
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "18px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  {feature.title}
                </h3>
                <p className="body-m">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* H. Use Cases */}
        <section
          style={{
            background: "rgba(0,0,0,0.02)",
            paddingTop: "80px",
            paddingBottom: "80px",
          }}
        >
          <div className="container" style={{ maxWidth: "1200px" }}>
            <h2 className="heading-m" style={{ marginBottom: "40px" }}>
              Who it's for
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Design teams",
                  desc: "Find precedents faster; stop reinventing the wheel.",
                },
                {
                  title: "R&D / Design Tech",
                  desc: "Make firm knowledge queryable; prototype new workflows.",
                },
                {
                  title: "Fabrication-forward teams",
                  desc: "Bridge precedent → constraints → buildable options.",
                },
              ].map((useCase) => (
                <div
                  key={useCase.title}
                  className="glass rounded-xl"
                  style={{ border: "1px solid var(--border-light)", padding: "32px" }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "20px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}
                  >
                    {useCase.title}
                  </h3>
                  <p className="body-l" style={{ color: "var(--text-secondary)" }}>{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* I. Enterprise Section */}
        <section
          id="enterprise"
          className="container"
          style={{ maxWidth: "1200px", paddingTop: "80px", paddingBottom: "80px" }}
        >
          <h2 className="heading-m" style={{ marginBottom: "12px" }}>
            Deploy privately on your archive
          </h2>
          <p className="body-l" style={{ marginBottom: "40px", color: "var(--text-secondary)" }}>
            Single-tenant pilots available.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Private index",
                desc: "Your content is not used to train public models.",
              },
              {
                title: "Simple intake",
                desc: "Images + metadata CSV (we help you map it).",
              },
              {
                title: "Fast pilot",
                desc: "Start with one office / one typology / one archive slice.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass rounded-xl"
                style={{ border: "1px solid var(--border-light)", padding: "32px" }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "18px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  {item.title}
                </h3>
                <p className="body-m">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Enterprise CTA Card */}
          <div
            className="glass rounded-xl"
            style={{ border: "1px solid var(--border-light)", padding: "40px", marginTop: "32px" }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "24px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Ready to pilot?
                </h3>
                <p className="body-l" style={{ color: "var(--text-secondary)" }}>
                  Let's talk about your archive and deployment needs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={scrollToContact}
                  className="hover:opacity-90 transition-all"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderRadius: "10px",
                    background: "var(--accent)",
                    padding: "16px 28px",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Book an enterprise pilot
                </button>
                <button
                  onClick={() => document.querySelector("#security")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:opacity-90 transition-colors hover:text-[var(--accent)]"
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Read security notes →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* J. Security / Data */}
        <section
          id="security"
          style={{
            background: "rgba(0,0,0,0.02)",
            paddingTop: "80px",
            paddingBottom: "80px",
          }}
        >
          <div className="container" style={{ maxWidth: "1200px" }}>
            <h2 className="heading-m" style={{ marginBottom: "40px" }}>
              Data & Privacy
            </h2>

            <div
              className="glass rounded-xl"
              style={{ border: "1px solid var(--border-light)", padding: "40px" }}
            >
              <ul className="body-l" style={{ display: "grid", gap: "20px", color: "var(--text-secondary)" }}>
                <li>• Uploaded files are used only to run your search request.</li>
                <li>• Enterprise archives are indexed in a private environment.</li>
                <li>• Access controls are enforced at the application layer.</li>
                <li>• Retention: configurable during pilots.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* K. About */}
        <section
          className="container"
          style={{ maxWidth: "1200px", paddingTop: "80px", paddingBottom: "80px" }}
        >
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Photo/Avatar (optional) */}
            <div
              className="glass rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                border: "1px solid var(--border-light)",
                minHeight: "300px",
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <div className="text-center p-8">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                  style={{ background: "var(--border-light)" }}
                />
                <div className="body-s" style={{ color: "var(--text-tertiary)" }}>
                  [Team Photo Placeholder]
                </div>
              </div>
            </div>

            {/* Right: Bio */}
            <div>
              <h2 className="heading-m" style={{ marginBottom: "24px" }}>
                Why we're building this
              </h2>
              <p className="body-l" style={{ marginBottom: "16px" }}>
                Architecture has incredible institutional knowledge—locked in folders and PDFs.
                We're turning that into something searchable, evidence-based, and eventually
                verifiable against constraints.
              </p>
              <p className="body-m" style={{ color: "var(--text-secondary)" }}>
                We believe the best design decisions are informed by what's worked before. Our
                tools help teams find those precedents in seconds, not hours.
              </p>
            </div>
          </div>
        </section>

        {/* L. Contact */}
        <section
          id="contact"
          style={{
            background: "var(--text-primary)",
            color: "var(--bg-primary)",
            paddingTop: "80px",
            paddingBottom: "80px",
          }}
        >
          <div className="container" style={{ maxWidth: "1200px" }}>
            <h2
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "32px",
                fontWeight: 500,
                textTransform: "uppercase",
                marginBottom: "40px",
                color: "var(--bg-primary)",
              }}
            >
              Talk to us
            </h2>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left: Buttons + Form */}
              <div>
                <div className="flex flex-wrap gap-4 mb-8">
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackLandingEvent("calendly_click", {})}
                    className="hover:opacity-90 transition-all inline-block"
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "14px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderRadius: "10px",
                      background: "var(--accent)",
                      padding: "14px 24px",
                      color: "var(--text-primary)",
                    }}
                  >
                    Book a pilot
                  </a>
                  <a
                    href="mailto:hello@archipedia.ai?subject=Archipedia%20pilot"
                    className="hover:opacity-90 transition-all inline-block"
                    style={{
                      fontFamily: "var(--font-primary)",
                      fontSize: "14px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.3)",
                      background: "transparent",
                      padding: "14px 24px",
                      color: "var(--bg-primary)",
                    }}
                  >
                    Email
                  </a>
                </div>

                {formSubmitted ? (
                  <div
                    className="rounded-xl p-6"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    <p style={{ fontFamily: "var(--font-secondary)", fontSize: "16px" }}>
                      Got it — we'll reply within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            opacity: 0.7,
                          }}
                        >
                          Name
                        </label>
                        <Input
                          id="name"
                          value={formState.name}
                          onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                          placeholder="Your name"
                          className="mt-2"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "var(--bg-primary)",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="firm"
                          style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            opacity: 0.7,
                          }}
                        >
                          Firm
                        </label>
                        <Input
                          id="firm"
                          value={formState.firm}
                          onChange={(e) => setFormState((s) => ({ ...s, firm: e.target.value }))}
                          placeholder="Your firm"
                          className="mt-2"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "var(--bg-primary)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mt-4">
                      <div>
                        <label
                          htmlFor="email"
                          style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            opacity: 0.7,
                          }}
                        >
                          Email *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                          placeholder="you@firm.com"
                          className="mt-2"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "var(--bg-primary)",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="archiveSize"
                          style={{
                            fontFamily: "var(--font-secondary)",
                            fontSize: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            opacity: 0.7,
                          }}
                        >
                          Archive size
                        </label>
                        <select
                          id="archiveSize"
                          value={formState.archiveSize}
                          onChange={(e) =>
                            setFormState((s) => ({ ...s, archiveSize: e.target.value }))
                          }
                          className="mt-2 w-full rounded-md px-3 py-2 outline-none"
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "var(--bg-primary)",
                            fontSize: "14px",
                          }}
                        >
                          <option value="<5k images" style={{ color: "var(--text-primary)", background: "white" }}>&lt;5k images</option>
                          <option value="5-50k" style={{ color: "var(--text-primary)", background: "white" }}>5–50k</option>
                          <option value="50k+" style={{ color: "var(--text-primary)", background: "white" }}>50k+</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="notes"
                        style={{
                          fontFamily: "var(--font-secondary)",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          opacity: 0.7,
                        }}
                      >
                        Notes
                      </label>
                      <Textarea
                        id="notes"
                        value={formState.notes}
                        onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
                        placeholder="What are you looking to index?"
                        className="mt-2"
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "var(--bg-primary)",
                          minHeight: "100px",
                        }}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={formSubmitting}
                      style={{
                        marginTop: "24px",
                        fontFamily: "var(--font-primary)",
                        fontSize: "14px",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        borderRadius: "10px",
                        background: "var(--accent)",
                        padding: "14px 24px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {formSubmitting ? "Sending..." : "Send"}
                    </Button>
                  </form>
                )}
              </div>

              {/* Right: Additional info */}
              <div style={{ paddingLeft: "16px" }}>
                <p
                  className="body-l"
                  style={{ color: "rgba(255,255,255,0.8)", marginBottom: "24px" }}
                >
                  Whether you're a small studio or a large firm, we'd love to hear about your
                  archive and how we can help make it searchable.
                </p>
                <p
                  className="body-m"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Response time: usually within 24 hours on business days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            background: "var(--text-primary)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "32px 0",
          }}
        >
          <div className="container" style={{ maxWidth: "1200px" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href="/demo"
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Demo
                </a>
                <a
                  href="/enterprise"
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Enterprise
                </a>
                <button
                  onClick={() => document.querySelector("#security")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Security
                </button>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-secondary)",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                © {new Date().getFullYear()} Pear.Design. Built in Austin.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

